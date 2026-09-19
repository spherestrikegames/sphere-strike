// Supply drops, ground loot, chests.
import * as THREE from 'three';
import { FortniteWeapon, LootChest, DroppedSupply } from '../types';
import { WEAPON_REGISTRY, ISLAND_POIS } from '../data/fortniteData';
import { getTerrainHeight } from './fortniteWorld';
import { createFirstPersonWeaponRig } from './fortniteWeapons';
import { fortniteAudio } from '../utils/audio';
import type { FortniteEngine } from './fortniteEngine';


export function spawnDroppedSuppliesImpl(engine: FortniteEngine, x: number, y: number, z: number, weapon?: FortniteWeapon) {
  const supplyItems: DroppedSupply[] = [];

  if (weapon && weapon.name) {
    supplyItems.push({
      id: `drop_wep_${Date.now()}_${Math.random()}`,
      type: 'weapon',
      amount: 1,
      weapon: { ...weapon },
      x: x + (Math.random() - 0.5) * 1.5,
      y: y + 0.4,
      z: z + (Math.random() - 0.5) * 1.5,
      rotY: 0,
      name: weapon.name || 'Weapon',
      color: weapon.color || '#94a3b8',
    });
  }

  // Material Drops (Wood +60, Stone +30, Metal +15)
  supplyItems.push({
    id: `drop_wood_${Date.now()}_${Math.random()}`,
    type: 'wood',
    amount: 60,
    x: x + (Math.random() - 0.5) * 2.0,
    y: y + 0.3,
    z: z + (Math.random() - 0.5) * 2.0,
    rotY: 0,
    name: '+60 Wood',
    color: '#f59e0b',
  });
  supplyItems.push({
    id: `drop_shield_${Date.now()}_${Math.random()}`,
    type: 'shield',
    amount: 2,
    weapon: { ...WEAPON_REGISTRY.mini_shields },
    x: x + (Math.random() - 0.5) * 2.0,
    y: y + 0.3,
    z: z + (Math.random() - 0.5) * 2.0,
    rotY: 0,
    name: 'Mini Shield Potions',
    color: '#38bdf8',
  });

  for (const item of supplyItems) {
    engine.droppedSupplies.push(item);
    const mesh = engine.createSupply3DMesh(item);
    engine.scene.add(mesh);
    engine.supplyMeshes.set(item.id, mesh);
  }
}

export function createSupply3DMeshImpl(engine: FortniteEngine, item: DroppedSupply): THREE.Group {
  const group = new THREE.Group();
  group.position.set(item.x, item.y, item.z);

  if (item.type === 'weapon' && item.weapon) {
    const wepMesh = createFirstPersonWeaponRig(item.weapon.type, item.weapon.rarity);
    wepMesh.scale.set(1.4, 1.4, 1.4);
    group.add(wepMesh);

    // Glowing vertical beacon beam
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.08, 6.0, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: parseInt(item.color.replace('#', '0x') || '0xfacc15'),
      transparent: true,
      opacity: 0.65,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 3.0;
    group.add(beam);
  } else if (item.type === 'wood' || item.type === 'stone' || item.type === 'metal') {
    const matMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.35, 0.45),
      new THREE.MeshStandardMaterial({
        color: item.type === 'wood' ? 0xd97706 : item.type === 'stone' ? 0x78716c : 0x94a3b8,
        roughness: 0.6,
      })
    );
    matMesh.castShadow = true;
    group.add(matMesh);
  } else {
    const potMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.45, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.7 })
    );
    group.add(potMesh);
  }

  return group;
}

export function spawnPeriodicSupplyDropImpl(engine: FortniteEngine) {
  const dropId = `gchest_${Date.now()}`;
  const poi = ISLAND_POIS[Math.floor(Math.random() * ISLAND_POIS.length)];
  const x = poi.x + (Math.random() - 0.5) * 40;
  const z = poi.z + (Math.random() - 0.5) * 40;
  const groundH = engine.getGroundElevationAt(x, z, 0);
  const y = groundH + 0.1;

  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Grounded Tactical Chest Prop (Small, grounded chest prop)
  const chestBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.7, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.4, roughness: 0.5 })
  );
  chestBase.position.y = 0.35;
  chestBase.castShadow = true;
  group.add(chestBase);

  const chestLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 1.4, 12, 1, false, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x92400e, metalness: 0.5, roughness: 0.4 })
  );
  chestLid.position.set(0, 0.7, 0);
  chestLid.rotation.z = Math.PI / 2;
  group.add(chestLid);

  // Gold trim & latch
  const latch = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.25, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 })
  );
  latch.position.set(0, 0.5, 0.48);
  group.add(latch);

  // Tactical Golden Light Beam rising from the grounded chest
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.35, 60, 8),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.65 })
  );
  beam.position.y = 30;
  group.add(beam);

  engine.scene.add(group);
  engine.supplyDropBoxes.push({
    id: dropId,
    group,
    x,
    y,
    z,
    vy: 0,
    isLanded: true,
    tier: 'legendary_supply',
  });

  fortniteAudio.playSupplyDropSpawn();
}

export function updateDroppedSuppliesImpl(engine: FortniteEngine, dt: number) {
  const time = performance.now() * 0.003;

  // 1. Hover & rotate dropped item meshes
  for (let i = engine.droppedSupplies.length - 1; i >= 0; i--) {
    const item = engine.droppedSupplies[i];
    const mesh = engine.supplyMeshes.get(item.id);
    if (mesh) {
      mesh.rotation.y = time;
      mesh.position.y = item.y + Math.sin(time * 3) * 0.08;
    }

    // Auto-vacuum materials & ammo within 2.8m
    const dist = engine.playerPos.distanceTo(new THREE.Vector3(item.x, item.y, item.z));
    if (dist < 2.8 && item.type !== 'weapon') {
      if (item.type === 'wood') {
        engine.wood = Math.min(999, engine.wood + item.amount);
        if (engine.callbacks.onItemCollected) {
          engine.callbacks.onItemCollected({
            id: `col_drop_${Date.now()}_${Math.random()}`,
            title: `+${item.amount} WOOD`,
            subtitle: `Total: ${engine.wood}`,
            icon: '🪵',
            amount: `+${item.amount}`,
            type: 'material',
            color: '#f59e0b',
            timestamp: Date.now(),
          });
        }
      } else if (item.type === 'stone') {
        engine.stone = Math.min(999, engine.stone + item.amount);
        if (engine.callbacks.onItemCollected) {
          engine.callbacks.onItemCollected({
            id: `col_drop_${Date.now()}_${Math.random()}`,
            title: `+${item.amount} STONE`,
            subtitle: `Total: ${engine.stone}`,
            icon: '🪨',
            amount: `+${item.amount}`,
            type: 'material',
            color: '#a8a29e',
            timestamp: Date.now(),
          });
        }
      } else if (item.type === 'metal') {
        engine.metal = Math.min(999, engine.metal + item.amount);
        if (engine.callbacks.onItemCollected) {
          engine.callbacks.onItemCollected({
            id: `col_drop_${Date.now()}_${Math.random()}`,
            title: `+${item.amount} METAL`,
            subtitle: `Total: ${engine.metal}`,
            icon: '🔩',
            amount: `+${item.amount}`,
            type: 'material',
            color: '#94a3b8',
            timestamp: Date.now(),
          });
        }
      } else if (item.type === 'shield') {
        engine.shield = Math.min(engine.maxShield, engine.shield + 25);
        engine.callbacks.onHealthChange(engine.health, engine.shield);
        if (engine.callbacks.onItemCollected) {
          engine.callbacks.onItemCollected({
            id: `col_drop_${Date.now()}_${Math.random()}`,
            title: `+2 Mini Shield Potions`,
            subtitle: `Shield: ${Math.round(engine.shield)}/${engine.maxShield}`,
            icon: '🛡️',
            amount: '+25 Shield',
            type: 'shield',
            color: '#38bdf8',
            timestamp: Date.now(),
          });
        }
      }

      engine.callbacks.onMaterialsChange(engine.wood, engine.stone, engine.metal);
      fortniteAudio.playSupplyPickup(item.type);

      if (mesh) engine.scene.remove(mesh);
      engine.supplyMeshes.delete(item.id);
      engine.droppedSupplies.splice(i, 1);
    }
  }

  // 2. Parachute Supply Drop Boxes
  for (const box of engine.supplyDropBoxes) {
    if (!box.isLanded) {
      box.y += box.vy * dt;
      const groundH = getTerrainHeight(box.x, box.z) + 1.1;
      if (box.y <= groundH) {
        box.y = groundH;
        box.isLanded = true;
        const balloon = box.group.getObjectByName('balloon');
        if (balloon) balloon.visible = false;
        fortniteAudio.playTouchdown();
      }
      box.group.position.set(box.x, box.y, box.z);
    }
  }

  // 3. Spawn periodic supply drops every 45s
  engine.nextSupplyDropTimer -= dt;
  if (engine.nextSupplyDropTimer <= 0) {
    engine.nextSupplyDropTimer = 45.0;
    engine.spawnPeriodicSupplyDrop();
  }
}

export function interactChestOrItemImpl(engine: FortniteEngine) {
  // 0. Check if near Reset Pedestal (in 1v1 Arena Mode)
  if (engine.resetPedestalPos) {
    const pDist = engine.playerPos.distanceTo(
      new THREE.Vector3(engine.resetPedestalPos.x, engine.resetPedestalPos.y, engine.resetPedestalPos.z)
    );
    if (pDist < 4.5) {
      engine.resetAllBuildings();
      return;
    }
  }

  // 0.1 Check if near Upgrade Bench
  for (const bench of engine.upgradeBenches) {
    const bDist = engine.playerPos.distanceTo(new THREE.Vector3(bench.x, bench.y, bench.z));
    if (bDist < 4.5) {
      if (engine.callbacks.onOpenShop) {
        engine.callbacks.onOpenShop();
      }
      return;
    }
  }

  // 1. Check if near any Vehicle (Enter / Drive)
  if (engine.activeVehicle) {
    engine.exitVehicle();
    return;
  }

  for (const v of engine.vehicles) {
    const vPos = new THREE.Vector3(v.x, v.y, v.z);
    if (engine.playerPos.distanceTo(vPos) < 4.2) {
      engine.enterVehicle(v);
      return;
    }
  }

  // 2. Check if near any Supply Drop Box
  for (const box of engine.supplyDropBoxes) {
    if (box.isLanded) {
      const bPos = new THREE.Vector3(box.x, box.y, box.z);
      if (engine.playerPos.distanceTo(bPos) < 4.0) {
        engine.scene.remove(box.group);
        engine.supplyDropBoxes = engine.supplyDropBoxes.filter((b) => b.id !== box.id);
        engine.dropLootFromChest({ id: box.id, x: box.x, y: box.y, z: box.z, rotY: 0, isOpened: false, tier: 'rare_chest' });
        fortniteAudio.playChestOpen();

        if (engine.callbacks.onItemCollected) {
          engine.callbacks.onItemCollected({
            id: `col_dropbox_${Date.now()}`,
            title: 'Supply Drop Claimed!',
            subtitle: 'Legendary High-Tier Armory Loot',
            icon: '🪂',
            rarity: 'legendary',
            type: 'supply_drop',
            color: '#3b82f6',
            timestamp: Date.now(),
          });
        }
        return;
      }
    }
  }

  // 3. Check if near any Ground Weapon to swap/pickup
  for (let i = 0; i < engine.droppedSupplies.length; i++) {
    const item = engine.droppedSupplies[i];
    if (item.type === 'weapon' && item.weapon) {
      const iPos = new THREE.Vector3(item.x, item.y, item.z);
      if (engine.playerPos.distanceTo(iPos) < 3.8) {
        const currentHeld = engine.inventory[engine.activeSlot];
        engine.inventory[engine.activeSlot] = { ...item.weapon };

        // Remove item from ground
        const mesh = engine.supplyMeshes.get(item.id);
        if (mesh) engine.scene.remove(mesh);
        engine.supplyMeshes.delete(item.id);
        engine.droppedSupplies.splice(i, 1);

        // If previously had weapon, drop it
        if (currentHeld && currentHeld.type !== 'pickaxe') {
          engine.spawnDroppedSupplies(engine.playerPos.x, engine.playerPos.y, engine.playerPos.z, currentHeld);
        }

        engine.updateWeaponRigs();
        engine.callbacks.onInventoryChange(engine.inventory, engine.activeSlot);
        fortniteAudio.playSupplyPickup('weapon');

        if (engine.callbacks.onItemCollected) {
          engine.callbacks.onItemCollected({
            id: `col_wep_${Date.now()}`,
            title: `Equipped ${item.weapon.name}`,
            subtitle: `${item.weapon.rarity.toUpperCase()} • ${item.weapon.damage} DMG • Slot ${engine.activeSlot}`,
            icon: item.weapon.icon,
            rarity: item.weapon.rarity,
            type: 'weapon',
            color: item.weapon.color,
            timestamp: Date.now(),
          });
        }
        return;
      }
    }
  }

  // 4. Check Loot Chests
  for (const chest of engine.chests) {
    if (chest.isOpened) continue;
    const cPos = new THREE.Vector3(chest.x, chest.y, chest.z);
    if (engine.playerPos.distanceTo(cPos) < 4.5) {
      chest.isOpened = true;
      engine.chestsOpened++;
      fortniteAudio.playChestOpen();

      const group = engine.chestMeshes.get(chest.id);
      if (group) {
        const lid = group.getObjectByName('chest_lid');
        if (lid) lid.rotateZ(-Math.PI / 3);
      }

      engine.dropLootFromChest(chest);
      return;
    }
  }
}

export function dropLootFromChestImpl(engine: FortniteEngine, chest: LootChest) {
  const rareGuns = [
    WEAPON_REGISTRY.ar_scar,
    WEAPON_REGISTRY.shotgun_pump_legendary,
    WEAPON_REGISTRY.sniper_bolt_legendary,
    WEAPON_REGISTRY.smg_p90_epic,
    WEAPON_REGISTRY.rpg_legendary,
    WEAPON_REGISTRY.shotgun_tac_legendary,
    WEAPON_REGISTRY.blade_kinetic_exotic,
    WEAPON_REGISTRY.minigun_legendary,
    WEAPON_REGISTRY.chug_splash,
    WEAPON_REGISTRY.chug_jug,
  ].filter(Boolean);

  const pickedGun = (rareGuns.length > 0
    ? rareGuns[Math.floor(Math.random() * rareGuns.length)]
    : WEAPON_REGISTRY.ar_scar) || WEAPON_REGISTRY.ar_scar;

  const emptySlot = engine.inventory.findIndex((s, idx) => idx > 0 && s === null);
  if (emptySlot !== -1) {
    engine.inventory[emptySlot] = { ...pickedGun };
    engine.callbacks.onInventoryChange(engine.inventory, engine.activeSlot);
  } else {
    engine.spawnDroppedSupplies(chest.x, chest.y + 0.5, chest.z, pickedGun);
  }

  engine.wood = Math.min(999, engine.wood + 80);
  engine.shield = Math.min(engine.maxShield, engine.shield + 50);
  engine.gold = Math.min(9999, engine.gold + 75);
  engine.callbacks.onMaterialsChange(engine.wood, engine.stone, engine.metal);
  engine.callbacks.onHealthChange(engine.health, engine.shield);
  engine.callbacks.onGoldChange?.(engine.gold);

  if (engine.callbacks.onItemCollected) {
    engine.callbacks.onItemCollected({
      id: `col_chest_${Date.now()}`,
      title: 'Opened Loot Chest',
      subtitle: `+80 Wood • +50 Shield • +75 Gold • ${pickedGun?.name || 'Legendary Loot'}`,
      icon: '📦',
      rarity: pickedGun?.rarity || 'legendary',
      type: 'chest',
      color: '#f59e0b',
      timestamp: Date.now(),
    });
  }
}
