# Architecture & Core Engine Lifecycle

This document provides a comprehensive breakdown of the core engine architecture, lifecycle phases, frame execution pipeline, coordinate space conventions, and memory management rules for the Fortnite 3D engine.

---

## 1. Engine Initialization Flow

When the user enters a match (Battle Royale, Box Fight, or Bot Match), `App.tsx` instantiates the engine and binds it to the canvas container:

```
[React App.tsx]
       |
       | 1. Instantiate new FortniteEngine(canvas, config)
       v
[fortniteEngine.ts constructor]
       |
       | 2. Setup Three.js Scene, Camera (75 FOV), WebGLRenderer
       | 3. Create AudioListener & Sound Synthesizer
       | 4. Initialize SpatialColliderGrid(cellSize = 24.0)
       | 5. Generate World Terrain & Landmarks (fortniteWorld.ts)
       | 6. Setup Lighting (Directional Sun + Ambient + Atmospheric Fog)
       | 7. Bind Keyboard, Mouse & Pointer Lock Handlers (fortniteEngineInput.ts)
       | 8. Connect to WebSocket Relay (if multiplayer mode)
       | 9. Spawn Local Player Rig & Initial Bots
       v
[requestAnimationFrame Loop Starts]
```

Key Initialization Files:
- `src/game/fortniteEngine.ts`: Core class holding the master state (`scene`, `camera`, `renderer`, `localPlayer`, `bots`, `buildings`, `spatialGrid`).
- `src/game/fortniteEngineSetup.ts`: Modular setup routines for Three.js render targets, shadows, skybox textures, and post-processing passes.
- `src/game/fortniteEngineInput.ts`: Pointer lock capture, WASD movement, mouse delta tracking, scroll wheel weapon slot switching, and build keybinds (Z, X, C, V or Q, F).

---

## 2. The 60 FPS Game Loop Pipeline

Every frame is processed in a strict sequence inside `fortniteEngineLoop.ts`:

```
                 +--------------------------------------+
                 |          requestAnimationFrame       |
                 +------------------+-------------------+
                                    |
                                    v
                 +--------------------------------------+
                 | 1. Compute delta time (clamped ≤0.1s)|
                 +------------------+-------------------+
                                    |
                                    v
                 +--------------------------------------+
                 | 2. Input Polling & Local Movement    |
                 |    (WASD, jump, slide, sprint, grav) |
                 +------------------+-------------------+
                                    |
                                    v
                 +--------------------------------------+
                 | 3. Spatial Collision Resolution      |
                 |    (Terrain, Buildings, Obstacles)   |
                 +------------------+-------------------+
                                    |
                                    v
                 +--------------------------------------+
                 | 4. Weapon State & Ballistics Update  |
                 |    (Firing, reload timer, bloom,     |
                 |     projectile flight, pellet traces)|
                 +------------------+-------------------+
                                    |
                                    v
                 +--------------------------------------+
                 | 5. Bot AI Execution                  |
                 |    (LOS checks, target select, move, |
                 |     burst fire, defensive building)  |
                 +------------------+-------------------+
                                    |
                                    v
                 +--------------------------------------+
                 | 6. Storm Circle Contraction & Damage |
                 +------------------+-------------------+
                                    |
                                    v
                 +--------------------------------------+
                 | 7. Network State Broadcast (WS)      |
                 |    (Position, rotY, anim, fire, build|
                 +------------------+-------------------+
                                    |
                                    v
                 +--------------------------------------+
                 | 8. Camera Sync, Viewbob & Recoil     |
                 +------------------+-------------------+
                                    |
                                    v
                 +--------------------------------------+
                 | 9. Visual FX & Particle Tick         |
                 |    (Sparks, bullet trails, muzzle)   |
                 +------------------+-------------------+
                                    |
                                    v
                 +--------------------------------------+
                 | 10. WebGL Renderer.render(scene,cam) |
                 +--------------------------------------+
```

### Critical Frame Loop Guarantees
- **Delta Clamping**: `Math.min(delta, 0.1)` prevents physics explosion when tab is backgrounded or during transient frame stutters.
- **Ordered Dependent Passes**: Ballistics update *before* bot decisions so bots can react immediately if hit this frame.
- **Decoupled Render & Physics**: Spatial collisions operate on bounding boxes and cylinder projections independently of raw Three.js polygon counts.

---

## 3. Coordinate System & Scale Conventions

- **Units**: 1 Three.js unit = 1 real-world meter.
- **Orientation**:
  - `+X` = East
  - `-X` = West
  - `+Y` = Up (Gravity acts along `-Y` at `9.82 m/s² * 2.5` game scale)
  - `+Z` = South
  - `-Z` = North (Default camera forward facing at `rotation.y = 0`)
- **Building Grid**:
  - Standard Fortnite tile size: **4.0 meters wide** $\times$ **4.0 meters high** $\times$ **4.0 meters deep**.
  - Snapped using `Math.floor(val / 4.0) * 4.0 + 2.0` (center of 4m block).
- **Player Dimensions**:
  - Standing Height: 1.85m
  - Collision Radius: 0.42m
  - Eye Level (Camera Y-offset): 1.62m
  - Crouch Height: 1.15m

---

## 4. Memory Management & Zero-Allocation Hot Paths

Because game engines in the browser trigger GC pauses if objects are instantiated in loop callbacks, this engine strictly enforces **module-scoped preallocated scratch variables**:

```typescript
// Correct: Preallocated module-level scratch instances
const _scratchVec3 = new THREE.Vector3();
const _scratchRay = new THREE.Ray();
const _scratchBox = new THREE.Box3();

export function checkIntersection(pos: THREE.Vector3, target: THREE.Vector3): boolean {
  _scratchVec3.copy(target).sub(pos).normalize();
  _scratchRay.set(pos, _scratchVec3);
  // Zero heap allocation occurs here
  return true;
}
```

Never do this inside `fortniteEngineLoop.ts`, `fortniteEngineBallistics.ts`, or `fortniteEngineBotAI.ts`:
```typescript
// FORBIDDEN: High-frequency allocation causes micro-stutter
const ray = new THREE.Raycaster();
const p = new THREE.Vector3(x, y, z);
const hits = scene.children.filter(...);
```

---

## 5. Subsystem Dependency Graph

```
[fortniteEngine.ts] (Central Controller)
  ├── spatialGrid.ts                 (Zero external dependencies)
  ├── fortniteEngineMovement.ts      (Depends on spatialGrid, localPlayer)
  ├── fortniteEngineBallistics.ts    (Depends on spatialGrid, bots, remotePlayers, FX)
  ├── fortniteEngineBotAI.ts         (Depends on spatialGrid, ballistics, buildings)
  ├── fortniteEngineBuild.ts         (Depends on spatialGrid, buildings map, materials)
  ├── fortniteEngineLoot.ts          (Depends on chests, ground items, localPlayer)
  ├── fortniteEngineCombatResolution.ts (Depends on weapons, damage numbers, audio)
  └── fortniteEngineFX.ts            (Depends on particle pools, Three.js meshes)
```
Each subsystem receives references to the core engine instance and manipulates state via explicit methods, preventing circular class coupling.
