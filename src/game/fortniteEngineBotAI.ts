// Bot AI: line-of-sight checks and per-mode bot behavior update loops.
import * as THREE from 'three';
import { EliminationLog, BotPlayer } from '../types';
import { updateNameTagSprite } from './fortniteCharacter';
import { fortniteAudio } from '../utils/audio';
import type { FortniteEngine } from './fortniteEngine';
import { getBotDifficultyConfig } from './fortniteEngine';


const _losDir = new THREE.Vector3();
const _losRay = new THREE.Ray();
const _losBox = new THREE.Box3();
const _losIntersect = new THREE.Vector3();

const _scratchBotPos = new THREE.Vector3();
const _scratchPlayerHead = new THREE.Vector3();
const _scratchTracerEnd = new THREE.Vector3();
const _scratchSpreadOffset = new THREE.Vector3();

export function isLineOfSightBlockedImpl(engine: FortniteEngine, origin: THREE.Vector3, target: THREE.Vector3): boolean {
  _losDir.subVectors(target, origin);
  const maxDist = _losDir.length();
  if (maxDist < 0.2) return false;
  _losDir.multiplyScalar(1 / maxDist);

  _losRay.origin.copy(origin);
  _losRay.direction.copy(_losDir);

  // Check static world buildings and structures along the ray
  const colliders = engine.spatialGrid.queryRay(origin.x, origin.z, target.x, target.z);
  for (let i = 0; i < colliders.length; i++) {
    const sc = colliders[i];
    if (sc.type === 'box' && sc.minX !== undefined && sc.maxX !== undefined) {
      _losBox.min.set(sc.minX, sc.minY || 0, sc.minZ!);
      _losBox.max.set(sc.maxX, sc.maxY || 100, sc.maxZ!);
      if (_losRay.intersectBox(_losBox, _losIntersect)) {
        const hitDist = origin.distanceTo(_losIntersect);
        if (hitDist > 0.3 && hitDist < maxDist - 0.4) {
          return true;
        }
      }
    } else if (sc.type === 'cylinder' && sc.x !== undefined && sc.z !== undefined && sc.radius !== undefined) {
      const r = sc.radius;
      _losBox.min.set(sc.x - r, sc.minY || 0, sc.z - r);
      _losBox.max.set(sc.x + r, sc.maxY || 100, sc.z + r);
      if (_losRay.intersectBox(_losBox, _losIntersect)) {
        const hitDist = origin.distanceTo(_losIntersect);
        if (hitDist > 0.3 && hitDist < maxDist - 0.4) {
          return true;
        }
      }
    }
  }

  // Check player-built structures along the ray
  const pieces = engine.spatialGrid.queryBuildingPiecesRay(origin.x, origin.z, target.x, target.z);
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];
    _losBox.min.set(piece.x - 2.1, piece.y - 0.2, piece.z - 2.1);
    _losBox.max.set(piece.x + 2.1, piece.y + 4.2, piece.z + 2.1);
    if (_losRay.intersectBox(_losBox, _losIntersect)) {
      const hitDist = origin.distanceTo(_losIntersect);
      if (hitDist > 0.3 && hitDist < maxDist - 0.4) {
        return true;
      }
    }
  }

  return false;
}

export function processBotStormDamage(bot: BotPlayer, engine: FortniteEngine, dt: number): boolean {
  const distToStormCenter = Math.hypot(
    bot.x - engine.storm.currentCenterX,
    bot.z - engine.storm.currentCenterZ
  );

  if (distToStormCenter > engine.storm.currentRadius) {
    const stormTickDmg = (engine.storm.dps + 2.0) * dt;
    bot.health -= stormTickDmg;

    // Bot runs towards safe storm center
    const dirToCenterX = engine.storm.currentCenterX - bot.x;
    const dirToCenterZ = engine.storm.currentCenterZ - bot.z;
    const len = Math.hypot(dirToCenterX, dirToCenterZ) || 1;
    bot.vx = (dirToCenterX / len) * 5.5;
    bot.vz = (dirToCenterZ / len) * 5.5;
    bot.rotY = Math.atan2(-dirToCenterX, -dirToCenterZ);

    const nTag = engine.botNameTags.get(bot.id);
    if (nTag) {
      updateNameTagSprite(
        nTag,
        bot.name,
        true,
        bot.team,
        Math.max(0, bot.health / 100),
        Math.max(0, bot.shield / 50)
      );
    }

    if (bot.health <= 0) {
      bot.isAlive = false;
      const rig = engine.botMeshes.get(bot.id);
      if (rig) engine.scene.remove(rig.root);
      if (nTag) engine.scene.remove(nTag);

      const log: EliminationLog = {
        id: `storm_elim_${Date.now()}_${Math.random()}`,
        killer: 'The Storm ⚡',
        victim: bot.name,
        weaponName: 'Storm Surge',
        isHeadshot: false,
        time: Date.now(),
      };
      engine.callbacks.onElimination(log);
      engine.spawnDroppedSupplies(bot.x, bot.y, bot.z, bot.weapon);

      const remaining = engine.bots.filter((b) => b.isAlive).length + 1;
      engine.callbacks.onPlayersLeftChange(remaining);

      const aliveEnemies = engine.bots.filter((b) => b.isAlive && b.team !== engine.playerTeam);
      if (aliveEnemies.length === 0) {
        engine.triggerVictoryRoyale();
      }
      return true; // Eliminated
    }
  }
  return false;
}

export function executeBotCombatAI(
  bot: BotPlayer,
  engine: FortniteEngine,
  time: number,
  distToPlayer: number,
  dx: number,
  dz: number
) {
  bot.rotY = Math.atan2(-dx, -dz) + Math.sin(time * 3) * 0.12;
  const strafe = Math.sin(time * 1.8 + (bot.id.charCodeAt(bot.id.length - 1) || 1)) * 3.8;
  const fwdX = -Math.sin(bot.rotY);
  const fwdZ = -Math.cos(bot.rotY);
  const rightX = Math.cos(bot.rotY);
  const rightZ = -Math.sin(bot.rotY);

  const approachSpeed = distToPlayer > 22 ? 5.2 : distToPlayer < 8 ? -3.0 : 0.8;
  bot.vx = fwdX * approachSpeed + rightX * strafe;
  bot.vz = fwdZ * approachSpeed + rightZ * strafe;

  // Tactical 2v2.io / Fortnite defensive cover building when engaging at medium-close range
  if (distToPlayer < 36 && distToPlayer > 7 && time - (bot.lastBuildTime || 0) > 7.5) {
    bot.lastBuildTime = time;
    if (Math.random() < 0.45) {
      engine.placeBotPiece(bot, Math.random() < 0.7 ? 'wall' : 'ramp', 'wood');
    }
  }

  if (time - bot.lastShotTime > bot.reactionTimer && !engine.isSkydiving) {
    bot.lastShotTime = time;

    _scratchBotPos.set(bot.x, bot.y + 1.2, bot.z);
    _scratchPlayerHead.set(engine.playerPos.x, engine.playerPos.y + 1.4, engine.playerPos.z);
    const isBlocked = engine.isLineOfSightBlocked(_scratchBotPos, _scratchPlayerHead);

    if (!isBlocked) {
      if (Math.random() < bot.accuracy) {
        const dmg = 6 + Math.floor(Math.random() * 6);
        if (engine.shield > 0) {
          engine.shield = Math.max(0, engine.shield - dmg);
        } else {
          engine.health = Math.max(0, engine.health - dmg);
        }
        engine.damageTaken += dmg;
        engine.callbacks.onHealthChange(engine.health, engine.shield);
        engine.callbacks.onDamageTaken();
        fortniteAudio.playHitmarker(false, engine.shield > 0);

        if (engine.health <= 0) {
          engine.triggerEliminated();
        }
      }
    }

    if (distToPlayer < 75) {
      fortniteAudio.playGunshotAR(false);
      if (distToPlayer < 35) {
        fortniteAudio.playBulletCrack();
      }
      if (isBlocked) {
        _scratchTracerEnd.set(_scratchBotPos.x + dx * 0.4, _scratchBotPos.y + 0.5, _scratchBotPos.z + dz * 0.4);
      } else {
        _scratchTracerEnd.set(
          engine.playerPos.x + (Math.random() - 0.5) * 3.2,
          engine.playerPos.y + 1.3,
          engine.playerPos.z + (Math.random() - 0.5) * 3.2
        );
      }
      engine.createBulletTracer(_scratchBotPos, _scratchTracerEnd);
    }
  }
}

export function updateBotsImpl(engine: FortniteEngine, dt: number) {
  const time = performance.now() * 0.001;

  // In 1v1 Arena Mode ('1v1' or '1v1_build_fight'), execute specialized Arena Rival AI
  if (engine.mode === '1v1' || engine.mode === '1v1_build_fight') {
    for (let i = 0; i < engine.bots.length; i++) {
      const bot = engine.bots[i];
      if (bot.isAlive) {
        engine.update1v1Bot(bot, dt, time);
      }
    }
    return;
  }

  if (engine.bots.length === 0) {
    return;
  }

  // Simulated Bot vs Bot Skirmishes across the island (for large BR / FFA / Knockout modes)
  if (engine.mode !== '2v2') {
    engine.botSimCombatTimer -= dt;
    if (engine.botSimCombatTimer <= 0) {
      engine.botSimCombatTimer = 9.0 + Math.random() * 10.0;
      const aliveEnemyBots = engine.bots.filter((b) => b.isAlive && b.team !== engine.playerTeam);
      if (aliveEnemyBots.length > 2) {
        const victim = aliveEnemyBots[Math.floor(Math.random() * aliveEnemyBots.length)];
        const killers = aliveEnemyBots.filter((b) => b.id !== victim.id);
        const killer = killers[Math.floor(Math.random() * killers.length)] || { name: 'Squad Bot' };

        victim.isAlive = false;
        const rig = engine.botMeshes.get(victim.id);
        if (rig) {
          engine.scene.remove(rig.root);
        }
        const nTag = engine.botNameTags.get(victim.id);
        if (nTag) {
          engine.scene.remove(nTag);
        }

        const botWeapons = ['SCAR AR', 'Pump Shotgun', 'Bolt-Action Sniper', 'Compact SMG', 'Tactical AR'];
        const wep = botWeapons[Math.floor(Math.random() * botWeapons.length)];
        const isHeadshot = Math.random() < 0.28;

        const log: EliminationLog = {
          id: `bot_elim_${Date.now()}_${Math.random()}`,
          killer: killer.name,
          victim: victim.name,
          weaponName: wep,
          isHeadshot,
          time: Date.now(),
        };
        engine.callbacks.onElimination(log);

        const remaining = engine.bots.filter((b) => b.isAlive).length + 1;
        engine.callbacks.onPlayersLeftChange(remaining);
        engine.checkTeamVictoryCondition();
      }
    }
  }

  for (let i = 0; i < engine.bots.length; i++) {
    const bot = engine.bots[i];
    if (!bot.isAlive) continue;

    const dx = engine.playerPos.x - bot.x;
    const dz = engine.playerPos.z - bot.z;
    const distToPlayer = Math.hypot(dx, engine.playerPos.y - bot.y, dz);

    // 1. Process Storm Damage
    if (processBotStormDamage(bot, engine, dt)) {
      continue;
    }

    // 2. Friendly bot on ALPHA team (e.g., 2v2 Duo Partner) follows player AND engages OMEGA enemies
    const isFriendly = bot.team === engine.playerTeam;

    if (isFriendly) {
      let closestEnemy: BotPlayer | null = null;
      let closestEnemyDist = Infinity;
      for (let j = 0; j < engine.bots.length; j++) {
        const candidate = engine.bots[j];
        if (!candidate.isAlive || candidate.team === engine.playerTeam) continue;
        const d = Math.hypot(candidate.x - bot.x, candidate.z - bot.z);
        if (d < closestEnemyDist) {
          closestEnemyDist = d;
          closestEnemy = candidate;
        }
      }

      if (distToPlayer > 11.0) {
        bot.rotY = Math.atan2(-dx, -dz);
        bot.vx = -Math.sin(bot.rotY) * 7.2;
        bot.vz = -Math.cos(bot.rotY) * 7.2;
      } else if (closestEnemy && closestEnemyDist < 85) {
        const edx = closestEnemy.x - bot.x;
        const edz = closestEnemy.z - bot.z;
        bot.rotY = Math.atan2(-edx, -edz);
        const strafe = Math.sin(time * 2.4) * 3.5;
        bot.vx = Math.cos(bot.rotY) * strafe;
        bot.vz = -Math.sin(bot.rotY) * strafe;

        if (time - bot.lastShotTime > 0.65) {
          bot.lastShotTime = time;
          _scratchBotPos.set(bot.x, bot.y + 1.2, bot.z);
          _scratchTracerEnd.set(closestEnemy.x, closestEnemy.y + 1.2, closestEnemy.z);
          engine.createBulletTracer(_scratchBotPos, _scratchTracerEnd);
          fortniteAudio.playGunshotAR(false);

          if (Math.random() < 0.45) {
            const allyDmg = 18;
            if (closestEnemy.shield > 0) {
              closestEnemy.shield = Math.max(0, closestEnemy.shield - allyDmg);
            } else {
              closestEnemy.health = Math.max(0, closestEnemy.health - allyDmg);
            }
            const enemyTag = engine.botNameTags.get(closestEnemy.id);
            if (enemyTag) {
              updateNameTagSprite(
                enemyTag,
                closestEnemy.name,
                true,
                closestEnemy.team,
                Math.max(0, closestEnemy.health / 250),
                Math.max(0, closestEnemy.shield / 100)
              );
            }
            if (closestEnemy.health <= 0) {
              engine.eliminateBot(closestEnemy, false, 'SCAR AR (Duo Assist)');
            }
          }
        }
      } else {
        bot.vx = 0;
        bot.vz = 0;
        bot.rotY = Math.atan2(-dx, -dz);
      }
    } else {
      if (distToPlayer < 75 || engine.mode === '2v2') {
        bot.state = 'combat';
      }

      if (bot.state === 'combat') {
        executeBotCombatAI(bot, engine, time, distToPlayer, dx, dz);
      } else {
        const angle = time * 0.25 + i * 1.1;
        bot.rotY = angle;
        bot.vx = -Math.sin(angle) * 3.8;
        bot.vz = -Math.cos(angle) * 3.8;
      }
    }

    bot.x += bot.vx * dt;
    bot.z += bot.vz * dt;

    // Solid collision resolution for bots with spatial grid
    const botResolved = engine.checkAndResolveSolidCollisions(bot.x, bot.z, bot.y, 0.45);
    bot.x = botResolved.x;
    bot.z = botResolved.z;
    bot.y = engine.getGroundElevationAt(bot.x, bot.z, bot.y);

    const rig = engine.botMeshes.get(bot.id);
    if (rig) {
      rig.root.position.set(bot.x, bot.y, bot.z);
      rig.root.rotation.y = bot.rotY + Math.PI;
      // Throttle distant animation matrix calculations
      if (distToPlayer < 110 || bot.state === 'combat') {
        rig.updateAnimation(time, Math.hypot(bot.vx, bot.vz) > 0.5, false, bot.state === 'combat');
      }
    }
  }
}

export function update1v1BotImpl(engine: FortniteEngine, bot: BotPlayer, dt: number, time: number) {
  _scratchBotPos.set(bot.x, bot.y + 1.2, bot.z);
  _scratchPlayerHead.set(engine.playerPos.x, engine.playerPos.y + 1.4, engine.playerPos.z);
  const dx = engine.playerPos.x - bot.x;
  const dz = engine.playerPos.z - bot.z;
  const distToPlayer = Math.hypot(dx, dz);

  const diff = engine.arena1v1State.botDifficulty || 'pro';
  const config = getBotDifficultyConfig(diff);

  // 1. Aim Tracking towards player (Smooth angle interpolation)
  const targetAngle = Math.atan2(-dx, -dz);
  bot.rotY = targetAngle;

  // 2. Vertical Physics
  if (!bot.vy) bot.vy = 0;
  bot.vy -= 26.0 * dt;

  // 3. Movement & Tactical Strafing (Pure Gunplay - No Building)
  let forwardSpeed = 0;
  let strafeSpeed = Math.sin(time * 3.5) * config.strafeSpeed;

  if (distToPlayer > 22.0) {
    forwardSpeed = config.targetSpeed; // Push forward into combat range
  } else if (distToPlayer > 12.0) {
    forwardSpeed = config.targetSpeed * 0.65;
    strafeSpeed = Math.sin(time * 4.2) * (config.strafeSpeed * 1.1);
  } else if (distToPlayer < 5.0) {
    forwardSpeed = -config.targetSpeed * 0.5; // Back up slightly for shotgun spacing
    strafeSpeed = Math.sin(time * 5.5) * (config.strafeSpeed * 1.3);
  } else {
    forwardSpeed = Math.cos(time * 2.0) * 3.0;
    strafeSpeed = Math.sin(time * 4.8) * config.strafeSpeed;
  }

  const fwdX = -Math.sin(bot.rotY);
  const fwdZ = -Math.cos(bot.rotY);
  const rightX = Math.cos(bot.rotY);
  const rightZ = -Math.sin(bot.rotY);

  bot.vx = fwdX * forwardSpeed + rightX * strafeSpeed;
  bot.vz = fwdZ * forwardSpeed + rightZ * strafeSpeed;

  // 4. Combat Jump Peeks based on difficulty
  if (bot.isGrounded && Math.random() < config.jumpChance) {
    bot.vy = 10.5;
    bot.isGrounded = false;
    fortniteAudio.playJump();
  }

  // 5. Apply velocities & sphere-on-environment collisions
  bot.x += bot.vx * dt;
  bot.z += bot.vz * dt;
  bot.y += bot.vy * dt;

  const botSphere = {
    id: bot.id,
    pos: new THREE.Vector3(bot.x, bot.y + 0.6, bot.z),
    vel: new THREE.Vector3(bot.vx, bot.vy, bot.vz),
    radius: 0.55,
    mass: 1.0,
    restitution: 0.88,
    friction: 0.35,
    isGrounded: bot.isGrounded,
    name: bot.name,
  };

  const nearbyStatic = engine.spatialGrid.queryNear(bot.x, bot.z, 4.0);
  const groundElevation = engine.getGroundElevationAt(bot.x, bot.z, bot.y);

  if (engine.spherePhysicsEngine) {
    engine.spherePhysicsEngine.resolveEnvironment(botSphere, nearbyStatic, groundElevation, dt);
    bot.x = botSphere.pos.x;
    bot.z = botSphere.pos.z;
    bot.y = botSphere.pos.y - 0.6;
    bot.vx = botSphere.vel.x;
    bot.vy = botSphere.vel.y;
    bot.vz = botSphere.vel.z;
    bot.isGrounded = botSphere.isGrounded;
  } else {
    const resolved = engine.checkAndResolveSolidCollisions(bot.x, bot.z, bot.y, 0.48);
    bot.x = resolved.x;
    bot.z = resolved.z;
    if (bot.y <= groundElevation) {
      bot.y = groundElevation;
      bot.vy = 0;
      bot.isGrounded = true;
    } else {
      bot.isGrounded = false;
    }
  }

  // Arena Boundary clamp
  bot.x = Math.max(-72, Math.min(72, bot.x));
  bot.z = Math.max(-72, Math.min(72, bot.z));

  // 6. Tactical Gun Combat & Weapon Switching
  const isCloseRange = distToPlayer <= 11.0;
  const shotInterval = isCloseRange ? config.shotIntervalClose : config.shotIntervalFar;

  if (time - bot.lastShotTime > shotInterval && !engine.arena1v1State.isRoundOver) {
    bot.lastShotTime = time;

    const isBlocked = engine.isLineOfSightBlocked(_scratchBotPos, _scratchPlayerHead);

    if (!isBlocked) {
      const hitChance = isCloseRange ? config.hitChanceClose : config.hitChanceFar;
      if (Math.random() < hitChance) {
        const isHeadshot = Math.random() < config.headshotChance;
        let rawDmg = isCloseRange
          ? (65 + Math.floor(Math.random() * 30))
          : (22 + Math.floor(Math.random() * 10));
        rawDmg = Math.round(rawDmg * config.dmgMultiplier);
        if (isHeadshot) rawDmg = Math.round(rawDmg * 1.55);

        if (engine.shield > 0) {
          const absorbed = Math.min(engine.shield, rawDmg);
          engine.shield -= absorbed;
          const overflow = rawDmg - absorbed;
          engine.health = Math.max(0, engine.health - overflow);
        } else {
          engine.health = Math.max(0, engine.health - rawDmg);
        }

        engine.damageTaken += rawDmg;
        engine.callbacks.onHealthChange(engine.health, engine.shield);
        engine.callbacks.onDamageTaken();
        fortniteAudio.playHitmarker(isHeadshot, engine.shield > 0);

        if (engine.health <= 0) {
          engine.triggerEliminated();
        }
      }
    }

    if (isCloseRange) {
      fortniteAudio.playGunshotPump(false);
      for (let p = 0; p < 4; p++) {
        if (isBlocked) {
          _scratchTracerEnd.set(_scratchBotPos.x + dx * 0.4, _scratchBotPos.y + 0.4, _scratchBotPos.z + dz * 0.4);
        } else {
          _scratchTracerEnd.set(
            engine.playerPos.x + (Math.random() - 0.5) * 1.2,
            engine.playerPos.y + (Math.random() - 0.5) * 1.2 + 1.2,
            engine.playerPos.z + (Math.random() - 0.5) * 1.2
          );
        }
        engine.createBulletTracer(_scratchBotPos, _scratchTracerEnd);
      }
    } else {
      fortniteAudio.playGunshotAR(false);
      if (distToPlayer < 35) fortniteAudio.playBulletCrack();
      if (isBlocked) {
        _scratchTracerEnd.set(_scratchBotPos.x + dx * 0.4, _scratchBotPos.y + 0.4, _scratchBotPos.z + dz * 0.4);
      } else {
        _scratchTracerEnd.set(
          engine.playerPos.x + (Math.random() - 0.5) * 2,
          engine.playerPos.y + 1.3,
          engine.playerPos.z + (Math.random() - 0.5) * 2
        );
      }
      engine.createBulletTracer(_scratchBotPos, _scratchTracerEnd);
    }
  }

  // 7. Update 3D Model Rig & Name Tag (with 300 HP and Shield scaling)
  const rig = engine.botMeshes.get(bot.id);
  if (rig) {
    rig.root.position.set(bot.x, bot.y, bot.z);
    rig.root.rotation.y = bot.rotY + Math.PI;
    const isMoving = Math.hypot(bot.vx, bot.vz) > 0.5;
    rig.updateAnimation(time, isMoving, false, true);
  }

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
