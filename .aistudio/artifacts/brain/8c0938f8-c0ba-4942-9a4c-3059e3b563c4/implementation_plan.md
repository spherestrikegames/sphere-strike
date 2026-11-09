# Apple Liquid Glass Lobby & P2P Integration

Directly integrate the Apple Tinted Liquid Glass design system, P2P room controls, and PBR visual highlights into the pre-game Lobby so players immediately see and interact with the new interface upon opening the app.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed in Phase 1 that the Apple Liquid Glass theme and PeerJS P2P controls must be visible directly on the initial Lobby screen.

- **Confirmed Decision (Lobby UI Integration)**: Upgrade the main Lobby menu cards (party hub, playlist cards, top bar, avatar pedestal) with the deep obsidian/midnight translucent fill, 22px squircle corners, multi-stop specular gradient rim, and live PeerJS Host/Join controls.
- **Confirmed Decision (In-Game HUD Continuity)**: Maintain full parity between the Lobby and the in-game HUD so dropping into a match preserves the exact same visual identity, glossy liquid bars, and P2P connection status.

---

## 1. Overview & Core Concept

- **What It Does**: Transmutes the application's pre-game Lobby and in-game HUD into an authentic Apple Tinted Liquid Glass interface. Players immediately see midnight-tinted glass substrates with caustics, glossy gel vital meters, and a dedicated P2P multiplayer pill allowing 1-click room creation and joining via clean 5-character codes.
- **Target Audience**: Players wanting modern, ultra-clean spatial aesthetics and zero-install serverless matchmaking with friends.
- **Key Value**: Immediate visual feedback upon launch without having to guess or navigate into a match to see the changes.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Lobby Arrival**: The player opens the application and immediately sees the Apple Tinted Liquid Glass interface with a frosted midnight backing (`rgba(15, 18, 28, 0.65)`), 28px blur, and 22px squircles.
2. **P2P Room Hosting**: The player clicks "Host Room" on the glass top pill; a clean 5-character alphanumeric room code (e.g. `K9X2B`) is revealed with a 1-click copy action.
3. **P2P Room Joining**: A second player types or pastes the 5-character code into the glass input and clicks "Join"; status switches to emerald green `Connected to Peer!`.
4. **Dropping into Match**: Clicking "Ready Up (Play)" transitions seamlessly to the 3D game canvas where the Apple Liquid Glass HUD (dual glossy bars `#0a84ff` and `#30d158`, 5-slot tactical hotbar with caustic pulse, 360° bearing compass, and circular minimap) and PBR lighting take effect.

### Visual Identity & Theme
- **Substrates & Cards**: `backdrop-filter: blur(28px) saturate(190%)`, background `rgba(15, 18, 28, 0.65)`, border radius `22px`.
- **Specular Caustics**: Rim border `linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 60%, rgba(130,170,255,0.3) 100%)` with inset shadow `inset 0 1px 1.5px rgba(255,255,255,0.5)`.
- **Vitals & Highlights**: Electric blue (`#0a84ff`) for Shield and emerald green (`#30d158`) for Health, topped with specular gel sheen.
- **Typography**: Apple SF Pro Rounded hierarchy with high-contrast numerals and subtle drop shadows.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct Lobby Integration vs In-Game Only**
  - *Chosen Approach*: Surface the Liquid Glass theme and PeerJS controls immediately in `FortniteLobby.tsx` and `App.tsx`.
  - *Why*: Eliminates confusion where users thought changes were missing because they were on the lobby screen.
  - *Alternatives Considered*: Auto-starting the 3D match on page load was rejected because it removes playlist and skin selection.

- **Decision 2: Dual Multiplayer Architecture (PeerJS + WebSocket)**
  - *Chosen Approach*: Maintain serverless PeerJS for direct 1-to-1 P2P friend duels while keeping the global room browser for public lobbies.
  - *Why*: Gives players the choice of instant serverless room codes without breaking dedicated server modes.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                      App Container                     │
│               (Theme: Apple Liquid Glass)              │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│     FortniteLobby     │       │      FortniteHUD      │
│  - Liquid Glass Top   │       │  - Liquid Vitals Pod  │
│  - 5-Char P2P Pill    │       │  - 5-Slot Glass Grid  │
│  - Mode Glass Cards   │       │  - 360° Compass Bar   │
│  - Avatar Podium      │       │  - Glass Circular Map │
└───────────┬───────────┘       └───────────┬───────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
┌───────────────────────────────────────────────────────┐
│              PeerJS P2P Network Module                │
│   (5-Char Room Code, 20-tick Sync, Remote Lerp)       │
└───────────────────────────────────────────────────────┘
```

- **State Sync**: Local player transforms `{x, y, z, rotationY}` sent at 20 updates/sec via `p2pNetwork.ts`.
- **Render Loop**: `updateNetwork()` continuously lerps remote peer position to prevent jitter.
