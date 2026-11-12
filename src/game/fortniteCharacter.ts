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

const LEGACY_SKIN_IDS: Record<string, string> = {
  jonesy: 'zyro', renegade_raider: 'kairox', midas: 'rift', black_knight: 'nex',
  peely: 'orbito', drift: 'vexlo', goku: 'voltix', travis_scott: 'nex',
  galaxy: 'glitch', omega: 'glitch', raven: 'vexlo', skull_trooper: 'nex', aura: 'zyro',
};

function roundedMaterial(color: string | number, roughness = 0.72) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 });
}

export function buildCharacterModel(
  requestedSkinId: string,
  weaponType: WeaponType = 'ar',
  rarity: WeaponRarity = 'epic'
): CharacterMeshRig {
  const skinId = LEGACY_SKIN_IDS[requestedSkinId] || requestedSkinId;
  const skin = FORTNITE_SKINS.find((item) => item.id === skinId) || FORTNITE_SKINS[0];
  const root = new THREE.Group();
  root.name = `character-${skin.id}`;
  const skinMat = roundedMaterial(skin.headColor);
  const hairMat = roundedMaterial(skin.hairColor);
  const shirtMat = roundedMaterial(skin.shirtColor);
  const pantsMat = roundedMaterial(skin.pantsColor);
  const accentMat = roundedMaterial(skin.glowColor, 0.48);
  const darkMat = roundedMaterial('#202938');
  const shoeMat = roundedMaterial('#18202b');

  // Compact, friendly proportions: large head, short torso and chunky limbs.
  const body = new THREE.Group();
  body.position.y = 1.12;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.34, 5, 10), shirtMat);
  torso.scale.set(1, 1, 0.72);
  torso.castShadow = true;
  body.add(torso);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.53, 0.11, 0.34), darkMat);
  belt.position.y = -0.27;
  body.add(belt);
  const chestMark = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.16, 0.035), accentMat);
  chestMark.position.set(0.13, 0.08, 0.245);
  body.add(chestMark);
  if (skin.accessory === 'backpack') {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.2), darkMat);
    pack.position.set(0, 0.02, -0.29);
    body.add(pack);
  }
  root.add(body);

  const head = new THREE.Group();
  head.position.set(0, 1.83, 0.015);
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.43, 18, 14), skinMat);
  headMesh.scale.set(1, 1.02, 0.9);
  headMesh.castShadow = true;
  head.add(headMesh);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x172333 });
  for (const x of [-0.145, 0.145]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.043, 10, 8), eyeMat);
    eye.position.set(x, -0.025, 0.365);
    head.add(eye);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.035, 0.035), hairMat);
    brow.position.set(x, 0.075, 0.36);
    brow.rotation.z = x < 0 ? -0.12 : 0.12;
    head.add(brow);
  }
  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.018, 0.018), darkMat);
  smile.position.set(0, -0.17, 0.378);
  head.add(smile);

  // Distinct hair silhouettes built from soft, chunky tufts.
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.405, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.53), hairMat);
  hairCap.position.y = 0.19;
  head.add(hairCap);
  const tuftCount = skin.hairStyle === 'spikes' || skin.hairStyle === 'crest' ? 5 : 3;
  for (let i = 0; i < tuftCount; i++) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.12, skin.hairStyle === 'crest' ? 0.36 : 0.24, 7), hairMat);
    const x = (i - (tuftCount - 1) / 2) * 0.14;
    tuft.position.set(x, 0.43 + (i % 2) * 0.025, -0.01);
    tuft.rotation.z = skin.hairStyle === 'swept' ? -0.48 : (i - 2) * 0.12;
    tuft.rotation.x = -0.18;
    head.add(tuft);
  }
  if (skin.accessory === 'visor') {
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.15, 0.12), accentMat);
    visor.position.set(0, 0.015, 0.34);
    head.add(visor);
  } else if (skin.accessory === 'headband') {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.045, 6, 18, Math.PI), accentMat);
    band.position.y = 0.13;
    band.rotation.x = Math.PI / 2;
    head.add(band);
  } else if (skin.accessory === 'earpiece') {
    const earpiece = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), accentMat);
    earpiece.position.set(0.39, -0.02, 0.02);
    head.add(earpiece);
  }
  root.add(head);

  const makeArm = (side: number) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.43, 1.27, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.31, 4, 8), shirtMat);
    sleeve.rotation.z = -side * 0.12;
    sleeve.castShadow = true;
    arm.add(sleeve);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), skinMat);
    hand.position.y = -0.35;
    arm.add(hand);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.035, 6, 12), accentMat);
    cuff.position.y = -0.27;
    cuff.rotation.x = Math.PI / 2;
    arm.add(cuff);
    root.add(arm);
    return arm;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  const weaponSlot = new THREE.Group();
  weaponSlot.position.set(0, -0.34, 0.12);
  weaponSlot.rotation.x = -Math.PI / 2;
  rightArm.add(weaponSlot);
  let currentWeaponType = weaponType;
  const setWeapon = (nextType: WeaponType, nextRarity: WeaponRarity = 'epic') => {
    currentWeaponType = nextType;
    weaponSlot.clear();
    weaponSlot.add(createWeaponMesh(nextType, nextRarity));
  };
  setWeapon(weaponType, rarity);

  const makeLeg = (side: number) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.19, 0.53, 0);
    const pants = new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.31, 4, 8), pantsMat);
    pants.castShadow = true;
    leg.add(pants);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.18, 0.4), shoeMat);
    shoe.position.set(0, -0.25, 0.075);
    shoe.castShadow = true;
    leg.add(shoe);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.045, 0.41), accentMat);
    sole.position.set(0, -0.34, 0.075);
    leg.add(sole);
    root.add(leg);
    return leg;
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  const updateAnimation = (time: number, isMoving: boolean, isSwinging: boolean, isAiming: boolean) => {
    const stride = isMoving ? Math.sin(time * 11) * 0.42 : Math.sin(time * 2.2) * 0.025;
    leftLeg.rotation.x = stride;
    rightLeg.rotation.x = -stride;
    leftArm.rotation.x = -stride * 0.55;
    if (isSwinging) {
      rightArm.rotation.x = -0.85 + Math.sin(time * 17) * 0.7;
      weaponSlot.rotation.x = -Math.PI / 2 + Math.sin(time * 17) * 0.8;
    } else {
      rightArm.rotation.x = isAiming ? -0.85 : -0.12 + stride * 0.4;
      weaponSlot.rotation.x = -Math.PI / 2;
    }
    head.rotation.y = Math.sin(time * 1.3) * 0.035;
    body.position.y = 1.12 + (isMoving ? Math.abs(Math.sin(time * 11)) * 0.035 : Math.sin(time * 2) * 0.012);
  };

  return {
    root, head, body, leftArm, rightArm, leftLeg, rightLeg, weaponSlot, skinId: skin.id,
    get currentWeaponType() { return currentWeaponType; },
    setWeapon, updateAnimation,
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

export function buildSphereCharacterRig(
  skinId: string,
  weaponType: WeaponType = 'ar',
  rarity: WeaponRarity = 'epic',
  accentColorHex?: number
): CharacterMeshRig {
  const skin = FORTNITE_SKINS.find((s) => s.id === skinId) || FORTNITE_SKINS[0];
  const root = new THREE.Group();

  const coreColor = accentColorHex !== undefined ? accentColorHex : parseInt(skin.shirtColor.replace('#', '0x'));
  const ringColor = parseInt(skin.headColor.replace('#', '0x'));

  // 1. Glossy Stylized Core Sphere (Apple liquid/acrylic feel with clearcoat)
  const sphereGeo = new THREE.SphereGeometry(0.55, 32, 32);
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: coreColor,
    metalness: skin.isGold ? 0.9 : 0.25,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transmission: 0.35,
    ior: 1.5,
  });
  const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
  sphereMesh.position.y = 1.15;
  sphereMesh.castShadow = true;
  sphereMesh.receiveShadow = true;
  root.add(sphereMesh);

  // 2. Orbital Gyro Rings
  const ringGeo = new THREE.TorusGeometry(0.68, 0.04, 16, 48);
  const ringMat = new THREE.MeshStandardMaterial({
    color: ringColor,
    metalness: 0.85,
    roughness: 0.2,
  });
  const gyroRing1 = new THREE.Mesh(ringGeo, ringMat);
  gyroRing1.position.y = 1.15;
  gyroRing1.rotation.x = Math.PI / 2;
  root.add(gyroRing1);

  const gyroRing2 = new THREE.Mesh(ringGeo, ringMat);
  gyroRing2.position.y = 1.15;
  gyroRing2.rotation.y = Math.PI / 4;
  root.add(gyroRing2);

  // 3. Glowing Visor / Optical Eye
  const visorGeo = new THREE.SphereGeometry(0.18, 16, 16);
  const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 1.25, 0.48);
  root.add(visor);

  // Weapon Attachment Node
  const weaponSlot = new THREE.Group();
  weaponSlot.position.set(0.48, 1.05, 0.25);
  root.add(weaponSlot);

  let currentWep = weaponType;
  const setWeapon = (newType: WeaponType, newRarity: WeaponRarity = 'epic') => {
    currentWep = newType;
    while (weaponSlot.children.length > 0) {
      weaponSlot.remove(weaponSlot.children[0]);
    }
    const mesh = createWeaponMesh(newType, newRarity);
    mesh.scale.set(0.85, 0.85, 0.85);
    weaponSlot.add(mesh);
  };
  setWeapon(weaponType, rarity);

  // Dummy groups to satisfy CharacterMeshRig interface
  const dummyGroup = new THREE.Group();

  let rollPitch = 0;
  const updateAnimation = (time: number, isMoving: boolean, _isSwinging?: boolean, isAiming?: boolean) => {
    // Gyro orbital rings rotate smoothly on independent axes
    gyroRing1.rotation.z = time * 2.2;
    gyroRing2.rotation.x = time * 1.6;

    if (isMoving) {
      // Dynamic forward rolling rotation along movement
      rollPitch += 0.22;
      sphereMesh.rotation.x = rollPitch;
      sphereMesh.position.y = 1.15 + Math.sin(time * 18) * 0.04;
    } else {
      sphereMesh.position.y = 1.15 + Math.sin(time * 3) * 0.02;
    }

    if (isAiming) {
      weaponSlot.position.set(0.38, 1.18, 0.42);
    } else {
      weaponSlot.position.set(0.48, 1.05, 0.25);
    }
  };

  return {
    root,
    head: dummyGroup,
    body: root,
    leftArm: dummyGroup,
    rightArm: dummyGroup,
    leftLeg: dummyGroup,
    rightLeg: dummyGroup,
    weaponSlot,
    skinId,
    get currentWeaponType() {
      return currentWep;
    },
    setWeapon,
    updateAnimation,
  };
}
