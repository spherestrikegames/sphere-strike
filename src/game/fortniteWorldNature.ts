// Harvestable trees/boulders, cliff faces, and nature/loot population helpers.
import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider } from '../types';
import { getTerrainHeight, isPointInsideStructureOrNoSpawnZone } from './fortniteWorldTerrain';



// -------------------------------------------------------------
// HARVESTABLE TREE BUILDER (PINE, OAK, BIRCH)
// -------------------------------------------------------------
export function createHarvestableTree(
  parent: THREE.Object3D,
  harvestables: HarvestableObject[],
  colliders: SolidCollider[],
  harvestableMeshes: Map<string, THREE.Object3D>,
  x: number,
  y: number,
  z: number,
  style: 'pine' | 'oak' | 'birch' = 'pine',
  scale: number = 1.0
): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, y, z);

  const trunkMat =
    style === 'birch'
      ? new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.85 })
      : new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.9 });

  const treeTrunkGeo = new THREE.CylinderGeometry(0.35 * scale, 0.52 * scale, 3.2 * scale, 7);
  const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
  trunk.position.y = (3.2 * scale) / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  let totalHeight = 9.0 * scale;

  if (style === 'pine') {
    const leavesMat = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.8,
      flatShading: true,
    });
    const l1 = new THREE.Mesh(new THREE.ConeGeometry(3.2 * scale, 4.0 * scale, 7), leavesMat);
    l1.position.y = 4.2 * scale;
    l1.castShadow = true;
    tree.add(l1);

    const l2 = new THREE.Mesh(new THREE.ConeGeometry(2.4 * scale, 3.4 * scale, 7), leavesMat);
    l2.position.y = 6.4 * scale;
    l2.castShadow = true;
    tree.add(l2);

    const l3 = new THREE.Mesh(new THREE.ConeGeometry(1.6 * scale, 2.6 * scale, 7), leavesMat);
    l3.position.y = 8.2 * scale;
    tree.add(l3);
    totalHeight = 9.6 * scale;
  } else if (style === 'oak') {
    const leavesMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.75,
      flatShading: true,
    });
    const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4 * scale, 1), leavesMat);
    c1.position.set(0, 4.0 * scale, 0);
    c1.castShadow = true;
    tree.add(c1);

    const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8 * scale, 1), leavesMat);
    c2.position.set(0.7 * scale, 4.6 * scale, 0.4 * scale);
    c2.castShadow = true;
    tree.add(c2);

    const c3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7 * scale, 1), leavesMat);
    c3.position.set(-0.6 * scale, 4.8 * scale, -0.5 * scale);
    tree.add(c3);
    totalHeight = 7.2 * scale;
  } else {
    // Birch
    const leavesMat = new THREE.MeshStandardMaterial({
      color: 0x65a30d,
      roughness: 0.8,
      flatShading: true,
    });
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.2 * scale, 4.8 * scale, 7), leavesMat);
    canopy.position.y = 4.6 * scale;
    canopy.castShadow = true;
    tree.add(canopy);
    totalHeight = 7.6 * scale;
  }

  parent.add(tree);

  const collider: SolidCollider = {
    type: 'cylinder',
    x,
    z,
    radius: 0.9 * scale,
    minY: y,
    maxY: y + totalHeight,
    name: `${style.toUpperCase()} Tree Trunk`,
  };
  colliders.push(collider);

  addHarvestable(
    harvestables,
    x,
    y,
    z,
    'tree',
    'wood',
    200,
    30,
    2.4 * scale,
    totalHeight,
    tree,
    harvestableMeshes,
    collider
  );

  return tree;
}


// High-detail, realistic organic rock assets with multi-layered geological strata
function createDetailedOrganicBoulder(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  colliders: SolidCollider[],
  harvestableMeshes: Map<string, THREE.Object3D>,
  tx: number,
  terrainY: number,
  tz: number,
  rScale: number
) {
  const boulderGroup = new THREE.Group();
  boulderGroup.position.set(tx, terrainY, tz);
  boulderGroup.rotation.y = (tx * 17.3 + tz * 31.7) % (Math.PI * 2);

  // Geological rock materials with authentic natural palette & rough flat shading
  const baseRockMat = new THREE.MeshStandardMaterial({
    color: (tx + tz) % 2 === 0 ? 0x57534e : 0x475569, // Slate granite / dark basalt
    roughness: 0.92,
    metalness: 0.08,
    flatShading: true,
  });
  const strataRockMat = new THREE.MeshStandardMaterial({
    color: 0x78716c, // Weathered sandstone / limestone vein
    roughness: 0.95,
    metalness: 0.04,
    flatShading: true,
  });
  const mossCapMat = new THREE.MeshStandardMaterial({
    color: 0x4d7c0f, // Natural alpine moss / lichen ridge
    roughness: 0.88,
    flatShading: true,
  });

  // 1. Primary organic rock body (faceted polyhedron with non-uniform scale)
  const coreGeo = new THREE.DodecahedronGeometry(1.6 * rScale, 1);
  const coreMesh = new THREE.Mesh(coreGeo, baseRockMat);
  coreMesh.scale.set(1.2, 0.85, 1.1);
  coreMesh.position.y = 0.9 * rScale;
  coreMesh.castShadow = true;
  coreMesh.receiveShadow = true;
  boulderGroup.add(coreMesh);

  // 2. Interlocking geological crag outcroppings (simulating cracked natural cliff fragmentation)
  const cragGeo1 = new THREE.OctahedronGeometry(1.2 * rScale, 1);
  const cragMesh1 = new THREE.Mesh(cragGeo1, strataRockMat);
  cragMesh1.position.set(0.6 * rScale, 0.6 * rScale, -0.4 * rScale);
  cragMesh1.rotation.set(0.3, 0.8, -0.2);
  cragMesh1.scale.set(0.9, 0.7, 0.8);
  cragMesh1.castShadow = true;
  boulderGroup.add(cragMesh1);

  const cragGeo2 = new THREE.IcosahedronGeometry(0.95 * rScale, 0);
  const cragMesh2 = new THREE.Mesh(cragGeo2, baseRockMat);
  cragMesh2.position.set(-0.7 * rScale, 0.45 * rScale, 0.5 * rScale);
  cragMesh2.rotation.set(-0.4, 0.5, 0.6);
  cragMesh2.scale.set(0.85, 0.6, 0.9);
  cragMesh2.castShadow = true;
  boulderGroup.add(cragMesh2);

  // 3. Natural moss / vegetation crown on the upper rock surface
  const mossGeo = new THREE.DodecahedronGeometry(0.85 * rScale, 1);
  const mossMesh = new THREE.Mesh(mossGeo, mossCapMat);
  mossMesh.position.set(0.1 * rScale, 1.55 * rScale, 0.05 * rScale);
  mossMesh.scale.set(1.1, 0.35, 1.0);
  mossMesh.castShadow = false;
  boulderGroup.add(mossMesh);

  scene.add(boulderGroup);

  const rockCollider: SolidCollider = {
    type: 'cylinder',
    x: tx,
    z: tz,
    radius: 1.85 * rScale,
    minY: terrainY,
    maxY: terrainY + 2.8 * rScale,
    name: 'Organic Stone Boulder',
  };
  colliders.push(rockCollider);

  addHarvestable(
    harvestables,
    tx,
    terrainY,
    tz,
    'rock',
    'stone',
    300,
    30,
    1.9 * rScale,
    2.4 * rScale,
    boulderGroup,
    harvestableMeshes,
    rockCollider
  );
}


// Natural Cliff Faces along Mountain Ridges (Mount Kay & Lookout Ridge)
function addNaturalCliffFaces(scene: THREE.Scene, colliders: SolidCollider[]) {
  const cliffMat = new THREE.MeshStandardMaterial({
    color: 0x57534e,
    roughness: 0.95,
    metalness: 0.05,
    flatShading: true,
  });
  const strataMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.98,
    flatShading: true,
  });

  const cliffSegments = [
    // Ridge 1: Mount Kay Northern Escarpment (near -90, 80)
    { x: -95, z: 85, h: 14, w: 28, rot: 0.35 },
    { x: -75, z: 98, h: 18, w: 32, rot: -0.25 },
    { x: -110, z: 72, h: 12, w: 24, rot: 0.6 },
    // Ridge 2: Lookout Ridge Southern Crags (near 100, -120)
    { x: 105, z: -115, h: 16, w: 30, rot: -0.45 },
    { x: 88, z: -130, h: 14, w: 26, rot: 0.2 },
    { x: 120, z: -105, h: 12, w: 22, rot: -0.7 },
  ];

  cliffSegments.forEach((cliff) => {
    const cliffGroup = new THREE.Group();
    cliffGroup.position.set(cliff.x, 0, cliff.z);
    cliffGroup.rotation.y = cliff.rot;

    // Stepped vertical rock wall strata
    const mainWall = new THREE.Mesh(
      new THREE.BoxGeometry(cliff.w, cliff.h, 6),
      cliffMat
    );
    mainWall.position.set(0, cliff.h / 2, 0);
    mainWall.castShadow = true;
    mainWall.receiveShadow = true;
    cliffGroup.add(mainWall);

    // Natural horizontal geological strata band
    const strataBand = new THREE.Mesh(
      new THREE.BoxGeometry(cliff.w * 1.05, 1.6, 6.4),
      strataMat
    );
    strataBand.position.set(0, cliff.h * 0.55, 0);
    cliffGroup.add(strataBand);

    // Upper stepped rock shelf
    const upperShelf = new THREE.Mesh(
      new THREE.BoxGeometry(cliff.w * 0.75, 2.5, 4.5),
      cliffMat
    );
    upperShelf.position.set(0, cliff.h - 1.0, 1.2);
    cliffGroup.add(upperShelf);

    scene.add(cliffGroup);

    // Register Solid Wall Collider for Tactical Movement & Natural Cover
    colliders.push({
      type: 'box',
      minX: cliff.x - (cliff.w / 2) * Math.cos(cliff.rot) - 3,
      maxX: cliff.x + (cliff.w / 2) * Math.cos(cliff.rot) + 3,
      minY: 0,
      maxY: cliff.h,
      minZ: cliff.z - (cliff.w / 2) * Math.abs(Math.sin(cliff.rot)) - 3,
      maxZ: cliff.z + (cliff.w / 2) * Math.abs(Math.sin(cliff.rot)) + 3,
      name: 'Natural Cliff Face Escarpment',
    });
  });
}


// Populate Trees and Boulders Across Island with Strict Collision Zone Checks
function populateNature(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  colliders: SolidCollider[],
  harvestableMeshes: Map<string, THREE.Object3D>
) {
  // 1. Build Natural Cliff Faces on Mountain Ridges
  addNaturalCliffFaces(scene, colliders);

  for (let i = 0; i < 380; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 32 + Math.random() * 238;
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;

    // STRICT COLLISION CHECK: Ensure procedural vegetation and geological assets NEVER
    // spawn inside or clip through building/skyscraper boundaries, houses, or highway lanes
    if (isPointInsideStructureOrNoSpawnZone(tx, tz)) continue;

    const terrainY = Number(getTerrainHeight(tx, tz));
    if (terrainY < 0.04) continue;

    if (Math.random() < 0.72) {
      const scale = 0.85 + Math.random() * 0.55;
      const styleRand = Math.random();
      const style: 'pine' | 'oak' | 'birch' = styleRand < 0.55 ? 'pine' : styleRand < 0.85 ? 'oak' : 'birch';
      createHarvestableTree(
        scene,
        harvestables,
        colliders,
        harvestableMeshes,
        tx,
        terrainY,
        tz,
        style,
        scale
      );
    } else {
      const rScale = 0.75 + Math.random() * 0.75;
      createDetailedOrganicBoulder(
        scene,
        harvestables,
        colliders,
        harvestableMeshes,
        tx,
        terrainY,
        tz,
        rScale
      );
    }
  }
}

function addHarvestable(
  list: HarvestableObject[],
  x: number,
  y: number,
  z: number,
  type: HarvestableObject['type'],
  materialType: 'wood' | 'stone' | 'metal',
  health: number,
  yieldPerHit: number,
  radius: number,
  height: number,
  mesh?: THREE.Object3D,
  harvestableMeshes?: Map<string, THREE.Object3D>,
  collider?: SolidCollider
): HarvestableObject {
  const id = `harv_${list.length}_${Math.floor(x)}_${Math.floor(z)}`;
  const harv: HarvestableObject = {
    id,
    type,
    x,
    y,
    z,
    health,
    maxHealth: health,
    materialType,
    yieldPerHit,
    radius,
    height,
    collider,
  };
  list.push(harv);
  if (mesh && harvestableMeshes) {
    harvestableMeshes.set(id, mesh);
  }
  return harv;
}

function addChest(
  scene: THREE.Scene,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  x: number,
  y: number,
  z: number,
  tier: 'chest' | 'rare_chest' | 'ammo_box'
) {
  const id = `chest_${chests.length}`;
  chests.push({
    id,
    x,
    y,
    z,
    rotY: Math.random() * Math.PI * 2,
    isOpened: false,
    tier,
  });

  const chestGroup = new THREE.Group();
  chestGroup.position.set(x, y, z);

  const baseMat = new THREE.MeshStandardMaterial({
    color: tier === 'rare_chest' ? 0x2563eb : 0xd97706,
    metalness: 0.7,
    roughness: 0.3,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.9,
    roughness: 0.2,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.9), baseMat);
  base.position.y = 0.35;
  chestGroup.add(base);

  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 1.2, 12, 1, false, 0, Math.PI),
    goldTrimMat
  );
  lid.rotateZ(Math.PI / 2);
  lid.position.set(0, 0.7, 0);
  lid.name = 'chest_lid';
  chestGroup.add(lid);

  const glowGeo = new THREE.SphereGeometry(0.6, 8, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    color: tier === 'rare_chest' ? 0x60a5fa : 0xfbbf24,
    transparent: true,
    opacity: 0.4,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = 0.7;
  chestGroup.add(glow);

  scene.add(chestGroup);
  chestMeshes.set(id, chestGroup);

  colliders.push({
    type: 'box',
    minX: x - 0.7,
    maxX: x + 0.7,
    minY: y,
    maxY: y + 1.2,
    minZ: z - 0.6,
    maxZ: z + 0.6,
    name: 'Treasure Chest',
  });
}
