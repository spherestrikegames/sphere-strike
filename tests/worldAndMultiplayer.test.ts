import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  getStrikeIslandElevation,
  getStrikeIslandWaterInfo,
  getStrikeIslandRoadInfo,
  getStrikeIslandBuildingFoundationHeight,
  POI_FOUNDATION_PADS,
  STRIKE_ISLAND_HIGHWAYS,
  buildStrikeIslandWorld,
} from '../src/game/fortniteWorldStrikeIsland';
import { MapManager } from '../src/game/mapManager';
import {
  Authoritative2v2Room,
  assignBalancedTeam,
  validatePlayerTransform,
  processAuthoritativeDamage,
  validateBuildingPlacement,
} from '../src/game/matchmaking2v2Validator';

test('1. Terrain Audit: Strike Island heightfield has no NaN/Infinity and matches 3D mesh vertices 100%', () => {
  const world = buildStrikeIslandWorld();
  const pos = world.terrainMesh.geometry.attributes.position;

  assert.ok(pos.count > 25000, 'Terrain mesh should have high-resolution vertex grid');

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);

    assert.ok(Number.isFinite(vy), `Vertex ${i} at (${vx}, ${vz}) has non-finite Y: ${vy}`);
    const sampledY = world.getElevation(vx, vz);
    assert.ok(
      Math.abs(vy - sampledY) < 0.001,
      `Mesh vertex Y (${vy}) must match physics getElevation (${sampledY}) at (${vx}, ${vz})`
    );
  }
});

test('2. Building Foundation Audit: All 10 POIs sit on flat graded foundation pads', () => {
  const expectedPads: Record<string, number> = {
    strike_city: 0.0,
    dusty_desert: 4.0,
    pinewood_forest: 6.5,
    military_base: 5.0,
    coastal_village: 1.5,
    snowfall_summit: 38.0,
    industrial_zone: 1.5,
    lost_temple: 3.0,
    racing_circuit: 0.5,
    underground_bunker: 12.0,
  };

  for (const [key, expectedY] of Object.entries(expectedPads)) {
    const pad = POI_FOUNDATION_PADS[key];
    assert.ok(pad, `Missing foundation pad definition for ${key}`);
    const foundationH = getStrikeIslandBuildingFoundationHeight(pad.cx, pad.cz);
    assert.strictEqual(foundationH, expectedY, `Foundation height for ${key} should be ${expectedY}`);
  }
});

test('3. Water System Audit: Subterranean rooms (Subway & Underground Bunker) are 100% dry while Ocean/River/Tarn have water', () => {
  // Strike City Subway at (27, 18) has elevation -3.8m -> must NOT be in water!
  const subwayWater = getStrikeIslandWaterInfo(27, 18);
  assert.strictEqual(subwayWater.isInWater, false, 'Strike City Subway (-3.8m) must remain completely dry');

  // Underground Bunker at (-20, 100) has elevation 7.2m -> must NOT be in water!
  const bunkerWater = getStrikeIslandWaterInfo(-20, 100);
  assert.strictEqual(bunkerWater.isInWater, false, 'Underground Bunker chamber must remain completely dry');

  // Strike City center plaza (0, 0) -> dry
  assert.strictEqual(getStrikeIslandWaterInfo(0, 0).isInWater, false);

  // Western Coastal Ocean (-320, 180) -> in ocean water
  const oceanWater = getStrikeIslandWaterInfo(-320, 180);
  assert.strictEqual(oceanWater.isInWater, true, 'Western ocean basin should contain water');
  assert.strictEqual(oceanWater.type, 'ocean');
  assert.ok(oceanWater.depth > 1.0);

  // Alpine Mountain Tarn (38, -255) -> in lake water
  const tarnWater = getStrikeIslandWaterInfo(38, -255);
  assert.strictEqual(tarnWater.isInWater, true, 'Alpine Mountain Tarn should contain water');
  assert.strictEqual(tarnWater.type, 'lake');

  // River Canyon at (112, 0) -> in river water
  const riverWater = getStrikeIslandWaterInfo(112, 0);
  assert.strictEqual(riverWater.isInWater, true, 'River Canyon centerline should contain river water');
  assert.strictEqual(riverWater.type, 'river');
});

test('4. Road & Canyon Bridge Audit: All 9 highways conform to terrain and East Highway bridges the River Canyon', () => {
  assert.strictEqual(STRIKE_ISLAND_HIGHWAYS.length, 9, 'Strike Island should have 9 connected highways');

  for (const hwy of STRIKE_ISLAND_HIGHWAYS) {
    const midPt = hwy.points[1];
    const roadInfo = getStrikeIslandRoadInfo(midPt.x, midPt.z);
    assert.strictEqual(roadInfo.isOnRoad, true, `Midpoint of ${hwy.id} should be detected as on-road`);
    assert.ok(Number.isFinite(roadInfo.roadElevation));
  }

  // Check East Highway Canyon Bridge at (114, 0)
  const bridgeInfo = getStrikeIslandRoadInfo(114, 0);
  assert.strictEqual(bridgeInfo.isOnRoad, true);
  assert.strictEqual(bridgeInfo.isBridge, true, 'East Highway over River Canyon (114, 0) must be flagged as a bridge');
  assert.strictEqual(bridgeInfo.roadElevation, 2.4, 'Canyon Bridge deck should sit at Y = 2.4m above river water');
});

test('5. Building Interior & Doorway Audit: Hangar, Saloon, Cabin, and Bunker entrances are passable (not solid boxes)', () => {
  const world = buildStrikeIslandWorld();

  // Helper: checks if a player sphere at (px, py, pz) is trapped inside any solid wall box collider
  const isPointBlockedByWall = (px: number, py: number, pz: number): boolean => {
    for (const col of world.staticColliders) {
      if (
        col.type === 'box' &&
        col.minX !== undefined &&
        col.maxX !== undefined &&
        col.minY !== undefined &&
        col.maxY !== undefined &&
        col.minZ !== undefined &&
        col.maxZ !== undefined
      ) {
        // Ignore thin floor/ceiling slabs or stair steps
        if (col.maxY - col.minY <= 1.2) continue;
        if (
          px > col.minX &&
          px < col.maxX &&
          py + 1.0 > col.minY &&
          py < col.maxY &&
          pz > col.minZ &&
          pz < col.maxZ
        ) {
          return true;
        }
      }
    }
    return false;
  };

  // 1. Military Hangar interior center (250, 5.2, -230) and South open bay entrance (250, 5.2, -213)
  assert.strictEqual(
    isPointBlockedByWall(250, 5.2, -230),
    false,
    'Military Hangar interior center must be walkable and open'
  );
  assert.strictEqual(
    isPointBlockedByWall(250, 5.2, -213),
    false,
    'Military Hangar South bay entrance must be open'
  );

  // 2. Dusty Saloon interior center (220, 4.2, 220) and South doorway (220, 4.2, 227)
  assert.strictEqual(isPointBlockedByWall(220, 4.2, 220), false, 'Dusty Saloon interior must be walkable');
  assert.strictEqual(isPointBlockedByWall(220, 4.2, 227), false, 'Dusty Saloon South doorway must be open');

  // 3. Pinewood Woodcutter Cabin interior (-213, 6.7, -206) and South doorway (-213, 6.7, -202)
  assert.strictEqual(isPointBlockedByWall(-213, 6.7, -206), false, 'Woodcutter Cabin interior must be walkable');
  assert.strictEqual(isPointBlockedByWall(-213, 6.7, -202), false, 'Woodcutter Cabin doorway must be open');

  // 4. Underground Bunker entrance ramp (-20, 11.5, 84) and subterranean vault (-20, 7.5, 102)
  assert.strictEqual(isPointBlockedByWall(-20, 11.5, 84), false, 'Underground Bunker portal entrance must be open');
  assert.strictEqual(isPointBlockedByWall(-20, 7.5, 102), false, 'Underground Bunker vault interior must be open');
});

test('6. Authoritative 4-Player 2v2 Matchmaking, Friendly-Fire Protection & Team Victory Audit', () => {
  const room: Authoritative2v2Room = {
    code: '2V2-TEST',
    mode: '2v2',
    maxPlayers: 4,
    hostId: 'p1',
    gameState: 'playing',
    seed: 42,
    countdownSeconds: 0,
    winningTeam: null,
    players: new Map(),
    builds: new Map(),
  };

  // Join 4 players and verify 2v2 team balancing (2 ALPHA, 2 OMEGA)
  for (const id of ['p1', 'p2', 'p3', 'p4']) {
    const team = assignBalancedTeam(room);
    if (!team) throw new Error('A 4-player room should have a free team slot before the fourth player joins.');
    room.players.set(id, {
      id,
      name: `Player_${id}`,
      skinId: 'jonesy',
      level: 10,
      team,
      isReady: true,
      health: 250,
      shield: 100,
      isAlive: true,
      eliminations: 0,
      x: 0,
      y: 1,
      z: 0,
      rotY: 0,
      lastUpdateMs: Date.now(),
    });
  }

  assert.strictEqual(assignBalancedTeam(room), null, 'A full 2v2 room must reject a fifth player');

  const teams = Array.from(room.players.values()).map((p) => p.team);
  assert.strictEqual(teams.filter((t) => t === 'ALPHA').length, 2, 'Team ALPHA must have exactly 2 players');
  assert.strictEqual(teams.filter((t) => t === 'OMEGA').length, 2, 'Team OMEGA must have exactly 2 players');

  // Find teammates and enemies
  const alphaPlayers = Array.from(room.players.values()).filter((p) => p.team === 'ALPHA');
  const omegaPlayers = Array.from(room.players.values()).filter((p) => p.team === 'OMEGA');

  // Verify Friendly Fire is blocked between teammates
  const ffResult = processAuthoritativeDamage(room, alphaPlayers[0].id, alphaPlayers[1].id, 90, false, 'SCAR');
  assert.strictEqual(ffResult.accepted, false, 'Friendly fire between ALPHA teammates must be blocked');
  assert.strictEqual(ffResult.reason, 'friendly_fire_blocked');
  assert.strictEqual(alphaPlayers[1].shield, 100, 'Teammate shield must remain untouched');

  // Reject self-damage and malformed damage before changing player state.
  const selfHit = processAuthoritativeDamage(room, alphaPlayers[0].id, alphaPlayers[0].id, 50);
  assert.strictEqual(selfHit.accepted, false);
  assert.strictEqual(selfHit.reason, 'self_damage_blocked');
  const invalidHit = processAuthoritativeDamage(room, alphaPlayers[0].id, omegaPlayers[0].id, Number.NaN);
  assert.strictEqual(invalidHit.accepted, false);
  assert.strictEqual(invalidHit.reason, 'invalid_damage');

  // Verify Enemy Damage & Anti-Cheat Damage Clamping (9999 -> 250 max)
  const hit1 = processAuthoritativeDamage(room, alphaPlayers[0].id, omegaPlayers[0].id, 9999, true, 'Sniper');
  assert.strictEqual(hit1.accepted, true);
  assert.strictEqual(hit1.appliedDamage, 250, 'Single-hit damage must be clamped to 250 max');
  assert.strictEqual(hit1.targetShield, 0);
  assert.strictEqual(hit1.targetHealth, 100);
  assert.strictEqual(hit1.eliminated, false);

  // Finish off omegaPlayers[0]
  const hit2 = processAuthoritativeDamage(room, alphaPlayers[0].id, omegaPlayers[0].id, 120, false, 'Shotgun');
  assert.strictEqual(hit2.eliminated, true, 'Omega Player 1 should be eliminated');
  assert.strictEqual(hit2.winningTeam, null, 'Match should continue while Omega Player 2 is still alive');

  // Eliminate omegaPlayers[1] -> triggers ALPHA team victory!
  processAuthoritativeDamage(room, alphaPlayers[1].id, omegaPlayers[1].id, 250, true, 'Sniper');
  const finalHit = processAuthoritativeDamage(room, alphaPlayers[1].id, omegaPlayers[1].id, 200, false, 'AR');
  assert.strictEqual(finalHit.eliminated, true);
  assert.strictEqual(finalHit.winningTeam, 'ALPHA', 'Eliminating both OMEGA players must award victory to ALPHA');
  assert.strictEqual(room.gameState, 'finished');

  // Verify Transform Validation & Building Duplicate Prevention
  assert.strictEqual(validatePlayerTransform({ x: NaN, y: 0, z: 0 }).valid, false);
  const clampedT = validatePlayerTransform({ x: 9999, y: 5, z: -9999, rotY: 1.2 }, 410);
  assert.strictEqual(clampedT.valid, true);
  assert.strictEqual(clampedT.x, 410);
  assert.strictEqual(clampedT.z, -410);

  const buildRoom: Authoritative2v2Room = {
    ...room,
    gameState: 'playing',
    players: new Map(room.players),
    builds: new Map(),
  };
  const piece = {
    id: 'b1',
    type: 'wall' as const,
    material: 'wood' as const,
    x: 12,
    y: 0,
    z: 16,
    rotY: 0,
    health: 150,
    maxHealth: 150,
    ownerId: 'p1',
    createdAt: Date.now(),
  };
  assert.strictEqual(validateBuildingPlacement(buildRoom, 'p1', piece).accepted, true);
  assert.strictEqual(
    validateBuildingPlacement(buildRoom, 'p2', { ...piece, id: 'b2' }).accepted,
    false,
    'Duplicate overlapping build in same grid cell must be rejected'
  );
  assert.strictEqual(
    validateBuildingPlacement(buildRoom, 'unknown-player', { ...piece, id: 'b3' }).reason,
    'missing_player',
    'A player who is not in the room must not place builds'
  );
  assert.strictEqual(
    validateBuildingPlacement(buildRoom, 'p1', { ...piece, y: 500, id: 'b4' }).reason,
    'out_of_bounds',
    'Build height must be bounded as well as horizontal position'
  );
  assert.strictEqual(
    validateBuildingPlacement(buildRoom, 'p1', { ...piece, id: 'b1', x: 80 }).reason,
    'duplicate_id',
    'A build identifier cannot be reused for a second structure'
  );
});

test('7. Performance & Memory Disposal Audit: Switching across all 4 maps cleans up scene nodes', () => {
  const scene = new THREE.Scene();
  const manager = new MapManager(scene);

  for (const idx of [0, 1, 2, 3, 0] as const) {
    const data = manager.loadMap(idx);
    assert.ok(data.rootGroup, `Map ${idx} should create rootGroup`);
    assert.ok(typeof data.getElevation === 'function');
    assert.ok(typeof data.getWaterInfo === 'function');
    assert.ok(typeof data.getRoadInfo === 'function');
    assert.ok(typeof data.getBuildingFoundationHeight === 'function');
  }

  manager.disposeCurrentMap();
  assert.strictEqual(scene.children.length, 0, 'Scene should have 0 leftover children after disposeCurrentMap()');
});
