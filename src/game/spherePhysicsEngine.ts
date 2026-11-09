import * as THREE from 'three';
import { SolidCollider } from '../types';
import { ParticleVFXSystem } from './fortniteParticleVFX';
import { fortniteAudio } from '../utils/audio';

export interface SphereEntity {
  id: string;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  radius: number;
  mass: number;
  restitution: number; // elasticity 0..1 (bounciness)
  friction: number; // surface friction 0..1
  isGrounded: boolean;
  isPlayer?: boolean;
  name?: string;
}

export class SpherePhysicsEngine {
  private vfx: ParticleVFXSystem;
  private lastCollisionSounds: Map<string, number> = new Map();

  constructor(vfx: ParticleVFXSystem) {
    this.vfx = vfx;
  }

  /**
   * Resolve sphere-on-sphere realistic momentum and elastic/inelastic impulse response
   */
  public resolveSpherePair(
    s1: SphereEntity,
    s2: SphereEntity,
    onCollision?: (pos: THREE.Vector3, normal: THREE.Vector3, impulse: number) => void
  ): boolean {
    const delta = new THREE.Vector3().subVectors(s2.pos, s1.pos);
    const distSq = delta.lengthSq();
    const minDist = s1.radius + s2.radius;

    if (distSq >= minDist * minDist || distSq < 0.000001) {
      return false;
    }

    const dist = Math.sqrt(distSq);
    const normal = delta.clone().divideScalar(dist); // points from s1 to s2

    // Positional penetration correction (Mass-weighted)
    const penetration = minDist - dist;
    const totalMass = s1.mass + s2.mass;
    const s1Ratio = s2.mass / totalMass;
    const s2Ratio = s1.mass / totalMass;

    s1.pos.sub(normal.clone().multiplyScalar(penetration * s1Ratio));
    s2.pos.add(normal.clone().multiplyScalar(penetration * s2Ratio));

    // Relative velocity along collision normal
    const relativeVel = new THREE.Vector3().subVectors(s1.vel, s2.vel);
    const velAlongNormal = relativeVel.dot(normal);

    // Only bounce if spheres are moving towards each other
    if (velAlongNormal > 0) {
      const e = Math.min(s1.restitution, s2.restitution); // Coefficient of restitution
      // Impulse scalar J = -(1 + e) * (v_rel . n) / (1/m1 + 1/m2)
      const impulseMag = ((1 + e) * velAlongNormal) / (1 / s1.mass + 1 / s2.mass);
      const impulseVec = normal.clone().multiplyScalar(impulseMag);

      s1.vel.sub(impulseVec.clone().divideScalar(s1.mass));
      s2.vel.add(impulseVec.clone().divideScalar(s2.mass));

      // Contact point midway along surface
      const contactPoint = s1.pos.clone().add(normal.clone().multiplyScalar(s1.radius));

      // Spawn reactive shockwave, sparks, and energy burst
      this.vfx.createCollisionImpact(contactPoint, normal, impulseMag * 0.8, 'sphere');

      // Play audio throttle to avoid audio clipping
      const soundKey = `${s1.id}_${s2.id}`;
      const now = performance.now();
      if (!this.lastCollisionSounds.has(soundKey) || now - this.lastCollisionSounds.get(soundKey)! > 120) {
        this.lastCollisionSounds.set(soundKey, now);
        fortniteAudio.playBuildResetShockwave();
      }

      onCollision?.(contactPoint, normal, impulseMag);
      return true;
    }

    return false;
  }

  /**
   * Resolve sphere vs static environmental colliders (AABB boxes, cylinders, and terrain slopes)
   */
  public resolveEnvironment(
    s: SphereEntity,
    colliders: SolidCollider[],
    groundElevation: number,
    dt: number
  ): void {
    const contactNormal = new THREE.Vector3();
    let hasContact = false;
    let maxImpactForce = 0;

    // 1. Terrain / Floor Collision
    if (s.pos.y <= groundElevation + s.radius) {
      const depth = groundElevation + s.radius - s.pos.y;
      s.pos.y = groundElevation + s.radius;
      if (s.vel.y < -1.5) {
        maxImpactForce = Math.abs(s.vel.y);
        s.vel.y = -s.vel.y * s.restitution;
        contactNormal.set(0, 1, 0);
        hasContact = true;
      } else {
        s.vel.y = 0;
      }
      s.isGrounded = true;
      // Floor rolling resistance
      s.vel.x *= Math.pow(1.0 - s.friction * 0.15, dt * 60);
      s.vel.z *= Math.pow(1.0 - s.friction * 0.15, dt * 60);
    } else {
      s.isGrounded = false;
    }

    // 2. Solid Colliders (Boxes & Cylinders)
    for (let i = 0; i < colliders.length; i++) {
      const col = colliders[i];

      if (col.type === 'box') {
        if (
          col.minX === undefined ||
          col.maxX === undefined ||
          col.minZ === undefined ||
          col.maxZ === undefined
        ) continue;

        const minY = col.minY ?? 0;
        const maxY = col.maxY ?? 100;

        // Vertical overlap check
        if (s.pos.y + s.radius < minY || s.pos.y - s.radius > maxY) continue;

        const closestX = Math.max(col.minX, Math.min(s.pos.x, col.maxX));
        const closestY = Math.max(minY, Math.min(s.pos.y, maxY));
        const closestZ = Math.max(col.minZ, Math.min(s.pos.z, col.maxZ));

        const dx = s.pos.x - closestX;
        const dy = s.pos.y - closestY;
        const dz = s.pos.z - closestZ;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < s.radius * s.radius && distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          const norm = new THREE.Vector3(dx / dist, dy / dist, dz / dist);
          const overlap = s.radius - dist;

          // Push out of wall
          s.pos.add(norm.clone().multiplyScalar(overlap));

          // Elastic bounce along surface normal
          const velDot = s.vel.dot(norm);
          if (velDot < 0) {
            const impactForce = Math.abs(velDot);
            s.vel.sub(norm.clone().multiplyScalar((1 + s.restitution) * velDot));

            // Surface friction against tangent
            const tangent = s.vel.clone().sub(norm.clone().multiplyScalar(s.vel.dot(norm)));
            s.vel.sub(tangent.multiplyScalar(s.friction * 0.2));

            if (impactForce > 2.0) {
              const contactPos = new THREE.Vector3(closestX, closestY, closestZ);
              this.vfx.createCollisionImpact(contactPos, norm, impactForce * 1.5, 'metal');
              fortniteAudio.playFootstep('metal');
            }
          }
        }
      } else if (col.type === 'cylinder') {
        if (col.x === undefined || col.z === undefined || col.radius === undefined) continue;

        const minY = col.minY ?? 0;
        const maxY = col.maxY ?? 100;
        if (s.pos.y + s.radius < minY || s.pos.y - s.radius > maxY) continue;

        const dx = s.pos.x - col.x;
        const dz = s.pos.z - col.z;
        const dist = Math.hypot(dx, dz);
        const minDist = col.radius + s.radius;

        if (dist < minDist && dist > 0.0001) {
          const norm = new THREE.Vector3(dx / dist, 0, dz / dist);
          const push = minDist - dist;
          s.pos.add(norm.clone().multiplyScalar(push));

          const velDot = s.vel.dot(norm);
          if (velDot < 0) {
            const impactForce = Math.abs(velDot);
            s.vel.sub(norm.clone().multiplyScalar((1 + s.restitution) * velDot));

            if (impactForce > 2.0) {
              const contactPos = new THREE.Vector3(col.x + norm.x * col.radius, s.pos.y, col.z + norm.z * col.radius);
              this.vfx.createCollisionImpact(contactPos, norm, impactForce * 1.5, 'stone');
            }
          }
        }
      }
    }

    if (hasContact && maxImpactForce > 5.0) {
      this.vfx.createCollisionImpact(
        new THREE.Vector3(s.pos.x, s.pos.y - s.radius, s.pos.z),
        contactNormal,
        maxImpactForce,
        'metal'
      );
    }
  }
}
