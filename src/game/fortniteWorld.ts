import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider, DrivableVehicle } from '../types';

export interface WorldGenResult {
  scene: THREE.Scene;
  harvestables: HarvestableObject[];
  chests: LootChest[];
  chestMeshes: Map<string, THREE.Group>;
  waterPlane: THREE.Mesh | null;
  staticColliders: SolidCollider[];
  vehicles: DrivableVehicle[];
}

export interface SkyscraperLaunchPad {
  x: number;
  z: number;
  y: number;
  targetY: number;
  name: string;
}

export const SKYSCRAPER_LAUNCH_PADS: SkyscraperLaunchPad[] = [];

export function isPointInLake(x: number, z: number): boolean {
  // 1. Loot Lake / Central Lotus Pond (at -60, -70)
  const distLoot = Math.hypot(x - -60, z - -70);
  if (distLoot < 26 && distLoot > 8.5) return true;

  // 2. Pleasant Park Community Duck Pond (at -185, -140)
  if (Math.hypot(x - -185, z - -140) < 16) return true;

  // 3. Salty Springs Oasis Pond (at 75, 155)
  if (Math.hypot(x - 75, z - 155) < 14) return true;

  // 4. Southern Alpine Tarn / Mountain Lake (at 85, -170)
  if (Math.hypot(x - 85, z - -170) < 17) return true;

  // 5. Volcanic Geothermal Pools (at 130, 190)
  if (Math.hypot(x - 130, z - 190) < 13) return true;

  // 6. NEW: Sapphire Lake & Marina in North-East Open Meadow (at 160, -160)
  const distSapphire = Math.hypot(x - 160, z - -160);
  if (distSapphire < 24 && distSapphire > 6.5) return true;

  // 7. NEW: Emerald Meadow Sanctuary Lake in South-West Open Plot (at -160, 150)
  if (Math.hypot(x - -160, z - 150) < 20) return true;

  // 8. NEW: Whispering Pines Lake in North-West Open Plot (at -170, -50)
  if (Math.hypot(x - -170, z - -50) < 18) return true;

  // 9. NEW: Crystal Springs Lagoon in South-East Open Plains (at 180, 30)
  if (Math.hypot(x - 180, z - 30) < 17) return true;

  return false;
}

export function isPointInsideStructureOrNoSpawnZone(x: number, z: number): boolean {
  // Clear all roads and road shoulders by at least 5.5 meters so roads are completely open
  if (isPointNearRoad(x, z, 5.5)) return true;
  // Mega-City (Tilted Towers) urban core & building plots
  if (Math.abs(x) < 78 && Math.abs(z) < 78) return true;
  // Pleasant Park residential perimeter and soccer field
  if (Math.hypot(x - -140, z - -140) < 65) return true;
  // Retail Row stores & suburban homes
  if (Math.hypot(x - 150, z - 120) < 58) return true;
  // Salty Springs homes & gas station
  if (Math.hypot(x - 40, z - 120) < 54) return true;
  // Dusty Depot warehouses
  if (Math.hypot(x - 130, z - -40) < 54) return true;
  // Snobby Shores mansions
  if (x >= -245 && x <= -185 && z >= -45 && z <= 85) return true;
  // Loot Lake and other scenic water basins
  if (isPointInLake(x, z)) return true;
  return false;
}

export function isPointNearRoad(x: number, z: number, extraBuffer: number = 4.5): boolean {
  // 1. Central 4-Lane Interstates (Clear of all obstacles)
  if (Math.abs(x) < 7.5 + extraBuffer || Math.abs(z) < 7.5 + extraBuffer) return true;

  // 2. Regional N-S Highways (Hwy 101 West at X=-95 & Hwy 202 East at X=+95)
  if (Math.abs(x - -95) < 5.5 + extraBuffer || Math.abs(x - 95) < 5.5 + extraBuffer) return true;

  // 3. Regional E-W Interstates (I-80 North at Z=+75 & I-40 South at Z=-85)
  if (Math.abs(z - 75) < 5.5 + extraBuffer || Math.abs(z - -85) < 5.5 + extraBuffer) return true;

  // 4. Coastal & Ridge Scenic Parkways
  if (Math.abs(x - -235) < 5.0 + extraBuffer) return true;
  if (Math.abs(x - 225) < 5.0 + extraBuffer) return true;

  // 5. North Scenic Parkway (Z = -160, running full width from X = -245 to +245)
  if (Math.abs(z - -160) < 4.5 + extraBuffer && x >= -250 && x <= 250) return true;

  // 6. South Scenic Parkway (Z = +160, running full width from X = -245 to +245)
  if (Math.abs(z - 160) < 4.5 + extraBuffer && x >= -250 && x <= 250) return true;

  // 7. Regional Connectors
  if (Math.abs(x - 160) < 4.2 + extraBuffer && z >= -170 && z <= -75) return true;
  if (Math.abs(x - -160) < 4.2 + extraBuffer && z >= 65 && z <= 170) return true;
  if (Math.abs(x - -90) < 4.0 + extraBuffer && z >= -170 && z <= -75) return true;

  // 8. Tilted Mega-City Grid Streets
  if (Math.abs(x) < 75 + extraBuffer && Math.abs(z) < 75 + extraBuffer) {
    if (
      Math.abs(x - -65) < 4.5 + extraBuffer ||
      Math.abs(x - -35) < 4.5 + extraBuffer ||
      Math.abs(x - 35) < 4.5 + extraBuffer ||
      Math.abs(x - 65) < 4.5 + extraBuffer
    ) return true;
    if (
      Math.abs(z - -65) < 4.5 + extraBuffer ||
      Math.abs(z - -35) < 4.5 + extraBuffer ||
      Math.abs(z - 35) < 4.5 + extraBuffer ||
      Math.abs(z - 65) < 4.5 + extraBuffer
    ) return true;
  }

  // 9. Pleasant Park Suburban Neighborhood Loop & Highway 101 Connector
  if (Math.abs(z - -140) < 4.2 + extraBuffer && x >= -180 && x <= -90) return true;
  if (Math.abs(x - -140) < 25 + extraBuffer && Math.abs(z - -140) < 22 + extraBuffer && (Math.abs(x - -140) > 15 || Math.abs(z - -140) > 11)) return true;

  // 10. Dusty Depot Access Road
  if (Math.abs(z - -40) < 4.2 + extraBuffer && x >= 90 && x <= 140) return true;

  // 11. Retail Row Boulevard & Commercial Loop
  if (Math.abs(z - 120) < 4.5 + extraBuffer && x >= 90 && x <= 170) return true;

  // 12. Salty Springs Avenue
  if (Math.abs(x - 40) < 4.2 + extraBuffer && z >= 70 && z <= 130) return true;

  // 13. Snobby Shores Estate Private Driveway Connectors
  if (x >= -240 && x <= -190 && (Math.abs(z - -15) < 3.0 + extraBuffer || Math.abs(z - 20) < 3.0 + extraBuffer || Math.abs(z - 55) < 3.0 + extraBuffer)) return true;

  return false;
}

export function isPointOnRoad(x: number, z: number): boolean {
  // 1. Central 4-Lane Interstates (Clear of all buildings)
  if (Math.abs(x) < 7.5 || Math.abs(z) < 7.5) return true;

  // 2. Regional N-S Highways (Hwy 101 West at X=-95 & Hwy 202 East at X=+95)
  // Perfectly positioned to bypass Pleasant Park (-140) and Retail/Dusty (+130/+150)
  if (Math.abs(x - -95) < 5.5 || Math.abs(x - 95) < 5.5) return true;

  // 3. Regional E-W Interstates (I-80 North at Z=+75 & I-40 South at Z=-85)
  if (Math.abs(z - 75) < 5.5 || Math.abs(z - -85) < 5.5) return true;

  // 4. Coastal & Ridge Scenic Parkways
  // Snobby Coast Parkway (X = -235, completely clear of Snobby mansions at X=-200)
  if (Math.abs(x - -235) < 5.0) return true;
  // East Ridge Overlook Parkway (X = +225)
  if (Math.abs(x - 225) < 5.0) return true;

  // 5. NEW: North Scenic Parkway (Z = -160, running full width from X = -240 to +240)
  if (Math.abs(z - -160) < 4.5 && x >= -245 && x <= 245) return true;

  // 6. NEW: South Scenic Parkway (Z = +160, running full width from X = -240 to +240)
  if (Math.abs(z - 160) < 4.5 && x >= -245 && x <= 245) return true;

  // 7. NEW: Lakeview Connector Drive (X = 160, from Z = -85 to Z = -160)
  if (Math.abs(x - 160) < 4.2 && z >= -165 && z <= -80) return true;

  // 8. NEW: Emerald Park Way (X = -160, from Z = 75 to Z = 160)
  if (Math.abs(x - -160) < 4.2 && z >= 70 && z <= 165) return true;

  // 9. NEW: Park Avenue West (X = -90, from Z = -85 to Z = -160)
  if (Math.abs(x - -90) < 4.0 && z >= -165 && z <= -80) return true;

  // 10. Tilted Mega-City Grid Streets (at X = -65, -35, +35, +65 and Z = -65, -35, +35, +65)
  if (Math.abs(x) < 75 && Math.abs(z) < 75) {
    if (Math.abs(x - -65) < 4.5 || Math.abs(x - -35) < 4.5 || Math.abs(x - 35) < 4.5 || Math.abs(x - 65) < 4.5) return true;
    if (Math.abs(z - -65) < 4.5 || Math.abs(z - -35) < 4.5 || Math.abs(z - 35) < 4.5 || Math.abs(z - 65) < 4.5) return true;
  }

  // 11. Pleasant Park Suburban Neighborhood Loop & Highway 101 Connector
  if (Math.abs(z - -140) < 4.2 && x >= -175 && x <= -95) return true;
  if (Math.abs(x - -140) < 25 && Math.abs(z - -140) < 22 && (Math.abs(x - -140) > 17 || Math.abs(z - -140) > 13)) return true;

  // 12. Dusty Depot Access Road
  if (Math.abs(z - -40) < 4.2 && x >= 95 && x <= 135) return true;

  // 13. Retail Row Boulevard & Commercial Loop
  if (Math.abs(z - 120) < 4.5 && x >= 95 && x <= 165) return true;

  // 14. Salty Springs Avenue
  if (Math.abs(x - 40) < 4.2 && z >= 75 && z <= 125) return true;

  // 15. Snobby Shores Estate Private Driveway Connectors
  if (x >= -235 && x <= -196 && (Math.abs(z - -15) < 3.0 || Math.abs(z - 20) < 3.0 || Math.abs(z - 55) < 3.0)) return true;

  return false;
}

export function getTerrainHeight(x: number, z: number): number {
  const distFromCenter = Math.hypot(x, z);
  if (distFromCenter >= 270) {
    return 0.8; // Elevated solid dry green perimeter, 100% land
  }

  // Check if position is within any road corridor or shoulder -> perfectly flat, glitch-free driving surface
  if (isPointNearRoad(x, z, 1.2)) {
    return 0.06;
  }

  // 1. Scenic Lake Basin 1: Loot Lake / Central Lotus Pond (at -60, -70)
  const distLoot = Math.hypot(x - -60, z - -70);
  if (distLoot < 28) {
    if (distLoot < 9) {
      return 0.35; // Central Island for Loot Lake Manor
    }
    const factor = Math.sin(((distLoot - 9) / 19) * Math.PI);
    return -0.42 * factor;
  }

  // Scenic Lake Basin 2: Pleasant Park Duck Pond (at -185, -140)
  const distPleasantPond = Math.hypot(x - -185, z - -140);
  if (distPleasantPond < 17) {
    const factor = Math.cos((distPleasantPond / 17) * (Math.PI / 2));
    return -0.38 * factor;
  }

  // Scenic Lake Basin 3: Salty Springs Oasis (at 75, 155)
  const distSaltyOasis = Math.hypot(x - 75, z - 155);
  if (distSaltyOasis < 15) {
    const factor = Math.cos((distSaltyOasis / 15) * (Math.PI / 2));
    return -0.32 * factor;
  }

  // Scenic Lake Basin 4: Southern Alpine Tarn (at 85, -170)
  const distAlpineLake = Math.hypot(x - 85, z - -170);
  if (distAlpineLake < 18) {
    const factor = Math.cos((distAlpineLake / 18) * (Math.PI / 2));
    return -0.36 * factor;
  }

  // Scenic Lake Basin 5: Volcanic Geothermal Pools (at 130, 190)
  const distHotSprings = Math.hypot(x - 130, z - 190);
  if (distHotSprings < 14) {
    const factor = Math.cos((distHotSprings / 14) * (Math.PI / 2));
    return -0.28 * factor;
  }

  // Scenic Lake Basin 6: Sapphire Lake & Marina (at 160, -160)
  const distSapphire = Math.hypot(x - 160, z - -160);
  if (distSapphire < 25) {
    if (distSapphire < 7.0) {
      return 0.35; // Center Islet with High-Tier Loot Chest
    }
    const factor = Math.sin(((distSapphire - 7.0) / 18) * Math.PI);
    return -0.42 * factor;
  }

  // Scenic Lake Basin 7: Emerald Meadow Sanctuary Lake (at -160, 150)
  const distEmerald = Math.hypot(x - -160, z - 150);
  if (distEmerald < 21) {
    const factor = Math.cos((distEmerald / 21) * (Math.PI / 2));
    return -0.38 * factor;
  }

  // Scenic Lake Basin 8: Whispering Pines Lake (at -170, -50)
  const distWhisper = Math.hypot(x - -170, z - -50);
  if (distWhisper < 19) {
    const factor = Math.cos((distWhisper / 19) * (Math.PI / 2));
    return -0.36 * factor;
  }

  // Scenic Lake Basin 9: Crystal Springs Lagoon (at 180, 30)
  const distCrystal = Math.hypot(x - 180, z - 30);
  if (distCrystal < 18) {
    const factor = Math.cos((distCrystal / 18) * (Math.PI / 2));
    return -0.35 * factor;
  }

  // Base rolling hills outside of road corridors & lake basins
  let h = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 2.8 + Math.sin(x * 0.008 + z * 0.008) * 3.5 + 1.4;

  // Mountain Peak 1: Mount Kay at (-90, 80)
  const distMtn1 = Math.hypot(x - -90, z - 80);
  if (distMtn1 < 55) {
    h += Math.max(0, (55 - distMtn1) * 0.38);
  }

  // Mountain Peak 2: Lookout Ridge at (100, -120)
  const distMtn2 = Math.hypot(x - 100, z - -120);
  if (distMtn2 < 50) {
    h += Math.max(0, (50 - distMtn2) * 0.32);
  }

  // POI & Community Park Flat Plateaus (for clean, smooth walking & zero glitching)
  if (Math.hypot(x - 40, z - 120) < 38) h = 0.08; // Salty Springs
  if (Math.hypot(x + 140, z + 140) < 42) h = 0.06; // Pleasant Park
  if (Math.hypot(x - 150, z - 120) < 42) h = 0.06; // Retail Row
  if (Math.hypot(x - 130, z + 40) < 42) h = 0.06; // Dusty Depot
  if (Math.hypot(x - -90, z - -150) < 28) h = 0.06; // Pleasant Meadows Central Park
  if (Math.hypot(x - 40, z - -150) < 28) h = 0.06; // Victory Botanical Gardens
  if (Math.hypot(x - -120, z - 130) < 28) h = 0.06; // Sunset Valley Community Park

  return Math.max(0.06, h);
}

export function getGroundSurface(
  x: number,
  z: number,
  _y: number
): 'grass' | 'wood' | 'stone' | 'metal' {
  if (isPointOnRoad(x, z)) return 'stone'; // All asphalt highways & city grid
  return 'grass';
}

export function buildFortniteIsland(scene: THREE.Scene): {
  harvestables: HarvestableObject[];
  harvestableMeshes: Map<string, THREE.Object3D>;
  chests: LootChest[];
  chestMeshes: Map<string, THREE.Group>;
  waterPlane: THREE.Mesh | null;
  staticColliders: SolidCollider[];
  vehicles: DrivableVehicle[];
  upgradeBenches: UpgradeBenchStation[];
} {
  const harvestables: HarvestableObject[] = [];
  const harvestableMeshes = new Map<string, THREE.Object3D>();
  const chests: LootChest[] = [];
  const chestMeshes = new Map<string, THREE.Group>();
  const staticColliders: SolidCollider[] = [];
  const vehicles: DrivableVehicle[] = [];
  const upgradeBenches: UpgradeBenchStation[] = [];
  SKYSCRAPER_LAUNCH_PADS.length = 0;

  // 1. Terrain Mesh with Accurate Heights (Smooth rolling landscape with lake depressions & flat roadbeds)
  const terrainGeo = new THREE.PlaneGeometry(600, 600, 108, 108);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const h = Number(getTerrainHeight(vx, vz));
    posAttr.setY(i, h);
  }
  terrainGeo.computeVertexNormals();

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x4aa135,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, grassMat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);

  const waterPlane = null;

  // 2. Scenic Little Lakes (Loot Lake, Pleasant Duck Pond, Salty Oasis, Alpine Tarn, Geothermal Springs)
  createScenicLittleLakes(scene, harvestables, staticColliders, chests, chestMeshes);

  // 3. Dense Road & Highway Network (Interstates, Highways, POI Connectors - completely moved out of houses)
  createCityRoadNetwork(scene, harvestables, staticColliders, vehicles);

  // 4. Build Detailed City (Tilted Towers Mega-City) & POIs
  buildMegaCity(scene, harvestables, chests, chestMeshes, staticColliders, vehicles);
  buildPleasantPark(scene, harvestables, chests, chestMeshes, staticColliders, vehicles);
  buildDustyDepot(scene, harvestables, chests, chestMeshes, staticColliders, vehicles);
  buildSaltySprings(scene, harvestables, chests, chestMeshes, staticColliders, vehicles);
  buildLootLake(scene, harvestables, chests, chestMeshes, staticColliders, vehicles);
  buildRetailRow(scene, harvestables, chests, chestMeshes, staticColliders, vehicles);
  buildSnobbyShores(scene, harvestables, chests, chestMeshes, staticColliders, vehicles);

  // 5. Deploy Weapon Upgrade Benches at Key POIs (Completely Clear of All Roads and Driving Lanes)
  const benchPositions = [
    { id: 'bench_tilted', x: 22, z: -22, name: 'Tilted Towers Armory Bench' },
    { id: 'bench_pleasant', x: -175, z: -175, name: 'Pleasant Park Garage Bench' },
    { id: 'bench_retail', x: 140, z: 145, name: 'Retail Row Workshop Bench' },
    { id: 'bench_salty', x: 26, z: 105, name: 'Salty Springs Garage Bench' },
    { id: 'bench_dusty', x: 120, z: -25, name: 'Dusty Depot Hangar Bench' },
  ];

  benchPositions.forEach((bp) => {
    // HARD SAFETY GUARANTEE: Never allow any table or bench within road boundaries or road shoulders!
    let posX = bp.x;
    let posZ = bp.z;
    while (isPointNearRoad(posX, posZ, 6.0)) {
      posX += posX >= 0 ? 3.5 : -3.5;
      posZ += posZ >= 0 ? 3.5 : -3.5;
    }

    const y = Number(getTerrainHeight(posX, posZ));
    const bMesh = createUpgradeBenchMesh();
    bMesh.position.set(posX, y, posZ);
    scene.add(bMesh);

    upgradeBenches.push({
      id: bp.id,
      x: posX,
      y,
      z: posZ,
      mesh: bMesh,
    });

    staticColliders.push({
      type: 'box',
      minX: posX - 1.5,
      maxX: posX + 1.5,
      minY: y,
      maxY: y + 2.5,
      minZ: posZ - 1.0,
      maxZ: posZ + 1.0,
      name: bp.name,
    });
  });

  // 6. Geological Landmarks & Geological Features Outside City
  buildGrandCanyonAndBridge(scene, staticColliders, chests, chestMeshes);
  buildVolcanoAndHotSprings(scene, staticColliders, chests, chestMeshes);
  buildWaterfallAndDam(scene, staticColliders);

  // 7. Populate Subtle Natural Grass (Significantly reduced grass for clean highway look & zero lag)
  populateLushGrass(scene);

  // 8. Populate Trees and Boulders (Clear of all roads and lakes)
  populateNature(scene, harvestables, staticColliders, harvestableMeshes);

  // 9. Mountain Formations
  buildMountainPeaks(scene, staticColliders);

  return { harvestables, harvestableMeshes, chests, chestMeshes, waterPlane, staticColliders, vehicles, upgradeBenches };
}

// -------------------------------------------------------------
// DENSE ROAD & HIGHWAY NETWORK (EXPANDED ACROSS FULL ISLAND)
// -------------------------------------------------------------
function createCityRoadNetwork(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x24272e,
    roughness: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const highwayMat = new THREE.MeshStandardMaterial({
    color: 0x1e2229,
    roughness: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.85,
  });
  const yellowLineMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    depthWrite: false,
  });
  const whiteLineMat = new THREE.MeshBasicMaterial({
    color: 0xf8fafc,
    depthWrite: false,
  });
  const metalPoleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
  const lampLightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

  // 1. Central 4-Lane North-South Interstate (X = 0, Length: 560m, Width: 14m)
  const interstateNS = new THREE.Mesh(new THREE.PlaneGeometry(14, 560), roadMat);
  interstateNS.rotateX(-Math.PI / 2);
  interstateNS.position.set(0, 0.08, 0);
  interstateNS.receiveShadow = true;
  scene.add(interstateNS);

  // 2. Central 4-Lane East-West Interstate (Z = 0, Length: 560m, Width: 14m)
  const interstateEW = new THREE.Mesh(new THREE.PlaneGeometry(560, 14), roadMat);
  interstateEW.rotateX(-Math.PI / 2);
  interstateEW.position.set(0, 0.08, 0);
  interstateEW.receiveShadow = true;
  scene.add(interstateEW);

  // 3. Regional Long Highways (560m Length, Positioned Clear of All Houses & POIs)
  // Highway 101 West (X = -95, cleanly between Pleasant Park at -140 and Tilted at -65)
  const hwy101 = new THREE.Mesh(new THREE.PlaneGeometry(10, 560), highwayMat);
  hwy101.rotateX(-Math.PI / 2);
  hwy101.position.set(-95, 0.08, 0);
  hwy101.receiveShadow = true;
  scene.add(hwy101);

  // Highway 202 East (X = +95, cleanly between Dusty Depot/Retail Row and Tilted)
  const hwy202 = new THREE.Mesh(new THREE.PlaneGeometry(10, 560), highwayMat);
  hwy202.rotateX(-Math.PI / 2);
  hwy202.position.set(95, 0.08, 0);
  hwy202.receiveShadow = true;
  scene.add(hwy202);

  // Interstate 80 North (Z = +75, cleanly bypassing Salty Springs & Retail Row)
  const i80 = new THREE.Mesh(new THREE.PlaneGeometry(560, 10), highwayMat);
  i80.rotateX(-Math.PI / 2);
  i80.position.set(0, 0.08, 75);
  i80.receiveShadow = true;
  scene.add(i80);

  // Interstate 40 South (Z = -85, cleanly bypassing Pleasant Park)
  const i40 = new THREE.Mesh(new THREE.PlaneGeometry(560, 10), highwayMat);
  i40.rotateX(-Math.PI / 2);
  i40.position.set(0, 0.08, -85);
  i40.receiveShadow = true;
  scene.add(i40);

  // 4. Coastal & Ridge Scenic Parkways
  // Snobby Coast Parkway (X = -235, along the ocean cliffs, clear of Snobby mansions at X=-200)
  const coastPkwy = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 460), highwayMat);
  coastPkwy.rotateX(-Math.PI / 2);
  coastPkwy.position.set(-235, 0.08, 0);
  coastPkwy.receiveShadow = true;
  scene.add(coastPkwy);

  // East Ridge Overlook Parkway (X = +225, Length: 460m)
  const ridgePkwy = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 460), highwayMat);
  ridgePkwy.rotateX(-Math.PI / 2);
  ridgePkwy.position.set(225, 0.08, 0);
  ridgePkwy.receiveShadow = true;
  scene.add(ridgePkwy);

  // 5. POI Connecting Boulevards (Connecting highways smoothly into towns without cutting houses)
  // Pleasant Park Avenue (Z = -140, from Hwy 101 at X=-95 to Pleasant Park at X=-115)
  const pleasantAve = new THREE.Mesh(new THREE.PlaneGeometry(80, 8), roadMat);
  pleasantAve.rotateX(-Math.PI / 2);
  pleasantAve.position.set(-135, 0.08, -140);
  scene.add(pleasantAve);

  // Pleasant Park Neighborhood Suburban Ring Road (Loops around soccer field, passing in front of driveways)
  const pleasantRingN = new THREE.Mesh(new THREE.PlaneGeometry(54, 6), roadMat);
  pleasantRingN.rotateX(-Math.PI / 2);
  pleasantRingN.position.set(-140, 0.08, -140 - 20);
  scene.add(pleasantRingN);

  const pleasantRingS = new THREE.Mesh(new THREE.PlaneGeometry(54, 6), roadMat);
  pleasantRingS.rotateX(-Math.PI / 2);
  pleasantRingS.position.set(-140, 0.08, -140 + 20);
  scene.add(pleasantRingS);

  const pleasantRingW = new THREE.Mesh(new THREE.PlaneGeometry(6, 46), roadMat);
  pleasantRingW.rotateX(-Math.PI / 2);
  pleasantRingW.position.set(-140 - 24, 0.08, -140);
  scene.add(pleasantRingW);

  const pleasantRingE = new THREE.Mesh(new THREE.PlaneGeometry(6, 46), roadMat);
  pleasantRingE.rotateX(-Math.PI / 2);
  pleasantRingE.position.set(-140 + 24, 0.08, -140);
  scene.add(pleasantRingE);

  // Dusty Depot Access Road (from Hwy 202 at X=95 to Dusty Forecourt at X=135, Z=-40)
  const dustyRoad = new THREE.Mesh(new THREE.PlaneGeometry(42, 8), roadMat);
  dustyRoad.rotateX(-Math.PI / 2);
  dustyRoad.position.set(115, 0.08, -40);
  scene.add(dustyRoad);

  // Retail Row Commercial Boulevard (from Hwy 202 at X=95 to Retail Parking at X=165, Z=120)
  const retailBlvd = new THREE.Mesh(new THREE.PlaneGeometry(72, 8.5), roadMat);
  retailBlvd.rotateX(-Math.PI / 2);
  retailBlvd.position.set(130, 0.08, 120);
  scene.add(retailBlvd);

  // Salty Springs Avenue (from I-80 at Z=75 into Salty Gas Station at Z=120, X=40)
  const saltyAve = new THREE.Mesh(new THREE.PlaneGeometry(8, 50), roadMat);
  saltyAve.rotateX(-Math.PI / 2);
  saltyAve.position.set(40, 0.08, 98);
  scene.add(saltyAve);

  // Snobby Shores Estate Driveways (from Coast Pkwy at X=-235 to Mansions at X=-200)
  for (const sz of [-15, 20, 55]) {
    const drive = new THREE.Mesh(new THREE.PlaneGeometry(38, 6), roadMat);
    drive.rotateX(-Math.PI / 2);
    drive.position.set(-216, 0.08, sz);
    scene.add(drive);
  }

  // 5b. New Open-Country Scenic Parkways & City Connectors (No obstacles in middle)
  // North Scenic Parkway (Z = -160, Length: 490m, Width: 8.5m)
  const northScenicPkwy = new THREE.Mesh(new THREE.PlaneGeometry(490, 8.5), highwayMat);
  northScenicPkwy.rotateX(-Math.PI / 2);
  northScenicPkwy.position.set(0, 0.08, -160);
  scene.add(northScenicPkwy);

  // South Scenic Parkway (Z = +160, Length: 490m, Width: 8.5m)
  const southScenicPkwy = new THREE.Mesh(new THREE.PlaneGeometry(490, 8.5), highwayMat);
  southScenicPkwy.rotateX(-Math.PI / 2);
  southScenicPkwy.position.set(0, 0.08, 160);
  scene.add(southScenicPkwy);

  // Lakeview Connector Drive (X = 160, Length: 85m, Width: 8.0m, Z from -85 to -160)
  const lakeviewConn = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 85), roadMat);
  lakeviewConn.rotateX(-Math.PI / 2);
  lakeviewConn.position.set(160, 0.08, -122.5);
  scene.add(lakeviewConn);

  // Emerald Park Way (X = -160, Length: 90m, Width: 8.0m, Z from 75 to 160)
  const emeraldParkWay = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 90), roadMat);
  emeraldParkWay.rotateX(-Math.PI / 2);
  emeraldParkWay.position.set(-160, 0.08, 117.5);
  scene.add(emeraldParkWay);

  // Park Avenue West (X = -90, Length: 80m, Width: 7.5m, Z from -85 to -160)
  const parkAveWest = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 80), roadMat);
  parkAveWest.rotateX(-Math.PI / 2);
  parkAveWest.position.set(-90, 0.08, -122.5);
  scene.add(parkAveWest);

  // 6. Tilted Mega-City Grid Streets (at X = -65, -35, +35, +65 and Z = -65, -35, +35, +65)
  for (const offset of [-65, -35, 35, 65]) {
    const streetNS = new THREE.Mesh(new THREE.PlaneGeometry(8, 180), roadMat);
    streetNS.rotateX(-Math.PI / 2);
    streetNS.position.set(offset, 0.08, 0);
    scene.add(streetNS);

    const streetEW = new THREE.Mesh(new THREE.PlaneGeometry(180, 8), roadMat);
    streetEW.rotateX(-Math.PI / 2);
    streetEW.position.set(0, 0.08, offset);
    scene.add(streetEW);

    // Concrete Sidewalk Curbs along City Grid
    const curbW = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 180), sidewalkMat);
    curbW.position.set(offset - 4.6, 0.09, 0);
    scene.add(curbW);
    const curbE = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 180), sidewalkMat);
    curbE.position.set(offset + 4.6, 0.09, 0);
    scene.add(curbE);
  }

  // 7. Double Yellow Centerlines & White Dashed Lane Dividers
  for (let z = -270; z <= 270; z += 9) {
    if (Math.abs(z) < 8 || Math.abs(z - 75) < 6 || Math.abs(z - -85) < 6) continue;

    // Central Interstate NS Double Yellow
    const y1 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 5.0), yellowLineMat);
    y1.rotateX(-Math.PI / 2);
    y1.position.set(-0.25, 0.11, z);
    scene.add(y1);
    const y2 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 5.0), yellowLineMat);
    y2.rotateX(-Math.PI / 2);
    y2.position.set(0.25, 0.11, z);
    scene.add(y2);

    // White dashed outer lane markings
    const wL = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 4.0), whiteLineMat);
    wL.rotateX(-Math.PI / 2);
    wL.position.set(-3.5, 0.11, z);
    scene.add(wL);
    const wR = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 4.0), whiteLineMat);
    wR.rotateX(-Math.PI / 2);
    wR.position.set(3.5, 0.11, z);
    scene.add(wR);

    // Hwy 101 Yellow Stripe
    const yHwy1 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 5.0), yellowLineMat);
    yHwy1.rotateX(-Math.PI / 2);
    yHwy1.position.set(-95, 0.11, z);
    scene.add(yHwy1);

    // Hwy 202 Yellow Stripe
    const yHwy2 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 5.0), yellowLineMat);
    yHwy2.rotateX(-Math.PI / 2);
    yHwy2.position.set(95, 0.11, z);
    scene.add(yHwy2);
  }

  for (let x = -270; x <= 270; x += 9) {
    if (Math.abs(x) < 8 || Math.abs(x - -95) < 6 || Math.abs(x - 95) < 6) continue;

    // Central Interstate EW Double Yellow
    const y1 = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.2), yellowLineMat);
    y1.rotateX(-Math.PI / 2);
    y1.position.set(x, 0.11, -0.25);
    scene.add(y1);
    const y2 = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.2), yellowLineMat);
    y2.rotateX(-Math.PI / 2);
    y2.position.set(x, 0.11, 0.25);
    scene.add(y2);

    // I-80 North Yellow Stripe
    const yI80 = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.2), yellowLineMat);
    yI80.rotateX(-Math.PI / 2);
    yI80.position.set(x, 0.11, 75);
    scene.add(yI80);

    // I-40 South Yellow Stripe
    const yI40 = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.2), yellowLineMat);
    yI40.rotateX(-Math.PI / 2);
    yI40.position.set(x, 0.11, -85);
    scene.add(yI40);
  }

  // 8. Overhead Highway Destination Gantries
  createHighwayGantry(scene, colliders, 0, 85, '◄ EXIT 4: PLEASANT PARK', 'TILTED TOWERS ▲', 'EXIT 8: RETAIL ROW ►');
  createHighwayGantry(scene, colliders, 0, -85, '◄ EXIT 12: SNOBBY SHORES', 'TILTED TOWERS ▲', 'EXIT 14: SALTY SPRINGS ►');
  createHighwayGantry(scene, colliders, -95, 60, '◄ MT KAY PASS', 'HWY 101 NORTH ▲', 'EXIT 3: CITY CENTER ►');
  createHighwayGantry(scene, colliders, 95, -50, '◄ SALTY BYPASS', 'HWY 202 SOUTH ▲', 'EXIT 9: RETAIL ROW ►');

  // 9. Modern LED Highway Streetlights along Interstates
  const lampPoleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 6);
  const lampArmGeo = new THREE.BoxGeometry(0.12, 0.12, 2.4);
  const lampHeadGeo = new THREE.BoxGeometry(0.4, 0.15, 0.8);

  for (let z = -240; z <= 240; z += 60) {
    if (Math.abs(z) < 20) continue;
    // East side lamp (comfortably offset past the shoulder)
    createStreetLamp(scene, colliders, 11.0, z, 0, lampPoleGeo, lampArmGeo, lampHeadGeo, metalPoleMat, lampLightMat);
    // West side lamp (comfortably offset past the shoulder)
    createStreetLamp(scene, colliders, -11.0, z, Math.PI, lampPoleGeo, lampArmGeo, lampHeadGeo, metalPoleMat, lampLightMat);
  }

  for (let x = -240; x <= 240; x += 60) {
    if (Math.abs(x) < 20) continue;
    createStreetLamp(scene, colliders, x, 11.0, Math.PI / 2, lampPoleGeo, lampArmGeo, lampHeadGeo, metalPoleMat, lampLightMat);
    createStreetLamp(scene, colliders, x, -11.0, -Math.PI / 2, lampPoleGeo, lampArmGeo, lampHeadGeo, metalPoleMat, lampLightMat);
  }

  // 10. Pedestrian Zebra Crosswalks at Major Intersections
  createZebraCrosswalk(scene, 0, 9, 12, 6, false);
  createZebraCrosswalk(scene, 0, -9, 12, 6, false);
  createZebraCrosswalk(scene, 9, 0, 6, 12, true);
  createZebraCrosswalk(scene, -9, 0, 6, 12, true);

  // 11. Drivable Vehicles (Parked completely clear of driving lanes on paved roadside shoulders)
  const root = new THREE.Group();
  scene.add(root);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -95 + 9.5, 0, 75, 0x0284c7, 'Whiplash Blue Interstate', 'sports', 0);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 95 - 9.5, 0, -85, 0x16a34a, 'Bear Green Offroad 4x4', 'suv', Math.PI / 2);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 11.5, 0, 180, 0xd97706, 'Prevalent Gold Cruiser', 'sports', Math.PI);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -235 + 9.5, 0, -50, 0x9333ea, 'Whiplash Purple Apex', 'sports', -Math.PI / 2);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 225 - 9.5, 0, 50, 0xdc2626, 'Mudflap Red Hauler', 'truck', 0);
}

function createHighwayGantry(
  scene: THREE.Scene,
  colliders: SolidCollider[],
  x: number,
  z: number,
  _leftText: string,
  _centerText: string,
  _rightText: string
) {
  const gantry = new THREE.Group();
  gantry.position.set(x, 0, z);

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
  const signMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // 2 Wide Support Pillars (11m offset for total 22m span, completely clear of road lanes)
  const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 8.5, 8), metalMat);
  pillarL.position.set(-11.0, 4.25, 0);
  gantry.add(pillarL);

  const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 8.5, 8), metalMat);
  pillarR.position.set(11.0, 4.25, 0);
  gantry.add(pillarR);

  // Horizontal Cross Beam
  const beam = new THREE.Mesh(new THREE.BoxGeometry(22.8, 0.5, 0.5), metalMat);
  beam.position.set(0, 7.8, 0);
  gantry.add(beam);

  // Overhead Green Destination Signs
  const signL = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.0, 0.2), signMat);
  signL.position.set(-5.0, 7.8, 0.3);
  gantry.add(signL);

  const signC = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.0, 0.2), signMat);
  signC.position.set(0, 7.8, 0.3);
  gantry.add(signC);

  const signR = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.0, 0.2), signMat);
  signR.position.set(5.0, 7.8, 0.3);
  gantry.add(signR);

  // White Border Linings on Signs
  const borderGeo = new THREE.BoxGeometry(4.6, 0.08, 0.22);
  const bTop = new THREE.Mesh(borderGeo, whiteMat);
  bTop.position.set(0, 8.6, 0.3);
  gantry.add(bTop);

  scene.add(gantry);

  // Solid Support Pillar Colliders (placed safely 11m out)
  colliders.push({
    type: 'cylinder',
    x: x - 11.0,
    z: z,
    radius: 0.45,
    minY: 0,
    maxY: 8.5,
    name: 'Highway Gantry Left Pillar',
  });
  colliders.push({
    type: 'cylinder',
    x: x + 11.0,
    z: z,
    radius: 0.45,
    minY: 0,
    maxY: 8.5,
    name: 'Highway Gantry Right Pillar',
  });
}

function createStreetLamp(
  scene: THREE.Scene,
  colliders: SolidCollider[],
  x: number,
  z: number,
  rotY: number,
  poleGeo: THREE.CylinderGeometry,
  armGeo: THREE.BoxGeometry,
  headGeo: THREE.BoxGeometry,
  poleMat: THREE.Material,
  lampMat: THREE.Material
) {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0, z);
  lamp.rotateY(rotY);

  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 3.75;
  lamp.add(pole);

  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.position.set(0, 7.4, 1.0);
  lamp.add(arm);

  const head = new THREE.Mesh(headGeo, lampMat);
  head.position.set(0, 7.3, 2.0);
  lamp.add(head);

  scene.add(lamp);

  // Solid Lamp Pole Collider
  colliders.push({
    type: 'cylinder',
    x,
    z,
    radius: 0.35,
    minY: 0,
    maxY: 7.5,
    name: 'Highway LED Streetlight Pole',
  });
}

function createZebraCrosswalk(
  scene: THREE.Scene,
  cx: number,
  cz: number,
  w: number,
  d: number,
  horizontal: boolean
) {
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const stripes = 6;
  for (let i = 0; i < stripes; i++) {
    if (horizontal) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.8), whiteMat);
      stripe.rotateX(-Math.PI / 2);
      stripe.position.set(cx, 0.11, cz - d / 2 + (i + 0.5) * (d / stripes));
      scene.add(stripe);
    } else {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.8, d), whiteMat);
      stripe.rotateX(-Math.PI / 2);
      stripe.position.set(cx - w / 2 + (i + 0.5) * (w / stripes), 0.11, cz);
      scene.add(stripe);
    }
  }
}

// -------------------------------------------------------------
// WALKABLE SKYSCRAPER BUILDER WITH GRAND LOBBY, STAIRS TO ROOF & INTERIORS
// -------------------------------------------------------------
function buildWalkableSkyscraper(
  scene: THREE.Scene,
  parent: THREE.Group,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  b: { x: number; z: number; w: number; h: number; d: number; col: number; winCol: number; floors: number; cols: number; name: string },
  index: number
) {
  const building = new THREE.Group();
  building.position.set(b.x, 0, b.z);

  const wallMat = new THREE.MeshStandardMaterial({ color: b.col, roughness: 0.7, metalness: 0.3 });
  const lobbyFloorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.5 });
  const officeFloorMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
  const penthouseFloorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
  const roofDeckMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.2 });
  const parapetMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const stairWoodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 });
  const couchMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 });
  const deskWoodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
  const glassAwningMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7, roughness: 0.1 });
  const padRingMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.8, roughness: 0.2 });
  const padCoreMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 1.0, roughness: 0.3 });

  const halfW = b.w / 2;
  const halfD = b.d / 2;
  const doorW = 4.0;
  const doorH = 3.6;
  const frontWingW = (b.w - doorW) / 2;

  // Floor Planning: Dynamic floors based on actual building height b.h
  const floorHeight = 4.5;
  const floorCount = Math.max(3, Math.floor(b.h / floorHeight));

  // 1. Ground Level Lobby Floor Slab
  const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.2, 0.2, b.d - 0.2), lobbyFloorMat);
  groundFloor.position.y = 0.1;
  groundFloor.receiveShadow = true;
  building.add(groundFloor);

  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x + halfW,
    minY: -0.2,
    maxY: 0.2,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Ground Floor`,
  });

  // 2. Intermediate Floor Slabs with Stairwell Cutouts
  for (let f = 1; f < floorCount; f++) {
    const floorY = f * floorHeight;
    const isOdd = f % 2 === 1;
    const slabMat = f % 3 === 0 ? penthouseFloorMat : officeFloorMat;

    // Floor slab leaving space for stairs on alternating side
    const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w - 3.2, 0.35, b.d - 0.4), slabMat);
    slab.position.set(isOdd ? -1.4 : 1.4, floorY, 0);
    slab.receiveShadow = true;
    building.add(slab);

    colliders.push({
      type: 'box',
      minX: isOdd ? b.x - halfW + 0.2 : b.x - halfW + 3.0,
      maxX: isOdd ? b.x + halfW - 3.0 : b.x + halfW - 0.2,
      minY: floorY - 0.25,
      maxY: floorY + 0.15,
      minZ: b.z - halfD + 0.2,
      maxZ: b.z + halfD - 0.2,
      name: `${b.name} Floor ${f + 1} Slab`,
    });
  }

  // 3. Full Continuous Staircases from Ground all the way up to Rooftop (y = b.h)
  const numSteps = 10;
  const stepW = 2.4;
  const landingMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

  for (let f = 0; f < floorCount; f++) {
    const baseY = f * floorHeight;
    const topY = f === floorCount - 1 ? b.h : (f + 1) * floorHeight;
    const deltaY = topY - baseY;
    const isRightSide = f % 2 === 0;

    const stairStartX = isRightSide ? halfW - 1.6 : -halfW + 1.6;
    const stairStartZ = isRightSide ? halfD - 2.6 : -halfD + 2.6;
    const dir = isRightSide ? -1 : 1;
    const stepRise = deltaY / numSteps;
    const stepRun = (b.d * 0.46) / numSteps;

    // Build Individual Steps
    for (let s = 0; s < numSteps; s++) {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepRise, stepRun * 1.05), stairWoodMat);
      const stepY = baseY + (s + 0.5) * stepRise;
      const stepZ = stairStartZ + dir * s * stepRun;
      stepMesh.position.set(stairStartX, stepY, stepZ);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      building.add(stepMesh);

      colliders.push({
        type: 'box',
        minX: b.x + stairStartX - stepW / 2,
        maxX: b.x + stairStartX + stepW / 2,
        minY: baseY + s * stepRise - 0.1,
        maxY: baseY + (s + 1) * stepRise + 0.1,
        minZ: b.z + stepZ - stepRun / 2,
        maxZ: b.z + stepZ + stepRun / 2,
        name: `${b.name} Flight ${f + 1} Step ${s + 1}`,
      });
    }

    // Landing Platform at top of each flight
    const landingZ = stairStartZ + dir * numSteps * stepRun + dir * 1.1;
    const landingMesh = new THREE.Mesh(new THREE.BoxGeometry(stepW + 0.4, 0.35, 2.4), landingMat);
    landingMesh.position.set(stairStartX, topY - 0.18, landingZ);
    landingMesh.castShadow = true;
    landingMesh.receiveShadow = true;
    building.add(landingMesh);

    colliders.push({
      type: 'box',
      minX: b.x + stairStartX - (stepW + 0.4) / 2,
      maxX: b.x + stairStartX + (stepW + 0.4) / 2,
      minY: topY - 0.35,
      maxY: topY + 0.1,
      minZ: b.z + landingZ - 1.2,
      maxZ: b.z + landingZ + 1.2,
      name: `${b.name} Flight ${f + 1} Landing`,
    });
  }

  // 4. ROOFTOP DECK AT Y = b.h (Open, 100% solid, full floor access)
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.4, b.d), roofDeckMat);
  roofSlab.position.set(0, b.h - 0.2, 0);
  roofSlab.receiveShadow = true;
  building.add(roofSlab);

  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x + halfW,
    minY: b.h - 0.45,
    maxY: b.h + 0.05,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Rooftop Floor Slab`,
  });

  // 5. Rooftop Stairwell Penthouse Enclosure (Enclosing top stairs with an open doorway to the roof deck)
  const isLastFlightRight = (floorCount - 1) % 2 === 0;
  const cabinX = isLastFlightRight ? halfW - 2.0 : -halfW + 2.0;
  const cabinZ = isLastFlightRight ? -halfD + 3.2 : halfD - 3.2;
  const cabinW = 3.6;
  const cabinD = 4.2;
  const cabinH = 3.2;

  const penthouseCabin = new THREE.Group();
  penthouseCabin.position.set(cabinX, b.h, cabinZ);

  // Penthouse Roof Cap
  const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(cabinW, 0.3, cabinD), wallMat);
  cabinRoof.position.y = cabinH;
  penthouseCabin.add(cabinRoof);

  // Penthouse Side Walls
  const cabinSideL = new THREE.Mesh(new THREE.BoxGeometry(0.3, cabinH, cabinD), wallMat);
  cabinSideL.position.set(-cabinW / 2 + 0.15, cabinH / 2, 0);
  penthouseCabin.add(cabinSideL);

  const cabinSideR = new THREE.Mesh(new THREE.BoxGeometry(0.3, cabinH, cabinD), wallMat);
  cabinSideR.position.set(cabinW / 2 - 0.15, cabinH / 2, 0);
  penthouseCabin.add(cabinSideR);

  // Penthouse Back Wall
  const cabinBack = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, 0.3), wallMat);
  cabinBack.position.set(0, cabinH / 2, isLastFlightRight ? -cabinD / 2 + 0.15 : cabinD / 2 - 0.15);
  penthouseCabin.add(cabinBack);

  // Penthouse Front Doorway Header (leaves a tall open doorway to step out onto the roof)
  const cabinDoorHeader = new THREE.Mesh(new THREE.BoxGeometry(cabinW, 0.7, 0.3), wallMat);
  cabinDoorHeader.position.set(0, cabinH - 0.35, isLastFlightRight ? cabinD / 2 - 0.15 : -cabinD / 2 + 0.15);
  penthouseCabin.add(cabinDoorHeader);

  building.add(penthouseCabin);

  // Solid colliders for penthouse cabin walls & roof
  colliders.push({
    type: 'box',
    minX: b.x + cabinX - cabinW / 2,
    maxX: b.x + cabinX + cabinW / 2,
    minY: b.h + cabinH - 0.3,
    maxY: b.h + cabinH + 0.2,
    minZ: b.z + cabinZ - cabinD / 2,
    maxZ: b.z + cabinZ + cabinD / 2,
    name: `${b.name} Penthouse Cabin Roof`,
  });

  // 6. SOLID PARAPET WALLS & SAFETY COVER AROUND ROOFTOP PERIMETER (1.15m height)
  const parapetH = 1.15;
  const parapetThick = 0.45;

  // Left Parapet (-X)
  const paraL = new THREE.Mesh(new THREE.BoxGeometry(parapetThick, parapetH, b.d), parapetMat);
  paraL.position.set(-halfW + parapetThick / 2, b.h + parapetH / 2, 0);
  building.add(paraL);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x - halfW + parapetThick,
    minY: b.h,
    maxY: b.h + parapetH + 0.1,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Roof Left Parapet`,
  });

  // Right Parapet (+X)
  const paraR = new THREE.Mesh(new THREE.BoxGeometry(parapetThick, parapetH, b.d), parapetMat);
  paraR.position.set(halfW - parapetThick / 2, b.h + parapetH / 2, 0);
  building.add(paraR);
  colliders.push({
    type: 'box',
    minX: b.x + halfW - parapetThick,
    maxX: b.x + halfW,
    minY: b.h,
    maxY: b.h + parapetH + 0.1,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Roof Right Parapet`,
  });

  // Back Parapet (-Z)
  const paraB = new THREE.Mesh(new THREE.BoxGeometry(b.w, parapetH, parapetThick), parapetMat);
  paraB.position.set(0, b.h + parapetH / 2, -halfD + parapetThick / 2);
  building.add(paraB);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x + halfW,
    minY: b.h,
    maxY: b.h + parapetH + 0.1,
    minZ: b.z - halfD,
    maxZ: b.z - halfD + parapetThick,
    name: `${b.name} Roof Back Parapet`,
  });

  // Front Parapet (+Z)
  const paraF = new THREE.Mesh(new THREE.BoxGeometry(b.w, parapetH, parapetThick), parapetMat);
  paraF.position.set(0, b.h + parapetH / 2, halfD - parapetThick / 2);
  building.add(paraF);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x + halfW,
    minY: b.h,
    maxY: b.h + parapetH + 0.1,
    minZ: b.z + halfD - parapetThick,
    maxZ: b.z + halfD,
    name: `${b.name} Roof Front Parapet`,
  });

  // 7. ROOFTOP TACTICAL BOUNCE PAD (Super launch from the skyscraper peak!)
  const roofBouncePad = new THREE.Group();
  roofBouncePad.position.set(0, b.h + 0.05, 0);

  const bounceRing = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.14, 16), padRingMat);
  bounceRing.position.y = 0.07;
  roofBouncePad.add(bounceRing);

  const bounceCore = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.18, 16), padCoreMat);
  bounceCore.position.y = 0.09;
  roofBouncePad.add(bounceCore);

  building.add(roofBouncePad);

  // Register rooftop bounce pad for high air glider deployment
  SKYSCRAPER_LAUNCH_PADS.push({
    x: b.x,
    z: b.z,
    y: b.h,
    targetY: b.h + 28.0,
    name: `${b.name} Roof Launch Pad`,
  });

  // 8. GROUND-LEVEL SKY-ASCENDER / LAUNCH PAD (Outside main entrance for fast launch to rooftop)
  const groundLaunchPad = new THREE.Group();
  const groundPadX = b.x;
  const groundPadZ = b.z + halfD + 3.2;
  groundLaunchPad.position.set(groundPadX, 0.08, groundPadZ);

  const gPadRing = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.16, 16), padRingMat);
  gPadRing.position.y = 0.08;
  groundLaunchPad.add(gPadRing);

  const gPadCore = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16), padCoreMat);
  gPadCore.position.y = 0.1;
  groundLaunchPad.add(gPadCore);

  // Holographic Upward Arrow Billboard
  const arrowGeo = new THREE.ConeGeometry(0.35, 0.6, 4);
  arrowGeo.rotateX(Math.PI);
  const arrowMesh = new THREE.Mesh(arrowGeo, padCoreMat);
  arrowMesh.position.set(0, 0.7, 0);
  groundLaunchPad.add(arrowMesh);

  parent.add(groundLaunchPad);

  // Register ground pad targeting this skyscraper's roof
  SKYSCRAPER_LAUNCH_PADS.push({
    x: groundPadX,
    z: groundPadZ,
    y: 0,
    targetY: b.h + 5.0,
    name: `${b.name} Ground Ascender`,
  });

  // 9. SOLID EXTERIOR WALLS EXTENDING FULL HEIGHT TO ROOF b.h
  // Left Exterior Wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, b.h, b.d), wallMat);
  leftWall.position.set(-halfW + 0.25, b.h / 2, 0);
  building.add(leftWall);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x - halfW + 0.6,
    minY: 0,
    maxY: b.h,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Left Wall`,
  });

  // Right Exterior Wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, b.h, b.d), wallMat);
  rightWall.position.set(halfW - 0.25, b.h / 2, 0);
  building.add(rightWall);
  colliders.push({
    type: 'box',
    minX: b.x + halfW - 0.6,
    maxX: b.x + halfW,
    minY: 0,
    maxY: b.h,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Right Wall`,
  });

  // Back Exterior Wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, 0.5), wallMat);
  backWall.position.set(0, b.h / 2, -halfD + 0.25);
  building.add(backWall);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x + halfW,
    minY: 0,
    maxY: b.h,
    minZ: b.z - halfD,
    maxZ: b.z - halfD + 0.6,
    name: `${b.name} Back Wall`,
  });

  // Front Left Wing
  const frontL = new THREE.Mesh(new THREE.BoxGeometry(frontWingW, b.h, 0.5), wallMat);
  frontL.position.set(-halfW + frontWingW / 2, b.h / 2, halfD - 0.25);
  building.add(frontL);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x - halfW + frontWingW,
    minY: 0,
    maxY: b.h,
    minZ: b.z + halfD - 0.6,
    maxZ: b.z + halfD,
    name: `${b.name} Front Left Wall`,
  });

  // Front Right Wing
  const frontR = new THREE.Mesh(new THREE.BoxGeometry(frontWingW, b.h, 0.5), wallMat);
  frontR.position.set(halfW - frontWingW / 2, b.h / 2, halfD - 0.25);
  building.add(frontR);
  colliders.push({
    type: 'box',
    minX: b.x + halfW - frontWingW,
    maxX: b.x + halfW,
    minY: 0,
    maxY: b.h,
    minZ: b.z + halfD - 0.6,
    maxZ: b.z + halfD,
    name: `${b.name} Front Right Wall`,
  });

  // Front Entrance Header (above door opening y=doorH to y=b.h)
  const frontHeader = new THREE.Mesh(new THREE.BoxGeometry(doorW, b.h - doorH, 0.5), wallMat);
  frontHeader.position.set(0, doorH + (b.h - doorH) / 2, halfD - 0.25);
  building.add(frontHeader);

  // Front Entrance Glass Canopy & Support Columns
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(doorW + 1.2, 0.2, 2.5), glassAwningMat);
  canopy.position.set(0, doorH + 0.2, halfD + 1.1);
  building.add(canopy);

  for (const cx of [-doorW / 2 - 0.4, doorW / 2 + 0.4]) {
    const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, doorH + 0.2, 8), metalMat);
    colMesh.position.set(cx, (doorH + 0.2) / 2, halfD + 2.0);
    building.add(colMesh);
  }

  // Multi-Story Windows across facades up to b.h
  addWindowGridToBuilding(building, b.w, b.h, b.d, b.winCol, b.cols, b.floors);

  // 10. Lobby & Intermediate Floor Furnishings
  // Reception Desk & Terminal
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 1.2), goldTrimMat);
  desk.position.set(0, 0.55, 0);
  building.add(desk);

  const pcScreen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.08), metalMat);
  pcScreen.position.set(0, 1.4, 0);
  building.add(pcScreen);

  // Lounge Couches & Coffee Table
  const couchL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.1), couchMat);
  couchL.position.set(-halfW + 2.2, 0.45, 2.0);
  building.add(couchL);

  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.8), deskWoodMat);
  coffeeTable.position.set(-halfW + 2.2, 0.2, 0.4);
  building.add(coffeeTable);

  // Elevator Doors on Back Wall
  for (const ex of [-1.8, 1.8]) {
    const elevDoor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.2, 0.1), metalMat);
    elevDoor.position.set(ex, 1.6, -halfD + 0.6);
    building.add(elevDoor);
  }

  // Intermediate Floor Chests and Furnishings
  // Floor 2 Office
  const officeDesk1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.85, 1.2), deskWoodMat);
  officeDesk1.position.set(-halfW + 3.0, 4.5 + 0.42, 2.0);
  building.add(officeDesk1);
  addChest(scene, chests, chestMeshes, colliders, b.x - halfW + 3.0, 4.5 + 0.9, b.z + 2.0, 'chest');

  // Floor 3 Lounge
  const boardTable = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.9, 1.8), goldTrimMat);
  boardTable.position.set(1.4, 9.0 + 0.45, 0);
  building.add(boardTable);
  addChest(scene, chests, chestMeshes, colliders, b.x + 1.4, 9.0 + 1.0, b.z, 'chest');

  // Floor 4 Armory
  const serverRack1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.4, 1.2), metalMat);
  serverRack1.position.set(0, 13.5 + 1.7, -halfD + 1.4);
  building.add(serverRack1);
  addChest(scene, chests, chestMeshes, colliders, b.x - halfW + 2.5, 13.5 + 1.0, b.z, 'rare_chest');

  // Rooftop Architectural Props: AC Units / Water Tank / Radio Spire
  const acVent = new THREE.Mesh(new THREE.BoxGeometry(3, 1.8, 3), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 }));
  acVent.position.set(2.5, b.h + 0.9, 2.5);
  building.add(acVent);
  colliders.push({
    type: 'box',
    minX: b.x + 1.0,
    maxX: b.x + 4.0,
    minY: b.h,
    maxY: b.h + 1.8,
    minZ: b.z + 1.0,
    maxZ: b.z + 4.0,
    name: `${b.name} AC Unit`,
  });

  if (index % 2 === 0) {
    const waterTank = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.4, 12), new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.8 }));
    waterTank.position.set(-2.5, b.h + 1.2, -2.5);
    building.add(waterTank);
    colliders.push({
      type: 'cylinder',
      x: b.x - 2.5,
      z: b.z - 2.5,
      radius: 1.8,
      minY: b.h,
      maxY: b.h + 2.4,
      name: `${b.name} Water Tank`,
    });
  } else {
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 6, 8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    spire.position.set(0, b.h + 3, 0);
    building.add(spire);
  }

  // Rooftop Rare Loot Chest
  addChest(
    scene,
    chests,
    chestMeshes,
    colliders,
    b.x - 2.2,
    b.h + 0.5,
    b.z - 2.2,
    'rare_chest'
  );

  // Harvestables inside skyscraper
  addHarvestable(harvestables, b.x - halfW + 3.0, 4.5, b.z - 2.0, 'wall', 'wood', 120, 20, 1.4, 0.9);
  addHarvestable(harvestables, b.x, 4.5, b.z - halfD + 1.2, 'container', 'metal', 160, 35, 1.2, 3.0);

  parent.add(building);
}

// -------------------------------------------------------------
// MEGA-CITY: TILTED TOWERS WITH DETAILED SKYSCRAPERS & WINDOWS
// -------------------------------------------------------------
function buildMegaCity(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const root = new THREE.Group();
  root.position.set(0, 0, 0);

  // 1. Central Clock Tower
  const clockTower = new THREE.Group();
  clockTower.position.set(18, 0, -18);
  const towerBody = new THREE.Mesh(
    new THREE.BoxGeometry(8, 28, 8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 })
  );
  towerBody.position.y = 14;
  towerBody.castShadow = true;
  towerBody.receiveShadow = true;
  clockTower.add(towerBody);

  // Clock Tower Arched Windows on shaft
  addWindowGridToBuilding(clockTower, 8, 28, 8, 0x38bdf8, 3, 5);

  colliders.push({
    type: 'box',
    minX: 18 - 4.2,
    maxX: 18 + 4.2,
    minY: 0,
    maxY: 28,
    minZ: -18 - 4.2,
    maxZ: -18 + 4.2,
    name: 'Clock Tower',
  });

  // Clock Faces
  const clockGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.4, 16);
  clockGeo.rotateX(Math.PI / 2);
  const clockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  for (const cz of [-4.1, 4.1]) {
    const clock = new THREE.Mesh(clockGeo, clockMat);
    clock.position.set(0, 23, cz);
    clockTower.add(clock);
  }

  // Roof Spire
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(6, 7, 4),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 })
  );
  roof.position.y = 31.5;
  roof.rotateY(Math.PI / 4);
  clockTower.add(roof);

  root.add(clockTower);
  addChest(scene, chests, chestMeshes, colliders, 18, 28.5, -18, 'rare_chest');

  // 2. Skyscrapers with Multi-Floor Window Grids & Balconies
  const skyscrapers = [
    {
      x: -26,
      z: -26,
      w: 15,
      h: 36,
      d: 15,
      col: 0x1e293b,
      winCol: 0x38bdf8,
      floors: 9,
      cols: 4,
      name: 'Trump Tower',
    },
    {
      x: -26,
      z: 26,
      w: 16,
      h: 44,
      d: 16,
      col: 0x334155,
      winCol: 0x67e8f9,
      floors: 11,
      cols: 4,
      name: 'Neo Tilted Highrise',
    },
    {
      x: 26,
      z: 26,
      w: 14,
      h: 36,
      d: 13,
      col: 0x475569,
      winCol: 0xfef08a,
      floors: 9,
      cols: 3,
      name: 'Fish Building',
    },
    {
      x: -26,
      z: -52,
      w: 16,
      h: 35,
      d: 12,
      col: 0x1e1b4b,
      winCol: 0xa5b4fc,
      floors: 8,
      cols: 4,
      name: 'Pawn Shop & Offices',
    },
    {
      x: 26,
      z: -52,
      w: 14,
      h: 34,
      d: 12,
      col: 0x3b4252,
      winCol: 0xbae6fd,
      floors: 8,
      cols: 3,
      name: 'Apartments Tower',
    },
    {
      x: -55,
      z: -20,
      w: 14,
      h: 38,
      d: 14,
      col: 0x0f172a,
      winCol: 0x38bdf8,
      floors: 9,
      cols: 3,
      name: 'West Bank Tower',
    },
    {
      x: -55,
      z: 25,
      w: 15,
      h: 36,
      d: 14,
      col: 0x1e293b,
      winCol: 0xfde047,
      floors: 9,
      cols: 3,
      name: 'Commercial Plaza',
    },
    {
      x: 55,
      z: -20,
      w: 13,
      h: 35,
      d: 13,
      col: 0x1f2937,
      winCol: 0x67e8f9,
      floors: 8,
      cols: 3,
      name: 'East Tech Hub',
    },
    {
      x: 55,
      z: 25,
      w: 14,
      h: 40,
      d: 14,
      col: 0x18181b,
      winCol: 0x93c5fd,
      floors: 10,
      cols: 4,
      name: 'Metro Center',
    },
  ];

  skyscrapers.forEach((b, i) => {
    buildWalkableSkyscraper(
      scene,
      root,
      harvestables,
      chests,
      chestMeshes,
      colliders,
      b,
      i
    );
  });

  // 3. Urban City Props: Streetlights, Traffic Signals, Benches, Fire Hydrants
  addCityStreetProps(root, harvestables, colliders, vehicles);

  scene.add(root);
}

// Shared static materials and geometries for world rendering efficiency
const sharedFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
const sharedWinGlassMat = new THREE.MeshStandardMaterial({
  color: 0x38bdf8,
  roughness: 0.2,
  metalness: 0.6,
});
const sharedWinLitMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
const sharedWindowGeo = new THREE.PlaneGeometry(1.4, 1.4);
const sharedSillGeo = new THREE.BoxGeometry(1.6, 0.1, 0.2);

// Function to generate realistic illuminated window grids across skyscraper facades with shared geometries
function addWindowGridToBuilding(
  buildingGroup: THREE.Group,
  width: number,
  height: number,
  depth: number,
  _baseWinColor: number,
  cols: number,
  floors: number
) {
  // Front & Back Facades (along Z axis)
  for (let f = 1; f < floors; f++) {
    const wy = (f / floors) * height;
    for (let c = 0; c < cols; c++) {
      const wx = -width / 2 + (c + 0.5) * (width / cols);
      const isLit = (f + c) % 3 === 0;
      const mat = isLit ? sharedWinLitMat : sharedWinGlassMat;

      // Front Window (+Z)
      const winF = new THREE.Mesh(sharedWindowGeo, mat);
      winF.scale.set((width * 0.55) / cols / 1.4, (height * 0.55) / floors / 1.4, 1);
      winF.position.set(wx, wy, depth / 2 + 0.04);
      buildingGroup.add(winF);

      // Back Window (-Z)
      const winB = new THREE.Mesh(sharedWindowGeo, mat);
      winB.scale.set((width * 0.55) / cols / 1.4, (height * 0.55) / floors / 1.4, 1);
      winB.rotateY(Math.PI);
      winB.position.set(wx, wy, -depth / 2 - 0.04);
      buildingGroup.add(winB);
    }
  }

  // Left & Right Facades (along X axis)
  const sideCols = Math.max(2, Math.round(cols * (depth / width)));
  for (let f = 1; f < floors; f++) {
    const wy = (f / floors) * height;
    for (let c = 0; c < sideCols; c++) {
      const wz = -depth / 2 + (c + 0.5) * (depth / sideCols);
      const isLit = (f * 2 + c) % 4 === 0;
      const mat = isLit ? sharedWinLitMat : sharedWinGlassMat;

      // Right Window (+X)
      const winR = new THREE.Mesh(sharedWindowGeo, mat);
      winR.scale.set((depth * 0.55) / sideCols / 1.4, (height * 0.55) / floors / 1.4, 1);
      winR.rotateY(Math.PI / 2);
      winR.position.set(width / 2 + 0.04, wy, wz);
      buildingGroup.add(winR);

      // Left Window (-X)
      const winL = new THREE.Mesh(sharedWindowGeo, mat);
      winL.scale.set((depth * 0.55) / sideCols / 1.4, (height * 0.55) / floors / 1.4, 1);
      winL.rotateY(-Math.PI / 2);
      winL.position.set(-width / 2 - 0.04, wy, wz);
      buildingGroup.add(winL);
    }
  }
}

// Urban props: Traffic lights, streetlights, fire hydrants, parked cars, planters
function addCityStreetProps(
  root: THREE.Group,
  harvestables: HarvestableObject[],
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
  const lightGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  // 1. Street Lanterns along the avenues (Safe sidewalk curb coordinates, zero lane obstruction)
  const lampPositions = [
    { x: -11.5, z: -20 },
    { x: 11.5, z: -20 },
    { x: -11.5, z: 20 },
    { x: 11.5, z: 20 },
    { x: -20, z: -11.5 },
    { x: -20, z: 11.5 },
    { x: 20, z: -11.5 },
    { x: 20, z: 11.5 },
    { x: -45, z: -18 },
    { x: 45, z: -18 },
    { x: -45, z: 18 },
    { x: 45, z: 18 },
  ];

  lampPositions.forEach((pos) => {
    const lamp = new THREE.Group();
    lamp.position.set(pos.x, 0, pos.z);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.5, 8), metalMat);
    pole.position.y = 2.75;
    lamp.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.12), metalMat);
    arm.position.set(pos.x > 0 ? -0.5 : 0.5, 5.2, 0);
    lamp.add(arm);

    const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.3), lightGlowMat);
    lampHead.position.set(pos.x > 0 ? -1.0 : 1.0, 5.0, 0);
    lamp.add(lampHead);

    root.add(lamp);

    colliders.push({
      type: 'cylinder',
      x: pos.x,
      z: pos.z,
      radius: 0.3,
      minY: 0,
      maxY: 5.5,
      name: 'Street Lamp Pole',
    });
  });

  // 2. Traffic Light Gantries at Main Crossroad (Placed safely on outer corner plaza)
  const trafficSignal = new THREE.Group();
  trafficSignal.position.set(11.0, 0, 11.0);
  const sigPole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 6.5, 8), metalMat);
  sigPole.position.y = 3.25;
  trafficSignal.add(sigPole);

  const sigBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 1.2, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a })
  );
  sigBox.position.set(0, 5.2, 0);
  trafficSignal.add(sigBox);

  // Red, Yellow, Green bulbs
  const redBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  redBulb.position.set(0, 5.6, 0.21);
  trafficSignal.add(redBulb);
  const yellowBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xeab308 }));
  yellowBulb.position.set(0, 5.2, 0.21);
  trafficSignal.add(yellowBulb);
  const greenBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  greenBulb.position.set(0, 4.8, 0.21);
  trafficSignal.add(greenBulb);

  root.add(trafficSignal);

  // 3. Fire Hydrants (Comfortably placed along sidewalk edges)
  const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.6 });
  for (const hpos of [
    { x: -11.0, z: 14 },
    { x: 11.0, z: -14 },
    { x: -14, z: -11.0 },
  ]) {
    const hydrant = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.8, 8), hydrantMat);
    hydrant.position.set(hpos.x, 0.4, hpos.z);
    root.add(hydrant);
  }

  // 4. Drivable Vehicles (Parked in designated curbside parking bays, 100% off traffic lanes)
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 12.5, 0, 22, 0xef4444, 'Whiplash Red GT', 'sports', 0);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -12.5, 0, -22, 0x3b82f6, 'Mudflap Blue 4x4', 'truck', Math.PI);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -22, 0, 12.5, 0xf59e0b, 'Prevalent Taxi Gold', 'sports', Math.PI / 2);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 22, 0, -12.5, 0x10b981, 'Bear Emerald SUV', 'suv', -Math.PI / 2);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -48, 0, 16, 0x8b5cf6, 'Whiplash Cyber Purple', 'sports', 0.4);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 48, 0, -16, 0xec4899, 'Whiplash Neon Pink', 'sports', -0.6);

  // 5. Alley Dumpsters (Tucked into building alcoves away from all roads)
  addDumpster(root, harvestables, colliders, 18, 0, 18);
  addDumpster(root, harvestables, colliders, -18, 0, -18);
  addDumpster(root, harvestables, colliders, -46, 0, -20);
}

// -------------------------------------------------------------
// SUBTLE NATURAL GRASS TUFTS (REDUCED DENSITY, ZERO ROADS, ZERO LAG)
// -------------------------------------------------------------
function populateLushGrass(scene: THREE.Scene) {
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    roughness: 0.85,
    side: THREE.DoubleSide,
    flatShading: true,
  });

  // Clustered grass blade geometry
  const coneGeo = new THREE.ConeGeometry(0.2, 0.7, 4);
  coneGeo.translate(0, 0.35, 0);

  const maxInstances = 60; // Reduced density for pristine highway landscape & ultra-fast performance
  const instancedGrass = new THREE.InstancedMesh(coneGeo, grassMat, maxInstances);
  const dummy = new THREE.Object3D();

  let count = 0;
  for (let i = 0; i < maxInstances * 2 && count < maxInstances; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 220;
    const gx = Math.cos(angle) * dist;
    const gz = Math.sin(angle) * dist;

    // Strictly skip all roads, highways, city center, and POI paved areas
    if (isPointOnRoad(gx, gz)) continue;

    const gy = getTerrainHeight(gx, gz);
    const scale = 0.7 + Math.random() * 0.6;

    dummy.position.set(gx, gy, gz);
    dummy.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI, (Math.random() - 0.5) * 0.2);
    dummy.scale.set(scale, scale * (0.9 + Math.random() * 0.4), scale);
    dummy.updateMatrix();

    instancedGrass.setMatrixAt(count, dummy.matrix);
    count++;
  }

  instancedGrass.count = count;
  instancedGrass.instanceMatrix.needsUpdate = true;
  instancedGrass.castShadow = false;
  instancedGrass.receiveShadow = true;
  scene.add(instancedGrass);
}

// -------------------------------------------------------------
// POI 2: PLEASANT PARK (Soccer Field, Ultra-Detailed Suburban Homes)
// -------------------------------------------------------------
function buildPleasantPark(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const root = new THREE.Group();
  root.position.set(-140, 0, -140);

  // Central Soccer Field
  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 28),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
  );
  field.rotateX(-Math.PI / 2);
  field.position.set(0, 0.05, 0);
  field.receiveShadow = true;
  root.add(field);

  // Soccer Goals
  const goalGeo = new THREE.TorusGeometry(2.2, 0.16, 8, 16, Math.PI);
  const goalMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const goal1 = new THREE.Mesh(goalGeo, goalMat);
  goal1.position.set(-20, 2.2, 0);
  goal1.rotateY(Math.PI / 2);
  root.add(goal1);

  colliders.push({
    type: 'box',
    minX: -140 - 21,
    maxX: -140 - 19,
    minY: 0,
    maxY: 4.5,
    minZ: -140 - 2.5,
    maxZ: -140 + 2.5,
    name: 'Soccer Goal West',
  });

  const goal2 = new THREE.Mesh(goalGeo, goalMat);
  goal2.position.set(20, 2.2, 0);
  goal2.rotateY(-Math.PI / 2);
  root.add(goal2);

  colliders.push({
    type: 'box',
    minX: -140 + 19,
    maxX: -140 + 21,
    minY: 0,
    maxY: 4.5,
    minZ: -140 - 2.5,
    maxZ: -140 + 2.5,
    name: 'Soccer Goal East',
  });

  // Detailed Suburban Houses surrounding the field
  const houses = [
    { x: -34, z: -28, col: 0x0284c7, name: 'Blue Suburban Mansion' },
    { x: 34, z: -28, col: 0xd97706, name: 'Yellow Suburban Villa' },
    { x: -34, z: 28, col: 0x16a34a, name: 'Green Estate' },
    { x: 34, z: 28, col: 0x9333ea, name: 'Purple Cottage' },
    { x: 0, z: -40, col: 0xef4444, name: 'Red Brick Manor' },
    { x: 0, z: 40, col: 0x06b6d4, name: 'Cyan Modern Home' },
  ];

  houses.forEach((h, i) => {
    addDetailedSuburbanHome(root, harvestables, colliders, -140, -140, h.x, h.z, h.col, h.name);
    // Grounded interior chests inside living room and 2nd floor bedroom
    addChest(scene, chests, chestMeshes, colliders, -140 + h.x - 3.2, 0.45, -140 + h.z + 0.8, 'chest');
    addChest(scene, chests, chestMeshes, colliders, -140 + h.x - 3.4, 3.8, -140 + h.z - 3.4, i % 2 === 0 ? 'rare_chest' : 'chest');
  });

  // Drivable neighborhood cars parked in private home driveways (100% clear of street loop)
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -36, 0, -18, 0xef4444, 'Pleasant Whiplash Red', 'sports', 0.2);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 36, 0, 18, 0x10b981, 'Pleasant Mudflap Green', 'truck', -Math.PI / 2);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 12, 0, 38, 0x3b82f6, 'Pleasant Prevalent Blue', 'sports', Math.PI);

  scene.add(root);
}

// -------------------------------------------------------------
// ULTRA-DETAILED SUBURBAN HOME GENERATOR (FULL WALKABLE INTERIOR)
// -------------------------------------------------------------
function addDetailedSuburbanHome(
  parent: THREE.Group,
  harvestables: HarvestableObject[],
  colliders: SolidCollider[],
  worldRootX: number,
  worldRootZ: number,
  x: number,
  z: number,
  wallColor: number,
  name: string
) {
  const house = new THREE.Group();
  house.position.set(x, 0, z);

  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.75 });
  const intWallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
  const floorWoodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const furnitureWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
  const couchMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.8 });
  const bedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.8 });
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
  const rugMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.9 });
  const brickMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.9 });
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });

  // 1. Ground Hardwood Floor
  const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.15, 10.6), floorWoodMat);
  groundFloor.position.y = 0.08;
  groundFloor.receiveShadow = true;
  house.add(groundFloor);

  // 2nd Floor Mezzanine Ceiling & Floor (leaves stairwell opening on the right)
  const secondFloor = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.2, 7.2), floorWoodMat);
  secondFloor.position.set(0, 3.3, -1.6);
  secondFloor.receiveShadow = true;
  house.add(secondFloor);

  // 2. Hollow Exterior Walls (Allowing seamless entrance and interior navigation)
  // Back Wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 6.5, 0.4), wallMat);
  backWall.position.set(0, 3.25, -5.3);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  house.add(backWall);

  // Left Wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6.5, 11), wallMat);
  leftWall.position.set(-5.8, 3.25, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  house.add(leftWall);

  // Right Wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6.5, 11), wallMat);
  rightWall.position.set(5.8, 3.25, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  house.add(rightWall);

  // Front Wall Left Wing
  const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(4.7, 6.5, 0.4), wallMat);
  frontWallL.position.set(-3.45, 3.25, 5.3);
  frontWallL.castShadow = true;
  frontWallL.receiveShadow = true;
  house.add(frontWallL);

  // Front Wall Right Wing
  const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(4.7, 6.5, 0.4), wallMat);
  frontWallR.position.set(3.45, 3.25, 5.3);
  frontWallR.castShadow = true;
  frontWallR.receiveShadow = true;
  house.add(frontWallR);

  // Front Door Header (Open Doorway below from y=0 to y=3.0)
  const frontDoorHeader = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.5, 0.4), wallMat);
  frontDoorHeader.position.set(0, 4.75, 5.3);
  house.add(frontDoorHeader);

  // 3. Interior Partition Walls (Dividing Living Room, Kitchen & Upper Bedroom)
  const groundPartition = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 6.0), intWallMat);
  groundPartition.position.set(0.5, 1.6, -2.2);
  house.add(groundPartition);

  const upperPartition = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.0, 5.0), intWallMat);
  upperPartition.position.set(-0.8, 4.8, -2.6);
  house.add(upperPartition);

  // 4. Wooden Interior Staircase leading to 2nd Floor
  for (let s = 0; s < 8; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.38, 0.55), furnitureWoodMat);
    step.position.set(4.6, 0.2 + s * 0.38, 2.8 - s * 0.55);
    step.castShadow = true;
    step.receiveShadow = true;
    house.add(step);
  }

  // Staircase Handrail
  const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 4.8), trimMat);
  handrail.position.set(3.6, 2.2, 0.8);
  handrail.rotateX(Math.PI / 6);
  house.add(handrail);

  // 5. Interior Furnishings:
  // --- Living Room (Front Left) ---
  const couch = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 1.2), couchMat);
  couch.position.set(-3.2, 0.45, 2.5);
  house.add(couch);

  const armchair = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 1.1), couchMat);
  armchair.position.set(-1.4, 0.42, 3.6);
  armchair.rotation.y = -Math.PI / 4;
  house.add(armchair);

  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.8), furnitureWoodMat);
  coffeeTable.position.set(-3.2, 0.2, 0.8);
  house.add(coffeeTable);

  const livingRug = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.02, 2.2), rugMat);
  livingRug.position.set(-3.2, 0.16, 1.6);
  house.add(livingRug);

  const tvStand = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.5), furnitureWoodMat);
  tvStand.position.set(-3.2, 0.3, -0.4);
  house.add(tvStand);

  const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 0.08), metalMat);
  tvScreen.position.set(-3.2, 1.1, -0.4);
  house.add(tvScreen);

  const floorLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8), metalMat);
  floorLamp.position.set(-5.0, 1.0, 3.8);
  house.add(floorLamp);
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 }));
  lampShade.position.set(-5.0, 2.1, 3.8);
  house.add(lampShade);

  // --- Dining Area (Front Right) ---
  const diningTable = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.8, 1.1), furnitureWoodMat);
  diningTable.position.set(2.4, 0.4, 3.6);
  house.add(diningTable);

  // 4 Dining Chairs around table
  const chairPositions = [
    { x: 2.4, z: 2.8, r: 0 },
    { x: 2.4, z: 4.4, r: Math.PI },
    { x: 1.2, z: 3.6, r: Math.PI / 2 },
    { x: 3.6, z: 3.6, r: -Math.PI / 2 },
  ];
  chairPositions.forEach((cp) => {
    const chair = new THREE.Group();
    chair.position.set(cp.x, 0, cp.z);
    chair.rotation.y = cp.r;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), furnitureWoodMat);
    seat.position.y = 0.45;
    chair.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), furnitureWoodMat);
    back.position.set(0, 0.72, -0.22);
    chair.add(back);
    house.add(chair);
  });

  // --- Kitchen (Back Left) ---
  const counterL = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.8), intWallMat);
  counterL.position.set(-3.6, 0.45, -4.8);
  house.add(counterL);

  const microwave = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.38, 0.4), metalMat);
  microwave.position.set(-2.4, 1.1, -4.8);
  house.add(microwave);

  const stoveOven = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.92, 0.85), metalMat);
  stoveOven.position.set(-4.8, 0.46, -4.8);
  house.add(stoveOven);

  const fridge = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 0.9), metalMat);
  fridge.position.set(-5.0, 1.1, -3.2);
  house.add(fridge);

  // --- 2nd Floor Bedroom (Upper Floor) ---
  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 3.0), furnitureWoodMat);
  bedFrame.position.set(-3.4, 3.65, -3.4);
  house.add(bedFrame);

  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 2.8), bedMat);
  mattress.position.set(-3.4, 4.0, -3.4);
  house.add(mattress);

  const pillows = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.7), sheetMat);
  pillows.position.set(-3.4, 4.2, -4.4);
  house.add(pillows);

  // Dual Bedside Nightstands with table lamps
  for (const nX of [-4.9, -1.9]) {
    const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), furnitureWoodMat);
    nightstand.position.set(nX, 3.65, -4.4);
    house.add(nightstand);
    const nLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.35, 8), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
    nLamp.position.set(nX, 4.15, -4.4);
    house.add(nLamp);
  }

  const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 0.8), furnitureWoodMat);
  wardrobe.position.set(-3.4, 4.6, 0.5);
  house.add(wardrobe);

  const dresser = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.7), furnitureWoodMat);
  dresser.position.set(2.4, 3.9, -4.6);
  house.add(dresser);

  // 6. High-Pitched Shingled Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(9.5, 4.2, 4), roofMat);
  roof.position.y = 8.6;
  roof.rotateY(Math.PI / 4);
  roof.scale.set(1.2, 1, 1.1);
  house.add(roof);

  // Brick Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.5, 1.2), brickMat);
  chimney.position.set(3.5, 8.5, -2);
  house.add(chimney);

  // Front Porch Awning and Support Pillars
  const porchAwning = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 2.2), roofMat);
  porchAwning.position.set(0, 3.2, 6.2);
  house.add(porchAwning);

  const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.2, 8), trimMat);
  pillarL.position.set(-1.6, 1.6, 7.0);
  house.add(pillarL);

  const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.2, 8), trimMat);
  pillarR.position.set(1.6, 1.6, 7.0);
  house.add(pillarR);

  // Attached Side Garage
  const garage = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.2, 8.5), wallMat);
  garage.position.set(8.5, 2.1, 0);
  house.add(garage);

  const garageRoof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.2, 4), roofMat);
  garageRoof.position.set(8.5, 5.3, 0);
  garageRoof.rotateY(Math.PI / 4);
  garageRoof.scale.set(1.2, 1, 1.4);
  house.add(garageRoof);

  // Garage Door
  const garageDoor = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 3.2, 0.15),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4, roughness: 0.6 })
  );
  garageDoor.position.set(8.5, 1.6, 4.3);
  house.add(garageDoor);

  // Decorative White Picket Fence
  for (let fx = -8; fx <= 12; fx += 1.4) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 0.12), fenceMat);
    post.position.set(fx, 0.5, 9.5);
    house.add(post);
  }
  const fenceRail = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 0.08), fenceMat);
  fenceRail.position.set(2, 0.6, 9.5);
  house.add(fenceRail);

  parent.add(house);

  // Register Harvestables inside House
  addHarvestable(harvestables, worldRootX + x - 3.2, 0, worldRootZ + z + 2.5, 'wall', 'wood', 120, 20, 1.4, 0.9);
  addHarvestable(harvestables, worldRootX + x - 5.0, 0, worldRootZ + z - 3.2, 'container', 'metal', 150, 30, 0.8, 2.2);
  addHarvestable(harvestables, worldRootX + x - 3.4, 3.4, worldRootZ + z + 0.5, 'wall', 'wood', 140, 25, 1.0, 2.4);

  // Register Perimeter Wall Colliders (Allowing Free Walkway into Interior through Front Door)
  // Left Exterior Wall
  colliders.push({
    type: 'box',
    minX: worldRootX + x - 6.1,
    maxX: worldRootX + x - 5.5,
    minY: 0,
    maxY: 6.8,
    minZ: worldRootZ + z - 5.6,
    maxZ: worldRootZ + z + 5.6,
    name: `${name} Left Wall`,
  });

  // Right Exterior Wall
  colliders.push({
    type: 'box',
    minX: worldRootX + x + 5.5,
    maxX: worldRootX + x + 6.1,
    minY: 0,
    maxY: 6.8,
    minZ: worldRootZ + z - 5.6,
    maxZ: worldRootZ + z + 5.6,
    name: `${name} Right Wall`,
  });

  // Back Exterior Wall
  colliders.push({
    type: 'box',
    minX: worldRootX + x - 6.0,
    maxX: worldRootX + x + 6.0,
    minY: 0,
    maxY: 6.8,
    minZ: worldRootZ + z - 5.6,
    maxZ: worldRootZ + z - 5.0,
    name: `${name} Back Wall`,
  });

  // Front Left Exterior Wall
  colliders.push({
    type: 'box',
    minX: worldRootX + x - 6.0,
    maxX: worldRootX + x - 1.2,
    minY: 0,
    maxY: 6.8,
    minZ: worldRootZ + z + 5.0,
    maxZ: worldRootZ + z + 5.6,
    name: `${name} Front Left Wall`,
  });

  // Front Right Exterior Wall
  colliders.push({
    type: 'box',
    minX: worldRootX + x + 1.2,
    maxX: worldRootX + x + 6.0,
    minY: 0,
    maxY: 6.8,
    minZ: worldRootZ + z + 5.0,
    maxZ: worldRootZ + z + 5.6,
    name: `${name} Front Right Wall`,
  });

  // Interior Divider Partition Wall
  colliders.push({
    type: 'box',
    minX: worldRootX + x + 0.3,
    maxX: worldRootX + x + 0.7,
    minY: 0,
    maxY: 3.4,
    minZ: worldRootZ + z - 5.2,
    maxZ: worldRootZ + z + 0.8,
    name: `${name} Interior Partition`,
  });

  // Garage Structure Solid Collider
  colliders.push({
    type: 'box',
    minX: worldRootX + x + 8.5 - 3.3,
    maxX: worldRootX + x + 8.5 + 3.3,
    minY: 0,
    maxY: 5.5,
    minZ: worldRootZ + z - 4.4,
    maxZ: worldRootZ + z + 4.4,
    name: `${name} Garage`,
  });
}

// -------------------------------------------------------------
// POI 3: DUSTY DEPOT (3 Industrial Warehouses & Container Yard)
// -------------------------------------------------------------
function buildDustyDepot(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const root = new THREE.Group();
  root.position.set(130, 0, -40);

  const depots = [
    { x: -18, z: 0, col: 0xdc2626, name: 'Red Depot Warehouse' },
    { x: 0, z: 0, col: 0x2563eb, name: 'Blue Depot Warehouse' },
    { x: 18, z: 0, col: 0x64748b, name: 'Gray Depot Warehouse' },
  ];

  depots.forEach((d) => {
    const warehouse = new THREE.Group();
    warehouse.position.set(d.x, 0, d.z);

    const warehouseWallMat = new THREE.MeshStandardMaterial({ color: d.col, roughness: 0.6, metalness: 0.4 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const rackMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.6 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });

    // 1. Interior Concrete Slab Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.2, 25.6), concreteMat);
    floor.position.y = 0.1;
    warehouse.add(floor);

    // 2. Walkable Hollow Warehouse Walls (Left, Right, Back, and Front with Open Bay Doors)
    const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 26), warehouseWallMat);
    leftW.position.set(-6.3, 4.0, 0);
    warehouse.add(leftW);

    const rightW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 26), warehouseWallMat);
    rightW.position.set(6.3, 4.0, 0);
    warehouse.add(rightW);

    const backW = new THREE.Mesh(new THREE.BoxGeometry(13, 8, 0.4), warehouseWallMat);
    backW.position.set(0, 4.0, -12.8);
    warehouse.add(backW);

    const frontL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 8, 0.4), warehouseWallMat);
    frontL.position.set(-4.5, 4.0, 12.8);
    warehouse.add(frontL);

    const frontR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 8, 0.4), warehouseWallMat);
    frontR.position.set(4.5, 4.0, 12.8);
    warehouse.add(frontR);

    const frontHeader = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.0, 0.4), warehouseWallMat);
    frontHeader.position.set(0, 6.5, 12.8);
    warehouse.add(frontHeader);

    // 3. Roof with Overhead Skylight
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(9.5, 3.8, 4),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    roof.position.y = 9.8;
    roof.rotateY(Math.PI / 4);
    roof.scale.set(1.15, 1, 2.0);
    warehouse.add(roof);

    // 4. Warehouse Interior Racks & Crates
    for (let rz = -8; rz <= 6; rz += 7) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.0, 4.5), rackMat);
      rack.position.set(-4.5, 2.5, rz);
      warehouse.add(rack);

      const woodenCrate = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), crateMat);
      woodenCrate.position.set(4.2, 0.9, rz);
      warehouse.add(woodenCrate);
    }

    root.add(warehouse);

    // Interior Chest inside Warehouse
    addChest(scene, chests, chestMeshes, colliders, 130 + d.x, 1.0, -40 + d.z - 6, 'chest');

    // Walkable Wall Colliders for Dusty Depot Warehouse
    colliders.push({
      type: 'box',
      minX: 130 + d.x - 6.6,
      maxX: 130 + d.x - 5.9,
      minY: 0,
      maxY: 8.5,
      minZ: -40 + d.z - 13.2,
      maxZ: -40 + d.z + 13.2,
      name: `${d.name} Left Wall`,
    });

    colliders.push({
      type: 'box',
      minX: 130 + d.x + 5.9,
      maxX: 130 + d.x + 6.6,
      minY: 0,
      maxY: 8.5,
      minZ: -40 + d.z - 13.2,
      maxZ: -40 + d.z + 13.2,
      name: `${d.name} Right Wall`,
    });

    colliders.push({
      type: 'box',
      minX: 130 + d.x - 6.6,
      maxX: 130 + d.x + 6.6,
      minY: 0,
      maxY: 8.5,
      minZ: -40 + d.z - 13.2,
      maxZ: -40 + d.z - 12.4,
      name: `${d.name} Back Wall`,
    });

    colliders.push({
      type: 'box',
      minX: 130 + d.x - 6.6,
      maxX: 130 + d.x - 2.8,
      minY: 0,
      maxY: 8.5,
      minZ: -40 + d.z + 12.4,
      maxZ: -40 + d.z + 13.2,
      name: `${d.name} Front Left Wall`,
    });

    colliders.push({
      type: 'box',
      minX: 130 + d.x + 2.8,
      maxX: 130 + d.x + 6.6,
      minY: 0,
      maxY: 8.5,
      minZ: -40 + d.z + 12.4,
      maxZ: -40 + d.z + 13.2,
      name: `${d.name} Front Right Wall`,
    });
    // Metal Shipping Containers
    addHarvestable(
      harvestables,
      130 + d.x + 9,
      0,
      -40 + d.z + 14,
      'container',
      'metal',
      400,
      30,
      2.5,
      3
    );
    colliders.push({
      type: 'box',
      minX: 130 + d.x + 9 - 1.6,
      maxX: 130 + d.x + 9 + 1.6,
      minY: 0,
      maxY: 3.2,
      minZ: -40 + d.z + 14 - 3.2,
      maxZ: -40 + d.z + 14 + 3.2,
      name: 'Shipping Container',
    });

    addChest(scene, chests, chestMeshes, colliders, 130 + d.x, 8.5, -40 + d.z, 'chest');
  });

  // Heavy Mudflap Truck at Industrial Depot
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 0, 0, 22, 0xd97706, 'Dusty Depot Mudflap Heavy', 'truck', 0);

  scene.add(root);
}

// -------------------------------------------------------------
// POI 4: SALTY SPRINGS
// -------------------------------------------------------------
function buildSaltySprings(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const root = new THREE.Group();
  root.position.set(40, 0, 120);

  // Gas Station Canopy
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0xef4444 })
  );
  canopy.position.set(0, 5.5, 0);
  root.add(canopy);

  // Gas station pillars
  for (const px of [-6, 6]) {
    for (const pz of [-4, 4]) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 5.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      pillar.position.set(px, 2.75, pz);
      root.add(pillar);

      colliders.push({
        type: 'cylinder',
        x: 40 + px,
        z: 120 + pz,
        radius: 0.5,
        minY: 0,
        maxY: 5.5,
        name: 'Gas Station Pillar',
      });
    }
  }

  // Gas Station Convenience Store
  const store = new THREE.Mesh(
    new THREE.BoxGeometry(14, 5.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
  );
  store.position.set(0, 2.75, -12);
  root.add(store);

  // Store Front Glass Windows
  const storeGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.7 })
  );
  storeGlass.position.set(0, 2.2, -6.95);
  root.add(storeGlass);

  colliders.push({
    type: 'box',
    minX: 40 - 7.2,
    maxX: 40 + 7.2,
    minY: 0,
    maxY: 5.5,
    minZ: 120 - 17.2,
    maxZ: 120 - 6.8,
    name: 'Salty Gas Station Shop',
  });

  // 3 Suburban homes in Salty Springs neighborhood
  addDetailedSuburbanHome(root, harvestables, colliders, 40, 120, -28, 20, 0x0284c7, 'Salty Blue Manor');
  addDetailedSuburbanHome(root, harvestables, colliders, 40, 120, 28, 20, 0xf59e0b, 'Salty Amber Villa');
  addDetailedSuburbanHome(root, harvestables, colliders, 40, 120, -28, -25, 0x10b981, 'Salty Green Home');

  // Gas Station Drivable Vehicles (Parked in dedicated parking stalls on sides, 100% off Salty Avenue)
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -14, 0, -8, 0x10b981, 'Salty Gas Sports Emerald', 'sports', 0);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 14, 0, -8, 0x3b82f6, 'Salty Gas SUV Cobalt', 'suv', 0);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -28, 0, 32, 0xef4444, 'Salty Whiplash Red', 'sports', Math.PI / 2);

  addChest(scene, chests, chestMeshes, colliders, 40, 5.8, 120, 'chest');
  addChest(scene, chests, chestMeshes, colliders, 40, 5.8, 120 - 12, 'rare_chest');

  scene.add(root);
}

// -------------------------------------------------------------
// SCENIC LITTLE LAKES (LOOT LAKE, PLEASANT POND, SALTY OASIS, ALPINE TARN, HOT SPRINGS)
// -------------------------------------------------------------
function createScenicLittleLakes(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  colliders: SolidCollider[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>
) {
  const lakeWaterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.08,
    metalness: 0.85,
    transparent: true,
    opacity: 0.82,
    polygonOffset: true,
    polygonOffsetFactor: -0.5,
    polygonOffsetUnits: -0.5,
  });

  const oasisWaterMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.05,
    metalness: 0.9,
    transparent: true,
    opacity: 0.85,
  });

  const geothermalWaterMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.1,
    metalness: 0.7,
    transparent: true,
    opacity: 0.78,
  });

  const woodDockMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const lilyPadMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
  const lotusFlowerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.7 });

  // 1. Loot Lake Shimmering Water Ring (around central island Manor)
  const lootWater = new THREE.Mesh(new THREE.RingGeometry(8.5, 26, 32), lakeWaterMat);
  lootWater.rotateX(-Math.PI / 2);
  lootWater.position.set(-60, -0.05, -70);
  scene.add(lootWater);

  // 2. Pleasant Park Duck Pond (at -185, -140)
  const pleasantPond = new THREE.Mesh(new THREE.CircleGeometry(16, 24), lakeWaterMat);
  pleasantPond.rotateX(-Math.PI / 2);
  pleasantPond.position.set(-185, -0.05, -140);
  scene.add(pleasantPond);

  // Pleasant Park Fishing Pier & Bench
  const pleasantPier = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.4, 12), woodDockMat);
  pleasantPier.position.set(-185, 0.1, -140 + 10);
  scene.add(pleasantPier);
  colliders.push({
    type: 'box',
    minX: -185 - 1.8,
    maxX: -185 + 1.8,
    minY: -0.2,
    maxY: 0.5,
    minZ: -140 + 4,
    maxZ: -140 + 16,
    name: 'Pleasant Duck Pond Pier',
  });
  addChest(scene, chests, chestMeshes, colliders, -185, 0.5, -140 + 14, 'chest');

  // 3. Salty Springs Oasis Pond (at 75, 155)
  const saltyOasis = new THREE.Mesh(new THREE.CircleGeometry(14, 24), oasisWaterMat);
  saltyOasis.rotateX(-Math.PI / 2);
  saltyOasis.position.set(75, -0.05, 155);
  scene.add(saltyOasis);

  // Oasis Palm Trees & Deck
  const oasisDeck = new THREE.Mesh(new THREE.BoxGeometry(4, 0.35, 8), woodDockMat);
  oasisDeck.position.set(75 + 10, 0.1, 155);
  scene.add(oasisDeck);
  colliders.push({
    type: 'box',
    minX: 75 + 8,
    maxX: 75 + 12,
    minY: -0.2,
    maxY: 0.5,
    minZ: 155 - 4,
    maxZ: 155 + 4,
    name: 'Oasis Deck',
  });
  addChest(scene, chests, chestMeshes, colliders, 75 + 10, 0.5, 155, 'rare_chest');

  // 4. Southern Alpine Mountain Tarn (at 85, -170)
  const alpineLake = new THREE.Mesh(new THREE.CircleGeometry(17, 24), lakeWaterMat);
  alpineLake.rotateX(-Math.PI / 2);
  alpineLake.position.set(85, -0.05, -170);
  scene.add(alpineLake);

  // Alpine Bridge spanning lake edge
  const alpineBridge = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 14), woodDockMat);
  alpineBridge.position.set(85, 0.2, -170 + 11);
  scene.add(alpineBridge);
  colliders.push({
    type: 'box',
    minX: 85 - 1.8,
    maxX: 85 + 1.8,
    minY: 0,
    maxY: 0.8,
    minZ: -170 + 4,
    maxZ: -170 + 18,
    name: 'Alpine Lake Bridge',
  });
  addChest(scene, chests, chestMeshes, colliders, 85, 0.6, -170 + 11, 'chest');

  // 5. Volcanic Geothermal Thermal Pools (at 130, 190)
  const geoPool = new THREE.Mesh(new THREE.CircleGeometry(13, 20), geothermalWaterMat);
  geoPool.rotateX(-Math.PI / 2);
  geoPool.position.set(130, -0.05, 190);
  scene.add(geoPool);

  // 6. Sapphire Lake & Marina (at 160, -160)
  const sapphireLake = new THREE.Mesh(new THREE.CircleGeometry(24, 32), lakeWaterMat);
  sapphireLake.rotateX(-Math.PI / 2);
  sapphireLake.position.set(160, -0.05, -160);
  scene.add(sapphireLake);

  // Sapphire Lake Boathouse Dock & Fishing Pier
  const sapphirePier = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.45, 18), woodDockMat);
  sapphirePier.position.set(160, 0.12, -160 + 12);
  scene.add(sapphirePier);
  colliders.push({
    type: 'box',
    minX: 160 - 2.4,
    maxX: 160 + 2.4,
    minY: 0,
    maxY: 0.8,
    minZ: -160 + 3,
    maxZ: -160 + 21,
    name: 'Sapphire Marina Pier',
  });
  addChest(scene, chests, chestMeshes, colliders, 160, 0.6, -160 + 17, 'rare_chest');

  // 7. Emerald Meadow Lake (at -160, 150)
  const emeraldLake = new THREE.Mesh(new THREE.CircleGeometry(22, 32), lakeWaterMat);
  emeraldLake.rotateX(-Math.PI / 2);
  emeraldLake.position.set(-160, -0.05, 150);
  scene.add(emeraldLake);

  // Emerald Lake Arched Footbridge
  const emeraldBridge = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 16), woodDockMat);
  emeraldBridge.position.set(-160, 0.22, 150);
  scene.add(emeraldBridge);
  colliders.push({
    type: 'box',
    minX: -160 - 2.0,
    maxX: -160 + 2.0,
    minY: 0,
    maxY: 0.85,
    minZ: 150 - 8,
    maxZ: 150 + 8,
    name: 'Emerald Footbridge',
  });
  addChest(scene, chests, chestMeshes, colliders, -160, 0.65, 150, 'chest');

  // 8. Whispering Pines Lake (at -170, -50)
  const whisperingLake = new THREE.Mesh(new THREE.CircleGeometry(18, 28), lakeWaterMat);
  whisperingLake.rotateX(-Math.PI / 2);
  whisperingLake.position.set(-170, -0.05, -50);
  scene.add(whisperingLake);

  const whisperingDock = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.4, 12), woodDockMat);
  whisperingDock.position.set(-170, 0.12, -50 + 8);
  scene.add(whisperingDock);
  colliders.push({
    type: 'box',
    minX: -170 - 2.2,
    maxX: -170 + 2.2,
    minY: 0,
    maxY: 0.8,
    minZ: -50 + 2,
    maxZ: -50 + 14,
    name: 'Whispering Pines Dock',
  });
  addChest(scene, chests, chestMeshes, colliders, -170, 0.6, -50 + 11, 'chest');

  // 9. Crystal Springs Lagoon (at 180, 30)
  const crystalLagoon = new THREE.Mesh(new THREE.CircleGeometry(20, 28), oasisWaterMat);
  crystalLagoon.rotateX(-Math.PI / 2);
  crystalLagoon.position.set(180, -0.05, 30);
  scene.add(crystalLagoon);

  const crystalDeck = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.4, 10), woodDockMat);
  crystalDeck.position.set(180 + 9, 0.15, 30);
  scene.add(crystalDeck);
  colliders.push({
    type: 'box',
    minX: 180 + 6,
    maxX: 180 + 12,
    minY: 0,
    maxY: 0.8,
    minZ: 30 - 5,
    maxZ: 30 + 5,
    name: 'Crystal Springs Deck',
  });
  addChest(scene, chests, chestMeshes, colliders, 180 + 9, 0.65, 30, 'rare_chest');

  // 10. Community Parks on Open Terrain (Gazebos, Fountains, Flowerbeds, Benches)
  // A. Pleasant Meadows Central Park (at -90, -150)
  const parkStoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
  const gazeboWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const gazeboRoofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
  const flowerMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
  const flowerMatYellow = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 });

  const parkA = new THREE.Group();
  parkA.position.set(-90, 0, -150);

  // Cobblestone Plaza Ring
  const plazaRingA = new THREE.Mesh(new THREE.RingGeometry(2, 14, 24), parkStoneMat);
  plazaRingA.rotateX(-Math.PI / 2);
  plazaRingA.position.y = 0.04;
  parkA.add(plazaRingA);

  // Victorian White Gazebo
  for (let g = 0; g < 6; g++) {
    const angle = (g / 6) * Math.PI * 2;
    const px = Math.cos(angle) * 4.2;
    const pz = Math.sin(angle) * 4.2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 4.2, 6), gazeboWhiteMat);
    post.position.set(px, 2.1, pz);
    parkA.add(post);
  }
  const gazeboRoof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.5, 6), gazeboRoofMat);
  gazeboRoof.position.y = 5.2;
  parkA.add(gazeboRoof);

  // Central Stone Fountain in Gazebo
  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.8, 16), parkStoneMat);
  fountainBase.position.y = 0.4;
  parkA.add(fountainBase);
  const fountainWater = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), lakeWaterMat);
  fountainWater.rotateX(-Math.PI / 2);
  fountainWater.position.y = 0.78;
  parkA.add(fountainWater);

  scene.add(parkA);
  colliders.push({
    type: 'cylinder',
    x: -90,
    z: -150,
    radius: 4.5,
    minY: 0,
    maxY: 6.5,
    name: 'Pleasant Meadows Gazebo',
  });
  addChest(scene, chests, chestMeshes, colliders, -90, 1.2, -150, 'chest');

  // B. Victory Botanical Gardens & Pergola (at 40, -150)
  const parkB = new THREE.Group();
  parkB.position.set(40, 0, -150);

  // Wooden Pergola Canopy Walkway
  const pergolaWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
  for (let col = -6; col <= 6; col += 4) {
    const postL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.8, 0.3), pergolaWoodMat);
    postL.position.set(-3.2, 1.9, col);
    parkB.add(postL);
    const postR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.8, 0.3), pergolaWoodMat);
    postR.position.set(3.2, 1.9, col);
    parkB.add(postR);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.25, 0.35), pergolaWoodMat);
    beam.position.set(0, 3.8, col);
    parkB.add(beam);
  }
  // Flower Planter Beds
  for (let fb = -5; fb <= 5; fb += 5) {
    const planterL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 3.2), parkStoneMat);
    planterL.position.set(-4.5, 0.25, fb);
    parkB.add(planterL);
    const flowersL = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 3.0), flowerMatRed);
    flowersL.position.set(-4.5, 0.55, fb);
    parkB.add(flowersL);

    const planterR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 3.2), parkStoneMat);
    planterR.position.set(4.5, 0.25, fb);
    parkB.add(planterR);
    const flowersR = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 3.0), flowerMatYellow);
    flowersR.position.set(4.5, 0.55, fb);
    parkB.add(flowersR);
  }
  scene.add(parkB);
  colliders.push({
    type: 'box',
    minX: 40 - 4,
    maxX: 40 + 4,
    minY: 0,
    maxY: 4.5,
    minZ: -150 - 8,
    maxZ: -150 + 8,
    name: 'Victory Botanical Pergola',
  });
  addChest(scene, chests, chestMeshes, colliders, 40, 0.5, -150, 'rare_chest');

  // C. Sunset Valley Community Park & Pavilion (at -120, 130)
  const parkC = new THREE.Group();
  parkC.position.set(-120, 0, 130);

  // Park Shelter Pavilion
  const shelterPillars = [
    [-4, -3],
    [4, -3],
    [-4, 3],
    [4, 3],
  ];
  for (const [px, pz] of shelterPillars) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.5, 0.35), gazeboWhiteMat);
    post.position.set(px, 1.75, pz);
    parkC.add(post);
  }
  const shelterRoof = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.5, 7.5), gazeboRoofMat);
  shelterRoof.position.set(0, 3.6, 0);
  parkC.add(shelterRoof);

  // Picnic Tables inside Pavilion
  const picnicTableMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.7, 1.4), picnicTableMat);
  table.position.set(0, 0.35, 0);
  parkC.add(table);

  scene.add(parkC);
  colliders.push({
    type: 'box',
    minX: -120 - 5,
    maxX: -120 + 5,
    minY: 0,
    maxY: 4.2,
    minZ: 130 - 4,
    maxZ: 130 + 4,
    name: 'Sunset Valley Park Pavilion',
  });
  addChest(scene, chests, chestMeshes, colliders, -120, 0.9, 130, 'chest');

  // Floating Lily Pads & Lotus Blossoms on lakes
  const lakeCenters = [
    { x: -60, z: -70, r: 18 },
    { x: -185, z: -140, r: 11 },
    { x: 75, z: 155, r: 9 },
    { x: 85, z: -170, r: 12 },
    { x: 160, z: -160, r: 18 },
    { x: -160, z: 150, r: 16 },
    { x: -170, z: -50, r: 14 },
    { x: 180, z: 30, r: 15 },
  ];

  lakeCenters.forEach((lc) => {
    for (let p = 0; p < 7; p++) {
      const angle = (p / 7) * Math.PI * 2 + 0.3;
      const dist = 5 + (p % 4) * 2.8;
      const lx = lc.x + Math.cos(angle) * dist;
      const lz = lc.z + Math.sin(angle) * dist;

      // Lily Pad
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.7, 8), lilyPadMat);
      pad.rotateX(-Math.PI / 2);
      pad.position.set(lx, -0.02, lz);
      scene.add(pad);

      // Lotus Flower on some pads
      if (p % 2 === 0) {
        const flower = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 6), lotusFlowerMat);
        flower.position.set(lx, 0.15, lz);
        scene.add(flower);
      }
    }

    // Lake Shoreline Reeds & Cattails
    for (let r = 0; r < 8; r++) {
      const rAngle = (r / 8) * Math.PI * 2;
      const rx = lc.x + Math.cos(rAngle) * (lc.r + 1.2);
      const rz = lc.z + Math.sin(rAngle) * (lc.r + 1.2);
      const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.8, 5), reedMat);
      reed.position.set(rx, 0.9, rz);
      scene.add(reed);
    }
  });
}

// -------------------------------------------------------------
// POI 5: LOOT LAKE
// -------------------------------------------------------------
function buildLootLake(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const root = new THREE.Group();
  root.position.set(-60, 0, -70);

  // Central Lake Island House
  const house = new THREE.Group();
  house.position.set(0, 0.2, 0);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(14, 6, 14),
    new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 })
  );
  base.position.y = 3;
  house.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(11, 5, 4),
    new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 })
  );
  roof.position.y = 8.5;
  roof.rotateY(Math.PI / 4);
  house.add(roof);

  root.add(house);

  colliders.push({
    type: 'box',
    minX: -60 - 7.2,
    maxX: -60 + 7.2,
    minY: 0,
    maxY: 9.5,
    minZ: -70 - 7.2,
    maxZ: -70 + 7.2,
    name: 'Loot Lake Manor',
  });

  // Boat Dock & Pier (Solid)
  const dock = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.4, 16),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
  );
  dock.position.set(0, 0.1, 14);
  root.add(dock);

  colliders.push({
    type: 'box',
    minX: -60 - 2.1,
    maxX: -60 + 2.1,
    minY: 0,
    maxY: 0.5,
    minZ: -70 + 6,
    maxZ: -70 + 22,
    name: 'Lake Wooden Pier',
  });

  addChest(scene, chests, chestMeshes, colliders, -60, 9.0, -70, 'rare_chest');
  addChest(scene, chests, chestMeshes, colliders, -60, 0.6, -70 + 14, 'chest');

  // Quadercrasher ATV parked at lake overlook
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 28, 0, 18, 0x8b5cf6, 'Loot Lake Quadcrasher ATV', 'quadcrasher', 0.8);

  scene.add(root);
}

// -------------------------------------------------------------
// POI 6: RETAIL ROW
// -------------------------------------------------------------
function buildRetailRow(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const root = new THREE.Group();
  root.position.set(150, 0, 120);

  // NOMS Supermarket
  const store = new THREE.Mesh(
    new THREE.BoxGeometry(24, 7.5, 18),
    new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.7 })
  );
  store.position.y = 3.75;
  root.add(store);

  // Supermarket Windows
  const storeGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.7 })
  );
  storeGlass.position.set(0, 3, 9.05);
  root.add(storeGlass);

  colliders.push({
    type: 'box',
    minX: 150 - 12.2,
    maxX: 150 + 12.2,
    minY: 0,
    maxY: 8.0,
    minZ: 120 - 9.2,
    maxZ: 120 + 9.2,
    name: 'NOMS Supermarket',
  });

  // Store Sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(10, 2.4, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xfacc15 })
  );
  sign.position.set(0, 9, 9.2);
  root.add(sign);

  // Taco Shop
  const tacoShop = new THREE.Mesh(
    new THREE.BoxGeometry(18, 6.5, 16),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
  );
  tacoShop.position.set(-28, 3.25, 0);
  root.add(tacoShop);

  colliders.push({
    type: 'box',
    minX: 150 - 28 - 9.2,
    maxX: 150 - 28 + 9.2,
    minY: 0,
    maxY: 7.0,
    minZ: 120 - 8.2,
    maxZ: 120 + 8.2,
    name: 'Retail Row Taco Shop',
  });

  // 2 Suburban Homes in Retail Row East
  addDetailedSuburbanHome(root, harvestables, colliders, 150, 120, 28, -25, 0x3b82f6, 'Retail Row Home Alpha');
  addDetailedSuburbanHome(root, harvestables, colliders, 150, 120, -28, -25, 0x10b981, 'Retail Row Home Bravo');

  // Retail Row Parking Lot Vehicles
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 0, 0, 18, 0x10b981, 'Retail NOMS Delivery Truck', 'truck', Math.PI);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -14, 0, 18, 0xef4444, 'Retail Sports Car Ruby', 'sports', Math.PI);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 18, 0, 18, 0xf59e0b, 'Retail Taxi Prevalent', 'sports', Math.PI);

  addChest(scene, chests, chestMeshes, colliders, 150, 8.0, 120, 'chest');
  addChest(scene, chests, chestMeshes, colliders, 150 - 5, 8.0, 120 - 5, 'rare_chest');

  scene.add(root);
}

// -------------------------------------------------------------
// POI 7: SNOBBY SHORES (Luxury Waterfront Estates & Garages)
// -------------------------------------------------------------
function buildSnobbyShores(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const root = new THREE.Group();
  root.position.set(-200, 0, 20);

  const luxuryMansions = [
    { x: 0, z: -35, col: 0xf8fafc, name: 'Modern White Villa' },
    { x: 0, z: 0, col: 0x0f172a, name: 'Cyber Obsidian Estate' },
    { x: 0, z: 35, col: 0x1e293b, name: 'Azure Waterfront Mansion' },
  ];

  luxuryMansions.forEach((m) => {
    const mansion = new THREE.Group();
    mansion.position.set(m.x, 0, m.z);

    const lowerFloor = new THREE.Mesh(
      new THREE.BoxGeometry(16, 4.5, 14),
      new THREE.MeshStandardMaterial({ color: m.col, roughness: 0.4 })
    );
    lowerFloor.position.y = 2.25;
    mansion.add(lowerFloor);

    const upperFloor = new THREE.Mesh(
      new THREE.BoxGeometry(12, 3.8, 10),
      new THREE.MeshStandardMaterial({ color: m.col, roughness: 0.4 })
    );
    upperFloor.position.set(0, 6.4, 0);
    mansion.add(upperFloor);

    const glassBalcony = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
    );
    glassBalcony.position.set(0, 5.1, 5.5);
    mansion.add(glassBalcony);

    const patio = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.3, roughness: 0.8 })
    );
    patio.position.set(14, 0.1, 0);
    mansion.add(patio);

    // Sun deck lounge chairs
    for (const cz of [-3, 0, 3]) {
      const lounger = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.3, 2.4),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
      );
      lounger.position.set(14, 0.35, cz);
      mansion.add(lounger);
    }

    root.add(mansion);

    colliders.push({
      type: 'box',
      minX: -200 + m.x - 8.5,
      maxX: -200 + m.x + 8.5,
      minY: 0,
      maxY: 8.5,
      minZ: 20 + m.z - 7.5,
      maxZ: 20 + m.z + 7.5,
      name: m.name,
    });

    addChest(scene, chests, chestMeshes, colliders, -200 + m.x, 8.8, 20 + m.z, 'rare_chest');
  });

  // Sports Cars parked in Snobby Shores private mansion forecourts (100% off driveway lanes)
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -14, 0, -27, 0xfacc15, 'Snobby Gold GT Supercar', 'sports', Math.PI / 2);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -14, 0, 8, 0xef4444, 'Snobby Rosso Corsa GT', 'sports', Math.PI / 2);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -14, 0, 43, 0x38bdf8, 'Snobby Miami Blue GT', 'sports', Math.PI / 2);

  scene.add(root);
}

// -------------------------------------------------------------
// GEOLOGICAL FEATURE 1: GRAND CANYON & ROPE SUSPENSION BRIDGE
// -------------------------------------------------------------
function buildGrandCanyonAndBridge(
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
function buildVolcanoAndHotSprings(
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
function buildWaterfallAndDam(scene: THREE.Scene, colliders: SolidCollider[]) {
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
function buildMountainPeaks(scene: THREE.Scene, colliders: SolidCollider[]) {
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

// Helper: Ultra-Detailed Drivable Vehicle with Functional Doors, Wheels, Headlights, Taillights, Interior & Exhaust
export function addDetailedDrivableVehicle(
  parent: THREE.Group,
  harvestables: HarvestableObject[],
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[],
  x: number,
  y: number,
  z: number,
  color: number = 0xef4444,
  name: string = 'Whiplash GT',
  type: 'sports' | 'suv' | 'truck' | 'quadcrasher' = 'sports',
  rotY: number = 0
): DrivableVehicle {
  const carGroup = new THREE.Group();
  carGroup.position.set(x, y, z);
  carGroup.rotation.y = rotY;

  const paintMat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.85,
    roughness: 0.25,
  });
  const blackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.8,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    metalness: 0.2,
    roughness: 0.1,
    transparent: true,
    opacity: 0.22, // Crystal-clear cockpit windshield for first-person driving clarity
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.95,
    roughness: 0.1,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.9,
  });

  // Lower Chassis & Underbody
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, 4.6), blackTrimMat);
  chassis.position.y = 0.45;
  chassis.castShadow = true;
  carGroup.add(chassis);

  // Main Sculpted Body & Hood
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 4.4), paintMat);
  mainBody.position.set(0, 0.8, 0);
  mainBody.castShadow = true;
  carGroup.add(mainBody);

  // Hood Scoop & Aerodynamic Nose
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 1.6), paintMat);
  hood.position.set(0, 1.1, -1.2);
  hood.rotation.x = 0.12;
  carGroup.add(hood);

  // Cabin & Roof
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 2.3), glassMat);
  cabin.position.set(0, 1.5, 0.1);
  carGroup.add(cabin);

  // Roof panel
  const roofTop = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 1.9), paintMat);
  roofTop.position.set(0, 1.9, 0.1);
  carGroup.add(roofTop);

  // LEFT DOOR with Chrome Handle & Seam
  const leftDoor = new THREE.Group();
  leftDoor.position.set(-1.11, 0.9, 0.0);
  const leftDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 1.5), paintMat);
  leftDoor.add(leftDoorPanel);
  const leftDoorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.22), chromeMat);
  leftDoorHandle.position.set(-0.04, 0.1, 0.4);
  leftDoor.add(leftDoorHandle);
  const leftMirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.14), paintMat);
  leftMirror.position.set(-0.15, 0.45, -0.6);
  leftDoor.add(leftMirror);
  carGroup.add(leftDoor);

  // RIGHT DOOR with Chrome Handle & Seam
  const rightDoor = new THREE.Group();
  rightDoor.position.set(1.11, 0.9, 0.0);
  const rightDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 1.5), paintMat);
  rightDoor.add(rightDoorPanel);
  const rightDoorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.22), chromeMat);
  rightDoorHandle.position.set(0.04, 0.1, 0.4);
  rightDoor.add(rightDoorHandle);
  const rightMirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.14), paintMat);
  rightMirror.position.set(0.15, 0.45, -0.6);
  rightDoor.add(rightMirror);
  carGroup.add(rightDoor);

  // Interior: Dashboard, Speedometer Gauge & Sports Steering Wheel
  const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.4), blackTrimMat);
  dashboard.position.set(0, 1.25, -0.8);
  carGroup.add(dashboard);

  // Digital Speedometer Cluster Glow
  const gaugeCluster = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.16, 0.05),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  gaugeCluster.position.set(-0.45, 1.32, -0.68);
  gaugeCluster.rotation.x = -0.2;
  carGroup.add(gaugeCluster);

  const steeringPivot = new THREE.Group();
  steeringPivot.name = 'steering_pivot';
  steeringPivot.position.set(-0.45, 1.35, -0.62);
  steeringPivot.rotation.x = Math.PI / 4;

  const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), chromeMat);
  steeringWheel.name = 'steering_wheel';
  steeringPivot.add(steeringWheel);
  carGroup.add(steeringPivot);

  // Dual Sports Bucket Seats
  for (const sx of [-0.45, 0.45]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.55), blackTrimMat);
    seat.position.set(sx, 1.2, 0.1);
    carGroup.add(seat);
  }

  // Front High-Beam Headlights & Projector Assemblies
  const headLightGeo = new THREE.BoxGeometry(0.42, 0.18, 0.08);
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const hlL = new THREE.Mesh(headLightGeo, headLightMat);
  hlL.position.set(-0.75, 0.8, -2.22);
  carGroup.add(hlL);
  const hlR = new THREE.Mesh(headLightGeo, headLightMat);
  hlR.position.set(0.75, 0.8, -2.22);
  carGroup.add(hlR);

  // Chrome Bezel Housing
  for (const hx of [-0.75, 0.75]) {
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.04), chromeMat);
    bezel.position.set(hx, 0.8, -2.2);
    carGroup.add(bezel);
  }

  // Rear LED Taillight Bar
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const tl = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.08), tailLightMat);
  tl.position.set(0, 0.85, 2.22);
  carGroup.add(tl);

  // Rear GT Racing Spoiler Wing
  const spoilerPillarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.15), blackTrimMat);
  spoilerPillarL.position.set(-0.7, 1.25, 2.0);
  carGroup.add(spoilerPillarL);
  const spoilerPillarR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.15), blackTrimMat);
  spoilerPillarR.position.set(0.7, 1.25, 2.0);
  carGroup.add(spoilerPillarR);
  const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.4), paintMat);
  spoilerWing.position.set(0, 1.42, 2.0);
  carGroup.add(spoilerWing);

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16);
  wheelGeo.rotateZ(Math.PI / 2);

  const frontLeftPivot = new THREE.Group();
  frontLeftPivot.position.set(-1.15, 0.42, -1.4);
  const flWheel = new THREE.Mesh(wheelGeo, tireMat);
  flWheel.castShadow = true;
  frontLeftPivot.add(flWheel);
  carGroup.add(frontLeftPivot);

  const frontRightPivot = new THREE.Group();
  frontRightPivot.position.set(1.15, 0.42, -1.4);
  const frWheel = new THREE.Mesh(wheelGeo, tireMat);
  frWheel.castShadow = true;
  frontRightPivot.add(frWheel);
  carGroup.add(frontRightPivot);

  const rlWheel = new THREE.Mesh(wheelGeo, tireMat);
  rlWheel.position.set(-1.15, 0.42, 1.4);
  rlWheel.castShadow = true;
  carGroup.add(rlWheel);

  const rrWheel = new THREE.Mesh(wheelGeo, tireMat);
  rrWheel.position.set(1.15, 0.42, 1.4);
  rrWheel.castShadow = true;
  carGroup.add(rrWheel);

  parent.add(carGroup);

  const vehicle: DrivableVehicle = {
    id: `veh_${vehicles.length}_${Math.floor(x)}_${Math.floor(z)}`,
    name,
    type,
    x: parent.position.x + x,
    y: parent.position.y + y,
    z: parent.position.z + z,
    rotY,
    speed: 0,
    maxSpeed: type === 'sports' ? 28 : 22,
    steerAngle: 0,
    health: 800,
    maxHealth: 800,
    nitro: 100,
    color,
    driverId: null,
    meshGroup: carGroup,
    leftDoorOpen: false,
    rightDoorOpen: false,
  };

  (carGroup as any)._frontLeftPivot = frontLeftPivot;
  (carGroup as any)._frontRightPivot = frontRightPivot;
  (carGroup as any)._flWheel = flWheel;
  (carGroup as any)._frWheel = frWheel;
  (carGroup as any)._rlWheel = rlWheel;
  (carGroup as any)._rrWheel = rrWheel;
  (carGroup as any)._leftDoor = leftDoor;
  (carGroup as any)._rightDoor = rightDoor;

  vehicles.push(vehicle);

  addHarvestable(harvestables, parent.position.x + x, parent.position.y + y, parent.position.z + z, 'car', 'metal', 400, 30, 2.5, 2.5);

  colliders.push({
    type: 'box',
    minX: parent.position.x + x - 1.4,
    maxX: parent.position.x + x + 1.4,
    minY: parent.position.y + y,
    maxY: parent.position.y + y + 2.4,
    minZ: parent.position.z + z - 2.6,
    maxZ: parent.position.z + z + 2.6,
    name: `${name} (Drivable Vehicle)`,
  });

  return vehicle;
}

// Fallback Helper for simple parked cars
function addCar(
  parent: THREE.Group,
  harvestables: HarvestableObject[],
  colliders: SolidCollider[],
  x: number,
  y: number,
  z: number,
  color: number
) {
  const dummyVehicles: DrivableVehicle[] = [];
  addDetailedDrivableVehicle(parent, harvestables, colliders, dummyVehicles, x, y, z, color, 'Sedan Car', 'sports', 0);
}

// Helper: Dumpster (Solid)
function addDumpster(
  parent: THREE.Group,
  harvestables: HarvestableObject[],
  colliders: SolidCollider[],
  x: number,
  y: number,
  z: number
) {
  const dumpster = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.8, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x15803d, metalness: 0.7, roughness: 0.4 })
  );
  dumpster.position.set(x, y + 0.9, z);
  parent.add(dumpster);

  addHarvestable(harvestables, x, y, z, 'container', 'metal', 300, 25, 2, 2);
  colliders.push({
    type: 'box',
    minX: x - 1.2,
    maxX: x + 1.2,
    minY: y,
    maxY: y + 2.0,
    minZ: z - 1.8,
    maxZ: z + 1.8,
    name: 'Alley Dumpster',
  });
}

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
