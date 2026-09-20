// Drivable vehicle meshes plus small static props (parked cars, dumpsters).
import * as THREE from 'three';
import { HarvestableObject, SolidCollider, DrivableVehicle } from '../types';
import { addHarvestable } from './fortniteWorldNature';



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
export function addDumpster(
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
