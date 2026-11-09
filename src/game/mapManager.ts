import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider, DrivableVehicle, BattlegroundMap } from '../types';
import { UpgradeBenchStation, createUpgradeBenchMesh } from './fortniteWorldArena';
import { addDetailedDrivableVehicle } from './fortniteWorldVehiclesProps';
import { addChest, addHarvestable } from './fortniteWorldNature';
import { SKYSCRAPER_LAUNCH_PADS } from './fortniteWorldTerrain';

export interface MapMetadata {
  id: 0 | 1 | 2;
  key: BattlegroundMap;
  name: string;
  theme: string;
  tag: string;
  description: string;
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  ambientColor: number;
  sunColor: number;
  sunIntensity: number;
}

export const MAP_METADATA_LIST: MapMetadata[] = [
  {
    id: 0,
    key: 'pinecrest_suburb',
    name: 'Pinecrest Suburb',
    theme: 'Town',
    tag: 'TOWN THEME',
    description: 'Residential loop, sidewalk curbs, 3 enterable 2-story homes with walkout sniper balconies & town plaza fountain.',
    skyColor: 0x38bdf8,
    fogColor: 0x7dd3fc,
    fogDensity: 0.0035,
    ambientColor: 0xfff7ed,
    sunColor: 0xffedd5,
    sunIntensity: 2.4,
  },
  {
    id: 1,
    key: 'apex_metropolis',
    name: 'Apex Metropolis',
    theme: 'City',
    tag: 'CITY THEME',
    description: 'Concrete avenue grid, towering skyline, enterable corporate tower with mezzanine skybridge & rooftop helipad.',
    skyColor: 0x1e293b,
    fogColor: 0x334155,
    fogDensity: 0.0028,
    ambientColor: 0x94a3b8,
    sunColor: 0xe2e8f0,
    sunIntensity: 2.2,
  },
  {
    id: 2,
    key: 'harvest_ridge',
    name: 'Harvest Ridge',
    theme: 'Country',
    tag: 'COUNTRY THEME',
    description: 'Rolling grassy hills, dried creek ravine, 2-story timber Dutch Barn with hayloft, country farmhouse & grain silo.',
    skyColor: 0xfde047,
    fogColor: 0xfef08a,
    fogDensity: 0.0022,
    ambientColor: 0xffedd5,
    sunColor: 0xfef9c3,
    sunIntensity: 2.5,
  },
];

export interface MapDataResult {
  metadata: MapMetadata;
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
}

/**
 * Procedural Heightfield & Multi-Tier Elevation Engine Function
 * Defines leveled plateaus, stepped hills, sunken culverts, terraced cliffs, and graded slopes.
 */
export function getTerrainHeight(x: number, z: number, mapTheme: string = 'pinecrest_suburb'): number {
  const mapIdx = MapManager.resolveMapIndex(mapTheme);
  if (mapIdx === 1) {
    // Apex Metropolis (City Theme)
    if (x > 18 && x < 38 && z > 8 && z < 28) return -3.8;
    if (z < -65) return 4.5;
    if (x < -80 && z > 50) return 3.2;
    return 0.0;
  } else if (mapIdx === 2) {
    // Harvest Ridge (Country Theme)
    const creekCenterZ = 40 + Math.sin(x * 0.02) * 8;
    const creekDist = Math.abs(z - creekCenterZ);
    if (creekDist < 16) {
      return -2.8 * Math.cos((creekDist / 16) * (Math.PI / 2));
    }
    if (z < -60) {
      const distN = Math.hypot(x - 30, z - -100);
      if (distN < 55) {
        return 6.5 * Math.cos((distN / 55) * (Math.PI / 2));
      }
    }
    if (x > -70 && x < 20 && z > -45 && z < 15) {
      return 0.2;
    }
    return Math.sin(x * 0.035) * Math.cos(z * 0.035) * 3.2 + Math.cos(x * 0.02) * 0.6;
  } else {
    // Pinecrest Suburb (Town Theme)
    if (z > 42 && z < 78) {
      const canalDist = Math.abs(z - 60);
      if (canalDist < 14) {
        return -2.2 * Math.cos((canalDist / 14) * (Math.PI / 2));
      }
    }
    if (z < -80) {
      const ridgeDepth = Math.min(30, -80 - z);
      return (ridgeDepth / 30) * 6.5 + Math.sin(x * 0.04) * 0.8;
    }
    const distW = Math.hypot(x - -120, z - -20);
    if (distW < 45) {
      return 3.8 * Math.cos((distW / 45) * (Math.PI / 2));
    }
    const distSE = Math.hypot(x - 110, z - 80);
    if (distSE < 40) {
      return 4.2 * Math.cos((distSE / 40) * (Math.PI / 2));
    }
    return Math.sin(x * 0.03) * 0.35 + Math.cos(z * 0.03) * 0.35;
  }
}

export class MapManager {
  private scene: THREE.Scene;
  public currentMapIndex: 0 | 1 | 2 = 0;
  public currentMapData: MapDataResult | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Helper to map any string/alias map key to strict 0 | 1 | 2
   */
  public static resolveMapIndex(selectedMap?: string): 0 | 1 | 2 {
    if (!selectedMap) return 0;
    if (selectedMap === 'apex_metropolis' || selectedMap === 'financial_district' || selectedMap === 'tilted_skyscrapers') {
      return 1;
    }
    if (selectedMap === 'harvest_ridge' || selectedMap === 'neocity_heights') {
      return 2;
    }
    return 0; // pinecrest_suburb, suburban_valley, pleasant_valley, island_2v2
  }

  /**
   * Fully dispose and clean up previous map geometries, textures, materials, and colliders
   */
  public disposeCurrentMap(): void {
    if (!this.currentMapData) return;

    const { rootGroup, terrainMesh } = this.currentMapData;

    // Recursive scene mesh, material, and texture disposal to prevent memory leaks and maintain 60 FPS
    const disposeNode = (node: THREE.Object3D) => {
      if ((node as THREE.Mesh).geometry) {
        (node as THREE.Mesh).geometry.dispose();
      }
      if ((node as THREE.Mesh).material) {
        const mat = (node as THREE.Mesh).material;
        const disposeSingleMat = (m: any) => {
          if (m.map) m.map.dispose();
          if (m.normalMap) m.normalMap.dispose();
          if (m.roughnessMap) m.roughnessMap.dispose();
          if (m.metalnessMap) m.metalnessMap.dispose();
          if (m.emissiveMap) m.emissiveMap.dispose();
          m.dispose();
        };

        if (Array.isArray(mat)) {
          mat.forEach(disposeSingleMat);
        } else {
          disposeSingleMat(mat);
        }
      }
      while (node.children.length > 0) {
        const child = node.children[0];
        disposeNode(child);
        node.remove(child);
      }
    };

    if (rootGroup) {
      this.scene.remove(rootGroup);
      disposeNode(rootGroup);
    }
    if (terrainMesh) {
      this.scene.remove(terrainMesh);
      disposeNode(terrainMesh);
    }

    SKYSCRAPER_LAUNCH_PADS.length = 0;
    this.currentMapData = null;
  }

  /**
   * Load one of 3 distinct, realistic environments
   * @param mapIndex 0 = Pinecrest Suburb (Town), 1 = Apex Metropolis (City), 2 = Harvest Ridge (Country)
   */
  public loadMap(mapIndex: 0 | 1 | 2): MapDataResult {
    this.disposeCurrentMap();
    this.currentMapIndex = mapIndex;

    let result: MapDataResult;
    if (mapIndex === 0) {
      result = this.generatePinecrestSuburb();
    } else if (mapIndex === 1) {
      result = this.generateApexMetropolis();
    } else {
      result = this.generateHarvestRidge();
    }

    // Apply atmospheric sky & fog colors
    const meta = result.metadata;
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.set(meta.skyColor);
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.set(meta.fogColor);
      this.scene.fog.density = meta.fogDensity;
    }

    this.currentMapData = result;
    this.scene.add(result.rootGroup);
    return result;
  }

  // =========================================================================
  // MAP 1: "Pinecrest Suburb" (Town Theme)
  // Contoured 360x360 Plane (96x96), residential loop, cul-de-sacs,
  // 3 Enterable 2-Story Suburban Homes with Balconies & Central Fountain Plaza
  // =========================================================================
  private generatePinecrestSuburb(): MapDataResult {
    const meta = MAP_METADATA_LIST[0];
    const rootGroup = new THREE.Group();
    rootGroup.name = 'Map_PinecrestSuburb';

    const harvestables: HarvestableObject[] = [];
    const harvestableMeshes = new Map<string, THREE.Object3D>();
    const chests: LootChest[] = [];
    const chestMeshes = new Map<string, THREE.Group>();
    const staticColliders: SolidCollider[] = [];
    const vehicles: DrivableVehicle[] = [];
    const upgradeBenches: UpgradeBenchStation[] = [];

    // 1. Procedural Heightfield (360x360 PlaneGeometry, 96x96 Segments)
    const terrainGeo = new THREE.PlaneGeometry(360, 360, 96, 96);
    terrainGeo.rotateX(-Math.PI / 2);

    const getElevation = (x: number, z: number): number => {
      // Sunken drainage culvert canal at Z: 48 to 72
      if (z > 42 && z < 78) {
        const canalDist = Math.abs(z - 60);
        if (canalDist < 14) {
          return -2.2 * Math.cos((canalDist / 14) * (Math.PI / 2));
        }
      }
      // Elevated Pine Ridge in the North (Z < -90)
      if (z < -80) {
        const ridgeDepth = Math.min(30, -80 - z);
        return (ridgeDepth / 30) * 6.5 + Math.sin(x * 0.04) * 0.8;
      }
      // Western Hill Plateau (X: -160 to -80, Z: -60 to 20)
      const distW = Math.hypot(x - -120, z - -20);
      if (distW < 45) {
        return 3.8 * Math.cos((distW / 45) * (Math.PI / 2));
      }
      // Stepped combat knoll in South-East
      const distSE = Math.hypot(x - 110, z - 80);
      if (distSE < 40) {
        return 4.2 * Math.cos((distSE / 40) * (Math.PI / 2));
      }
      // Gentle natural rolling terrain
      return Math.sin(x * 0.03) * 0.35 + Math.cos(z * 0.03) * 0.35;
    };

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, getElevation(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x3f912b,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, grassMat);
    terrainMesh.receiveShadow = true;
    rootGroup.add(terrainMesh);

    // 2. Asphalt Residential Loop & Cul-de-Sacs
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.75 });

    // Main Residential Loop (East-West Parkway)
    const mainAvenue = new THREE.Mesh(new THREE.BoxGeometry(280, 0.12, 12), roadMat);
    mainAvenue.position.set(0, 0.06, 0);
    mainAvenue.receiveShadow = true;
    rootGroup.add(mainAvenue);

    // Cul-de-sac branch roads
    const northBranch = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 110), roadMat);
    northBranch.position.set(-60, 0.06, -55);
    northBranch.receiveShadow = true;
    rootGroup.add(northBranch);

    const culDeSacCircle = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 0.12, 32), roadMat);
    culDeSacCircle.position.set(-60, 0.06, -110);
    culDeSacCircle.receiveShadow = true;
    rootGroup.add(culDeSacCircle);

    // Sidewalk curbs and walkways along main road
    for (const cz of [-6.3, 6.3]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(280, 0.28, 0.4), curbMat);
      curb.position.set(0, 0.14, cz);
      rootGroup.add(curb);

      const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(280, 0.18, 2.4), sidewalkMat);
      sidewalk.position.set(0, 0.09, cz > 0 ? cz + 1.4 : cz - 1.4);
      sidewalk.receiveShadow = true;
      rootGroup.add(sidewalk);
    }

    // Streetlights with warm amber glowing lamps along the road
    for (const lx of [-100, -40, 20, 80]) {
      for (const lz of [-7.2, 7.2]) {
        const pole = new THREE.Group();
        pole.position.set(lx, 0, lz);

        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.12, 5.0, 8),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 })
        );
        mast.position.y = 2.5;
        pole.add(mast);

        const lantern = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.4, 0.4),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        lantern.position.set(0, 4.9, lz > 0 ? -0.4 : 0.4);
        pole.add(lantern);

        rootGroup.add(pole);

        staticColliders.push({
          type: 'cylinder',
          x: lx,
          z: lz,
          radius: 0.3,
          minY: 0,
          maxY: 5.0,
          name: 'Streetlight Pole',
        });
      }
    }

    // 3. Central Town Plaza (Small park, brick curb, tiered circular stone fountain, benches)
    const plaza = new THREE.Group();
    plaza.position.set(20, 0.1, 0);

    const brickCurbMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 });
    const plazaPaving = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 0.18, 32), brickCurbMat);
    plazaPaving.position.y = 0.09;
    plazaPaving.receiveShadow = true;
    plaza.add(plazaPaving);

    // Tiered Fountain
    const fountainBase = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.8, 0.7, 24),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 })
    );
    fountainBase.position.y = 0.35;
    fountainBase.castShadow = true;
    plaza.add(fountainBase);

    const fountainTier2 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.8, 0.6, 24),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4 })
    );
    fountainTier2.position.y = 0.9;
    plaza.add(fountainTier2);

    const waterCrystal = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.85 })
    );
    waterCrystal.position.y = 1.6;
    plaza.add(waterCrystal);

    staticColliders.push({
      type: 'cylinder',
      x: 20,
      z: 0,
      radius: 4.5,
      minY: 0.1,
      maxY: 2.2,
      name: 'Plaza Fountain',
    });

    // Park benches in plaza
    for (let b = 0; b < 4; b++) {
      const angle = (b * Math.PI) / 2 + Math.PI / 4;
      const bx = Math.cos(angle) * 11;
      const bz = Math.sin(angle) * 11;

      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.45, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
      );
      bench.position.set(bx, 0.25, bz);
      bench.rotation.y = angle + Math.PI / 2;
      plaza.add(bench);

      staticColliders.push({
        type: 'box',
        minX: 20 + bx - 1.0,
        maxX: 20 + bx + 1.0,
        minY: 0.1,
        maxY: 0.9,
        minZ: bz - 0.5,
        maxZ: bz + 0.5,
        name: 'Plaza Park Bench',
      });
    }
    rootGroup.add(plaza);

    // Chest at central fountain
    addChest(rootGroup, chests, chestMeshes, staticColliders, 20, 1.3, 0, 'rare_chest');

    // 4. 3 Enterable Two-Story Suburban Homes
    // House 1: Pinecrest Manor (West - Blue)
    // House 2: Whispering Pines Villa (North-East - Red/Brick)
    // House 3: Autumn Timber House (South-East - Gold/Amber)
    const homes = [
      { x: -95, z: -35, col: 0x2563eb, name: 'Pinecrest Manor' },
      { x: -35, z: -40, col: 0xb91c1c, name: 'Whispering Pines Villa' },
      { x: 95, z: -35, col: 0xd97706, name: 'Autumn Timber House' },
    ];

    homes.forEach((h) => {
      this.buildEnterableTwoStoryHome(
        rootGroup,
        harvestables,
        staticColliders,
        h.x,
        0,
        h.z,
        h.col,
        h.name
      );

      // Chest in upper master bedroom
      addChest(rootGroup, chests, chestMeshes, staticColliders, h.x - 2.8, 3.6, h.z - 2.2, 'chest');
      // Chest on exterior balcony
      addChest(rootGroup, chests, chestMeshes, staticColliders, h.x, 3.6, h.z + 6.8, 'chest');
    });

    // 5. Suburban Driveways, Mailboxes & White Picket Fences
    homes.forEach((h) => {
      // Asphalt Driveway connecting house to street
      const driveway = new THREE.Mesh(
        new THREE.BoxGeometry(6.0, 0.12, 28),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 })
      );
      driveway.position.set(h.x + 8.5, 0.06, h.z + 14);
      driveway.receiveShadow = true;
      rootGroup.add(driveway);

      // Mailbox at curb
      const mailbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 1.1, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 })
      );
      mailbox.position.set(h.x + 12.0, 0.55, -6.8);
      rootGroup.add(mailbox);

      // Low-poly white picket fence along front yard
      for (let p = -14; p <= 14; p += 3.5) {
        if (p > 5 && p < 12) continue; // Driveway opening
        const fencePost = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.9, 0.12),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
        );
        fencePost.position.set(h.x + p, 0.45, h.z + 10.5);
        rootGroup.add(fencePost);
      }
    });

    // 6. Drivable Vehicles & Upgrade Bench
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, -20, 0.1, 2.5, 0xef4444, 'Pinecrest Red Cruiser', 'sports', 0);
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 70, 0.1, -2.5, 0x3b82f6, 'Mudflap Blue 4x4', 'truck', Math.PI);

    const benchMeshPinecrest = createUpgradeBenchMesh();
    benchMeshPinecrest.position.set(-106, 0.1, -35);
    rootGroup.add(benchMeshPinecrest);
    upgradeBenches.push({
      id: 'bench_pinecrest',
      x: -106,
      y: 0.1,
      z: -35,
      mesh: benchMeshPinecrest,
    });

    const spawnPoint = new THREE.Vector3(0, 0.2, 0);

    return {
      metadata: meta,
      rootGroup,
      terrainMesh,
      harvestables,
      harvestableMeshes,
      chests,
      chestMeshes,
      staticColliders,
      vehicles,
      upgradeBenches,
      spawnPoint,
      getElevation,
    };
  }

  /**
   * Helper: Build complete enterable 2-story suburban home with interior walls, staircase,
   * upstairs master suite, window openings, and walkout sniper balcony.
   */
  private buildEnterableTwoStoryHome(
    parent: THREE.Group,
    harvestables: HarvestableObject[],
    colliders: SolidCollider[],
    x: number,
    y: number,
    z: number,
    wallColor: number,
    houseName: string
  ): void {
    const house = new THREE.Group();
    house.position.set(x, y, z);

    const sidingMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.65 });
    const woodFloorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const drywallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 });
    const roofShingleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const glassFrameMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, roughness: 0.1 });

    // Ground Floor Slab (14m x 12m)
    const groundSlab = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 12), woodFloorMat);
    groundSlab.position.y = 0.1;
    groundSlab.receiveShadow = true;
    house.add(groundSlab);

    colliders.push({
      type: 'box',
      minX: x - 7.0,
      maxX: x + 7.0,
      minY: y - 0.2,
      maxY: y + 0.2,
      minZ: z - 6.0,
      maxZ: z + 6.0,
      name: `${houseName} Ground Floor`,
    });

    // Second Floor Slab with Stairwell Cutout
    const secondFloorSlab = new THREE.Mesh(new THREE.BoxGeometry(14, 0.25, 12), woodFloorMat);
    secondFloorSlab.position.set(0, 3.4, 0);
    secondFloorSlab.receiveShadow = true;
    house.add(secondFloorSlab);

    colliders.push({
      type: 'box',
      minX: x - 7.0,
      maxX: x + 7.0,
      minY: y + 3.25,
      maxY: y + 3.55,
      minZ: z - 6.0,
      maxZ: z + 6.0,
      name: `${houseName} Second Floor Slab`,
    });

    // Exterior Walls (with open doorway at front center & window cutouts)
    // Back Wall (Solid)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(14, 6.8, 0.4), sidingMat);
    backWall.position.set(0, 3.4, -5.8);
    backWall.castShadow = true;
    house.add(backWall);

    colliders.push({
      type: 'box',
      minX: x - 7.0,
      maxX: x + 7.0,
      minY: y,
      maxY: y + 6.8,
      minZ: z - 6.0,
      maxZ: z - 5.6,
      name: `${houseName} Back Wall`,
    });

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6.8, 12), sidingMat);
    leftWall.position.set(-6.8, 3.4, 0);
    leftWall.castShadow = true;
    house.add(leftWall);

    colliders.push({
      type: 'box',
      minX: x - 7.0,
      maxX: x - 6.6,
      minY: y,
      maxY: y + 6.8,
      minZ: z - 6.0,
      maxZ: z + 6.0,
      name: `${houseName} Left Wall`,
    });

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6.8, 12), sidingMat);
    rightWall.position.set(6.8, 3.4, 0);
    rightWall.castShadow = true;
    house.add(rightWall);

    colliders.push({
      type: 'box',
      minX: x + 6.6,
      maxX: x + 7.0,
      minY: y,
      maxY: y + 6.8,
      minZ: z - 6.0,
      maxZ: z + 6.0,
      name: `${houseName} Right Wall`,
    });

    // Front Wall Left Wing (with window opening)
    const frontWallL = new THREE.Mesh(new THREE.BoxGeometry(5.4, 6.8, 0.4), sidingMat);
    frontWallL.position.set(-4.1, 3.4, 5.8);
    frontWallL.castShadow = true;
    house.add(frontWallL);

    colliders.push({
      type: 'box',
      minX: x - 6.8,
      maxX: x - 1.4,
      minY: y,
      maxY: y + 6.8,
      minZ: z + 5.6,
      maxZ: z + 6.0,
      name: `${houseName} Front Wall Left`,
    });

    // Front Wall Right Wing
    const frontWallR = new THREE.Mesh(new THREE.BoxGeometry(5.4, 6.8, 0.4), sidingMat);
    frontWallR.position.set(4.1, 3.4, 5.8);
    frontWallR.castShadow = true;
    house.add(frontWallR);

    colliders.push({
      type: 'box',
      minX: x + 1.4,
      maxX: x + 6.8,
      minY: y,
      maxY: y + 6.8,
      minZ: z + 5.6,
      maxZ: z + 6.0,
      name: `${houseName} Front Wall Right`,
    });

    // Front Doorway Header (Doorway open below from y=0 to y=3.0)
    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.8, 0.4), sidingMat);
    doorHeader.position.set(0, 4.9, 5.8);
    house.add(doorHeader);

    // Interior Partition Walls (Dividing foyer, living room, kitchen, and upper master bedroom)
    const groundPartition = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 7.0), drywallMat);
    groundPartition.position.set(0.6, 1.6, -2.0);
    house.add(groundPartition);

    colliders.push({
      type: 'box',
      minX: x + 0.4,
      maxX: x + 0.8,
      minY: y,
      maxY: y + 3.2,
      minZ: z - 5.5,
      maxZ: z + 1.5,
      name: `${houseName} Ground Partition`,
    });

    // Accessible Central Wooden Staircase leading to 2nd Floor (y=0.1 to y=3.4)
    const numSteps = 9;
    const stepRise = 3.3 / numSteps;
    const stepRun = 0.52;

    for (let s = 0; s < numSteps; s++) {
      const stepMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, stepRise, stepRun),
        woodFloorMat
      );
      stepMesh.position.set(4.8, 0.15 + s * stepRise, 2.2 - s * stepRun);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      house.add(stepMesh);

      colliders.push({
        type: 'box',
        minX: x + 3.7,
        maxX: x + 5.9,
        minY: y + s * stepRise,
        maxY: y + (s + 1) * stepRise + 0.1,
        minZ: z + 2.2 - (s + 0.5) * stepRun - 0.1,
        maxZ: z + 2.2 - (s - 0.5) * stepRun + 0.1,
        name: `${houseName} Stair Step ${s + 1}`,
      });
    }

    // Second-Story Master Bedroom Features: Walkout exterior deck/balcony (4.6m x 2.8m)
    const balconyFloor = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.18, 2.8),
      woodFloorMat
    );
    balconyFloor.position.set(0, 3.4, 7.2);
    balconyFloor.receiveShadow = true;
    house.add(balconyFloor);

    colliders.push({
      type: 'box',
      minX: x - 2.3,
      maxX: x + 2.3,
      minY: y + 3.3,
      maxY: y + 3.6,
      minZ: z + 5.8,
      maxZ: z + 8.6,
      name: `${houseName} Balcony Deck`,
    });

    // Balcony Railing (1.0m high)
    const railMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const frontRail = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.0, 0.12), railMat);
    frontRail.position.set(0, 4.0, 8.55);
    house.add(frontRail);

    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 2.8), railMat);
    leftRail.position.set(-2.25, 4.0, 7.2);
    house.add(leftRail);

    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.0, 2.8), railMat);
    rightRail.position.set(2.25, 4.0, 7.2);
    house.add(rightRail);

    colliders.push({
      type: 'box',
      minX: x - 2.3,
      maxX: x + 2.3,
      minY: y + 3.4,
      maxY: y + 4.5,
      minZ: z + 8.4,
      maxZ: z + 8.7,
      name: `${houseName} Balcony Railing Front`,
    });

    // Sloped Shingle Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(11.0, 2.8, 4),
      roofShingleMat
    );
    roof.position.set(0, 8.0, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    parent.add(house);
  }

  // =========================================================================
  // MAP 2: "Apex Metropolis" (City Theme)
  // Contoured 360x360 Plane (96x96), concrete avenue grid, subway entrances,
  // Towering Skyline, Enterable Corporate Tower (Ground + 2 Floors), Mezzanine Skybridge & Rooftop Helipad
  // =========================================================================
  private generateApexMetropolis(): MapDataResult {
    const meta = MAP_METADATA_LIST[1];
    const rootGroup = new THREE.Group();
    rootGroup.name = 'Map_ApexMetropolis';

    const harvestables: HarvestableObject[] = [];
    const harvestableMeshes = new Map<string, THREE.Object3D>();
    const chests: LootChest[] = [];
    const chestMeshes = new Map<string, THREE.Group>();
    const staticColliders: SolidCollider[] = [];
    const vehicles: DrivableVehicle[] = [];
    const upgradeBenches: UpgradeBenchStation[] = [];

    // 1. Procedural Heightfield (360x360 PlaneGeometry, 96x96 Segments)
    const terrainGeo = new THREE.PlaneGeometry(360, 360, 96, 96);
    terrainGeo.rotateX(-Math.PI / 2);

    const getElevation = (x: number, z: number): number => {
      // Subterranean Subway Entrance Stairwell Cutout at X: 20 to 36, Z: 10 to 26
      if (x > 18 && x < 38 && z > 8 && z < 28) {
        return -3.8;
      }
      // Elevated Highway & Courtyard Embankment in North (Z < -70)
      if (z < -65) {
        return 4.5;
      }
      // Terraced Plaza South-West
      if (x < -80 && z > 50) {
        return 3.2;
      }
      return 0.0;
    };

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, getElevation(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.2,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, plazaMat);
    terrainMesh.receiveShadow = true;
    rootGroup.add(terrainMesh);

    // 2. Concrete & Asphalt Multi-Lane Avenue Grid with Crosswalks & Subway Stairs
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const crosswalkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });

    // Major North-South 4-Lane Avenue
    const nsAvenue = new THREE.Mesh(new THREE.BoxGeometry(18, 0.12, 320), roadMat);
    nsAvenue.position.set(0, 0.06, 0);
    nsAvenue.receiveShadow = true;
    rootGroup.add(nsAvenue);

    // Major East-West Cross Boulevard
    const ewAvenue = new THREE.Mesh(new THREE.BoxGeometry(320, 0.12, 18), roadMat);
    ewAvenue.position.set(0, 0.06, 0);
    ewAvenue.receiveShadow = true;
    rootGroup.add(ewAvenue);

    // Painted White Crosswalks
    for (const wx of [-14, 14]) {
      for (let s = -7; s <= 7; s += 2.2) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.8), crosswalkMat);
        stripe.position.set(wx, 0.08, s);
        rootGroup.add(stripe);
      }
    }

    // Subterranean Subway Entrance Stairwell (-3.8m deep)
    const subwayEntrance = new THREE.Group();
    subwayEntrance.position.set(28, 0, 18);

    const subwayFloor = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    subwayFloor.position.y = -3.7;
    subwayFloor.receiveShadow = true;
    subwayEntrance.add(subwayFloor);

    // Subway Stair Steps descending from 0 to -3.8m
    for (let st = 0; st < 8; st++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, 0.45, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
      );
      step.position.set(0, -0.25 - st * 0.45, -6.0 + st * 1.2);
      subwayEntrance.add(step);

      staticColliders.push({
        type: 'box',
        minX: 28 - 2.0,
        maxX: 28 + 2.0,
        minY: -st * 0.45 - 0.5,
        maxY: -st * 0.45,
        minZ: 18 - 6.0 + st * 1.2 - 0.6,
        maxZ: 18 - 6.0 + st * 1.2 + 0.6,
        name: `Subway Stair Step ${st + 1}`,
      });
    }

    // Glass Subway Canopy at Ground
    const subwayCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.1, 10),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7, roughness: 0.1 })
    );
    subwayCanopy.position.set(0, 2.8, -1.0);
    subwayCanopy.rotateX(-0.15);
    subwayEntrance.add(subwayCanopy);

    rootGroup.add(subwayEntrance);
    addChest(rootGroup, chests, chestMeshes, staticColliders, 28, -3.6, 22, 'chest');

    // 3. Perimeter Skyline: Towering Non-Enterable Reflective Skyscrapers
    const skylineTowers = [
      { x: -75, z: -75, w: 28, h: 68, d: 28, col: 0x020617, name: 'Aegis Spire' },
      { x: 75, z: -75, w: 32, h: 74, d: 32, col: 0x0f172a, name: 'Vanguard Monolith' },
      { x: -75, z: 75, w: 26, h: 58, d: 26, col: 0x18181b, name: 'Titan Center' },
      { x: 75, z: 75, w: 30, h: 62, d: 30, col: 0x111827, name: 'Sovereign Tower' },
    ];

    skylineTowers.forEach((t) => {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(t.x, 0, t.z);

      const facadeMat = new THREE.MeshStandardMaterial({
        color: t.col,
        roughness: 0.15,
        metalness: 0.92,
      });
      const towerMesh = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), facadeMat);
      towerMesh.position.y = t.h / 2;
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;
      towerGroup.add(towerMesh);

      // Glowing Corporate Top Band
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(t.w + 0.2, 2.5, t.d + 0.2),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      band.position.y = t.h - 3;
      towerGroup.add(band);

      rootGroup.add(towerGroup);

      staticColliders.push({
        type: 'box',
        minX: t.x - t.w / 2,
        maxX: t.x + t.w / 2,
        minY: 0,
        maxY: t.h,
        minZ: t.z - t.d / 2,
        maxZ: t.z + t.d / 2,
        name: t.name,
      });
    });

    // 4. Enterable Corporate Tower (Ground + 2 Floors) - "Apex Zenith Tower"
    // Ground lobby (y=0 to 4.5), Mezzanine (y=4.5), Rooftop Deck (y=18) with Helipad
    const apexTower = new THREE.Group();
    apexTower.position.set(-36, 0, 0);

    const lobbyFloor = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.2, 22),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.5 })
    );
    lobbyFloor.position.y = 0.1;
    apexTower.add(lobbyFloor);

    // Mezzanine Floor at Y = 4.5
    const mezzanine = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.35, 14),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    );
    mezzanine.position.set(0, 4.5, -4);
    apexTower.add(mezzanine);

    staticColliders.push({
      type: 'box',
      minX: -36 - 12,
      maxX: -36 + 12,
      minY: 4.3,
      maxY: 4.7,
      minZ: -11,
      maxZ: 3,
      name: 'Apex Zenith Mezzanine Floor',
    });

    // Staircase leading from Lobby (0) to Mezzanine (4.5)
    for (let st = 0; st < 10; st++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 0.45, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 })
      );
      step.position.set(8.5, 0.25 + st * 0.45, 6 - st * 1.1);
      apexTower.add(step);

      staticColliders.push({
        type: 'box',
        minX: -36 + 7.0,
        maxX: -36 + 10.0,
        minY: st * 0.45,
        maxY: (st + 1) * 0.45 + 0.1,
        minZ: 6 - st * 1.1 - 0.6,
        maxZ: 6 - st * 1.1 + 0.6,
        name: `Apex Stair Step ${st + 1}`,
      });
    }

    // Skybridge connecting Mezzanine (Y = 4.5) to adjacent parking garage across avenue
    const skybridge = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.3, 5),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    skybridge.position.set(24, 4.5, -4);
    apexTower.add(skybridge);

    staticColliders.push({
      type: 'box',
      minX: -36 + 12,
      maxX: -36 + 36,
      minY: 4.35,
      maxY: 4.65,
      minZ: -6.5,
      maxZ: -1.5,
      name: 'Corporate Skybridge Walkway',
    });

    // Skybridge Railings
    for (const rz of [-6.4, -1.6]) {
      const bridgeRail = new THREE.Mesh(
        new THREE.BoxGeometry(24, 1.1, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 })
      );
      bridgeRail.position.set(24, 5.1, rz);
      apexTower.add(bridgeRail);

      staticColliders.push({
        type: 'box',
        minX: -36 + 12,
        maxX: -36 + 36,
        minY: 4.5,
        maxY: 5.8,
        minZ: rz - 0.15,
        maxZ: rz + 0.15,
        name: 'Skybridge Railing',
      });
    }

    // Rooftop Deck with Helicopter Pad at Y = 18.0
    const roofDeck = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.4, 22),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 })
    );
    roofDeck.position.y = 18.0;
    apexTower.add(roofDeck);

    staticColliders.push({
      type: 'box',
      minX: -36 - 12,
      maxX: -36 + 12,
      minY: 17.8,
      maxY: 18.2,
      minZ: -11,
      maxZ: 11,
      name: 'Apex Zenith Rooftop Deck',
    });

    // Waist-high Parapet Walls (1.1m high) for tactical combat cover
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const parapetF = new THREE.Mesh(new THREE.BoxGeometry(24, 1.1, 0.3), parapetMat);
    parapetF.position.set(0, 18.6, 10.8);
    apexTower.add(parapetF);

    const parapetB = new THREE.Mesh(new THREE.BoxGeometry(24, 1.1, 0.3), parapetMat);
    parapetB.position.set(0, 18.6, -10.8);
    apexTower.add(parapetB);

    staticColliders.push({
      type: 'box',
      minX: -36 - 12,
      maxX: -36 + 12,
      minY: 18.0,
      maxY: 19.3,
      minZ: 10.6,
      maxZ: 11.0,
      name: 'Rooftop Parapet Front',
    });

    // Yellow 'H' Helipad Marking Ring on Roof
    const helipadRing = new THREE.Mesh(
      new THREE.RingGeometry(4.0, 5.2, 32),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    helipadRing.rotateX(-Math.PI / 2);
    helipadRing.position.set(0, 18.25, 0);
    apexTower.add(helipadRing);

    // Exterior Service Lift / Ascender to Helipad
    SKYSCRAPER_LAUNCH_PADS.push({
      x: -36,
      y: 0,
      z: 11,
      targetY: 18.2,
      name: 'Apex Zenith Helipad Ascender',
    });

    rootGroup.add(apexTower);

    // Chests in Corporate Mezzanine and Rooftop Helipad
    addChest(rootGroup, chests, chestMeshes, staticColliders, -36, 4.7, -4, 'rare_chest');
    addChest(rootGroup, chests, chestMeshes, staticColliders, -36, 18.3, 0, 'rare_chest');

    // 5. Fast Drivable GT Sports Cars
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, -4.5, 0.1, 15, 0xfacc15, 'Whiplash Gold GT', 'sports', 0);
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 4.5, 0.1, -15, 0xef4444, 'Whiplash Crimson Apex', 'sports', Math.PI);

    const benchMeshApex = createUpgradeBenchMesh();
    benchMeshApex.position.set(-36, 0.1, 8);
    rootGroup.add(benchMeshApex);
    upgradeBenches.push({
      id: 'bench_apex',
      x: -36,
      y: 0.1,
      z: 8,
      mesh: benchMeshApex,
    });

    const spawnPoint = new THREE.Vector3(0, 0.2, 0);

    return {
      metadata: meta,
      rootGroup,
      terrainMesh,
      harvestables,
      harvestableMeshes,
      chests,
      chestMeshes,
      staticColliders,
      vehicles,
      upgradeBenches,
      spawnPoint,
      getElevation,
    };
  }

  // =========================================================================
  // MAP 3: "Harvest Ridge" (Country Theme)
  // Contoured 360x360 Plane (96x96), rolling grassy hills, dried creek ravine,
  // 2-Story Dutch Barn with Hayloft, Country Farmhouse with Dormers, Grain Silo & Windmill
  // =========================================================================
  private generateHarvestRidge(): MapDataResult {
    const meta = MAP_METADATA_LIST[2];
    const rootGroup = new THREE.Group();
    rootGroup.name = 'Map_HarvestRidge';

    const harvestables: HarvestableObject[] = [];
    const harvestableMeshes = new Map<string, THREE.Object3D>();
    const chests: LootChest[] = [];
    const chestMeshes = new Map<string, THREE.Group>();
    const staticColliders: SolidCollider[] = [];
    const vehicles: DrivableVehicle[] = [];
    const upgradeBenches: UpgradeBenchStation[] = [];

    // 1. Procedural Heightfield (360x360 PlaneGeometry, 96x96 Segments)
    // Undulating rolling countryside terrain with natural hills, dried creek ravine
    const terrainGeo = new THREE.PlaneGeometry(360, 360, 96, 96);
    terrainGeo.rotateX(-Math.PI / 2);

    const getElevation = (x: number, z: number): number => {
      // Dried gravel creek bed cutting through a low ravine from X: -180 to +180 at Z: ~30 to 55
      const creekCenterZ = 40 + Math.sin(x * 0.02) * 8;
      const creekDist = Math.abs(z - creekCenterZ);
      if (creekDist < 16) {
        return -2.8 * Math.cos((creekDist / 16) * (Math.PI / 2));
      }
      // Elevated Windmill Ridge in North (Z < -70)
      if (z < -60) {
        const distN = Math.hypot(x - 30, z - -100);
        if (distN < 55) {
          return 6.5 * Math.cos((distN / 55) * (Math.PI / 2));
        }
      }
      // Farmstead plateau flat for Dutch Barn & Farmhouse (X: -80 to 20, Z: -50 to 10)
      if (x > -70 && x < 20 && z > -45 && z < 15) {
        return 0.2;
      }
      // Natural undulating rolling pastures
      return Math.sin(x * 0.035) * Math.cos(z * 0.035) * 3.2 + Math.cos(x * 0.02) * 0.6;
    };

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, getElevation(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const meadowMat = new THREE.MeshStandardMaterial({
      color: 0x65a30d,
      roughness: 0.9,
      metalness: 0.02,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, meadowMat);
    terrainMesh.receiveShadow = true;
    rootGroup.add(terrainMesh);

    // 2. Winding Dirt / Gravel Pathways & Dried Creek Bed
    const gravelMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });
    const dirtRoadMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });

    // Winding Farm Road
    const farmRoad = new THREE.Mesh(new THREE.BoxGeometry(260, 0.12, 7.0), dirtRoadMat);
    farmRoad.position.set(0, 0.06, -10);
    farmRoad.receiveShadow = true;
    rootGroup.add(farmRoad);

    // Dried Gravel Creek Bed
    const creekBed = new THREE.Mesh(new THREE.BoxGeometry(280, 0.1, 14), gravelMat);
    creekBed.position.set(0, -2.6, 40);
    creekBed.receiveShadow = true;
    rootGroup.add(creekBed);

    // Post-and-rail wooden fences along pastures
    for (let fx = -120; fx <= 120; fx += 15) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.3, 6),
        new THREE.MeshStandardMaterial({ color: 0x78350f })
      );
      post.position.set(fx, 0.65, -15);
      rootGroup.add(post);

      const railTop = new THREE.Mesh(
        new THREE.BoxGeometry(15, 0.1, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x92400e })
      );
      railTop.position.set(fx + 7.5, 1.0, -15);
      rootGroup.add(railTop);
    }

    // 3. Enterable Two-Story Dutch Barn (Vaulted Timber, Hay Stalls, Hayloft & Lookout Door)
    const barn = new THREE.Group();
    barn.position.set(-40, 0.2, -20);

    const barnRedMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.75 });
    const timberMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });
    const hayMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.9 });

    // Barn Ground Floor Slab (18m x 14m)
    const barnFloor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 14), timberMat);
    barnFloor.position.y = 0.1;
    barn.add(barnFloor);

    staticColliders.push({
      type: 'box',
      minX: -40 - 9,
      maxX: -40 + 9,
      minY: 0,
      maxY: 0.4,
      minZ: -20 - 7,
      maxZ: -20 + 7,
      name: 'Dutch Barn Ground Floor',
    });

    // Elevated Hayloft Floor (y=4.5m)
    const hayloftFloor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 10), timberMat);
    hayloftFloor.position.set(0, 4.5, -2);
    hayloftFloor.receiveShadow = true;
    barn.add(hayloftFloor);

    staticColliders.push({
      type: 'box',
      minX: -40 - 9,
      maxX: -40 + 9,
      minY: 4.3,
      maxY: 4.7,
      minZ: -20 - 7,
      maxZ: -20 + 3,
      name: 'Dutch Barn Hayloft Floor',
    });

    // Accessible Timber Ladder / Ramp leading to Hayloft (0 to 4.5m)
    const barnLadder = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 7.5), timberMat);
    barnLadder.position.set(6.5, 2.3, 0.5);
    barnLadder.rotateX(-0.6);
    barn.add(barnLadder);

    staticColliders.push({
      type: 'box',
      minX: -40 + 5.2,
      maxX: -40 + 7.8,
      minY: 0.2,
      maxY: 4.6,
      minZ: -20 - 2.5,
      maxZ: -20 + 3.5,
      name: 'Barn Hayloft Access Incline',
    });

    // Barn Walls (Double-Door Entrance at front & Hayloft Lookout Door above)
    // Back Wall
    const barnBack = new THREE.Mesh(new THREE.BoxGeometry(18, 8.5, 0.4), barnRedMat);
    barnBack.position.set(0, 4.25, -6.8);
    barn.add(barnBack);

    // Left Wall
    const barnLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8.5, 14), barnRedMat);
    barnLeft.position.set(-8.8, 4.25, 0);
    barn.add(barnLeft);

    // Right Wall
    const barnRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8.5, 14), barnRedMat);
    barnRight.position.set(8.8, 4.25, 0);
    barn.add(barnRight);

    // Front Wall with wide 5m double door opening on ground and Hayloft Lookout Door on 2nd floor
    const barnFrontL = new THREE.Mesh(new THREE.BoxGeometry(6.5, 8.5, 0.4), barnRedMat);
    barnFrontL.position.set(-5.75, 4.25, 6.8);
    barn.add(barnFrontL);

    const barnFrontR = new THREE.Mesh(new THREE.BoxGeometry(6.5, 8.5, 0.4), barnRedMat);
    barnFrontR.position.set(5.75, 4.25, 6.8);
    barn.add(barnFrontR);

    // Gambrel Barn Roof
    const barnRoof = new THREE.Mesh(
      new THREE.CylinderGeometry(6.5, 9.2, 18.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 })
    );
    barnRoof.rotateZ(Math.PI / 2);
    barnRoof.position.set(0, 9.8, 0);
    barn.add(barnRoof);

    // Hay Bales inside stalls and hayloft
    for (const hpos of [
      { x: -5, y: 0.6, z: -4 },
      { x: -3, y: 0.6, z: -4 },
      { x: -4, y: 1.4, z: -4 },
      { x: 2, y: 5.1, z: -4 },
      { x: 4, y: 5.1, z: -4 },
    ]) {
      const bale = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.9), hayMat);
      bale.position.set(hpos.x, hpos.y, hpos.z);
      barn.add(bale);
    }

    staticColliders.push(
      { type: 'box', minX: -40 - 9, maxX: -40 + 9, minY: 0, maxY: 8.5, minZ: -20 - 7, maxZ: -20 - 6.5, name: 'Barn Back Wall' },
      { type: 'box', minX: -40 - 9, maxX: -40 - 8.5, minY: 0, maxY: 8.5, minZ: -20 - 7, maxZ: -20 + 7, name: 'Barn Left Wall' },
      { type: 'box', minX: -40 + 8.5, maxX: -40 + 9, minY: 0, maxY: 8.5, minZ: -20 - 7, maxZ: -20 + 7, name: 'Barn Right Wall' }
    );

    rootGroup.add(barn);
    addChest(rootGroup, chests, chestMeshes, staticColliders, -40, 4.8, -4, 'rare_chest');

    // 4. Enterable Country Farmhouse (Wraparound Porch, Living/Pantry, 2nd-Floor Attic with Dormers)
    const farmhouse = new THREE.Group();
    farmhouse.position.set(24, 0.2, -25);

    const houseWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
    const porchWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

    // House Core (12m x 10m x 7m)
    const houseFloor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 10), porchWoodMat);
    houseFloor.position.y = 0.1;
    farmhouse.add(houseFloor);

    // Wraparound Ground-Floor Porch (covered porch on front & right side)
    const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 14), porchWoodMat);
    porchDeck.position.set(1.5, 0.1, 1.5);
    farmhouse.add(porchDeck);

    staticColliders.push({
      type: 'box',
      minX: 24 - 6.5,
      maxX: 24 + 9.5,
      minY: 0.1,
      maxY: 0.35,
      minZ: -25 - 5.5,
      maxZ: -25 + 8.5,
      name: 'Farmhouse Wraparound Porch Deck',
    });

    // Interior Attic Floor at Y = 3.6m
    const atticFloor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.25, 10), porchWoodMat);
    atticFloor.position.set(0, 3.6, 0);
    farmhouse.add(atticFloor);

    staticColliders.push({
      type: 'box',
      minX: 24 - 6,
      maxX: 24 + 6,
      minY: 3.5,
      maxY: 3.8,
      minZ: -25 - 5,
      maxZ: -25 + 5,
      name: 'Farmhouse Attic Floor',
    });

    // Interior staircase leading to attic
    for (let st = 0; st < 8; st++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.44, 0.5),
        porchWoodMat
      );
      step.position.set(3.8, 0.2 + st * 0.44, 2.5 - st * 0.5);
      farmhouse.add(step);

      staticColliders.push({
        type: 'box',
        minX: 24 + 2.8,
        maxX: 24 + 4.8,
        minY: 0.2 + st * 0.44,
        maxY: 0.2 + (st + 1) * 0.44 + 0.1,
        minZ: -25 + 2.5 - (st + 0.5) * 0.5,
        maxZ: -25 + 2.5 - (st - 0.5) * 0.5,
        name: `Farmhouse Stair Step ${st + 1}`,
      });
    }

    // Walls with Dormer Windows on second floor
    const fHouseBack = new THREE.Mesh(new THREE.BoxGeometry(12, 7.0, 0.4), houseWhiteMat);
    fHouseBack.position.set(0, 3.5, -4.8);
    farmhouse.add(fHouseBack);

    const fHouseLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.0, 10), houseWhiteMat);
    fHouseLeft.position.set(-5.8, 3.5, 0);
    farmhouse.add(fHouseLeft);

    const fHouseRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7.0, 10), houseWhiteMat);
    fHouseRight.position.set(5.8, 3.5, 0);
    farmhouse.add(fHouseRight);

    // Front wall with doorway
    const fHouseFrontL = new THREE.Mesh(new THREE.BoxGeometry(4.8, 7.0, 0.4), houseWhiteMat);
    fHouseFrontL.position.set(-3.6, 3.5, 4.8);
    farmhouse.add(fHouseFrontL);

    const fHouseFrontR = new THREE.Mesh(new THREE.BoxGeometry(4.8, 7.0, 0.4), houseWhiteMat);
    fHouseFrontR.position.set(3.6, 3.5, 4.8);
    farmhouse.add(fHouseFrontR);

    // Dormer Window Sniper Perch on attic roof
    const dormer = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.0, 2.0),
      houseWhiteMat
    );
    dormer.position.set(0, 5.8, 4.2);
    farmhouse.add(dormer);

    rootGroup.add(farmhouse);
    addChest(rootGroup, chests, chestMeshes, staticColliders, 24, 3.8, 0, 'chest');

    // 5. Environment Props: Grain Silo, Windmill & Utility Tractor
    // Cylindrical Grain Silo (Radius 3.2m, Height 14m)
    const silo = new THREE.Group();
    silo.position.set(-65, 0.2, -20);

    const siloBody = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 13, 24),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 })
    );
    siloBody.position.y = 6.5;
    siloBody.castShadow = true;
    silo.add(siloBody);

    const siloDome = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7 })
    );
    siloDome.position.y = 13;
    silo.add(siloDome);

    // Climbable perimeter ladder/ramp up the silo
    const siloLadder = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 13, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xeab308 })
    );
    siloLadder.position.set(0, 6.5, 3.3);
    silo.add(siloLadder);

    staticColliders.push({
      type: 'cylinder',
      x: -65,
      z: -20,
      radius: 3.4,
      minY: 0.2,
      maxY: 14.5,
      name: 'Grain Silo Cylinder',
    });

    rootGroup.add(silo);
    addChest(rootGroup, chests, chestMeshes, staticColliders, -65, 13.5, 0, 'rare_chest');

    // Classic Steel Windmill / Wind Pump on the north ridge
    const windmill = new THREE.Group();
    windmill.position.set(30, 6.5, -95);

    const towerLattice = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 2.6, 12, 4),
      new THREE.MeshStandardMaterial({ color: 0x64748b, wireframe: true })
    );
    towerLattice.position.y = 6.0;
    windmill.add(towerLattice);

    const rotorWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 3.6, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    rotorWheel.rotateX(Math.PI / 2);
    rotorWheel.position.set(0, 12.0, 0.8);
    windmill.add(rotorWheel);

    staticColliders.push({
      type: 'cylinder',
      x: 30,
      z: -95,
      radius: 2.2,
      minY: 6.5,
      maxY: 18.5,
      name: 'Windmill Steel Tower',
    });

    rootGroup.add(windmill);

    // Parked Utility Tractor in the farmyard
    const tractor = new THREE.Group();
    tractor.position.set(-15, 0.2, -18);

    const tractorBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.2, 3.6),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 })
    );
    tractorBody.position.y = 1.0;
    tractor.add(tractorBody);

    // Large rear tractor tires
    const rearTireGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.6, 16);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 });
    for (const tx of [-1.5, 1.5]) {
      const tire = new THREE.Mesh(rearTireGeo, tireMat);
      tire.rotateZ(Math.PI / 2);
      tire.position.set(tx, 1.0, -0.8);
      tractor.add(tire);
    }
    rootGroup.add(tractor);

    staticColliders.push({
      type: 'box',
      minX: -15 - 1.8,
      maxX: -15 + 1.8,
      minY: 0.2,
      maxY: 2.5,
      minZ: -18 - 2.0,
      maxZ: -18 + 2.0,
      name: 'Parked Farm Tractor',
    });

    // 6. Vehicles & Upgrade Bench in Dutch Barn
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 8, 0.2, -12, 0x0284c7, 'Mudflap Blue 4x4', 'truck', 0);

    const benchMeshHarvest = createUpgradeBenchMesh();
    benchMeshHarvest.position.set(-45, 0.2, -16);
    rootGroup.add(benchMeshHarvest);
    upgradeBenches.push({
      id: 'bench_harvest',
      x: -45,
      y: 0.2,
      z: -16,
      mesh: benchMeshHarvest,
    });

    const spawnPoint = new THREE.Vector3(0, 0.3, 0);

    return {
      metadata: meta,
      rootGroup,
      terrainMesh,
      harvestables,
      harvestableMeshes,
      chests,
      chestMeshes,
      staticColliders,
      vehicles,
      upgradeBenches,
      spawnPoint,
      getElevation,
    };
  }
}
