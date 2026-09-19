// Bot eliminations and match/round victory resolution.
import * as THREE from 'three';
import { EliminationLog, BotPlayer, MatchStats, EliminationBannerData } from '../types';
import { fortniteAudio } from '../utils/audio';
import type { FortniteEngine } from './fortniteEngine';


export function eliminateBotImpl(engine: FortniteEngine, bot: BotPlayer, isHeadshot: boolean, weaponName: string) {
  bot.isAlive = false;
  const rig = engine.botMeshes.get(bot.id);
  if (rig) {
    engine.scene.remove(rig.root);
  }

  // Spawn Dropped Supplies at bot's location!
  engine.spawnDroppedSupplies(bot.x, bot.y, bot.z, bot.weapon);

  engine.eliminations++;
  engine.gold = Math.min(9999, engine.gold + 150);
  engine.callbacks.onGoldChange?.(engine.gold);
  fortniteAudio.playEliminationFanfare(isHeadshot);

  // Apply Armory Siphon Perk if unlocked
  if (engine.profile?.armoryPerks?.siphonShield) {
    const siphonAmount = 35;
    if (engine.shield < engine.maxShield) {
      engine.shield = Math.min(engine.maxShield, engine.shield + siphonAmount);
    } else if (engine.health < engine.maxHealth) {
      engine.health = Math.min(engine.maxHealth, engine.health + siphonAmount);
    }
    engine.callbacks.onHealthChange(engine.health, engine.shield);
    engine.addDamageNumber('+35 SIPHON SHIELD 🩸', '#06b6d4', false, false, engine.playerPos.x, engine.playerPos.y + 2.0, engine.playerPos.z);
  }

  const distToBot = Math.round(engine.playerPos.distanceTo(new THREE.Vector3(bot.x, bot.y, bot.z)));
  const xpEarned = isHeadshot ? 150 : 100;

  // Celebratory 3D floating numbers
  engine.addDamageNumber(
    isHeadshot ? '🎯 HEADSHOT ELIMINATION!' : '💀 ELIMINATED!',
    isHeadshot ? '#fbbf24' : '#ef4444',
    isHeadshot,
    false,
    bot.x,
    bot.y + 2.6,
    bot.z
  );
  engine.addDamageNumber(
    `+${xpEarned} XP • +150 GOLD • +40 🅢 (COINS)`,
    '#38bdf8',
    false,
    false,
    bot.x,
    bot.y + 3.4,
    bot.z
  );

  const currentWep = engine.getCurrentWeapon();
  const bannerData: EliminationBannerData = {
    id: `elim_banner_${Date.now()}`,
    victim: bot.name,
    weaponName: weaponName || (currentWep ? currentWep.name : 'Harvesting Tool'),
    weaponIcon: currentWep ? currentWep.icon : '⛏️',
    rarity: currentWep ? currentWep.rarity : 'common',
    isHeadshot,
    eliminationCount: engine.eliminations,
    distance: distToBot,
    xpEarned,
    timestamp: Date.now(),
  };

  if (engine.callbacks.onEliminationBanner) {
    engine.callbacks.onEliminationBanner(bannerData);
  }

  const log: EliminationLog = {
    id: `elim_${Date.now()}`,
    killer: engine.profile.name || 'You',
    victim: bot.name,
    weaponName: bannerData.weaponName,
    isHeadshot,
    time: Date.now(),
  };
  engine.callbacks.onElimination(log);

  // 1v1 Arena Mode Round Scoring
  if (engine.mode === '1v1_build_fight') {
    engine.arena1v1State.playerScore++;
    engine.callbacks.onArena1v1Update?.({ ...engine.arena1v1State });

    if (engine.arena1v1State.playerScore >= 3) {
      engine.triggerVictoryRoyale();
    } else {
      engine.arena1v1State.isRoundOver = true;
      engine.arena1v1State.roundWinner = 'player';
      engine.arena1v1State.countdown = 3;
      engine.roundCountdownTimer = 0;
      engine.callbacks.onArena1v1Update?.({ ...engine.arena1v1State });
    }
    return;
  }

  engine.updatePlayersLeftCount();

  // End game with Victory Royale when player's team is the only one left
  engine.checkTeamVictoryCondition();
}

export function checkTeamVictoryConditionImpl(engine: FortniteEngine) {
  if (engine.isGameOver) return;
  if (engine.mode === '1v1_build_fight') return;
  if (engine.mode === 'battle_royale') {
    const aliveRemotes = Array.from(engine.remotePlayers.values()).filter((r) => r.state.isAlive);
    if (engine.remotePlayers.size > 0 && aliveRemotes.length === 0 && engine.health > 0) {
      engine.triggerVictoryRoyale();
    }
    return;
  }
  const aliveEnemyBots = engine.bots.filter((b) => b.isAlive && b.team !== engine.playerTeam);
  const aliveRemotes = Array.from(engine.remotePlayers.values()).filter((r) => r.state.isAlive);
  if (aliveEnemyBots.length === 0 && aliveRemotes.length === 0) {
    engine.triggerVictoryRoyale();
  }
}

export function triggerVictoryRoyaleImpl(engine: FortniteEngine) {
  if (engine.isGameOver) return;
  engine.isGameOver = true;
  fortniteAudio.playVictoryRoyale();

  // Economy & Rewards: Base match completion coins + 40 coins per AI bot eliminated
  const baseCoins = 100;
  const eliminationBonusCoins = engine.eliminations * 40;
  const vbucksEarned = baseCoins + eliminationBonusCoins;

  const stats: MatchStats = {
    placement: 1,
    totalPlayers: engine.mode === 'battle_royale' ? Math.max(2, engine.remotePlayers.size + 1) : engine.bots.length + 1,
    eliminations: engine.eliminations,
    damageDealt: engine.damageDealt,
    damageTaken: engine.damageTaken,
    structuresBuilt: engine.structuresBuilt,
    chestsOpened: engine.chestsOpened,
    accuracy: engine.shotsFired > 0 ? Math.round((engine.shotsHit / engine.shotsFired) * 100) : 0,
    shotsFired: engine.shotsFired,
    shotsHit: engine.shotsHit,
    timeSurvived: Math.floor((Date.now() - engine.matchStartTime) / 1000),
    xpEarned: 1400 + engine.eliminations * 250,
    vbucksEarned,
    baseCoins,
    eliminationBonusCoins,
  };

  engine.callbacks.onMatchEnd(true, stats);
}

export function triggerEliminatedImpl(engine: FortniteEngine) {
  if (engine.isGameOver) return;

  if (engine.mode === 'battle_royale') {
    if (engine.myRespawnsUsed <= engine.maxRespawns && !engine.isRespawning) {
      engine.handleBattleRoyaleLocalDeath();
      return;
    }
  }

  if (engine.mode === '1v1_build_fight') {
    engine.arena1v1State.botScore++;
    engine.callbacks.onArena1v1Update?.({ ...engine.arena1v1State });

    if (engine.arena1v1State.botScore >= 3) {
      engine.isGameOver = true;
      const baseCoins = 50;
      const eliminationBonusCoins = engine.eliminations * 40;
      const vbucksEarned = baseCoins + eliminationBonusCoins;

      const stats: MatchStats = {
        placement: 2,
        totalPlayers: 2,
        eliminations: engine.eliminations,
        damageDealt: engine.damageDealt,
        damageTaken: engine.damageTaken,
        structuresBuilt: engine.structuresBuilt,
        chestsOpened: engine.chestsOpened,
        accuracy: engine.shotsFired > 0 ? Math.round((engine.shotsHit / engine.shotsFired) * 100) : 0,
        shotsFired: engine.shotsFired,
        shotsHit: engine.shotsHit,
        timeSurvived: Math.floor((Date.now() - engine.matchStartTime) / 1000),
        xpEarned: 600 + engine.eliminations * 150,
        vbucksEarned,
        baseCoins,
        eliminationBonusCoins,
      };
      engine.callbacks.onMatchEnd(false, stats);
    } else {
      engine.arena1v1State.isRoundOver = true;
      engine.arena1v1State.roundWinner = 'bot';
      engine.arena1v1State.countdown = 3;
      engine.roundCountdownTimer = 0;
      engine.callbacks.onArena1v1Update?.({ ...engine.arena1v1State });
    }
    return;
  }

  engine.isGameOver = true;
  const remaining = engine.mode === 'battle_royale' ? 2 : engine.bots.filter((b) => b.isAlive).length + 1;
  const totalPlayers = engine.mode === 'battle_royale' ? Math.max(2, engine.remotePlayers.size + 1) : engine.bots.length + 1;
  const baseCoins = 50;
  const eliminationBonusCoins = engine.eliminations * 40;
  const vbucksEarned = baseCoins + eliminationBonusCoins;

  const stats: MatchStats = {
    placement: remaining,
    totalPlayers,
    eliminations: engine.eliminations,
    damageDealt: engine.damageDealt,
    damageTaken: engine.damageTaken,
    structuresBuilt: engine.structuresBuilt,
    chestsOpened: engine.chestsOpened,
    accuracy: engine.shotsFired > 0 ? Math.round((engine.shotsHit / engine.shotsFired) * 100) : 0,
    shotsFired: engine.shotsFired,
    shotsHit: engine.shotsHit,
    timeSurvived: Math.floor((Date.now() - engine.matchStartTime) / 1000),
    xpEarned: 500 + engine.eliminations * 150,
    vbucksEarned,
    baseCoins,
    eliminationBonusCoins,
  };

  engine.callbacks.onMatchEnd(false, stats);
}
