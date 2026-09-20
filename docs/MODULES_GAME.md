# Game Subsystems & Combat Mechanics

This document provides a granular reference for AI agents and developers on the core physics, ballistics, spatial hashing, building placement, and bot artificial intelligence modules.

---

## 1. Spatial Hash Grid (`src/game/spatialGrid.ts`)

The `SpatialColliderGrid` provides fast $O(1)$ spatial queries for world colliders, structures, and building pieces across the island, preventing expensive linear iteration over the full scene.

### 1.1 Bit-Packed Key Optimization
Instead of allocating string keys on every lookup (e.g. `const key = `${cx}:${cz}``), the grid uses a packed 32-bit signed integer key:
```typescript
private toKey(cx: number, cz: number): number {
  return ((cx + 32768) << 16) | ((cz + 32768) & 0xffff);
}
```
- Cell Size: Defaults to `24.0` meters.
- Coverage: Supports coordinates from $-780,000$ to $+780,000$ meters without collisions.
- Storage: Standard `Map<number, SolidCollider[]>` and `Map<number, BuildingPiece[]>`.

### 1.2 Zero-Allocation Deduplication
Large bounding boxes (like commercial buildings or ramps) may overlap multiple cells. To prevent returning duplicate colliders, `queryAABB` and `queryNear` reuse an internal set:
```typescript
private seenColliders = new Set<SolidCollider>();
private resultColliders: SolidCollider[] = [];

queryAABB(minX, minZ, maxX, maxZ): SolidCollider[] {
  this.seenColliders.clear();
  this.resultColliders.length = 0;
  // ... traverse cells, populate resultColliders if not in seenColliders ...
  return this.resultColliders;
}
```

---

## 2. Ballistics & Weapon Mechanics (`src/game/fortniteEngineBallistics.ts`)

The ballistics system handles two distinct weapon classes: **Hitscan** and **Projectile**.

### 2.1 Hitscan Weapons (Assault Rifles, SMGs, Pistols)
Hitscan weapons execute instantaneous raycasts on the frame the weapon is fired:
1. **Bloom & Cone of Fire**:
   - Weapons have a base spread angle (`spread` in radians).
   - Crouching reduces bloom by 35%.
   - Sprinting/jumping increases bloom by 80%.
   - First-Shot Accuracy (FSA): If the player stands still and has not fired for 0.4s, bloom drops to $0.0$.
2. **Raycast Verification**:
   - `_shotgunRaycaster.ray.origin` is set to camera eye level.
   - Forward direction is perturbed by random polar coordinates $(r \cos \theta, r \sin \theta)$ within the active bloom radius.
   - Evaluates intersection with world colliders, building pieces, enemy bots, and remote players.
3. **Headshot Detection**:
   - A hit evaluates height relative to target origin:
   ```typescript
   const isHeadshot = ray.origin.y + ray.direction.y * hitDist > target.y + 1.45;
   ```
   - Headshots apply weapon-specific multipliers (1.5x for ARs, 2.0x for SMGs/Pistols, 2.5x for Snipers).

### 2.2 Shotgun Pellet Distribution
Shotguns (Pump Shotgun, Tactical Shotgun) do not fire a single ray. They cast **10 fixed geometric pellets**:
- 1 dead-center pellet.
- 5 inner-ring pellets at radius $r_1$.
- 4 outer-ring pellets at radius $r_2$.
- Each pellet carries $1/10\text{th}$ of total base damage.
- Proximity bonus: If point-blank target is within 1-foot (0.3m) effective radius, a minimum baseline floor damage is applied.

### 2.3 Projectiles (Rocket Launchers, Sniper Rifles)
Projectiles have physical travel velocity, bullet drop, and travel times:
- Rocket: Velocity $45\text{ m/s}$, zero drop, explodes on first collision applying radial splash damage ($5.0\text{m}$ blast radius) and building destruction.
- Heavy Sniper: Velocity $220\text{ m/s}$, gravity acceleration $9.8\text{ m/s}^2$, tracer particle trail.

---

## 3. Building Engine (`src/game/fortniteBuilding.ts` & `src/game/fortniteEngineBuild.ts`)

The building system implements the standard 4-piece Fortnite building grid.

### 3.1 4x4 Meter Grid Snapping
```
        +---------------+---------------+
        |               |   WALL (N)    |
        |               |   z = 2.0     |
        |  FLOOR/ROOF   +---------------+
        |  y = 0 or 4   |   RAMP (35°)  |
        |               |   dy = 4, dz = 4
        +---------------+---------------+
```
- **Grid Coordinates**:
  ```typescript
  const gridX = Math.floor(player.x / 4.0) * 4.0 + 2.0;
  const gridZ = Math.floor(player.z / 4.0) * 4.0 + 2.0;
  const gridY = Math.floor(player.y / 4.0) * 4.0;
  ```
- **Rotation Snapping**: Camera yaw angle determines which cardinal wall is targeted (North, East, South, West in 90° increments).

### 3.2 Piece Types & Properties
| Piece Type | Primary Function | Max Health (Wood / Brick / Metal) |
| :--- | :--- | :--- |
| **Wall** | Vertical cover against direct fire | 150 / 300 / 500 HP |
| **Ramp (Stair)** | Vertical traversal & high-ground retake | 150 / 300 / 500 HP |
| **Floor** | Horizontal bridge & ceiling protection | 150 / 300 / 500 HP |
| **Cone (Roof)** | Pyramid roof, cone jumping & box-fight piece control | 150 / 300 / 500 HP |

### 3.3 Structural Integrity
Every piece must either:
1. Touch the terrain ($Y \le 0.1\text{m}$), OR
2. Be adjacent to another structurally sound piece.
When a supporting wall or base is destroyed, all connected floating pieces trigger structural collapse.

---

## 4. Bot Artificial Intelligence (`src/game/fortniteEngineBotAI.ts`)

The autonomous bot AI runs a multi-stage behavior state machine every frame.

### 4.1 State Hierarchy
- **`IDLE / PATROL`**: Wanders within regional bounding box or moves toward the safe storm circle center.
- **`INVESTIGATING`**: Moves toward gunshot audio cues within 50m radius.
- **`COMBAT_PURSUIT`**: Closes distance to target player, using cover and jump-peeks.
- **`DEFENSIVE_BOX`**: Triggers when receiving sudden damage $\ge 30\text{ HP}$; attempts to build an immediate protective wood wall facing the incoming damage angle.

### 4.2 Zero-Allocation Line-of-Sight Check
The bot tests visibility to the target using module-scoped scratch objects:
```typescript
const _losDir = new THREE.Vector3();
const _losRay = new THREE.Ray();
const _losBox = new THREE.Box3();
const _losIntersect = new THREE.Vector3();

function isLineOfSightBlocked(engine, fromPos, toPos): boolean {
  _losDir.copy(toPos).sub(fromPos);
  const dist = _losDir.length();
  _losDir.normalize();
  _losRay.set(fromPos, _losDir);

  // Query only nearby colliders along the ray path
  const candidates = engine.spatialGrid.queryNear(fromPos.x, fromPos.z, dist + 2);
  for (const col of candidates) {
    _losBox.min.set(col.minX, col.minY, col.minZ);
    _losBox.max.set(col.maxX, col.maxY, col.maxZ);
    if (_losRay.intersectBox(_losBox, _losIntersect)) {
      if (fromPos.distanceTo(_losIntersect) < dist - 0.5) return true;
    }
  }
  return false;
}
```

---

## 5. Combat Resolution & Damage Pipeline (`src/game/fortniteEngineCombatResolution.ts`)

When an attack lands:
1. **Shield Absorption**: Damage first subtracts from target `shield` (up to 100).
2. **Health Depletion**: Remaining damage subtracts from `health` (up to 100).
3. **Damage Number Float**: Spawns 3D screen-projected floating damage numbers:
   - Blue = Shield hit
   - White = Flesh hit
   - Yellow = Headshot hit
   - Red = Critical / Fatal hit
4. **Elimination & Loot Drop**:
   - If `health <= 0`, target enters eliminated state.
   - Target inventory drops at feet with physics scatter velocity.
   - Local player earns kill credit and updates match leaderboard.
