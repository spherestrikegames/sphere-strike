import * as THREE from 'three';

export interface VisualParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  rotVel?: THREE.Vector3;
  colorStart: THREE.Color;
  colorEnd: THREE.Color;
  scaleStart: number;
  scaleEnd: number;
  drag: number;
  gravity: number;
}

export interface ShockwaveRing {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  scaleSpeed: number;
  maxScale: number;
  startOpacity: number;
  axis: 'xz' | 'normal';
}

export interface EnergyBeam {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

export class ParticleVFXSystem {
  private scene: THREE.Scene;
  private particles: VisualParticle[] = [];
  private shockwaves: ShockwaveRing[] = [];
  private energyTrails: EnergyBeam[] = [];

  // Shared reusable geometries and materials for peak performance
  private sparkGeo = new THREE.BufferGeometry();
  private sphereParticleGeo = new THREE.SphereGeometry(0.12, 8, 8);
  private sparkBoxGeo = new THREE.BoxGeometry(0.08, 0.08, 0.22);
  private ringGeo = new THREE.RingGeometry(0.4, 0.7, 32);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Spawn dynamic collision burst reactive to impact force
   * @param pos World coordinate of collision contact
   * @param normal Impact normal direction
   * @param force Force magnitude (e.g. 1.0 to 15.0)
   * @param type Material/Surface archetype
   */
  public createCollisionImpact(
    pos: THREE.Vector3,
    normal: THREE.Vector3,
    force: number = 5.0,
    type: 'sphere' | 'metal' | 'stone' | 'wood' | 'energy' = 'sphere'
  ): void {
    const clampedForce = Math.max(1.0, Math.min(force, 20.0));
    const intensity = clampedForce / 10.0; // 0.1 to 2.0

    // 1. Color Palette by impact type
    let primaryColor = 0x00f0ff; // Neon cyan
    let secondaryColor = 0xffffff; // Pure white
    let accentColor = 0x3b82f6; // Electric blue

    if (type === 'sphere') {
      primaryColor = 0x0a84ff;
      secondaryColor = 0x30d158;
      accentColor = 0x38bdf8;
    } else if (type === 'metal') {
      primaryColor = 0xfacc15; // Golden amber
      secondaryColor = 0xffffff;
      accentColor = 0xf97316; // Orange
    } else if (type === 'stone') {
      primaryColor = 0x94a3b8;
      secondaryColor = 0xe2e8f0;
      accentColor = 0x38bdf8;
    } else if (type === 'energy') {
      primaryColor = 0xa855f7; // Neon purple
      secondaryColor = 0x38bdf8; // Cyan
      accentColor = 0xec4899; // Magenta
    }

    // 2. High-speed Spark Trails
    const sparkCount = Math.floor(12 + intensity * 18);
    for (let i = 0; i < sparkCount; i++) {
      const sparkMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.4 ? primaryColor : secondaryColor,
        transparent: true,
        opacity: 0.95,
      });

      const mesh = new THREE.Mesh(this.sparkBoxGeo, sparkMat);
      mesh.position.copy(pos);

      // Random cone velocity around the collision normal
      const randomSpread = new THREE.Vector3(
        (Math.random() - 0.5) * 1.8,
        (Math.random() - 0.5) * 1.8,
        (Math.random() - 0.5) * 1.8
      );
      const vel = normal.clone().multiplyScalar(4.0 + intensity * 6.0).add(randomSpread.multiplyScalar(4.0));
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vel.clone().normalize());

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        colorStart: new THREE.Color(secondaryColor),
        colorEnd: new THREE.Color(accentColor),
        scaleStart: 0.8 + intensity * 0.6,
        scaleEnd: 0.05,
        drag: 0.94,
        gravity: 12.0,
      });
    }

    // 3. Expanding Energy Shockwave Ring
    this.createShockwave(pos, normal, intensity, primaryColor);

    // 4. Core Energy Flash Burst
    this.createFlashBurst(pos, intensity, secondaryColor);
  }

  /**
   * Shockwave ring expanding outward along surface
   */
  public createShockwave(pos: THREE.Vector3, normal: THREE.Vector3, intensity: number, colorHex: number) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(this.ringGeo, ringMat);
    ring.position.copy(pos).addScaledVector(normal, 0.05);

    // Align ring plane perpendicular to normal
    if (Math.abs(normal.y) > 0.8) {
      ring.rotation.x = -Math.PI / 2;
    } else {
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    }

    this.scene.add(ring);
    this.shockwaves.push({
      mesh: ring,
      life: 0,
      maxLife: 0.45,
      scaleSpeed: 8.0 + intensity * 6.0,
      maxScale: 3.5 + intensity * 3.0,
      startOpacity: 0.9,
      axis: Math.abs(normal.y) > 0.8 ? 'xz' : 'normal',
    });
  }

  /**
   * Momentary glowing flash at impact core
   */
  public createFlashBurst(pos: THREE.Vector3, intensity: number, colorHex: number) {
    const flashMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });
    const flash = new THREE.Mesh(this.sphereParticleGeo, flashMat);
    flash.position.copy(pos);
    const initialScale = 0.5 + intensity * 0.8;
    flash.scale.set(initialScale, initialScale, initialScale);
    this.scene.add(flash);

    this.particles.push({
      mesh: flash,
      vel: new THREE.Vector3(0, 0, 0),
      life: 0.18,
      maxLife: 0.18,
      colorStart: new THREE.Color(colorHex),
      colorEnd: new THREE.Color(0x00f0ff),
      scaleStart: initialScale * 2.2,
      scaleEnd: 0.1,
      drag: 1.0,
      gravity: 0,
    });
  }

  /**
   * Speed Boost Jet Flame & Vapor Cone Trail
   * Emits glowing speed streaks and plasma orbs trailing behind the entity
   */
  public createSpeedBoostTrail(
    pos: THREE.Vector3,
    direction: THREE.Vector3,
    speedRatio: number = 1.0,
    theme: 'electric' | 'nitro' | 'overdrive' = 'electric'
  ): void {
    const count = Math.min(4, Math.floor(2 + speedRatio * 2));
    const primaryColor = theme === 'electric' ? 0x00f0ff : theme === 'nitro' ? 0xf59e0b : 0xa855f7;
    const secondaryColor = theme === 'electric' ? 0x38bdf8 : theme === 'nitro' ? 0xef4444 : 0xec4899;

    for (let i = 0; i < count; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? primaryColor : secondaryColor,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });

      const pMesh = new THREE.Mesh(this.sphereParticleGeo, pMat);
      // Spawn slightly behind the entity with jitter
      const backward = direction.clone().negate().normalize();
      const jitter = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.4
      );
      pMesh.position.copy(pos).add(backward.multiplyScalar(0.6)).add(jitter);

      const vel = backward.clone().multiplyScalar(5.0 + Math.random() * 4.0).add(jitter.multiplyScalar(2.0));
      this.scene.add(pMesh);

      this.particles.push({
        mesh: pMesh,
        vel,
        life: 0.28 + Math.random() * 0.15,
        maxLife: 0.4,
        colorStart: new THREE.Color(0xffffff),
        colorEnd: new THREE.Color(primaryColor),
        scaleStart: 0.7 + speedRatio * 0.4,
        scaleEnd: 0.02,
        drag: 0.92,
        gravity: -1.0, // slight upward float
      });
    }
  }

  /**
   * Special Ability Energy Burst (e.g. Kinetic Slam, EMP Blast, Super Dash)
   */
  public createSpecialAbilityBurst(
    pos: THREE.Vector3,
    abilityType: 'dash' | 'kinetic_slam' | 'emp_shield'
  ): void {
    if (abilityType === 'dash') {
      // Linear sonic burst
      this.createShockwave(pos, new THREE.Vector3(0, 1, 0), 2.2, 0x00f0ff);
      this.createFlashBurst(pos, 2.0, 0xffffff);

      for (let i = 0; i < 24; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(this.sparkBoxGeo, mat);
        mesh.position.copy(pos);
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 12.0,
          Math.random() * 4.0,
          (Math.random() - 0.5) * 12.0
        );
        this.scene.add(mesh);
        this.particles.push({
          mesh,
          vel,
          life: 0.4,
          maxLife: 0.4,
          colorStart: new THREE.Color(0xffffff),
          colorEnd: new THREE.Color(0x00f0ff),
          scaleStart: 1.2,
          scaleEnd: 0.05,
          drag: 0.91,
          gravity: 8.0,
        });
      }
    } else if (abilityType === 'kinetic_slam') {
      // Massive ground shockwave + debris burst
      this.createShockwave(pos, new THREE.Vector3(0, 1, 0), 3.0, 0xfacc15);
      this.createShockwave(pos, new THREE.Vector3(0, 1, 0), 2.0, 0x38bdf8);
      this.createFlashBurst(pos, 2.8, 0xffffff);

      for (let i = 0; i < 36; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.95 });
        const mesh = new THREE.Mesh(this.sparkBoxGeo, mat);
        mesh.position.copy(pos);
        const angle = Math.random() * Math.PI * 2;
        const speed = 8.0 + Math.random() * 10.0;
        const vel = new THREE.Vector3(
          Math.cos(angle) * speed,
          2.0 + Math.random() * 6.0,
          Math.sin(angle) * speed
        );
        this.scene.add(mesh);
        this.particles.push({
          mesh,
          vel,
          life: 0.55,
          maxLife: 0.55,
          colorStart: new THREE.Color(0xfacc15),
          colorEnd: new THREE.Color(0xef4444),
          scaleStart: 1.4,
          scaleEnd: 0.05,
          drag: 0.93,
          gravity: 16.0,
        });
      }
    } else if (abilityType === 'emp_shield') {
      // Expanding spherical plasma shield pulse
      this.createShockwave(pos, new THREE.Vector3(0, 1, 0), 2.5, 0x30d158);
      this.createFlashBurst(pos, 2.5, 0x00f0ff);
    }
  }

  /**
   * Main simulation step: updates positions, velocities, lifetimes, fade, and disposal
   */
  public update(dt: number): void {
    // 1. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.material instanceof THREE.Material) {
          p.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.vel.y -= p.gravity * dt;
      p.vel.multiplyScalar(Math.pow(p.drag, dt * 60));
      p.mesh.position.addScaledVector(p.vel, dt);

      // Orientation aligned with velocity if moving
      if (p.vel.lengthSq() > 0.05) {
        p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), p.vel.clone().normalize());
      }

      // Size interpolation
      const progress = 1.0 - p.life / p.maxLife; // 0 -> 1
      const scale = THREE.MathUtils.lerp(p.scaleStart, p.scaleEnd, progress);
      p.mesh.scale.set(scale, scale, scale * (1.0 + p.vel.length() * 0.06));

      // Color and opacity fade
      if (p.mesh.material instanceof THREE.MeshBasicMaterial) {
        p.mesh.material.color.lerpColors(p.colorStart, p.colorEnd, progress);
        p.mesh.material.opacity = Math.max(0, 1.0 - progress);
      }
    }

    // 2. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life += dt;
      const progress = s.life / s.maxLife;

      if (progress >= 1.0) {
        this.scene.remove(s.mesh);
        if (s.mesh.material instanceof THREE.Material) {
          s.mesh.material.dispose();
        }
        this.shockwaves.splice(i, 1);
        continue;
      }

      const currentScale = 0.5 + progress * s.maxScale;
      s.mesh.scale.set(currentScale, currentScale, currentScale);

      if (s.mesh.material instanceof THREE.MeshBasicMaterial) {
        s.mesh.material.opacity = s.startOpacity * (1.0 - Math.pow(progress, 1.5));
      }
    }
  }

  public dispose(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      if (p.mesh.material instanceof THREE.Material) p.mesh.material.dispose();
    }
    for (const s of this.shockwaves) {
      this.scene.remove(s.mesh);
      if (s.mesh.material instanceof THREE.Material) s.mesh.material.dispose();
    }
    this.particles = [];
    this.shockwaves = [];
  }
}
