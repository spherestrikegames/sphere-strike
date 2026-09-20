// Smaller named POIs: Dusty Depot, Salty Springs, Retail Row, Snobby Shores.
import * as THREE from 'three';
import { HarvestableObject, LootChest, SolidCollider, DrivableVehicle } from '../types';
import { addChest, addHarvestable } from './fortniteWorldNature';
import { addDetailedSuburbanHome } from './fortniteWorldNeighborhoods';
import { addDetailedDrivableVehicle } from './fortniteWorldVehiclesProps';



// -------------------------------------------------------------
// POI 3: DUSTY DEPOT (3 Industrial Warehouses & Container Yard)
// -------------------------------------------------------------
export function buildDustyDepot(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const root = new THREE.Group();
  root.position.set(130, 0, -40);

  const depots = [
    { x: -18, z: 0, col: 0xdc2626, name: 'Red Depot Warehouse' },
    { x: 0, z: 0, col: 0x2563eb, name: 'Blue Depot Warehouse' },
    { x: 18, z: 0, col: 0x64748b, name: 'Gray Depot Warehouse' },
  ];

  depots.forEach((d) => {
    const warehouse = new THREE.Group();
    warehouse.position.set(d.x, 0, d.z);

    const warehouseWallMat = new THREE.MeshStandardMaterial({ color: d.col, roughness: 0.6, metalness: 0.4 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const rackMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.6 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });

    // 1. Interior Concrete Slab Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.2, 25.6), concreteMat);
    floor.position.y = 0.1;
    warehouse.add(floor);

    // 2. Walkable Hollow Warehouse Walls (Left, Right, Back, and Front with Open Bay Doors)
    const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 26), warehouseWallMat);
    leftW.position.set(-6.3, 4.0, 0);
    warehouse.add(leftW);

    const rightW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 26), warehouseWallMat);
    rightW.position.set(6.3, 4.0, 0);
    warehouse.add(rightW);

    const backW = new THREE.Mesh(new THREE.BoxGeometry(13, 8, 0.4), warehouseWallMat);
    backW.position.set(0, 4.0, -12.8);
    warehouse.add(backW);

    const frontL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 8, 0.4), warehouseWallMat);
    frontL.position.set(-4.5, 4.0, 12.8);
    warehouse.add(frontL);

    const frontR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 8, 0.4), warehouseWallMat);
    frontR.position.set(4.5, 4.0, 12.8);
    warehouse.add(frontR);

    const frontHeader = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.0, 0.4), warehouseWallMat);
    frontHeader.position.set(0, 6.5, 12.8);
    warehouse.add(frontHeader);

    // 3. Roof with Overhead Skylight
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(9.5, 3.8, 4),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    roof.position.y = 9.8;
    roof.rotateY(Math.PI / 4);
    roof.scale.set(1.15, 1, 2.0);
    warehouse.add(roof);

    // 4. Warehouse Interior Racks & Crates
    for (let rz = -8; rz <= 6; rz += 7) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.0, 4.5), rackMat);
      rack.position.set(-4.5, 2.5, rz);
      warehouse.add(rack);

      const woodenCrate = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), crateMat);
      woodenCrate.position.set(4.2, 0.9, rz);
      warehouse.add(woodenCrate);
    }

    root.add(warehouse);

    // Interior Chest inside Warehouse
    addChest(scene, chests, chestMeshes, colliders, 130 + d.x, 1.0, -40 + d.z - 6, 'chest');

    // Walkable Wall Colliders for Dusty Depot Warehouse
    colliders.push({
      type: 'box',
      minX: 130 + d.x - 6.6,
      maxX: 130 + d.x - 5.9,
      minY: 0,
      maxY: 8.5,
      minZ: -40 + d.z - 13.2,
      maxZ: -40 + d.z + 13.2,
      name: `${d.name} Left Wall`,
    });

    colliders.push({
      type: 'box',
      minX: 130 + d.x + 5.9,
      maxX: 130 + d.x + 6.6,
      minY: 0,
      maxY: 8.5,
      minZ: -40 + d.z - 13.2,
      maxZ: -40 + d.z + 13.2,
      name: `${d.name} Right Wall`,
    });

    colliders.push({
      type: 'box',
      minX: 130 + d.x - 6.6,
      maxX: 130 + d.x + 6.6,
      minY: 0,
      maxY: 8.5,
      minZ: -40 + d.z - 13.2,
      maxZ: -40 + d.z - 12.4,
      name: `${d.name} Back Wall`,
    });

    colliders.push({
      type: 'box',
      minX: 130 + d.x - 6.6,
      maxX: 130 + d.x - 2.8,
      minY: 0,
      maxY: 8.5,
      minZ: -40 + d.z + 12.4,
      maxZ: -40 + d.z + 13.2,
      name: `${d.name} Front Left Wall`,
    });

    colliders.push({
      type: 'box',
      minX: 130 + d.x + 2.8,
      maxX: 130 + d.x + 6.6,
      minY: 0,
      maxY: 8.5,
      minZ: -40 + d.z + 12.4,
      maxZ: -40 + d.z + 13.2,
      name: `${d.name} Front Right Wall`,
    });
    // Metal Shipping Containers
    addHarvestable(
      harvestables,
      130 + d.x + 9,
      0,
      -40 + d.z + 14,
      'container',
      'metal',
      400,
      30,
      2.5,
      3
    );
    colliders.push({
      type: 'box',
      minX: 130 + d.x + 9 - 1.6,
      maxX: 130 + d.x + 9 + 1.6,
      minY: 0,
      maxY: 3.2,
      minZ: -40 + d.z + 14 - 3.2,
      maxZ: -40 + d.z + 14 + 3.2,
      name: 'Shipping Container',
    });

    addChest(scene, chests, chestMeshes, colliders, 130 + d.x, 8.5, -40 + d.z, 'chest');
  });

  // Heavy Mudflap Truck at Industrial Depot
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 0, 0, 22, 0xd97706, 'Dusty Depot Mudflap Heavy', 'truck', 0);

  scene.add(root);
}


// -------------------------------------------------------------
// POI 4: SALTY SPRINGS
// -------------------------------------------------------------
export function buildSaltySprings(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const root = new THREE.Group();
  root.position.set(40, 0, 120);

  // Gas Station Canopy
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0xef4444 })
  );
  canopy.position.set(0, 5.5, 0);
  root.add(canopy);

  // Gas station pillars
  for (const px of [-6, 6]) {
    for (const pz of [-4, 4]) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 5.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      pillar.position.set(px, 2.75, pz);
      root.add(pillar);

      colliders.push({
        type: 'cylinder',
        x: 40 + px,
        z: 120 + pz,
        radius: 0.5,
        minY: 0,
        maxY: 5.5,
        name: 'Gas Station Pillar',
      });
    }
  }

  // Gas Station Convenience Store
  const store = new THREE.Mesh(
    new THREE.BoxGeometry(14, 5.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
  );
  store.position.set(0, 2.75, -12);
  root.add(store);

  // Store Front Glass Windows
  const storeGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.7 })
  );
  storeGlass.position.set(0, 2.2, -6.95);
  root.add(storeGlass);

  colliders.push({
    type: 'box',
    minX: 40 - 7.2,
    maxX: 40 + 7.2,
    minY: 0,
    maxY: 5.5,
    minZ: 120 - 17.2,
    maxZ: 120 - 6.8,
    name: 'Salty Gas Station Shop',
  });

  // 3 Suburban homes in Salty Springs neighborhood
  addDetailedSuburbanHome(root, harvestables, colliders, 40, 120, -28, 20, 0x0284c7, 'Salty Blue Manor');
  addDetailedSuburbanHome(root, harvestables, colliders, 40, 120, 28, 20, 0xf59e0b, 'Salty Amber Villa');
  addDetailedSuburbanHome(root, harvestables, colliders, 40, 120, -28, -25, 0x10b981, 'Salty Green Home');

  // Gas Station Drivable Vehicles (Parked in dedicated parking stalls on sides, 100% off Salty Avenue)
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -14, 0, -8, 0x10b981, 'Salty Gas Sports Emerald', 'sports', 0);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 14, 0, -8, 0x3b82f6, 'Salty Gas SUV Cobalt', 'suv', 0);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -28, 0, 32, 0xef4444, 'Salty Whiplash Red', 'sports', Math.PI / 2);

  addChest(scene, chests, chestMeshes, colliders, 40, 5.8, 120, 'chest');
  addChest(scene, chests, chestMeshes, colliders, 40, 5.8, 120 - 12, 'rare_chest');

  scene.add(root);
}


// -------------------------------------------------------------
// POI 6: RETAIL ROW
// -------------------------------------------------------------
export function buildRetailRow(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const root = new THREE.Group();
  root.position.set(150, 0, 120);

  // NOMS Supermarket
  const store = new THREE.Mesh(
    new THREE.BoxGeometry(24, 7.5, 18),
    new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.7 })
  );
  store.position.y = 3.75;
  root.add(store);

  // Supermarket Windows
  const storeGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.7 })
  );
  storeGlass.position.set(0, 3, 9.05);
  root.add(storeGlass);

  colliders.push({
    type: 'box',
    minX: 150 - 12.2,
    maxX: 150 + 12.2,
    minY: 0,
    maxY: 8.0,
    minZ: 120 - 9.2,
    maxZ: 120 + 9.2,
    name: 'NOMS Supermarket',
  });

  // Store Sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(10, 2.4, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xfacc15 })
  );
  sign.position.set(0, 9, 9.2);
  root.add(sign);

  // Taco Shop
  const tacoShop = new THREE.Mesh(
    new THREE.BoxGeometry(18, 6.5, 16),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
  );
  tacoShop.position.set(-28, 3.25, 0);
  root.add(tacoShop);

  colliders.push({
    type: 'box',
    minX: 150 - 28 - 9.2,
    maxX: 150 - 28 + 9.2,
    minY: 0,
    maxY: 7.0,
    minZ: 120 - 8.2,
    maxZ: 120 + 8.2,
    name: 'Retail Row Taco Shop',
  });

  // 2 Suburban Homes in Retail Row East
  addDetailedSuburbanHome(root, harvestables, colliders, 150, 120, 28, -25, 0x3b82f6, 'Retail Row Home Alpha');
  addDetailedSuburbanHome(root, harvestables, colliders, 150, 120, -28, -25, 0x10b981, 'Retail Row Home Bravo');

  // Retail Row Parking Lot Vehicles
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 0, 0, 18, 0x10b981, 'Retail NOMS Delivery Truck', 'truck', Math.PI);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -14, 0, 18, 0xef4444, 'Retail Sports Car Ruby', 'sports', Math.PI);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, 18, 0, 18, 0xf59e0b, 'Retail Taxi Prevalent', 'sports', Math.PI);

  addChest(scene, chests, chestMeshes, colliders, 150, 8.0, 120, 'chest');
  addChest(scene, chests, chestMeshes, colliders, 150 - 5, 8.0, 120 - 5, 'rare_chest');

  scene.add(root);
}


// -------------------------------------------------------------
// POI 7: SNOBBY SHORES (Luxury Waterfront Estates & Garages)
// -------------------------------------------------------------
export function buildSnobbyShores(
  scene: THREE.Scene,
  harvestables: HarvestableObject[],
  chests: LootChest[],
  chestMeshes: Map<string, THREE.Group>,
  colliders: SolidCollider[],
  vehicles: DrivableVehicle[]
) {
  const root = new THREE.Group();
  root.position.set(-200, 0, 20);

  const luxuryMansions = [
    { x: 0, z: -35, col: 0xf8fafc, name: 'Modern White Villa' },
    { x: 0, z: 0, col: 0x0f172a, name: 'Cyber Obsidian Estate' },
    { x: 0, z: 35, col: 0x1e293b, name: 'Azure Waterfront Mansion' },
  ];

  luxuryMansions.forEach((m) => {
    const mansion = new THREE.Group();
    mansion.position.set(m.x, 0, m.z);

    const lowerFloor = new THREE.Mesh(
      new THREE.BoxGeometry(16, 4.5, 14),
      new THREE.MeshStandardMaterial({ color: m.col, roughness: 0.4 })
    );
    lowerFloor.position.y = 2.25;
    mansion.add(lowerFloor);

    const upperFloor = new THREE.Mesh(
      new THREE.BoxGeometry(12, 3.8, 10),
      new THREE.MeshStandardMaterial({ color: m.col, roughness: 0.4 })
    );
    upperFloor.position.set(0, 6.4, 0);
    mansion.add(upperFloor);

    const glassBalcony = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
    );
    glassBalcony.position.set(0, 5.1, 5.5);
    mansion.add(glassBalcony);

    const patio = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.3, roughness: 0.8 })
    );
    patio.position.set(14, 0.1, 0);
    mansion.add(patio);

    // Sun deck lounge chairs
    for (const cz of [-3, 0, 3]) {
      const lounger = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.3, 2.4),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
      );
      lounger.position.set(14, 0.35, cz);
      mansion.add(lounger);
    }

    root.add(mansion);

    colliders.push({
      type: 'box',
      minX: -200 + m.x - 8.5,
      maxX: -200 + m.x + 8.5,
      minY: 0,
      maxY: 8.5,
      minZ: 20 + m.z - 7.5,
      maxZ: 20 + m.z + 7.5,
      name: m.name,
    });

    addChest(scene, chests, chestMeshes, colliders, -200 + m.x, 8.8, 20 + m.z, 'rare_chest');
  });

  // Sports Cars parked in Snobby Shores private mansion forecourts (100% off driveway lanes)
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -14, 0, -27, 0xfacc15, 'Snobby Gold GT Supercar', 'sports', Math.PI / 2);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -14, 0, 8, 0xef4444, 'Snobby Rosso Corsa GT', 'sports', Math.PI / 2);
  addDetailedDrivableVehicle(root, harvestables, colliders, vehicles, -14, 0, 43, 0x38bdf8, 'Snobby Miami Blue GT', 'sports', Math.PI / 2);

  scene.add(root);
}
