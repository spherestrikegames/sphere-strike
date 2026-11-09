import * as THREE from 'three';

const idealCameraPos = new THREE.Vector3();
const idealLookTarget = new THREE.Vector3();
const currentLookTarget = new THREE.Vector3();

// Camera rig configuration constants (Fortnite right-shoulder defaults)
const SHOULDER_OFFSET = new THREE.Vector3(1.1, 1.8, -3.2); // +X (right), +Y (head height), -Z (trailing distance)
const AIM_OFFSET = new THREE.Vector3(0.7, 1.6, -1.8);      // Tighter ADS shoulder crop
const LOOK_OFFSET = new THREE.Vector3(0.5, 1.5, 15.0);     // Gaze point in front of character

export function updateOverTheShoulderCamera(
  camera: THREE.PerspectiveCamera,
  playerPos: THREE.Vector3,
  playerRotY: number,
  isAiming: boolean,
  delta: number
) {
  const offset = isAiming ? AIM_OFFSET : SHOULDER_OFFSET;

  idealCameraPos
    .copy(offset)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotY)
    .add(playerPos);

  idealLookTarget
    .copy(LOOK_OFFSET)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotY)
    .add(playerPos);

  const cameraLerp = Math.min(1.0, delta * 12.0);
  camera.position.lerp(idealCameraPos, cameraLerp);
  currentLookTarget.lerp(idealLookTarget, cameraLerp);

  camera.lookAt(currentLookTarget);
}

// Crosshair Bloom / Spread Math (Returns spread in CSS pixels)
let currentSpread = 8;

export function calculateCrosshairSpread(
  isMoving: boolean,
  isSprinting: boolean,
  isJumping: boolean,
  isAiming: boolean,
  delta: number
) {
  let targetSpread = 8;

  if (isAiming) {
    targetSpread = 4;
  } else if (isJumping) {
    targetSpread = 28;
  } else if (isSprinting) {
    targetSpread = 22;
  } else if (isMoving) {
    targetSpread = 14;
  }

  const recoverySpeed = isAiming ? 18.0 : 12.0;
  currentSpread += (targetSpread - currentSpread) * Math.min(1.0, delta * recoverySpeed);

  return currentSpread;
}

export function applySpreadToCSS(spreadPx: number) {
  const top = document.querySelector('.reticle-tick.top') as HTMLElement | null;
  const bottom = document.querySelector('.reticle-tick.bottom') as HTMLElement | null;
  const left = document.querySelector('.reticle-tick.left') as HTMLElement | null;
  const right = document.querySelector('.reticle-tick.right') as HTMLElement | null;

  if (top) top.style.transform = `translate(-50%, -${spreadPx}px)`;
  if (bottom) bottom.style.transform = `translate(-50%, ${spreadPx}px)`;
  if (left) left.style.transform = `translate(-${spreadPx}px, -50%)`;
  if (right) right.style.transform = `translate(${spreadPx}px, -50%)`;
}
