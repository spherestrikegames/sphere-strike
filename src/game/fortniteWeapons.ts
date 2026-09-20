import * as THREE from 'three';
import { WeaponType, WeaponRarity } from '../types';

export function createFirstPersonWeaponRig(weaponType: WeaponType, rarity: WeaponRarity, weaponId?: string): THREE.Group {
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
  const weaponMesh = createWeaponMesh(weaponType, rarity, weaponId);
  weaponMesh.position.set(0.18, -0.15, -0.42);
  weaponMesh.name = 'fps_weapon_mesh';
  rig.add(weaponMesh);

  return rig;
}

export function createWeaponMesh(type: WeaponType, rarity: WeaponRarity, weaponId?: string): THREE.Group {
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
    if (weaponId === 'rifle_burst' || weaponId?.includes('burst')) {
      // Tactical Bullpup 3-Round Burst Marksman Rifle (FAMAS / AUG style)
      const tacticalPolymerMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b, // Tactical dark slate polymer
        metalness: 0.6,
        roughness: 0.45,
      });
      const gunmetalMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a, // Deep gunmetal receiver
        metalness: 0.9,
        roughness: 0.25,
      });
      const marksmanCyanMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Precision cyan marksman accents
        metalness: 0.8,
        roughness: 0.3,
      });
      const reflexGlassMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.7,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
      });

      // Bullpup Main Receiver Chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.13, 0.46), tacticalPolymerMat);
      chassis.position.set(0, 0, 0.02);
      group.add(chassis);

      // Rear Bullpup Stock & Buttplate
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.15, 0.22), tacticalPolymerMat);
      stock.position.set(0, -0.01, 0.28);
      group.add(stock);

      const buttPad = new THREE.Mesh(
        new THREE.BoxGeometry(0.066, 0.16, 0.025),
        new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 })
      );
      buttPad.position.set(0, -0.01, 0.39);
      group.add(buttPad);

      // Rear Bullpup Curved 30-round Magazine (behind the grip)
      const mag = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.17, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 })
      );
      mag.rotateX(-0.25);
      mag.position.set(0, -0.13, 0.2);
      group.add(mag);

      // Pistol Grip (forward of magazine)
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.14, 0.06), tacticalPolymerMat);
      grip.rotateX(0.28);
      grip.position.set(0, -0.11, -0.04);
      group.add(grip);

      // Trigger Guard & Trigger
      const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.08), gunmetalMat);
      triggerGuard.position.set(0, -0.08, -0.07);
      group.add(triggerGuard);

      // Elevated Marksman Carry-Handle & Optical Sight Bridge
      const carryHandle = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.075, 0.32), gunmetalMat);
      carryHandle.position.set(0, 0.1, -0.02);
      group.add(carryHandle);

      // Marksman Reflex Sight Lens
      const opticLens = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.04, 0.015), reflexGlassMat);
      opticLens.position.set(0, 0.13, -0.08);
      group.add(opticLens);

      // Cyan Marksman Accent Stripes along chassis
      const accentStripe = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.015, 0.28), marksmanCyanMat);
      accentStripe.position.set(0, 0.03, 0.05);
      group.add(accentStripe);

      // Extended Precision Rifled Barrel
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.38, 8),
        gunmetalMat
      );
      barrel.rotateX(Math.PI / 2);
      barrel.position.set(0, 0.02, -0.38);
      group.add(barrel);

      // Compensator Muzzle Brake (Triple Vents for 3-Round Burst control)
      const brake = new THREE.Mesh(
        new THREE.CylinderGeometry(0.019, 0.018, 0.07, 8),
        marksmanCyanMat
      );
      brake.rotateX(Math.PI / 2);
      brake.position.set(0, 0.02, -0.58);
      group.add(brake);

      // Front Angled Foregrip for recoil stabilization
      const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.09, 0.05), tacticalPolymerMat);
      foregrip.rotateX(-0.25);
      foregrip.position.set(0, -0.09, -0.22);
      group.add(foregrip);

      group.scale.set(1.05, 1.05, 1.05);
    } else {
      // Standard SCAR Assault Rifle
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
    }
  } else if (type === 'shotgun') {
    if (weaponId?.includes('double_barrel') || weaponId === 'shotgun_double_barrel' || !weaponId) {
      // Authentic Break-Action Double-Barrel Shotgun
      const stockMat = new THREE.MeshStandardMaterial({
        color: 0x451a03, // Dark walnut wood stock
        roughness: 0.65,
      });
      const receiverMat = new THREE.MeshStandardMaterial({
        color: 0x27272a, // Gunmetal steel receiver
        metalness: 0.9,
        roughness: 0.25,
      });
      const steelBarrelMat = new THREE.MeshStandardMaterial({
        color: 0x18181b, // Blued steel twin barrels
        metalness: 0.95,
        roughness: 0.18,
      });
      const brassAccentMat = new THREE.MeshStandardMaterial({
        color: 0xd97706, // Polished brass accents
        metalness: 0.9,
        roughness: 0.3,
      });

      // Wooden Stock & Buttplate
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.36), stockMat);
      stock.position.set(0, -0.04, 0.18);
      stock.rotation.x = -0.12;
      group.add(stock);

      const buttPlate = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.12, 0.02), receiverMat);
      buttPlate.position.set(0, -0.06, 0.35);
      buttPlate.rotation.x = -0.12;
      group.add(buttPlate);

      // Steel Break-Action Receiver / Hinge Block
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.09, 0.18), receiverMat);
      receiver.position.set(0, 0.01, -0.04);
      group.add(receiver);

      // Break-Action Hinge Pin (Gold/Brass screw)
      const hingePin = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.07, 8), brassAccentMat);
      hingePin.rotation.z = Math.PI / 2;
      hingePin.position.set(0, -0.02, -0.1);
      group.add(hingePin);

      // Top Break-Action Opening Lever
      const topLever = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.02, 0.06), brassAccentMat);
      topLever.position.set(0.01, 0.06, 0.02);
      topLever.rotation.y = 0.15;
      group.add(topLever);

      // Wooden Fore-End under barrels
      const foreEnd = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.22), stockMat);
      foreEnd.position.set(0, -0.02, -0.22);
      group.add(foreEnd);

      // Dual Twin Barrels (Side-by-Side cannon!)
      // Left Barrel
      const barrelLeft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.52, 10),
        steelBarrelMat
      );
      barrelLeft.rotateX(Math.PI / 2);
      barrelLeft.position.set(-0.018, 0.02, -0.38);
      group.add(barrelLeft);

      // Right Barrel
      const barrelRight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.52, 10),
        steelBarrelMat
      );
      barrelRight.rotateX(Math.PI / 2);
      barrelRight.position.set(0.018, 0.02, -0.38);
      group.add(barrelRight);

      // Center Ventilated Connecting Rib
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.014, 0.5), steelBarrelMat);
      rib.position.set(0, 0.035, -0.38);
      group.add(rib);

      // Front Brass Sight Bead
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), brassAccentMat);
      bead.position.set(0, 0.044, -0.63);
      group.add(bead);

      // Twin Trigger Guard & Triggers
      const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.005, 6, 12, Math.PI), receiverMat);
      triggerGuard.rotation.y = Math.PI / 2;
      triggerGuard.rotation.z = Math.PI;
      triggerGuard.position.set(0, -0.04, 0.03);
      group.add(triggerGuard);

      group.scale.set(1.15, 1.15, 1.15);
    } else {
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
    }
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
