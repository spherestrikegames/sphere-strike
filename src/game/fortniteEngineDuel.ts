// Battle-royale duel/respawn flow and remote-player damage sync.
import { RemotePlayerState, BattleRoyaleDuelState } from '../types';
import { CharacterMeshRig } from './fortniteCharacter';
import { fortniteAudio } from '../utils/audio';
import { multiplayerClient } from '../utils/multiplayer';
import type { FortniteEngine } from './fortniteEngine';


export function updatePlayersLeftCountImpl(engine: FortniteEngine) {
  const aliveBots = engine.mode === 'battle_royale' ? 0 : engine.bots.filter((b) => b.isAlive).length;
  const aliveRemotes = Array.from(engine.remotePlayers.values()).filter((r) => r.state.isAlive).length;
  const isPlayerAlive = !engine.isGameOver && engine.health > 0 ? 1 : 0;
  const total = aliveBots + aliveRemotes + isPlayerAlive;
  engine.callbacks.onPlayersLeftChange(total);

  if (engine.mode === 'battle_royale') {
    // In Battle Royale PvP friend duel, victory is governed by exceeding 3 respawns
    for (const [_, remote] of engine.remotePlayers) {
      if ((remote.respawnsUsed || 0) > engine.maxRespawns && !engine.isGameOver) {
        engine.triggerVictoryRoyale();
        return;
      }
    }
  } else {
    if (aliveBots === 0 && aliveRemotes === 0 && isPlayerAlive === 1 && (engine.bots.length > 0 || engine.remotePlayers.size > 0)) {
      engine.triggerVictoryRoyale();
    }
  }
}

export function updateDuelStateImpl(engine: FortniteEngine, customMessage: string | null = null) {
  if (engine.mode !== 'battle_royale') return;

  let friendName = 'Friend / Opponent';
  let friendRespawnsUsed = 0;
  let isDuelActive = false;
  let friendDistance: number | null = null;

  for (const [_, remote] of engine.remotePlayers) {
    friendName = remote.state.name;
    friendRespawnsUsed = remote.respawnsUsed || 0;
    isDuelActive = true;
    if (remote.state.isAlive) {
      friendDistance = Math.round(
        Math.hypot(remote.state.x - engine.playerPos.x, remote.state.z - engine.playerPos.z)
      );
    }
    break;
  }

  const duel: BattleRoyaleDuelState = {
    myRespawnsUsed: engine.myRespawnsUsed,
    friendRespawnsUsed,
    maxRespawns: engine.maxRespawns,
    friendName,
    isDuelActive,
    respawnCountdown: engine.isRespawning ? Math.max(1, Math.ceil(engine.respawnCountdown)) : null,
    duelMessage: customMessage,
    friendDistance,
  };

  engine.callbacks.onDuelUpdate?.(duel);
}

export function handleBattleRoyaleLocalDeathImpl(engine: FortniteEngine, attackerName?: string, weaponName?: string, isHeadshot?: boolean) {
  if (engine.isRespawning || engine.isGameOver) return;
  engine.myRespawnsUsed++;

  if (engine.myRespawnsUsed <= engine.maxRespawns) {
    // Local player respawns! (1st, 2nd, or 3rd respawn)
    engine.isRespawning = true;
    engine.respawnCountdown = 3.0;

    fortniteAudio.playEliminationSound();
    engine.callbacks.onElimination({
      id: 'elim_' + Date.now(),
      killer: attackerName || 'Enemy Player',
      victim: engine.profile.name,
      weaponName: weaponName || 'Combat Duel',
      isHeadshot: !!isHeadshot,
      time: Date.now(),
    });

    const left = Math.max(0, engine.maxRespawns - engine.myRespawnsUsed);
    engine.updateDuelState(
      `Eliminated by ${attackerName || 'Enemy'}! Respawning in 3s... (${engine.myRespawnsUsed}/3 respawns used - ${left} left)`
    );

    // Tell friend we're respawning
    multiplayerClient.sendPlayerAction({
      type: 'player_respawning',
      victimId: multiplayerClient.myPlayerId,
      victimName: engine.profile.name,
      respawnsUsed: engine.myRespawnsUsed,
      maxRespawns: engine.maxRespawns,
    });

    setTimeout(() => {
      if (!engine.isGameOver) {
        engine.executeRespawn();
      }
    }, 3000);
  } else {
    // Local player has respawned MORE THAN 3 TIMES (eliminated 4th time)!
    // Out of respawns -> FRIEND WINS!
    engine.updateDuelState(`Out of respawns (3/3 used)! ${attackerName || 'Friend'} wins the duel!`);

    multiplayerClient.sendPlayerAction({
      type: 'friend_final_elimination',
      victimId: multiplayerClient.myPlayerId,
      victimName: engine.profile.name,
      killerName: attackerName || 'Online Player',
      weaponName: weaponName || 'Combat Duel',
    });

    engine.triggerEliminated();
  }
}

export function executeRespawnImpl(engine: FortniteEngine) {
  engine.isRespawning = false;
  engine.respawnCountdown = 0;
  engine.health = 250;
  engine.shield = 100;

  // Pick a sky drop position above the island
  const spawnRadius = 35 + Math.random() * 35;
  const angle = Math.random() * Math.PI * 2;
  engine.playerPos.x = Math.cos(angle) * spawnRadius;
  engine.playerPos.z = Math.sin(angle) * spawnRadius;
  engine.playerPos.y = 135;
  engine.playerVel.set(0, -6, 0);

  // Refill ammo for all carried weapons
  for (const wep of engine.inventory) {
    if (wep && wep.type !== 'pickaxe') {
      wep.currentAmmo = wep.magazineSize;
      wep.reserveAmmo = Math.max(wep.reserveAmmo, wep.magazineSize * 4);
    }
  }
  engine.callbacks.onInventoryChange(engine.inventory, engine.activeSlot);

  engine.isSkydiving = true;
  engine.isGliding = true;
  engine.isInvulnerable = true;
  engine.invulnerableTimer = 3.5;

  fortniteAudio.playGliderDeploy();
  engine.callbacks.onHealthChange(250, 100);
  engine.callbacks.onSkydivingUpdate(true, true, 135);

  multiplayerClient.sendPlayerAction({
    type: 'player_respawned',
    playerId: multiplayerClient.myPlayerId,
    playerName: engine.profile.name,
    respawnsUsed: engine.myRespawnsUsed,
    x: engine.playerPos.x,
    y: engine.playerPos.y,
    z: engine.playerPos.z,
  });

  engine.updateDuelState();
}

export function damageRemotePlayerImpl(engine: FortniteEngine, remoteId: string,
    remote: { state: RemotePlayerState; rig: CharacterMeshRig; respawnsUsed?: number },
    dmg: number,
    isHeadshot: boolean,
    wepName: string) {
  engine.shotsHit++;
  const hadShield = remote.state.shield > 0;
  if (remote.state.shield > 0) {
    if (remote.state.shield >= dmg) {
      remote.state.shield -= dmg;
    } else {
      const rem = dmg - remote.state.shield;
      remote.state.shield = 0;
      remote.state.health = Math.max(0, remote.state.health - rem);
    }
  } else {
    remote.state.health = Math.max(0, remote.state.health - dmg);
  }

  engine.damageDealt += dmg;
  engine.callbacks.onHitmarker(isHeadshot, hadShield);
  fortniteAudio.playHitmarker(isHeadshot, hadShield);

  engine.addDamageNumber(
    dmg.toString(),
    isHeadshot ? '#fbbf24' : hadShield ? '#38bdf8' : '#ffffff',
    isHeadshot,
    hadShield,
    remote.state.x,
    remote.state.y + 2.2,
    remote.state.z
  );

  multiplayerClient.sendPlayerAction({
    type: 'damage_player',
    targetId: remoteId,
    damage: dmg,
    isHeadshot,
    attackerName: engine.profile.name,
    weaponName: wepName,
  });

  if (remote.state.health <= 0) {
    engine.handleRemotePlayerLethal(remoteId, remote, isHeadshot, wepName);
  }
}

export function handleRemotePlayerLethalImpl(engine: FortniteEngine, remoteId: string,
    remote: { state: RemotePlayerState; rig: CharacterMeshRig; respawnsUsed?: number },
    isHeadshot: boolean,
    wepName: string) {
  engine.eliminations++;
  fortniteAudio.playEliminationSound();
  engine.spawnDroppedSupplies(remote.state.x, remote.state.y, remote.state.z);

  if (engine.mode === 'battle_royale') {
    remote.respawnsUsed = (remote.respawnsUsed || 0) + 1;

    if (remote.respawnsUsed <= engine.maxRespawns) {
      // Friend respawns! (1, 2, or 3 respawns used)
      const respawnsRemaining = engine.maxRespawns - remote.respawnsUsed;

      engine.callbacks.onElimination({
        id: 'elim_' + Date.now(),
        killer: engine.profile.name,
        victim: remote.state.name,
        weaponName: wepName,
        isHeadshot,
        time: Date.now(),
      });

      engine.callbacks.onEliminationBanner?.({
        id: 'banner_' + Date.now(),
        victim: `${remote.state.name} (${remote.respawnsUsed}/3 Respawns)`,
        weaponName: wepName,
        isHeadshot,
        eliminationCount: engine.eliminations,
        xpEarned: 350,
        timestamp: Date.now(),
      });

      multiplayerClient.sendPlayerAction({
        type: 'friend_eliminated_respawn',
        targetId: remoteId,
        attackerName: engine.profile.name,
        victimName: remote.state.name,
        weaponName: wepName,
        isHeadshot,
        respawnsUsed: remote.respawnsUsed,
        maxRespawns: engine.maxRespawns,
      });

      engine.updateDuelState(
        `${remote.state.name} eliminated! Respawning (${remote.respawnsUsed}/3 used - ${respawnsRemaining} left)`
      );
    } else {
      // Friend has respawned MORE THAN 3 TIMES (eliminated for the 4th time)!
      // YOU WIN!
      remote.state.isAlive = false;
      remote.rig.root.visible = false;

      engine.callbacks.onElimination({
        id: 'elim_' + Date.now(),
        killer: engine.profile.name,
        victim: remote.state.name,
        weaponName: wepName,
        isHeadshot,
        time: Date.now(),
      });

      engine.callbacks.onEliminationBanner?.({
        id: 'banner_' + Date.now(),
        victim: `VICTORY ROYALE! ${remote.state.name}`,
        weaponName: wepName,
        isHeadshot,
        eliminationCount: engine.eliminations,
        xpEarned: 1200,
        timestamp: Date.now(),
      });

      multiplayerClient.sendPlayerAction({
        type: 'friend_final_elimination',
        victimId: remoteId,
        victimName: remote.state.name,
        killerName: engine.profile.name,
        weaponName: wepName,
      });

      engine.updateDuelState(`VICTORY ROYALE! ${remote.state.name} has exceeded 3 respawns!`);
      setTimeout(() => {
        engine.triggerVictoryRoyale();
      }, 1000);
    }
  } else {
    // Standard elimination
    remote.state.isAlive = false;
    remote.rig.root.visible = false;
    engine.callbacks.onElimination({
      id: 'elim_' + Date.now(),
      killer: engine.profile.name,
      victim: remote.state.name,
      weaponName: wepName,
      isHeadshot,
      time: Date.now(),
    });
    engine.callbacks.onEliminationBanner?.({
      id: 'banner_' + Date.now(),
      victim: remote.state.name,
      weaponName: wepName,
      isHeadshot,
      eliminationCount: engine.eliminations,
      xpEarned: 250,
      timestamp: Date.now(),
    });
    multiplayerClient.sendPlayerAction({
      type: 'player_eliminated',
      victimId: remoteId,
      victimName: remote.state.name,
      attackerName: engine.profile.name,
      weaponName: wepName,
      isHeadshot,
    });
    engine.updatePlayersLeftCount();
  }
}

export function applyDamageFromRemoteImpl(engine: FortniteEngine, dmg: number, isHeadshot: boolean, attackerName: string, weaponName: string) {
  if (engine.isGameOver || engine.health <= 0 || engine.isInvulnerable || engine.isRespawning) return;
  const hadShield = engine.shield > 0;
  if (engine.shield > 0) {
    if (engine.shield >= dmg) {
      engine.shield -= dmg;
    } else {
      const rem = dmg - engine.shield;
      engine.shield = 0;
      engine.health = Math.max(0, engine.health - rem);
    }
  } else {
    engine.health = Math.max(0, engine.health - dmg);
  }
  engine.damageTaken += dmg;
  engine.callbacks.onHealthChange(Math.max(0, Math.round(engine.health)), Math.max(0, Math.round(engine.shield)));
  engine.callbacks.onDamageTaken();
  fortniteAudio.playHitmarker(isHeadshot, hadShield);

  if (engine.health <= 0) {
    if (engine.mode === 'battle_royale') {
      engine.handleBattleRoyaleLocalDeath(attackerName, weaponName, isHeadshot);
    } else {
      multiplayerClient.sendPlayerAction({
        type: 'player_eliminated',
        victimId: multiplayerClient.myPlayerId,
        victimName: engine.profile.name,
        attackerName: attackerName || 'Online Player',
        weaponName: weaponName || 'Assault Rifle',
        isHeadshot,
      });
      engine.triggerEliminated();
    }
  }
}

export function updateNetworkSyncImpl(engine: FortniteEngine, now: number) {
  if (now - engine.lastNetworkSyncTime > 50) {
    engine.lastNetworkSyncTime = now;
    const currentWep = engine.getCurrentWeapon();
    multiplayerClient.sendPlayerSync({
      name: engine.profile.name,
      skinId: engine.profile.selectedSkin,
      x: engine.playerPos.x,
      y: engine.playerPos.y,
      z: engine.playerPos.z,
      rotY: engine.playerRotY,
      pitch: engine.playerPitch,
      health: engine.health,
      shield: engine.shield,
      isSkydiving: engine.isSkydiving,
      isGliding: engine.isGliding,
      activeWeaponType: currentWep ? currentWep.type : 'pickaxe',
      weaponRarity: currentWep ? currentWep.rarity : 'common',
    });
  }
}
