import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider, DrivableVehicle } from '../types';
import { UpgradeBenchStation, createUpgradeBenchMesh } from './fortniteWorldArena';
import { buildWalkableSkyscraper } from './fortniteWorldSkyscraper';
import { addDetailedSuburbanHome } from './fortniteWorldNeighborhoods';
import { addDetailedDrivableVehicle } from './fortniteWorldVehiclesProps';
import { addChest, addHarvestable } from './fortniteWorldNature';
import { SKYSCRAPER_LAUNCH_PADS } from './fortniteWorldTerrain';

export interface MapDataResult {
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

export class MapManager {
  private scene: THREE.Scene;
  public currentMapIndex: 0 | 1 | 2 = 0;
  public currentMapData: MapDataResult | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Fully dispose and clean up previous map geometries, textures, materials, and colliders
   */
  public disposeCurrentMap(): void {
    if (!this.currentMapData) return;

    const { rootGroup, terrainMesh } = this.currentMapData;

    // Recursive scene mesh & material disposal
    const disposeNode = (node: THREE.Object3D) => {
      if ((node as THREE.Mesh).geometry) {
        (node as THREE.Mesh).geometry.dispose();
      }
      if ((node as THREE.Mesh).material) {
        const mat = (node as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
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
   * @param mapIndex 0 = Suburban Valley, 1 = Financial District, 2 = Neo-City Heights
   */
  public loadMap(mapIndex: 0 | 1 | 2): MapDataResult {
    this.disposeCurrentMap();
    this.currentMapIndex = mapIndex;

    let result: MapDataResult;
    if (mapIndex === 0) {
      result = this.generateSuburbanValley();
    } else if (mapIndex === 1) {
      result = this.generateFinancialDistrict();
    } else {
      result = this.generateNeoCityHeights();
    }

    this.currentMapData = result;
    this.scene.add(result.rootGroup);
    return result;
  }

  // =========================================================================
  // MAP 1: SUBURBAN VALLEY (Organic road network, cul-de-sacs, enterable 2-story houses)
  // =========================================================================
  private generateSuburbanValley(): MapDataResult {
    const rootGroup = new THREE.Group();
    rootGroup.name = 'Map_SuburbanValley';

    const harvestables: HarvestableObject[] = [];
    const harvestableMeshes = new Map<string, THREE.Object3D>();
    const chests: LootChest[] = [];
    const chestMeshes = new Map<string, THREE.Group>();
    const staticColliders: SolidCollider[] = [];
    const vehicles: DrivableVehicle[] = [];
    const upgradeBenches: UpgradeBenchStation[] = [];

    // 1. Procedural Multi-Elevation Contoured Terrain (Segmented Plane 300x300, 64x64)
    const terrainGeo = new THREE.PlaneGeometry(300, 300, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);

    const getElevation = (x: number, z: number): number => {
      // Sunken riverbed / drainage trench at Z = 40 to 65
      if (z > 35 && z < 70) {
        const trenchDist = Math.abs(z - 52.5);
        if (trenchDist < 12) {
          return -1.6 * Math.cos((trenchDist / 12) * (Math.PI / 2));
        }
      }
      // Terraced hill plateau in north-west (X: -140 to -60, Z: -140 to -60)
      const distNW = Math.hypot(x - -100, z - -100);
      if (distNW < 48) {
        return 4.2 * Math.cos((distNW / 48) * (Math.PI / 2));
      }
      // Raised combat ridge in south-east (X: 60 to 140, Z: -120 to -40)
      const distSE = Math.hypot(x - 100, z - -80);
      if (distSE < 42) {
        return 3.5 * Math.cos((distSE / 42) * (Math.PI / 2));
      }
      // Gentle rolling landscape
      return Math.sin(x * 0.035) * 0.4 + Math.cos(z * 0.035) * 0.4;
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

    // 2. Asphalt Road Network with Curbs & Cul-de-Sacs
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });

    // Main East-West Boulevard
    const mainRoad = new THREE.Mesh(new THREE.BoxGeometry(260, 0.12, 12), roadMat);
    mainRoad.position.set(0, 0.06, 0);
    mainRoad.receiveShadow = true;
    rootGroup.add(mainRoad);

    // North-South Cul-de-Sac Road
    const culDeSacRoad = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 120), roadMat);
    culDeSacRoad.position.set(-60, 0.06, -60);
    culDeSacRoad.receiveShadow = true;
    rootGroup.add(culDeSacRoad);

    // Cul-de-Sac Circular Turnaround
    const turnaround = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 0.12, 32), roadMat);
    turnaround.position.set(-60, 0.06, -120);
    turnaround.receiveShadow = true;
    rootGroup.add(turnaround);

    // Curbs along main road
    for (const cz of [-6.2, 6.2]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(260, 0.25, 0.4), curbMat);
      curb.position.set(0, 0.12, cz);
      rootGroup.add(curb);
    }

    // 3. Enterable 2-Story Houses with Balconies and Sniping Windows
    const houseCoords = [
      { x: -95, z: -35, col: 0x3b82f6, name: 'Blue Haven Villa' },
      { x: -35, z: -35, col: 0xef4444, name: 'Red Brick Manor' },
      { x: 35, z: -35, col: 0xeab308, name: 'Yellow Siding House' },
      { x: 95, z: -35, col: 0x10b981, name: 'Emerald Crest Estate' },
      { x: -95, z: 35, col: 0x8b5cf6, name: 'Purple Sunset Retreat' },
      { x: 95, z: 35, col: 0xf97316, name: 'Amber Glow Homestead' },
    ];

    houseCoords.forEach((hc) => {
      addDetailedSuburbanHome(
        rootGroup,
        harvestables,
        staticColliders,
        hc.x,
        hc.z,
        hc.x,
        hc.z,
        hc.col,
        hc.name
      );

      // Add walkout sniper balcony railing on second floor (Y = 3.4)
      const balcony = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.15, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
      );
      balcony.position.set(hc.x, 3.38, hc.z + 6.4);
      balcony.receiveShadow = true;
      rootGroup.add(balcony);

      const railMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const railFront = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 0.1), railMat);
      railFront.position.set(hc.x, 3.85, hc.z + 7.6);
      rootGroup.add(railFront);

      staticColliders.push({
        type: 'box',
        minX: hc.x - 2.1,
        maxX: hc.x + 2.1,
        minY: 3.3,
        maxY: 4.3,
        minZ: hc.z + 5.15,
        maxZ: hc.z + 7.65,
        name: `${hc.name} Balcony`,
      });

      // Chest inside upper master bedroom
      addChest(rootGroup, chests, chestMeshes, staticColliders, hc.x - 2.5, 3.45, hc.z - 2.0, 'chest');
    });

    // 4. Vehicles & Streetlamps
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, -20, 0.1, 3.0, 0xef4444, 'Suburban Red Cruiser', 'sports', 0);
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 60, 0.1, -3.0, 0x3b82f6, 'Mudflap Blue 4x4', 'truck', Math.PI);

    // 5. Upgrade Bench in garage of Blue Haven Villa
    const benchMeshSuburban = createUpgradeBenchMesh();
    benchMeshSuburban.position.set(-108, 0.1, -35);
    rootGroup.add(benchMeshSuburban);
    upgradeBenches.push({
      id: 'bench_suburban',
      x: -108,
      y: 0.1,
      z: -35,
      mesh: benchMeshSuburban,
    });

    const spawnPoint = new THREE.Vector3(0, 0.2, 0);

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
      spawnPoint,
      getElevation,
    };
  }

  // =========================================================================
  // MAP 2: FINANCIAL DISTRICT (Urban High-Rise Arena, Enterable Lobbies & Rooftop Decks)
  // =========================================================================
  private generateFinancialDistrict(): MapDataResult {
    const rootGroup = new THREE.Group();
    rootGroup.name = 'Map_FinancialDistrict';

    const harvestables: HarvestableObject[] = [];
    const harvestableMeshes = new Map<string, THREE.Object3D>();
    const chests: LootChest[] = [];
    const chestMeshes = new Map<string, THREE.Group>();
    const staticColliders: SolidCollider[] = [];
    const vehicles: DrivableVehicle[] = [];
    const upgradeBenches: UpgradeBenchStation[] = [];

    // 1. Urban Canyon Leveled Terrain with Central Plaza Fountain Depression
    const terrainGeo = new THREE.PlaneGeometry(300, 300, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);

    const getElevation = (x: number, z: number): number => {
      const distFromCenter = Math.hypot(x, z);
      // Sunken central fountain courtyard (radius 18)
      if (distFromCenter < 18) {
        return -0.8 * Math.cos((distFromCenter / 18) * (Math.PI / 2));
      }
      // Flat asphalt avenue grid across the rest of the financial district
      return 0.05;
    };

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, getElevation(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.88,
      metalness: 0.1,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, asphaltMat);
    terrainMesh.receiveShadow = true;
    rootGroup.add(terrainMesh);

    // 2. City Grid Avenues & Pedestrian Crosswalk Markings
    const crosswalkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let c = -3; c <= 3; c++) {
      if (c === 0) continue;
      // White zebra stripes on 4-way intersections
      const stripeH = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 5.0), crosswalkMat);
      stripeH.rotateX(-Math.PI / 2);
      stripeH.position.set(c * 22, 0.08, 24);
      rootGroup.add(stripeH);

      const stripeV = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 1.2), crosswalkMat);
      stripeV.rotateX(-Math.PI / 2);
      stripeV.position.set(24, 0.08, c * 22);
      rootGroup.add(stripeV);
    }

    // 3. Central Plaza Fountain & Water Ring
    const fountainBorder = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 14, 0.6, 32),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.5 })
    );
    fountainBorder.position.set(0, -0.4, 0);
    rootGroup.add(fountainBorder);

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transmission: 0.85,
      roughness: 0.05,
      ior: 1.333,
      transparent: true,
      opacity: 0.9,
    });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(13.2, 13.2, 0.2, 32), waterMat);
    water.position.set(0, -0.2, 0);
    rootGroup.add(water);

    // 4. Two Enterable Key Corporate Skyscrapers with Walkable Grand Lobbies, Interior Stairs & Rooftop Observation Decks
    const enterableTowers = [
      { x: -55, z: -55, w: 28, h: 42, d: 28, col: 0x0f172a, winCol: 0x38bdf8, floors: 9, cols: 6, name: 'Aegis Capital Tower' },
      { x: 55, z: 55, w: 26, h: 38, d: 26, col: 0x1e293b, winCol: 0x00f0ff, floors: 8, cols: 5, name: 'Apex Zenith Center' },
    ];

    enterableTowers.forEach((b, idx) => {
      buildWalkableSkyscraper(
        this.scene,
        rootGroup,
        harvestables,
        chests,
        chestMeshes,
        staticColliders,
        b,
        idx
      );

      // Rooftop Observation Deck with Railing & Legendary Chest
      addChest(rootGroup, chests, chestMeshes, staticColliders, b.x, b.h + 0.2, b.z, 'rare_chest');
    });

    // 5. Towering Perimeter Skyscrapers (Non-enterable backdrop towers providing shadows & canyon lines)
    const backdropTowers = [
      { x: -55, z: 55, w: 24, h: 56, d: 24, col: 0x18181b, name: 'Vanguard Monolith' },
      { x: 55, z: -55, w: 26, h: 64, d: 26, col: 0x09090b, name: 'Titan Spire' },
      { x: -115, z: 0, w: 28, h: 48, d: 28, col: 0x1f2937, name: 'Sovereign Tower West' },
      { x: 115, z: 0, w: 28, h: 52, d: 28, col: 0x111827, name: 'Sovereign Tower East' },
    ];

    backdropTowers.forEach((t) => {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(t.x, 0, t.z);

      const facadeMat = new THREE.MeshStandardMaterial({
        color: t.col,
        roughness: 0.25,
        metalness: 0.85,
      });
      const towerMesh = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), facadeMat);
      towerMesh.position.y = t.h / 2;
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;
      towerGroup.add(towerMesh);

      // Glowing Corporate Logo Band at Top
      const bandMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const band = new THREE.Mesh(new THREE.BoxGeometry(t.w + 0.2, 2.5, t.d + 0.2), bandMat);
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

    // 6. Fast Drivable GT Sports Cars in the Avenue lanes
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, -24, 0.1, 12, 0xfacc15, 'Whiplash Gold GT', 'sports', 0);
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 24, 0.1, -12, 0xef4444, 'Whiplash Crimson Apex', 'sports', Math.PI);

    const benchMeshFinancial = createUpgradeBenchMesh();
    benchMeshFinancial.position.set(0, 0.1, 22);
    rootGroup.add(benchMeshFinancial);
    upgradeBenches.push({
      id: 'bench_financial',
      x: 0,
      y: 0.1,
      z: 22,
      mesh: benchMeshFinancial,
    });

    const spawnPoint = new THREE.Vector3(0, 0.2, 0);

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
      spawnPoint,
      getElevation,
    };
  }

  // =========================================================================
  // MAP 3: NEO-CITY HEIGHTS (Bi-Level Urban Canyon, Sunken Highways, Skywalk Bridges & Pavilions)
  // =========================================================================
  private generateNeoCityHeights(): MapDataResult {
    const rootGroup = new THREE.Group();
    rootGroup.name = 'Map_NeoCityHeights';

    const harvestables: HarvestableObject[] = [];
    const harvestableMeshes = new Map<string, THREE.Object3D>();
    const chests: LootChest[] = [];
    const chestMeshes = new Map<string, THREE.Group>();
    const staticColliders: SolidCollider[] = [];
    const vehicles: DrivableVehicle[] = [];
    const upgradeBenches: UpgradeBenchStation[] = [];

    // 1. Bi-Level Terraced Canyon Terrain (Segmented Plane 300x300, 64x64)
    const terrainGeo = new THREE.PlaneGeometry(300, 300, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);

    const getElevation = (x: number, z: number): number => {
      // Central Sunken Highway Trench (X: -22 to +22)
      if (Math.abs(x) < 22) {
        return -3.5; // Sunken freeway underpass
      }
      // Graded ramps linking sunken highway to upper corporate plaza
      if (Math.abs(x) >= 22 && Math.abs(x) <= 32) {
        const ratio = (Math.abs(x) - 22) / 10;
        return -3.5 + ratio * 6.5; // -3.5 up to +3.0
      }
      // Upper Terraced Metropark Plazas (Elevation +3.0)
      return 3.0;
    };

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, getElevation(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const neoTerrainMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.3,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, neoTerrainMat);
    terrainMesh.receiveShadow = true;
    rootGroup.add(terrainMesh);

    // 2. Sunken Highway Pavement
    const highwayPavement = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.15, 280),
      new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 })
    );
    highwayPavement.position.set(0, -3.45, 0);
    highwayPavement.receiveShadow = true;
    rootGroup.add(highwayPavement);

    // 3. Elevated Pedestrian Skywalk Bridges (spanning from West Plaza to East Plaza at Y = 4.2)
    const bridgeZCoords = [-60, 0, 60];
    bridgeZCoords.forEach((bz) => {
      const skywalk = new THREE.Group();
      skywalk.position.set(0, 3.8, bz);

      // Deck
      const deckMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(54, 0.4, 6.0), deckMat);
      deck.receiveShadow = true;
      skywalk.add(deck);

      // Glass Edge Railings
      const glassRailMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transmission: 0.75,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8,
      });
      for (const rz of [-2.85, 2.85]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(54, 1.2, 0.12), glassRailMat);
        rail.position.set(0, 0.8, rz);
        skywalk.add(rail);
      }

      rootGroup.add(skywalk);

      staticColliders.push({
        type: 'box',
        minX: -27,
        maxX: 27,
        minY: 3.6,
        maxY: 5.2,
        minZ: bz - 3.0,
        maxZ: bz + 3.0,
        name: `Skywalk Bridge at Z=${bz}`,
      });
    });

    // 4. Two-Story Commercial Pavilions with Open Storefronts & Mezzanines
    const pavilionCoords = [
      { x: -65, z: -40, name: 'Cyber Arcade Pavilion' },
      { x: 65, z: -40, name: 'Quantum Bistro Pavilion' },
      { x: -65, z: 40, name: 'Omni Retail Plaza' },
      { x: 65, z: 40, name: 'Holo-Tech Expo' },
    ];

    pavilionCoords.forEach((p) => {
      const pav = new THREE.Group();
      pav.position.set(p.x, 3.0, p.z);

      const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.6, roughness: 0.3 });
      const woodDeck = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.6 });

      // Ground Store Floor (Y = 0 relative to plaza Y = 3.0)
      const floor1 = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 14), woodDeck);
      floor1.position.y = 0.1;
      floor1.receiveShadow = true;
      pav.add(floor1);

      // 2nd Story Mezzanine Walkway (Y = 4.0)
      const mezzanine = new THREE.Mesh(new THREE.BoxGeometry(16, 0.25, 8), woodDeck);
      mezzanine.position.set(0, 4.0, -3.0);
      mezzanine.receiveShadow = true;
      pav.add(mezzanine);

      // Outdoor Service Ramp leading to Mezzanine
      const rampGeo = new THREE.BoxGeometry(3.0, 0.2, 9.0);
      const ramp = new THREE.Mesh(rampGeo, woodDeck);
      ramp.position.set(7.0, 2.0, 1.5);
      ramp.rotation.x = -Math.atan2(4.0, 9.0);
      pav.add(ramp);

      // Roof Canopy
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(17, 0.3, 15),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.4 })
      );
      roof.position.y = 7.5;
      pav.add(roof);

      rootGroup.add(pav);

      // Colliders for pavilion floors
      staticColliders.push({
        type: 'box',
        minX: p.x - 8,
        maxX: p.x + 8,
        minY: 3.0,
        maxY: 3.3,
        minZ: p.z - 7,
        maxZ: p.z + 7,
        name: `${p.name} Ground Floor`,
      });

      staticColliders.push({
        type: 'box',
        minX: p.x - 8,
        maxX: p.x + 8,
        minY: 6.8,
        maxY: 7.3,
        minZ: p.z - 7,
        maxZ: p.z + 1,
        name: `${p.name} Mezzanine`,
      });

      addChest(rootGroup, chests, chestMeshes, staticColliders, p.x, 7.3, p.z - 2.5, 'rare_chest');
    });

    // 5. Perimeter Modern High-Rises with Rooftop Helipads
    const helipadCoords = [
      { x: -105, z: 0, h: 36, name: 'Neo Tower One' },
      { x: 105, z: 0, h: 40, name: 'Neo Tower Two' },
    ];

    helipadCoords.forEach((t) => {
      const tower = new THREE.Group();
      tower.position.set(t.x, 3.0, t.z);

      const facade = new THREE.Mesh(
        new THREE.BoxGeometry(26, t.h, 26),
        new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.9, roughness: 0.15 })
      );
      facade.position.y = t.h / 2;
      facade.castShadow = true;
      facade.receiveShadow = true;
      tower.add(facade);

      // Rooftop Helipad
      const helipadRing = new THREE.Mesh(
        new THREE.RingGeometry(5.0, 6.2, 32),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
      );
      helipadRing.rotateX(-Math.PI / 2);
      helipadRing.position.set(0, t.h + 0.05, 0);
      tower.add(helipadRing);

      rootGroup.add(tower);

      staticColliders.push({
        type: 'box',
        minX: t.x - 13,
        maxX: t.x + 13,
        minY: 3.0,
        maxY: 3.0 + t.h,
        minZ: t.z - 13,
        maxZ: t.z + 13,
        name: t.name,
      });

      // Rooftop Launch pad
      SKYSCRAPER_LAUNCH_PADS.push({
        x: t.x,
        y: 3.0,
        z: t.z,
        targetY: 3.0 + t.h,
        name: `${t.name} Helipad Ascender`,
      });
    });

    // 6. Fast Vehicles in Sunken Highway
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, -8, -3.4, 30, 0x06b6d4, 'Whiplash Cyber Cyan', 'sports', 0);
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 8, -3.4, -30, 0x8b5cf6, 'Whiplash Apex Violet', 'sports', Math.PI);

    const benchMeshNeo = createUpgradeBenchMesh();
    benchMeshNeo.position.set(0, 4.0, 0);
    rootGroup.add(benchMeshNeo);
    upgradeBenches.push({
      id: 'bench_neocity',
      x: 0,
      y: 4.0,
      z: 0,
      mesh: benchMeshNeo,
    });

    const spawnPoint = new THREE.Vector3(0, 4.2, 0);

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
      spawnPoint,
      getElevation,
    };
  }
}
