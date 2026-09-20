// Terrain height, road/lake spatial queries, and shared world-gen result types.
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
