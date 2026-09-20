# Fortnite 3D Web Edition (React + Three.js + TypeScript)

A high-performance, browser-native 3D Battle Royale and Box Fight game engine built with **React 19**, **Three.js**, **TypeScript**, **Tailwind CSS**, and **Express + WebSockets**.

The engine implements authentic battle royale mechanics: 4x4m grid building (walls, ramps, floors, cones), hitscan & projectile ballistics with bloom and damage falloff, bot AI with line-of-sight checks, procedural island world generation with instanced rendering, an interactive storm circle, inventory/loot systems, and real-time multiplayer synchronization.

---

## Table of Contents
1. [Core Features](#core-features)
2. [Architecture Overview](#architecture-overview)
3. [Documentation for AI Agents & Engineers](#documentation-for-ai-agents--engineers)
4. [Tech Stack](#tech-stack)
5. [Development & Build Commands](#development--build-commands)
6. [Directory Structure](#directory-structure)
7. [Coding & Performance Standards](#coding--performance-standards)

---

## Core Features

- **Grid Building Engine**: Exact 4x4m tile grid alignment for walls, ramps, floors, and roofs (cones) with wood/brick/metal materials, structural health, placement validation, and edit previews.
- **Ballistics & Weapons**:
  - ARs, shotguns, SMGs, snipers, rocket launchers, and pickaxe.
  - Bullet spread (bloom), first-shot accuracy, damage falloff by distance, and headshot multipliers (up to 2.5x).
  - Pre-allocated zero-allocation raycasting for hitscan and shotgun spread pellets.
- **Bot AI Subsystem**:
  - Autonomous bot navigation, target tracking, weapon selection, and combat maneuvers.
  - Zero-allocation line-of-sight obstruction checks using spatial grid queries.
  - Reactive building behaviors (placing defensive walls when taking fire).
- **Procedural World & Mega City**:
  - Island featuring Mega City skyscrapers, suburban residential areas, highway systems, gas stations, water features, and loot chests.
  - High-performance instanced rendering (`THREE.InstancedMesh`) for skyscraper window matrices and double-yellow/dashed highway markings.
- **Spatial Hash Partitioning**:
  - 32-bit packed integer key spatial collider grid (`((cx + 32768) << 16) | ((cz + 32768) & 0xffff)`) eliminating string allocations in tight game loops.
- **Real-Time Multiplayer**:
  - Dedicated WebSocket server (`server.ts`) coordinating player positions, orientations, firing events, and building placement synchronization.
- **Battle Royale & Box Fight Modes**:
  - Dynamic contracting storm circle with tick damage.
  - Dedicated fast-paced 1v1 / FFA Box Fight Arena mode.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |               App.tsx                 |
                      |  (Game Mode, Lobby, HUD, React State) |
                      +-------------------+-------------------+
                                          |
                      +-------------------v-------------------+
                      |         fortniteEngine.ts             |
                      |  (Coordinator & Primary Game Engine)  |
                      +-------------------+-------------------+
                                          |
         +--------------------------------+--------------------------------+
         |                                |                                |
+--------v-----------+          +---------v----------+          +----------v---------+
|     Subsystems     |          |   World & Scene    |          |    Networking      |
|  - Movement        |          |  - Terrain         |          |  - WebSocket sync  |
|  - Ballistics      |          |  - Mega City       |          |  - Remote Players  |
|  - Bot AI          |          |  - Roads (Instanced|          |  - Building sync   |
|  - Build Engine    |          |  - Nature & Props  |          +--------------------+
|  - Loot & Chests   |          +--------------------+
|  - Combat & FX     |
+--------+-----------+
         |
+--------v-----------+
|  spatialGrid.ts    |
| (Bit-packed hash   |
|  zero-alloc grid)  |
+--------------------+
```

---

## Documentation for AI Agents & Engineers

For in-depth sub-module design, data contracts, and architectural walkthroughs, refer to the dedicated agent manuals in `/docs`:

| Documentation File | Topic & Scope |
| :--- | :--- |
| **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** | Engine initialization sequence, 60fps tick pipeline, coordinate system, and memory management policies. |
| **[`docs/MODULES_GAME.md`](docs/MODULES_GAME.md)** | Deep dive into `spatialGrid.ts`, ballistics raycasting, bot AI behavior trees, building placement math, and weapon stats. |
| **[`docs/MODULES_WORLD.md`](docs/MODULES_WORLD.md)** | Procedural island generation, skyscraper layout, instanced mesh pipelines, lighting, and visual FX. |
| **[`docs/MODULES_NETWORKING_UI.md`](docs/MODULES_NETWORKING_UI.md)** | WebSocket packet protocol, client interpolation, sound synthesis engine, and React HUD overlays. |

---

## Tech Stack

- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS, Lucide Icons, Canvas/WebGL
- **3D Graphics Engine**: Three.js (v0.180.0)
- **Backend & Networking**: Node.js (v22), Express, `ws` (WebSockets), `tsx`, `esbuild`
- **Audio Engine**: Web Audio API (procedural synthesis for footsteps, gunshots, impacts, building)
- **Build Tooling**: Vite 6, TypeScript Compiler (`tsc`)

---

## Development & Build Commands

All commands run from the project root:

```bash
# Start development server (Full-stack: Vite + Express + WebSockets on port 3000)
npm run dev

# Run TypeScript typechecking & linter
npm run lint

# Run automated unit test suite (using Node native test runner + tsx)
npm test

# Build for production (compiles client assets and bundles server to dist/server.cjs)
npm run build

# Start production server
npm start
```

---

## Directory Structure

```
├── docs/                           # Architectural and subsystem documentation for AI & engineers
│   ├── ARCHITECTURE.md             # Core game loop & lifecycle specification
│   ├── MODULES_GAME.md             # Ballistics, Bot AI, Building, Combat, Spatial Grid
│   ├── MODULES_WORLD.md            # Island terrain, Mega City, Roads, Instancing
│   └── MODULES_NETWORKING_UI.md    # WebSocket protocols, Web Audio, React HUD
├── src/
│   ├── App.tsx                     # Top-level state coordinator, UI switching, canvas binding
│   ├── types.ts                    # Global TypeScript interfaces, types, and constants
│   ├── components/                 # React UI overlays (HUD, Lobby, Shop, Victory screen)
│   ├── data/                       # Weapons database, skin catalogs, item definitions
│   ├── game/                       # Core 3D Three.js game engine & subsystems
│   │   ├── fortniteEngine.ts       # Central engine coordinator class
│   │   ├── fortniteEngineLoop.ts   # 60fps game loop execution pipeline
│   │   ├── fortniteEngineMovement.ts # Physics, jumping, sprinting, sliding, gravity
│   │   ├── fortniteEngineBallistics.ts # Hitscan, shotgun pellets, projectile march
│   │   ├── fortniteEngineBotAI.ts  # Bot decision tree, LOS checks, pathfinding
│   │   ├── fortniteEngineBuild.ts  # 4x4m grid snapping, building preview & placement
│   │   ├── fortniteEngineCombatResolution.ts # Damage calculation, elimination logic
│   │   ├── fortniteWorld.ts        # Island master generator
│   │   ├── fortniteWorldMegaCity.ts # Instanced skyscraper facades & urban layout
│   │   ├── fortniteWorldRoads.ts   # Instanced highway dividers & road networks
│   │   └── spatialGrid.ts          # Zero-allocation bit-packed spatial hash grid
│   └── utils/
│       ├── audio.ts                # Web Audio API sound synthesis
│       ├── multiplayer.ts          # Client-side WebSocket manager
│       └── playerNames.ts          # Random bot name generation
├── tests/                          # Automated unit tests
│   └── spatialGrid.test.ts         # Spatial collider hash and deduplication tests
├── server.ts                       # Express server + WebSocket multiplayer sync relay
├── AGENTS.md                       # AI lifecycle rules, judgment boundaries, and commands
└── package.json                    # Project configuration and script targets
```

---

## Coding & Performance Standards

1. **Zero Allocations in Game Loops**:
   - In files executed every frame or per-shot (`fortniteEngineLoop.ts`, `fortniteEngineBallistics.ts`, `fortniteEngineBotAI.ts`, `spatialGrid.ts`), **never** instantiate `new THREE.Vector3()`, `new THREE.Raycaster()`, or `new Set()`.
   - Use preallocated module-scoped scratch objects (prefixed with `_`).
2. **Draw Call Minimization**:
   - Recurring structural meshes (windows, lane dividers, fences) must utilize `THREE.InstancedMesh` with a dynamic or static matrix transform buffer.
3. **Spatial Query Discipline**:
   - Do not perform linear iteration over all island objects or distant bots. Always query `engine.spatialGrid.queryNear()` or `queryAABB()` to filter to local candidates within the bounding radius.
4. **No Inline CSS**:
   - All styling must use standard Tailwind CSS utility classes.
