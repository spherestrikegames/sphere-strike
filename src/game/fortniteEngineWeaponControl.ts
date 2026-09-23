// Weapon firing entry point, shell ejection, reload & consumable use.
import * as THREE from 'three';
import { FortniteWeapon } from '../types';
import { createMuzzleFlash } from './fortniteWeapons';
import { updateNameTagSprite } from './fortniteCharacter';
import { fortniteAudio } from '../utils/audio';
import { multiplayerClient } from '../utils/multiplayer';
import type { FortniteEngine } from './fortniteEngine';


export function fireActiveWeaponImpl(engine: FortniteEngine) {
  const wep = engine.getCurrentWeapon();
  if (!wep || engine.isReloading || engine.isUsingConsumable || engine.isSkydiving || engine.activeVehicle || engine.isRespawning || engine.isGameOver) return;

  const now = performance.now();
  const fireInterval = 1000 / wep.fireRate;
  if (now - engine.lastShotTime < fireInterval) return;

  if (wep.type === 'shield' || wep.type === 'heal') {
    engine.startConsumableUse(wep);
    return;
  }

  if (wep.type !== 'pickaxe' && wep.currentAmmo <= 0) {
    engine.startReload();
    return;
  }

  engine.lastShotTime = now;
  engine.shotsFired++;

  if (wep.type === 'pickaxe') {
    engine.isSwingingPickaxe = true;
    fortniteAudio.playPickaxeSwing();
    setTimeout(() => (engine.isSwingingPickaxe = false), 320);
    engine.performPickaxeHit();
    return;
  }

  // Deduct 1 ammo
  wep.currentAmmo--;
  wep.reserveAmmo = 9999;
  engine.callbacks.onInventoryChange(engine.inventory, engine.activeSlot);

  // Play Weapon Audio
  if (wep.type === 'ar') fortniteAudio.playGunshotAR(wep.rarity === 'legendary');
  else if (wep.type === 'shotgun') fortniteAudio.playGunshotShotgun();
  else if (wep.type === 'sniper') {
    if (wep.id === 'sniper_heavy_legendary') fortniteAudio.playGunshotHeavySniper();
    else fortniteAudio.playGunshotSniper();
  }
  else if (wep.type === 'smg') fortniteAudio.playGunshotSMG();

  // Muzzle Flash & Point Light
  const flash = createMuzzleFlash(wep.rarity === 'legendary' ? 0xf59e0b : 0xfef08a);
  flash.position.set(0.2, -0.15, -0.9);
  engine.camera.add(flash);
  setTimeout(() => engine.camera.remove(flash), 55);

  // Realistic Procedural Recoil Kick
  const isHeavy = wep.id === 'sniper_heavy_legendary';
  const recoilKick = isHeavy ? 0.12 : wep.type === 'sniper' ? 0.065 : wep.type === 'shotgun' ? 0.05 : 0.022;
  engine.playerPitch += recoilKick;
  engine.recoilRecoilZ = isHeavy ? 0.22 : 0.12;
  engine.recoilRecoilY = isHeavy ? 0.08 : 0.04;
  engine.recoilRecoilRotX = isHeavy ? -0.28 : -0.15;
  engine.screenShake = isHeavy ? 0.12 : 0.05;

  // Eject Brass Shell Casing
  engine.ejectShellCasing();

  // Bullet Raycast Hitscan (Exact pinpoint accuracy where crosshair is)
  engine.performBulletRaycast(wep);

  // Sync to Online Party
  multiplayerClient.sendPlayerAction({
    type: 'shoot',
    weaponType: wep.type,
    origin: { x: engine.playerPos.x, y: engine.playerPos.y + 1.6, z: engine.playerPos.z },
    target: {
      x: engine.playerPos.x - Math.sin(engine.playerRotY) * 50,
      y: engine.playerPos.y + 1.6 + Math.sin(engine.playerPitch) * 50,
      z: engine.playerPos.z - Math.cos(engine.playerRotY) * 50,
    },
  });
}

export function ejectShellCasingImpl(engine: FortniteEngine) {
  const geo = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 6);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.85,
    roughness: 0.2,
  });
  const mesh = new THREE.Mesh(geo, mat);

  const spawnPos = engine.camera.position.clone().add(
    new THREE.Vector3(0.25, -0.2, -0.4).applyQuaternion(engine.camera.quaternion)
  );
  mesh.position.copy(spawnPos);
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

  engine.scene.add(mesh);

  const rightDir = new THREE.Vector3(1, 0.5, 0).applyQuaternion(engine.camera.quaternion);
  engine.shellCasings.push({
    mesh,
    vel: rightDir.multiplyScalar(3.5 + Math.random() * 2),
    rotVel: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
    life: 1.5,
  });
}

export function startReloadImpl(engine: FortniteEngine) {
  const wep = engine.getCurrentWeapon();
  if (!wep || wep.type === 'pickaxe' || wep.currentAmmo === wep.magazineSize) return;

  engine.isReloading = true;
  fortniteAudio.playReload();
  setTimeout(() => {
    if (!engine.isReloading) return;
    wep.currentAmmo = wep.magazineSize;
    wep.reserveAmmo = 9999;
    engine.isReloading = false;
    engine.callbacks.onInventoryChange(engine.inventory, engine.activeSlot);
  }, wep.reloadTime * 1000);
}

export function startConsumableUseImpl(engine: FortniteEngine, wep: FortniteWeapon) {
  if (engine.isUsingConsumable) return;
  engine.isUsingConsumable = true;
  fortniteAudio.playShieldDrink();

  setTimeout(() => {
    if (!engine.isUsingConsumable) return;
    if (wep.shieldAmount) {
      engine.shield = Math.min(engine.maxShield, engine.shield + wep.shieldAmount);
    }
    if (wep.healAmount) {
      engine.health = Math.min(engine.maxHealth, engine.health + wep.healAmount);
    }
    wep.currentAmmo--;
    if (wep.currentAmmo <= 0) {
      engine.inventory[engine.activeSlot] = null;
    }
    engine.isUsingConsumable = false;
    engine.callbacks.onHealthChange(engine.health, engine.shield);
    engine.callbacks.onInventoryChange(engine.inventory, engine.activeSlot);

    if (engine.playerNameTag) {
      updateNameTagSprite(engine.playerNameTag, engine.profile.name, false, engine.playerTeam, engine.health / engine.maxHealth, engine.shield / engine.maxShield);
    }
  }, (wep.useTime || 2.0) * 1000);
}
