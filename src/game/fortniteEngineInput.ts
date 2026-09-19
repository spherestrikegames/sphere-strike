// Pointer-lock controls, keyboard/mouse handlers, perspective & inventory slot/build-mode toggles.
import * as THREE from 'three';
import { FortniteWeapon, BuildType } from '../types';
import { createFirstPersonWeaponRig } from './fortniteWeapons';
import { createHologramPreview } from './fortniteBuilding';
import { fortniteAudio } from '../utils/audio';
import { multiplayerClient } from '../utils/multiplayer';
import type { FortniteEngine } from './fortniteEngine';


export function attachEventListenersImpl(engine: FortniteEngine) {
  window.addEventListener('keydown', engine.onKeyDown);
  window.addEventListener('keyup', engine.onKeyUp);
  window.addEventListener('mousemove', engine.onMouseMove);
  window.addEventListener('mousedown', engine.onMouseDown);
  window.addEventListener('mouseup', engine.onMouseUp);
  window.addEventListener('contextmenu', engine.onContextMenu);
  window.addEventListener('resize', engine.onWindowResize);

  engine.canvas.addEventListener('click', () => {
    if (!engine.isPointerLocked && !engine.isGameOver) {
      engine.safeRequestPointerLock();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    engine.isPointerLocked = document.pointerLockElement === engine.canvas;
  });
}

export function destroyImpl(engine: FortniteEngine) {
  fortniteAudio.stopMusic();
  cancelAnimationFrame(engine.animationFrameId);
  window.removeEventListener('keydown', engine.onKeyDown);
  window.removeEventListener('keyup', engine.onKeyUp);
  window.removeEventListener('mousemove', engine.onMouseMove);
  window.removeEventListener('mousedown', engine.onMouseDown);
  window.removeEventListener('mouseup', engine.onMouseUp);
  window.removeEventListener('contextmenu', engine.onContextMenu);
  window.removeEventListener('resize', engine.onWindowResize);
  for (const remote of engine.remotePlayers.values()) {
    engine.scene.remove(remote.rig.root);
  }
  engine.remotePlayers.clear();
  multiplayerClient.setGameRunning(false);
  engine.renderer.dispose();
}

export function onContextMenuImpl(engine: FortniteEngine, e: MouseEvent) {
  e.preventDefault();
}

export function onWindowResizeImpl(engine: FortniteEngine) {
  if (!engine.canvas) return;
  engine.camera.aspect = engine.canvas.clientWidth / engine.canvas.clientHeight;
  engine.camera.updateProjectionMatrix();
  engine.renderer.setSize(engine.canvas.clientWidth, engine.canvas.clientHeight);
}

export function onKeyDownImpl(engine: FortniteEngine, e: KeyboardEvent) {
  engine.keys[e.code] = true;

  // Slot switching (1 to 6)
  if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(e.code)) {
    const slot = parseInt(e.code.replace('Digit', '')) - 1;
    engine.setActiveSlot(slot);
    fortniteAudio.playUiClick();
  }

  // Toggle 1st Person / 3rd Person ('V')
  if (e.code === 'KeyV') {
    engine.togglePerspective();
  }

  // Glider toggle in Skydiving mode or when airborne ('Space')
  if (e.code === 'Space') {
    if (engine.isSkydiving) {
      engine.isGliding = !engine.isGliding;
      if (engine.isGliding) {
        fortniteAudio.playGliderDeploy();
      }
    } else if (!engine.isGrounded && engine.playerPos.y > 10) {
      engine.isSkydiving = true;
      engine.isGliding = true;
      fortniteAudio.playGliderDeploy();
    }
  }

  // Building Mode Toggle ('Q', 'F', 'R', 'T')
  if (e.code === 'KeyQ') {
    engine.toggleBuildMode('wall');
  }
  if (e.code === 'KeyF') {
    if (engine.activeVehicle) {
      engine.exitVehicle();
    } else {
      engine.toggleBuildMode('floor');
    }
  }
  if (e.code === 'KeyR' && engine.isBuildMode) {
    engine.toggleBuildMode('ramp');
  } else if (e.code === 'KeyR' && !engine.isBuildMode) {
    engine.startReload();
  }
  if (e.code === 'KeyT') {
    engine.toggleBuildMode('cone');
  }

  // Interact / Drive Vehicle / Loot Chest / Pick up Supply ('E')
  if (e.code === 'KeyE') {
    engine.interactChestOrItem();
  }

  // Car Honk ('H')
  if (e.code === 'KeyH' && engine.activeVehicle) {
    fortniteAudio.playCarHonk();
  }

  // Tactical Slide (Shift + C / Ctrl)
  if ((e.code === 'KeyC' || e.code === 'ControlLeft') && engine.isSprinting && engine.isGrounded && !engine.isSliding && !engine.activeVehicle) {
    engine.isSliding = true;
    engine.slideTimer = 0.8;
    fortniteAudio.playSlide();
  }
}

export function onKeyUpImpl(engine: FortniteEngine, e: KeyboardEvent) {
  engine.keys[e.code] = false;
}

export function onMouseMoveImpl(engine: FortniteEngine, e: MouseEvent) {
  if (!engine.isPointerLocked) return;

  const baseSens = (engine.profile.settings.sensitivity ?? 1.0) * 0.0022;
  const adsMultiplier = engine.isAimingDownSights
    ? (engine.profile.settings.adsSensitivity ?? 0.75)
    : 1.0;
  const sens = baseSens * adsMultiplier;
  const ySign = engine.profile.settings.invertY ? -1 : 1;

  engine.playerRotY -= e.movementX * sens;
  engine.playerPitch -= e.movementY * sens * ySign;

  // Clamp pitch between -88° and +88°
  engine.playerPitch = Math.max(-1.53, Math.min(1.53, engine.playerPitch));
}

export function applySettingsImpl(engine: FortniteEngine, settings: import('../types').GameSettings) {
  engine.profile.settings = { ...engine.profile.settings, ...settings };

  // Update FOV
  if (!engine.isAimingDownSights) {
    engine.camera.fov = settings.fov || 75;
    engine.camera.updateProjectionMatrix();
  }

  // Update Pixel Ratio & Resolution Scaling
  const resScale = settings.resolutionScale || 1.0;
  engine.renderer.setPixelRatio(Math.min(window.devicePixelRatio, resScale));

  // Update Shadows
  const hasShadows = !!settings.shadows;
  engine.renderer.shadowMap.enabled = hasShadows;
  if (engine.sunLight) {
    engine.sunLight.castShadow = hasShadows;
  }

  // Update Fog / View Distance
  const fogDensity =
    settings.viewDistance === 'near'
      ? 0.0036
      : settings.viewDistance === 'far'
      ? 0.0016
      : 0.0022;
  if (engine.scene.fog && 'density' in engine.scene.fog) {
    (engine.scene.fog as THREE.FogExp2).density = fogDensity;
  }

  // Apply Audio settings
  fortniteAudio.applySettings(settings);
}

export function onMouseDownImpl(engine: FortniteEngine, e: MouseEvent) {
  if (!engine.isPointerLocked) {
    engine.safeRequestPointerLock();
    return;
  }

  if (engine.activeVehicle) return; // Cannot shoot while driving

  if (e.button === 0) {
    engine.isMouseDown = true;
    if (engine.isBuildMode) {
      engine.placeBuildingPiece();
    } else {
      engine.fireActiveWeapon();
    }
  } else if (e.button === 2) {
    engine.isRightMouseDown = true;
    engine.isAimingDownSights = true;
  }
}

export function onMouseUpImpl(engine: FortniteEngine, e: MouseEvent) {
  if (e.button === 0) {
    engine.isMouseDown = false;
  } else if (e.button === 2) {
    engine.isRightMouseDown = false;
    engine.isAimingDownSights = false;
  }
}

export function togglePerspectiveImpl(engine: FortniteEngine) {
  engine.isFirstPerson = !engine.isFirstPerson;
  if (engine.fpsRig) engine.fpsRig.visible = engine.isFirstPerson && !engine.activeVehicle;
  if (engine.thirdPersonRig) engine.thirdPersonRig.root.visible = !engine.isFirstPerson || !!engine.activeVehicle;
  fortniteAudio.playUiClick();
}

export function setActiveSlotImpl(engine: FortniteEngine, slotIndex: number) {
  if (slotIndex < 0 || slotIndex >= engine.inventory.length) return;
  engine.activeSlot = slotIndex;

  // Only allow building when holding the Pickaxe (Slot 0 / type 'pickaxe')
  if (engine.inventory[slotIndex]?.type !== 'pickaxe') {
    engine.isBuildMode = false;
    if (engine.hologramMesh) engine.hologramMesh.visible = false;
  }

  engine.updateWeaponRigs();
  engine.callbacks.onInventoryChange(engine.inventory, engine.activeSlot);
}

export function toggleBuildModeImpl(engine: FortniteEngine, type: BuildType) {
  if (engine.activeVehicle) return;

  if (engine.mode === '1v1_build_fight') {
    if (engine.callbacks.onItemCollected) {
      engine.callbacks.onItemCollected({
        id: `nobuild_${Date.now()}`,
        title: '🚫 Building Disabled',
        subtitle: '1v1 Aim Arena is a No-Build gunfight zone!',
        icon: '🎯',
        type: 'weapon',
        color: '#ef4444',
        timestamp: Date.now(),
      });
    }
    fortniteAudio.playUiClick();
    return;
  }

  // Automatically equip Pickaxe (Slot 0) when entering build mode
  if (engine.getCurrentWeapon()?.type !== 'pickaxe') {
    const pickaxeIdx = engine.inventory.findIndex((w) => w.type === 'pickaxe');
    if (pickaxeIdx !== -1) {
      engine.activeSlot = pickaxeIdx;
      engine.updateWeaponRigs();
      engine.callbacks.onInventoryChange(engine.inventory, engine.activeSlot);
    }
  }

  if (engine.isBuildMode && engine.selectedBuildType === type) {
    engine.isBuildMode = false;
    if (engine.hologramMesh) engine.hologramMesh.visible = false;
  } else {
    engine.isBuildMode = true;
    engine.selectedBuildType = type;
    if (engine.hologramMesh) {
      engine.scene.remove(engine.hologramMesh);
      engine.hologramMesh = createHologramPreview(type);
      engine.scene.add(engine.hologramMesh);
      engine.hologramMesh.visible = true;
    }
    fortniteAudio.playUiClick();
  }
}

export function updateWeaponRigsImpl(engine: FortniteEngine) {
  const wep = engine.getCurrentWeapon();
  const type = wep ? wep.type : 'pickaxe';
  const rarity = wep ? wep.rarity : 'common';

  if (engine.fpsRig) {
    engine.camera.remove(engine.fpsRig);
    engine.fpsRig = createFirstPersonWeaponRig(type, rarity);
    engine.fpsRig.visible = engine.isFirstPerson && !engine.activeVehicle;
    engine.camera.add(engine.fpsRig);
  }

  if (engine.thirdPersonRig) {
    engine.thirdPersonRig.setWeapon(type, rarity);
  }
}

export function getCurrentWeaponImpl(engine: FortniteEngine): FortniteWeapon | null {
  return engine.inventory[engine.activeSlot] || null;
}
