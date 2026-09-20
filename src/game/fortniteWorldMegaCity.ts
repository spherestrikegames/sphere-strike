// Downtown "Mega-City" (Tilted Towers) block layout, window grids, street props.
import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider, DrivableVehicle } from '../types';
import { addChest } from './fortniteWorldNature';
import { buildWalkableSkyscraper } from './fortniteWorldSkyscraper';
import { addDetailedDrivableVehicle, addDumpster } from './fortniteWorldVehiclesProps';



// -------------------------------------------------------------
// MEGA-CITY: TILTED TOWERS WITH DETAILED SKYSCRAPERS & WINDOWS
// -------------------------------------------------------------
export function buildMegaCity(
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
export function addWindowGridToBuilding(
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
