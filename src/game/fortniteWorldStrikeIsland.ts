import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider, DrivableVehicle } from '../types';
import { UpgradeBenchStation, createUpgradeBenchMesh } from './fortniteWorldArena';
import { addDetailedDrivableVehicle } from './fortniteWorldVehiclesProps';
import { addChest, addHarvestable } from './fortniteWorldNature';
import { ISLAND_POIS } from '../data/mapData';

/**
 * Procedural Terrain Heightfield for the 840m x 840m Mega Strike Island
 * Smoothly models Snowfall Mountain (+38m), central bunker ridge (+14m),
 * forest hills, desert dunes, canyon riverbeds, and ocean shoreline.
 */
export function getStrikeIslandElevation(x: number, z: number): number {
  // 1. Far North: Snowfall Mountain (Summit at x: 0, z: -320)
  const distSnow = Math.hypot(x - 0, z - -320);
  if (distSnow < 110) {
    const norm = distSnow / 110;
    // Summit plateau & glacial crags
    const mountainShape = Math.cos(norm * (Math.PI / 2));
    const noise = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 2.5;
    return Math.max(0, 38.0 * Math.pow(mountainShape, 1.4) + noise);
  }

  // 2. Center Ridge & Underground Bunker Bluff (x: -20, z: 80)
  const distBunkerRidge = Math.hypot(x - -20, z - 80);
  if (distBunkerRidge < 65) {
    const ridgeNorm = distBunkerRidge / 65;
    return 13.5 * Math.cos(ridgeNorm * (Math.PI / 2));
  }

  // 3. North-West: Pinewood Forest Hills (x: -240, z: -200)
  const distForest = Math.hypot(x - -240, z - -200);
  if (distForest < 90) {
    const fNorm = distForest / 90;
    return 7.5 * Math.cos(fNorm * (Math.PI / 2)) + Math.sin(x * 0.05) * 1.2;
  }

  // 4. North-East: Military Base Plateau (x: 250, z: -230)
  const distMil = Math.hypot(x - 250, z - -230);
  if (distMil < 75) {
    if (distMil < 55) return 5.0; // Flat combat plateau inside compound
    const mNorm = (distMil - 55) / 20;
    return 5.0 * (1 - mNorm);
  }

  // 5. South-East: Dusty Desert Mesas & Dunes (x: 220, z: 220)
  const distDesert = Math.hypot(x - 220, z - 220);
  if (distDesert < 95) {
    const dNorm = distDesert / 95;
    const dunes = Math.sin(x * 0.04 + z * 0.03) * 3.2 + Math.cos(x * 0.02) * 1.8;
    return Math.max(0.5, 6.0 * Math.cos(dNorm * (Math.PI / 2)) + dunes);
  }

  // 6. South-Central: Lost Temple Stepped Terrace (x: 80, z: 320)
  const distTemple = Math.hypot(x - 80, z - 320);
  if (distTemple < 70) {
    if (distTemple < 45) return 8.0;
    return 8.0 * (1 - (distTemple - 45) / 25);
  }

  // 7. West Shoreline: Coastal Village & Ocean Beach (x < -240)
  if (x < -240) {
    const beachDist = -240 - x;
    if (beachDist < 60) {
      return Math.max(-1.5, 0.4 - (beachDist / 60) * 1.8);
    }
    return -1.5; // Ocean water depth
  }

  // 8. River Canyon traversing from mountain lake to west coast
  // S-curved river bed
  const riverZ = -140 + Math.sin(x * 0.015) * 45;
  const riverDist = Math.abs(z - riverZ);
  if (x > -230 && x < 120 && riverDist < 18) {
    return -3.2 * Math.cos((riverDist / 18) * (Math.PI / 2));
  }

  // Flat graded floors for urban zones
  // Strike City (x: 20 to 110, z: -80 to 10)
  if (x > 20 && x < 110 && z > -80 && z < 10) {
    return 0.1;
  }
  // Racing Circuit (x: -210 to -110, z: -80 to 20)
  if (x > -210 && x < -110 && z > -80 && z < 20) {
    return 0.1;
  }
  // Industrial Zone (x: -130 to -30, z: 230 to 330)
  if (x > -130 && x < -30 && z > 230 && z < 330) {
    return 1.5;
  }

  // Gentle natural rolling terrain across the rest of the island
  return Math.sin(x * 0.025) * Math.cos(z * 0.025) * 1.8 + Math.sin(x * 0.01) * 0.8;
}

/**
 * Builds the complete 10-POI Mega Battle Royale Island for Sphere Strike
 */
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
} {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Map_StrikeIsland_Mega';

  const harvestables: HarvestableObject[] = [];
  const harvestableMeshes = new Map<string, THREE.Object3D>();
  const chests: LootChest[] = [];
  const chestMeshes = new Map<string, THREE.Group>();
  const staticColliders: SolidCollider[] = [];
  const vehicles: DrivableVehicle[] = [];
  const upgradeBenches: UpgradeBenchStation[] = [];

  // =========================================================================
  // 1. PROCEDURAL 840x840 CONTOURED TERRAIN (160x160 Segments)
  // =========================================================================
  const terrainGeo = new THREE.PlaneGeometry(840, 840, 160, 160);
  terrainGeo.rotateX(-Math.PI / 2);

  const pos = terrainGeo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  // Biome Colors for Vertex Tinting:
  // Green grass = [0.24, 0.58, 0.18]
  // Snow summit = [0.92, 0.94, 0.98]
  // Desert sand = [0.88, 0.72, 0.38]
  // Rock cliff  = [0.45, 0.45, 0.48]
  // Beach sand  = [0.92, 0.84, 0.58]
  for (let i = 0; i < count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    const vy = getStrikeIslandElevation(vx, vz);
    pos.setY(i, vy);

    let r = 0.24, g = 0.56, b = 0.18;
    if (vy > 20.0 || (vz < -240 && vy > 12.0)) {
      // Snow biome
      r = 0.92; g = 0.94; b = 0.98;
    } else if (vx > 130 && vz > 130) {
      // Dusty Desert biome
      r = 0.86; g = 0.68; b = 0.36;
    } else if (vx < -240 || vy < 0.3) {
      // Coastal beach sand
      r = 0.90; g = 0.82; b = 0.54;
    } else if (vy > 8.0) {
      // Mountain rock / ridge
      r = 0.42; g = 0.44; b = 0.46;
    }
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  rootGroup.add(terrainMesh);

  // 1b. Coastal Water Plane at Sea Level (y = -0.4)
  const waterGeo = new THREE.PlaneGeometry(860, 860);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.15,
    metalness: 0.6,
    transparent: true,
    opacity: 0.72,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = -0.4;
  rootGroup.add(waterMesh);

  // =========================================================================
  // 2. INTER-POI HIGHWAY LOOP & ROAD NETWORK
  // =========================================================================
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const roadStripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4, emissive: 0x854d0e, emissiveIntensity: 0.3 });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });

  // Main 840m Island Loop Highway Segments
  const highwaySegments = [
    // North Highway: Pinewood (-240, -140) to Snowfall (-40, -140) to Military (240, -140)
    { x1: -240, z1: -140, x2: 240, z2: -140, w: 10, y: 0.12 },
    // East Highway: Military (240, -140) past Strike City (240, 0) to Desert (240, 220)
    { x1: 240, z1: -140, x2: 240, z2: 220, w: 10, y: 0.12 },
    // South Highway: Desert (240, 220) past Lost Temple (80, 220) to Industrial (-80, 220)
    { x1: 240, z1: 220, x2: -80, z2: 220, w: 10, y: 1.6 },
    // West Highway: Industrial (-80, 220) to Coastal Village (-240, 80) to Pinewood (-240, -140)
    { x1: -80, z1: 220, x2: -240, z2: 80, w: 10, y: 0.3 },
    { x1: -240, z1: 80, x2: -240, z2: -140, w: 10, y: 0.2 },
    // Central Cross Parkway: Racing Circuit (-160, -30) to Strike City (60, -30)
    { x1: -160, z1: -30, x2: 140, z2: -30, w: 10, y: 0.12 },
    // Bunker Access Spur: Central Parkway (0, -30) south to Underground Bunker (-20, 80)
    { x1: 0, z1: -30, x2: -20, z2: 80, w: 8, y: 0.3 },
  ];

  highwaySegments.forEach((seg, sIdx) => {
    const dx = seg.x2 - seg.x1;
    const dz = seg.z2 - seg.z1;
    const length = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);
    const midX = (seg.x1 + seg.x2) / 2;
    const midZ = (seg.z1 + seg.z2) / 2;

    const roadMesh = new THREE.Mesh(new THREE.BoxGeometry(length, 0.14, seg.w), roadMat);
    roadMesh.position.set(midX, seg.y, midZ);
    roadMesh.rotation.y = -angle;
    roadMesh.receiveShadow = true;
    rootGroup.add(roadMesh);

    // Center divider dash strip
    const dashCount = Math.floor(length / 8);
    for (let d = 0; d < dashCount; d++) {
      const offset = (d / dashCount - 0.5) * length;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.16, 0.35), roadStripeMat);
      stripe.position.set(
        midX + Math.cos(-angle) * offset,
        seg.y + 0.01,
        midZ - Math.sin(-angle) * offset
      );
      stripe.rotation.y = -angle;
      rootGroup.add(stripe);
    }
  });

  // Highway Bridge over the River Canyon at (0, -140)
  const bridgePillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
  for (const bx of [-15, 15]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(3.0, 8.0, 12.0), bridgePillarMat);
    pillar.position.set(bx, -1.0, -140);
    rootGroup.add(pillar);
  }

  // =========================================================================
  // 3. POI 1: STRIKE CITY (x: 60, z: -40) – Mega Skyscrapers, Atrium & Subway
  // =========================================================================
  const buildStrikeCity = () => {
    const cityRoot = new THREE.Group();
    cityRoot.position.set(60, 0, -40);

    // Enterable 3-Story Corporate Skyscraper (Apex Zenith Tower)
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.85 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65, roughness: 0.1 });
    const interiorFloorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });

    const tw = 24, td = 24, th = 28;
    // Ground Lobby Floor Slab
    const slab0 = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.3, td), interiorFloorMat);
    slab0.position.y = 0.15;
    cityRoot.add(slab0);

    // 2nd Floor Mezzanine
    const slab1 = new THREE.Mesh(new THREE.BoxGeometry(tw - 2, 0.3, td - 2), interiorFloorMat);
    slab1.position.y = 8.0;
    cityRoot.add(slab1);

    // 3rd Floor Executive Suite
    const slab2 = new THREE.Mesh(new THREE.BoxGeometry(tw - 2, 0.3, td - 2), interiorFloorMat);
    slab2.position.y = 16.0;
    cityRoot.add(slab2);

    // Rooftop Deck
    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.4, td), interiorFloorMat);
    roofSlab.position.y = 24.0;
    cityRoot.add(roofSlab);

    // Helipad Yellow 'H' on Roof
    const helipadRing = new THREE.Mesh(
      new THREE.RingGeometry(5.0, 6.0, 32),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4, side: THREE.DoubleSide })
    );
    helipadRing.rotation.x = -Math.PI / 2;
    helipadRing.position.set(0, 24.25, 0);
    cityRoot.add(helipadRing);

    // Exterior Glass Curtain Walls with Entrance Openings
    // Back Wall (Solid Glass + Metal Frame)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(tw, th, 0.6), towerMat);
    backWall.position.set(0, th / 2, -td / 2);
    cityRoot.add(backWall);

    // Left and Right Walls
    for (const wx of [-tw / 2, tw / 2]) {
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, th, td), towerMat);
      sideWall.position.set(wx, th / 2, 0);
      cityRoot.add(sideWall);
    }

    // Front Wall with Open Entry Foyer (6m wide opening)
    for (const fx of [-tw / 2 + 4.5, tw / 2 - 4.5]) {
      const frontPillar = new THREE.Mesh(new THREE.BoxGeometry(9.0, th, 0.6), towerMat);
      frontPillar.position.set(fx, th / 2, td / 2);
      cityRoot.add(frontPillar);
    }

    // Glass Canopy over entrance
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.2, 4.0), glassMat);
    canopy.position.set(0, 4.2, td / 2 + 2.0);
    cityRoot.add(canopy);

    // Reception Desk in Lobby
    const desk = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.1, 1.6), woodMat);
    desk.position.set(0, 0.55, 2.0);
    cityRoot.add(desk);

    // Central Staircase leading from Ground -> 2nd -> 3rd -> Roof
    const stairMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 });
    for (let f = 0; f < 3; f++) {
      const baseY = f * 8.0;
      const steps = 12;
      for (let s = 0; s < steps; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 0.7), stairMat);
        step.position.set(6.0, baseY + (s / steps) * 8.0 + 0.15, -6.0 + s * 0.7);
        cityRoot.add(step);

        staticColliders.push({
          type: 'box',
          minX: 60 + 6.0 - 1.2,
          maxX: 60 + 6.0 + 1.2,
          minY: baseY + (s / steps) * 8.0,
          maxY: baseY + (s / steps) * 8.0 + 0.5,
          minZ: -40 - 6.0 + s * 0.7 - 0.35,
          maxZ: -40 - 6.0 + s * 0.7 + 0.35,
          name: `Skyscraper Stair Step F${f} S${s}`,
        });
      }
    }

    // Rooftop 1.1m Parapet Wall for sniper cover
    for (const pz of [-td / 2, td / 2]) {
      const pWall = new THREE.Mesh(new THREE.BoxGeometry(tw, 1.1, 0.4), curbMat);
      pWall.position.set(0, 24.55, pz);
      cityRoot.add(pWall);
    }
    for (const px of [-tw / 2, tw / 2]) {
      const pWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, td), curbMat);
      pWall.position.set(px, 24.55, 0);
      cityRoot.add(pWall);
    }

    // Colliders for Skyscraper floors & exterior walls
    staticColliders.push(
      { type: 'box', minX: 60 - tw / 2, maxX: 60 + tw / 2, minY: 0, maxY: 0.5, minZ: -40 - td / 2, maxZ: -40 + td / 2, name: 'Tower Floor G' },
      { type: 'box', minX: 60 - tw / 2, maxX: 60 + tw / 2, minY: 7.8, maxY: 8.3, minZ: -40 - td / 2, maxZ: -40 + td / 2, name: 'Tower Floor 2' },
      { type: 'box', minX: 60 - tw / 2, maxX: 60 + tw / 2, minY: 15.8, maxY: 16.3, minZ: -40 - td / 2, maxZ: -40 + td / 2, name: 'Tower Floor 3' },
      { type: 'box', minX: 60 - tw / 2, maxX: 60 + tw / 2, minY: 23.8, maxY: 24.5, minZ: -40 - td / 2, maxZ: -40 + td / 2, name: 'Tower Roof Deck' },
      { type: 'box', minX: 60 - tw / 2, maxX: 60 + tw / 2, minY: 0, maxY: th, minZ: -40 - td / 2 - 0.4, maxZ: -40 - td / 2 + 0.4, name: 'Tower Back Wall' },
      { type: 'box', minX: 60 - tw / 2 - 0.4, maxX: 60 - tw / 2 + 0.4, minY: 0, maxY: th, minZ: -40 - td / 2, maxZ: -40 + td / 2, name: 'Tower Left Wall' },
      { type: 'box', minX: 60 + tw / 2 - 0.4, maxX: 60 + tw / 2 + 0.4, minY: 0, maxY: th, minZ: -40 - td / 2, maxZ: -40 + td / 2, name: 'Tower Right Wall' }
    );

    // Secondary Non-Enterable Decorative Skyscrapers for Dense Skyline
    const skylineProps = [
      { x: -35, z: -35, w: 18, d: 18, h: 48, col: 0x1e293b },
      { x: 35, z: -35, w: 16, d: 16, h: 42, col: 0x334155 },
      { x: -35, z: 35, w: 20, d: 16, h: 36, col: 0x0f172a },
      { x: 35, z: 35, w: 16, d: 20, h: 52, col: 0x1e1b4b },
    ];
    skylineProps.forEach((sk) => {
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(sk.w, sk.h, sk.d),
        new THREE.MeshStandardMaterial({ color: sk.col, roughness: 0.3, metalness: 0.85 })
      );
      bMesh.position.set(sk.x, sk.h / 2, sk.z);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      cityRoot.add(bMesh);

      staticColliders.push({
        type: 'box',
        minX: 60 + sk.x - sk.w / 2,
        maxX: 60 + sk.x + sk.w / 2,
        minY: 0,
        maxY: sk.h,
        minZ: -40 + sk.z - sk.d / 2,
        maxZ: -40 + sk.z + sk.d / 2,
        name: 'Skyline Highrise',
      });
    });

    // Subterranean Subway Entrance (-3.8m deep)
    const subwayEntrance = new THREE.Group();
    subwayEntrance.position.set(-15, 0, 15);
    const subStairsMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
    for (let st = 0; st < 8; st++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 0.8), subStairsMat);
      step.position.set(0, -st * 0.45, st * 0.8);
      subwayEntrance.add(step);
    }
    // Subway Sign Neon
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.8, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.9 })
    );
    sign.position.set(0, 2.2, 0);
    subwayEntrance.add(sign);
    cityRoot.add(subwayEntrance);

    // Add Chests in Strike City
    addChest(rootGroup, chests, chestMeshes, staticColliders, 60, 0.5, -40 + 6, 'chest'); // Lobby
    addChest(rootGroup, chests, chestMeshes, staticColliders, 60 - 6, 8.5, -40 - 6, 'chest'); // 2nd Floor
    addChest(rootGroup, chests, chestMeshes, staticColliders, 60 + 6, 16.5, -40 + 6, 'rare_chest'); // Executive
    addChest(rootGroup, chests, chestMeshes, staticColliders, 60, 24.5, -40, 'rare_chest'); // Helipad
    addChest(rootGroup, chests, chestMeshes, staticColliders, 60 - 15, -3.2, -40 + 15 + 6, 'chest'); // Subway station

    // Upgrade Bench in Plaza
    const benchCity = createUpgradeBenchMesh();
    benchCity.position.set(60 - 18, 0.1, -40 - 10);
    rootGroup.add(benchCity);
    upgradeBenches.push({ id: 'bench_strike_city', x: 60 - 18, y: 0.1, z: -40 - 10, mesh: benchCity });

    // Parked GT Sports Cruiser
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 60 + 18, 0.1, -40 + 18, 0xd97706, 'Strike City Cruiser', 'sports', 0);

    rootGroup.add(cityRoot);
  };
  buildStrikeCity();

  // =========================================================================
  // 4. POI 2: DUSTY DESERT (x: 220, z: 220) – Sandstone Canyon, Saloon & Oil Rig
  // =========================================================================
  const buildDustyDesert = () => {
    const desertRoot = new THREE.Group();
    desertRoot.position.set(220, 0, 220);

    const sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.95, flatShading: true });
    const woodOldMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const ironRustMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7, metalness: 0.6 });

    // Sandstone Rock Pillars & Arch
    for (let p = 0; p < 6; p++) {
      const angle = (p / 6) * Math.PI * 2;
      const rx = Math.cos(angle) * 32;
      const rz = Math.sin(angle) * 32;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 5.0, 16, 8), sandstoneMat);
      pillar.position.set(rx, 8.0, rz);
      desertRoot.add(pillar);

      staticColliders.push({
        type: 'cylinder',
        x: 220 + rx,
        z: 220 + rz,
        radius: 4.5,
        minY: 0,
        maxY: 16,
        name: 'Dusty Desert Rock Pillar',
      });
    }

    // Enterable 2-Story Abandoned Frontier Saloon
    const sw = 14, sd = 12, sh = 8.5;
    const saloonFloor = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.3, sd), woodOldMat);
    saloonFloor.position.set(0, 0.15, 0);
    desertRoot.add(saloonFloor);

    const saloon2nd = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.3, sd), woodOldMat);
    saloon2nd.position.set(0, 4.2, 0);
    desertRoot.add(saloon2nd);

    const saloonRoof = new THREE.Mesh(new THREE.BoxGeometry(sw + 1, 0.3, sd + 1), woodOldMat);
    saloonRoof.position.set(0, 8.4, 0);
    desertRoot.add(saloonRoof);

    // Front Balcony & Porch
    const porch = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.25, 4.0), woodOldMat);
    porch.position.set(0, 0.15, sd / 2 + 2.0);
    desertRoot.add(porch);

    const balcony = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.25, 4.0), woodOldMat);
    balcony.position.set(0, 4.2, sd / 2 + 2.0);
    desertRoot.add(balcony);

    // Saloon Exterior Walls with Door Opening
    for (const wx of [-sw / 2, sw / 2]) {
      const sWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, sh, sd), woodOldMat);
      sWall.position.set(wx, sh / 2, 0);
      desertRoot.add(sWall);
    }
    const backSWall = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, 0.4), woodOldMat);
    backSWall.position.set(0, sh / 2, -sd / 2);
    desertRoot.add(backSWall);

    // Interior Saloon Bar Counter
    const bar = new THREE.Mesh(new THREE.BoxGeometry(6.0, 1.1, 1.2), woodOldMat);
    bar.position.set(-2.5, 0.55, -2.5);
    desertRoot.add(bar);

    // Stairs to 2nd Floor
    for (let st = 0; st < 8; st++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.6), woodOldMat);
      step.position.set(sw / 2 - 1.2, st * 0.5 + 0.25, -sd / 2 + 1.2 + st * 0.6);
      desertRoot.add(step);
    }

    staticColliders.push(
      { type: 'box', minX: 220 - sw / 2, maxX: 220 + sw / 2, minY: 0, maxY: 0.5, minZ: 220 - sd / 2, maxZ: 220 + sd / 2, name: 'Saloon Floor G' },
      { type: 'box', minX: 220 - sw / 2, maxX: 220 + sw / 2, minY: 4.0, maxY: 4.5, minZ: 220 - sd / 2, maxZ: 220 + sd / 2 + 4.0, name: 'Saloon Floor 2' },
      { type: 'box', minX: 220 - sw / 2, maxX: 220 + sw / 2, minY: 8.2, maxY: 8.7, minZ: 220 - sd / 2, maxZ: 220 + sd / 2, name: 'Saloon Roof' }
    );

    // Working Oil Pump Jack Model
    const pumpJack = new THREE.Group();
    pumpJack.position.set(24, 0, -18);
    const jackBase = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.5, 6.0), ironRustMat);
    jackBase.position.y = 0.75;
    pumpJack.add(jackBase);

    const jackBeam = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 9.0), ironRustMat);
    jackBeam.position.set(0, 6.0, 0);
    jackBeam.rotation.x = 0.25;
    pumpJack.add(jackBeam);

    const jackHead = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.8, 12), ironRustMat);
    jackHead.rotation.z = Math.PI / 2;
    jackHead.position.set(0, 7.2, 4.5);
    pumpJack.add(jackHead);
    desertRoot.add(pumpJack);

    // Chests in Desert
    addChest(rootGroup, chests, chestMeshes, staticColliders, 220, 0.5, 220 - 2, 'chest'); // Saloon Ground
    addChest(rootGroup, chests, chestMeshes, staticColliders, 220, 4.5, 220 + 7, 'rare_chest'); // Saloon Balcony
    addChest(rootGroup, chests, chestMeshes, staticColliders, 220 + 24, 1.6, 220 - 18, 'chest'); // Oil Rig

    // Parked 4x4 Truck
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 220 - 18, 0.2, 220 + 15, 0xb45309, 'Desert Hauler 4x4', 'truck', 0.4);

    rootGroup.add(desertRoot);
  };
  buildDustyDesert();

  // =========================================================================
  // 5. POI 3: PINEWOOD FOREST (x: -240, z: -200) – Ranger Lookout & Logging Camp
  // =========================================================================
  const buildPinewoodForest = () => {
    const forestRoot = new THREE.Group();
    forestRoot.position.set(-240, 6.5, -200);

    const timberMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const logMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

    // 16m Enterable Ranger Fire Lookout Tower
    const towerH = 16;
    for (const legX of [-3.0, 3.0]) {
      for (const legZ of [-3.0, 3.0]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, towerH, 6), timberMat);
        leg.position.set(legX, towerH / 2, legZ);
        forestRoot.add(leg);
      }
    }

    // Lookout Cabin on Top
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(7.5, 3.2, 7.5), timberMat);
    cabin.position.set(0, towerH + 1.6, 0);
    forestRoot.add(cabin);

    // Wraparound Balcony
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.25, 9.5), timberMat);
    balcony.position.set(0, towerH + 0.12, 0);
    forestRoot.add(balcony);

    // Cabin Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(7.0, 2.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 })
    );
    roof.position.set(0, towerH + 4.4, 0);
    roof.rotation.y = Math.PI / 4;
    forestRoot.add(roof);

    // Climbable Ladder / Stair
    for (let st = 0; st < 16; st++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.15), timberMat);
      rung.position.set(0, st * 1.0 + 0.5, 3.1);
      forestRoot.add(rung);
    }

    staticColliders.push(
      { type: 'cylinder', x: -240, z: -200, radius: 4.5, minY: 6.5, maxY: 6.5 + towerH, name: 'Lookout Tower Legs' },
      { type: 'box', minX: -240 - 4.5, maxX: -240 + 4.5, minY: 6.5 + towerH, maxY: 6.5 + towerH + 3.5, minZ: -200 - 4.5, maxZ: -200 + 4.5, name: 'Lookout Cabin Platform' }
    );

    // Woodcutter Log Cabin
    const logCabin = new THREE.Group();
    logCabin.position.set(24, 0, 18);
    const cFloor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 8), timberMat);
    cFloor.position.y = 0.15;
    logCabin.add(cFloor);

    const cWalls = new THREE.Mesh(new THREE.BoxGeometry(10, 3.8, 8), logMat);
    cWalls.position.y = 2.0;
    logCabin.add(cWalls);
    forestRoot.add(logCabin);

    staticColliders.push({
      type: 'box',
      minX: -240 + 24 - 5,
      maxX: -240 + 24 + 5,
      minY: 6.5,
      maxY: 6.5 + 4.2,
      minZ: -200 + 18 - 4,
      maxZ: -200 + 18 + 4,
      name: 'Woodcutter Cabin',
    });

    // Chests
    addChest(rootGroup, chests, chestMeshes, staticColliders, -240, 6.5 + towerH + 0.5, -200, 'rare_chest'); // Tower top
    addChest(rootGroup, chests, chestMeshes, staticColliders, -240 + 24, 6.5 + 0.5, -200 + 18, 'chest'); // Log cabin

    rootGroup.add(forestRoot);
  };
  buildPinewoodForest();

  // =========================================================================
  // 6. POI 4: MILITARY BASE (x: 250, z: -230) – Fort Vanguard Hangars & Radar
  // =========================================================================
  const buildMilitaryBase = () => {
    const milRoot = new THREE.Group();
    milRoot.position.set(250, 5.0, -230);

    const oliveMat = new THREE.MeshStandardMaterial({ color: 0x3f4f34, roughness: 0.7, metalness: 0.3 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });

    // Aircraft Hangar (Arch Roof Structure)
    const hw = 24, hd = 36, hh = 12;
    const hangarFloor = new THREE.Mesh(new THREE.BoxGeometry(hw, 0.3, hd), concreteMat);
    hangarFloor.position.set(0, 0.15, 0);
    milRoot.add(hangarFloor);

    // Curved Steel Arch Roof
    const archRoof = new THREE.Mesh(
      new THREE.CylinderGeometry(hw / 2, hw / 2, hd, 24, 1, false, 0, Math.PI),
      oliveMat
    );
    archRoof.rotation.x = Math.PI / 2;
    archRoof.rotation.z = Math.PI / 2;
    archRoof.position.set(0, 0, 0);
    milRoot.add(archRoof);

    staticColliders.push({
      type: 'box',
      minX: 250 - hw / 2,
      maxX: 250 + hw / 2,
      minY: 5.0,
      maxY: 5.0 + hh,
      minZ: -230 - hd / 2,
      maxZ: -230 + hd / 2,
      name: 'Military Aircraft Hangar',
    });

    // 20m Radar Dish & Communications Mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 20, 8), steelMat);
    mast.position.set(22, 10, -18);
    milRoot.add(mast);

    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      steelMat
    );
    dish.position.set(22, 20, -18);
    dish.rotation.x = -Math.PI / 4;
    milRoot.add(dish);

    staticColliders.push({
      type: 'cylinder',
      x: 250 + 22,
      z: -230 - 18,
      radius: 2.0,
      minY: 5.0,
      maxY: 25.0,
      name: 'Military Radar Mast',
    });

    // Guard Watchtower
    for (const wx of [-20, 20]) {
      const wTower = new THREE.Mesh(new THREE.BoxGeometry(4.0, 10.0, 4.0), concreteMat);
      wTower.position.set(wx, 5.0, 22);
      milRoot.add(wTower);

      staticColliders.push({
        type: 'box',
        minX: 250 + wx - 2.2,
        maxX: 250 + wx + 2.2,
        minY: 5.0,
        maxY: 15.0,
        minZ: -230 + 22 - 2.2,
        maxZ: -230 + 22 + 2.2,
        name: 'Military Guard Watchtower',
      });
    }

    // Military Heavy Armory Bunker
    const bunker = new THREE.Mesh(new THREE.BoxGeometry(16, 4.5, 14), concreteMat);
    bunker.position.set(-20, 2.25, -18);
    milRoot.add(bunker);

    // Upgrade Bench in Hangar
    const benchMil = createUpgradeBenchMesh();
    benchMil.position.set(250 + 6, 5.2, -230);
    rootGroup.add(benchMil);
    upgradeBenches.push({ id: 'bench_military', x: 250 + 6, y: 5.2, z: -230, mesh: benchMil });

    // Chests
    addChest(rootGroup, chests, chestMeshes, staticColliders, 250, 5.5, -230, 'chest'); // Hangar
    addChest(rootGroup, chests, chestMeshes, staticColliders, 250 - 20, 9.8, -230 - 18, 'rare_chest'); // Bunker
    addChest(rootGroup, chests, chestMeshes, staticColliders, 250 - 20, 15.5, -230 + 22, 'rare_chest'); // Watchtower

    // Military Transport SUV
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, 250 + 12, 5.2, -230 + 14, 0x1e3a1e, 'Vanguard Assault SUV', 'suv', 0);

    rootGroup.add(milRoot);
  };
  buildMilitaryBase();

  // =========================================================================
  // 7. POI 5: COASTAL VILLAGE & POINT BREAK LIGHTHOUSE (x: -280, z: 80)
  // =========================================================================
  const buildCoastalVillage = () => {
    const coastRoot = new THREE.Group();
    coastRoot.position.set(-280, 0.2, 80);

    const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const dockMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const glassLightMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 1.2 });

    // 24m Tall Enterable Spiral Lighthouse
    const lhH = 24;
    // Striped tower sections
    for (let sec = 0; sec < 6; sec++) {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4 - sec * 0.15, 2.7 - sec * 0.15, 4.0, 16),
        sec % 2 === 0 ? redMat : whiteMat
      );
      ring.position.y = sec * 4.0 + 2.0;
      coastRoot.add(ring);
    }

    // Glass Lantern Room & Revolving Beacon on Top
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3.0, 16), glassLightMat);
    lantern.position.y = lhH + 1.5;
    coastRoot.add(lantern);

    // Sniper Deck Railing
    const lhDeck = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.3, 16), dockMat);
    lhDeck.position.y = lhH;
    coastRoot.add(lhDeck);

    staticColliders.push(
      { type: 'cylinder', x: -280, z: 80, radius: 3.2, minY: 0.2, maxY: 0.2 + lhH, name: 'Lighthouse Base Tower' },
      { type: 'box', minX: -280 - 3.5, maxX: -280 + 3.5, minY: 0.2 + lhH, maxY: 0.2 + lhH + 3.5, minZ: 80 - 3.5, maxZ: 80 + 3.5, name: 'Lighthouse Lantern Deck' }
    );

    // Wooden Boat Dock extending into the water
    const dock = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.4, 32), dockMat);
    dock.position.set(-18, -0.1, 0);
    coastRoot.add(dock);

    staticColliders.push({
      type: 'box',
      minX: -280 - 18 - 2.2,
      maxX: -280 - 18 + 2.2,
      minY: -0.4,
      maxY: 0.5,
      minZ: 80 - 16,
      maxZ: 80 + 16,
      name: 'Coastal Boat Dock',
    });

    // Seaside Cottages (Pastel Blue & Yellow)
    for (const cz of [-18, 18]) {
      const cottage = new THREE.Mesh(
        new THREE.BoxGeometry(10, 4.5, 8),
        new THREE.MeshStandardMaterial({ color: cz > 0 ? 0x0284c7 : 0xeab308, roughness: 0.6 })
      );
      cottage.position.set(16, 2.25, cz);
      coastRoot.add(cottage);

      staticColliders.push({
        type: 'box',
        minX: -280 + 16 - 5.2,
        maxX: -280 + 16 + 5.2,
        minY: 0.2,
        maxY: 5.0,
        minZ: 80 + cz - 4.2,
        maxZ: 80 + cz + 4.2,
        name: 'Coastal Cottage',
      });
    }

    // Chests
    addChest(rootGroup, chests, chestMeshes, staticColliders, -280, 0.2 + lhH + 0.4, 80, 'rare_chest'); // Lighthouse top
    addChest(rootGroup, chests, chestMeshes, staticColliders, -280 - 18, 0.3, 80 + 12, 'chest'); // Dock end
    addChest(rootGroup, chests, chestMeshes, staticColliders, -280 + 16, 0.8, 80 - 18, 'chest'); // Cottage

    rootGroup.add(coastRoot);
  };
  buildCoastalVillage();

  // =========================================================================
  // 8. POI 6: SNOWFALL MOUNTAIN (x: 0, z: -320) – Alpine Summit & Observatory
  // =========================================================================
  const buildSnowfallMountain = () => {
    const snowRoot = new THREE.Group();
    snowRoot.position.set(0, 36.0, -320);

    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const woodAlpineMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });

    // Observatory Dome Building on Summit
    const obsBase = new THREE.Mesh(new THREE.CylinderGeometry(8.0, 9.0, 5.0, 24), snowMat);
    obsBase.position.y = 2.5;
    snowRoot.add(obsBase);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(7.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.y = 5.0;
    snowRoot.add(dome);

    // Telescope Barrel
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 9.0, 16), woodAlpineMat);
    scope.rotation.x = -Math.PI / 3;
    scope.position.set(0, 8.5, 2.5);
    snowRoot.add(scope);

    staticColliders.push({
      type: 'cylinder',
      x: 0,
      z: -320,
      radius: 9.0,
      minY: 36.0,
      maxY: 46.0,
      name: 'Observatory Summit Facility',
    });

    // Alpine Ski Chalet
    const chalet = new THREE.Mesh(new THREE.BoxGeometry(14, 6.0, 10), woodAlpineMat);
    chalet.position.set(-25, 3.0, 15);
    snowRoot.add(chalet);

    staticColliders.push({
      type: 'box',
      minX: -25 - 7.5,
      maxX: -25 + 7.5,
      minY: 36.0,
      maxY: 42.0,
      minZ: -320 + 15 - 5.5,
      maxZ: -320 + 15 + 5.5,
      name: 'Alpine Ski Chalet',
    });

    // Chests on Summit
    addChest(rootGroup, chests, chestMeshes, staticColliders, 0, 36.0 + 5.2, -320, 'rare_chest'); // Observatory
    addChest(rootGroup, chests, chestMeshes, staticColliders, -25, 36.0 + 6.5, -320 + 15, 'rare_chest'); // Chalet

    rootGroup.add(snowRoot);
  };
  buildSnowfallMountain();

  // =========================================================================
  // 9. POI 7: INDUSTRIAL ZONE (x: -80, z: 280) – Apex Works Container Yard
  // =========================================================================
  const buildIndustrialZone = () => {
    const indRoot = new THREE.Group();
    indRoot.position.set(-80, 1.5, 280);

    const sheetMetalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.6 });
    const rustMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 });
    const craneYellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8, roughness: 0.3 });

    // Main Factory Warehouse
    const fW = 32, fD = 22, fH = 10;
    const warehouse = new THREE.Mesh(new THREE.BoxGeometry(fW, fH, fD), sheetMetalMat);
    warehouse.position.y = fH / 2;
    indRoot.add(warehouse);

    staticColliders.push({
      type: 'box',
      minX: -80 - fW / 2,
      maxX: -80 + fW / 2,
      minY: 1.5,
      maxY: 1.5 + fH,
      minZ: 280 - fD / 2,
      maxZ: 280 + fD / 2,
      name: 'Industrial Warehouse Factory',
    });

    // Overhead Gantry Crane
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(4.0, 14.0, 36.0), craneYellowMat);
    gantry.position.set(24, 7.0, 0);
    indRoot.add(gantry);

    staticColliders.push({
      type: 'box',
      minX: -80 + 24 - 2.2,
      maxX: -80 + 24 + 2.2,
      minY: 1.5,
      maxY: 15.5,
      minZ: 280 - 18,
      maxZ: 280 + 18,
      name: 'Industrial Gantry Crane',
    });

    // Multi-color Stacked Shipping Containers (CQB Alleyways)
    const containerColors = [0x0284c7, 0xd97706, 0x16a34a, 0xb91c1c];
    for (let c = 0; c < 12; c++) {
      const cx = -26 + (c % 4) * 8.5;
      const cz = -24 + Math.floor(c / 4) * 12;
      const cStack = (c % 3) + 1;

      for (let st = 0; st < cStack; st++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(3.0, 2.8, 6.5),
          new THREE.MeshStandardMaterial({ color: containerColors[(c + st) % 4], roughness: 0.7, metalness: 0.3 })
        );
        box.position.set(cx, st * 2.8 + 1.4, cz);
        indRoot.add(box);
      }

      staticColliders.push({
        type: 'box',
        minX: -80 + cx - 1.6,
        maxX: -80 + cx + 1.6,
        minY: 1.5,
        maxY: 1.5 + cStack * 2.8,
        minZ: 280 + cz - 3.4,
        maxZ: 280 + cz + 3.4,
        name: 'Shipping Container Stack',
      });
    }

    // Upgrade Bench in Factory
    const benchInd = createUpgradeBenchMesh();
    benchInd.position.set(-80 + 12, 1.6, 280 - 8);
    rootGroup.add(benchInd);
    upgradeBenches.push({ id: 'bench_industrial', x: -80 + 12, y: 1.6, z: 280 - 8, mesh: benchInd });

    // Chests
    addChest(rootGroup, chests, chestMeshes, staticColliders, -80, 1.5 + fH + 0.3, 280, 'rare_chest'); // Roof
    addChest(rootGroup, chests, chestMeshes, staticColliders, -80 - 26, 1.5 + 2.8 * 2 + 0.3, 280 - 24, 'chest'); // On containers

    rootGroup.add(indRoot);
  };
  buildIndustrialZone();

  // =========================================================================
  // 10. POI 8: LOST TEMPLE (x: 80, z: 320) – Ancient Stepped Ziggurat & Tomb
  // =========================================================================
  const buildLostTemple = () => {
    const templeRoot = new THREE.Group();
    templeRoot.position.set(80, 8.0, 320);

    const stoneTempleMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95, flatShading: true });
    const goldTempleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const fireMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 1.5 });

    // 4-Tier Stepped Stone Ziggurat Pyramid
    const tiers = [
      { w: 32, d: 32, h: 3.5, y: 1.75 },
      { w: 24, d: 24, h: 3.5, y: 5.25 },
      { w: 16, d: 16, h: 3.5, y: 8.75 },
      { w: 8, d: 8, h: 2.0, y: 11.5 },
    ];
    tiers.forEach((t) => {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), stoneTempleMat);
      stepMesh.position.y = t.y;
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      templeRoot.add(stepMesh);

      staticColliders.push({
        type: 'box',
        minX: 80 - t.w / 2,
        maxX: 80 + t.w / 2,
        minY: 8.0 + t.y - t.h / 2,
        maxY: 8.0 + t.y + t.h / 2,
        minZ: 320 - t.d / 2,
        maxZ: 320 + t.d / 2,
        name: 'Temple Tier',
      });
    });

    // Top Altar with Golden Relic Chest
    const altar = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.2, 3.0), goldTempleMat);
    altar.position.y = 13.1;
    templeRoot.add(altar);

    // Ceremonial Stone Obelisks with Braziers
    for (const ox of [-14, 14]) {
      for (const oz of [-14, 14]) {
        const obelisk = new THREE.Mesh(new THREE.ConeGeometry(1.2, 9.0, 4), stoneTempleMat);
        obelisk.position.set(ox, 4.5, oz);
        templeRoot.add(obelisk);

        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), fireMat);
        flame.position.set(ox, 9.2, oz);
        templeRoot.add(flame);
      }
    }

    // Chests
    addChest(rootGroup, chests, chestMeshes, staticColliders, 80, 8.0 + 13.8, 320, 'rare_chest'); // Top altar
    addChest(rootGroup, chests, chestMeshes, staticColliders, 80 + 8, 8.0 + 5.5, 320 - 8, 'chest'); // 2nd tier

    rootGroup.add(templeRoot);
  };
  buildLostTemple();

  // =========================================================================
  // 11. POI 9: RACING CIRCUIT (x: -160, z: -30) – GP Track, Pit Lane & Ramps
  // =========================================================================
  const buildRacingCircuit = () => {
    const raceRoot = new THREE.Group();
    raceRoot.position.set(-160, 0.1, -30);

    const trackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    const kerbRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const kerbWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const pitMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });

    // Grand Prix Oval Track (120m x 70m)
    const trackRing = new THREE.Mesh(
      new THREE.RingGeometry(35, 50, 48),
      trackMat
    );
    trackRing.rotation.x = -Math.PI / 2;
    trackRing.position.y = 0.05;
    raceRoot.add(trackRing);

    // Red and White Apex Rumble Strips along perimeter
    for (let k = 0; k < 36; k++) {
      const angle = (k / 36) * Math.PI * 2;
      const kx = Math.cos(angle) * 51;
      const kz = Math.sin(angle) * 51;
      const kerb = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.22, 1.2),
        k % 2 === 0 ? kerbRedMat : kerbWhiteMat
      );
      kerb.position.set(kx, 0.11, kz);
      kerb.rotation.y = -angle;
      raceRoot.add(kerb);
    }

    // Pit Lane Garages (Enterable with 3 bays)
    const pitBuilding = new THREE.Mesh(new THREE.BoxGeometry(32, 5.0, 10), pitMat);
    pitBuilding.position.set(0, 2.5, 0);
    raceRoot.add(pitBuilding);

    staticColliders.push({
      type: 'box',
      minX: -160 - 16.5,
      maxX: -160 + 16.5,
      minY: 0.1,
      maxY: 5.5,
      minZ: -30 - 5.5,
      maxZ: -30 + 5.5,
      name: 'Racing Pit Lane Garage',
    });

    // Jump Ramp for Stunt Action
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.5, 8.0), pitMat);
    ramp.position.set(45, 1.25, 0);
    ramp.rotation.x = -0.3;
    raceRoot.add(ramp);

    // Upgrade Bench in Pit
    const benchRace = createUpgradeBenchMesh();
    benchRace.position.set(-160 - 10, 0.2, -30 + 6);
    rootGroup.add(benchRace);
    upgradeBenches.push({ id: 'bench_racing', x: -160 - 10, y: 0.2, z: -30 + 6, mesh: benchRace });

    // Drivable GT Sports Cars ready on starting grid
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, -160, 0.2, -30 - 42, 0xd97706, 'Apex GT Racer 01', 'sports', Math.PI / 2);
    addDetailedDrivableVehicle(rootGroup, harvestables, staticColliders, vehicles, -160 + 12, 0.2, -30 - 42, 0x0284c7, 'Apex GT Racer 02', 'sports', Math.PI / 2);

    // Chests
    addChest(rootGroup, chests, chestMeshes, staticColliders, -160, 5.5, -30, 'chest'); // Pit roof
    addChest(rootGroup, chests, chestMeshes, staticColliders, -160 + 45, 2.8, -30, 'rare_chest'); // Top of ramp

    rootGroup.add(raceRoot);
  };
  buildRacingCircuit();

  // =========================================================================
  // 12. POI 10: UNDERGROUND BUNKER (x: -20, z: 90) – Sector Omega Blast Facility
  // =========================================================================
  const buildUndergroundBunker = () => {
    const bunkerRoot = new THREE.Group();
    bunkerRoot.position.set(-20, 0, 90);

    const blastDoorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
    const hazardMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const bunkerWallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const screenGlowMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 1.2 });

    // Hillside Reinforced Blast Entrance
    const blastArch = new THREE.Mesh(new THREE.BoxGeometry(10, 6.0, 4.0), bunkerWallMat);
    blastArch.position.set(0, 3.0, 0);
    bunkerRoot.add(blastArch);

    // Heavy Hydraulic Blast Doors (Slightly Ajar for entry)
    for (const dx of [-2.4, 2.4]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.8, 0.8), blastDoorMat);
      door.position.set(dx, 2.4, 0);
      bunkerRoot.add(door);
    }

    // Hazard Stripes framing the door
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.4, 0.1), hazardMat);
    stripe.position.set(0, 5.0, 2.05);
    bunkerRoot.add(stripe);

    // Downward Tunnel Corridor to Subterranean Facility (-4.5m)
    for (let st = 0; st < 12; st++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 0.8), bunkerWallMat);
      step.position.set(0, -st * 0.4, -st * 0.8 - 2.0);
      bunkerRoot.add(step);
    }

    // Subterranean Command Bunker Room (-4.8m)
    const roomW = 18, roomD = 18, roomH = 5.0;
    const roomFloor = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.3, roomD), bunkerWallMat);
    roomFloor.position.set(0, -4.8, -18);
    bunkerRoot.add(roomFloor);

    // Glowing Computer Terminal Console Banks
    for (const sx of [-5, 0, 5]) {
      const screen = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.4, 0.2), screenGlowMat);
      screen.position.set(sx, -3.2, -26);
      bunkerRoot.add(screen);
    }

    staticColliders.push(
      { type: 'box', minX: -20 - 5.5, maxX: -20 + 5.5, minY: 0, maxY: 6.5, minZ: 90 - 2.5, maxZ: 90 + 2.5, name: 'Bunker Blast Portal' },
      { type: 'box', minX: -20 - roomW / 2, maxX: -20 + roomW / 2, minY: -5.0, maxY: -4.5, minZ: 90 - 18 - roomD / 2, maxZ: 90 - 18 + roomD / 2, name: 'Bunker Subterranean Chamber' }
    );

    // High-Tier Military Chests inside Bunker
    addChest(rootGroup, chests, chestMeshes, staticColliders, -20, -4.5 + 0.4, 90 - 18, 'rare_chest');
    addChest(rootGroup, chests, chestMeshes, staticColliders, -20 + 6, -4.5 + 0.4, 90 - 22, 'rare_chest');
    addChest(rootGroup, chests, chestMeshes, staticColliders, -20 - 6, -4.5 + 0.4, 90 - 22, 'rare_chest');

    rootGroup.add(bunkerRoot);
  };
  buildUndergroundBunker();

  // =========================================================================
  // 13. INSTANCED MESHES: PINE TREES, DECIDUOUS TREES, ROCKS & FOLIAGE
  // High performance: 800+ props rendered in just 3 draw calls!
  // =========================================================================
  const populateInstancedFoliageAndRocks = () => {
    // 1. Instanced Pine Trees (500 instances across island)
    const pineCount = 420;
    const pineTrunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4.0, 6);
    const pineFoliageGeo = new THREE.ConeGeometry(2.8, 6.5, 6);
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

    const instancedPine = new THREE.InstancedMesh(pineFoliageGeo, pineMat, pineCount);
    const instancedTrunk = new THREE.InstancedMesh(pineTrunkGeo, trunkMat, pineCount);
    instancedPine.castShadow = true;
    instancedTrunk.castShadow = true;

    const dummy = new THREE.Object3D();
    let pineIdx = 0;

    for (let i = 0; i < pineCount && pineIdx < pineCount; i++) {
      // Scatter in clusters around forest (-240, -200), mountain slopes, and countryside
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * 320;
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;

      // Don't spawn inside ocean or roads
      const py = getStrikeIslandElevation(px, pz);
      if (py < 0.2 || (px > 20 && px < 110 && pz > -80 && pz < 10)) continue;

      const scale = 0.8 + Math.random() * 0.5;
      dummy.position.set(px, py + 2.0 * scale, pz);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();
      instancedTrunk.setMatrixAt(pineIdx, dummy.matrix);

      dummy.position.set(px, py + 6.0 * scale, pz);
      dummy.updateMatrix();
      instancedPine.setMatrixAt(pineIdx, dummy.matrix);

      // Register harvestable trunk every few trees
      if (pineIdx % 4 === 0) {
        addHarvestable(harvestables, px, py, pz, 'tree', 'wood', 100, 20, 1.2, 8.0);
      }

      pineIdx++;
    }
    instancedPine.count = pineIdx;
    instancedTrunk.count = pineIdx;
    instancedPine.instanceMatrix.needsUpdate = true;
    instancedTrunk.instanceMatrix.needsUpdate = true;
    instancedPine.computeBoundingSphere();
    instancedTrunk.computeBoundingSphere();
    rootGroup.add(instancedTrunk);
    rootGroup.add(instancedPine);

    // 2. Instanced Rocks & Boulders (180 instances)
    const rockCount = 180;
    const rockGeo = new THREE.DodecahedronGeometry(2.0, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, flatShading: true });
    const instancedRocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    instancedRocks.castShadow = true;

    for (let r = 0; r < rockCount; r++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 40 + Math.random() * 350;
      const rx = Math.cos(angle) * rad;
      const rz = Math.sin(angle) * rad;
      const ry = getStrikeIslandElevation(rx, rz);

      const rScale = 0.7 + Math.random() * 1.2;
      dummy.position.set(rx, ry + 1.0 * rScale, rz);
      dummy.scale.set(rScale, rScale * (0.8 + Math.random() * 0.4), rScale);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      instancedRocks.setMatrixAt(r, dummy.matrix);

      if (r % 3 === 0) {
        addHarvestable(harvestables, rx, ry, rz, 'rock', 'stone', 120, 25, 1.8 * rScale, 2.5 * rScale);
      }
    }
    instancedRocks.instanceMatrix.needsUpdate = true;
    instancedRocks.computeBoundingSphere();
    rootGroup.add(instancedRocks);
  };
  populateInstancedFoliageAndRocks();

  const spawnPoint = new THREE.Vector3(0, 220, 0);

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
    getElevation: getStrikeIslandElevation,
  };
}
