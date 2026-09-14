import * as THREE from 'three';
import { FORTNITE_SKINS } from '../data/fortniteData';
import { WeaponType, WeaponRarity } from '../types';
import { createWeaponMesh } from './fortniteWeapons';

export interface CharacterMeshRig {
  root: THREE.Group;
  head: THREE.Group;
  body: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponSlot: THREE.Group;
  skinId: string;
  currentWeaponType: WeaponType;
  setWeapon: (weaponType: WeaponType, rarity?: WeaponRarity) => void;
  updateAnimation: (time: number, isMoving: boolean, isSwinging: boolean, isAiming: boolean) => void;
}

export function buildCharacterModel(
  skinId: string,
  weaponType: WeaponType = 'ar',
  rarity: WeaponRarity = 'epic'
): CharacterMeshRig {
  const skin = FORTNITE_SKINS.find((s) => s.id === skinId) || FORTNITE_SKINS[0];
  const root = new THREE.Group();

  const skinColorInt = parseInt(skin.headColor.replace('#', '0x'));
  const hairColorInt = parseInt(skin.hairColor.replace('#', '0x'));
  const shirtColorInt = parseInt(skin.shirtColor.replace('#', '0x'));
  const pantsColorInt = parseInt(skin.pantsColor.replace('#', '0x'));

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColorInt,
    roughness: 0.65,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColorInt,
    roughness: 0.8,
  });
  const shirtMat = new THREE.MeshStandardMaterial({
    color: shirtColorInt,
    metalness: skin.isGold ? 0.9 : 0.1,
    roughness: skin.isGold ? 0.2 : 0.65,
  });
  const vestMat = new THREE.MeshStandardMaterial({
    color: skin.isGold ? 0xb45309 : 0x1e293b,
    metalness: skin.isGold ? 0.8 : 0.3,
    roughness: 0.6,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: pantsColorInt,
    roughness: 0.8,
  });
  const darkGearMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.7,
  });
  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.9,
    roughness: 0.2,
  });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

  // 1. BODY / TORSO GROUP
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 1.15, 0);

  // Main Torso Mesh
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.85, 0.38), shirtMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyGroup.add(bodyMesh);

  // Tactical Armor Vest (Over Chest)
  const vestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.55, 0.44), vestMat);
  vestMesh.position.set(0, 0.1, 0);
  vestMesh.castShadow = true;
  bodyGroup.add(vestMesh);

  // Tactical Pouches on Vest
  for (const px of [-0.18, 0, 0.18]) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.08), darkGearMat);
    pouch.position.set(px, 0.02, 0.25);
    bodyGroup.add(pouch);
  }

  // Radio Comms Unit on Left Shoulder
  const radio = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.08), darkGearMat);
  radio.position.set(-0.28, 0.42, 0.05);
  bodyGroup.add(radio);
  const radioAntenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.14, 4),
    darkGearMat
  );
  radioAntenna.position.set(-0.28, 0.54, 0.05);
  bodyGroup.add(radioAntenna);

  // Utility Belt & Gold/Silver Buckle
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.4), darkGearMat);
  belt.position.set(0, -0.38, 0);
  bodyGroup.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.44), buckleMat);
  buckle.position.set(0, -0.38, 0.01);
  bodyGroup.add(buckle);

  // Back-Bling (Tactical Backpack or Tech Shield)
  const backBling = new THREE.Group();
  backBling.position.set(0, 0.08, -0.26);
  const packMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.5, 0.18),
    new THREE.MeshStandardMaterial({
      color: skin.isGold ? 0xf59e0b : 0x0f172a,
      metalness: skin.isGold ? 0.9 : 0.4,
      roughness: 0.5,
    })
  );
  packMesh.castShadow = true;
  backBling.add(packMesh);

  // Back Bling emblem/straps
  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.2), darkGearMat);
  strapL.position.set(-0.16, 0.02, 0.08);
  backBling.add(strapL);
  const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.2), darkGearMat);
  strapR.position.set(0.16, 0.02, 0.08);
  backBling.add(strapR);

  bodyGroup.add(backBling);
  root.add(bodyGroup);

  // 2. HEAD GROUP (Detailed facial features, hair, eyes, headgear)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.82, 0);

  // Head Base
  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.42), skinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Eyes & Eyebrows (Expressive and stylized)
  if (!skin.hasMask) {
    // Left Eye
    const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.07), eyeWhiteMat);
    eyeL.position.set(-0.1, 0.02, 0.215);
    headGroup.add(eyeL);
    const pupilL = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.05), eyePupilMat);
    pupilL.position.set(-0.09, 0.02, 0.218);
    headGroup.add(pupilL);

    // Right Eye
    const eyeR = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.07), eyeWhiteMat);
    eyeR.position.set(0.1, 0.02, 0.215);
    headGroup.add(eyeR);
    const pupilR = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.05), eyePupilMat);
    pupilR.position.set(0.09, 0.02, 0.218);
    headGroup.add(pupilR);

    // Eyebrows
    const browL = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.03), hairMat);
    browL.position.set(-0.1, 0.09, 0.216);
    browL.rotateZ(-0.08);
    headGroup.add(browL);

    const browR = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.03), hairMat);
    browR.position.set(0.1, 0.09, 0.216);
    browR.rotateZ(0.08);
    headGroup.add(browR);
  }

  // Hair / Hat / Mask Specifics
  if (skin.hasMask) {
    // Cyber / Kitsune / Ninja Mask
    const mask = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.36, 0.45),
      new THREE.MeshStandardMaterial({
        color: 0xdb2777,
        metalness: 0.6,
        roughness: 0.3,
      })
    );
    headGroup.add(mask);

    // Glowing Neon Visor / Eye slits
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.06, 0.48),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    visor.position.set(0, 0.04, 0.01);
    headGroup.add(visor);
  } else if (skin.hasHat) {
    // Military Helmet / Space Helmet
    const helmet = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.26, 0.48),
      new THREE.MeshStandardMaterial({
        color: parseInt(skin.hatColor?.replace('#', '0x') || '0x18181b'),
        metalness: 0.4,
        roughness: 0.5,
      })
    );
    helmet.position.y = 0.2;
    headGroup.add(helmet);

    // Helmet brim
    const brim = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.04, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    brim.position.set(0, 0.08, 0.28);
    headGroup.add(brim);
  } else {
    // Detailed Hair with volume
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.46), hairMat);
    hair.position.set(0, 0.2, -0.02);
    headGroup.add(hair);

    const hairSideL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.4), hairMat);
    hairSideL.position.set(-0.22, 0.08, 0);
    headGroup.add(hairSideL);

    const hairSideR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.4), hairMat);
    hairSideR.position.set(0.22, 0.08, 0);
    headGroup.add(hairSideR);
  }

  // Peely Banana Stem Top
  if (skin.id === 'peely') {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.09, 0.38, 6),
      new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.7 })
    );
    stem.position.y = 0.36;
    stem.rotateZ(-0.1);
    headGroup.add(stem);
  }

  // Galaxy Skin Cosmic Aura
  if (skin.id === 'galaxy') {
    const galaxyHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.38, 16),
      new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      })
    );
    galaxyHalo.position.y = 0.32;
    galaxyHalo.rotateX(Math.PI / 2);
    headGroup.add(galaxyHalo);
  }

  // Omega Neon Lights
  if (skin.id === 'omega') {
    const omegaChestLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.08, 0.46),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    omegaChestLight.position.set(0, 0.12, 0);
    bodyGroup.add(omegaChestLight);
  }

  // Skull Trooper Skeleton Ribs
  if (skin.id === 'skull_trooper') {
    for (let r = 0; r < 3; r++) {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.04, 0.46),
        new THREE.MeshBasicMaterial({ color: 0xa855f7 })
      );
      rib.position.set(0, 0.18 - r * 0.12, 0);
      bodyGroup.add(rib);
    }
  }

  // Travis Scott Gold Chain & Cactus Jack Tag
  if (skin.id === 'travis_scott') {
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.025, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.15 })
    );
    chain.position.set(0, 0.22, 0.12);
    chain.rotateX(Math.PI / 3);
    bodyGroup.add(chain);
  }

  // Raven Spectral Violet Eyes & Feather Cowl
  if (skin.id === 'raven') {
    const ravenEyeL = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 })
    );
    ravenEyeL.position.set(-0.1, 0.04, 0.22);
    headGroup.add(ravenEyeL);

    const ravenEyeR = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xa855f7 })
    );
    ravenEyeR.position.set(0.1, 0.04, 0.22);
    headGroup.add(ravenEyeR);
  }

  root.add(headGroup);

  // 3. ARMS (Left & Right with sleeves, tactical gloves, wrist comms)
  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.48, 1.15, 0);

  const leftShoulderSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.4, 0.24), shirtMat);
  leftShoulderSleeve.position.y = 0.2;
  leftShoulderSleeve.castShadow = true;
  leftArmGroup.add(leftShoulderSleeve);

  const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.44, 0.2), skinMat);
  leftForearm.position.y = -0.18;
  leftArmGroup.add(leftForearm);

  // Tactical Glove (Left Hand)
  const leftGlove = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), darkGearMat);
  leftGlove.position.y = -0.38;
  leftArmGroup.add(leftGlove);

  root.add(leftArmGroup);

  // Right Arm (Weapon holding arm)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.48, 1.15, 0);

  const rightShoulderSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.4, 0.24), shirtMat);
  rightShoulderSleeve.position.y = 0.2;
  rightShoulderSleeve.castShadow = true;
  rightArmGroup.add(rightShoulderSleeve);

  const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.44, 0.2), skinMat);
  rightForearm.position.y = -0.18;
  rightArmGroup.add(rightForearm);

  // Tactical Glove (Right Hand)
  const rightGlove = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), darkGearMat);
  rightGlove.position.y = -0.38;
  rightArmGroup.add(rightGlove);

  // 4. WEAPON SLOT ATTACHMENT (Directly attached to the right hand/arm)
  const weaponSlot = new THREE.Group();
  weaponSlot.position.set(0, -0.38, 0.08);
  weaponSlot.rotation.x = -Math.PI / 2;
  rightArmGroup.add(weaponSlot);

  // Initial weapon mesh attachment
  let activeWeaponMesh = createWeaponMesh(weaponType, rarity);
  activeWeaponMesh.position.set(0, 0, 0);
  weaponSlot.add(activeWeaponMesh);

  root.add(rightArmGroup);

  // 5. LEGS (With cargo pockets, combat kneepads, high-top boots)
  // Left Leg
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.18, 0.45, 0);

  const leftPants = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.55, 0.26), pantsMat);
  leftPants.position.y = 0.15;
  leftPants.castShadow = true;
  leftLegGroup.add(leftPants);

  // Tactical Kneepad
  const leftKneepad = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.14), darkGearMat);
  leftKneepad.position.set(0, -0.05, 0.11);
  leftLegGroup.add(leftKneepad);

  // Combat Boot with sole
  const leftBoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.32, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 })
  );
  leftBoot.position.set(0, -0.28, 0.04);
  leftBoot.castShadow = true;
  leftLegGroup.add(leftBoot);

  const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.36), darkGearMat);
  leftSole.position.set(0, -0.42, 0.04);
  leftLegGroup.add(leftSole);

  root.add(leftLegGroup);

  // Right Leg
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.18, 0.45, 0);

  const rightPants = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.55, 0.26), pantsMat);
  rightPants.position.y = 0.15;
  rightPants.castShadow = true;
  rightLegGroup.add(rightPants);

  // Tactical Kneepad & Thigh Holster
  const rightKneepad = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.14), darkGearMat);
  rightKneepad.position.set(0, -0.05, 0.11);
  rightLegGroup.add(rightKneepad);

  const thighHolster = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.2), darkGearMat);
  thighHolster.position.set(0.12, 0.18, 0);
  rightLegGroup.add(thighHolster);

  // Combat Boot with sole
  const rightBoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.32, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 })
  );
  rightBoot.position.set(0, -0.28, 0.04);
  rightBoot.castShadow = true;
  rightLegGroup.add(rightBoot);

  const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.36), darkGearMat);
  rightSole.position.set(0, -0.42, 0.04);
  rightLegGroup.add(rightSole);

  root.add(rightLegGroup);

  // Method to dynamically update the held weapon
  let currentWeaponTypeState: WeaponType = weaponType;
  const setWeapon = (newWepType: WeaponType, newRarity: WeaponRarity = 'epic') => {
    currentWeaponTypeState = newWepType;
    while (weaponSlot.children.length > 0) {
      weaponSlot.remove(weaponSlot.children[0]);
    }
    const newMesh = createWeaponMesh(newWepType, newRarity);
    weaponSlot.add(newMesh);
  };

  // Animation Update Loop
  const updateAnimation = (
    time: number,
    isMoving: boolean,
    isSwinging: boolean,
    isAiming: boolean
  ) => {
    if (isMoving) {
      const legSwing = Math.sin(time * 12) * 0.6;
      leftLegGroup.rotation.x = legSwing;
      rightLegGroup.rotation.x = -legSwing;
      leftArmGroup.rotation.x = -legSwing * 0.7;
      if (!isAiming && !isSwinging) {
        rightArmGroup.rotation.x = legSwing * 0.7;
      }
    } else {
      leftLegGroup.rotation.x = 0;
      rightLegGroup.rotation.x = 0;
      leftArmGroup.rotation.x = 0;
    }

    if (isSwinging) {
      // Pickaxe swing animation
      const swing = Math.sin(time * 20) * 0.9;
      rightArmGroup.rotation.x = -Math.PI / 3 + swing;
      rightArmGroup.rotation.y = -0.2;
      weaponSlot.rotation.x = -Math.PI / 2 + swing * 1.3;
    } else if (isAiming) {
      // Aiming weapon forward with both hands stabilizing
      rightArmGroup.rotation.x = -Math.PI / 2.3;
      rightArmGroup.rotation.y = -0.15;
      weaponSlot.rotation.x = -Math.PI / 2 - 0.05;
      leftArmGroup.rotation.x = -Math.PI / 2.5;
      leftArmGroup.rotation.y = 0.55;
      leftArmGroup.rotation.z = -0.2;
    } else {
      // Ready weapon idle pose
      rightArmGroup.rotation.x = -0.35;
      rightArmGroup.rotation.y = -0.1;
      rightArmGroup.rotation.z = 0;
      weaponSlot.rotation.x = -Math.PI / 2;
      leftArmGroup.rotation.x = -0.2;
      leftArmGroup.rotation.y = 0.3;
    }
  };

  return {
    root,
    head: headGroup,
    body: bodyGroup,
    leftArm: leftArmGroup,
    rightArm: rightArmGroup,
    leftLeg: leftLegGroup,
    rightLeg: rightLegGroup,
    weaponSlot,
    skinId,
    get currentWeaponType() {
      return currentWeaponTypeState;
    },
    setWeapon,
    updateAnimation,
  };
}

export function createNameTagSprite(
  name: string,
  isAI: boolean,
  team: string,
  healthPercent: number = 1.0,
  shieldPercent: number = 0.5
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 140;
  drawNameTagCanvas(canvas, name, isAI, team, healthPercent, shieldPercent);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(2.4, 0.65, 1.0);
  sprite.position.set(0, 2.35, 0);
  (sprite as any)._canvas = canvas;
  (sprite as any)._texture = texture;
  return sprite;
}

export function updateNameTagSprite(
  sprite: THREE.Sprite,
  name: string,
  isAI: boolean,
  team: string,
  healthPercent: number,
  shieldPercent: number
) {
  const canvas = (sprite as any)._canvas as HTMLCanvasElement;
  const texture = (sprite as any)._texture as THREE.CanvasTexture;
  if (!canvas || !texture) return;

  drawNameTagCanvas(canvas, name, isAI, team, healthPercent, shieldPercent);
  texture.needsUpdate = true;
}

function drawNameTagCanvas(
  canvas: HTMLCanvasElement,
  name: string,
  isAI: boolean,
  team: string,
  healthPercent: number,
  shieldPercent: number
) {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background Box with glowing border
  const teamColor =
    team === 'ALPHA'
      ? '#38bdf8'
      : team === 'OMEGA'
      ? '#ef4444'
      : team === 'SHADOW'
      ? '#a855f7'
      : '#f59e0b';

  // Backdrop
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(16, 12, 480, 116, 18);
  ctx.fill();

  ctx.strokeStyle = teamColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Top header: AI / Player badge + Team tag
  ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = isAI ? '#94a3b8' : '#facc15';
  const roleLabel = isAI ? `[AI BOT]` : `👑 [YOU]`;
  ctx.fillText(`${roleLabel} • TEAM ${team}`, 36, 44);

  // Character Name
  ctx.font = '900 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, 36, 82);

  // Health & Shield mini bars
  // Shield Bar (Blue)
  const barW = 440;
  const barH = 8;
  const barX = 36;
  const barY = 96;

  // Background track
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillRect(barX, barY + 12, barW, barH);

  // Shield fill
  if (shieldPercent > 0) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(barX, barY, barW * Math.max(0, Math.min(1, shieldPercent)), barH);
  }

  // Health fill (Green to Red)
  ctx.fillStyle = healthPercent > 0.35 ? '#22c55e' : '#ef4444';
  ctx.fillRect(barX, barY + 12, barW * Math.max(0, Math.min(1, healthPercent)), barH);
}
