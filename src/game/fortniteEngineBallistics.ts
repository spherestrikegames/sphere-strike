// Shotgun/hitscan raycasts, pickaxe harvesting hits, and the real-time scope trajectory overlay.
import * as THREE from 'three';
import { FortniteWeapon, BuildingPiece, HarvestableObject, BotPlayer, RemotePlayerState } from '../types';
import { CharacterMeshRig, updateNameTagSprite } from './fortniteCharacter';
import { fortniteAudio } from '../utils/audio';
import { multiplayerClient } from '../utils/multiplayer';
import type { FortniteEngine } from './fortniteEngine';


const _shotgunRaycaster = new THREE.Raycaster();
const _centerRayOrigin = new THREE.Vector3();
const _centerRayDir = new THREE.Vector3();
const _centerRayEnd = new THREE.Vector3();
const _sharedBox = new THREE.Box3();
const _sharedIntersect = new THREE.Vector3();
const _marchP = new THREE.Vector3();
const _impactPos = new THREE.Vector3();
const _muzzleOffset = new THREE.Vector3();
const _muzzlePos = new THREE.Vector3();
const _screenCenter = new THREE.Vector2(0, 0);

export function performShotgunBlastImpl(engine: FortniteEngine, wep: FortniteWeapon) {
  const pelletCount = 10;
  _centerRayOrigin.copy(engine.camera.position);
  _shotgunRaycaster.setFromCamera(_screenCenter, engine.camera);
  _centerRayDir.copy(_shotgunRaycaster.ray.direction);

  // Strict 1-foot effective radius zone (~0.35m radius cylinder around center line)
  const effectiveRadius = 0.35;
  const maxRange = wep.range || 42;

  let primaryBot: BotPlayer | null = null;
  let primaryBotDist = maxRange;
  let isHeadshot = false;

  // Check static obstructions along center ray
  _centerRayEnd.copy(_centerRayOrigin).addScaledVector(_centerRayDir, maxRange);
  let blockDist = maxRange;

  const candidateColliders = engine.spatialGrid.queryRay(_centerRayOrigin.x, _centerRayOrigin.z, _centerRayEnd.x, _centerRayEnd.z);
  for (let i = 0; i < candidateColliders.length; i++) {
    const sc = candidateColliders[i];
    if (sc.type === 'box' && sc.minX !== undefined && sc.maxX !== undefined) {
      _sharedBox.min.set(sc.minX, sc.minY || 0, sc.minZ!);
      _sharedBox.max.set(sc.maxX, sc.maxY || 100, sc.maxZ!);
      if (_shotgunRaycaster.ray.intersectBox(_sharedBox, _sharedIntersect)) {
        const d = _centerRayOrigin.distanceTo(_sharedIntersect);
        if (d > 0.2 && d < blockDist) blockDist = d;
      }
    } else if (sc.type === 'cylinder' && sc.x !== undefined && sc.z !== undefined && sc.radius !== undefined) {
      const r = sc.radius;
      _sharedBox.min.set(sc.x - r, sc.minY || 0, sc.z - r);
      _sharedBox.max.set(sc.x + r, sc.maxY || 100, sc.z + r);
      if (_shotgunRaycaster.ray.intersectBox(_sharedBox, _sharedIntersect)) {
        const d = _centerRayOrigin.distanceTo(_sharedIntersect);
        if (d > 0.2 && d < blockDist) blockDist = d;
      }
    }
  }

  const candidatePieces = engine.spatialGrid.queryBuildingPiecesRay(_centerRayOrigin.x, _centerRayOrigin.z, _centerRayEnd.x, _centerRayEnd.z);
  for (let i = 0; i < candidatePieces.length; i++) {
    const piece = candidatePieces[i];
    _sharedBox.min.set(piece.x - 2.1, piece.y - 0.2, piece.z - 2.1);
    _sharedBox.max.set(piece.x + 2.1, piece.y + 4.2, piece.z + 2.1);
    if (_shotgunRaycaster.ray.intersectBox(_sharedBox, _sharedIntersect)) {
      const d = _centerRayOrigin.distanceTo(_sharedIntersect);
      if (d > 0.2 && d < blockDist) blockDist = d;
    }
  }

  // Check bots inside 1-foot radius
  for (const bot of engine.bots) {
    if (!bot.isAlive) continue;
    _marchP.set(bot.x, bot.y + 1.0, bot.z);
    const dToRay = _shotgunRaycaster.ray.distanceToPoint(_marchP);
    const dToCam = _centerRayOrigin.distanceTo(_marchP);

    // Strict 1-foot effective radius zone and closer than any obstructing wall
    if (dToRay <= effectiveRadius && dToCam < blockDist && dToCam < primaryBotDist) {
      primaryBot = bot;
      primaryBotDist = dToCam;
      isHeadshot = _shotgunRaycaster.ray.origin.y + _shotgunRaycaster.ray.direction.y * dToCam > bot.y + 1.45;
    }
  }

  // Check remote online players inside effective radius
  let primaryRemote: { id: string; state: RemotePlayerState; rig: CharacterMeshRig } | null = null;
  let primaryRemoteDist = maxRange;
  let isRemoteHeadshot = false;

  for (const [rId, remote] of engine.remotePlayers) {
    if (!remote.state.isAlive) continue;
    _marchP.set(remote.state.x, remote.state.y + 1.0, remote.state.z);
    const dToRay = _shotgunRaycaster.ray.distanceToPoint(_marchP);
    const dToCam = _centerRayOrigin.distanceTo(_marchP);

    if (dToRay <= effectiveRadius && dToCam < blockDist && dToCam < primaryRemoteDist) {
      primaryRemote = { id: rId, state: remote.state, rig: remote.rig };
      primaryRemoteDist = dToCam;
      isRemoteHeadshot = _shotgunRaycaster.ray.origin.y + _shotgunRaycaster.ray.direction.y * dToCam > remote.state.y + 1.45;
    }
  }

  // Hit online remote player if closer than bot
  if (primaryRemote && primaryRemoteDist < primaryBotDist) {
    let totalDmg = wep.damage;
    if (isRemoteHeadshot) totalDmg = Math.round(totalDmg * wep.headshotMultiplier);
    engine.damageRemotePlayer(primaryRemote.id, primaryRemote, totalDmg, isRemoteHeadshot, wep.name);
  } else if (primaryBot) {
    engine.shotsHit++;
    let totalDmg = wep.damage;
    if (isHeadshot) totalDmg = Math.round(totalDmg * wep.headshotMultiplier);

    if (primaryBot.team === engine.playerTeam) {
      engine.addDamageNumber('TEAMMATE', '#38bdf8', false, false, primaryBot.x, primaryBot.y + 2.2, primaryBot.z);
    } else {
      const hadShield = primaryBot.shield > 0;
      if (primaryBot.shield > 0) {
        if (primaryBot.shield >= totalDmg) {
          primaryBot.shield -= totalDmg;
        } else {
          const rem = totalDmg - primaryBot.shield;
          primaryBot.shield = 0;
          primaryBot.health -= rem;
        }
      } else {
        primaryBot.health -= totalDmg;
      }

      const nTag = engine.botNameTags.get(primaryBot.id);
      if (nTag) {
        updateNameTagSprite(
          nTag,
          primaryBot.name,
          true,
          primaryBot.team,
          Math.max(0, primaryBot.health / 100),
          Math.max(0, primaryBot.shield / 50)
        );
      }

      engine.damageDealt += totalDmg;
      engine.callbacks.onHitmarker(isHeadshot, hadShield);
      fortniteAudio.playHitmarker(isHeadshot, hadShield);

      engine.addDamageNumber(
        totalDmg.toString(),
        isHeadshot ? '#fbbf24' : hadShield ? '#38bdf8' : '#ef4444',
        isHeadshot,
        hadShield,
        primaryBot.x,
        primaryBot.y + 2.2,
        primaryBot.z
      );

      primaryBot.state = 'combat';
      primaryBot.targetPos = { x: engine.playerPos.x, z: engine.playerPos.z };
      if (primaryBot.health <= 0) {
        engine.eliminateBot(primaryBot, isHeadshot, wep.name);
      }
    }
  }

  // Fire 10 multi-pellet visual tracers spreading out around reticle
  const baseOffset = new THREE.Vector3(0.2, -0.2, -0.4);
  for (let p = 0; p < pelletCount; p++) {
    const pelletRay = new THREE.Raycaster();
    let sx = 0;
    let sy = 0;
    if (p > 0) {
      const angle = ((p - 1) / (pelletCount - 1)) * Math.PI * 2;
      const r = 0.016; // 1-foot spread cone
      sx = Math.cos(angle) * r;
      sy = Math.sin(angle) * r;
    }
    pelletRay.setFromCamera(new THREE.Vector2(sx, sy), engine.camera);
    const hitDist = primaryBot ? primaryBotDist : Math.min(blockDist, 35);
    const end = pelletRay.ray.origin.clone().add(pelletRay.ray.direction.clone().multiplyScalar(hitDist));
    engine.createBulletTracer(engine.camera.position.clone().add(baseOffset), end);
  }
}

export function performBulletRaycastImpl(engine: FortniteEngine, wep: FortniteWeapon) {
  if (wep.type === 'shotgun') {
    engine.performShotgunBlast(wep);
    return;
  }

  const raycaster = new THREE.Raycaster();
  // Pinpoint reticle hit registration: bullet strictly hits whatever is directly inside the aimer in the middle of the screen
  const screenCenter = new THREE.Vector2(0, 0);

  raycaster.setFromCamera(screenCenter, engine.camera);

  const rayOrigin = engine.camera.position.clone();
  const rayDir = raycaster.ray.direction.clone();
  const rayEnd = rayOrigin.clone().add(rayDir.clone().multiplyScalar(wep.range));

  let closestHitDist = wep.range;
  let hitBot: BotPlayer | null = null;
  let isHeadshot = false;
  let hitBuildingPieceId: string | null = null;
  let hitStaticCollider = false;

  const sharedBox = new THREE.Box3();
  const sharedIntersect = new THREE.Vector3();

  // 1. Check Static World Buildings, Houses, Skyscrapers & Warehouses (Bullets MUST NEVER pass through buildings!)
  const candidateColliders = engine.spatialGrid.queryRay(rayOrigin.x, rayOrigin.z, rayEnd.x, rayEnd.z);
  for (let i = 0; i < candidateColliders.length; i++) {
    const sc = candidateColliders[i];
    if (sc.type === 'box' && sc.minX !== undefined && sc.maxX !== undefined) {
      sharedBox.min.set(sc.minX, sc.minY || 0, sc.minZ!);
      sharedBox.max.set(sc.maxX, sc.maxY || 100, sc.maxZ!);
      if (raycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
        const d = rayOrigin.distanceTo(sharedIntersect);
        if (d > 0.2 && d < closestHitDist) {
          closestHitDist = d;
          hitStaticCollider = true;
          hitBuildingPieceId = null;
          hitBot = null;
        }
      }
    } else if (sc.type === 'cylinder' && sc.x !== undefined && sc.z !== undefined && sc.radius !== undefined) {
      const r = sc.radius;
      sharedBox.min.set(sc.x - r, sc.minY || 0, sc.z - r);
      sharedBox.max.set(sc.x + r, sc.maxY || 100, sc.z + r);
      if (raycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
        const d = rayOrigin.distanceTo(sharedIntersect);
        if (d > 0.2 && d < closestHitDist) {
          closestHitDist = d;
          hitStaticCollider = true;
          hitBuildingPieceId = null;
          hitBot = null;
        }
      }
    }
  }

  // 2. Check Player-Built Structures in bullet line (Walls, Ramps, Floors, Cones)
  const candidatePieces = engine.spatialGrid.queryBuildingPiecesRay(rayOrigin.x, rayOrigin.z, rayEnd.x, rayEnd.z);
  for (let i = 0; i < candidatePieces.length; i++) {
    const piece = candidatePieces[i];
    sharedBox.min.set(piece.x - 2.1, piece.y - 0.2, piece.z - 2.1);
    sharedBox.max.set(piece.x + 2.1, piece.y + 4.2, piece.z + 2.1);
    if (raycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
      const d = rayOrigin.distanceTo(sharedIntersect);
      if (d > 0.2 && d < closestHitDist) {
        closestHitDist = d;
        hitBuildingPieceId = piece.id;
        hitStaticCollider = false;
        hitBot = null;
      }
    }
  }

  // 3. Check Remote Online Players (Your Friend / Opponents)
  let hitRemote: { id: string; remote: { state: RemotePlayerState; rig: CharacterMeshRig; respawnsUsed?: number } } | null = null;
  let isRemoteHeadshot = false;

  for (const [rId, remote] of engine.remotePlayers) {
    if (!remote.state.isAlive) continue;
    const rPos = new THREE.Vector3(remote.state.x, remote.state.y + 1.0, remote.state.z);
    const distToRay = raycaster.ray.distanceToPoint(rPos);

    if (distToRay < 1.15) {
      const dToPlayer = rayOrigin.distanceTo(rPos);
      if (dToPlayer > 0.3 && dToPlayer < closestHitDist) {
        closestHitDist = dToPlayer;
        hitRemote = { id: rId, remote };
        hitBot = null;
        hitBuildingPieceId = null;
        hitStaticCollider = false;
        isRemoteHeadshot = raycaster.ray.origin.y + raycaster.ray.direction.y * dToPlayer > remote.state.y + 1.45;
      }
    }
  }

  // 4. Check Bots (Only hit if NOT blocked by a wall or building in front!)
  for (const bot of engine.bots) {
    if (!bot.isAlive) continue;

    const botPos = new THREE.Vector3(bot.x, bot.y + 1.0, bot.z);
    const distToRay = raycaster.ray.distanceToPoint(botPos);

    if (distToRay < 1.05) {
      const dToPlayer = rayOrigin.distanceTo(botPos);
      // Bot is only hit if it is CLOSER than the nearest building / wall!
      if (dToPlayer > 0.3 && dToPlayer < closestHitDist) {
        closestHitDist = dToPlayer;
        hitBot = bot;
        hitRemote = null;
        hitBuildingPieceId = null;
        hitStaticCollider = false;
        isHeadshot = raycaster.ray.origin.y + raycaster.ray.direction.y * dToPlayer > bot.y + 1.45;
      }
    }
  }

  // Process Hit Structure
  if (hitBuildingPieceId) {
    const bData = engine.buildingPieces.get(hitBuildingPieceId);
    if (bData) {
      const isHeavySniper = wep.id === 'sniper_heavy_legendary' || (wep as any).structureDamage >= 1000;
      const dmg = isHeavySniper ? 1000 : (wep as any).structureDamage || wep.damage;
      bData.piece.health -= dmg;
      fortniteAudio.playHarvestHit(bData.piece.material, isHeavySniper);
      engine.addDamageNumber(
        isHeavySniper ? '💥 SHATTER (1000)' : dmg.toString(),
        '#facc15',
        isHeavySniper,
        false,
        bData.piece.x,
        bData.piece.y + 2,
        bData.piece.z
      );

      if (isHeavySniper) {
        engine.screenShake = 0.15;
      }

      if (bData.piece.health <= 0) {
        if (isHeavySniper) {
          fortniteAudio.playBuildResetShockwave();
        }
        fortniteAudio.playStructureDestroy(bData.piece.material);
        engine.scene.remove(bData.mesh);
        engine.buildingPieces.delete(hitBuildingPieceId);
        engine.spatialGrid.removeBuildingPiece(hitBuildingPieceId);
        multiplayerClient.sendPlayerAction({
          type: 'build_destroy',
          pieceId: hitBuildingPieceId,
        });
      }
    }
  } else if (hitStaticCollider) {
    // Bullet hit static world building / skyscraper / house - stopped completely!
    fortniteAudio.playHarvestHit('stone', false);
  } else if (hitRemote) {
    let dmg = wep.damage;
    if (isRemoteHeadshot) dmg = Math.round(dmg * wep.headshotMultiplier);
    engine.damageRemotePlayer(hitRemote.id, hitRemote.remote, dmg, isRemoteHeadshot, wep.name);
  } else if (hitBot) {
    // Friendly fire protection
    if (hitBot.team === engine.playerTeam) {
      engine.addDamageNumber('TEAMMATE', '#38bdf8', false, false, hitBot.x, hitBot.y + 2.2, hitBot.z);
    } else {
      engine.shotsHit++;
      let dmg = wep.damage;
      if (isHeadshot) dmg = Math.round(dmg * wep.headshotMultiplier);

      const hadShield = hitBot.shield > 0;
      if (hitBot.shield > 0) {
        if (hitBot.shield >= dmg) {
          hitBot.shield -= dmg;
        } else {
          const rem = dmg - hitBot.shield;
          hitBot.shield = 0;
          hitBot.health -= rem;
        }
      } else {
        hitBot.health -= dmg;
      }

      // Update bot name tag health/shield bar in real-time!
      const nTag = engine.botNameTags.get(hitBot.id);
      if (nTag) {
        updateNameTagSprite(
          nTag,
          hitBot.name,
          true,
          hitBot.team,
          Math.max(0, hitBot.health / 100),
          Math.max(0, hitBot.shield / 50)
        );
      }

      engine.damageDealt += dmg;
      engine.callbacks.onHitmarker(isHeadshot, hadShield);
      fortniteAudio.playHitmarker(isHeadshot, hadShield);

      engine.addDamageNumber(
        dmg.toString(),
        isHeadshot ? '#fbbf24' : hadShield ? '#38bdf8' : '#ffffff',
        isHeadshot,
        hadShield,
        hitBot.x,
        hitBot.y + 2.2,
        hitBot.z
      );

      hitBot.state = 'combat';
      hitBot.targetPos = { x: engine.playerPos.x, z: engine.playerPos.z };

      if (hitBot.health <= 0) {
        engine.eliminateBot(hitBot, isHeadshot, wep.name);
      }
    }
  }

  const tracerEnd = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(closestHitDist));
  engine.createBulletTracer(engine.camera.position.clone().add(new THREE.Vector3(0.2, -0.2, -0.4)), tracerEnd);
}

export function performPickaxeHitImpl(engine: FortniteEngine) {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), engine.camera);
  const origin = engine.camera.position;
  
  // In 3rd person mode camera is ~2.8m behind player; in 1st person it is at player eye
  const maxRayDist = engine.isFirstPerson ? 5.5 : 9.0;
  const playerReachDist = 4.8;

  let closestDist = maxRayDist;
  let hitBuilding: { id: string; piece: BuildingPiece; mesh: THREE.Mesh; hitPoint: THREE.Vector3 } | null = null;
  let hitHarvestable: { harvestable: HarvestableObject; hitPoint: THREE.Vector3; isCrit: boolean } | null = null;
  let hitBotTarget: { bot: BotPlayer; hitPoint: THREE.Vector3 } | null = null;

  // 1. Raycast Check: Player-Built Pieces (Walls, Ramps, Floors, Cones)
  const queryPieces = engine.spatialGrid.queryBuildingPiecesNear(engine.playerPos.x, engine.playerPos.z, 6.0);
  const pieceBox = new THREE.Box3();
  const pieceIntersect = new THREE.Vector3();

  for (let i = 0; i < queryPieces.length; i++) {
    const p = queryPieces[i];
    const bData = engine.buildingPieces.get(p.id);
    if (!bData) continue;

    // Check direct 3D mesh intersection first
    const intersects = raycaster.intersectObject(bData.mesh, true);
    if (intersects.length > 0 && intersects[0].distance < closestDist) {
      if (intersects[0].point.distanceTo(engine.playerPos) <= playerReachDist) {
        closestDist = intersects[0].distance;
        hitBuilding = { id: p.id, piece: p, mesh: bData.mesh, hitPoint: intersects[0].point };
        hitHarvestable = null;
        hitBotTarget = null;
      }
    } else {
      // AABB fallback for edge hits
      pieceBox.min.set(p.x - 2.1, p.y - 0.3, p.z - 2.1);
      pieceBox.max.set(p.x + 2.1, p.y + 4.2, p.z + 2.1);
      if (raycaster.ray.intersectBox(pieceBox, pieceIntersect)) {
        const d = origin.distanceTo(pieceIntersect);
        if (d < closestDist && pieceIntersect.distanceTo(engine.playerPos) <= playerReachDist) {
          closestDist = d;
          hitBuilding = { id: p.id, piece: p, mesh: bData.mesh, hitPoint: pieceIntersect.clone() };
          hitHarvestable = null;
          hitBotTarget = null;
        }
      }
    }
  }

  // 2. Raycast Check: Harvestable Props (Trees, Rocks, Cars, Containers)
  const harvBox = new THREE.Box3();
  const harvIntersect = new THREE.Vector3();
  for (const h of engine.harvestables) {
    if (h.health <= 0) continue;
    const dist2D = Math.hypot(h.x - engine.playerPos.x, h.z - engine.playerPos.z);
    if (dist2D > h.radius + 5.5) continue;

    // Ensure generous hit box for tree trunks and rocks
    const hitRadius = Math.max(h.radius, 1.4);
    harvBox.min.set(h.x - hitRadius, h.y - 0.5, h.z - hitRadius);
    harvBox.max.set(h.x + hitRadius, h.y + h.height + 0.5, h.z + hitRadius);
    if (raycaster.ray.intersectBox(harvBox, harvIntersect)) {
      const d = origin.distanceTo(harvIntersect);
      if (d < closestDist && harvIntersect.distanceTo(engine.playerPos) <= playerReachDist + 0.8) {
        closestDist = d;
        hitHarvestable = { harvestable: h, hitPoint: harvIntersect.clone(), isCrit: Math.random() < 0.28 };
        hitBuilding = null;
        hitBotTarget = null;
      }
    }
  }

  // 3. Raycast Check: Enemy Bots
  let hitRemoteTarget: { id: string; remote: { state: RemotePlayerState; rig: CharacterMeshRig; respawnsUsed?: number }; hitPoint: THREE.Vector3 } | null = null;
  for (const [rId, remote] of engine.remotePlayers) {
    if (!remote.state.isAlive) continue;
    const distToPlayer = Math.hypot(remote.state.x - engine.playerPos.x, remote.state.z - engine.playerPos.z);
    if (distToPlayer > playerReachDist + 1.2) continue;

    const rBox = new THREE.Box3(
      new THREE.Vector3(remote.state.x - 0.75, remote.state.y, remote.state.z - 0.75),
      new THREE.Vector3(remote.state.x + 0.75, remote.state.y + 2.1, remote.state.z + 0.75)
    );
    const rIntersect = new THREE.Vector3();
    if (raycaster.ray.intersectBox(rBox, rIntersect)) {
      const d = origin.distanceTo(rIntersect);
      if (d < closestDist) {
        closestDist = d;
        hitRemoteTarget = { id: rId, remote, hitPoint: rIntersect.clone() };
        hitBuilding = null;
        hitHarvestable = null;
        hitBotTarget = null;
      }
    }
  }

  for (const bot of engine.bots) {
    if (!bot.isAlive) continue;
    const distToPlayer = Math.hypot(bot.x - engine.playerPos.x, bot.z - engine.playerPos.z);
    if (distToPlayer > playerReachDist) continue;

    const botBox = new THREE.Box3(
      new THREE.Vector3(bot.x - 0.7, bot.y, bot.z - 0.7),
      new THREE.Vector3(bot.x + 0.7, bot.y + 2.0, bot.z + 0.7)
    );
    const botIntersect = new THREE.Vector3();
    if (raycaster.ray.intersectBox(botBox, botIntersect)) {
      const d = origin.distanceTo(botIntersect);
      if (d < closestDist) {
        closestDist = d;
        hitBotTarget = { bot, hitPoint: botIntersect.clone() };
        hitBuilding = null;
        hitHarvestable = null;
        hitRemoteTarget = null;
      }
    }
  }

  // 4. Proximity & Forward Arc Fallback for Trees and Harvestables
  if (!hitBuilding && !hitHarvestable && !hitBotTarget) {
    const fwd2D = new THREE.Vector2(-Math.sin(engine.playerRotY), -Math.cos(engine.playerRotY));
    let bestHarvestableScore = -1;

    for (const h of engine.harvestables) {
      if (h.health <= 0) continue;
      const toHarv = new THREE.Vector2(h.x - engine.playerPos.x, h.z - engine.playerPos.z);
      const dist = toHarv.length();
      if (dist <= h.radius + 3.0 && Math.abs(engine.playerPos.y - h.y) < 5.5) {
        const dir = toHarv.clone().normalize();
        const dot = dir.dot(fwd2D);
        if (dot > 0.2 && dot > bestHarvestableScore) {
          bestHarvestableScore = dot;
          hitHarvestable = {
            harvestable: h,
            hitPoint: new THREE.Vector3(
              h.x + (engine.playerPos.x - h.x) * 0.35,
              engine.playerPos.y + 1.2,
              h.z + (engine.playerPos.z - h.z) * 0.35
            ),
            isCrit: Math.random() < 0.28,
          };
        }
      }
    }
  }

  // 5. Proximity Fallback for Player Structures
  if (!hitBuilding && !hitHarvestable && !hitBotTarget) {
    const fwd = new THREE.Vector3();
    engine.camera.getWorldDirection(fwd);

    for (let i = 0; i < queryPieces.length; i++) {
      const p = queryPieces[i];
      const bData = engine.buildingPieces.get(p.id);
      if (!bData) continue;
      const toPiece = new THREE.Vector3(p.x, p.y + 1.5, p.z).sub(engine.playerPos);
      const dist = toPiece.length();
      if (dist <= 3.8 && toPiece.normalize().dot(fwd) > 0.35) {
        hitBuilding = { id: p.id, piece: p, mesh: bData.mesh, hitPoint: new THREE.Vector3(p.x, p.y + 1.5, p.z) };
        break;
      }
    }
  }

  // EXECUTE PICKAXE HIT ACTIONS:
  if (hitBuilding) {
    const { id, piece, mesh, hitPoint } = hitBuilding;
    const damage = 100;
    piece.health -= damage;
    fortniteAudio.playHarvestHit(piece.material, true);

    // Reward materials for breaking structures
    const matYield = 10;
    if (piece.material === 'wood') engine.wood = Math.min(999, engine.wood + matYield);
    else if (piece.material === 'stone') engine.stone = Math.min(999, engine.stone + matYield);
    else if (piece.material === 'metal') engine.metal = Math.min(999, engine.metal + matYield);
    engine.callbacks.onMaterialsChange(engine.wood, engine.stone, engine.metal);

    engine.createHarvestParticleEffect(hitPoint, piece.material);
    engine.addDamageNumber(damage.toString(), '#facc15', false, false, hitPoint.x, hitPoint.y + 0.3, hitPoint.z);

    if (piece.health <= 0) {
      fortniteAudio.playStructureDestroy(piece.material);
      engine.scene.remove(mesh);
      engine.buildingPieces.delete(id);
      engine.spatialGrid.removeBuildingPiece(id);
      multiplayerClient.sendPlayerAction({
        type: 'build_destroy',
        pieceId: id,
      });
    }
    return;
  }

  if (hitHarvestable) {
    const { harvestable: h, hitPoint, isCrit } = hitHarvestable;
    const damage = isCrit ? 100 : 50;
    h.health -= damage;

    // Calculate wood or resource yield
    let yieldAmount = h.yieldPerHit;
    if (isCrit) yieldAmount = Math.round(yieldAmount * 1.6);

    // Award materials!
    if (h.materialType === 'wood') engine.wood = Math.min(999, engine.wood + yieldAmount);
    else if (h.materialType === 'stone') engine.stone = Math.min(999, engine.stone + yieldAmount);
    else if (h.materialType === 'metal') engine.metal = Math.min(999, engine.metal + yieldAmount);

    engine.callbacks.onMaterialsChange(engine.wood, engine.stone, engine.metal);
    fortniteAudio.playHarvestHit(h.materialType, isCrit);

    // Screen impact & particle effects
    engine.screenShake = Math.max(engine.screenShake, isCrit ? 0.05 : 0.03);
    engine.createHarvestParticleEffect(hitPoint, h.materialType);

    // Tree wobble animation
    const treeMesh = engine.harvestableMeshes.get(h.id);
    if (treeMesh) {
      engine.animateHarvestImpact(treeMesh);
    }

    if (h.health <= 0) {
      // Complete Tree Destruction Bonus!
      const bonusYield = h.materialType === 'wood' ? 35 : h.materialType === 'stone' ? 25 : 20;
      if (h.materialType === 'wood') engine.wood = Math.min(999, engine.wood + bonusYield);
      else if (h.materialType === 'stone') engine.stone = Math.min(999, engine.stone + bonusYield);
      else if (h.materialType === 'metal') engine.metal = Math.min(999, engine.metal + bonusYield);

      engine.callbacks.onMaterialsChange(engine.wood, engine.stone, engine.metal);
      fortniteAudio.playStructureDestroy(h.materialType);

      if (engine.callbacks.onItemCollected) {
        engine.callbacks.onItemCollected({
          id: `col_harv_dest_${Date.now()}_${Math.random()}`,
          title: `+${bonusYield} ${h.materialType.toUpperCase()} (CHOPPED DOWN!)`,
          subtitle: `Total: ${h.materialType === 'wood' ? engine.wood : h.materialType === 'stone' ? engine.stone : engine.metal}`,
          icon: h.materialType === 'wood' ? '🪵' : '🪨',
          amount: `+${bonusYield}`,
          type: 'material',
          color: '#f59e0b',
          timestamp: Date.now(),
        });
      }

      engine.addDamageNumber(
        `+${bonusYield} ${h.materialType.toUpperCase()} (DESTROYED)`,
        '#f59e0b',
        true,
        false,
        hitPoint.x,
        hitPoint.y + 0.8,
        hitPoint.z
      );

      if (treeMesh) {
        engine.animateHarvestDestruction(treeMesh, h);
      }
      engine.removeHarvestableCollider(h);
    } else {
      const matIcon = h.materialType === 'wood' ? '🪵' : h.materialType === 'stone' ? '🪨' : '🔩';
      const total = h.materialType === 'wood' ? engine.wood : h.materialType === 'stone' ? engine.stone : engine.metal;

      if (engine.callbacks.onItemCollected) {
        engine.callbacks.onItemCollected({
          id: `col_harv_${Date.now()}_${Math.random()}`,
          title: `+${yieldAmount} ${h.materialType.toUpperCase()}${isCrit ? ' (CRIT!)' : ''}`,
          subtitle: `Total: ${total}`,
          icon: matIcon,
          amount: `+${yieldAmount}`,
          type: 'material',
          color: isCrit ? '#38bdf8' : h.materialType === 'wood' ? '#f59e0b' : h.materialType === 'stone' ? '#a8a29e' : '#94a3b8',
          timestamp: Date.now(),
        });
      }

      engine.addDamageNumber(
        `+${yieldAmount} ${h.materialType.toUpperCase()}`,
        isCrit ? '#38bdf8' : '#facc15',
        isCrit,
        false,
        hitPoint.x,
        hitPoint.y + 0.5,
        hitPoint.z
      );
    }
    return;
  }

  if (hitRemoteTarget) {
    engine.damageRemotePlayer(hitRemoteTarget.id, hitRemoteTarget.remote, 20, false, 'Harvesting Tool');
    fortniteAudio.playHarvestHit('stone', false);
    return;
  }

  if (hitBotTarget) {
    const { bot, hitPoint } = hitBotTarget;
    if (bot.team !== engine.playerTeam) {
      bot.health -= 25;
      fortniteAudio.playHitmarker(false, false);
      engine.addDamageNumber('25', '#ffffff', false, false, hitPoint.x, hitPoint.y + 0.5, hitPoint.z);

      const nTag = engine.botNameTags.get(bot.id);
      if (nTag) {
        updateNameTagSprite(nTag, bot.name, true, bot.team, Math.max(0, bot.health / 100), Math.max(0, bot.shield / 50));
      }

      if (bot.health <= 0) {
        engine.eliminateBot(bot, false, 'Harvesting Tool');
      }
    }
  }
}

export function updateScopeTrajectoryImpl(engine: FortniteEngine) {
  const wep = engine.getCurrentWeapon();
  const isAimingGun =
    engine.isAimingDownSights &&
    !engine.isSkydiving &&
    !engine.activeVehicle &&
    wep !== null &&
    wep.type !== 'pickaxe' &&
    wep.type !== 'shield' &&
    wep.type !== 'heal';

  if (!isAimingGun || !engine.scopeLaserLine || !engine.scopeImpactMarker) {
    if (engine.scopeLaserLine) engine.scopeLaserLine.visible = false;
    if (engine.scopeImpactMarker) engine.scopeImpactMarker.visible = false;
    if (engine.callbacks.onAimingChange) {
      engine.callbacks.onAimingChange(false, null);
    }
    return;
  }

  engine.sharedRaycaster.setFromCamera(engine.sharedCenterVec, engine.camera);
  const maxRange = wep ? wep.range : 300;
  let closestDist = maxRange;
  let hitName = 'SURFACE';
  let isBotHit = false;
  let isHeadshotHit = false;

  // 1. Check Bots
  for (let i = 0; i < engine.bots.length; i++) {
    const bot = engine.bots[i];
    if (!bot.isAlive) continue;
    const botPos = new THREE.Vector3(bot.x, bot.y + 1.0, bot.z);
    const distToRay = engine.sharedRaycaster.ray.distanceToPoint(botPos);
    if (distToRay < 1.1) {
      const d = engine.camera.position.distanceTo(botPos);
      if (d < closestDist) {
        closestDist = d;
        hitName = `${bot.name} (${bot.team})`;
        isBotHit = true;
        isHeadshotHit = engine.sharedRaycaster.ray.origin.y + engine.sharedRaycaster.ray.direction.y * d > bot.y + 1.45;
      }
    }
  }

  // 2. Check Static Colliders in ray direction
  const sharedBox = new THREE.Box3();
  const sharedIntersect = new THREE.Vector3();
  const rayMidX = engine.camera.position.x + engine.sharedRaycaster.ray.direction.x * (maxRange * 0.5);
  const rayMidZ = engine.camera.position.z + engine.sharedRaycaster.ray.direction.z * (maxRange * 0.5);
  const candidateColliders = engine.spatialGrid.queryNear(rayMidX, rayMidZ, maxRange * 0.6);

  for (let i = 0; i < candidateColliders.length; i++) {
    const sc = candidateColliders[i];
    if (sc.type === 'box' && sc.minX !== undefined && sc.maxX !== undefined) {
      sharedBox.min.set(sc.minX, sc.minY || 0, sc.minZ!);
      sharedBox.max.set(sc.maxX, sc.maxY || 100, sc.maxZ!);
      if (engine.sharedRaycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
        const d = engine.camera.position.distanceTo(sharedIntersect);
        if (d < closestDist) {
          closestDist = d;
          hitName = sc.name ? sc.name.toUpperCase() : 'SKYSCRAPER / BUILDING';
          isBotHit = false;
          isHeadshotHit = false;
        }
      }
    }
  }

  // 3. Check Building Pieces in ray direction
  const candidatePieces = engine.spatialGrid.queryBuildingPiecesNear(rayMidX, rayMidZ, maxRange * 0.6);
  for (let i = 0; i < candidatePieces.length; i++) {
    const piece = candidatePieces[i];
    sharedBox.min.set(piece.x - 2.1, piece.y - 0.2, piece.z - 2.1);
    sharedBox.max.set(piece.x + 2.1, piece.y + 4.2, piece.z + 2.1);
    if (engine.sharedRaycaster.ray.intersectBox(sharedBox, sharedIntersect)) {
      const d = engine.camera.position.distanceTo(sharedIntersect);
      if (d < closestDist) {
        closestDist = d;
        hitName = `STRUCTURE [${piece.material.toUpperCase()}]`;
        isBotHit = false;
        isHeadshotHit = false;
      }
    }
  }

  // 4. Ground Elevation Intersection (fast 3.5m marching)
  const stepSize = 3.5;
  for (let d = 3.5; d < closestDist; d += stepSize) {
    _marchP.copy(engine.sharedRaycaster.ray.origin).addScaledVector(engine.sharedRaycaster.ray.direction, d);
    const groundH = engine.getGroundElevationAt(_marchP.x, _marchP.z, _marchP.y);
    if (_marchP.y <= groundH) {
      closestDist = d;
      hitName = `TERRAIN ELEVATION (${Math.round(groundH)}m)`;
      isBotHit = false;
      isHeadshotHit = false;
      break;
    }
  }

  _impactPos.copy(engine.sharedRaycaster.ray.origin).addScaledVector(engine.sharedRaycaster.ray.direction, closestDist);
  _muzzleOffset.set(0.2, -0.22, -0.6).applyQuaternion(engine.camera.quaternion);
  _muzzlePos.copy(engine.camera.position).add(_muzzleOffset);

  const positions = (engine.scopeLaserLine.geometry as THREE.BufferGeometry).attributes.position;
  positions.setXYZ(0, _muzzlePos.x, _muzzlePos.y, _muzzlePos.z);
  positions.setXYZ(1, _impactPos.x, _impactPos.y, _impactPos.z);
  positions.needsUpdate = true;
  engine.scopeLaserLine.visible = true;

  engine.scopeImpactMarker.position.copy(_impactPos);
  engine.scopeImpactMarker.lookAt(engine.camera.position);
  engine.scopeImpactMarker.visible = true;

  const targetColor = isHeadshotHit ? 0xf59e0b : isBotHit ? 0xef4444 : 0x00f0ff;
  if (engine.scopePointLight) engine.scopePointLight.color.setHex(targetColor);
  (engine.scopeLaserLine.material as THREE.LineBasicMaterial).color.setHex(targetColor);

  const now = performance.now();
  if (now - engine.lastAimSyncTime > 60 || hitName !== engine.lastAimTargetName) {
    engine.lastAimSyncTime = now;
    engine.lastAimTargetName = hitName;
    if (engine.callbacks.onAimingChange) {
      engine.callbacks.onAimingChange(true, {
        distance: Math.round(closestDist),
        targetName: hitName,
        isBot: isBotHit,
        isHeadshot: isHeadshotHit,
        hitX: _impactPos.x,
        hitY: _impactPos.y,
        hitZ: _impactPos.z,
      });
    }
  }
}
