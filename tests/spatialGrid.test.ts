import test from 'node:test';
import assert from 'node:assert/strict';
import { SpatialColliderGrid } from '../src/game/spatialGrid.ts';
import { SolidCollider, BuildingPiece } from '../src/types.ts';

test('SpatialColliderGrid - basic add and queryNear', () => {
  const grid = new SpatialColliderGrid(24.0);

  const col1: SolidCollider = {
    type: 'box',
    minX: 10,
    maxX: 14,
    minY: 0,
    maxY: 5,
    minZ: 10,
    maxZ: 14,
    name: 'TestBuilding1',
  };

  const col2: SolidCollider = {
    type: 'cylinder',
    x: 100,
    z: 100,
    radius: 2,
    minY: 0,
    maxY: 4,
    name: 'TestPillar',
  };

  grid.add(col1);
  grid.add(col2);

  // Near col1
  const near1 = grid.queryNear(12, 12, 5);
  assert.equal(near1.length, 1);
  assert.equal(near1[0].name, 'TestBuilding1');

  // Near col2
  const near2 = grid.queryNear(100, 100, 5);
  assert.equal(near2.length, 1);
  assert.equal(near2[0].name, 'TestPillar');

  // Query empty region
  const empty = grid.queryNear(-200, -200, 10);
  assert.equal(empty.length, 0);
});

test('SpatialColliderGrid - query deduplication with persistent set', () => {
  const grid = new SpatialColliderGrid(10.0);

  // Large collider spanning multiple cells
  const wideCol: SolidCollider = {
    type: 'box',
    minX: -25,
    maxX: 25,
    minY: 0,
    maxY: 10,
    minZ: -25,
    maxZ: 25,
    name: 'MegaMall',
  };

  grid.add(wideCol);

  const results = grid.queryAABB(-30, -30, 30, 30);
  // Must only appear once in results despite covering multiple cells
  assert.equal(results.length, 1);
  assert.equal(results[0].name, 'MegaMall');
});

test('SpatialColliderGrid - building piece add, query, and remove', () => {
  const grid = new SpatialColliderGrid(24.0);

  const piece1: BuildingPiece = {
    id: 'wall_001',
    type: 'wall',
    material: 'wood',
    x: 5,
    y: 0,
    z: 5,
    rotY: 0,
    health: 150,
    maxHealth: 150,
    ownerId: 'player',
    createdAt: Date.now(),
  };

  grid.addBuildingPiece(piece1);

  const nearby = grid.queryBuildingPiecesNear(5, 5, 4);
  assert.equal(nearby.length, 1);
  assert.equal(nearby[0].id, 'wall_001');

  grid.removeBuildingPiece('wall_001');
  const afterRemove = grid.queryBuildingPiecesNear(5, 5, 4);
  assert.equal(afterRemove.length, 0);
});
