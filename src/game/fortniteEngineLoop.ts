// Main requestAnimationFrame simulation loop and interaction prompts.
import * as THREE from 'three';
import type { FortniteEngine } from './fortniteEngine';


export function loopImpl(engine: FortniteEngine) {
  engine.animationFrameId = requestAnimationFrame(engine.loop);

  const now = performance.now();
  const dt = Math.min((now - engine.lastTime) / 1000, 0.1);
  engine.lastTime = now;

  if (!engine.isGameOver) {
    // 1v1 Round End Countdown
    if (engine.mode === '1v1_build_fight' && engine.arena1v1State.isRoundOver) {
      engine.roundCountdownTimer += dt;
      const remaining = Math.max(0, Math.ceil(3 - engine.roundCountdownTimer));
      if (engine.arena1v1State.countdown !== remaining) {
        engine.arena1v1State.countdown = remaining;
        engine.callbacks.onArena1v1Update?.({ ...engine.arena1v1State });
      }
      if (engine.roundCountdownTimer >= 3) {
        engine.roundCountdownTimer = 0;
        engine.reset1v1Round(engine.arena1v1State.roundWinner || 'player');
      }
    }

    // Update duel respawn and invulnerability timers
    if (engine.invulnerableTimer > 0) {
      engine.invulnerableTimer -= dt;
      if (engine.invulnerableTimer <= 0) {
        engine.isInvulnerable = false;
      }
    }

    if (engine.isRespawning) {
      engine.respawnCountdown = Math.max(0, engine.respawnCountdown - dt);
    }

    if (engine.activeVehicle) {
      engine.updateVehicleDriving(dt);
    } else {
      engine.updateSkydivingAndMovement(dt);
    }

    if (engine.gameStarted) {
      if (engine.mode !== '1v1_build_fight') {
        engine.updateStorm(dt);
      }
      engine.updateBots(dt);
    }
    engine.updateBuildingHologram();
    engine.updateDamageNumbers(dt);
    engine.updateBulletTracers(dt);
    engine.updateHarvestParticles(dt);
    engine.updateHarvestWobbles(dt);
    engine.updateShellCasings(dt);
    engine.updateDroppedSupplies(dt);
    engine.updateScopeTrajectory();
    engine.updateInteractionPrompts();
    engine.updateNetworkSync(now);

    // Auto fire / continuous swing for AR, SMG, and Pickaxe if mouse held
    const wep = engine.getCurrentWeapon();
    if (engine.isMouseDown && wep && (wep.type === 'ar' || wep.type === 'smg' || wep.type === 'pickaxe') && !engine.activeVehicle) {
      engine.fireActiveWeapon();
    }
  }

  engine.updateCameraAndRigs(dt);
  engine.renderer.render(engine.scene, engine.camera);
}

export function updateInteractionPromptsImpl(engine: FortniteEngine) {
  if (engine.activeVehicle) {
    const msg = `DRIVING ${engine.activeVehicle.name} • [E / F] EXIT • [SHIFT] NITRO • [SPACE] DRIFT`;
    if (engine.lastNearCarPrompt !== msg) {
      engine.lastNearCarPrompt = msg;
      engine.callbacks.onNearVehiclePrompt?.(msg);
    }
    return;
  }

  // Check near vehicle
  let nearCarPrompt: string | null = null;
  for (let i = 0; i < engine.vehicles.length; i++) {
    const v = engine.vehicles[i];
    const dx = engine.playerPos.x - v.x;
    const dy = engine.playerPos.y - v.y;
    const dz = engine.playerPos.z - v.z;
    if (dx * dx + dy * dy + dz * dz < 18.0) {
      nearCarPrompt = `[E] DRIVE ${v.name.toUpperCase()}`;
      break;
    }
  }
  if (engine.lastNearCarPrompt !== nearCarPrompt) {
    engine.lastNearCarPrompt = nearCarPrompt;
    engine.callbacks.onNearVehiclePrompt?.(nearCarPrompt);
  }

  // Check near Upgrade Bench or Reset Pedestal
  let benchPrompt: string | null = null;
  if (engine.resetPedestalPos) {
    const pDist = engine.playerPos.distanceTo(
      new THREE.Vector3(engine.resetPedestalPos.x, engine.resetPedestalPos.y, engine.resetPedestalPos.z)
    );
    if (pDist < 5.0) {
      benchPrompt = `[E] RESET 1V1 ARENA BUILDS`;
    }
  }

  if (!benchPrompt) {
    for (const bench of engine.upgradeBenches) {
      const bDist = engine.playerPos.distanceTo(new THREE.Vector3(bench.x, bench.y, bench.z));
      if (bDist < 5.0) {
        benchPrompt = `[E] USE UPGRADE BENCH (OR PRESS [B])`;
        break;
      }
    }
  }

  if (engine.lastNearUpgradeBenchPrompt !== benchPrompt) {
    engine.lastNearUpgradeBenchPrompt = benchPrompt;
    engine.callbacks.onNearUpgradeBenchPrompt?.(benchPrompt);
  }

  // Check near supply
  if (engine.callbacks.onNearSupplyPrompt) {
    let supplyPrompt: string | null = null;
    for (let i = 0; i < engine.droppedSupplies.length; i++) {
      const item = engine.droppedSupplies[i];
      if (item.type === 'weapon' && item.weapon) {
        const dx = engine.playerPos.x - item.x;
        const dy = engine.playerPos.y - item.y;
        const dz = engine.playerPos.z - item.z;
        if (dx * dx + dy * dy + dz * dz < 14.5) {
          supplyPrompt = `[E] SWAP FOR ${item.weapon.name.toUpperCase()}`;
          break;
        }
      }
    }
    if (!supplyPrompt) {
      for (let i = 0; i < engine.supplyDropBoxes.length; i++) {
        const box = engine.supplyDropBoxes[i];
        if (box.isLanded) {
          const dx = engine.playerPos.x - box.x;
          const dy = engine.playerPos.y - box.y;
          const dz = engine.playerPos.z - box.z;
          if (dx * dx + dy * dy + dz * dz < 16.0) {
            supplyPrompt = `[E] OPEN LEGENDARY SUPPLY CRATE`;
            break;
          }
        }
      }
    }
    if (engine.lastNearSupplyPrompt !== supplyPrompt) {
      engine.lastNearSupplyPrompt = supplyPrompt;
      engine.callbacks.onNearSupplyPrompt(supplyPrompt);
    }
  }
}
