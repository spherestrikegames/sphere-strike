import * as THREE from 'three';
import { WeaponType, WeaponRarity } from '../types';

export function createFirstPersonWeaponRig(weaponType: WeaponType, rarity: WeaponRarity): THREE.Group {
  const rig = new THREE.Group();

  // Arm / Glove (Player Hands in FPS view)
  const armMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Tactical dark glove
    roughness: 0.7,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf7c297,
    roughness: 0.6,
  });

  // Right Hand / Forearm
  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.45, 8), armMat);
  rightForearm.rotateX(-Math.PI / 4);
  rightForearm.position.set(0.24, -0.22, -0.3);
  rig.add(rightForearm);

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.12), skinMat);
  rightHand.position.set(0.22, -0.16, -0.42);
  rig.add(rightHand);

  // Left Hand support (for 2-handed weapons)
  if (weaponType !== 'shield' && weaponType !== 'heal') {
    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.11), skinMat);
    leftHand.position.set(-0.12, -0.18, -0.48);
    rig.add(leftHand);
  }

  // Weapon Model Attachment
  const weaponMesh = createWeaponMesh(weaponType, rarity);
  weaponMesh.position.set(0.18, -0.15, -0.42);
  weaponMesh.name = 'fps_weapon_mesh';
  rig.add(weaponMesh);

  return rig;
}

export function createWeaponMesh(type: WeaponType, rarity: WeaponRarity): THREE.Group {
  const group = new THREE.Group();

  const darkGunMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.85,
    roughness: 0.3,
  });
  const goldGunMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.2,
  });
  const scarMat = rarity === 'legendary' || rarity === 'mythic' ? goldGunMat : darkGunMat;

  if (type === 'pickaxe') {
    // Pickaxe Handle
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 })
    );
    handle.position.y = 0.2;
    group.add(handle);

    // Pickaxe Blade
    const bladeGeo = new THREE.ConeGeometry(0.12, 0.5, 4);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.2 });
    const bladeL = new THREE.Mesh(bladeGeo, bladeMat);
    bladeL.rotateZ(Math.PI / 2);
    bladeL.position.set(-0.2, 0.58, 0);
    group.add(bladeL);

    const bladeR = new THREE.Mesh(bladeGeo, bladeMat);
    bladeR.rotateZ(-Math.PI / 2);
    bladeR.position.set(0.2, 0.58, 0);
    group.add(bladeR);

    group.scale.set(0.85, 0.85, 0.85);
    group.rotateX(Math.PI / 6);
  } else if (type === 'ar') {
    // SCAR Assault Rifle
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.55), scarMat);
    group.add(body);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8),
      darkGunMat
    );
    barrel.rotateX(Math.PI / 2);
    barrel.position.set(0, 0.03, -0.42);
    group.add(barrel);

    // Curved Magazine
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.16, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x27272a })
    );
    mag.rotateX(-0.2);
    mag.position.set(0, -0.1, -0.06);
    group.add(mag);

    // Iron Sights / Picatinny Rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.3), darkGunMat);
    rail.position.set(0, 0.075, -0.05);
    group.add(rail);

    group.scale.set(1.1, 1.1, 1.1);
  } else if (type === 'shotgun') {
    // Pump Shotgun (SPAS-12)
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.65), darkGunMat);
    group.add(body);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.45, 8),
      darkGunMat
    );
    barrel.rotateX(Math.PI / 2);
    barrel.position.set(0, 0.03, -0.48);
    group.add(barrel);

    // Pump grip
    const pump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.9 })
    );
    pump.rotateX(Math.PI / 2);
    pump.position.set(0, -0.01, -0.28);
    group.add(pump);

    group.scale.set(1.05, 1.05, 1.05);
  } else if (type === 'sniper') {
    // Bolt-Action Sniper Rifle
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.75), darkGunMat);
    group.add(body);

    // Long Sniper Barrel
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.65, 8),
      darkGunMat
    );
    barrel.rotateX(Math.PI / 2);
    barrel.position.set(0, 0.02, -0.65);
    group.add(barrel);

    // Scope Tube
    const scopeTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.32, 12),
      new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9 })
    );
    scopeTube.rotateX(Math.PI / 2);
    scopeTube.position.set(0, 0.09, -0.1);
    group.add(scopeTube);

    group.scale.set(1.15, 1.15, 1.15);
  } else if (type === 'explosive') {
    // Rocket Launcher (RPG)
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
    );
    tube.rotateX(Math.PI / 2);
    group.add(tube);

    // Rocket Warhead protruding from front
    const warhead = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.22, 10),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 })
    );
    warhead.rotateX(-Math.PI / 2);
    warhead.position.set(0, 0, -0.55);
    group.add(warhead);

    // Grip & Sight
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.06), darkGunMat);
    grip.position.set(0, -0.1, 0.1);
    group.add(grip);

    const shieldGrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.02), darkGunMat);
    shieldGrip.position.set(0, 0.06, -0.15);
    group.add(shieldGrip);

    group.scale.set(1.2, 1.2, 1.2);
  } else if (type === 'minigun') {
    // 6-Barrel Minigun Gatling
    const center = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
    );
    center.rotateX(Math.PI / 2);
    group.add(center);

    for (let b = 0; b < 6; b++) {
      const angle = (b * Math.PI) / 3;
      const bx = Math.cos(angle) * 0.055;
      const by = Math.sin(angle) * 0.055;
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.75, 6),
        darkGunMat
      );
      barrel.rotateX(Math.PI / 2);
      barrel.position.set(bx, by, -0.1);
      group.add(barrel);
    }

    const hopper = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), goldGunMat);
    hopper.position.set(0, -0.08, 0.2);
    group.add(hopper);

    group.scale.set(1.25, 1.25, 1.25);
  } else if (type === 'pistol') {
    // Flint-Knock / Heavy Pistol
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.1, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }) // Wooden antique frame
    );
    group.add(body);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.018, 0.28, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    barrel.rotateX(Math.PI / 2);
    barrel.position.set(0, 0.03, -0.22);
    group.add(barrel);

    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.04), goldGunMat);
    hammer.position.set(0, 0.07, 0.1);
    group.add(hammer);

    group.scale.set(1.2, 1.2, 1.2);
  } else if (type === 'smg') {
    // Compact SMG / P90
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.18, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5 })
    );
    group.add(body);

    const magTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.04, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x71717a, transparent: true, opacity: 0.85 })
    );
    magTop.position.set(0, 0.1, -0.05);
    group.add(magTop);
  } else if (type === 'shield' || type === 'heal') {
    // Shield Potion Flask / Medkit
    const flask = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.26, 12),
      new THREE.MeshStandardMaterial({
        color: type === 'shield' ? 0x06b6d4 : 0x10b981,
        transparent: true,
        opacity: 0.85,
        roughness: 0.1,
        metalness: 0.1,
      })
    );
    group.add(flask);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f })
    );
    cap.position.y = 0.16;
    group.add(cap);

    // Glowing liquid light
    const potionGlow = new THREE.PointLight(type === 'shield' ? 0x06b6d4 : 0x10b981, 0.8, 2);
    group.add(potionGlow);
  }

  return group;
}

export function createMuzzleFlash(colorHex: number = 0xfef08a): THREE.Group {
  const flash = new THREE.Group();

  const mat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.9,
  });

  const s1 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), mat);
  s1.rotateX(Math.PI / 2);
  flash.add(s1);

  const light = new THREE.PointLight(colorHex, 3.5, 4);
  flash.add(light);

  return flash;
}
