// The walkable multi-floor downtown skyscraper generator.
import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider } from '../types';
import { addWindowGridToBuilding } from './fortniteWorldMegaCity';
import { addChest, addHarvestable } from './fortniteWorldNature';
import { SKYSCRAPER_LAUNCH_PADS } from './fortniteWorldTerrain';



// -------------------------------------------------------------
// WALKABLE SKYSCRAPER BUILDER WITH GRAND LOBBY, STAIRS TO ROOF & INTERIORS
// -------------------------------------------------------------
export function buildWalkableSkyscraper(
  scene: THREE.Scene,
  parent: THREE.Group,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  b: { x: number; z: number; w: number; h: number; d: number; col: number; winCol: number; floors: number; cols: number; name: string },
  index: number
) {
  const building = new THREE.Group();
  building.position.set(b.x, 0, b.z);

  const wallMat = new THREE.MeshStandardMaterial({ color: b.col, roughness: 0.7, metalness: 0.3 });
  const lobbyFloorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.5 });
  const officeFloorMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
  const penthouseFloorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
  const roofDeckMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.2 });
  const parapetMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const stairWoodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 });
  const couchMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 });
  const deskWoodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
  const glassAwningMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7, roughness: 0.1 });
  const padRingMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.8, roughness: 0.2 });
  const padCoreMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 1.0, roughness: 0.3 });

  const halfW = b.w / 2;
  const halfD = b.d / 2;
  const doorW = 4.0;
  const doorH = 3.6;
  const frontWingW = (b.w - doorW) / 2;

  // Floor Planning: Dynamic floors based on actual building height b.h
  const floorHeight = 4.5;
  const floorCount = Math.max(3, Math.floor(b.h / floorHeight));

  // 1. Ground Level Lobby Floor Slab
  const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.2, 0.2, b.d - 0.2), lobbyFloorMat);
  groundFloor.position.y = 0.1;
  groundFloor.receiveShadow = true;
  building.add(groundFloor);

  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x + halfW,
    minY: -0.2,
    maxY: 0.2,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Ground Floor`,
  });

  // 2. Intermediate Floor Slabs with Stairwell Cutouts
  for (let f = 1; f < floorCount; f++) {
    const floorY = f * floorHeight;
    const isOdd = f % 2 === 1;
    const slabMat = f % 3 === 0 ? penthouseFloorMat : officeFloorMat;

    // Floor slab leaving space for stairs on alternating side
    const slab = new THREE.Mesh(new THREE.BoxGeometry(b.w - 3.2, 0.35, b.d - 0.4), slabMat);
    slab.position.set(isOdd ? -1.4 : 1.4, floorY, 0);
    slab.receiveShadow = true;
    building.add(slab);

    colliders.push({
      type: 'box',
      minX: isOdd ? b.x - halfW + 0.2 : b.x - halfW + 3.0,
      maxX: isOdd ? b.x + halfW - 3.0 : b.x + halfW - 0.2,
      minY: floorY - 0.25,
      maxY: floorY + 0.15,
      minZ: b.z - halfD + 0.2,
      maxZ: b.z + halfD - 0.2,
      name: `${b.name} Floor ${f + 1} Slab`,
    });
  }

  // 3. Full Continuous Staircases from Ground all the way up to Rooftop (y = b.h)
  const numSteps = 10;
  const stepW = 2.4;
  const landingMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

  for (let f = 0; f < floorCount; f++) {
    const baseY = f * floorHeight;
    const topY = f === floorCount - 1 ? b.h : (f + 1) * floorHeight;
    const deltaY = topY - baseY;
    const isRightSide = f % 2 === 0;

    const stairStartX = isRightSide ? halfW - 1.6 : -halfW + 1.6;
    const stairStartZ = isRightSide ? halfD - 2.6 : -halfD + 2.6;
    const dir = isRightSide ? -1 : 1;
    const stepRise = deltaY / numSteps;
    const stepRun = (b.d * 0.46) / numSteps;

    // Build Individual Steps
    for (let s = 0; s < numSteps; s++) {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stepW, stepRise, stepRun * 1.05), stairWoodMat);
      const stepY = baseY + (s + 0.5) * stepRise;
      const stepZ = stairStartZ + dir * s * stepRun;
      stepMesh.position.set(stairStartX, stepY, stepZ);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      building.add(stepMesh);

      colliders.push({
        type: 'box',
        minX: b.x + stairStartX - stepW / 2,
        maxX: b.x + stairStartX + stepW / 2,
        minY: baseY + s * stepRise - 0.1,
        maxY: baseY + (s + 1) * stepRise + 0.1,
        minZ: b.z + stepZ - stepRun / 2,
        maxZ: b.z + stepZ + stepRun / 2,
        name: `${b.name} Flight ${f + 1} Step ${s + 1}`,
      });
    }

    // Landing Platform at top of each flight
    const landingZ = stairStartZ + dir * numSteps * stepRun + dir * 1.1;
    const landingMesh = new THREE.Mesh(new THREE.BoxGeometry(stepW + 0.4, 0.35, 2.4), landingMat);
    landingMesh.position.set(stairStartX, topY - 0.18, landingZ);
    landingMesh.castShadow = true;
    landingMesh.receiveShadow = true;
    building.add(landingMesh);

    colliders.push({
      type: 'box',
      minX: b.x + stairStartX - (stepW + 0.4) / 2,
      maxX: b.x + stairStartX + (stepW + 0.4) / 2,
      minY: topY - 0.35,
      maxY: topY + 0.1,
      minZ: b.z + landingZ - 1.2,
      maxZ: b.z + landingZ + 1.2,
      name: `${b.name} Flight ${f + 1} Landing`,
    });
  }

  // 4. ROOFTOP DECK AT Y = b.h (Open, 100% solid, full floor access)
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.4, b.d), roofDeckMat);
  roofSlab.position.set(0, b.h - 0.2, 0);
  roofSlab.receiveShadow = true;
  building.add(roofSlab);

  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x + halfW,
    minY: b.h - 0.45,
    maxY: b.h + 0.05,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Rooftop Floor Slab`,
  });

  // 5. Rooftop Stairwell Penthouse Enclosure (Enclosing top stairs with an open doorway to the roof deck)
  const isLastFlightRight = (floorCount - 1) % 2 === 0;
  const cabinX = isLastFlightRight ? halfW - 2.0 : -halfW + 2.0;
  const cabinZ = isLastFlightRight ? -halfD + 3.2 : halfD - 3.2;
  const cabinW = 3.6;
  const cabinD = 4.2;
  const cabinH = 3.2;

  const penthouseCabin = new THREE.Group();
  penthouseCabin.position.set(cabinX, b.h, cabinZ);

  // Penthouse Roof Cap
  const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(cabinW, 0.3, cabinD), wallMat);
  cabinRoof.position.y = cabinH;
  penthouseCabin.add(cabinRoof);

  // Penthouse Side Walls
  const cabinSideL = new THREE.Mesh(new THREE.BoxGeometry(0.3, cabinH, cabinD), wallMat);
  cabinSideL.position.set(-cabinW / 2 + 0.15, cabinH / 2, 0);
  penthouseCabin.add(cabinSideL);

  const cabinSideR = new THREE.Mesh(new THREE.BoxGeometry(0.3, cabinH, cabinD), wallMat);
  cabinSideR.position.set(cabinW / 2 - 0.15, cabinH / 2, 0);
  penthouseCabin.add(cabinSideR);

  // Penthouse Back Wall
  const cabinBack = new THREE.Mesh(new THREE.BoxGeometry(cabinW, cabinH, 0.3), wallMat);
  cabinBack.position.set(0, cabinH / 2, isLastFlightRight ? -cabinD / 2 + 0.15 : cabinD / 2 - 0.15);
  penthouseCabin.add(cabinBack);

  // Penthouse Front Doorway Header (leaves a tall open doorway to step out onto the roof)
  const cabinDoorHeader = new THREE.Mesh(new THREE.BoxGeometry(cabinW, 0.7, 0.3), wallMat);
  cabinDoorHeader.position.set(0, cabinH - 0.35, isLastFlightRight ? cabinD / 2 - 0.15 : -cabinD / 2 + 0.15);
  penthouseCabin.add(cabinDoorHeader);

  building.add(penthouseCabin);

  // Solid colliders for penthouse cabin walls & roof
  colliders.push({
    type: 'box',
    minX: b.x + cabinX - cabinW / 2,
    maxX: b.x + cabinX + cabinW / 2,
    minY: b.h + cabinH - 0.3,
    maxY: b.h + cabinH + 0.2,
    minZ: b.z + cabinZ - cabinD / 2,
    maxZ: b.z + cabinZ + cabinD / 2,
    name: `${b.name} Penthouse Cabin Roof`,
  });

  // 6. SOLID PARAPET WALLS & SAFETY COVER AROUND ROOFTOP PERIMETER (1.15m height)
  const parapetH = 1.15;
  const parapetThick = 0.45;

  // Left Parapet (-X)
  const paraL = new THREE.Mesh(new THREE.BoxGeometry(parapetThick, parapetH, b.d), parapetMat);
  paraL.position.set(-halfW + parapetThick / 2, b.h + parapetH / 2, 0);
  building.add(paraL);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x - halfW + parapetThick,
    minY: b.h,
    maxY: b.h + parapetH + 0.1,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Roof Left Parapet`,
  });

  // Right Parapet (+X)
  const paraR = new THREE.Mesh(new THREE.BoxGeometry(parapetThick, parapetH, b.d), parapetMat);
  paraR.position.set(halfW - parapetThick / 2, b.h + parapetH / 2, 0);
  building.add(paraR);
  colliders.push({
    type: 'box',
    minX: b.x + halfW - parapetThick,
    maxX: b.x + halfW,
    minY: b.h,
    maxY: b.h + parapetH + 0.1,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Roof Right Parapet`,
  });

  // Back Parapet (-Z)
  const paraB = new THREE.Mesh(new THREE.BoxGeometry(b.w, parapetH, parapetThick), parapetMat);
  paraB.position.set(0, b.h + parapetH / 2, -halfD + parapetThick / 2);
  building.add(paraB);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x + halfW,
    minY: b.h,
    maxY: b.h + parapetH + 0.1,
    minZ: b.z - halfD,
    maxZ: b.z - halfD + parapetThick,
    name: `${b.name} Roof Back Parapet`,
  });

  // Front Parapet (+Z)
  const paraF = new THREE.Mesh(new THREE.BoxGeometry(b.w, parapetH, parapetThick), parapetMat);
  paraF.position.set(0, b.h + parapetH / 2, halfD - parapetThick / 2);
  building.add(paraF);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x + halfW,
    minY: b.h,
    maxY: b.h + parapetH + 0.1,
    minZ: b.z + halfD - parapetThick,
    maxZ: b.z + halfD,
    name: `${b.name} Roof Front Parapet`,
  });

  // 7. ROOFTOP TACTICAL BOUNCE PAD (Super launch from the skyscraper peak!)
  const roofBouncePad = new THREE.Group();
  roofBouncePad.position.set(0, b.h + 0.05, 0);

  const bounceRing = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.14, 16), padRingMat);
  bounceRing.position.y = 0.07;
  roofBouncePad.add(bounceRing);

  const bounceCore = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.18, 16), padCoreMat);
  bounceCore.position.y = 0.09;
  roofBouncePad.add(bounceCore);

  building.add(roofBouncePad);

  // Register rooftop bounce pad for high air glider deployment
  SKYSCRAPER_LAUNCH_PADS.push({
    x: b.x,
    z: b.z,
    y: b.h,
    targetY: b.h + 28.0,
    name: `${b.name} Roof Launch Pad`,
  });

  // 8. GROUND-LEVEL SKY-ASCENDER / LAUNCH PAD (Outside main entrance for fast launch to rooftop)
  const groundLaunchPad = new THREE.Group();
  const groundPadX = b.x;
  const groundPadZ = b.z + halfD + 3.2;
  groundLaunchPad.position.set(groundPadX, 0.08, groundPadZ);

  const gPadRing = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.16, 16), padRingMat);
  gPadRing.position.y = 0.08;
  groundLaunchPad.add(gPadRing);

  const gPadCore = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16), padCoreMat);
  gPadCore.position.y = 0.1;
  groundLaunchPad.add(gPadCore);

  // Holographic Upward Arrow Billboard
  const arrowGeo = new THREE.ConeGeometry(0.35, 0.6, 4);
  arrowGeo.rotateX(Math.PI);
  const arrowMesh = new THREE.Mesh(arrowGeo, padCoreMat);
  arrowMesh.position.set(0, 0.7, 0);
  groundLaunchPad.add(arrowMesh);

  parent.add(groundLaunchPad);

  // Register ground pad targeting this skyscraper's roof
  SKYSCRAPER_LAUNCH_PADS.push({
    x: groundPadX,
    z: groundPadZ,
    y: 0,
    targetY: b.h + 5.0,
    name: `${b.name} Ground Ascender`,
  });

  // 9. SOLID EXTERIOR WALLS EXTENDING FULL HEIGHT TO ROOF b.h
  // Left Exterior Wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, b.h, b.d), wallMat);
  leftWall.position.set(-halfW + 0.25, b.h / 2, 0);
  building.add(leftWall);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x - halfW + 0.6,
    minY: 0,
    maxY: b.h,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Left Wall`,
  });

  // Right Exterior Wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, b.h, b.d), wallMat);
  rightWall.position.set(halfW - 0.25, b.h / 2, 0);
  building.add(rightWall);
  colliders.push({
    type: 'box',
    minX: b.x + halfW - 0.6,
    maxX: b.x + halfW,
    minY: 0,
    maxY: b.h,
    minZ: b.z - halfD,
    maxZ: b.z + halfD,
    name: `${b.name} Right Wall`,
  });

  // Back Exterior Wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, 0.5), wallMat);
  backWall.position.set(0, b.h / 2, -halfD + 0.25);
  building.add(backWall);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x + halfW,
    minY: 0,
    maxY: b.h,
    minZ: b.z - halfD,
    maxZ: b.z - halfD + 0.6,
    name: `${b.name} Back Wall`,
  });

  // Front Left Wing
  const frontL = new THREE.Mesh(new THREE.BoxGeometry(frontWingW, b.h, 0.5), wallMat);
  frontL.position.set(-halfW + frontWingW / 2, b.h / 2, halfD - 0.25);
  building.add(frontL);
  colliders.push({
    type: 'box',
    minX: b.x - halfW,
    maxX: b.x - halfW + frontWingW,
    minY: 0,
    maxY: b.h,
    minZ: b.z + halfD - 0.6,
    maxZ: b.z + halfD,
    name: `${b.name} Front Left Wall`,
  });

  // Front Right Wing
  const frontR = new THREE.Mesh(new THREE.BoxGeometry(frontWingW, b.h, 0.5), wallMat);
  frontR.position.set(halfW - frontWingW / 2, b.h / 2, halfD - 0.25);
  building.add(frontR);
  colliders.push({
    type: 'box',
    minX: b.x + halfW - frontWingW,
    maxX: b.x + halfW,
    minY: 0,
    maxY: b.h,
    minZ: b.z + halfD - 0.6,
    maxZ: b.z + halfD,
    name: `${b.name} Front Right Wall`,
  });

  // Front Entrance Header (above door opening y=doorH to y=b.h)
  const frontHeader = new THREE.Mesh(new THREE.BoxGeometry(doorW, b.h - doorH, 0.5), wallMat);
  frontHeader.position.set(0, doorH + (b.h - doorH) / 2, halfD - 0.25);
  building.add(frontHeader);

  // Front Entrance Glass Canopy & Support Columns
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(doorW + 1.2, 0.2, 2.5), glassAwningMat);
  canopy.position.set(0, doorH + 0.2, halfD + 1.1);
  building.add(canopy);

  for (const cx of [-doorW / 2 - 0.4, doorW / 2 + 0.4]) {
    const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, doorH + 0.2, 8), metalMat);
    colMesh.position.set(cx, (doorH + 0.2) / 2, halfD + 2.0);
    building.add(colMesh);
  }

  // Multi-Story Windows across facades up to b.h
  addWindowGridToBuilding(building, b.w, b.h, b.d, b.winCol, b.cols, b.floors);

  // 10. Lobby & Intermediate Floor Furnishings
  // Reception Desk & Terminal
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 1.2), goldTrimMat);
  desk.position.set(0, 0.55, 0);
  building.add(desk);

  const pcScreen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.08), metalMat);
  pcScreen.position.set(0, 1.4, 0);
  building.add(pcScreen);

  // Lounge Couches & Coffee Table
  const couchL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.1), couchMat);
  couchL.position.set(-halfW + 2.2, 0.45, 2.0);
  building.add(couchL);

  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.8), deskWoodMat);
  coffeeTable.position.set(-halfW + 2.2, 0.2, 0.4);
  building.add(coffeeTable);

  // Elevator Doors on Back Wall
  for (const ex of [-1.8, 1.8]) {
    const elevDoor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.2, 0.1), metalMat);
    elevDoor.position.set(ex, 1.6, -halfD + 0.6);
    building.add(elevDoor);
  }

  // Intermediate Floor Chests and Furnishings
  // Floor 2 Office
  const officeDesk1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.85, 1.2), deskWoodMat);
  officeDesk1.position.set(-halfW + 3.0, 4.5 + 0.42, 2.0);
  building.add(officeDesk1);
  addChest(scene, chests, chestMeshes, colliders, b.x - halfW + 3.0, 4.5 + 0.9, b.z + 2.0, 'chest');

  // Floor 3 Lounge
  const boardTable = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.9, 1.8), goldTrimMat);
  boardTable.position.set(1.4, 9.0 + 0.45, 0);
  building.add(boardTable);
  addChest(scene, chests, chestMeshes, colliders, b.x + 1.4, 9.0 + 1.0, b.z, 'chest');

  // Floor 4 Armory
  const serverRack1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.4, 1.2), metalMat);
  serverRack1.position.set(0, 13.5 + 1.7, -halfD + 1.4);
  building.add(serverRack1);
  addChest(scene, chests, chestMeshes, colliders, b.x - halfW + 2.5, 13.5 + 1.0, b.z, 'rare_chest');

  // Rooftop Architectural Props: AC Units / Water Tank / Radio Spire
  const acVent = new THREE.Mesh(new THREE.BoxGeometry(3, 1.8, 3), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 }));
  acVent.position.set(2.5, b.h + 0.9, 2.5);
  building.add(acVent);
  colliders.push({
    type: 'box',
    minX: b.x + 1.0,
    maxX: b.x + 4.0,
    minY: b.h,
    maxY: b.h + 1.8,
    minZ: b.z + 1.0,
    maxZ: b.z + 4.0,
    name: `${b.name} AC Unit`,
  });

  if (index % 2 === 0) {
    const waterTank = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.4, 12), new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.8 }));
    waterTank.position.set(-2.5, b.h + 1.2, -2.5);
    building.add(waterTank);
    colliders.push({
      type: 'cylinder',
      x: b.x - 2.5,
      z: b.z - 2.5,
      radius: 1.8,
      minY: b.h,
      maxY: b.h + 2.4,
      name: `${b.name} Water Tank`,
    });
  } else {
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 6, 8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    spire.position.set(0, b.h + 3, 0);
    building.add(spire);
  }

  // Rooftop Rare Loot Chest
  addChest(
    scene,
    chests,
    chestMeshes,
    colliders,
    b.x - 2.2,
    b.h + 0.5,
    b.z - 2.2,
    'rare_chest'
  );

  // Harvestables inside skyscraper
  addHarvestable(harvestables, b.x - halfW + 3.0, 4.5, b.z - 2.0, 'wall', 'wood', 120, 20, 1.4, 0.9);
  addHarvestable(harvestables, b.x, 4.5, b.z - halfD + 1.2, 'container', 'metal', 160, 35, 1.2, 3.0);

  parent.add(building);
}
