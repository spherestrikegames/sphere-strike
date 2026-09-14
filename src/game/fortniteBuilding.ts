import * as THREE from 'three';
import { BuildType, MaterialType, BuildingPiece, SolidCollider } from '../types';

export const GRID_SIZE = 4.0; // Standard Fortnite 4m grid unit

export const MATERIAL_STATS: Record<
  MaterialType,
  { maxHp: number; initialHp: number; color: number; name: string }
> = {
  wood: { maxHp: 150, initialHp: 75, color: 0x92400e, name: 'Wood' },
  stone: { maxHp: 300, initialHp: 90, color: 0x78716c, name: 'Stone' },
  metal: { maxHp: 500, initialHp: 100, color: 0x475569, name: 'Metal' },
};

export function createHologramPreview(type: BuildType): THREE.Mesh {
  const geo = getBuildingGeometry(type);
  const holoMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    wireframe: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, holoMat);
  mesh.name = 'build_hologram';
  return mesh;
}

export function createPlacedBuildingMesh(piece: BuildingPiece): THREE.Mesh {
  const geo = getBuildingGeometry(piece.type);
  const matInfo = MATERIAL_STATS[piece.material];

  const meshMat = new THREE.MeshStandardMaterial({
    color: matInfo.color,
    roughness: piece.material === 'metal' ? 0.4 : 0.85,
    metalness: piece.material === 'metal' ? 0.8 : 0.1,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, meshMat);
  mesh.position.set(piece.x, piece.y, piece.z);
  mesh.rotation.y = piece.rotY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = `build_${piece.id}`;

  return mesh;
}

export function getBuildingGeometry(type: BuildType): THREE.BufferGeometry {
  if (type === 'wall') {
    // 4m x 4m Wall
    const geo = new THREE.BoxGeometry(GRID_SIZE, GRID_SIZE, 0.2);
    geo.translate(0, GRID_SIZE / 2, 0);
    return geo;
  } else if (type === 'floor') {
    // 4m x 4m Floor Flat
    const geo = new THREE.BoxGeometry(GRID_SIZE, 0.15, GRID_SIZE);
    geo.translate(0, 0.075, 0);
    return geo;
  } else if (type === 'ramp') {
    // 4m Ramp / Stairs angled at 45 deg
    const geo = new THREE.BoxGeometry(GRID_SIZE, 0.2, GRID_SIZE * 1.414);
    geo.rotateX(-Math.PI / 4);
    geo.translate(0, GRID_SIZE / 2, 0);
    return geo;
  } else {
    // Cone / Pyramid Roof
    const geo = new THREE.ConeGeometry(GRID_SIZE * 0.72, GRID_SIZE * 0.5, 4);
    geo.rotateY(Math.PI / 4);
    geo.translate(0, GRID_SIZE * 0.25, 0);
    return geo;
  }
}

export function snapToBuildGrid(
  playerPos: THREE.Vector3,
  cameraDirection: THREE.Vector3,
  buildType: BuildType
): { x: number; y: number; z: number; rotY: number } {
  // Offset 3.5m forward in look direction
  const targetX = playerPos.x + cameraDirection.x * 3.5;
  const targetY = playerPos.y + cameraDirection.y * 1.5;
  const targetZ = playerPos.z + cameraDirection.z * 3.5;

  // Snapping to nearest GRID_SIZE
  const snappedX = Math.round(targetX / GRID_SIZE) * GRID_SIZE;
  const snappedY = Math.max(0, Math.round(targetY / GRID_SIZE) * GRID_SIZE);
  const snappedZ = Math.round(targetZ / GRID_SIZE) * GRID_SIZE;

  // Cardinal snap rotation (0, 90, 180, 270 degrees)
  const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
  const snapQuarter = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);

  return {
    x: snappedX,
    y: snappedY,
    z: snappedZ,
    rotY: snapQuarter,
  };
}

export function calculateRampHeightAt(piece: BuildingPiece, px: number, pz: number): number | null {
  if (piece.type !== 'ramp') return null;

  // Relative coordinate in piece local space
  const dx = px - piece.x;
  const dz = pz - piece.z;

  const cos = Math.cos(-piece.rotY);
  const sin = Math.sin(-piece.rotY);
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;

  // Ramp footprint is [-2, 2] on X and [-2, 2] on Z
  if (Math.abs(localX) <= 2.1 && Math.abs(localZ) <= 2.1) {
    // Slopes upwards from -2 to +2 along Z
    const progress = (localZ + 2.0) / 4.0; // 0 to 1
    const clamped = Math.max(0, Math.min(1, progress));
    return piece.y + clamped * GRID_SIZE;
  }
  return null;
}
