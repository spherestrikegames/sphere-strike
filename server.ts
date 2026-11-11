import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  Authoritative2v2Room,
  AuthoritativePlayer,
  assignBalancedTeam,
  validatePlayerTransform,
  processAuthoritativeDamage,
  validateBuildingPlacement,
} from './src/game/matchmaking2v2Validator';
import { TeamType } from './src/types';

interface RoomEvent {
  id: number;
  type: string;
  senderId?: string;
  payload: any;
  timestamp: number;
}

interface PartyPlayer {
  id: string;
  name: string;
  skinId: string;
  level: number;
  team: TeamType;
  health: number;
  shield: number;
  isAlive: boolean;
  eliminations: number;
  isReady: boolean;
  ws?: WebSocket;
  lastPing: number;
  transform?: any;
}

interface PartyRoom {
  code: string;
  mode: '2v2' | 'battle_royale' | 'custom';
  maxPlayers: number;
  hostId: string;
  createdAt: number;
  players: Map<string, PartyPlayer>;
  gameState: 'lobby' | 'playing';
  seed: number;
  events: RoomEvent[];
  eventSeq: number;
  authState: Authoritative2v2Room;
}

const rooms = new Map<string, PartyRoom>();

function createRoomInstance(code: string, hostId: string, mode: '2v2' | 'battle_royale' | 'custom' = 'battle_royale', maxPlayers: number = 16): PartyRoom {
  const seed = Math.floor(Math.random() * 1000000);
  return {
    code,
    mode,
    maxPlayers,
    hostId,
    createdAt: Date.now(),
    players: new Map(),
    gameState: 'lobby',
    seed,
    events: [],
    eventSeq: 0,
    authState: {
      code,
      mode,
      maxPlayers,
      hostId,
      gameState: 'lobby',
      seed,
      countdownSeconds: 3,
      winningTeam: null,
      players: new Map<string, AuthoritativePlayer>(),
      builds: new Map(),
    },
  };
}

function ensureGlobalRoom() {
  if (!rooms.has('ROYALE-GLOBAL')) {
    rooms.set('ROYALE-GLOBAL', createRoomInstance('ROYALE-GLOBAL', 'global_host', 'battle_royale', 16));
  }
}
ensureGlobalRoom();

function getPartyPayload(room: PartyRoom) {
  return {
    type: 'party:update',
    code: room.code,
    mode: room.mode,
    maxPlayers: room.maxPlayers,
    hostId: room.hostId,
    gameState: room.gameState,
    seed: room.seed,
    players: Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      skinId: p.skinId,
      level: p.level,
      team: p.team,
      health: p.health,
      shield: p.shield,
      isAlive: p.isAlive,
      eliminations: p.eliminations,
      isReady: p.isReady,
      isHost: p.id === room.hostId,
      transform: p.transform,
    })),
  };
}

function broadcastToRoom(room: PartyRoom, message: object, excludeWs?: WebSocket) {
  const data = JSON.stringify(message);
  room.players.forEach((player) => {
    if (player.ws && player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
      try {
        player.ws.send(data);
      } catch (err) {
        console.warn('Failed to send ws payload:', err);
      }
    }
  });
}

function publishRoomEvent(room: PartyRoom, type: string, payload: any, senderId?: string, excludeWs?: WebSocket): RoomEvent {
  const eventId = ++room.eventSeq;
  const evt: RoomEvent = {
    id: eventId,
    type,
    senderId,
    payload,
    timestamp: Date.now(),
  };

  room.events.push(evt);
  if (room.events.length > 150) {
    room.events.shift();
  }

  broadcastToRoom(room, { type, eventId, senderId, playerId: senderId, ...payload }, excludeWs);
  return evt;
}

function cleanupStalePlayers() {
  const now = Date.now();
  ensureGlobalRoom();
  for (const [code, room] of rooms.entries()) {
    for (const [playerId, player] of room.players.entries()) {
      const isWsOpen = player.ws && player.ws.readyState === WebSocket.OPEN;
      if (!isWsOpen && now - player.lastPing > 25000) {
        room.players.delete(playerId);
        publishRoomEvent(room, 'player:leave', { playerId, senderId: playerId });
        if (room.hostId === playerId && room.players.size > 0) {
          const nextHost = room.players.keys().next().value;
          if (nextHost) room.hostId = nextHost;
        }
        publishRoomEvent(room, 'party:update', getPartyPayload(room));
      }
    }
    if (code !== 'ROYALE-GLOBAL' && room.players.size === 0 && now - room.createdAt > 300000) {
      rooms.delete(code);
    }
  }
}

setInterval(cleanupStalePlayers, 10000);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    ensureGlobalRoom();
    res.json({ status: 'ok', partiesCount: rooms.size, timestamp: Date.now() });
  });

  app.get('/api/parties/public', (req, res) => {
    ensureGlobalRoom();
    const list = Array.from(rooms.values())
      .filter((r) => r.players.size < 16)
      .map((r) => ({
        code: r.code,
        playerCount: r.players.size,
        gameState: r.gameState,
        isGlobal: r.code === 'ROYALE-GLOBAL',
      }))
      .sort((a, b) => (b.isGlobal ? 1 : 0) - (a.isGlobal ? 1 : 0) || b.playerCount - a.playerCount);
    res.json({ rooms: list });
  });

  app.get('/api/parties/:code', (req, res) => {
    const upperCode = req.params.code.toUpperCase();
    let room = rooms.get(upperCode);
    if (!room) {
      room = createRoomInstance(upperCode, 'host');
      rooms.set(upperCode, room);
    }
    res.json(getPartyPayload(room));
  });

  // Dedicated 4-Player 2v2 Matchmaking Queue Endpoint (2 Teams of 2: ALPHA vs OMEGA)
  app.post('/api/matchmaking/2v2', (req, res) => {
    const { player } = req.body || {};
    const playerId = player?.id || `p_${Date.now()}`;

    // Reuse this player's current queue room before looking for a new open room.
    let targetRoom: PartyRoom | undefined = Array.from(rooms.values()).find(
      (r) => r.mode === '2v2' && r.gameState === 'lobby' && r.players.has(playerId)
    );
    if (!targetRoom) {
      for (const r of rooms.values()) {
        if (r.mode === '2v2' && r.players.size < 4 && r.gameState === 'lobby') {
          targetRoom = r;
          break;
        }
      }
    }

    if (!targetRoom) {
      const code = `2V2-${Math.floor(1000 + Math.random() * 9000)}`;
      targetRoom = createRoomInstance(code, playerId, '2v2', 4);
      rooms.set(code, targetRoom);
    }

    const existingPlayer = targetRoom.players.get(playerId);
    const assignedTeam = existingPlayer?.team || assignBalancedTeam(targetRoom.authState, player?.team);
    if (!assignedTeam) {
      return res.status(409).json({ success: false, error: 'This 2v2 room is full.' });
    }

    const partyPlayer: PartyPlayer = {
      id: playerId,
      name: player?.name || 'Player',
      skinId: player?.skinId || 'jonesy',
      level: player?.level || 1,
      team: assignedTeam,
      health: 250,
      shield: 100,
      isAlive: true,
      eliminations: 0,
      isReady: true,
      lastPing: Date.now(),
    };

    targetRoom.players.set(playerId, partyPlayer);
    targetRoom.authState.players.set(playerId, {
      id: playerId,
      name: partyPlayer.name,
      skinId: partyPlayer.skinId,
      level: partyPlayer.level,
      team: assignedTeam,
      isReady: true,
      health: 250,
      shield: 100,
      isAlive: true,
      eliminations: 0,
      x: assignedTeam === 'ALPHA' ? -24 : 24,
      y: 1,
      z: 0,
      rotY: 0,
      lastUpdateMs: Date.now(),
    });

    publishRoomEvent(targetRoom, 'party:update', getPartyPayload(targetRoom));

    res.json({
      success: true,
      code: targetRoom.code,
      team: assignedTeam,
      seed: targetRoom.seed,
      playerId,
      room: getPartyPayload(targetRoom),
    });
  });

  // HTTP Join or Create Party
  app.post('/api/parties/join', (req, res) => {
    let { code, player } = req.body || {};
    let upperCode = (code || '').toUpperCase().trim();
    if (!upperCode) {
      upperCode = 'ROYALE-' + Math.floor(1000 + Math.random() * 9000).toString();
    }
    const playerId = player?.id || `p_${Date.now()}`;
    const is2v2Code = upperCode.startsWith('2V2-') || upperCode.includes('2V2');

    let room = rooms.get(upperCode);
    if (!room) {
      room = createRoomInstance(upperCode, playerId, is2v2Code ? '2v2' : 'battle_royale', is2v2Code ? 4 : 16);
      rooms.set(upperCode, room);
    }

    const existingPlayer = room.players.get(playerId);
    if (!existingPlayer && room.players.size >= room.maxPlayers) {
      return res.status(409).json({ success: false, error: 'This room is full.' });
    }

    if (room.players.size === 0) {
      room.hostId = playerId;
    }

    const assignedTeam = existingPlayer?.team || assignBalancedTeam(room.authState, player?.team);
    if (!assignedTeam) {
      return res.status(409).json({ success: false, error: 'No team slots are available in this room.' });
    }

    const partyPlayer: PartyPlayer = {
      id: playerId,
      name: player?.name || 'Player',
      skinId: player?.skinId || 'jonesy',
      level: player?.level || 1,
      team: assignedTeam,
      health: 250,
      shield: 100,
      isAlive: true,
      eliminations: 0,
      isReady: true,
      lastPing: Date.now(),
    };

    room.players.set(playerId, partyPlayer);
    room.authState.players.set(playerId, {
      id: playerId,
      name: partyPlayer.name,
      skinId: partyPlayer.skinId,
      level: partyPlayer.level,
      team: assignedTeam,
      isReady: true,
      health: 250,
      shield: 100,
      isAlive: true,
      eliminations: 0,
      x: 0,
      y: 1,
      z: 0,
      rotY: 0,
      lastUpdateMs: Date.now(),
    });
    publishRoomEvent(room, 'party:update', getPartyPayload(room));

    res.json({
      success: true,
      code: room.code,
      team: assignedTeam,
      seed: room.seed,
      playerId,
      room: getPartyPayload(room),
      lastEventId: room.eventSeq,
    });
  });

  // HTTP Sync & Poll endpoint (for updates, movement, and events)
  app.post('/api/parties/poll', (req, res) => {
    const { code, playerId, sinceEventId = 0, transform } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Missing code' });
    const upperCode = code.toUpperCase();
    let room = rooms.get(upperCode);
    if (!room) {
      room = createRoomInstance(upperCode, playerId || `p_${Date.now()}`);
      rooms.set(upperCode, room);
    }

    if (playerId && room.players.has(playerId)) {
      const p = room.players.get(playerId)!;
      p.lastPing = Date.now();
      if (transform) {
        const checked = validatePlayerTransform(transform);
        if (checked.valid) {
          p.transform = { ...transform, x: checked.x, y: checked.y, z: checked.z, rotY: checked.rotY };
          broadcastToRoom(room, { type: 'player:sync', playerId, data: p.transform });
        }
      }
    }

    const newEvents = room.events.filter((e) => e.id > sinceEventId && e.senderId !== playerId);
    res.json({
      room: getPartyPayload(room),
      events: newEvents,
      lastEventId: room.eventSeq,
      gameState: room.gameState,
      seed: room.seed,
    });
  });

  // HTTP Action endpoint (shoot, damage, elim, build, chat) with authoritative server validation
  app.post('/api/parties/action', (req, res) => {
    const { code, playerId, action } = req.body || {};
    if (!code || !action) return res.status(400).json({ error: 'Missing code or action' });
    const upperCode = code.toUpperCase();
    let room = rooms.get(upperCode);
    if (!room) {
      room = createRoomInstance(upperCode, playerId || `p_${Date.now()}`);
      rooms.set(upperCode, room);
    }

    if (action.type === 'damage' && playerId && action.targetId) {
      const dmgRes = processAuthoritativeDamage(
        room.authState,
        playerId,
        action.targetId,
        action.damage,
        action.isHeadshot,
        action.weaponName
      );
      if (!dmgRes.accepted) {
        return res.json({ success: false, reason: dmgRes.reason });
      }
      action.damage = dmgRes.appliedDamage;
      action.targetHealth = dmgRes.targetHealth;
      action.targetShield = dmgRes.targetShield;
      action.eliminated = dmgRes.eliminated;
      action.winningTeam = dmgRes.winningTeam;
    } else if (action.type === 'build' && playerId && action.piece) {
      const buildRes = validateBuildingPlacement(room.authState, playerId, action.piece);
      if (!buildRes.accepted) {
        return res.json({ success: false, reason: buildRes.reason });
      }
    }

    const evt = publishRoomEvent(room, 'player:action', { action }, playerId);
    res.json({ success: true, eventId: evt.id });
  });

  // HTTP Start Match endpoint
  app.post('/api/parties/start', (req, res) => {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Missing code' });
    const upperCode = code.toUpperCase();
    let room = rooms.get(upperCode);
    if (!room) {
      room = createRoomInstance(upperCode, 'host');
      rooms.set(upperCode, room);
    }

    room.gameState = 'playing';
    room.authState.gameState = 'playing';
    if (!room.seed) room.seed = Math.floor(Math.random() * 1000000);

    publishRoomEvent(room, 'match:start', { seed: room.seed, roomCode: room.code });
    res.json({ success: true, seed: room.seed, roomCode: room.code });
  });

  // HTTP Leave Party
  app.post('/api/parties/leave', (req, res) => {
    const { code, playerId } = req.body || {};
    if (!code || !playerId) return res.json({ success: true });
    const room = rooms.get(code.toUpperCase());
    if (room) {
      room.players.delete(playerId);
      room.authState.players.delete(playerId);
      publishRoomEvent(room, 'player:leave', { playerId });
      if (room.hostId === playerId && room.players.size > 0) {
        const nextHost = room.players.keys().next().value;
        if (nextHost) room.hostId = nextHost;
      }
      publishRoomEvent(room, 'party:update', getPartyPayload(room));
    }
    res.json({ success: true });
  });

  // WebSocket Server setup
  const wss = new WebSocketServer({ server, path: '/ws' });

  const wsKeepalive = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.ping();
        } catch {}
      }
    });
  }, 12000);

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomCode: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong', time: msg.time || Date.now() }));
            break;
          }

          case 'party:connect':
          case 'party:join':
          case 'party:create': {
            let upperCode = (msg.code || '').toUpperCase().trim();
            if (!upperCode) {
              upperCode = 'ROYALE-' + Math.floor(1000 + Math.random() * 9000).toString();
            }
            const playerId = msg.player?.id || `p_${Date.now()}`;
            const is2v2Code = upperCode.startsWith('2V2-') || upperCode.includes('2V2');

            let room = rooms.get(upperCode);
            if (!room) {
              room = createRoomInstance(upperCode, playerId, is2v2Code ? '2v2' : 'battle_royale', is2v2Code ? 4 : 16);
              rooms.set(upperCode, room);
            }

            // If room had 0 players, make this player host
            if (room.players.size === 0) {
              room.hostId = playerId;
            }

            const assignedTeam = room.players.get(playerId)?.team || assignBalancedTeam(room.authState, msg.player?.team);
            const player: PartyPlayer = {
              id: playerId,
              name: msg.player?.name || 'Player',
              skinId: msg.player?.skinId || 'jonesy',
              level: msg.player?.level || 1,
              team: assignedTeam,
              health: 250,
              shield: 100,
              isAlive: true,
              eliminations: 0,
              isReady: true,
              ws,
              lastPing: Date.now(),
            };

            room.players.set(playerId, player);
            room.authState.players.set(playerId, {
              id: playerId,
              name: player.name,
              skinId: player.skinId,
              level: player.level,
              team: assignedTeam,
              isReady: true,
              health: 250,
              shield: 100,
              isAlive: true,
              eliminations: 0,
              x: 0,
              y: 1,
              z: 0,
              rotY: 0,
              lastUpdateMs: Date.now(),
            });
            currentRoomCode = upperCode;
            currentPlayerId = playerId;

            // Send confirmation to joining player
            ws.send(
              JSON.stringify({
                type: 'party:joined',
                room: getPartyPayload(room),
                playerId,
                team: assignedTeam,
                seed: room.seed,
              })
            );

            // If match is already playing, immediately drop joining player into the match
            if (room.gameState === 'playing') {
              ws.send(
                JSON.stringify({
                  type: 'match:start',
                  seed: room.seed,
                  roomCode: room.code,
                })
              );
            }

            // Notify everyone else in the room
            publishRoomEvent(room, 'party:update', getPartyPayload(room), playerId, ws);
            break;
          }

          case 'party:ready': {
            if (!currentRoomCode || !currentPlayerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;
            const player = room.players.get(currentPlayerId);
            if (!player) return;

            player.isReady = !!msg.isReady;
            publishRoomEvent(room, 'party:update', getPartyPayload(room));
            break;
          }

          case 'match:start': {
            if (!currentRoomCode || !currentPlayerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            room.gameState = 'playing';
            if (!room.seed) {
              room.seed = Math.floor(Math.random() * 1000000);
            }

            publishRoomEvent(room, 'match:start', {
              seed: room.seed,
              roomCode: room.code,
              mode: msg.mode,
              map: msg.map,
            });
            break;
          }

          case 'match:end':
          case 'party:return_lobby': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;
            room.gameState = 'lobby';
            publishRoomEvent(room, 'party:update', getPartyPayload(room));
            break;
          }

          // Real-time In-game sync (position, action, building, shoot)
          case 'player:sync': {
            if (!currentRoomCode || !currentPlayerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            const checked = validatePlayerTransform(msg.data);
            if (!checked.valid) return;

            const sanitizedData = { ...msg.data, x: checked.x, y: checked.y, z: checked.z, rotY: checked.rotY };
            const player = room.players.get(currentPlayerId);
            if (player) {
              player.lastPing = Date.now();
              player.transform = sanitizedData;
            }
            const authP = room.authState.players.get(currentPlayerId);
            if (authP) {
              authP.x = checked.x;
              authP.y = checked.y;
              authP.z = checked.z;
              authP.rotY = checked.rotY;
              authP.lastUpdateMs = Date.now();
            }

            broadcastToRoom(
              room,
              {
                type: 'player:sync',
                playerId: currentPlayerId,
                senderId: currentPlayerId,
                data: sanitizedData,
              },
              ws
            );
            break;
          }

          case 'player:action': {
            if (!currentRoomCode || !currentPlayerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room || !msg.action) return;

            const action = msg.action;
            if (action.type === 'damage' && action.targetId) {
              const dmgRes = processAuthoritativeDamage(
                room.authState,
                currentPlayerId,
                action.targetId,
                action.damage,
                action.isHeadshot,
                action.weaponName
              );
              if (!dmgRes.accepted) return;
              action.damage = dmgRes.appliedDamage;
              action.targetHealth = dmgRes.targetHealth;
              action.targetShield = dmgRes.targetShield;
              action.eliminated = dmgRes.eliminated;
              action.winningTeam = dmgRes.winningTeam;
            } else if (action.type === 'build' && action.piece) {
              const buildRes = validateBuildingPlacement(room.authState, currentPlayerId, action.piece);
              if (!buildRes.accepted) return;
            }

            publishRoomEvent(
              room,
              'player:action',
              { action },
              currentPlayerId,
              ws
            );
            break;
          }

          case 'party:chat': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            publishRoomEvent(room, 'party:chat', {
              sender: msg.sender || 'Player',
              text: msg.text,
              time: Date.now(),
            });
            break;
          }
        }
      } catch (err) {
        console.error('WS message error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomCode && currentPlayerId) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.players.delete(currentPlayerId);
          room.authState.players.delete(currentPlayerId);
          publishRoomEvent(room, 'player:leave', { playerId: currentPlayerId, senderId: currentPlayerId });
          if (room.players.size === 0 && currentRoomCode !== 'ROYALE-GLOBAL') {
            rooms.delete(currentRoomCode);
          } else {
            if (room.hostId === currentPlayerId) {
              const nextHost = room.players.keys().next().value;
              if (nextHost) room.hostId = nextHost;
            }
            publishRoomEvent(room, 'party:update', getPartyPayload(room));
          }
        }
      }
    });
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Fortnite Royale Server running on http://localhost:${PORT}`);
  });
}

startServer();
