// Large terrain landmarks: canyon+bridge, volcano, waterfall+dam, mountain peaks.
import * as THREE from 'three';
import { LootChest, SolidCollider } from '../types';
import { addChest } from './fortniteWorldNature';
import { getTerrainHeight } from './fortniteWorldTerrain';



// -------------------------------------------------------------
// GEOLOGICAL FEATURE 1: GRAND CANYON & ROPE SUSPENSION BRIDGE
// -------------------------------------------------------------
export function buildGrandCanyonAndBridge(
  scene: THREE.Scene,
  colliders: SolidCollider[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>
) {
  const canyonMat = new THREE.MeshStandardMaterial({
    color: 0xc2410c,
    roughness: 0.95,
    flatShading: true,
  });
  const woodPlankMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });

  const root = new THREE.Group();
  root.position.set(190, 0, -100);

  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const px = Math.cos(angle) * 26;
    const pz = Math.sin(angle) * 26;
    const cliffH = 14 + (i % 3) * 6;

    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(5, 1), canyonMat);
    rock.position.set(px, cliffH / 2, pz);
    rock.scale.set(1.4, cliffH / 5, 1.4);
    rock.castShadow = true;
    root.add(rock);

    colliders.push({
      type: 'cylinder',
      x: 190 + px,
      z: -100 + pz,
      radius: 6,
      minY: 0,
      maxY: cliffH + 5,
      name: 'Grand Canyon Sandstone Pillar',
    });
  }

  const bridgeLength = 36;
  const planks = 24;
  for (let p = 0; p < planks; p++) {
    const pz = -bridgeLength / 2 + (p / planks) * bridgeLength;
    const sag = Math.sin((p / planks) * Math.PI) * 1.6;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.25, 1.2), woodPlankMat);
    plank.position.set(0, 16 - sag, pz);
    plank.castShadow = true;
    root.add(plank);
  }

  for (const cx of [-1.8, 1.8]) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, bridgeLength, 6), cableMat);
    cable.rotation.x = Math.PI / 2;
    cable.position.set(cx, 17, 0);
    root.add(cable);
  }

  colliders.push({
    type: 'box',
    minX: 190 - 2.0,
    maxX: 190 + 2.0,
    minY: 14,
    maxY: 18,
    minZ: -100 - bridgeLength / 2,
    maxZ: -100 + bridgeLength / 2,
    name: 'Suspension Bridge Walkway',
  });

  addChest(scene, chests, chestMeshes, colliders, 190, 16.5, -100, 'rare_chest');

  scene.add(root);
}


// -------------------------------------------------------------
// GEOLOGICAL FEATURE 2: VOLCANO & GEOTHERMAL STEAM VENTS
// -------------------------------------------------------------
export function buildVolcanoAndHotSprings(
  scene: THREE.Scene,
  colliders: SolidCollider[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>
) {
  const root = new THREE.Group();
  root.position.set(130, 0, 190);

  const basaltMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.9,
    flatShading: true,
  });
  const lavaMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const bx = Math.cos(angle) * 18;
    const bz = Math.sin(angle) * 18;
    const colH = 10 + (i % 4) * 4;

    const column = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.2, colH, 6), basaltMat);
    column.position.set(bx, colH / 2, bz);
    column.castShadow = true;
    root.add(column);

    colliders.push({
      type: 'cylinder',
      x: 130 + bx,
      z: 190 + bz,
      radius: 3.5,
      minY: 0,
      maxY: colH,
      name: 'Volcanic Basalt Spire',
    });
  }

  const lavaPool = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.4, 16), lavaMat);
  lavaPool.position.set(0, 0.2, 0);
  root.add(lavaPool);

  addChest(scene, chests, chestMeshes, colliders, 130, 14, 190, 'rare_chest');

  scene.add(root);
}


// -------------------------------------------------------------
// GEOLOGICAL FEATURE 3: MOUNTAIN OBSERVATION FORTRESS & DAM OVERLOOK
// -------------------------------------------------------------
export function buildWaterfallAndDam(scene: THREE.Scene, colliders: SolidCollider[]) {
  const root = new THREE.Group();
  root.position.set(-90, 0, 45);

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });

  const dam = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 6), concreteMat);
  dam.position.y = 7;
  dam.castShadow = true;
  root.add(dam);

  // Observation Railing on top
  const rail = new THREE.Mesh(new THREE.BoxGeometry(23, 1.1, 0.2), steelMat);
  rail.position.set(0, 14.6, 2.8);
  root.add(rail);

  colliders.push({
    type: 'box',
    minX: -90 - 12.5,
    maxX: -90 + 12.5,
    minY: 0,
    maxY: 15,
    minZ: 45 - 3.5,
    maxZ: 45 + 3.5,
    name: 'Hydroelectric Fortress Wall',
  });

  scene.add(root);
}


// Mountain Rock Formations
export function buildMountainPeaks(scene: THREE.Scene, colliders: SolidCollider[]) {
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.95,
    flatShading: true,
  });

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const mx = -90 + Math.cos(angle) * 22;
    const mz = 80 + Math.sin(angle) * 22;
    const mHeight = getTerrainHeight(mx, mz);

    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(6, 1), rockMat);
    rock.position.set(mx, mHeight + 3, mz);
    rock.scale.set(1.4, 2.2, 1.4);
    rock.castShadow = true;
    scene.add(rock);

    colliders.push({
      type: 'cylinder',
      x: mx,
      z: mz,
      radius: 6.5,
      minY: mHeight,
      maxY: mHeight + 14,
      name: 'Mount Kay Cliff',
    });
  }
}
