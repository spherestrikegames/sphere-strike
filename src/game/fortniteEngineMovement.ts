// Player movement, ground/collision resolution, camera rig update, storm shrink logic.
import * as THREE from 'three';
import { getTerrainHeight, getGroundSurface, isPointInLake, SKYSCRAPER_LAUNCH_PADS } from './fortniteWorld';
import { calculateRampHeightAt } from './fortniteBuilding';
import { fortniteAudio } from '../utils/audio';
import type { FortniteEngine } from './fortniteEngine';


export function getGroundElevationAtImpl(engine: FortniteEngine, x: number, z: number, currentY: number): number {
  let highestY = engine.mode === '1v1_build_fight' ? 0.0 : getTerrainHeight(x, z);

  // 1. Fast local query for player placed floors, ramps, and cones
  const nearbyPieces = engine.spatialGrid.queryBuildingPiecesNear(x, z, 3.5);
  for (let i = 0; i < nearbyPieces.length; i++) {
    const piece = nearbyPieces[i];
    if (piece.type === 'floor') {
      if (Math.abs(x - piece.x) <= 2.2 && Math.abs(z - piece.z) <= 2.2) {
        if (currentY >= piece.y - 1.5) {
          highestY = Math.max(highestY, piece.y);
        }
      }
    } else if (piece.type === 'ramp') {
      const rampH = calculateRampHeightAt(piece, x, z);
      if (rampH !== null && currentY >= rampH - 1.5) {
        highestY = Math.max(highestY, rampH);
      }
    } else if (piece.type === 'cone') {
      if (Math.abs(x - piece.x) <= 2.1 && Math.abs(z - piece.z) <= 2.1) {
        const dist = Math.hypot(x - piece.x, z - piece.z);
        const coneH = piece.y + Math.max(0, (2.0 - dist) * 0.5);
        if (currentY >= coneH - 1.5) {
          highestY = Math.max(highestY, coneH);
        }
      }
    }
  }

  // 2. Fast local query for static building stairs, floors, step slabs, roofs, dam, bridges
  const nearbyColliders = engine.spatialGrid.queryNear(x, z, 4.0);
  for (let i = 0; i < nearbyColliders.length; i++) {
    const col = nearbyColliders[i];
    if (
      col.type === 'box' &&
      col.minX !== undefined &&
      col.maxX !== undefined &&
      col.minZ !== undefined &&
      col.maxZ !== undefined &&
      col.maxY !== undefined
    ) {
      if (x >= col.minX - 0.25 && x <= col.maxX + 0.25 && z >= col.minZ - 0.25 && z <= col.maxZ + 0.25) {
        const colMinY = col.minY ?? 0;
        if (currentY >= colMinY - 0.9 && col.maxY <= currentY + 1.2) {
          highestY = Math.max(highestY, col.maxY);
        }
      }
    } else if (
      col.type === 'cylinder' &&
      col.x !== undefined &&
      col.z !== undefined &&
      col.radius !== undefined &&
      col.maxY !== undefined
    ) {
      const dist = Math.hypot(x - col.x, z - col.z);
      if (dist <= col.radius + 0.25) {
        const colMinY = col.minY ?? 0;
        if (currentY >= colMinY - 0.9 && col.maxY <= currentY + 1.2) {
          highestY = Math.max(highestY, col.maxY);
        }
      }
    }
  }

  return highestY;
}

export function checkAndResolveSolidCollisionsImpl(engine: FortniteEngine, newX: number,
    newZ: number,
    currentY: number,
    radius: number = 0.48): { x: number; z: number } {
  let resX = newX;
  let resZ = newZ;

  // Multi-pass resolution with spatial grid bounding
  for (let pass = 0; pass < 2; pass++) {
    // A. Query only local static colliders (reduces checks from 500+ down to ~2-4)
    const nearbyColliders = engine.spatialGrid.queryNear(resX, resZ, radius + 3.0);
    for (let i = 0; i < nearbyColliders.length; i++) {
      const col = nearbyColliders[i];
      if (col.type === 'box') {
        if (
          col.minX === undefined ||
          col.maxX === undefined ||
          col.minZ === undefined ||
          col.maxZ === undefined
        )
          continue;

        const colMinY = col.minY ?? 0;
        const colMaxY = col.maxY ?? 100;

        // If vertically entirely above the roof or entirely below bottom, ignore horizontal collision
        if (currentY + 1.8 < colMinY - 0.1) continue;
        if (currentY >= colMaxY - 0.2) continue;

        // If this is a step/stair and player is high enough to step onto it (<= 0.65m step rise), allow step-up
        const isStairStep =
          (col.name && (col.name.toLowerCase().includes('step') || col.name.toLowerCase().includes('stair'))) ||
          (colMaxY - currentY <= 0.65 && colMaxY - colMinY <= 0.65);
        if (isStairStep && currentY >= colMaxY - 0.65) continue;

        const closestX = Math.max(col.minX, Math.min(resX, col.maxX));
        const closestZ = Math.max(col.minZ, Math.min(resZ, col.maxZ));
        const dx = resX - closestX;
        const dz = resZ - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < 0.00001) {
          // Player/vehicle center is inside the box: push out to nearest exterior face
          const dMinX = Math.abs(resX - col.minX);
          const dMaxX = Math.abs(col.maxX - resX);
          const dMinZ = Math.abs(resZ - col.minZ);
          const dMaxZ = Math.abs(col.maxZ - resZ);
          const minPen = Math.min(dMinX, dMaxX, dMinZ, dMaxZ);
          if (minPen === dMinX) resX = col.minX - radius;
          else if (minPen === dMaxX) resX = col.maxX + radius;
          else if (minPen === dMinZ) resZ = col.minZ - radius;
          else resZ = col.maxZ + radius;
        } else if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          resX += (dx / dist) * overlap;
          resZ += (dz / dist) * overlap;
        }
      } else if (col.type === 'cylinder') {
        if (col.x === undefined || col.z === undefined || col.radius === undefined) continue;

        const colMinY = col.minY ?? 0;
        const colMaxY = col.maxY ?? 100;

        if (currentY + 1.8 < colMinY - 0.1) continue;
        if (currentY >= colMaxY - 0.2) continue;

        const dx = resX - col.x;
        const dz = resZ - col.z;
        const dist = Math.hypot(dx, dz);
        const minDist = col.radius + radius;

        if (dist < minDist) {
          if (dist > 0.0001) {
            const push = minDist - dist;
            resX += (dx / dist) * push;
            resZ += (dz / dist) * push;
          } else {
            resX += minDist;
          }
        }
      }
    }

    // B. Query only local player-built structures (walls, ramps, solid obstacles)
    const nearbyPieces = engine.spatialGrid.queryBuildingPiecesNear(resX, resZ, radius + 3.0);
    for (let i = 0; i < nearbyPieces.length; i++) {
      const piece = nearbyPieces[i];
      if (piece.type === 'wall') {
        if (currentY >= piece.y - 0.2 && currentY <= piece.y + 4.2) {
          const cos = Math.cos(-piece.rotY);
          const sin = Math.sin(-piece.rotY);
          const dx = resX - piece.x;
          const dz = resZ - piece.z;
          const localX = dx * cos - dz * sin;
          const localZ = dx * sin + dz * cos;

          if (Math.abs(localX) <= 2.25 && Math.abs(localZ) <= 0.4 + radius) {
            const pushZ = (0.4 + radius - Math.abs(localZ)) * Math.sign(localZ || 1);
            // Inverse orthogonal rotation: [dx, dz]^T = [cos sin; -sin cos]^T * [0, pushZ]^T
            const worldPushX = sin * pushZ;
            const worldPushZ = cos * pushZ;
            resX += worldPushX;
            resZ += worldPushZ;
          }
        }
      } else if (piece.type === 'ramp') {
        // If player is lower than the ramp slope (e.g. attempting to walk into back/solid sides)
        const cos = Math.cos(-piece.rotY);
        const sin = Math.sin(-piece.rotY);
        const dx = resX - piece.x;
        const dz = resZ - piece.z;
        const localX = dx * cos - dz * sin;
        const localZ = dx * sin + dz * cos;

        if (Math.abs(localX) <= 2.25 && Math.abs(localZ) <= 2.25) {
          const rampH = calculateRampHeightAt(piece, resX, resZ);
          if (rampH !== null && currentY < rampH - 0.7) {
            // High back or sides of ramp blocks horizontal passage
            if (Math.abs(localX) > 1.8) {
              const pushX = (2.25 + radius - Math.abs(localX)) * Math.sign(localX || 1);
              resX += cos * pushX;
              resZ += -sin * pushX;
            } else if (localZ > 1.6) {
              // High back wall of ramp
              const pushZ = (2.25 + radius - localZ);
              resX += sin * pushZ;
              resZ += cos * pushZ;
            }
          }
        }
      }
    }
  }

  return { x: resX, z: resZ };
}

export function updateSkydivingAndMovementImpl(engine: FortniteEngine, dt: number) {
  // 1. SKYDIVING DROP PHASE
  if (engine.isSkydiving) {
    engine.windAudioTimer += dt;
    if (engine.windAudioTimer > 0.25) {
      engine.windAudioTimer = 0;
      fortniteAudio.playWindRush();
    }

    const forward = new THREE.Vector3(-Math.sin(engine.playerRotY), 0, -Math.cos(engine.playerRotY));
    const right = new THREE.Vector3(Math.cos(engine.playerRotY), 0, -Math.sin(engine.playerRotY));

    let steerSpeed = engine.isGliding ? 24.0 : 16.0;
    const moveDir = new THREE.Vector3();
    if (engine.keys['KeyW'] || engine.keys['ArrowUp']) moveDir.add(forward);
    if (engine.keys['KeyS'] || engine.keys['ArrowDown']) moveDir.sub(forward);
    if (engine.keys['KeyD'] || engine.keys['ArrowRight']) moveDir.add(right);
    if (engine.keys['KeyA'] || engine.keys['ArrowLeft']) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      engine.playerVel.x = moveDir.x * steerSpeed;
      engine.playerVel.z = moveDir.z * steerSpeed;
    } else {
      engine.playerVel.x *= 0.92;
      engine.playerVel.z *= 0.92;
    }

    const descentSpeed = engine.isGliding ? -9.0 : -26.0;
    engine.playerVel.y = THREE.MathUtils.lerp(engine.playerVel.y, descentSpeed, dt * 6.0);

    engine.playerPos.x += engine.playerVel.x * dt;
    engine.playerPos.y += engine.playerVel.y * dt;
    engine.playerPos.z += engine.playerVel.z * dt;

    const groundY = engine.getGroundElevationAt(engine.playerPos.x, engine.playerPos.z, engine.playerPos.y);
    const roundedAlt = Math.max(0, Math.round(engine.playerPos.y - groundY));
    if (Math.abs(roundedAlt - engine.lastAltitudeSync) >= 2) {
      engine.lastAltitudeSync = roundedAlt;
      engine.callbacks.onSkydivingUpdate(engine.isSkydiving, engine.isGliding, roundedAlt);
    }

    if (engine.playerPos.y <= groundY + 0.8) {
      engine.playerPos.y = groundY;
      engine.playerVel.y = 0;
      engine.isSkydiving = false;
      engine.isGliding = false;
      engine.gameStarted = true;
      engine.isGrounded = true;

      if (engine.gliderMesh) engine.gliderMesh.visible = false;
      fortniteAudio.playTouchdown();
      fortniteAudio.startGameMusic();
      engine.callbacks.onTouchdown();
      engine.callbacks.onSkydivingUpdate(false, false, 0);
    }
    return;
  }

  // 2. ON-GROUND FAST MOVEMENT WITH SOLID COLLISION
  engine.isSprinting = engine.keys['ShiftLeft'] || engine.keys['ShiftRight'];
  engine.isCrouching = engine.keys['KeyC'] || engine.keys['ControlLeft'];

  if (engine.isSliding) {
    engine.slideTimer -= dt;
    if (engine.slideTimer <= 0) {
      engine.isSliding = false;
    }
  }

  let moveSpeed = engine.isSliding
    ? 19.5
    : engine.isSprinting
    ? 16.5
    : engine.isCrouching
    ? 5.5
    : 10.5;

  if (engine.isAimingDownSights) moveSpeed *= 0.65;

  const forward = new THREE.Vector3(-Math.sin(engine.playerRotY), 0, -Math.cos(engine.playerRotY));
  const right = new THREE.Vector3(Math.cos(engine.playerRotY), 0, -Math.sin(engine.playerRotY));

  const moveDir = new THREE.Vector3();
  if (engine.keys['KeyW'] || engine.keys['ArrowUp']) moveDir.add(forward);
  if (engine.keys['KeyS'] || engine.keys['ArrowDown']) moveDir.sub(forward);
  if (engine.keys['KeyD'] || engine.keys['ArrowRight']) moveDir.add(right);
  if (engine.keys['KeyA'] || engine.keys['ArrowLeft']) moveDir.sub(right);

  if (moveDir.lengthSq() > 0) {
    moveDir.normalize();
    engine.playerVel.x = moveDir.x * moveSpeed;
    engine.playerVel.z = moveDir.z * moveSpeed;
  } else {
    engine.playerVel.x *= 0.78;
    engine.playerVel.z *= 0.78;
  }

  if (engine.isGrounded && moveDir.lengthSq() > 0.01) {
    engine.footstepTimer += dt;
    const stepInterval = engine.isSprinting ? 0.28 : engine.isCrouching ? 0.52 : 0.36;
    if (engine.footstepTimer >= stepInterval) {
      engine.footstepTimer = 0;
      if (isPointInLake(engine.playerPos.x, engine.playerPos.z)) {
        fortniteAudio.playWaterSplash();
      } else {
        const surface = getGroundSurface(
          engine.playerPos.x,
          engine.playerPos.z,
          engine.playerPos.y
        );
        fortniteAudio.playFootstep(surface);
      }
    }
  } else {
    engine.footstepTimer = 0.2;
  }

  if (engine.keys['Space'] && engine.isGrounded) {
    engine.playerVel.y = 11.5;
    engine.isGrounded = false;
    fortniteAudio.playJump();
  }

  engine.playerVel.y -= 26.0 * dt;

  const nextX = engine.playerPos.x + engine.playerVel.x * dt;
  const nextZ = engine.playerPos.z + engine.playerVel.z * dt;

  const resolved = engine.checkAndResolveSolidCollisions(nextX, nextZ, engine.playerPos.y);
  engine.playerPos.x = resolved.x;
  engine.playerPos.z = resolved.z;
  const prevFallY = engine.playerPos.y;
  engine.playerPos.y += engine.playerVel.y * dt;

  // Solid Ceiling Collision: Prevent jumping upward through player-built floors or cone roofs
  if (engine.playerVel.y > 0) {
    const playerHeadY = engine.playerPos.y + 1.85;
    const nearbyCeilings = engine.spatialGrid.queryBuildingPiecesNear(engine.playerPos.x, engine.playerPos.z, 2.5);
    for (let i = 0; i < nearbyCeilings.length; i++) {
      const piece = nearbyCeilings[i];
      if (piece.type === 'floor' || piece.type === 'cone') {
        if (Math.abs(engine.playerPos.x - piece.x) <= 2.1 && Math.abs(engine.playerPos.z - piece.z) <= 2.1) {
          if (playerHeadY >= piece.y - 0.25 && engine.playerPos.y < piece.y) {
            engine.playerPos.y = piece.y - 1.9;
            engine.playerVel.y = 0;
            break;
          }
        }
      }
    }
  }

  engine.playerPos.x = Math.max(-270, Math.min(270, engine.playerPos.x));
  engine.playerPos.z = Math.max(-270, Math.min(270, engine.playerPos.z));

  // Skyscraper Ground Ascenders & Rooftop Super Bounce Pads
  for (let i = 0; i < SKYSCRAPER_LAUNCH_PADS.length; i++) {
    const pad = SKYSCRAPER_LAUNCH_PADS[i];
    const dx = engine.playerPos.x - pad.x;
    const dz = engine.playerPos.z - pad.z;
    if (dx * dx + dz * dz <= 2.2 * 2.2 && Math.abs(engine.playerPos.y - pad.y) <= 2.8) {
      if (engine.playerVel.y <= 1.5) {
        const deltaH = Math.max(14, pad.targetY - engine.playerPos.y + 3.0);
        engine.playerVel.y = Math.sqrt(2 * 32.0 * deltaH);
        engine.isGrounded = false;
        engine.isSliding = false;
        fortniteAudio.playJump();
        engine.screenShake = 0.12;
        break;
      }
    }
  }

  const groundElevation = engine.getGroundElevationAt(
    engine.playerPos.x,
    engine.playerPos.z,
    Math.max(prevFallY, engine.playerPos.y)
  );

  if (engine.playerPos.y <= groundElevation) {
    engine.playerPos.y = groundElevation;
    engine.playerVel.y = 0;
    engine.isGrounded = true;
  } else {
    engine.isGrounded = false;
  }
}

export function updateCameraAndRigsImpl(engine: FortniteEngine, dt: number) {
  const eyeHeight = engine.isCrouching || engine.isSliding ? 1.0 : 1.75;

  const shakeOffset = (Math.random() - 0.5) * engine.screenShake;
  engine.screenShake = THREE.MathUtils.lerp(engine.screenShake, 0, dt * 12);

  const euler = new THREE.Euler(engine.playerPitch + shakeOffset, engine.playerRotY + shakeOffset, 0, 'YXZ');
  engine.camera.quaternion.setFromEuler(euler);

  engine.recoilRecoilZ = THREE.MathUtils.lerp(engine.recoilRecoilZ, 0, dt * 14);
  engine.recoilRecoilY = THREE.MathUtils.lerp(engine.recoilRecoilY, 0, dt * 14);
  engine.recoilRecoilRotX = THREE.MathUtils.lerp(engine.recoilRecoilRotX, 0, dt * 14);

  if (engine.activeVehicle) {
    const v = engine.activeVehicle;
    const speedRatio = Math.min(1.0, Math.abs(v.speed) / (v.maxSpeed || 28));

    // Always in 3rd person inside the cars: Dynamic cinematic chase camera trailing behind vehicle
    const chaseDist = 6.4 + speedRatio * 1.8;
    const chaseHeight = 2.4 + speedRatio * 0.35 + Math.sin(performance.now() * 0.012) * speedRatio * 0.035;

    // Camera orientation driven by player mouse look (clamped so camera never clips underground)
    const clampedPitch = Math.max(-0.35, Math.min(0.65, engine.playerPitch));
    const camEuler = new THREE.Euler(clampedPitch + shakeOffset, engine.playerRotY + shakeOffset, 0, 'YXZ');
    engine.camera.quaternion.setFromEuler(camEuler);

    // Chase camera offset trailing behind the car
    const chaseOffset = new THREE.Vector3(0, chaseHeight, chaseDist);
    chaseOffset.applyQuaternion(engine.camera.quaternion);

    const carCenter = new THREE.Vector3(v.x, v.y + 0.85, v.z);
    engine.camera.position.copy(carCenter).add(chaseOffset);

    // Dynamic FOV with speed sensation
    const targetFov = (engine.profile.settings.fov || 75) + speedRatio * 10;
    engine.camera.fov = THREE.MathUtils.lerp(engine.camera.fov, targetFov, dt * 8);
    engine.camera.updateProjectionMatrix();

    // Show and position 3rd person character inside the driver seat
    if (engine.thirdPersonRig) {
      engine.thirdPersonRig.root.visible = true;
      const driverSeatOffset = new THREE.Vector3(-0.42, 0.42, -0.15);
      driverSeatOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), v.rotY);
      engine.thirdPersonRig.root.position.set(
        v.x + driverSeatOffset.x,
        v.y + driverSeatOffset.y,
        v.z + driverSeatOffset.z
      );
      engine.thirdPersonRig.root.rotation.y = v.rotY + Math.PI;
      engine.thirdPersonRig.updateAnimation(performance.now() * 0.001, false, false, false);
    }
    if (engine.fpsRig) engine.fpsRig.visible = false;
  } else if (engine.isFirstPerson && !engine.isSkydiving) {
    engine.camera.position.set(engine.playerPos.x, engine.playerPos.y + eyeHeight, engine.playerPos.z);

    const targetFov = engine.isAimingDownSights
      ? engine.getCurrentWeapon()?.type === 'sniper'
        ? 20
        : 42
      : (engine.profile.settings.fov || 75);
    engine.camera.fov = THREE.MathUtils.lerp(engine.camera.fov, targetFov, dt * 16);
    engine.camera.updateProjectionMatrix();

    if (engine.fpsRig) {
      const isMoving = Math.hypot(engine.playerVel.x, engine.playerVel.z) > 0.5;
      const bobOffset = isMoving ? Math.sin(performance.now() * 0.015) * 0.018 : 0;
      let swingRotX = 0;
      let swingRotZ = 0;
      let swingOffsetZ = 0;
      let swingOffsetY = 0;

      if (engine.isSwingingPickaxe) {
        const swingElapsed = (performance.now() - engine.lastShotTime) / 320;
        const curve = Math.sin(Math.min(Math.max(swingElapsed, 0), 1) * Math.PI);
        swingRotX = -curve * 0.72;
        swingRotZ = curve * 0.42;
        swingOffsetY = -curve * 0.12;
        swingOffsetZ = -curve * 0.18;
      }

      engine.fpsRig.position.set(0, bobOffset + engine.recoilRecoilY + swingOffsetY, engine.recoilRecoilZ + swingOffsetZ);
      engine.fpsRig.rotation.set(engine.recoilRecoilRotX + swingRotX, 0, swingRotZ);
    }
  } else {
    const dist = engine.isSkydiving ? 5.5 : 2.8;
    const camOffset = new THREE.Vector3(0.7, 0.4, dist);
    camOffset.applyQuaternion(engine.camera.quaternion);
    engine.camera.position.copy(engine.playerPos).add(new THREE.Vector3(0, eyeHeight, 0)).add(camOffset);

    if (engine.thirdPersonRig) {
      engine.thirdPersonRig.root.position.copy(engine.playerPos);
      const isMoving = Math.hypot(engine.playerVel.x, engine.playerVel.z) > 0.5;
      let facingRotY = engine.playerRotY + Math.PI;
      if (isMoving && !engine.isAimingDownSights && !engine.isSwingingPickaxe) {
        facingRotY = Math.atan2(engine.playerVel.x, engine.playerVel.z);
      }
      engine.thirdPersonRig.root.rotation.y = facingRotY;
      engine.thirdPersonRig.updateAnimation(performance.now() * 0.001, isMoving, engine.isSwingingPickaxe, engine.isAimingDownSights);
    }

    if (engine.gliderMesh) {
      engine.gliderMesh.visible = engine.isSkydiving && engine.isGliding;
      engine.gliderMesh.position.set(engine.playerPos.x, engine.playerPos.y + 2.0, engine.playerPos.z);
      engine.gliderMesh.rotation.y = engine.playerRotY;
    }
  }
}

export function updateStormImpl(engine: FortniteEngine, dt: number) {
  engine.storm.timeRemaining -= dt;
  if (engine.storm.timeRemaining <= 0) {
    if (!engine.storm.isShrinking) {
      engine.storm.isShrinking = true;
      engine.storm.timeRemaining = 40;
      fortniteAudio.playStormWarning();
    } else {
      engine.storm.phase = Math.min(engine.storm.maxPhases, engine.storm.phase + 1);
      engine.storm.isShrinking = false;
      engine.storm.timeRemaining = 50;
      engine.storm.targetRadius = Math.max(30, engine.storm.targetRadius - 45);
      engine.storm.dps = Math.min(6, engine.storm.dps + 1);
    }
  }

  if (engine.storm.isShrinking) {
    engine.storm.currentRadius = THREE.MathUtils.lerp(
      engine.storm.currentRadius,
      engine.storm.targetRadius,
      dt * 0.07
    );
    if (engine.stormCylinderMesh) {
      engine.stormCylinderMesh.scale.set(
        engine.storm.currentRadius / 290,
        1,
        engine.storm.currentRadius / 290
      );
    }
  }

  const distToCenter = Math.hypot(
    engine.playerPos.x - engine.storm.currentCenterX,
    engine.playerPos.z - engine.storm.currentCenterZ
  );

  if (distToCenter > engine.storm.currentRadius) {
    engine.health -= engine.storm.dps * dt;
    engine.damageTaken += engine.storm.dps * dt;
    engine.callbacks.onHealthChange(Math.max(0, Math.round(engine.health)), engine.shield);
    engine.callbacks.onDamageTaken();
    fortniteAudio.playStormTick();

    if (engine.health <= 0) {
      if (engine.mode === 'battle_royale') {
        engine.handleBattleRoyaleLocalDeath('The Storm', 'Storm Radiation', false);
      } else {
        engine.triggerEliminated();
      }
    }
  }

  const currentSecond = Math.floor(engine.storm.timeRemaining);
  if (
    currentSecond !== engine.lastStormSyncSecond ||
    engine.storm.isShrinking !== engine.lastStormShrinkingState
  ) {
    engine.lastStormSyncSecond = currentSecond;
    engine.lastStormShrinkingState = engine.storm.isShrinking;
    engine.callbacks.onStormUpdate(engine.storm);
  }
}
