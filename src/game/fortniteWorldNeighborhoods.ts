// Pleasant Park suburb: lush grass, the park itself, and detailed suburban homes.
import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider, DrivableVehicle } from '../types';
import { addChest, addHarvestable } from './fortniteWorldNature';
import { getTerrainHeight, isPointOnRoad } from './fortniteWorldTerrain';
import { addDetailedDrivableVehicle } from './fortniteWorldVehiclesProps';



// -------------------------------------------------------------
// SUBTLE NATURAL GRASS TUFTS (REDUCED DENSITY, ZERO ROADS, ZERO LAG)
// -------------------------------------------------------------
export function populateLushGrass(scene: THREE.Scene) {
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
export function buildPleasantPark(
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
export function addDetailedSuburbanHome(
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
