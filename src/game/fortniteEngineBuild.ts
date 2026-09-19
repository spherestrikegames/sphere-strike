// Building placement and drivable-vehicle enter/exit/drive logic.
import * as THREE from 'three';
import { BuildingPiece, DrivableVehicle } from '../types';
import { createPlacedBuildingMesh, snapToBuildGrid, MATERIAL_STATS } from './fortniteBuilding';
import { fortniteAudio } from '../utils/audio';
import { multiplayerClient } from '../utils/multiplayer';
import type { FortniteEngine } from './fortniteEngine';


export function placeBuildingPieceImpl(engine: FortniteEngine) {
  if (engine.mode === '1v1_build_fight') {
    engine.isBuildMode = false;
    if (engine.hologramMesh) engine.hologramMesh.visible = false;
    return;
  }

  if (engine.getCurrentWeapon()?.type !== 'pickaxe') {
    engine.isBuildMode = false;
    if (engine.hologramMesh) engine.hologramMesh.visible = false;
    return;
  }

  const matCost = 10;
  if (engine.selectedMaterial === 'wood' && engine.wood < matCost) return;
  if (engine.selectedMaterial === 'stone' && engine.stone < matCost) return;
  if (engine.selectedMaterial === 'metal' && engine.metal < matCost) return;

  const camDir = new THREE.Vector3();
  engine.camera.getWorldDirection(camDir);

  const snapped = snapToBuildGrid(engine.playerPos, camDir, engine.selectedBuildType);
  const pieceId = `build_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const matInfo = MATERIAL_STATS[engine.selectedMaterial];
  const piece: BuildingPiece = {
    id: pieceId,
    type: engine.selectedBuildType,
    material: engine.selectedMaterial,
    x: snapped.x,
    y: snapped.y,
    z: snapped.z,
    rotY: snapped.rotY,
    health: matInfo.initialHp,
    maxHealth: matInfo.maxHp,
    ownerId: 'player',
    createdAt: Date.now(),
  };

  const mesh = createPlacedBuildingMesh(piece);
  engine.scene.add(mesh);
  engine.buildingPieces.set(pieceId, { piece, mesh });
  engine.spatialGrid.addBuildingPiece(piece);

  if (engine.selectedMaterial === 'wood') engine.wood -= matCost;
  else if (engine.selectedMaterial === 'stone') engine.stone -= matCost;
  else if (engine.selectedMaterial === 'metal') engine.metal -= matCost;

  engine.structuresBuilt++;
  engine.callbacks.onMaterialsChange(engine.wood, engine.stone, engine.metal);
  fortniteAudio.playBuildPlace(engine.selectedMaterial);

  multiplayerClient.sendPlayerAction({
    type: 'build',
    piece,
  });
}

export function enterVehicleImpl(engine: FortniteEngine, vehicle: DrivableVehicle) {
  engine.activeVehicle = vehicle;
  vehicle.driverId = 'player';
  vehicle.leftDoorOpen = true;
  engine.playerRotY = vehicle.rotY;
  engine.playerPitch = 0.18;
  fortniteAudio.playCarDoor();

  engine.isBuildMode = false;
  if (engine.hologramMesh) engine.hologramMesh.visible = false;
  if (engine.fpsRig) engine.fpsRig.visible = false;
  if (engine.thirdPersonRig) engine.thirdPersonRig.root.visible = true;

  if (engine.callbacks.onVehicleChange) {
    engine.callbacks.onVehicleChange(vehicle);
  }
}

export function exitVehicleImpl(engine: FortniteEngine) {
  if (!engine.activeVehicle) return;
  const v = engine.activeVehicle;
  v.driverId = null;
  v.leftDoorOpen = false;
  fortniteAudio.playCarDoor();

  // Place player right beside driver door
  engine.playerPos.set(
    v.x - Math.cos(v.rotY) * 2.2,
    v.y + 0.2,
    v.z + Math.sin(v.rotY) * 2.2
  );
  engine.playerVel.set(0, 0, 0);

  engine.activeVehicle = null;

  if (engine.callbacks.onVehicleChange) {
    engine.callbacks.onVehicleChange(null);
  }

  if (engine.isFirstPerson) {
    if (engine.fpsRig) engine.fpsRig.visible = true;
    if (engine.thirdPersonRig) engine.thirdPersonRig.root.visible = false;
  } else {
    if (engine.thirdPersonRig) engine.thirdPersonRig.root.visible = true;
    if (engine.fpsRig) engine.fpsRig.visible = false;
  }
}

export function updateVehicleDrivingImpl(engine: FortniteEngine, dt: number) {
  if (!engine.activeVehicle) return;
  const v = engine.activeVehicle;

  const isW = engine.keys['KeyW'] || engine.keys['ArrowUp'];
  const isS = engine.keys['KeyS'] || engine.keys['ArrowDown'];
  const isA = engine.keys['KeyA'] || engine.keys['ArrowLeft'];
  const isD = engine.keys['KeyD'] || engine.keys['ArrowRight'];
  const isNitro = (engine.keys['ShiftLeft'] || engine.keys['ShiftRight']) && v.nitro > 0;
  const isBrake = engine.keys['Space'];

  // Responsive Acceleration & Max Speeds (with offroad power)
  const accelRate = isNitro ? 55.0 : 32.0;
  const topSpeed = isNitro ? v.maxSpeed * 1.55 : v.maxSpeed;

  if (isW) {
    v.speed = Math.min(topSpeed, v.speed + accelRate * dt);
  } else if (isS) {
    v.speed = Math.max(-16.0, v.speed - 36.0 * dt);
  } else {
    v.speed *= isBrake ? 0.85 : 0.96;
  }

  if (isBrake) {
    v.speed *= 0.85;
  }

  // Nitro consumption & regeneration
  if (isNitro && isW) {
    v.nitro = Math.max(0, v.nitro - 35.0 * dt);
    fortniteAudio.playNitroBoost();
  } else {
    v.nitro = Math.min(100, v.nitro + 12.0 * dt);
  }

  // Dynamic progressive steering curve: smooth at entry, responsive at cruise, stable at top speeds
  const speedRatio = Math.min(1.0, Math.abs(v.speed) / (v.maxSpeed || 28));
  const steerSensitivity = 2.8 * (1.15 - speedRatio * 0.4);
  const moveDirSign = v.speed >= 0 ? 1 : -1;
  if (isA) {
    v.rotY += steerSensitivity * dt * moveDirSign;
    engine.playerRotY += steerSensitivity * dt * moveDirSign;
    v.steerAngle = THREE.MathUtils.lerp(v.steerAngle, -0.42, dt * 10);
  } else if (isD) {
    v.rotY -= steerSensitivity * dt * moveDirSign;
    engine.playerRotY -= steerSensitivity * dt * moveDirSign;
    v.steerAngle = THREE.MathUtils.lerp(v.steerAngle, 0.42, dt * 10);
  } else {
    v.steerAngle = THREE.MathUtils.lerp(v.steerAngle, 0, dt * 14);
  }

  // Engine Audio Tick
  engine.vehicleEngineSoundTimer += dt;
  if (engine.vehicleEngineSoundTimer > 0.16) {
    engine.vehicleEngineSoundTimer = 0;
    fortniteAudio.playCarEngine(Math.abs(v.speed) / v.maxSpeed, isNitro);
  }

  // Move Vehicle Position: HEADLIGHTS FIRST (along -sin(rotY), -cos(rotY) which is the front direction)
  const fwdX = -Math.sin(v.rotY);
  const fwdZ = -Math.cos(v.rotY);
  const nextVx = v.x + fwdX * v.speed * dt;
  const nextVz = v.z + fwdZ * v.speed * dt;
  const groundH = engine.getGroundElevationAt(nextVx, nextVz, v.y);

  // Resolve solid collisions for the vehicle against buildings, houses, trees, and boulders
  const resolved = engine.checkAndResolveSolidCollisions(nextVx, nextVz, groundH, 1.35);
  const hitObstacle = Math.hypot(resolved.x - nextVx, resolved.z - nextVz) > 0.04;

  if (hitObstacle) {
    if (Math.abs(v.speed) > 5.0) {
      engine.screenShake = Math.min(0.2, Math.abs(v.speed) * 0.012);
      fortniteAudio.playHarvestHit('metal', true);
    }
    v.speed = -v.speed * 0.25; // Bounce off solid obstacle
  }

  // Keep within island bounds
  v.x = Math.max(-270, Math.min(270, resolved.x));
  v.z = Math.max(-270, Math.min(270, resolved.z));
  v.y = groundH + 0.35;

  // Sync player position to vehicle
  engine.playerPos.set(v.x, v.y + 0.6, v.z);

  // Update 3D Mesh Transform & Cockpit Controls
  if (v.meshGroup) {
    v.meshGroup.position.set(v.x, v.y, v.z);
    v.meshGroup.rotation.y = v.rotY;

    // Rotate wheel meshes
    const wFL = v.meshGroup.getObjectByName('w_fl');
    const wFR = v.meshGroup.getObjectByName('w_fr');
    const wRL = v.meshGroup.getObjectByName('w_rl');
    const wRR = v.meshGroup.getObjectByName('w_rr');
    if (wFL) wFL.rotation.x += v.speed * 4 * dt;
    if (wFR) wFR.rotation.x += v.speed * 4 * dt;
    if (wRL) wRL.rotation.x += v.speed * 4 * dt;
    if (wRR) wRR.rotation.x += v.speed * 4 * dt;

    // Turn front wheel pivot
    const pivFL = v.meshGroup.getObjectByName('piv_fl');
    const pivFR = v.meshGroup.getObjectByName('piv_fr');
    if (pivFL) pivFL.rotation.y = v.steerAngle;
    if (pivFR) pivFR.rotation.y = v.steerAngle;

    // Real-time cockpit steering wheel rotation
    const steerPivot = v.meshGroup.getObjectByName('steering_pivot');
    if (steerPivot) {
      steerPivot.rotation.z = -v.steerAngle * 2.2;
    }
  }

  // Road Kill / Vehicle Collision against Bots
  if (Math.abs(v.speed) > 8.0) {
    for (const bot of engine.bots) {
      if (!bot.isAlive || bot.team === engine.playerTeam) continue;
      const bPos = new THREE.Vector3(bot.x, bot.y, bot.z);
      if (engine.playerPos.distanceTo(bPos) < 2.8) {
        bot.health = 0;
        engine.eliminateBot(bot, false, `${v.name} Impact`);
        engine.screenShake = 0.12;
      }
    }
  }

  if (engine.callbacks.onVehicleChange) {
    engine.callbacks.onVehicleChange({ ...v });
  }
}
