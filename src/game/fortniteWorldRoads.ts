// City road network geometry: streets, highway gantries, lamps, crosswalks.
import * as THREE from 'three';
import { HarvestableObject, SolidCollider, DrivableVehicle } from '../types';
import { addDetailedDrivableVehicle } from './fortniteWorldVehiclesProps';



// -------------------------------------------------------------
// DENSE ROAD & HIGHWAY NETWORK (EXPANDED ACROSS FULL ISLAND)
// -------------------------------------------------------------
export function createCityRoadNetwork(
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

  // 7. Double Yellow Centerlines & White Dashed Lane Dividers (Batched with InstancedMesh)
  const unitStripeGeo = new THREE.PlaneGeometry(1.0, 1.0);
  unitStripeGeo.rotateX(-Math.PI / 2);
  const stripeDummy = new THREE.Object3D();
  const yellowMatrices: THREE.Matrix4[] = [];
  const whiteMatrices: THREE.Matrix4[] = [];

  const addStripe = (x: number, y: number, z: number, w: number, l: number, list: THREE.Matrix4[]) => {
    stripeDummy.position.set(x, y, z);
    stripeDummy.scale.set(w, 1.0, l);
    stripeDummy.updateMatrix();
    list.push(stripeDummy.matrix.clone());
  };

  for (let z = -270; z <= 270; z += 9) {
    if (Math.abs(z) < 8 || Math.abs(z - 75) < 6 || Math.abs(z - -85) < 6) continue;

    // Central Interstate NS Double Yellow
    addStripe(-0.25, 0.11, z, 0.2, 5.0, yellowMatrices);
    addStripe(0.25, 0.11, z, 0.2, 5.0, yellowMatrices);

    // White dashed outer lane markings
    addStripe(-3.5, 0.11, z, 0.25, 4.0, whiteMatrices);
    addStripe(3.5, 0.11, z, 0.25, 4.0, whiteMatrices);

    // Hwy 101 Yellow Stripe
    addStripe(-95, 0.11, z, 0.2, 5.0, yellowMatrices);

    // Hwy 202 Yellow Stripe
    addStripe(95, 0.11, z, 0.2, 5.0, yellowMatrices);
  }

  for (let x = -270; x <= 270; x += 9) {
    if (Math.abs(x) < 8 || Math.abs(x - -95) < 6 || Math.abs(x - 95) < 6) continue;

    // Central Interstate EW Double Yellow
    addStripe(x, 0.11, -0.25, 5.0, 0.2, yellowMatrices);
    addStripe(x, 0.11, 0.25, 5.0, 0.2, yellowMatrices);

    // I-80 North Yellow Stripe
    addStripe(x, 0.11, 75, 5.0, 0.2, yellowMatrices);

    // I-40 South Yellow Stripe
    addStripe(x, 0.11, -85, 5.0, 0.2, yellowMatrices);
  }

  if (yellowMatrices.length > 0) {
    const yellowInstanced = new THREE.InstancedMesh(unitStripeGeo, yellowLineMat, yellowMatrices.length);
    for (let i = 0; i < yellowMatrices.length; i++) {
      yellowInstanced.setMatrixAt(i, yellowMatrices[i]);
    }
    yellowInstanced.instanceMatrix.needsUpdate = true;
    scene.add(yellowInstanced);
  }

  if (whiteMatrices.length > 0) {
    const whiteInstanced = new THREE.InstancedMesh(unitStripeGeo, whiteLineMat, whiteMatrices.length);
    for (let i = 0; i < whiteMatrices.length; i++) {
      whiteInstanced.setMatrixAt(i, whiteMatrices[i]);
    }
    whiteInstanced.instanceMatrix.needsUpdate = true;
    scene.add(whiteInstanced);
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
