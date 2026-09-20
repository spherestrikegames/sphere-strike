import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider, DrivableVehicle } from '../types';
import { UpgradeBenchStation, createUpgradeBenchMesh } from './fortniteWorldArena';
import { buildGrandCanyonAndBridge, buildMountainPeaks, buildVolcanoAndHotSprings, buildWaterfallAndDam } from './fortniteWorldLandmarks';
import { buildMegaCity } from './fortniteWorldMegaCity';
import { populateNature } from './fortniteWorldNature';
import { buildPleasantPark, populateLushGrass } from './fortniteWorldNeighborhoods';
import { createCityRoadNetwork } from './fortniteWorldRoads';
import { SKYSCRAPER_LAUNCH_PADS, getTerrainHeight, isPointNearRoad } from './fortniteWorldTerrain';
import { buildDustyDepot, buildRetailRow, buildSaltySprings, buildSnobbyShores } from './fortniteWorldTowns';
import { buildLootLake, createScenicLittleLakes } from './fortniteWorldWaterFeatures';

// This file is the world-generation entry point: buildFortniteIsland() orchestrates all
// the POI/terrain builders below, which now live in their own files. Every symbol that used
// to be exported from here is re-exported so existing imports of './fortniteWorld' keep working.


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

// --- Re-exports (preserve the original public surface of this file) ---
export { createUpgradeBenchMesh, build1v1Arena } from './fortniteWorldArena';
export type { UpgradeBenchStation } from './fortniteWorldArena';
export { createHarvestableTree } from './fortniteWorldNature';
export { SKYSCRAPER_LAUNCH_PADS, isPointInLake, isPointInsideStructureOrNoSpawnZone, isPointNearRoad, isPointOnRoad, getTerrainHeight, getGroundSurface } from './fortniteWorldTerrain';
export type { WorldGenResult, SkyscraperLaunchPad } from './fortniteWorldTerrain';
export { addDetailedDrivableVehicle } from './fortniteWorldVehiclesProps';
