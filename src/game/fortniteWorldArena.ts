// Weapon upgrade bench mesh + the dedicated 1v1 flat arena map generator.
import * as THREE from 'three';
import { HarvestableObject, SolidCollider } from '../types';



// -------------------------------------------------------------
// WEAPON UPGRADE BENCH 3D INTERACTIVE STATION
// -------------------------------------------------------------
export interface UpgradeBenchStation {
  id: string;
  x: number;
  y: number;
  z: number;
  mesh: THREE.Group;
}

export function createUpgradeBenchMesh(): THREE.Group {
  const bench = new THREE.Group();

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.25,
  });
  const yellowHazardMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    metalness: 0.5,
    roughness: 0.4,
  });
  const anvilMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.9,
    roughness: 0.2,
  });
  const holographicMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.75,
    wireframe: true,
  });

  // Heavy steel base table
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 1.2), darkSteelMat);
  tableTop.position.y = 0.9;
  bench.add(tableTop);

  // Table Legs & Bracing
  for (const lx of [-1.0, 1.0]) {
    for (const lz of [-0.45, 0.45]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), darkSteelMat);
      leg.position.set(lx, 0.45, lz);
      bench.add(leg);
    }
  }

  // Steel Anvil on Table
  const anvilBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.4), anvilMat);
  anvilBase.position.set(-0.5, 1.125, 0);
  bench.add(anvilBase);

  const anvilHorn = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.35, 8), anvilMat);
  anvilHorn.rotateZ(-Math.PI / 2);
  anvilHorn.position.set(-0.75, 1.2, 0);
  bench.add(anvilHorn);

  // Tool Rack / Backboard
  const backboard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.1), yellowHazardMat);
  backboard.position.set(0, 1.5, -0.55);
  bench.add(backboard);

  // Holographic Floating Upgrade Icon / Diamond
  const holoGeo = new THREE.OctahedronGeometry(0.35);
  const holoMesh = new THREE.Mesh(holoGeo, holographicMat);
  holoMesh.position.set(0.5, 1.45, 0);
  holoMesh.name = 'bench_holo_icon';
  bench.add(holoMesh);

  // Emissive Point Light illuminating the bench
  const benchLight = new THREE.PointLight(0x38bdf8, 2.5, 6.0);
  benchLight.position.set(0, 1.6, 0.2);
  bench.add(benchLight);

  return bench;
}


// -------------------------------------------------------------
// DEDICATED 1V1 FLAT ARENA MAP GENERATOR
// -------------------------------------------------------------
export function build1v1Arena(scene: THREE.Scene): {
  harvestables: HarvestableObject[];
  harvestableMeshes: Map<string, THREE.Object3D>;
  staticColliders: SolidCollider[];
  upgradeBenches: UpgradeBenchStation[];
  resetPedestalPos: { x: number; y: number; z: number };
  playerSpawnPos: { x: number; y: number; z: number };
  botSpawnPos: { x: number; y: number; z: number };
} {
  const harvestables: HarvestableObject[] = [];
  const harvestableMeshes = new Map<string, THREE.Object3D>();
  const staticColliders: SolidCollider[] = [];
  const upgradeBenches: UpgradeBenchStation[] = [];

  const arenaRoot = new THREE.Group();
  scene.add(arenaRoot);

  // 1. Massive, Ultra-Clean Flat Grid Wooden/Titanium Floor Deck (160m x 160m empty arena)
  const floorGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
  floorGeo.rotateX(-Math.PI / 2);

  const arenaFloorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Dark titanium grid
    roughness: 0.3,
    metalness: 0.6,
  });
  const arenaFloor = new THREE.Mesh(floorGeo, arenaFloorMat);
  arenaFloor.position.y = 0.0;
  arenaFloor.receiveShadow = true;
  arenaRoot.add(arenaFloor);

  // Grid Lines overlay on arena deck
  const gridHelper = new THREE.GridHelper(160, 32, 0x38bdf8, 0x334155);
  gridHelper.position.y = 0.02;
  arenaRoot.add(gridHelper);

  // 2. Glowing Neon Boundary Barriers around the Arena
  const barrierMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  });
  const barrierEdgeMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
  });

  const wallH = 24.0;
  const halfSize = 80;

  const walls = [
    { x: 0, z: halfSize, w: 160, d: 0.4 },
    { x: 0, z: -halfSize, w: 160, d: 0.4 },
    { x: halfSize, z: 0, w: 0.4, d: 160 },
    { x: -halfSize, z: 0, w: 0.4, d: 160 },
  ];

  walls.forEach((w) => {
    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(w.w, wallH, w.d), barrierMat);
    wallMesh.position.set(w.x, wallH / 2, w.z);
    arenaRoot.add(wallMesh);

    // Glowing top beam
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(w.w || 0.8, 0.8, w.d || 0.8), barrierEdgeMat);
    topBeam.position.set(w.x, wallH, w.z);
    arenaRoot.add(topBeam);

    staticColliders.push({
      type: 'box',
      minX: w.x - (w.w ? w.w / 2 : 0.8),
      maxX: w.x + (w.w ? w.w / 2 : 0.8),
      minY: 0,
      maxY: wallH + 10,
      minZ: w.z - (w.d ? w.d / 2 : 0.8),
      maxZ: w.z + (w.d ? w.d / 2 : 0.8),
      name: 'Arena Barrier Wall',
    });
  });

  // 3. Upgrade Bench on Side Deck
  const benchMesh = createUpgradeBenchMesh();
  benchMesh.position.set(16.0, 0, 0);
  benchMesh.rotateY(-Math.PI / 2);
  arenaRoot.add(benchMesh);

  upgradeBenches.push({
    id: 'arena_upgrade_bench',
    x: 16.0,
    y: 0,
    z: 0,
    mesh: benchMesh,
  });

  staticColliders.push({
    type: 'box',
    minX: 14.5,
    maxX: 17.5,
    minY: 0,
    maxY: 2.5,
    minZ: -1.5,
    maxZ: 1.5,
    name: 'Upgrade Bench',
  });

  // 5. Arena Ambient Lighting Pillars
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
  const pillarCoords = [
    { x: -35, z: -35 },
    { x: 35, z: -35 },
    { x: -35, z: 35 },
    { x: 35, z: 35 },
  ];

  pillarCoords.forEach((p) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 12, 12), pillarMat);
    pillar.position.set(p.x, 6, p.z);
    arenaRoot.add(pillar);

    const lightOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    lightOrb.position.set(p.x, 12, p.z);
    arenaRoot.add(lightOrb);

    const floodLight = new THREE.PointLight(0x38bdf8, 3.0, 45.0);
    floodLight.position.set(p.x, 11.5, p.z);
    arenaRoot.add(floodLight);
  });

  return {
    harvestables,
    harvestableMeshes,
    staticColliders,
    upgradeBenches,
    resetPedestalPos: { x: 16.0, y: 1.2, z: -4.0 },
    playerSpawnPos: { x: 0, y: 0.1, z: 15.0 },
    botSpawnPos: { x: 0, y: 0.1, z: -15.0 },
  };
}
