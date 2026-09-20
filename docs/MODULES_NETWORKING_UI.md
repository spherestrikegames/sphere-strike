# Networking Protocol & React UI Architecture

This document describes the client-server WebSocket packet specifications, multiplayer state replication, procedural Web Audio synthesis, and the React HUD interface.

---

## 1. Client-Server WebSocket Architecture (`server.ts` & `src/utils/multiplayer.ts`)

The engine features real-time multiplayer synchronization running on an Express + `ws` server listening on port 3000.

```
       [Client 1]                [Server: server.ts]               [Client 2]
           |                             |                             |
           |---- "join" (name, skin) --->|                             |
           |<--- "init" (world seed) ----|                             |
           |                             |<---- "join" (name, skin) ---|
           |<--- "player_joined" (ID:2) -|---- "player_joined" (ID:1) >|
           |                             |                             |
           |---- "player_update" ------->|                             |
           |     (x, y, z, rotY, anim)   |---- "remote_player_update"->|
           |                             |                             |
           |---- "build_place" --------->|                             |
           |     (type, mat, gx, gy, gz) |---- "build_place_broadcast">|
           |                             |                             |
           |---- "player_fire" --------->|                             |
           |     (weapon, origin, dir)   |---- "remote_player_fire" -->|
```

### 1.1 Packet Schema Reference

#### Client-to-Server Packets
| Packet Type | Key Fields | Description |
| :--- | :--- | :--- |
| `join` | `{ name: string, skin: string }` | Registers client and requests game session state. |
| `player_update` | `{ x, y, z, rotY, isGrounded, isSprinting, isCrouching, selectedSlot }` | High-frequency movement packet sent every tick if delta exceeds threshold ($0.05\text{m}$). |
| `player_fire` | `{ weaponId, origin: [x,y,z], dir: [dx,dy,dz] }` | Signals weapon discharge to broadcast tracer effects. |
| `build_place` | `{ id, type, material, x, y, z, rotY, health, maxHealth }` | Notifies server that a piece was placed. |
| `build_damage` | `{ id, damage }` | Broadcasts damage applied to a building piece. |
| `player_hit` | `{ targetId, damage, isHeadshot }` | Authoritative damage notification from attacker. |

#### Server-to-Client Packets
| Packet Type | Description |
| :--- | :--- |
| `init_state` | Synchronizes active players, existing placed buildings, storm center, and radius. |
| `remote_player_update` | Dispatches interpolated positional snapshots of peers to render remote character rigs. |
| `build_sync` | Instructs clients to add or remove building pieces from their local spatial grid and Three.js scene. |
| `storm_sync` | Synchronizes storm circle coordinates, target center, and current radius. |

---

## 2. Procedural Audio Synthesizer (`src/utils/audio.ts`)

To avoid external asset loading latencies, the game utilizes the browser's native **Web Audio API** to generate rich procedural sound effects.

### Sound Capabilities:
1. **Gunshots**:
   - Assault Rifle: Noise burst + lowpass envelope ($800\text{Hz} \rightarrow 80\text{Hz}$) + sub-bass punch ($60\text{Hz}$).
   - Shotgun: Multi-layered noise impact with resonant bandpass filter and heavy transient thump.
   - Sniper: High-frequency crack followed by long decaying reverb tail.
2. **Hit Confirmation**:
   - Shield Crack: High-frequency glass-like resonant sine pulse ($2200\text{Hz} \rightarrow 880\text{Hz}$).
   - Headshot "Ding": Bright metallic chime ($1500\text{Hz}$).
3. **Footsteps & Traversal**:
   - Modulated low-frequency noise tailored by surface (grass, wood, metal, concrete).
4. **Building Placement**:
   - Wood: Short, wooden percussion clack ($250\text{Hz} \rightarrow 100\text{Hz}$).
   - Brick: Heavy masonry thud.
   - Metal: Metallic clang with brief decay.

---

## 3. React UI & HUD Overlay (`src/components/`)

The React layer sits directly above the Three.js canvas in an absolute-positioned, pointer-events-pass-through layout (`pointer-events: none` on containers, `pointer-events: auto` on interactive buttons).

### Component Breakdown:
- **`FortniteHUD.tsx`**:
  - Health & Shield Bars: Dynamic segmented 100 HP + 100 Shield status displays.
  - Material Counters: Wood, Brick, Metal counts with icons.
  - 5-Slot Inventory Bar: Active weapon slot highlight, rarity color gradient, ammo count, and reload progress ring.
  - Building Selection Ring: Wall (Z), Floor (X), Ramp (C), Cone (V) with material toggle.
  - Mini-map & Compass: Cardinal direction indicators and storm safe zone vector.
  - Crosshair: Dynamic reticle that expands during bloom and flashes red on hit confirm.
- **`FortniteLobby.tsx`**:
  - Game mode selector (Battle Royale vs. Box Fight).
  - Character skin preview & locker selector.
  - Play button with matchmaking queue simulation.
- **`VictoryRoyaleScreen.tsx`** & **`EliminatedScreen.tsx`**:
  - Victory Royale slow-motion banner with match stats (eliminations, accuracy, damage dealt).
  - Spectate / Return to Lobby controls.
- **`FortniteSettings.tsx`**:
  - Mouse sensitivity slider, audio master/SFX volume controls, and graphics quality toggles (shadows, view distance).
