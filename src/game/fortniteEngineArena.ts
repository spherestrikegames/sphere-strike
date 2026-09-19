// 1v1 arena resets, shop upgrades, skins, bot difficulty & bot building.
import * as THREE from 'three';
import { BuildingPiece, BotPlayer, BuildType, MaterialType, WeaponRarity } from '../types';
import { WEAPON_REGISTRY, SHOP_CATALOG, RARITY_COLORS } from '../data/fortniteData';
import { createPlacedBuildingMesh, snapToBuildGrid, MATERIAL_STATS } from './fortniteBuilding';
import { buildCharacterModel, createNameTagSprite, updateNameTagSprite } from './fortniteCharacter';
import { fortniteAudio } from '../utils/audio';
import type { FortniteEngine } from './fortniteEngine';
import { getBotDifficultyConfig } from './fortniteEngine';


export function resetAllBuildingsImpl(engine: FortniteEngine) {
  for (const [, item] of engine.buildingPieces) {
    engine.scene.remove(item.mesh);
  }
  engine.buildingPieces.clear();
  engine.spatialGrid.clearBuildingPieces();
  fortniteAudio.playHarvestHit('metal', true);

  if (engine.callbacks.onItemCollected) {
    engine.callbacks.onItemCollected({
      id: `reset_${Date.now()}`,
      title: 'Arena Builds Reset!',
      subtitle: 'All structures demolished instantly',
      icon: '🧹',
      type: 'material',
      color: '#38bdf8',
      timestamp: Date.now(),
    });
  }
}

export function spawnArenaGroundLootImpl(engine: FortniteEngine) {
  // Clear old arena dropped loot meshes from the scene
  for (const supply of engine.droppedSupplies) {
    const mesh = engine.supplyMeshes.get(supply.id);
    if (mesh) {
      engine.scene.remove(mesh);
    }
  }
  engine.droppedSupplies = [];
  engine.supplyMeshes.clear();

  // Spread iconic weapons and consumables directly across the arena floor
  const arenaLootSpots: { x: number; z: number; weaponKey: string }[] = [
    { x: -12, z: 0, weaponKey: 'ar_scar' },
    { x: 12, z: 0, weaponKey: 'shotgun_pump_legendary' },
    { x: -8, z: 12, weaponKey: 'shotgun_tac_legendary' },
    { x: 8, z: 12, weaponKey: 'smg_combat_legendary' },
    { x: -14, z: -10, weaponKey: 'sniper_heavy_legendary' },
    { x: 14, z: -10, weaponKey: 'rpg_legendary' },
    { x: 0, z: -14, weaponKey: 'blade_kinetic_exotic' },
    { x: 0, z: 14, weaponKey: 'chug_jug' },
    { x: -6, z: -6, weaponKey: 'mini_shields' },
    { x: 6, z: -6, weaponKey: 'slurp_juice' },
    { x: -16, z: 6, weaponKey: 'smg_p90_epic' },
    { x: 16, z: 6, weaponKey: 'ar_burst_epic' },
  ];

  for (const spot of arenaLootSpots) {
    const wep = WEAPON_REGISTRY[spot.weaponKey];
    if (wep) {
      engine.spawnDroppedSupplies(spot.x, 0.2, spot.z, { ...wep });
    }
  }
}

export function updatePlayerSkinImpl(engine: FortniteEngine, skinId: string) {
  engine.profile.selectedSkin = skinId;
  if (engine.thirdPersonRig) {
    engine.scene.remove(engine.thirdPersonRig.root);
  }
  const currentWep = engine.getCurrentWeapon();
  const type = currentWep ? currentWep.type : 'pickaxe';
  const rarity = currentWep ? currentWep.rarity : 'common';
  engine.thirdPersonRig = buildCharacterModel(skinId, type, rarity);

  engine.playerNameTag = createNameTagSprite(
    engine.profile.name || 'Player',
    false,
    engine.playerTeam,
    Math.max(0, engine.health / engine.maxHealth),
    Math.max(0, engine.shield / engine.maxShield)
  );
  engine.thirdPersonRig.root.add(engine.playerNameTag);
  engine.thirdPersonRig.root.visible = !engine.isFirstPerson;
  engine.scene.add(engine.thirdPersonRig.root);
}

export function reset1v1RoundImpl(engine: FortniteEngine, winner: 'player' | 'bot') {
  engine.resetAllBuildings();
  engine.spawnArenaGroundLoot();
  engine.arena1v1State.round++;
  engine.arena1v1State.isRoundOver = false;
  engine.arena1v1State.roundWinner = null;
  engine.arena1v1State.countdown = 0;
  engine.callbacks.onArena1v1Update?.({ ...engine.arena1v1State });

  // Reset Player to High Health (300 HP + 300 Shield = 600 Total HP) & 0 builds
  engine.health = 300;
  engine.shield = 300;
  engine.wood = 0;
  engine.stone = 0;
  engine.metal = 0;
  engine.playerPos.set(engine.playerSpawnPos.x, engine.playerSpawnPos.y + 0.2, engine.playerSpawnPos.z);
  engine.playerVel.set(0, 0, 0);
  engine.playerRotY = 0;
  engine.playerPitch = 0;
  engine.callbacks.onHealthChange(engine.health, engine.shield);
  engine.callbacks.onMaterialsChange(engine.wood, engine.stone, engine.metal);

  // Reset Bot to High Health (300 HP + 300 Shield)
  const diff = engine.arena1v1State.botDifficulty || 'pro';
  const config = getBotDifficultyConfig(diff);

  for (const bot of engine.bots) {
    bot.isAlive = true;
    bot.name = config.name;
    bot.accuracy = config.accuracy;
    bot.reactionTimer = config.reactionTimer;
    bot.health = 300;
    bot.shield = 300;
    bot.x = engine.botSpawnPos.x;
    bot.y = engine.botSpawnPos.y + 0.2;
    bot.z = engine.botSpawnPos.z;
    bot.vx = 0;
    bot.vy = 0;
    bot.vz = 0;
    bot.rotY = Math.PI;
    bot.state = 'combat';

    const rig = engine.botMeshes.get(bot.id);
    if (rig) {
      rig.root.position.set(bot.x, bot.y, bot.z);
      engine.scene.add(rig.root);
    }
    const nTag = engine.botNameTags.get(bot.id);
    if (nTag) {
      updateNameTagSprite(nTag, bot.name, true, bot.team, 1.0, 1.0);
      engine.scene.add(nTag);
    }
  }
  fortniteAudio.startGameMusic();
}

export function setBotDifficultyImpl(engine: FortniteEngine, difficulty: 'casual' | 'normal' | 'pro' | 'god') {
  engine.arena1v1State.botDifficulty = difficulty;
  const config = getBotDifficultyConfig(difficulty);

  for (const bot of engine.bots) {
    if (engine.mode === '1v1_build_fight') {
      bot.name = config.name;
      bot.accuracy = config.accuracy;
      bot.reactionTimer = config.reactionTimer;

      const nTag = engine.botNameTags.get(bot.id);
      if (nTag) {
        updateNameTagSprite(
          nTag,
          bot.name,
          true,
          bot.team,
          Math.max(0, bot.health / 300),
          Math.max(0, bot.shield / 300)
        );
      }
    }
  }

  engine.callbacks.onArena1v1Update?.({ ...engine.arena1v1State });

  if (engine.callbacks.onItemCollected) {
    engine.callbacks.onItemCollected({
      id: `diff_${Date.now()}`,
      title: `AI Difficulty: ${difficulty.toUpperCase()}`,
      subtitle: `${config.name} is now active`,
      icon: '⚡',
      type: 'weapon',
      color: difficulty === 'god' ? '#ef4444' : difficulty === 'pro' ? '#f59e0b' : difficulty === 'normal' ? '#eab308' : '#22c55e',
      timestamp: Date.now(),
    });
  }
}

export function placeBotPieceImpl(engine: FortniteEngine, bot: BotPlayer, type: BuildType, material: MaterialType = 'wood') {
  const pieceId = `bot_build_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const botPos = new THREE.Vector3(bot.x, bot.y, bot.z);
  const lookDir = new THREE.Vector3(-Math.sin(bot.rotY), 0.2, -Math.cos(bot.rotY));
  const snapped = snapToBuildGrid(botPos, lookDir, type);
  const matInfo = MATERIAL_STATS[material];

  const piece: BuildingPiece = {
    id: pieceId,
    type,
    material,
    x: snapped.x,
    y: snapped.y,
    z: snapped.z,
    rotY: snapped.rotY,
    health: matInfo.initialHp,
    maxHealth: matInfo.maxHp,
    ownerId: bot.id,
    createdAt: Date.now(),
  };

  const mesh = createPlacedBuildingMesh(piece);
  engine.scene.add(mesh);
  engine.buildingPieces.set(pieceId, { piece, mesh });
  engine.spatialGrid.addBuildingPiece(piece);
  fortniteAudio.playBuildPlace(material);
}

export function upgradeEquippedWeaponImpl(engine: FortniteEngine, slotIndex: number): boolean {
  const wep = engine.inventory[slotIndex];
  if (!wep || wep.type === 'pickaxe') return false;

  const currentRarity = wep.rarity;
  let nextRarity: WeaponRarity = 'uncommon';
  let cost = 150;

  if (currentRarity === 'common') {
    nextRarity = 'uncommon';
    cost = 150;
  } else if (currentRarity === 'uncommon') {
    nextRarity = 'rare';
    cost = 250;
  } else if (currentRarity === 'rare') {
    nextRarity = 'epic';
    cost = 400;
  } else if (currentRarity === 'epic') {
    nextRarity = 'legendary';
    cost = 600;
  } else if (currentRarity === 'legendary') {
    nextRarity = 'mythic';
    cost = 1000;
  } else {
    return false; // Already max
  }

  if (engine.gold < cost) {
    fortniteAudio.playUiClick();
    return false;
  }

  engine.gold -= cost;
  wep.rarity = nextRarity;
  wep.damage = Math.round(wep.damage * 1.18);
  wep.reloadTime = Math.max(0.8, Number((wep.reloadTime * 0.88).toFixed(2)));
  wep.color = RARITY_COLORS[nextRarity].hex;
  wep.name = `${wep.name.replace(/^(Common|Uncommon|Rare|Epic|Legendary|Mythic)\s*/i, '')} (${nextRarity.toUpperCase()})`;

  fortniteAudio.playPurchaseSuccess();
  engine.callbacks.onGoldChange?.(engine.gold);
  engine.callbacks.onInventoryChange(engine.inventory, engine.activeSlot);
  engine.updateWeaponRigs();

  if (engine.callbacks.onItemCollected) {
    engine.callbacks.onItemCollected({
      id: `upgrade_${Date.now()}`,
      title: `Upgraded to ${nextRarity.toUpperCase()}!`,
      subtitle: `-${cost} Gold • Damage: ${wep.damage}`,
      icon: '⭐',
      rarity: nextRarity,
      type: 'weapon',
      color: wep.color,
      timestamp: Date.now(),
    });
  }
  return true;
}

export function attachWeaponModImpl(engine: FortniteEngine, slotIndex: number, modId: string): boolean {
  const wep = engine.inventory[slotIndex];
  if (!wep || wep.type === 'pickaxe') return false;

  const mod = SHOP_CATALOG.mods.find((m) => m.id === modId);
  if (!mod || engine.gold < mod.costGold) return false;

  if (!wep.mods) wep.mods = {};
  const modType = mod.type as keyof typeof wep.mods;
  if (wep.mods[modType]) return false;

  engine.gold -= mod.costGold;
  (wep.mods as any)[modType] = mod.bonus;

  if (mod.type === 'damageBonus') wep.damage = Math.round(wep.damage * (1 + mod.bonus));
  if (mod.type === 'spreadBonus') wep.spread = Math.max(0.001, wep.spread * (1 - mod.bonus));
  if (mod.type === 'magBonus') {
    wep.magazineSize += Math.round(mod.bonus);
    wep.currentAmmo += Math.round(mod.bonus);
  }
  if (mod.type === 'reloadBonus') wep.reloadTime = Math.max(0.8, Number((wep.reloadTime * (1 - mod.bonus)).toFixed(2)));

  fortniteAudio.playPurchaseSuccess();
  engine.callbacks.onGoldChange?.(engine.gold);
  engine.callbacks.onInventoryChange(engine.inventory, engine.activeSlot);

  if (engine.callbacks.onItemCollected) {
    engine.callbacks.onItemCollected({
      id: `mod_${Date.now()}`,
      title: `Attached ${mod.name}!`,
      subtitle: `${mod.desc}`,
      icon: mod.icon,
      type: 'weapon',
      color: '#a855f7',
      timestamp: Date.now(),
    });
  }
  return true;
}

export function buyHealthPackImpl(engine: FortniteEngine, item: any): boolean {
  const cost = item.costGold || item.cost || 100;
  if (engine.gold < cost) return false;

  const regWep = WEAPON_REGISTRY[item.id];
  const emptySlot = engine.inventory.findIndex((s, idx) => idx > 0 && s === null);
  if (emptySlot === -1 || !regWep) {
    if (item.shieldBonus || item.shieldAmount) engine.shield = Math.min(engine.maxShield, engine.shield + (item.shieldBonus || item.shieldAmount || 50));
    if (item.healthBonus || item.healAmount) engine.health = Math.min(engine.maxHealth, engine.health + (item.healthBonus || item.healAmount || 50));
    engine.callbacks.onHealthChange(engine.health, engine.shield);
  } else {
    engine.inventory[emptySlot] = { ...regWep };
    engine.callbacks.onInventoryChange(engine.inventory, engine.activeSlot);
  }

  engine.gold -= cost;
  fortniteAudio.playSupplyPickup('shield');
  engine.callbacks.onGoldChange?.(engine.gold);

  if (engine.callbacks.onItemCollected) {
    engine.callbacks.onItemCollected({
      id: `buy_hp_${Date.now()}`,
      title: `Purchased ${item.name}`,
      subtitle: `-${cost} Gold`,
      icon: item.icon || '🧪',
      type: 'shield',
      color: '#06b6d4',
      timestamp: Date.now(),
    });
  }
  return true;
}

export function buyMaterialsImpl(engine: FortniteEngine, type: 'wood' | 'stone' | 'metal', amount: number, cost: number): boolean {
  if (engine.gold < cost) return false;
  engine.gold -= cost;

  if (type === 'wood') engine.wood = Math.min(999, engine.wood + amount);
  else if (type === 'stone') engine.stone = Math.min(999, engine.stone + amount);
  else if (type === 'metal') engine.metal = Math.min(999, engine.metal + amount);

  fortniteAudio.playSupplyPickup('wood');
  engine.callbacks.onGoldChange?.(engine.gold);
  engine.callbacks.onMaterialsChange(engine.wood, engine.stone, engine.metal);

  if (engine.callbacks.onItemCollected) {
    engine.callbacks.onItemCollected({
      id: `buy_mat_${Date.now()}`,
      title: `+${amount} ${type.toUpperCase()}`,
      subtitle: `-${cost} Gold`,
      icon: type === 'wood' ? '🪵' : type === 'stone' ? '🪨' : '🔩',
      type: 'material',
      color: type === 'wood' ? '#f59e0b' : type === 'stone' ? '#a8a29e' : '#94a3b8',
      timestamp: Date.now(),
    });
  }
  return true;
}
