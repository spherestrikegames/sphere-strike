// Visual effects: shell casings, damage numbers, bullet tracers, harvest particles/wobbles.
import * as THREE from 'three';
import { HarvestableObject } from '../types';
import { snapToBuildGrid } from './fortniteBuilding';
import type { FortniteEngine } from './fortniteEngine';


export function updateBuildingHologramImpl(engine: FortniteEngine) {
  if (!engine.isBuildMode || !engine.hologramMesh || engine.isSkydiving || engine.activeVehicle) return;

  const camDir = new THREE.Vector3();
  engine.camera.getWorldDirection(camDir);
  const snapped = snapToBuildGrid(engine.playerPos, camDir, engine.selectedBuildType);

  engine.hologramMesh.position.set(snapped.x, snapped.y, snapped.z);
  engine.hologramMesh.rotation.y = snapped.rotY;
}

export function updateShellCasingsImpl(engine: FortniteEngine, dt: number) {
  for (let i = engine.shellCasings.length - 1; i >= 0; i--) {
    const s = engine.shellCasings[i];
    s.life -= dt;
    s.vel.y -= 18.0 * dt;
    s.mesh.position.addScaledVector(s.vel, dt);
    s.mesh.rotation.x += s.rotVel.x * dt;
    s.mesh.rotation.y += s.rotVel.y * dt;

    if (s.mesh.position.y <= 1.0) {
      s.mesh.position.y = 1.0;
      s.vel.y *= -0.4;
      s.vel.x *= 0.6;
      s.vel.z *= 0.6;
    }

    if (s.life <= 0) {
      engine.scene.remove(s.mesh);
      engine.shellCasings.splice(i, 1);
    }
  }
}

export function addDamageNumberImpl(engine: FortniteEngine, text: string,
    color: string,
    isHeadshot: boolean,
    isShield: boolean,
    x: number,
    y: number,
    z: number) {
  const id = `dmg_${Date.now()}_${Math.random()}`;
  engine.damageNumbers.push({
    id,
    text,
    color,
    isHeadshot,
    isShield,
    x: x + (Math.random() - 0.5) * 0.4,
    y,
    z: z + (Math.random() - 0.5) * 0.4,
    life: 1.2,
    maxLife: 1.2,
  });
}

export function updateDamageNumbersImpl(engine: FortniteEngine, dt: number) {
  for (let i = engine.damageNumbers.length - 1; i >= 0; i--) {
    const d = engine.damageNumbers[i];
    d.life -= dt;
    d.y += dt * 1.5;
    if (d.life <= 0) {
      engine.damageNumbers.splice(i, 1);
    }
  }
}

export function createBulletTracerImpl(engine: FortniteEngine, start: THREE.Vector3, end: THREE.Vector3) {
  const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
  const mat = new THREE.LineBasicMaterial({ color: 0xfef08a, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  engine.scene.add(line);
  engine.bulletTracers.push({ line, life: 0.12 });
}

export function updateBulletTracersImpl(engine: FortniteEngine, dt: number) {
  for (let i = engine.bulletTracers.length - 1; i >= 0; i--) {
    const t = engine.bulletTracers[i];
    t.life -= dt;
    if (t.life <= 0) {
      engine.scene.remove(t.line);
      engine.bulletTracers.splice(i, 1);
    }
  }
}

export function createHarvestParticleEffectImpl(engine: FortniteEngine, hitPoint: THREE.Vector3, matType: string) {
  const color = matType === 'wood' ? 0xb45309 : matType === 'stone' ? 0x78716c : 0x94a3b8;
  const count = 6;
  const pMat = new THREE.MeshBasicMaterial({ color });

  for (let i = 0; i < count; i++) {
    const size = 0.08 + Math.random() * 0.12;
    const geo = new THREE.BoxGeometry(size, size, size);
    const mesh = new THREE.Mesh(geo, pMat);
    mesh.position.copy(hitPoint).add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25
      )
    );
    engine.scene.add(mesh);

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 3.5,
      1.8 + Math.random() * 3.2,
      (Math.random() - 0.5) * 3.5
    );
    const rotSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );

    engine.harvestParticles.push({
      mesh,
      vel,
      rotSpeed,
      life: 0.65,
      maxLife: 0.65,
    });
  }
}

export function updateHarvestParticlesImpl(engine: FortniteEngine, dt: number) {
  for (let i = engine.harvestParticles.length - 1; i >= 0; i--) {
    const p = engine.harvestParticles[i];
    p.life -= dt;
    if (p.life <= 0) {
      engine.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      engine.harvestParticles.splice(i, 1);
      continue;
    }

    p.vel.y -= 14.0 * dt; // Gravity
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.rotation.x += p.rotSpeed.x * dt;
    p.mesh.rotation.y += p.rotSpeed.y * dt;
    p.mesh.rotation.z += p.rotSpeed.z * dt;

    const scale = Math.max(0.01, p.life / p.maxLife);
    p.mesh.scale.set(scale, scale, scale);
  }
}

export function animateHarvestImpactImpl(engine: FortniteEngine, mesh: THREE.Object3D) {
  const existing = engine.activeHarvestWobbles.find((w) => w.mesh === mesh);
  if (existing) {
    existing.elapsed = 0;
    return;
  }

  engine.activeHarvestWobbles.push({
    mesh,
    baseRotZ: mesh.rotation.z,
    baseRotX: mesh.rotation.x,
    elapsed: 0,
    duration: 0.35,
  });
}

export function updateHarvestWobblesImpl(engine: FortniteEngine, dt: number) {
  for (let i = engine.activeHarvestWobbles.length - 1; i >= 0; i--) {
    const w = engine.activeHarvestWobbles[i];
    w.elapsed += dt;
    const progress = w.elapsed / w.duration;

    if (progress >= 1.0) {
      w.mesh.rotation.z = w.baseRotZ;
      w.mesh.rotation.x = w.baseRotX;
      engine.activeHarvestWobbles.splice(i, 1);
    } else {
      const decay = 1.0 - progress;
      const wobbleAngle = Math.sin(progress * Math.PI * 6) * 0.08 * decay;
      w.mesh.rotation.z = w.baseRotZ + wobbleAngle;
      w.mesh.rotation.x = w.baseRotX + wobbleAngle * 0.5;
    }
  }
}

export function animateHarvestDestructionImpl(engine: FortniteEngine, mesh: THREE.Object3D, h: HarvestableObject) {
  // Spawn burst of timber/debris particles
  engine.createHarvestParticleEffect(
    new THREE.Vector3(h.x, h.y + 1.2, h.z),
    h.materialType
  );
  engine.createHarvestParticleEffect(
    new THREE.Vector3(h.x, h.y + 2.5, h.z),
    h.materialType
  );

  // Dramatic falling over / shrinking animation before scene removal
  const startTime = performance.now();
  const duration = 500;
  const initialY = mesh.position.y;
  const fallDir = (Math.random() - 0.5) * 0.8;

  const animateBreak = () => {
    const elapsed = performance.now() - startTime;
    const t = Math.min(1, elapsed / duration);

    mesh.rotation.z += fallDir * 0.04;
    mesh.position.y = initialY - t * 1.5;
    const scale = Math.max(0.05, 1 - t * 0.85);
    mesh.scale.multiplyScalar(0.96);

    if (t < 1) {
      requestAnimationFrame(animateBreak);
    } else {
      engine.scene.remove(mesh);
      engine.harvestableMeshes.delete(h.id);
    }
  };
  requestAnimationFrame(animateBreak);
}

export function removeHarvestableColliderImpl(engine: FortniteEngine, h: HarvestableObject) {
  if (h.collider) {
    engine.spatialGrid.remove(h.collider);
    const idx = engine.staticColliders.indexOf(h.collider);
    if (idx !== -1) {
      engine.staticColliders.splice(idx, 1);
    }
  }
}
