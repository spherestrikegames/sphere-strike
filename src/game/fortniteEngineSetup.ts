// Engine bootstrap: lighting, glider, storm init, player rigs, scope visualizer, bots, multiplayer wiring.
import * as THREE from 'three';
import { BotPlayer, TeamType } from '../types';
import { WEAPON_REGISTRY, FORTNITE_SKINS, ISLAND_POIS } from '../data/fortniteData';
import { createFirstPersonWeaponRig } from './fortniteWeapons';
import { createPlacedBuildingMesh } from './fortniteBuilding';
import { buildCharacterModel, createNameTagSprite } from './fortniteCharacter';
import { fortniteAudio } from '../utils/audio';
import { multiplayerClient } from '../utils/multiplayer';
import type { FortniteEngine } from './fortniteEngine';
import { getBotDifficultyConfig } from './fortniteEngine';


export function setupLightingImpl(engine: FortniteEngine) {
  engine.hemiLight = new THREE.HemisphereLight(0xffffff, 0x445566, 0.95);
  engine.hemiLight.position.set(0, 250, 0);
  engine.scene.add(engine.hemiLight);

  const hasShadows = engine.profile.settings.shadows ?? false;
  engine.sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
  engine.sunLight.position.set(130, 260, 100);
  engine.sunLight.castShadow = hasShadows;
  engine.sunLight.shadow.mapSize.width = hasShadows ? 1024 : 512;
  engine.sunLight.shadow.mapSize.height = hasShadows ? 1024 : 512;
  engine.sunLight.shadow.bias = -0.0005;
  engine.sunLight.shadow.normalBias = 0.02;
  engine.sunLight.shadow.camera.near = 15;
  engine.sunLight.shadow.camera.far = 480;
  const d = 110;
  engine.sunLight.shadow.camera.left = -d;
  engine.sunLight.shadow.camera.right = d;
  engine.sunLight.shadow.camera.top = d;
  engine.sunLight.shadow.camera.bottom = -d;
  engine.scene.add(engine.sunLight);
}

export function setupGliderImpl(engine: FortniteEngine) {
  engine.gliderMesh = new THREE.Group();

  const canopyGeo = new THREE.BoxGeometry(3.6, 0.1, 2.0);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    metalness: 0.2,
    roughness: 0.4,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.y = 1.4;
  engine.gliderMesh.add(canopy);

  const strutMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
  const leftStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6), strutMat);
  leftStrut.position.set(-1.2, 0.7, 0);
  leftStrut.rotation.z = -0.3;
  engine.gliderMesh.add(leftStrut);

  const rightStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6), strutMat);
  rightStrut.position.set(1.2, 0.7, 0);
  rightStrut.rotation.z = 0.3;
  engine.gliderMesh.add(rightStrut);

  engine.gliderMesh.visible = false;
  engine.scene.add(engine.gliderMesh);
}

export function setupStormImpl(engine: FortniteEngine) {
  const stormGeo = new THREE.CylinderGeometry(
    engine.storm.currentRadius,
    engine.storm.currentRadius,
    200,
    48,
    1,
    true
  );
  const stormMat = new THREE.MeshBasicMaterial({
    color: 0x9333ea,
    transparent: true,
    opacity: 0.38,
    side: THREE.BackSide,
  });
  engine.stormCylinderMesh = new THREE.Mesh(stormGeo, stormMat);
  engine.stormCylinderMesh.position.set(engine.storm.currentCenterX, 100, engine.storm.currentCenterZ);
  engine.scene.add(engine.stormCylinderMesh);
}

export function setupPlayerRigsImpl(engine: FortniteEngine) {
  const currentWep = engine.getCurrentWeapon();
  const type = currentWep ? currentWep.type : 'pickaxe';
  const rarity = currentWep ? currentWep.rarity : 'common';

  // 1st Person Weapon & Arms Rig
  engine.fpsRig = createFirstPersonWeaponRig(type, rarity);
  engine.camera.add(engine.fpsRig);
  engine.scene.add(engine.camera);

  // 3rd Person Character Rig
  engine.thirdPersonRig = buildCharacterModel(
    engine.profile.selectedSkin || 'jonesy',
    type,
    rarity
  );

  // Attach Player Name Tag
  engine.playerNameTag = createNameTagSprite(
    engine.profile.name || 'Player',
    false,
    engine.playerTeam,
    engine.health / engine.maxHealth,
    engine.shield / engine.maxShield
  );
  engine.thirdPersonRig.root.add(engine.playerNameTag);

  engine.thirdPersonRig.root.visible = !engine.isFirstPerson;
  engine.scene.add(engine.thirdPersonRig.root);
}

export function setupScopeVisualizerImpl(engine: FortniteEngine) {
  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -100),
  ]);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    linewidth: 3,
    transparent: true,
    opacity: 0.85,
  });
  engine.scopeLaserLine = new THREE.Line(lineGeo, lineMat);
  engine.scopeLaserLine.frustumCulled = false;
  engine.scopeLaserLine.visible = false;
  engine.scene.add(engine.scopeLaserLine);

  engine.scopeImpactMarker = new THREE.Group();

  const ringGeo = new THREE.RingGeometry(0.18, 0.24, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  engine.scopeImpactMarker.add(ring);

  const dotGeo = new THREE.CircleGeometry(0.045, 16);
  const dotMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const dot = new THREE.Mesh(dotGeo, dotMat);
  engine.scopeImpactMarker.add(dot);

  const tickMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const tTop = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.12), tickMat);
  tTop.position.y = 0.28;
  const tBottom = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.12), tickMat);
  tBottom.position.y = -0.28;
  const tLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), tickMat);
  tLeft.position.x = -0.28;
  const tRight = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.03), tickMat);
  tRight.position.x = 0.28;
  engine.scopeImpactMarker.add(tTop, tBottom, tLeft, tRight);

  engine.scopePointLight = new THREE.PointLight(0xef4444, 2.5, 6);
  engine.scopeImpactMarker.add(engine.scopePointLight);

  engine.scopeImpactMarker.visible = false;
  engine.scene.add(engine.scopeImpactMarker);
}

export function spawnBotsImpl(engine: FortniteEngine, count: number) {
  if (engine.mode === '1v1_build_fight') {
    const diff = engine.arena1v1State.botDifficulty || 'pro';
    const config = getBotDifficultyConfig(diff);

    const bot: BotPlayer = {
      id: 'bot_1v1_opponent',
      name: config.name,
      isAI: true,
      team: 'SHADOW',
      skinId: 'renegade_raider',
      x: engine.botSpawnPos.x,
      y: engine.botSpawnPos.y,
      z: engine.botSpawnPos.z,
      vx: 0,
      vy: 0,
      vz: 0,
      rotY: Math.PI,
      pitch: 0,
      health: 300,
      shield: 300,
      isAlive: true,
      isGrounded: true,
      weapon: { ...WEAPON_REGISTRY.shotgun_pump_legendary },
      targetPos: null,
      state: 'combat',
      lastShotTime: 0,
      accuracy: config.accuracy,
      reactionTimer: config.reactionTimer,
      kills: 0,
    };

    engine.bots.push(bot);

    const rig = buildCharacterModel('renegade_raider', bot.weapon.type, bot.weapon.rarity);
    rig.root.position.set(bot.x, bot.y, bot.z);

    const nameTag = createNameTagSprite(
      bot.name,
      true,
      bot.team,
      bot.health / 300,
      bot.shield / 300
    );
    rig.root.add(nameTag);
    engine.botNameTags.set(bot.id, nameTag);

    engine.scene.add(rig.root);
    engine.botMeshes.set(bot.id, rig);
    return;
  }

  if (engine.mode !== 'first_person_royale') {
    // In Battle Royale and other modes, NO AI bots are spawned - pure real player multiplayer!
    engine.bots = [];
    return;
  }

  const botWeapons = [
    WEAPON_REGISTRY.ar_scar,
    WEAPON_REGISTRY.shotgun_pump_epic,
    WEAPON_REGISTRY.sniper_bolt_legendary,
    WEAPON_REGISTRY.smg_p90_epic,
    WEAPON_REGISTRY.ar_rare,
    WEAPON_REGISTRY.shotgun_tac_rare,
    WEAPON_REGISTRY.ar_common,
  ].filter(Boolean);

  const teamList: TeamType[] = ['OMEGA', 'SHADOW', 'PHOENIX', 'ALPHA'];
  const rankPrefixes = ['[PRO]', '[ELITE]', '[ALPHA]', '[CHAMPION]', '[UNREAL]', '[MASTER]'];
  const skinNameMap: Record<string, string> = {
    jonesy: 'Jonesy',
    ramirez: 'Ramirez',
    peely: 'Peely',
    midas: 'Midas',
    drift: 'Drift',
    black_knight: 'Knight',
    renegade_raider: 'Renegade',
    goku: 'Goku',
  };

  for (let i = 0; i < count; i++) {
    const skin = FORTNITE_SKINS[i % FORTNITE_SKINS.length];
    const rank = rankPrefixes[i % rankPrefixes.length];
    const skinBase = skinNameMap[skin.id] || skin.name.split(' ')[0];
    const tagNum = Math.floor(1000 + ((i * 1337 + 4021) % 8999));
    const name = `${rank} ${skinBase}#${tagNum}`;
    const poi = ISLAND_POIS[i % ISLAND_POIS.length];
    const wepPreset = botWeapons[i % botWeapons.length];
    const team = teamList[i % teamList.length];

    const x = poi.x + (Math.random() - 0.5) * 70;
    const z = poi.z + (Math.random() - 0.5) * 70;
    const y = 1.5;

    const bot: BotPlayer = {
      id: `bot_${i}`,
      name,
      isAI: true,
      team,
      skinId: skin.id,
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      rotY: Math.random() * Math.PI * 2,
      pitch: 0,
      health: 80,
      shield: 25,
      isAlive: true,
      isGrounded: true,
      weapon: { ...wepPreset },
      targetPos: null,
      state: 'wander',
      lastShotTime: 0,
      accuracy: 0.12,
      reactionTimer: 2.5 + Math.random() * 2.0,
      kills: 0,
      lastBuildTime: 0,
    };

    engine.bots.push(bot);

    // Character Rig with Name Tag sprite
    const rig = buildCharacterModel(skin.id, bot.weapon.type, bot.weapon.rarity);
    rig.root.position.set(x, y, z);

    const nameTag = createNameTagSprite(
      bot.name,
      true,
      bot.team,
      bot.health / 100,
      bot.shield / 50
    );
    rig.root.add(nameTag);
    engine.botNameTags.set(bot.id, nameTag);

    engine.scene.add(rig.root);
    engine.botMeshes.set(bot.id, rig);
  }
}

export function setupMultiplayerImpl(engine: FortniteEngine) {
  multiplayerClient.setGameRunning(true);
  multiplayerClient.setHandlers({
    onPlayerSync: (playerId, data) => {
      let remote = engine.remotePlayers.get(playerId);
      if (!remote) {
        const skinId = data.skinId || 'jonesy';
        const rig = buildCharacterModel(skinId, data.activeWeaponType || 'ar', data.weaponRarity || 'epic');
        engine.scene.add(rig.root);
        remote = {
          state: {
            id: playerId,
            name: data.name || 'Online Player',
            skinId,
            x: data.x || 0,
            y: data.y || 2,
            z: data.z || 0,
            rotY: data.rotY || 0,
            pitch: data.pitch || 0,
            health: data.health || 250,
            shield: data.shield || 100,
            isAlive: true,
            isSkydiving: !!data.isSkydiving,
            isGliding: !!data.isGliding,
            activeWeaponType: data.activeWeaponType || 'ar',
            weaponRarity: data.weaponRarity || 'epic',
            isShooting: false,
          },
          rig,
        };
        const nameTag = createNameTagSprite(remote.state.name, false, 'OMEGA', 1.0, 0.5);
        rig.root.add(nameTag);
        engine.remotePlayers.set(playerId, remote);
        engine.updatePlayersLeftCount();
      }

      const prevX = remote.state.x;
      const prevZ = remote.state.z;
      if (data.name !== undefined) remote.state.name = data.name;
      if (data.x !== undefined) remote.state.x = data.x;
      if (data.y !== undefined) remote.state.y = data.y;
      if (data.z !== undefined) remote.state.z = data.z;
      if (data.rotY !== undefined) remote.state.rotY = data.rotY;
      if (data.pitch !== undefined) remote.state.pitch = data.pitch;
      if (data.health !== undefined) remote.state.health = data.health;
      if (data.shield !== undefined) remote.state.shield = data.shield;
      if (data.isAlive !== undefined) {
        remote.state.isAlive = data.isAlive;
        remote.rig.root.visible = data.isAlive;
      }

      const isMoving = Math.hypot(remote.state.x - prevX, remote.state.z - prevZ) > 0.05;
      remote.rig.root.position.set(remote.state.x, remote.state.y, remote.state.z);
      remote.rig.root.rotation.y = remote.state.rotY + Math.PI;
      remote.rig.updateAnimation(performance.now() * 0.001, isMoving, false, false);
    },
    onPlayerLeave: (playerId) => {
      const remote = engine.remotePlayers.get(playerId);
      if (remote) {
        engine.scene.remove(remote.rig.root);
        engine.remotePlayers.delete(playerId);
        engine.updatePlayersLeftCount();
      }
    },
    onPlayerAction: (playerId, action) => {
      if (action.type === 'shoot') {
        const start = new THREE.Vector3(action.origin.x, action.origin.y, action.origin.z);
        const end = new THREE.Vector3(action.target.x, action.target.y, action.target.z);
        engine.createBulletTracer(start, end);
        fortniteAudio.playGunshotAR(false);
      } else if (action.type === 'build') {
        const piece = action.piece;
        if (!engine.buildingPieces.has(piece.id)) {
          const mesh = createPlacedBuildingMesh(piece);
          engine.scene.add(mesh);
          engine.buildingPieces.set(piece.id, { piece, mesh });
          fortniteAudio.playBuildPlace(piece.material);
        }
      } else if (action.type === 'damage_player') {
        if (action.targetId === multiplayerClient.myPlayerId) {
          engine.applyDamageFromRemote(action.damage, action.isHeadshot, action.attackerName, action.weaponName);
        }
      } else if (action.type === 'player_eliminated') {
        engine.callbacks.onElimination({
          id: 'elim_' + Date.now(),
          killer: action.attackerName,
          victim: action.victimName,
          weaponName: action.weaponName,
          isHeadshot: action.isHeadshot,
          time: Date.now(),
        });
        const remote = engine.remotePlayers.get(action.victimId);
        if (remote) {
          remote.state.isAlive = false;
          remote.rig.root.visible = false;
          engine.spawnDroppedSupplies(remote.state.x, remote.state.y, remote.state.z);
        }
        engine.updatePlayersLeftCount();
      } else if (action.type === 'friend_eliminated_respawn') {
        if (action.targetId === multiplayerClient.myPlayerId) {
          if (!engine.isRespawning && !engine.isGameOver) {
            engine.handleBattleRoyaleLocalDeath(action.attackerName, action.weaponName, action.isHeadshot);
          }
        } else {
          const remote = engine.remotePlayers.get(action.targetId);
          if (remote) {
            remote.respawnsUsed = action.respawnsUsed;
            const left = Math.max(0, engine.maxRespawns - (remote.respawnsUsed || 0));
            engine.updateDuelState(
              `${remote.state.name} eliminated! Respawning (${remote.respawnsUsed}/3 used - ${left} left)`
            );
          }
        }
      } else if (action.type === 'player_respawning') {
        const remote = engine.remotePlayers.get(action.victimId);
        if (remote) {
          remote.respawnsUsed = action.respawnsUsed;
          engine.updateDuelState(`${action.victimName || remote.state.name} is respawning...`);
        }
      } else if (action.type === 'player_respawned') {
        const remote = engine.remotePlayers.get(action.playerId);
        if (remote) {
          remote.state.isAlive = true;
          remote.rig.root.visible = true;
          remote.state.health = 250;
          remote.state.shield = 100;
          remote.state.x = action.x;
          remote.state.y = action.y;
          remote.state.z = action.z;
          remote.respawnsUsed = action.respawnsUsed;
          remote.rig.root.position.set(action.x, action.y, action.z);

          engine.callbacks.onEliminationBanner?.({
            id: 'banner_respawn_' + Date.now(),
            victim: `${action.playerName || remote.state.name} dropped back into the fight!`,
            weaponName: 'Respawn Rift',
            isHeadshot: false,
            eliminationCount: engine.eliminations,
            xpEarned: 100,
            timestamp: Date.now(),
          });
        }
        engine.updateDuelState(null);
      } else if (action.type === 'friend_final_elimination') {
        if (action.victimId === multiplayerClient.myPlayerId) {
          engine.updateDuelState(`FINAL ELIMINATION! ${action.killerName || 'Friend'} won the duel!`);
          engine.triggerEliminated();
        } else {
          const remote = engine.remotePlayers.get(action.victimId);
          if (remote) {
            remote.state.isAlive = false;
            remote.rig.root.visible = false;
          }
          engine.updateDuelState(`VICTORY! ${action.victimName || 'Friend'} has exceeded 3 respawns!`);
          engine.triggerVictoryRoyale();
        }
      }
    },
  });

  // Populate any party members who were already in the room
  for (const member of multiplayerClient.partyState.members) {
    if (member.id !== multiplayerClient.myPlayerId && !engine.remotePlayers.has(member.id)) {
      const skinId = member.skinId || 'jonesy';
      const rig = buildCharacterModel(skinId, 'ar', 'epic');
      engine.scene.add(rig.root);
      const remote = {
        state: {
          id: member.id,
          name: member.name || 'Online Player',
          skinId,
          x: 0,
          y: 2,
          z: 0,
          rotY: 0,
          pitch: 0,
          health: 250,
          shield: 100,
          isAlive: true,
          isSkydiving: false,
          isGliding: false,
          activeWeaponType: 'ar' as const,
          weaponRarity: 'epic' as const,
          isShooting: false,
        },
        rig,
      };
      const nameTag = createNameTagSprite(remote.state.name, false, 'OMEGA', 1.0, 0.5);
      rig.root.add(nameTag);
      engine.remotePlayers.set(member.id, remote);
    }
  }
  engine.updatePlayersLeftCount();
}
