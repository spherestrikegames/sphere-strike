import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider, DrivableVehicle } from '../types';
import { UpgradeBenchStation, createUpgradeBenchMesh } from './fortniteWorldArena';
import { addDetailedDrivableVehicle } from './fortniteWorldVehiclesProps';
import { addChest, createHarvestableTree } from './fortniteWorldNature';
import { SKYSCRAPER_LAUNCH_PADS } from './fortniteWorldTerrain';

// ============================================================================
// AUTHORITATIVE WORLD QUERY INTERFACES
// ============================================================================
export interface WaterQueryInfo {
  isInWater: boolean;
  waterLevel: number;
  depth: number;
  type: 'ocean' | 'river' | 'lake' | 'none';
}

export interface RoadQueryInfo {
  isOnRoad: boolean;
  isNearRoad: boolean;
  roadElevation: number;
  roadId?: string;
  isBridge?: boolean;
  isTunnel?: boolean;
}

export interface HighwayPolyline {
  id: string;
  name: string;
  width: number;
  points: { x: number; z: number }[];
  bridgeRanges?: { tStart: number; tEnd: number; deckY: number }[];
}

// ============================================================================
// MATH & INTERPOLATION HELPERS
// ============================================================================
function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**radial weight: 1 inside innerRadius, smoothly 0 at outerRadius */
function radialWeight(x: number, z: number, cx: number, cz: number, innerR: number, outerR: number): number {
  const d = Math.hypot(x - cx, z - cz);
  if (d <= innerR) return 1.0;
  if (d >= outerR) return 0.0;
  return 1.0 - smoothstep(innerR, outerR, d);
}

/** Distance from point (px, pz) to 2D line segment (ax, az)-(bx, bz) */
function distToSegment2D(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number
): { dist: number; t: number; closestX: number; closestZ: number } {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.0001) {
    return { dist: Math.hypot(px - ax, pz - az), t: 0, closestX: ax, closestZ: az };
  }
  const t = clamp01(((px - ax) * dx + (pz - az) * dz) / lenSq);
  const closestX = ax + t * dx;
  const closestZ = az + t * dz;
  return {
    dist: Math.hypot(px - closestX, pz - closestZ),
    t,
    closestX,
    closestZ,
  };
}

// ============================================================================
// STRIKE ISLAND HIGHWAY NETWORK DEFINITION
// ============================================================================
export const STRIKE_ISLAND_HIGHWAYS: HighwayPolyline[] = [
  {
    id: 'north_highway',
    name: 'North Alpine Highway',
    width: 11,
    points: [
      { x: 0, z: -85 },
      { x: 0, z: -165 },
      { x: 0, z: -245 },
    ],
  },
  {
    id: 'east_highway',
    name: 'East Industrial Causeway',
    width: 11,
    points: [
      { x: 82, z: 0 },
      { x: 145, z: 0 },
      { x: 205, z: 12 },
    ],
    // Crosses the River Canyon around x = 94..134
    bridgeRanges: [{ tStart: 0.08, tEnd: 0.48, deckY: 2.4 }],
  },
  {
    id: 'south_highway',
    name: 'South Circuit Parkway',
    width: 11,
    points: [
      { x: 0, z: 82 },
      { x: -18, z: 145 },
      { x: -35, z: 205 },
    ],
  },
  {
    id: 'west_highway',
    name: 'West Temple Road',
    width: 10,
    points: [
      { x: -82, z: 0 },
      { x: -125, z: 10 },
      { x: -165, z: 18 },
    ],
  },
  {
    id: 'desert_highway',
    name: 'Dusty Desert Highway',
    width: 10,
    points: [
      { x: 75, z: 75 },
      { x: 135, z: 135 },
      { x: 185, z: 185 },
    ],
  },
  {
    id: 'coastal_highway',
    name: 'Coastal Village Road',
    width: 9,
    points: [
      { x: -195, z: 55 },
      { x: -225, z: 115 },
      { x: -245, z: 155 },
    ],
  },
  {
    id: 'forest_highway',
    name: 'Pinewood Logging Road',
    width: 9,
    points: [
      { x: -195, z: -18 },
      { x: -210, z: -95 },
      { x: -218, z: -160 },
    ],
  },
  {
    id: 'military_highway',
    name: 'Military Base Convoy Road',
    width: 10,
    points: [
      { x: 240, z: -30 },
      { x: 240, z: -105 },
      { x: 240, z: -165 },
    ],
  },
  {
    id: 'bunker_spur',
    name: 'Bunker Command Access Road',
    width: 8,
    points: [
      { x: 0, z: 65 },
      { x: -10, z: 76 },
      { x: -18, z: 84 },
    ],
  },
];

// ============================================================================
// POI FOUNDATION PADS (SINGLE SOURCE OF TRUTH FOR BUILDING ELEVATIONS)
// ============================================================================
export const POI_FOUNDATION_PADS: Record<
  string,
  { cx: number; cz: number; innerR: number; outerR: number; elevation: number }
> = {
  strike_city: { cx: 0, cz: 0, innerR: 68, outerR: 84, elevation: 0.0 },
  dusty_desert: { cx: 220, cz: 220, innerR: 56, outerR: 92, elevation: 4.0 },
  pinewood_forest: { cx: -225, cz: -202, innerR: 42, outerR: 82, elevation: 6.5 },
  military_base: { cx: 240, cz: -220, innerR: 72, outerR: 108, elevation: 5.0 },
  coastal_village: { cx: -240, cz: 180, innerR: 32, outerR: 62, elevation: 1.5 },
  snowfall_summit: { cx: 0, cz: -290, innerR: 28, outerR: 48, elevation: 38.0 },
  industrial_zone: { cx: 250, cz: 20, innerR: 62, outerR: 94, elevation: 1.5 },
  lost_temple: { cx: -200, cz: 20, innerR: 54, outerR: 88, elevation: 3.0 },
  racing_circuit: { cx: -40, cz: 250, innerR: 74, outerR: 108, elevation: 0.5 },
  underground_bunker: { cx: -20, cz: 90, innerR: 26, outerR: 54, elevation: 12.0 },
};

/**
 * River Canyon centerline X as a function of Z (-420 to +420)
 * Winds smoothly through the island east of Strike City and west of South Circuit
 */
export function getRiverCenterX(z: number): number {
  return 112 - z * 0.22 + Math.sin(z * 0.012) * 18;
}

/**
 * Raw procedural terrain height (used to populate the authoritative heightfield grid)
 * Uses smooth Hermite blending across all 10 POIs without abrupt vertical cutoffs.
 */
export function getStrikeIslandRawElevation(x: number, z: number): number {
  // Base natural rolling island relief
  let h =
    Math.sin(x * 0.014) * Math.cos(z * 0.014) * 2.2 +
    Math.sin((x + z) * 0.008) * 1.4 +
    0.6;

  // 1. Snowfall Mountain massif in the North (cx=0, cz=-290, outer radius 148m)
  const distMountain = Math.hypot(x - 0, z - -290);
  if (distMountain < 148) {
    const mNorm = distMountain / 148;
    const mountainCone = Math.pow(1 - mNorm, 1.55) * 38.0;
    const ridgeDetail = (1 - mNorm) * (Math.sin(x * 0.07) * Math.cos(z * 0.07) * 2.4);
    const mWeight = 1.0 - smoothstep(110, 148, distMountain);
    h = THREE.MathUtils.lerp(h, mountainCone + ridgeDetail, mWeight);

    // Alpine Tarn basin at (38, -255)
    const distTarn = Math.hypot(x - 38, z - -255);
    if (distTarn < 22) {
      const tarnW = 1.0 - smoothstep(12, 22, distTarn);
      h = THREE.MathUtils.lerp(h, 13.6, tarnW);
    }
  }

  // 2. Dusty Desert dunes outside the flat town foundation pad (South-East)
  const distDesert = Math.hypot(x - 220, z - 220);
  if (distDesert < 145) {
    const duneH =
      4.0 +
      Math.sin(x * 0.032) * Math.cos(z * 0.028) * 3.8 +
      Math.sin((x - z) * 0.02) * 2.0;
    const dWeight = 1.0 - smoothstep(95, 145, distDesert);
    h = THREE.MathUtils.lerp(h, duneH, dWeight);
  }

  // 3. Pinewood Forest rolling hills (North-West)
  const distForest = Math.hypot(x - -225, z - -202);
  if (distForest < 140) {
    const forestH = 6.5 + Math.sin(x * 0.025) * Math.cos(z * 0.025) * 3.2;
    const fWeight = 1.0 - smoothstep(90, 140, distForest);
    h = THREE.MathUtils.lerp(h, forestH, fWeight);
  }

  // 4. Blend all 10 POI Foundation Pads smoothly so buildings rest on flat graded ground
  for (const key of Object.keys(POI_FOUNDATION_PADS)) {
    const pad = POI_FOUNDATION_PADS[key];
    const w = radialWeight(x, z, pad.cx, pad.cz, pad.innerR, pad.outerR);
    if (w > 0) {
      h = THREE.MathUtils.lerp(h, pad.elevation, w);
    }
  }

  // Strike City subterranean subway stairwell cutout (X: 19..35, Z: 10..26)
  if (x >= 17 && x <= 37 && z >= 8 && z <= 28) {
    const wx = Math.min(smoothstep(17, 20, x), 1 - smoothstep(34, 37, x));
    const wz = Math.min(smoothstep(8, 11, z), 1 - smoothstep(25, 28, z));
    h = THREE.MathUtils.lerp(h, -3.8, wx * wz);
  }

  // Underground Bunker subterranean chamber cutout (X: -32..-8, Z: 84..116)
  if (x >= -34 && x <= -6 && z >= 82 && z <= 118) {
    const wx = Math.min(smoothstep(-34, -30, x), 1 - smoothstep(-10, -6, x));
    const wz = Math.min(smoothstep(82, 86, z), 1 - smoothstep(114, 118, z));
    h = THREE.MathUtils.lerp(h, 7.2, wx * wz);
  }

  // 5. Coastal Village Western Shoreline & Ocean Basin (x < -248)
  if (x < -248) {
    const shoreT = clamp01((-248 - x) / 38);
    const oceanFloor = -3.2;
    h = THREE.MathUtils.lerp(h, oceanFloor, smoothstep(0, 1, shoreT));
    // Lighthouse rocky promontory at (-285, 130)
    const distLighthouse = Math.hypot(x - -285, z - 130);
    if (distLighthouse < 26) {
      const lw = 1.0 - smoothstep(12, 26, distLighthouse);
      h = THREE.MathUtils.lerp(h, 6.0, lw);
    }
  }

  // 6. Winding River Canyon (protected outside POI inner pads)
  const riverX = getRiverCenterX(z);
  const riverDist = Math.abs(x - riverX);
  if (riverDist < 24) {
    // Do not carve river through Strike City or Racing Circuit pads
    const inCity = Math.hypot(x, z) < 92;
    const inCircuit = Math.hypot(x - -40, z - 250) < 78;
    if (!inCity && !inCircuit) {
      const canyonT = 1.0 - smoothstep(8, 24, riverDist);
      const riverbedY = -3.2;
      h = THREE.MathUtils.lerp(h, riverbedY, canyonT);
    }
  }

  return h;
}

// ============================================================================
// SHARED HEIGHTFIELD GRID FOR 100% EXACT MESH-TO-PHYSICS TRIANGLE INTERPOLATION
// ============================================================================
const ISLAND_SIZE = 840;
const ISLAND_SEGMENTS = 168; // 5.0m exact grid cells
const ISLAND_HALF = ISLAND_SIZE / 2; // 420
const ISLAND_STEP = ISLAND_SIZE / ISLAND_SEGMENTS; // 5.0m
let cachedHeightGrid: Float32Array | null = null;

function ensureHeightGrid(): Float32Array {
  if (cachedHeightGrid) return cachedHeightGrid;
  const cols = ISLAND_SEGMENTS + 1;
  const grid = new Float32Array(cols * cols);
  for (let iz = 0; iz <= ISLAND_SEGMENTS; iz++) {
    const vz = -ISLAND_HALF + iz * ISLAND_STEP;
    for (let ix = 0; ix <= ISLAND_SEGMENTS; ix++) {
      const vx = -ISLAND_HALF + ix * ISLAND_STEP;
      grid[iz * cols + ix] = getStrikeIslandRawElevation(vx, vz);
    }
  }
  cachedHeightGrid = grid;
  return grid;
}

/**
 * Authoritative Strike Island elevation function.
 * Interpolates the exact triangle of the PlaneGeometry(840, 840, 168, 168) mesh
 * so physics ground height matches the rendered 3D terrain mesh to within <0.001m.
 */
export function getStrikeIslandElevation(x: number, z: number): number {
  const grid = ensureHeightGrid();
  const cols = ISLAND_SEGMENTS + 1;

  const gx = clamp01((x + ISLAND_HALF) / ISLAND_SIZE) * ISLAND_SEGMENTS;
  const gz = clamp01((z + ISLAND_HALF) / ISLAND_SIZE) * ISLAND_SEGMENTS;

  const ix = Math.min(ISLAND_SEGMENTS - 1, Math.floor(gx));
  const iz = Math.min(ISLAND_SEGMENTS - 1, Math.floor(gz));
  const fx = gx - ix;
  const fz = gz - iz;

  const h00 = grid[iz * cols + ix];
  const h10 = grid[iz * cols + (ix + 1)];
  const h01 = grid[(iz + 1) * cols + ix];
  const h11 = grid[(iz + 1) * cols + (ix + 1)];

  // Three.js PlaneGeometry splits each quad (ix,iz)-(ix+1,iz+1) along the diagonal from (1,0) to (0,1)
  // Upper-left triangle: fx + fz <= 1; Lower-right triangle: fx + fz > 1
  if (fx + fz <= 1.0) {
    return h00 + fx * (h10 - h00) + fz * (h01 - h00);
  } else {
    return h11 + (1.0 - fx) * (h01 - h11) + (1.0 - fz) * (h10 - h11);
  }
}

/**
 * Authoritative building foundation height query
 */
export function getStrikeIslandBuildingFoundationHeight(x: number, z: number): number {
  let closestElevation: number | null = null;
  let closestDist = Infinity;
  for (const key of Object.keys(POI_FOUNDATION_PADS)) {
    const pad = POI_FOUNDATION_PADS[key];
    const dist = Math.hypot(x - pad.cx, z - pad.cz);
    if (dist <= pad.innerR + 6 && dist < closestDist) {
      closestDist = dist;
      closestElevation = pad.elevation;
    }
  }
  if (closestElevation !== null) {
    return closestElevation;
  }
  return getStrikeIslandElevation(x, z);
}

/**
 * Authoritative water query for Strike Island
 */
export function getStrikeIslandWaterInfo(x: number, z: number): WaterQueryInfo {
  const terrainY = getStrikeIslandElevation(x, z);

  // 1. Western Coastal Ocean (x < -258)
  if (x < -258) {
    const waterLevel = -0.5;
    if (terrainY < waterLevel) {
      return {
        isInWater: true,
        waterLevel,
        depth: Math.max(0, waterLevel - terrainY),
        type: 'ocean',
      };
    }
  }

  // 2. Alpine Mountain Tarn (cx=38, cz=-255, r=20)
  const distTarn = Math.hypot(x - 38, z - -255);
  if (distTarn < 20) {
    const waterLevel = 15.2;
    if (terrainY < waterLevel) {
      return {
        isInWater: true,
        waterLevel,
        depth: Math.max(0, waterLevel - terrainY),
        type: 'lake',
      };
    }
  }

  // 3. Winding Strike River Canyon
  const riverX = getRiverCenterX(z);
  const riverDist = Math.abs(x - riverX);
  if (riverDist < 20) {
    const inCity = Math.hypot(x, z) < 92;
    const inCircuit = Math.hypot(x - -40, z - 250) < 78;
    if (!inCity && !inCircuit) {
      const waterLevel = -0.8;
      if (terrainY < waterLevel) {
        return {
          isInWater: true,
          waterLevel,
          depth: Math.max(0, waterLevel - terrainY),
          type: 'river',
        };
      }
    }
  }

  return { isInWater: false, waterLevel: -999, depth: 0, type: 'none' };
}

/**
 * Authoritative road query for Strike Island
 */
export function getStrikeIslandRoadInfo(x: number, z: number): RoadQueryInfo {
  let bestDist = Infinity;
  let bestHighway: HighwayPolyline | null = null;
  let bestGlobalT = 0;
  let bestPointX = x;
  let bestPointZ = z;

  for (const hwy of STRIKE_ISLAND_HIGHWAYS) {
    const pts = hwy.points;
    const numSegs = pts.length - 1;
    for (let i = 0; i < numSegs; i++) {
      const res = distToSegment2D(x, z, pts[i].x, pts[i].z, pts[i + 1].x, pts[i + 1].z);
      if (res.dist < bestDist) {
        bestDist = res.dist;
        bestHighway = hwy;
        bestGlobalT = (i + res.t) / numSegs;
        bestPointX = res.closestX;
        bestPointZ = res.closestZ;
      }
    }
  }

  if (!bestHighway) {
    return { isOnRoad: false, isNearRoad: false, roadElevation: getStrikeIslandElevation(x, z) };
  }

  const halfW = bestHighway.width * 0.5;
  const isOnRoad = bestDist <= halfW;
  const isNearRoad = bestDist <= halfW + 4.5;

  let isBridge = false;
  let roadElevation = getStrikeIslandElevation(bestPointX, bestPointZ) + 0.08;

  if (bestHighway.bridgeRanges) {
    for (const br of bestHighway.bridgeRanges) {
      if (bestGlobalT >= br.tStart && bestGlobalT <= br.tEnd) {
        isBridge = true;
        roadElevation = br.deckY;
      }
    }
  }

  return {
    isOnRoad,
    isNearRoad,
    roadElevation,
    roadId: bestHighway.id,
    isBridge,
    isTunnel: false,
  };
}

/**
 * Authoritative surface type query for footstep audio and VFX
 */
export function getStrikeIslandSurfaceType(
  x: number,
  z: number
): 'grass' | 'wood' | 'stone' | 'metal' | 'sand' | 'snow' | 'water' {
  const water = getStrikeIslandWaterInfo(x, z);
  if (water.isInWater) return 'water';

  const road = getStrikeIslandRoadInfo(x, z);
  if (road.isOnRoad) return 'stone';

  if (Math.hypot(x - 0, z - -290) < 125) return 'snow';
  if (Math.hypot(x - 220, z - 220) < 110 || x < -245) return 'sand';
  if (
    Math.hypot(x, z) < 92 ||
    Math.hypot(x - 240, z - -220) < 75 ||
    Math.hypot(x - 250, z - 20) < 65 ||
    Math.hypot(x - -40, z - 250) < 75
  ) {
    return 'stone';
  }
  if (Math.hypot(x - -20, z - 90) < 28) return 'metal';
  return 'grass';
}

// ============================================================================
// MAIN WORLD GENERATOR FOR STRIKE ISLAND
// ============================================================================
export function buildStrikeIslandWorld(): {
  rootGroup: THREE.Group;
  terrainMesh: THREE.Mesh;
  harvestables: HarvestableObject[];
  harvestableMeshes: Map<string, THREE.Object3D>;
  chests: LootChest[];
  chestMeshes: Map<string, THREE.Group>;
  staticColliders: SolidCollider[];
  vehicles: DrivableVehicle[];
  upgradeBenches: UpgradeBenchStation[];
  spawnPoint: THREE.Vector3;
  getElevation: (x: number, z: number) => number;
  getSurfaceType: (x: number, z: number) => 'grass' | 'wood' | 'stone' | 'metal' | 'sand' | 'snow' | 'water';
  getWaterInfo: (x: number, z: number) => WaterQueryInfo;
  getRoadInfo: (x: number, z: number) => RoadQueryInfo;
  getBuildingFoundationHeight: (x: number, z: number) => number;
} {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Map_StrikeIsland';

  const harvestables: HarvestableObject[] = [];
  const harvestableMeshes = new Map<string, THREE.Object3D>();
  const chests: LootChest[] = [];
  const chestMeshes = new Map<string, THREE.Group>();
  const staticColliders: SolidCollider[] = [];
  const vehicles: DrivableVehicle[] = [];
  const upgradeBenches: UpgradeBenchStation[] = [];

  // 1. Multi-Biome Vertex-Colored Contoured Terrain (840m x 840m, 168x168 segments = 5.0m cells)
  const grid = ensureHeightGrid();
  const cols = ISLAND_SEGMENTS + 1;
  const terrainGeo = new THREE.PlaneGeometry(ISLAND_SIZE, ISLAND_SIZE, ISLAND_SEGMENTS, ISLAND_SEGMENTS);
  terrainGeo.rotateX(-Math.PI / 2);

  const pos = terrainGeo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    const ix = Math.round(((vx + ISLAND_HALF) / ISLAND_SIZE) * ISLAND_SEGMENTS);
    const iz = Math.round(((vz + ISLAND_HALF) / ISLAND_SIZE) * ISLAND_SEGMENTS);
    const vy = grid[iz * cols + ix] ?? getStrikeIslandRawElevation(vx, vz);
    pos.setY(i, vy);

    // Biome vertex coloring
    if (vy > 22) {
      color.setHex(0xf8fafc); // Snow peak
    } else if (vy > 13 && vz < -150) {
      color.setHex(0x94a3b8); // Alpine rock
    } else if (vx > 110 && vz > 110) {
      color.setHex(0xd97706); // Dusty Desert sand
    } else if (vx < -225 && vz > 90) {
      color.setHex(0xfde047); // Coastal sandy beach
    } else if (vx < -110 && vz < -90) {
      color.setHex(0x166534); // Pinewood deep forest moss
    } else if (vx > 130 && vz < -110) {
      color.setHex(0x475569); // Military tarmac plateau
    } else if (vy < -0.6) {
      color.setHex(0x0284c7); // Riverbed / ocean floor
    } else {
      color.setHex(0x3f912b); // Meadow grass
    }
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.86,
    metalness: 0.04,
    flatShading: true,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  rootGroup.add(terrainMesh);

  // 2. Scoped Water Basins (No global underground water sheet!)
  buildScopedWaterBodies(rootGroup);

  // 3. Terrain-Conforming Centerline Highway Network & Canyon Suspension Bridge
  buildCenterlineRoadNetwork(rootGroup, staticColliders);

  // 4. Build All 10 Named POIs on their Exact Graded Foundation Pads
  buildStrikeCity(rootGroup, harvestables, harvestableMeshes, chests, chestMeshes, staticColliders, vehicles, upgradeBenches);
  buildDustyDesert(rootGroup, harvestables, harvestableMeshes, chests, chestMeshes, staticColliders, vehicles, upgradeBenches);
  buildPinewoodForest(rootGroup, harvestables, harvestableMeshes, chests, chestMeshes, staticColliders, vehicles);
  buildMilitaryBase(rootGroup, harvestables, harvestableMeshes, chests, chestMeshes, staticColliders, vehicles, upgradeBenches);
  buildCoastalVillage(rootGroup, harvestables, harvestableMeshes, chests, chestMeshes, staticColliders);
  buildSnowfallMountain(rootGroup, harvestables, harvestableMeshes, chests, chestMeshes, staticColliders);
  buildIndustrialZone(rootGroup, harvestables, harvestableMeshes, chests, chestMeshes, staticColliders, vehicles);
  buildLostTemple(rootGroup, harvestables, harvestableMeshes, chests, chestMeshes, staticColliders);
  buildRacingCircuit(rootGroup, harvestables, harvestableMeshes, chests, chestMeshes, staticColliders, vehicles);
  buildUndergroundBunker(rootGroup, harvestables, harvestableMeshes, chests, chestMeshes, staticColliders);

  // 5. Populate Wilderness Trees & Rocks (automatically grounded & road/water-aware)
  populateWildernessNature(rootGroup, harvestables, harvestableMeshes, chests, chestMeshes, staticColliders);

  return {
    rootGroup,
    terrainMesh,
    harvestables,
    harvestableMeshes,
    chests,
    chestMeshes,
    staticColliders,
    vehicles,
    upgradeBenches,
    spawnPoint: new THREE.Vector3(0, 0.5, 0),
    getElevation: getStrikeIslandElevation,
    getSurfaceType: getStrikeIslandSurfaceType,
    getWaterInfo: getStrikeIslandWaterInfo,
    getRoadInfo: getStrikeIslandRoadInfo,
    getBuildingFoundationHeight: getStrikeIslandBuildingFoundationHeight,
  };
}

// ============================================================================
// SCOPED WATER BASINS (OCEAN, RIVER CANYON RIBBON, ALPINE TARN)
// ============================================================================
function buildScopedWaterBodies(rootGroup: THREE.Group) {
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.12,
    metalness: 0.78,
    transparent: true,
    opacity: 0.82,
  });

  // A. Western Coastal Ocean Plane (X: -420 to -252, Z: -420 to +420)
  const oceanGeo = new THREE.PlaneGeometry(168, 840);
  oceanGeo.rotateX(-Math.PI / 2);
  const oceanMesh = new THREE.Mesh(oceanGeo, waterMat);
  oceanMesh.position.set(-336, -0.5, 0);
  rootGroup.add(oceanMesh);

  // B. Winding River Canyon Ribbon (follows getRiverCenterX(z) at y = -0.8m)
  // Built in two segments so it doesn't cut inside Strike City or Racing Circuit pads
  const buildRiverRibbon = (zStart: number, zEnd: number, steps: number) => {
    const positions: number[] = [];
    const indices: number[] = [];
    const halfWidth = 18;

    for (let i = 0; i <= steps; i++) {
      const z = zStart + ((zEnd - zStart) * i) / steps;
      const cx = getRiverCenterX(z);
      positions.push(cx - halfWidth, -0.8, z);
      positions.push(cx + halfWidth, -0.8, z);
      if (i < steps) {
        const row = i * 2;
        indices.push(row, row + 2, row + 1);
        indices.push(row + 1, row + 2, row + 3);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, waterMat);
    rootGroup.add(mesh);
  };

  buildRiverRibbon(-410, 410, 84);

  // C. Snowfall Mountain Alpine Tarn (cx = 38, cz = -255, y = 15.2m)
  const tarnMesh = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 0.15, 24), waterMat);
  tarnMesh.position.set(38, 15.2, -255);
  rootGroup.add(tarnMesh);
}

// ============================================================================
// TERRAIN-CONFORMING CENTERLINE ROAD & CANYON BRIDGE BUILDER
// ============================================================================
function buildCenterlineRoadNetwork(rootGroup: THREE.Group, staticColliders: SolidCollider[]) {
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const shoulderMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const dashTransforms: THREE.Matrix4[] = [];
  const tempMat4 = new THREE.Matrix4();
  const tempPos = new THREE.Vector3();
  const tempQuat = new THREE.Quaternion();
  const tempScale = new THREE.Vector3(1, 1, 1);
  const upVec = new THREE.Vector3(0, 1, 0);

  for (const hwy of STRIKE_ISLAND_HIGHWAYS) {
    // Sample polyline every ~3.5 meters
    const sampled: { x: number; y: number; z: number; dirX: number; dirZ: number; globalT: number }[] = [];
    const pts = hwy.points;
    const numSegs = pts.length - 1;

    for (let s = 0; s < numSegs; s++) {
      const p0 = pts[s];
      const p1 = pts[s + 1];
      const segLen = Math.hypot(p1.x - p0.x, p1.z - p0.z);
      const steps = Math.max(4, Math.ceil(segLen / 3.5));
      const dirX = (p1.x - p0.x) / segLen;
      const dirZ = (p1.z - p0.z) / segLen;

      for (let k = 0; k <= steps; k++) {
        if (s > 0 && k === 0) continue;
        const localT = k / steps;
        const globalT = (s + localT) / numSegs;
        const sx = p0.x + (p1.x - p0.x) * localT;
        const sz = p0.z + (p1.z - p0.z) * localT;

        let sy = getStrikeIslandElevation(sx, sz) + 0.1;

        // Elevate smoothly across bridge ranges
        if (hwy.bridgeRanges) {
          for (const br of hwy.bridgeRanges) {
            if (globalT >= br.tStart && globalT <= br.tEnd) {
              const rampFrac = 0.18;
              const spanT = (globalT - br.tStart) / (br.tEnd - br.tStart);
              let bridgeBlend = 1.0;
              if (spanT < rampFrac) bridgeBlend = smoothstep(0, rampFrac, spanT);
              else if (spanT > 1 - rampFrac) bridgeBlend = smoothstep(0, rampFrac, 1 - spanT);
              sy = THREE.MathUtils.lerp(sy, br.deckY, bridgeBlend);
            }
          }
        }

        sampled.push({ x: sx, y: sy, z: sz, dirX, dirZ, globalT });
      }
    }

    // Build continuous triangle-strip ribbon for the road surface & gravel shoulders
    const positions: number[] = [];
    const shoulderPositions: number[] = [];
    const indices: number[] = [];
    const halfW = hwy.width * 0.5;
    const shoulderW = halfW + 1.2;

    for (let i = 0; i < sampled.length; i++) {
      const pt = sampled[i];
      const perpX = -pt.dirZ;
      const perpZ = pt.dirX;

      const lx = pt.x + perpX * halfW;
      const lz = pt.z + perpZ * halfW;
      const rx = pt.x - perpX * halfW;
      const rz = pt.z - perpZ * halfW;

      // Sample left/right edge height so road banks naturally on hillsides
      const isOnBridge = hwy.bridgeRanges?.some((b) => pt.globalT >= b.tStart && pt.globalT <= b.tEnd);
      const ly = isOnBridge ? pt.y : Math.max(pt.y, getStrikeIslandElevation(lx, lz) + 0.1);
      const ry = isOnBridge ? pt.y : Math.max(pt.y, getStrikeIslandElevation(rx, rz) + 0.1);
      const centerH = Math.max(pt.y, (ly + ry) * 0.5);

      positions.push(lx, ly, lz);
      positions.push(rx, ry, rz);

      shoulderPositions.push(pt.x + perpX * shoulderW, ly - 0.04, pt.z + perpZ * shoulderW);
      shoulderPositions.push(pt.x - perpX * shoulderW, ry - 0.04, pt.z - perpZ * shoulderW);

      if (i < sampled.length - 1) {
        const row = i * 2;
        indices.push(row, row + 2, row + 1);
        indices.push(row + 1, row + 2, row + 3);
      }

      // Add instanced center dash every 2nd sample
      if (i % 2 === 0 && i < sampled.length - 1) {
        const yaw = Math.atan2(pt.dirX, pt.dirZ);
        tempPos.set(pt.x, centerH + 0.03, pt.z);
        tempQuat.setFromAxisAngle(upVec, yaw);
        tempMat4.compose(tempPos, tempQuat, tempScale);
        dashTransforms.push(tempMat4.clone());
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    rootGroup.add(roadMesh);

    const shoulderGeo = new THREE.BufferGeometry();
    shoulderGeo.setAttribute('position', new THREE.Float32BufferAttribute(shoulderPositions, 3));
    shoulderGeo.setIndex(indices);
    shoulderGeo.computeVertexNormals();
    const shoulderMesh = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderMesh.receiveShadow = true;
    rootGroup.add(shoulderMesh);
  }

  // Single InstancedMesh for all highway lane dashes across the entire island!
  if (dashTransforms.length > 0) {
    const dashGeo = new THREE.BoxGeometry(0.32, 0.04, 2.8);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const instancedDashes = new THREE.InstancedMesh(dashGeo, dashMat, dashTransforms.length);
    for (let i = 0; i < dashTransforms.length; i++) {
      instancedDashes.setMatrixAt(i, dashTransforms[i]);
    }
    instancedDashes.instanceMatrix.needsUpdate = true;
    rootGroup.add(instancedDashes);
  }

  // Build the East Causeway Suspension Bridge over the River Canyon (X: 88 to 140, Z: 0, Deck Y: 2.4m)
  buildCanyonBridge(rootGroup, staticColliders);
}

function buildCanyonBridge(rootGroup: THREE.Group, staticColliders: SolidCollider[]) {
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(114, 0, 0);

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
  const steelRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.65, roughness: 0.35 });

  // Main Bridge Deck (X: 90 to 138 => 48m span, width 12m, deck top at Y = 2.4m)
  const deck = new THREE.Mesh(new THREE.BoxGeometry(48, 0.5, 12.5), concreteMat);
  deck.position.set(0, 2.15, 0);
  deck.castShadow = true;
  deck.receiveShadow = true;
  bridgeGroup.add(deck);

  staticColliders.push({
    type: 'box',
    minX: 90,
    maxX: 138,
    minY: 1.8,
    maxY: 2.42,
    minZ: -6.2,
    maxZ: 6.2,
    name: 'Canyon Bridge Main Deck',
  });

  // Stepped Approach Ramps on West (X: 82..90) and East (X: 138..146) so players & cars climb onto the deck seamlessly
  for (let s = 0; s < 4; s++) {
    const stepH = 0.6 + (s + 1) * 0.45;
    // West approach step
    const wx = 83 + s * 2.0;
    staticColliders.push({
      type: 'box',
      minX: wx - 1.2,
      maxX: wx + 1.2,
      minY: 0,
      maxY: stepH,
      minZ: -6.0,
      maxZ: 6.0,
      name: `Bridge West Approach Step ${s + 1}`,
    });
    // East approach step
    const ex = 145 - s * 2.0;
    staticColliders.push({
      type: 'box',
      minX: ex - 1.2,
      maxX: ex + 1.2,
      minY: 0,
      maxY: stepH,
      minZ: -6.0,
      maxZ: 6.0,
      name: `Bridge East Approach Step ${s + 1}`,
    });
  }

  // Concrete Support Piers anchored into the riverbed (Y = -3.4m to 2.2m)
  for (const px of [-14, 0, 14]) {
    for (const pz of [-4.8, 4.8]) {
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 6.0, 12), concreteMat);
      pier.position.set(px, -0.8, pz);
      pier.castShadow = true;
      bridgeGroup.add(pier);

      staticColliders.push({
        type: 'cylinder',
        x: 114 + px,
        z: pz,
        radius: 1.1,
        minY: -3.5,
        maxY: 2.2,
        name: 'Bridge Support Pier',
      });
    }
  }

  // Steel Suspension Towers & Guardrails on North and South sides of the deck
  for (const rz of [-6.0, 6.0]) {
    const guardrail = new THREE.Mesh(new THREE.BoxGeometry(48, 1.1, 0.35), steelRedMat);
    guardrail.position.set(0, 2.95, rz);
    bridgeGroup.add(guardrail);

    staticColliders.push({
      type: 'box',
      minX: 90,
      maxX: 138,
      minY: 2.4,
      maxY: 3.5,
      minZ: rz - 0.25,
      maxZ: rz + 0.25,
      name: 'Bridge Guardrail',
    });

    for (const tx of [-14, 14]) {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(1.2, 11, 1.2), steelRedMat);
      pylon.position.set(tx, 7.5, rz);
      pylon.castShadow = true;
      bridgeGroup.add(pylon);
    }
  }

  rootGroup.add(bridgeGroup);
}

// ============================================================================
// HELPER: ENTERABLE BUILDING WITH REAL WALL COLLIDERS & OPEN DOORWAYS
// ============================================================================
function addEnterableRoomColliders(
  colliders: SolidCollider[],
  cx: number,
  floorY: number,
  cz: number,
  width: number,
  height: number,
  depth: number,
  doorSide: 'south' | 'north' | 'east' | 'west',
  name: string,
  doorWidth: number = 3.0
) {
  const hw = width * 0.5;
  const hd = depth * 0.5;
  const wallT = 0.45;

  // Floor Slab Collider
  colliders.push({
    type: 'box',
    minX: cx - hw,
    maxX: cx + hw,
    minY: floorY - 0.3,
    maxY: floorY + 0.15,
    minZ: cz - hd,
    maxZ: cz + hd,
    name: `${name} Floor Slab`,
  });

  // Roof / Ceiling Slab Collider
  colliders.push({
    type: 'box',
    minX: cx - hw,
    maxX: cx + hw,
    minY: floorY + height - 0.25,
    maxY: floorY + height + 0.25,
    minZ: cz - hd,
    maxZ: cz + hd,
    name: `${name} Roof Slab`,
  });

  // North Wall (z - hd)
  if (doorSide === 'north') {
    const wingW = Math.max(0.5, (width - doorWidth) * 0.5);
    colliders.push(
      {
        type: 'box',
        minX: cx - hw,
        maxX: cx - hw + wingW,
        minY: floorY,
        maxY: floorY + height,
        minZ: cz - hd - wallT,
        maxZ: cz - hd + wallT,
        name: `${name} North Wall L`,
      },
      {
        type: 'box',
        minX: cx + hw - wingW,
        maxX: cx + hw,
        minY: floorY,
        maxY: floorY + height,
        minZ: cz - hd - wallT,
        maxZ: cz - hd + wallT,
        name: `${name} North Wall R`,
      }
    );
  } else {
    colliders.push({
      type: 'box',
      minX: cx - hw,
      maxX: cx + hw,
      minY: floorY,
      maxY: floorY + height,
      minZ: cz - hd - wallT,
      maxZ: cz - hd + wallT,
      name: `${name} North Wall`,
    });
  }

  // South Wall (z + hd)
  if (doorSide === 'south') {
    const wingW = Math.max(0.5, (width - doorWidth) * 0.5);
    colliders.push(
      {
        type: 'box',
        minX: cx - hw,
        maxX: cx - hw + wingW,
        minY: floorY,
        maxY: floorY + height,
        minZ: cz + hd - wallT,
        maxZ: cz + hd + wallT,
        name: `${name} South Wall L`,
      },
      {
        type: 'box',
        minX: cx + hw - wingW,
        maxX: cx + hw,
        minY: floorY,
        maxY: floorY + height,
        minZ: cz + hd - wallT,
        maxZ: cz + hd + wallT,
        name: `${name} South Wall R`,
      }
    );
  } else {
    colliders.push({
      type: 'box',
      minX: cx - hw,
      maxX: cx + hw,
      minY: floorY,
      maxY: floorY + height,
      minZ: cz + hd - wallT,
      maxZ: cz + hd + wallT,
      name: `${name} South Wall`,
    });
  }

  // West Wall (x - hw)
  if (doorSide === 'west') {
    const wingD = Math.max(0.5, (depth - doorWidth) * 0.5);
    colliders.push(
      {
        type: 'box',
        minX: cx - hw - wallT,
        maxX: cx - hw + wallT,
        minY: floorY,
        maxY: floorY + height,
        minZ: cz - hd,
        maxZ: cz - hd + wingD,
        name: `${name} West Wall N`,
      },
      {
        type: 'box',
        minX: cx - hw - wallT,
        maxX: cx - hw + wallT,
        minY: floorY,
        maxY: floorY + height,
        minZ: cz + hd - wingD,
        maxZ: cz + hd,
        name: `${name} West Wall S`,
      }
    );
  } else {
    colliders.push({
      type: 'box',
      minX: cx - hw - wallT,
      maxX: cx - hw + wallT,
      minY: floorY,
      maxY: floorY + height,
      minZ: cz - hd,
      maxZ: cz + hd,
      name: `${name} West Wall`,
    });
  }

  // East Wall (x + hw)
  if (doorSide === 'east') {
    const wingD = Math.max(0.5, (depth - doorWidth) * 0.5);
    colliders.push(
      {
        type: 'box',
        minX: cx + hw - wallT,
        maxX: cx + hw + wallT,
        minY: floorY,
        maxY: floorY + height,
        minZ: cz - hd,
        maxZ: cz - hd + wingD,
        name: `${name} East Wall N`,
      },
      {
        type: 'box',
        minX: cx + hw - wallT,
        maxX: cx + hw + wallT,
        minY: floorY,
        maxY: floorY + height,
        minZ: cz + hd - wingD,
        maxZ: cz + hd,
        name: `${name} East Wall S`,
      }
    );
  } else {
    colliders.push({
      type: 'box',
      minX: cx + hw - wallT,
      maxX: cx + hw + wallT,
      minY: floorY,
      maxY: floorY + height,
      minZ: cz - hd,
      maxZ: cz + hd,
      name: `${name} East Wall`,
    });
  }
}

// ============================================================================
// POI 1: STRIKE CITY (CENTER: 0, 0, FOUNDATION Y = 0.0)
// ============================================================================
function buildStrikeCity(
  rootGroup: THREE.Group,
  harvestables: HarvestableObject[],
  _harvestableMeshes: Map<string, THREE.Object3D>,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  staticColliders: SolidCollider[],
  vehicles: DrivableVehicle[],
  upgradeBenches: UpgradeBenchStation[]
) {
  const baseY = POI_FOUNDATION_PADS.strike_city.elevation; // 0.0
  const cityGroup = new THREE.Group();
  cityGroup.name = 'POI_StrikeCity';
  cityGroup.position.set(0, baseY, 0);

  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
  const plazaMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

  // City Plaza Slab
  const cityPad = new THREE.Mesh(new THREE.BoxGeometry(176, 0.14, 176), plazaMat);
  cityPad.position.set(0, 0.02, 0);
  cityPad.receiveShadow = true;
  cityGroup.add(cityPad);

  const nsAve = new THREE.Mesh(new THREE.BoxGeometry(18, 0.16, 176), asphaltMat);
  nsAve.position.set(0, 0.05, 0);
  cityGroup.add(nsAve);

  const ewAve = new THREE.Mesh(new THREE.BoxGeometry(176, 0.16, 18), asphaltMat);
  ewAve.position.set(0, 0.05, 0);
  cityGroup.add(ewAve);

  // Perimeter Skyscrapers
  const towers = [
    { x: -58, z: -58, w: 26, h: 64, d: 26, col: 0x0f172a, name: 'Strike Citadel North-West' },
    { x: 58, z: -58, w: 28, h: 72, d: 28, col: 0x1e293b, name: 'Omni Corp Spire' },
    { x: -58, z: 58, w: 24, h: 54, d: 24, col: 0x18181b, name: 'Horizon Apartments' },
    { x: 58, z: 58, w: 26, h: 60, d: 26, col: 0x111827, name: 'Nexus Financial Tower' },
  ];

  towers.forEach((t) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(t.w, t.h, t.d),
      new THREE.MeshStandardMaterial({ color: t.col, roughness: 0.2, metalness: 0.85 })
    );
    mesh.position.set(t.x, t.h / 2, t.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cityGroup.add(mesh);

    const neonBand = new THREE.Mesh(
      new THREE.BoxGeometry(t.w + 0.3, 1.8, t.d + 0.3),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    neonBand.position.set(t.x, t.h - 3, t.z);
    cityGroup.add(neonBand);

    staticColliders.push({
      type: 'box',
      minX: t.x - t.w / 2,
      maxX: t.x + t.w / 2,
      minY: baseY,
      maxY: baseY + t.h,
      minZ: t.z - t.d / 2,
      maxZ: t.z + t.d / 2,
      name: t.name,
    });
  });

  // Enterable Strike Central Tower (-34, 0) with open lobby, stairs to mezzanine (4.5m), & rooftop helipad (18m)
  const hqGroup = new THREE.Group();
  hqGroup.position.set(-34, 0, 0);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.4 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });

  const lobbyFloor = new THREE.Mesh(new THREE.BoxGeometry(24, 0.2, 22), floorMat);
  lobbyFloor.position.y = 0.1;
  hqGroup.add(lobbyFloor);

  // Lobby perimeter walls with wide East entrance toward avenue
  const backW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 18, 22), wallMat);
  backW.position.set(-11.8, 9, 0);
  hqGroup.add(backW);
  const northW = new THREE.Mesh(new THREE.BoxGeometry(24, 18, 0.4), wallMat);
  northW.position.set(0, 9, -10.8);
  hqGroup.add(northW);
  const southW = new THREE.Mesh(new THREE.BoxGeometry(24, 18, 0.4), wallMat);
  southW.position.set(0, 9, 10.8);
  hqGroup.add(southW);

  addEnterableRoomColliders(staticColliders, -34, baseY, 0, 24, 18, 22, 'east', 'Strike HQ Tower', 8.0);

  // Mezzanine Floor at Y = 4.5
  const mezzFloor = new THREE.Mesh(new THREE.BoxGeometry(24, 0.35, 12), floorMat);
  mezzFloor.position.set(0, 4.5, -4.5);
  hqGroup.add(mezzFloor);
  staticColliders.push({
    type: 'box',
    minX: -46,
    maxX: -22,
    minY: baseY + 4.3,
    maxY: baseY + 4.7,
    minZ: -10.5,
    maxZ: 1.5,
    name: 'Strike HQ Mezzanine',
  });

  // Walkable Staircase from Lobby (0m) to Mezzanine (4.5m)
  for (let s = 0; s < 10; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.45, 1.1), floorMat);
    step.position.set(7.5, 0.22 + s * 0.45, 6.5 - s * 1.0);
    hqGroup.add(step);
    staticColliders.push({
      type: 'box',
      minX: -34 + 5.9,
      maxX: -34 + 9.1,
      minY: baseY + s * 0.45,
      maxY: baseY + (s + 1) * 0.45 + 0.08,
      minZ: 6.5 - s * 1.0 - 0.6,
      maxZ: 6.5 - s * 1.0 + 0.6,
      name: `Strike HQ Stair Step ${s + 1}`,
    });
  }

  // Helipad Roof Deck at Y = 18.0
  const roofDeck = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 22), asphaltMat);
  roofDeck.position.set(0, 18.0, 0);
  hqGroup.add(roofDeck);

  const helipadRing = new THREE.Mesh(
    new THREE.RingGeometry(4.0, 5.2, 32),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  helipadRing.rotateX(-Math.PI / 2);
  helipadRing.position.set(0, 18.25, 0);
  hqGroup.add(helipadRing);

  SKYSCRAPER_LAUNCH_PADS.push({
    x: -34,
    y: baseY,
    z: 11.5,
    targetY: baseY + 18.4,
    name: 'Strike City Helipad Ascender',
  });

  cityGroup.add(hqGroup);

  // Subterranean Subway Station at (27, -3.8, 18) — completely dry!
  const subwayFloor = new THREE.Mesh(new THREE.BoxGeometry(16, 0.25, 16), asphaltMat);
  subwayFloor.position.set(27, -3.7, 18);
  cityGroup.add(subwayFloor);
  staticColliders.push({
    type: 'box',
    minX: 19,
    maxX: 35,
    minY: -4.1,
    maxY: -3.55,
    minZ: 10,
    maxZ: 26,
    name: 'Strike Subway Platform Floor',
  });

  for (let st = 0; st < 8; st++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.48, 1.2), floorMat);
    step.position.set(27, -0.24 - st * 0.46, 11.5 + st * 1.15);
    cityGroup.add(step);
    staticColliders.push({
      type: 'box',
      minX: 24.9,
      maxX: 29.1,
      minY: -st * 0.46 - 0.48,
      maxY: -st * 0.46,
      minZ: 11.5 + st * 1.15 - 0.6,
      maxZ: 11.5 + st * 1.15 + 0.6,
      name: `Subway Stair Step ${st + 1}`,
    });
  }

  addChest(rootGroup, chests, chestMeshes, staticColliders, -34, baseY + 4.7, -4.5, 'rare_chest');
  addChest(rootGroup, chests, chestMeshes, staticColliders, -34, baseY + 18.3, 0, 'rare_chest');
  addChest(rootGroup, chests, chestMeshes, staticColliders, 27, baseY - 3.5, 22, 'chest');

  addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, -5, baseY + 0.15, 18, 0xfacc15, 'Strike City GT', 'sports', 0);
  addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 5, baseY + 0.15, -22, 0xef4444, 'Apex Interceptor', 'sports', Math.PI);

  const bench = createUpgradeBenchMesh();
  bench.position.set(-28, baseY + 0.1, 6);
  rootGroup.add(bench);
  upgradeBenches.push({ id: 'bench_strike_city', x: -28, y: baseY + 0.1, z: 6, mesh: bench });

  rootGroup.add(cityGroup);
}

// ============================================================================
// POI 2: DUSTY DESERT (220, 220, FOUNDATION Y = 4.0)
// ============================================================================
function buildDustyDesert(
  rootGroup: THREE.Group,
  harvestables: HarvestableObject[],
  harvestableMeshes: Map<string, THREE.Object3D>,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  staticColliders: SolidCollider[],
  vehicles: DrivableVehicle[],
  upgradeBenches: UpgradeBenchStation[]
) {
  const baseY = POI_FOUNDATION_PADS.dusty_desert.elevation; // 4.0m
  const desertRoot = new THREE.Group();
  desertRoot.name = 'POI_DustyDesert';
  desertRoot.position.set(220, baseY, 220);

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const rustMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.6, roughness: 0.5 });

  // Enterable 2-Story Western Saloon at local (0, 0, 0) -> world (220, 4.0, 220)
  const saloon = new THREE.Group();
  const floor1 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.25, 14), darkWoodMat);
  floor1.position.y = 0.12;
  saloon.add(floor1);

  const floor2 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.25, 10), darkWoodMat);
  floor2.position.set(0, 4.0, -2);
  saloon.add(floor2);

  // Saloon Walls with open South double-door entrance
  const backW = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 0.4), woodMat);
  backW.position.set(0, 4, -6.8);
  saloon.add(backW);
  const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 14), woodMat);
  leftW.position.set(-7.8, 4, 0);
  saloon.add(leftW);
  const rightW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 14), woodMat);
  rightW.position.set(7.8, 4, 0);
  saloon.add(rightW);
  const frontWL = new THREE.Mesh(new THREE.BoxGeometry(5.5, 8, 0.4), woodMat);
  frontWL.position.set(-5.25, 4, 6.8);
  saloon.add(frontWL);
  const frontWR = new THREE.Mesh(new THREE.BoxGeometry(5.5, 8, 0.4), woodMat);
  frontWR.position.set(5.25, 4, 6.8);
  saloon.add(frontWR);

  // Walkable Interior Stairs to Saloon 2nd Floor
  for (let s = 0; s < 8; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.8), darkWoodMat);
    step.position.set(5.5, 0.25 + s * 0.5, 3.5 - s * 0.8);
    saloon.add(step);
    staticColliders.push({
      type: 'box',
      minX: 220 + 4.4,
      maxX: 220 + 6.6,
      minY: baseY + s * 0.5,
      maxY: baseY + (s + 1) * 0.5 + 0.1,
      minZ: 220 + 3.5 - s * 0.8 - 0.5,
      maxZ: 220 + 3.5 - s * 0.8 + 0.5,
      name: `Saloon Stair Step ${s + 1}`,
    });
  }

  desertRoot.add(saloon);

  addEnterableRoomColliders(staticColliders, 220, baseY, 220, 16, 8, 14, 'south', 'Dusty Saloon', 4.6);
  staticColliders.push({
    type: 'box',
    minX: 220 - 8,
    maxX: 220 + 8,
    minY: baseY + 3.85,
    maxY: baseY + 4.15,
    minZ: 220 - 7,
    maxZ: 220 + 3,
    name: 'Dusty Saloon 2nd Floor',
  });

  // Oil Rig Derrick at local (26, 0, -18) -> world (246, 4.0, 202)
  const derrick = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 5.5, 22, 4), rustMat);
  derrick.position.set(26, 11, -18);
  derrick.castShadow = true;
  desertRoot.add(derrick);

  const rigPlatform = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 14), rustMat);
  rigPlatform.position.set(26, 0.4, -18);
  desertRoot.add(rigPlatform);

  staticColliders.push({
    type: 'box',
    minX: 246 - 7,
    maxX: 246 + 7,
    minY: baseY,
    maxY: baseY + 0.85,
    minZ: 202 - 7,
    maxZ: 202 + 7,
    name: 'Desert Oil Rig Platform',
  });

  // Desert Cacti & Sandstones seated on exact terrain elevation
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const dist = 34 + (i % 3) * 14;
    const cx = 220 + Math.cos(angle) * dist;
    const cz = 220 + Math.sin(angle) * dist;
    const cy = getStrikeIslandElevation(cx, cz);
    createHarvestableTree(rootGroup, harvestables, staticColliders, harvestableMeshes, cx, cy, cz, 'oak', 1.0);
  }

  addChest(rootGroup, chests, chestMeshes, staticColliders, 220, baseY + 4.2, 217, 'rare_chest');
  addChest(rootGroup, chests, chestMeshes, staticColliders, 246, baseY + 0.9, 202, 'chest');

  addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 202, baseY + 0.15, 228, 0xd97706, 'Desert Dune Runner', 'truck', 0.5);

  const bench = createUpgradeBenchMesh();
  bench.position.set(214, baseY + 0.15, 220);
  rootGroup.add(bench);
  upgradeBenches.push({ id: 'bench_desert', x: 214, y: baseY + 0.15, z: 220, mesh: bench });

  rootGroup.add(desertRoot);
}

// ============================================================================
// POI 3: PINEWOOD FOREST (-225, -202, FOUNDATION Y = 6.5)
// ============================================================================
function buildPinewoodForest(
  rootGroup: THREE.Group,
  harvestables: HarvestableObject[],
  harvestableMeshes: Map<string, THREE.Object3D>,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  staticColliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const baseY = POI_FOUNDATION_PADS.pinewood_forest.elevation; // 6.5m
  const forestRoot = new THREE.Group();
  forestRoot.name = 'POI_PinewoodForest';
  forestRoot.position.set(-225, baseY, -202);

  const logMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });

  // Fire Lookout Tower at local (-12, 0, 2) -> world (-237, 6.5, -200)
  const towerFrame = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.8, 16, 4), logMat);
  towerFrame.position.set(-12, 8, 2);
  towerFrame.rotation.y = Math.PI / 4;
  forestRoot.add(towerFrame);

  const lookoutDeck = new THREE.Mesh(new THREE.BoxGeometry(9, 0.4, 9), cabinMat);
  lookoutDeck.position.set(-12, 16, 2);
  forestRoot.add(lookoutDeck);

  staticColliders.push({
    type: 'box',
    minX: -237 - 4.5,
    maxX: -237 + 4.5,
    minY: baseY + 15.8,
    maxY: baseY + 16.3,
    minZ: -200 - 4.5,
    maxZ: -200 + 4.5,
    name: 'Pinewood Lookout Tower Deck',
  });

  SKYSCRAPER_LAUNCH_PADS.push({
    x: -237,
    y: baseY,
    z: -194,
    targetY: baseY + 16.5,
    name: 'Fire Lookout Zipline',
  });

  // Enterable Woodcutter Cabin at local (12, 0, -4) -> world (-213, 6.5, -206)
  const cabinGroup = new THREE.Group();
  cabinGroup.position.set(12, 0, -4);
  const cFloor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 8), logMat);
  cFloor.position.y = 0.1;
  cabinGroup.add(cFloor);
  const cBack = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 0.4), cabinMat);
  cBack.position.set(0, 2.25, -3.8);
  cabinGroup.add(cBack);
  const cLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 8), cabinMat);
  cLeft.position.set(-4.8, 2.25, 0);
  cabinGroup.add(cLeft);
  const cRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 8), cabinMat);
  cRight.position.set(4.8, 2.25, 0);
  cabinGroup.add(cRight);
  const cFrontL = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.5, 0.4), cabinMat);
  cFrontL.position.set(-3.3, 2.25, 3.8);
  cabinGroup.add(cFrontL);
  const cFrontR = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.5, 0.4), cabinMat);
  cFrontR.position.set(3.3, 2.25, 3.8);
  cabinGroup.add(cFrontR);
  const cRoof = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.4, 8.6), logMat);
  cRoof.position.set(0, 4.6, 0);
  cabinGroup.add(cRoof);
  forestRoot.add(cabinGroup);

  addEnterableRoomColliders(staticColliders, -213, baseY, -206, 10, 4.5, 8, 'south', 'Woodcutter Cabin', 3.0);

  // Dense Pine Trees grounded accurately on terrain
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 + (i % 3) * 0.3;
    const dist = 28 + (i % 5) * 14;
    const tx = -225 + Math.cos(angle) * dist;
    const tz = -202 + Math.sin(angle) * dist;
    const ty = getStrikeIslandElevation(tx, tz);
    createHarvestableTree(rootGroup, harvestables, staticColliders, harvestableMeshes, tx, ty, tz, 'pine', 1.25);
  }

  addChest(rootGroup, chests, chestMeshes, staticColliders, -237, baseY + 16.4, -200, 'rare_chest');
  addChest(rootGroup, chests, chestMeshes, staticColliders, -216, baseY + 0.3, -208, 'chest');

  addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, -216, baseY + 0.15, -185, 0x166534, 'Ranger Offroad 4x4', 'truck', 0);

  rootGroup.add(forestRoot);
}

// ============================================================================
// POI 4: MILITARY BASE (240, -220, FOUNDATION Y = 5.0)
// ============================================================================
function buildMilitaryBase(
  rootGroup: THREE.Group,
  harvestables: HarvestableObject[],
  _harvestableMeshes: Map<string, THREE.Object3D>,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  staticColliders: SolidCollider[],
  vehicles: DrivableVehicle[],
  upgradeBenches: UpgradeBenchStation[]
) {
  const baseY = POI_FOUNDATION_PADS.military_base.elevation; // 5.0m
  const baseRoot = new THREE.Group();
  baseRoot.name = 'POI_MilitaryBase';
  baseRoot.position.set(240, baseY, -220);

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75 });
  const oliveMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.65, metalness: 0.3 });

  // Tarmac Pad
  const tarmac = new THREE.Mesh(new THREE.BoxGeometry(116, 0.2, 116), concreteMat);
  tarmac.position.y = 0.05;
  tarmac.receiveShadow = true;
  baseRoot.add(tarmac);

  // Enterable Aircraft Hangar at local (10, 0, -10) -> world (250, 5.0, -230)
  // Built with side walls + roof so players can walk straight through the hangar bay!
  const hangarGroup = new THREE.Group();
  hangarGroup.position.set(10, 0, -10);

  const hLeftW = new THREE.Mesh(new THREE.BoxGeometry(0.6, 11, 34), oliveMat);
  hLeftW.position.set(-11.7, 5.5, 0);
  hLeftW.castShadow = true;
  hangarGroup.add(hLeftW);

  const hRightW = new THREE.Mesh(new THREE.BoxGeometry(0.6, 11, 34), oliveMat);
  hRightW.position.set(11.7, 5.5, 0);
  hRightW.castShadow = true;
  hangarGroup.add(hRightW);

  const hBackW = new THREE.Mesh(new THREE.BoxGeometry(24, 11, 0.6), oliveMat);
  hBackW.position.set(0, 5.5, -16.7);
  hangarGroup.add(hBackW);

  const hRoof = new THREE.Mesh(new THREE.BoxGeometry(24.4, 0.6, 34.4), oliveMat);
  hRoof.position.set(0, 11.2, 0);
  hRoof.castShadow = true;
  hangarGroup.add(hRoof);

  baseRoot.add(hangarGroup);

  // Hangar open-front colliders (South bay wide open for vehicles & players!)
  staticColliders.push(
    { type: 'box', minX: 250 - 12, maxX: 250 - 11.2, minY: baseY, maxY: baseY + 11.5, minZ: -230 - 17, maxZ: -230 + 17, name: 'Military Hangar West Wall' },
    { type: 'box', minX: 250 + 11.2, maxX: 250 + 12, minY: baseY, maxY: baseY + 11.5, minZ: -230 - 17, maxZ: -230 + 17, name: 'Military Hangar East Wall' },
    { type: 'box', minX: 250 - 12, maxX: 250 + 12, minY: baseY, maxY: baseY + 11.5, minZ: -230 - 17, maxZ: -230 - 16.2, name: 'Military Hangar North Wall' },
    { type: 'box', minX: 250 - 12, maxX: 250 + 12, minY: baseY + 10.9, maxY: baseY + 11.6, minZ: -230 - 17, maxZ: -230 + 17, name: 'Military Hangar Roof' }
  );

  // Enterable Command Armory at local (-24, 0, 14) -> world (216, 5.0, -206)
  const armory = new THREE.Group();
  armory.position.set(-24, 0, 14);
  const aBack = new THREE.Mesh(new THREE.BoxGeometry(16, 7, 0.5), concreteMat);
  aBack.position.set(0, 3.5, -6.75);
  armory.add(aBack);
  const aLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 14), concreteMat);
  aLeft.position.set(-7.75, 3.5, 0);
  armory.add(aLeft);
  const aRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 14), concreteMat);
  aRight.position.set(7.75, 3.5, 0);
  armory.add(aRight);
  const aFrontL = new THREE.Mesh(new THREE.BoxGeometry(5.5, 7, 0.5), concreteMat);
  aFrontL.position.set(-5.25, 3.5, 6.75);
  armory.add(aFrontL);
  const aFrontR = new THREE.Mesh(new THREE.BoxGeometry(5.5, 7, 0.5), concreteMat);
  aFrontR.position.set(5.25, 3.5, 6.75);
  armory.add(aFrontR);
  const aRoof = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.5, 14.4), concreteMat);
  aRoof.position.set(0, 7.2, 0);
  armory.add(aRoof);
  baseRoot.add(armory);

  addEnterableRoomColliders(staticColliders, 216, baseY, -206, 16, 7, 14, 'south', 'Military Command Armory', 4.5);

  // Radar Dish Tower at local (-28, 0, -28) -> world (212, 5.0, -248)
  const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.6, 20, 8), concreteMat);
  radarMast.position.set(-28, 10, -28);
  baseRoot.add(radarMast);

  const radarDome = new THREE.Mesh(
    new THREE.SphereGeometry(5.5, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
  );
  radarDome.position.set(-28, 22, -28);
  baseRoot.add(radarDome);

  staticColliders.push({
    type: 'cylinder',
    x: 212,
    z: -248,
    radius: 2.6,
    minY: baseY,
    maxY: baseY + 25,
    name: 'Military Radar Tower',
  });

  addChest(rootGroup, chests, chestMeshes, staticColliders, 244, baseY + 0.3, -242, 'rare_chest');
  addChest(rootGroup, chests, chestMeshes, staticColliders, 212, baseY + 0.3, -210, 'rare_chest');

  addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 235, baseY + 0.2, -192, 0x3f6212, 'Tactical Armored 4x4', 'truck', 0);

  const bench = createUpgradeBenchMesh();
  bench.position.set(222, baseY + 0.2, -206);
  rootGroup.add(bench);
  upgradeBenches.push({ id: 'bench_military', x: 222, y: baseY + 0.2, z: -206, mesh: bench });

  rootGroup.add(baseRoot);
}

// ============================================================================
// POI 5: COASTAL VILLAGE (-240, 180, FOUNDATION Y = 1.5)
// ============================================================================
function buildCoastalVillage(
  rootGroup: THREE.Group,
  _harvestables: HarvestableObject[],
  _harvestableMeshes: Map<string, THREE.Object3D>,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  staticColliders: SolidCollider[]
) {
  const baseY = POI_FOUNDATION_PADS.coastal_village.elevation; // 1.5m
  const villageRoot = new THREE.Group();
  villageRoot.name = 'POI_CoastalVillage';
  villageRoot.position.set(-240, baseY, 180);

  const woodPierMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });

  // Wooden Boardwalk Pier extending West over the Coastal Ocean (world X: -248 to -292, Y: 1.5m)
  const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(44, 0.35, 10), woodPierMat);
  pierDeck.position.set(-30, 0, 0);
  pierDeck.receiveShadow = true;
  villageRoot.add(pierDeck);

  staticColliders.push({
    type: 'box',
    minX: -292,
    maxX: -248,
    minY: baseY - 0.25,
    maxY: baseY + 0.2,
    minZ: 175,
    maxZ: 185,
    name: 'Coastal Boardwalk Pier',
  });

  // Lighthouse on Rocky Promontory at world (-285, 6.0, 130)
  const lhY = getStrikeIslandElevation(-285, 130);
  const lighthouse = new THREE.Group();
  lighthouse.position.set(-45, lhY - baseY, -50);

  const lhTower = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 3.8, 22, 16),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 })
  );
  lhTower.position.y = 11;
  lhTower.castShadow = true;
  lighthouse.add(lhTower);

  const lhBeacon = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 3.2, 16),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  lhBeacon.position.y = 23.5;
  lighthouse.add(lhBeacon);
  villageRoot.add(lighthouse);

  staticColliders.push({
    type: 'cylinder',
    x: -285,
    z: 130,
    radius: 3.8,
    minY: lhY,
    maxY: lhY + 25,
    name: 'Coastal Lighthouse',
  });

  // 3 Enterable Beach Houses seated on the 1.5m Village Terrace
  const houses = [
    { lx: 6, lz: -18, col: 0x38bdf8, name: 'Azure Beach Cottage' },
    { lx: 6, lz: 4, col: 0xf43f5e, name: 'Coral Surf Villa' },
    { lx: 6, lz: 24, col: 0xfacc15, name: 'Sunburst Cabana' },
  ];

  houses.forEach((bh) => {
    const hGroup = new THREE.Group();
    hGroup.position.set(bh.lx, 0, bh.lz);
    const hMat = new THREE.MeshStandardMaterial({ color: bh.col, roughness: 0.65 });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 9), woodPierMat);
    floor.position.y = 0.1;
    hGroup.add(floor);

    const backW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 9), hMat);
    backW.position.set(4.8, 2.5, 0);
    hGroup.add(backW);
    const northW = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 0.4), hMat);
    northW.position.set(0, 2.5, -4.3);
    hGroup.add(northW);
    const southW = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 0.4), hMat);
    southW.position.set(0, 2.5, 4.3);
    hGroup.add(southW);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.4, 9.6), woodPierMat);
    roof.position.set(0, 5.1, 0);
    hGroup.add(roof);

    villageRoot.add(hGroup);
    addEnterableRoomColliders(staticColliders, -240 + bh.lx, baseY, 180 + bh.lz, 10, 5, 9, 'west', bh.name, 3.2);
  });

  addChest(rootGroup, chests, chestMeshes, staticColliders, -285, baseY + 0.3, 180, 'rare_chest');
  addChest(rootGroup, chests, chestMeshes, staticColliders, -234, baseY + 0.3, 184, 'chest');

  rootGroup.add(villageRoot);
}

// ============================================================================
// POI 6: SNOWFALL MOUNTAIN (0, -290, SUMMIT FOUNDATION Y = 38.0)
// ============================================================================
function buildSnowfallMountain(
  rootGroup: THREE.Group,
  _harvestables: HarvestableObject[],
  _harvestableMeshes: Map<string, THREE.Object3D>,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  staticColliders: SolidCollider[]
) {
  const summitY = POI_FOUNDATION_PADS.snowfall_summit.elevation; // 38.0m
  const snowRoot = new THREE.Group();
  snowRoot.name = 'POI_SnowfallMountain';
  snowRoot.position.set(0, summitY, -290);

  const timberMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
  const snowRoofMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });

  // Enterable Summit Ski Chalet at (0, 38.0, -290)
  const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 14), timberMat);
  floor.position.y = 0.15;
  snowRoot.add(floor);

  const backW = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 0.5), timberMat);
  backW.position.set(0, 3.5, -6.75);
  snowRoot.add(backW);
  const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 14), timberMat);
  leftW.position.set(-8.75, 3.5, 0);
  snowRoot.add(leftW);
  const rightW = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 14), timberMat);
  rightW.position.set(8.75, 3.5, 0);
  snowRoot.add(rightW);
  const frontWL = new THREE.Mesh(new THREE.BoxGeometry(6, 7, 0.5), timberMat);
  frontWL.position.set(-6, 3.5, 6.75);
  snowRoot.add(frontWL);
  const frontWR = new THREE.Mesh(new THREE.BoxGeometry(6, 7, 0.5), timberMat);
  frontWR.position.set(6, 3.5, 6.75);
  snowRoot.add(frontWR);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(13.5, 5.5, 4), snowRoofMat);
  roof.position.set(0, 9.5, 0);
  roof.rotation.y = Math.PI / 4;
  snowRoot.add(roof);

  addEnterableRoomColliders(staticColliders, 0, summitY, -290, 18, 7, 14, 'south', 'Snowfall Summit Chalet', 5.0);

  // Ascender from southern mountain base (0, -210) up to Summit (0, -290)
  const baseLaunchY = getStrikeIslandElevation(0, -210);
  SKYSCRAPER_LAUNCH_PADS.push({
    x: 0,
    y: baseLaunchY,
    z: -210,
    targetY: summitY + 2.0,
    name: 'Snowfall Summit Gondola Ascender',
  });

  addChest(rootGroup, chests, chestMeshes, staticColliders, 0, summitY + 0.4, -290, 'rare_chest');
  addChest(rootGroup, chests, chestMeshes, staticColliders, 22, getStrikeIslandElevation(22, -255) + 0.3, -255, 'chest');

  rootGroup.add(snowRoot);
}

// ============================================================================
// POI 7: INDUSTRIAL ZONE (250, 20, FOUNDATION Y = 1.5)
// ============================================================================
function buildIndustrialZone(
  rootGroup: THREE.Group,
  harvestables: HarvestableObject[],
  _harvestableMeshes: Map<string, THREE.Object3D>,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  staticColliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const baseY = POI_FOUNDATION_PADS.industrial_zone.elevation; // 1.5m
  const indRoot = new THREE.Group();
  indRoot.name = 'POI_IndustrialZone';
  indRoot.position.set(250, baseY, 20);

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
  const craneYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.6, roughness: 0.4 });

  // Enterable Power Plant Warehouse at (250, 1.5, 20)
  const wFloor = new THREE.Mesh(new THREE.BoxGeometry(26, 0.25, 20), steelMat);
  wFloor.position.y = 0.12;
  indRoot.add(wFloor);
  const wBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 11, 20), steelMat);
  wBack.position.set(12.75, 5.5, 0);
  indRoot.add(wBack);
  const wNorth = new THREE.Mesh(new THREE.BoxGeometry(26, 11, 0.5), steelMat);
  wNorth.position.set(0, 5.5, -9.75);
  indRoot.add(wNorth);
  const wSouth = new THREE.Mesh(new THREE.BoxGeometry(26, 11, 0.5), steelMat);
  wSouth.position.set(0, 5.5, 9.75);
  indRoot.add(wSouth);
  const wRoof = new THREE.Mesh(new THREE.BoxGeometry(26.5, 0.5, 20.5), steelMat);
  wRoof.position.set(0, 11.2, 0);
  indRoot.add(wRoof);

  addEnterableRoomColliders(staticColliders, 250, baseY, 20, 26, 11, 20, 'west', 'Industrial Power Warehouse', 8.0);

  // Twin Smokestacks
  for (const sz of [-18, -28]) {
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.0, 26, 16), steelMat);
    stack.position.set(14, 13, sz);
    stack.castShadow = true;
    indRoot.add(stack);

    staticColliders.push({
      type: 'cylinder',
      x: 264,
      z: 20 + sz,
      radius: 3.0,
      minY: baseY,
      maxY: baseY + 26,
      name: 'Industrial Smokestack',
    });
  }

  // Shipping Container Yard
  const containerColors = [0xdc2626, 0x2563eb, 0x16a34a, 0xd97706];
  for (let c = 0; c < 6; c++) {
    const cx = -22 + (c % 3) * 10;
    const cz = 22 + Math.floor(c / 3) * 6;
    const cMesh = new THREE.Mesh(
      new THREE.BoxGeometry(7, 3.2, 3.2),
      new THREE.MeshStandardMaterial({ color: containerColors[c % 4], metalness: 0.5, roughness: 0.5 })
    );
    cMesh.position.set(cx, 1.6, cz);
    cMesh.castShadow = true;
    indRoot.add(cMesh);

    staticColliders.push({
      type: 'box',
      minX: 250 + cx - 3.5,
      maxX: 250 + cx + 3.5,
      minY: baseY,
      maxY: baseY + 3.2,
      minZ: 20 + cz - 1.6,
      maxZ: 20 + cz + 1.6,
      name: `Shipping Container ${c + 1}`,
    });
  }

  // Gantry Crane
  const craneMast = new THREE.Mesh(new THREE.BoxGeometry(2.5, 22, 2.5), craneYellowMat);
  craneMast.position.set(-28, 11, -18);
  indRoot.add(craneMast);
  const craneBoom = new THREE.Mesh(new THREE.BoxGeometry(22, 1.8, 2.0), craneYellowMat);
  craneBoom.position.set(-19, 21, -18);
  indRoot.add(craneBoom);

  addChest(rootGroup, chests, chestMeshes, staticColliders, 250, baseY + 0.3, 20, 'rare_chest');
  addChest(rootGroup, chests, chestMeshes, staticColliders, 228, baseY + 3.4, 42, 'chest');

  addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 220, baseY + 0.15, 12, 0xeab308, 'Heavy Loader Rig', 'truck', Math.PI / 2);

  rootGroup.add(indRoot);
}

// ============================================================================
// POI 8: LOST TEMPLE (-200, 20, FOUNDATION Y = 3.0)
// ============================================================================
function buildLostTemple(
  rootGroup: THREE.Group,
  _harvestables: HarvestableObject[],
  _harvestableMeshes: Map<string, THREE.Object3D>,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  staticColliders: SolidCollider[]
) {
  const baseY = POI_FOUNDATION_PADS.lost_temple.elevation; // 3.0m
  const templeRoot = new THREE.Group();
  templeRoot.name = 'POI_LostTemple';
  templeRoot.position.set(-200, baseY, 20);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
  const mossStoneMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.9 });

  // 4-Tier Stepped Pyramid with Climbable Eastern Staircase
  const tiers = [
    { size: 36, h: 3.0, y: 1.5 },
    { size: 28, h: 3.0, y: 4.5 },
    { size: 20, h: 3.0, y: 7.5 },
    { size: 12, h: 3.0, y: 10.5 },
  ];

  tiers.forEach((t, idx) => {
    const tierMesh = new THREE.Mesh(
      new THREE.BoxGeometry(t.size, t.h, t.size),
      idx % 2 === 0 ? stoneMat : mossStoneMat
    );
    tierMesh.position.y = t.y;
    tierMesh.castShadow = true;
    tierMesh.receiveShadow = true;
    templeRoot.add(tierMesh);

    staticColliders.push({
      type: 'box',
      minX: -200 - t.size / 2,
      maxX: -200 + t.size / 2,
      minY: baseY + t.y - t.h / 2,
      maxY: baseY + t.y + t.h / 2,
      minZ: 20 - t.size / 2,
      maxZ: 20 + t.size / 2,
      name: `Lost Temple Pyramid Tier ${idx + 1}`,
    });
  });

  // Walkable ceremonial stairs up the East face from baseY (3.0m) to Altar (15.0m)
  for (let s = 0; s < 16; s++) {
    const stepY = (s + 1) * 0.75;
    const stepX = 20 - s * 0.9;
    const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 5.0), stoneMat);
    stepMesh.position.set(stepX, stepY - 0.375, 0);
    templeRoot.add(stepMesh);

    staticColliders.push({
      type: 'box',
      minX: -200 + stepX - 0.8,
      maxX: -200 + stepX + 0.8,
      minY: baseY + stepY - 0.75,
      maxY: baseY + stepY + 0.05,
      minZ: 20 - 2.5,
      maxZ: 20 + 2.5,
      name: `Temple Ceremony Step ${s + 1}`,
    });
  }

  addChest(rootGroup, chests, chestMeshes, staticColliders, -200, baseY + 12.2, 20, 'rare_chest');
  addChest(rootGroup, chests, chestMeshes, staticColliders, -175, baseY + 0.3, 20, 'chest');

  rootGroup.add(templeRoot);
}

// ============================================================================
// POI 9: RACING CIRCUIT (-40, 250, FOUNDATION Y = 0.5)
// ============================================================================
function buildRacingCircuit(
  rootGroup: THREE.Group,
  harvestables: HarvestableObject[],
  _harvestableMeshes: Map<string, THREE.Object3D>,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  staticColliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const baseY = POI_FOUNDATION_PADS.racing_circuit.elevation; // 0.5m
  const circuitRoot = new THREE.Group();
  circuitRoot.name = 'POI_RacingCircuit';
  circuitRoot.position.set(-40, baseY, 250);

  const trackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
  const redCurbMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
  const pitMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });

  // Track Ring
  const trackRing = new THREE.Mesh(new THREE.RingGeometry(36, 52, 48), trackMat);
  trackRing.rotateX(-Math.PI / 2);
  trackRing.position.y = 0.08;
  trackRing.receiveShadow = true;
  circuitRoot.add(trackRing);

  const innerCurb = new THREE.Mesh(new THREE.RingGeometry(34.5, 36, 48), redCurbMat);
  innerCurb.rotateX(-Math.PI / 2);
  innerCurb.position.y = 0.1;
  circuitRoot.add(innerCurb);

  // Enterable Pit Lane Garage at local (0, 0, -20) -> world (-40, 0.5, 230)
  const pitFloor = new THREE.Mesh(new THREE.BoxGeometry(24, 0.2, 10), pitMat);
  pitFloor.position.set(0, 0.1, -20);
  circuitRoot.add(pitFloor);
  const pitBack = new THREE.Mesh(new THREE.BoxGeometry(24, 5.5, 0.4), pitMat);
  pitBack.position.set(0, 2.75, -24.8);
  circuitRoot.add(pitBack);
  const pitLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.5, 10), pitMat);
  pitLeft.position.set(-11.8, 2.75, -20);
  circuitRoot.add(pitLeft);
  const pitRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.5, 10), pitMat);
  pitRight.position.set(11.8, 2.75, -20);
  circuitRoot.add(pitRight);
  const pitRoof = new THREE.Mesh(new THREE.BoxGeometry(24.4, 0.4, 10.4), redCurbMat);
  pitRoof.position.set(0, 5.6, -20);
  circuitRoot.add(pitRoof);

  addEnterableRoomColliders(staticColliders, -40, baseY, 230, 24, 5.5, 10, 'south', 'Racing Pit Garage', 14.0);

  addChest(rootGroup, chests, chestMeshes, staticColliders, -40, baseY + 0.3, 230, 'rare_chest');

  addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, -40, baseY + 0.15, 206, 0xef4444, 'Apex Formula GT #1', 'sports', Math.PI / 2);
  addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, -26, baseY + 0.15, 206, 0x38bdf8, 'Nitro Horizon GT #7', 'sports', Math.PI / 2);

  rootGroup.add(circuitRoot);
}

// ============================================================================
// POI 10: UNDERGROUND BUNKER (-20, 90, SURFACE Y = 12.0, CHAMBER Y = 7.2)
// ============================================================================
function buildUndergroundBunker(
  rootGroup: THREE.Group,
  _harvestables: HarvestableObject[],
  _harvestableMeshes: Map<string, THREE.Object3D>,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  staticColliders: SolidCollider[]
) {
  const surfaceY = POI_FOUNDATION_PADS.underground_bunker.elevation; // 12.0m
  const chamberY = 7.2; // 4.8m below the 12.0m hilltop pad (well above any water!)

  const bunkerRoot = new THREE.Group();
  bunkerRoot.name = 'POI_UndergroundBunker';
  bunkerRoot.position.set(-20, 0, 90);

  const blastSteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
  const hazardMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });

  // Subterranean Command Vault Chamber (world X: -32..-8, Z: 84..116, floor Y = 7.2m, ceiling Y = 12.0m)
  const vaultFloor = new THREE.Mesh(new THREE.BoxGeometry(24, 0.3, 30), blastSteelMat);
  vaultFloor.position.set(0, chamberY, 10);
  bunkerRoot.add(vaultFloor);

  staticColliders.push({
    type: 'box',
    minX: -32,
    maxX: -8,
    minY: chamberY - 0.3,
    maxY: chamberY + 0.15,
    minZ: 85,
    maxZ: 115,
    name: 'Underground Bunker Vault Floor',
  });

  // Walkable Access Ramp & Stairs descending from Surface (Z=82, Y=12.0m) into Vault (Z=92, Y=7.2m)
  for (let s = 0; s < 10; s++) {
    const stepY = surfaceY - (s + 1) * 0.48;
    const stepZ = -8 + s * 1.2;
    const step = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.48, 1.3), hazardMat);
    step.position.set(0, stepY, stepZ);
    bunkerRoot.add(step);

    staticColliders.push({
      type: 'box',
      minX: -22.5,
      maxX: -17.5,
      minY: stepY - 0.25,
      maxY: stepY + 0.25,
      minZ: 90 + stepZ - 0.65,
      maxZ: 90 + stepZ + 0.65,
      name: `Bunker Access Step ${s + 1}`,
    });
  }

  // Surface Bunker Blast Frame (Open North Portal so players walk down the stairs unobstructed!)
  const portalLeft = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4.5, 10), blastSteelMat);
  portalLeft.position.set(-4.2, surfaceY + 2.25, -4);
  bunkerRoot.add(portalLeft);

  const portalRight = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4.5, 10), blastSteelMat);
  portalRight.position.set(4.2, surfaceY + 2.25, -4);
  bunkerRoot.add(portalRight);

  const portalRoof = new THREE.Mesh(new THREE.BoxGeometry(11, 1.0, 10), blastSteelMat);
  portalRoof.position.set(0, surfaceY + 4.8, -4);
  bunkerRoot.add(portalRoof);

  staticColliders.push(
    { type: 'box', minX: -25.5, maxX: -23.0, minY: surfaceY, maxY: surfaceY + 4.8, minZ: 81, maxZ: 91, name: 'Bunker Portal Left Wall' },
    { type: 'box', minX: -17.0, maxX: -14.5, minY: surfaceY, maxY: surfaceY + 4.8, minZ: 81, maxZ: 91, name: 'Bunker Portal Right Wall' },
    { type: 'box', minX: -25.5, maxX: -14.5, minY: surfaceY + 4.3, maxY: surfaceY + 5.3, minZ: 81, maxZ: 91, name: 'Bunker Portal Roof' }
  );

  addChest(rootGroup, chests, chestMeshes, staticColliders, -20, chamberY + 0.3, 104, 'rare_chest');
  addChest(rootGroup, chests, chestMeshes, staticColliders, -25, chamberY + 0.3, 108, 'rare_chest');

  rootGroup.add(bunkerRoot);
}

// ============================================================================
// WILDERNESS NATURE & LOOT POPULATION (GROUNDED & ROAD/WATER-SAFE)
// ============================================================================
function populateWildernessNature(
  rootGroup: THREE.Group,
  harvestables: HarvestableObject[],
  harvestableMeshes: Map<string, THREE.Object3D>,
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  staticColliders: SolidCollider[]
) {
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 95; i++) {
    const x = (rand() - 0.5) * 740;
    const z = (rand() - 0.5) * 740;

    // Skip inside POI inner pads, roads, or water
    let insidePad = false;
    for (const key of Object.keys(POI_FOUNDATION_PADS)) {
      const pad = POI_FOUNDATION_PADS[key];
      if (Math.hypot(x - pad.cx, z - pad.cz) < pad.innerR + 8) {
        insidePad = true;
        break;
      }
    }
    if (insidePad) continue;

    const water = getStrikeIslandWaterInfo(x, z);
    if (water.isInWater) continue;

    const road = getStrikeIslandRoadInfo(x, z);
    if (road.isNearRoad) continue;

    const y = getStrikeIslandElevation(x, z);
    const style = i % 3 === 0 ? 'birch' : i % 2 === 0 ? 'oak' : 'pine';
    const scale = 0.85 + rand() * 0.5;
    createHarvestableTree(rootGroup, harvestables, staticColliders, harvestableMeshes, x, y, z, style, scale);
  }

  // Wilderness Tactical Camps with Chests at exact terrain elevation
  const campSpots = [
    { x: -135, z: -120 },
    { x: 145, z: -95 },
    { x: -125, z: 145 },
    { x: 115, z: 195 },
  ];

  for (const spot of campSpots) {
    const cy = getStrikeIslandElevation(spot.x, spot.z);
    addChest(rootGroup, chests, chestMeshes, staticColliders, spot.x, cy + 0.15, spot.z, 'chest');
  }
}
