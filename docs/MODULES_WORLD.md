# World Generation & Rendering Performance

This document describes the procedural island generation, landmark architecture, urban density of Mega City, and high-performance instanced rendering pipelines used across the 3D world.

---

## 1. Island Layout & Landmarks

The game world is a circular island roughly 1,200 meters in diameter surrounded by water and bounded by the storm circle:

```
                          [North Coast / Lighthouse]
                                      |
       [Pleasant Park]                |               [Retail Row]
       (Suburban homes & yards)       |           (Commercial strip malls)
                 \                    |                    /
                  \                   |                   /
                   \--- [Loot Lake & Central Island] ----/
                                      |
                                      |
                 /--------------------+-------------------\
                /                                          \
    [Box Fight Arena]                              [Mega City]
(Dedicated 1v1 grid box)                     (Dense skyscrapers, highways)
```

### Key Modules:
- `src/game/fortniteWorld.ts`: Master terrain builder, water plane, boundary ocean colliders, and landmark placement orchestrator.
- `src/game/fortniteWorldMegaCity.ts`: Commercial skyscrapers, plazas, neon billboards, street furniture, and alleyways.
- `src/game/fortniteWorldNeighborhoods.ts`: Two-story residential suburban houses, picket fences, garages, and trees.
- `src/game/fortniteWorldRoads.ts`: Two-lane highways, four-lane boulevards, bridges, and cross-island transit corridors.
- `src/game/fortniteWorldArena.ts`: Clean, optimized 3x3x2 wood/brick/metal box fight training facility.

---

## 2. Instanced Mesh Batching Architectures

To sustain 60 FPS in dense urban areas, the engine minimizes WebGL draw calls by grouping identical geometric instances into `THREE.InstancedMesh`.

### 2.1 Skyscraper Facade Window Batching (`fortniteWorldMegaCity.ts`)
A typical Mega City skyscraper consists of 12 floors with 28 windows per floor (~336 window panes per building $\times$ 4 skyscrapers = 1,344 meshes).
- **Before Instancing**: 1,344 individual scene graph nodes $\rightarrow$ 1,344 CPU-to-GPU draw calls per frame.
- **After Instancing**:
  - All illuminated windows are batched into a single `THREE.InstancedMesh`.
  - All dark/reflective windows are batched into a second `THREE.InstancedMesh`.
  - Transformed via `instancedMesh.setMatrixAt(index, matrix4)`.
  - **Result**: Reduced from >1,300 draw calls to **2 draw calls**.

```typescript
// Pattern: Pre-allocating transform matrix and setting instances
const dummy = new THREE.Object3D();
const windowMesh = new THREE.InstancedMesh(windowGeo, windowMat, totalWindows);

let idx = 0;
for (let f = 0; f < floors; f++) {
  for (let s = 0; s < sides; s++) {
    dummy.position.set(wx, wy, wz);
    dummy.rotation.set(0, rotY, 0);
    dummy.updateMatrix();
    windowMesh.setMatrixAt(idx++, dummy.matrix);
  }
}
windowMesh.instanceMatrix.needsUpdate = true;
scene.add(windowMesh);
```

### 2.2 Highway & Road Markings (`fortniteWorldRoads.ts`)
The island's primary arterial highway stretches over 800 meters, requiring hundreds of dashed white lane dividers and solid double-yellow centerlines.
- Divided into two `THREE.InstancedMesh` nodes (one yellow, one white).
- Completely eliminates geometry stitching artifacts and prevents z-fighting against the road asphalt plane via a $+0.02\text{m}$ Y-offset.

---

## 3. Lighting, Atmosphere & Skybox

- **Directional Sun**: Dynamic sun positioned at $(200, 350, 150)$ casting real-time orthographic depth shadows (`shadow.camera.near = 0.5`, `far = 700`, `bias = -0.0005`).
- **Hemisphere Ambient Light**: Soft sky/ground gradient (sky `#a0c8ff`, ground `#4a5a3a`, intensity `0.55`) ensuring shaded areas retain contrast and readability.
- **Exponential Distance Fog**: `THREE.FogExp2(0x8cb8ff, 0.0022)` matches the horizon color, smoothly occluding distant geometry beyond 450 meters and concealing chunk boundaries.
- **Storm Wall VFX**: Translucent cylindrical volumetric boundary mesh with animated UV scrolling, tinting the outside world purple and distorting visibility.

---

## 4. Visual Effects & Particles (`src/game/fortniteEngineFX.ts`)

All particle effects (muzzle flashes, bullet spark impacts, building destruction dust, shield break bursts) utilize a static particle pool:
- Particle limit: 250 active particles.
- Expired particles are recycled rather than deallocated.
- Points and sprites use additive blending (`THREE.AdditiveBlending`) with depth-write disabled to prevent sorting glitches.
