// Decorative lake/pond clusters and Loot Lake.
import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider, DrivableVehicle } from '../types';
import { addChest } from './fortniteWorldNature';
import { addDetailedDrivableVehicle } from './fortniteWorldVehiclesProps';



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
