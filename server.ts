import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

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
  isReady: boolean;
  ws?: WebSocket;
  lastPing: number;
  transform?: any;
}

interface PartyRoom {
  code: string;
  hostId: string;
  createdAt: number;
  players: Map<string, PartyPlayer>;
  gameState: 'lobby' | 'playing';
  seed: number;
  events: RoomEvent[];
  eventSeq: number;
}

const rooms = new Map<string, PartyRoom>();

function ensureGlobalRoom() {
  if (!rooms.has('ROYALE-GLOBAL')) {
    rooms.set('ROYALE-GLOBAL', {
      code: 'ROYALE-GLOBAL',
      hostId: 'global_host',
      createdAt: Date.now(),
      players: new Map(),
      gameState: 'lobby',
      seed: 777123,
      events: [],
      eventSeq: 0,
    });
  }
}
ensureGlobalRoom();

function getPartyPayload(room: PartyRoom) {
  return {
    type: 'party:update',
    code: room.code,
    hostId: room.hostId,
    gameState: room.gameState,
    seed: room.seed,
    players: Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      skinId: p.skinId,
      level: p.level,
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
      room = {
        code: upperCode,
        hostId: 'host',
        createdAt: Date.now(),
        players: new Map(),
        gameState: 'lobby',
        seed: Math.floor(Math.random() * 1000000),
        events: [],
        eventSeq: 0,
      };
      rooms.set(upperCode, room);
    }
    res.json(getPartyPayload(room));
  });

  // HTTP Join or Create Party
  app.post('/api/parties/join', (req, res) => {
    let { code, player } = req.body || {};
    let upperCode = (code || '').toUpperCase().trim();
    if (!upperCode) {
      upperCode = 'ROYALE-' + Math.floor(1000 + Math.random() * 9000).toString();
    }
    const playerId = player?.id || `p_${Date.now()}`;

    let room = rooms.get(upperCode);
    if (!room) {
      room = {
        code: upperCode,
        hostId: playerId,
        createdAt: Date.now(),
        players: new Map(),
        gameState: 'lobby',
        seed: Math.floor(Math.random() * 1000000),
        events: [],
        eventSeq: 0,
      };
      rooms.set(upperCode, room);
    }

    if (room.players.size === 0) {
      room.hostId = playerId;
    }

    const partyPlayer: PartyPlayer = {
      id: playerId,
      name: player?.name || 'Player',
      skinId: player?.skinId || 'jonesy',
      level: player?.level || 1,
      isReady: true,
      lastPing: Date.now(),
    };

    room.players.set(playerId, partyPlayer);
    publishRoomEvent(room, 'party:update', getPartyPayload(room));

    res.json({
      success: true,
      code: room.code,
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
      room = {
        code: upperCode,
        hostId: playerId || `p_${Date.now()}`,
        createdAt: Date.now(),
        players: new Map(),
        gameState: 'lobby',
        seed: Math.floor(Math.random() * 1000000),
        events: [],
        eventSeq: 0,
      };
      rooms.set(upperCode, room);
    }

    if (playerId && room.players.has(playerId)) {
      const p = room.players.get(playerId)!;
      p.lastPing = Date.now();
      if (transform) {
        p.transform = transform;
        // broadcast transform to ws players
        broadcastToRoom(room, { type: 'player:sync', playerId, data: transform });
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

  // HTTP Action endpoint (shoot, damage, elim, chat)
  app.post('/api/parties/action', (req, res) => {
    const { code, playerId, action } = req.body || {};
    if (!code || !action) return res.status(400).json({ error: 'Missing code or action' });
    const upperCode = code.toUpperCase();
    let room = rooms.get(upperCode);
    if (!room) {
      room = {
        code: upperCode,
        hostId: playerId || `p_${Date.now()}`,
        createdAt: Date.now(),
        players: new Map(),
        gameState: 'lobby',
        seed: Math.floor(Math.random() * 1000000),
        events: [],
        eventSeq: 0,
      };
      rooms.set(upperCode, room);
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
      room = {
        code: upperCode,
        hostId: 'host',
        createdAt: Date.now(),
        players: new Map(),
        gameState: 'lobby',
        seed: Math.floor(Math.random() * 1000000),
        events: [],
        eventSeq: 0,
      };
      rooms.set(upperCode, room);
    }

    room.gameState = 'playing';
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

            let room = rooms.get(upperCode);
            if (!room) {
              room = {
                code: upperCode,
                hostId: playerId,
                createdAt: Date.now(),
                players: new Map(),
                gameState: 'lobby',
                seed: Math.floor(Math.random() * 1000000),
                events: [],
                eventSeq: 0,
              };
              rooms.set(upperCode, room);
            }

            // If room had 0 players, make this player host
            if (room.players.size === 0) {
              room.hostId = playerId;
            }

            const player: PartyPlayer = {
              id: playerId,
              name: msg.player?.name || 'Player',
              skinId: msg.player?.skinId || 'jonesy',
              level: msg.player?.level || 1,
              isReady: true,
              ws,
              lastPing: Date.now(),
            };

            room.players.set(playerId, player);
            currentRoomCode = upperCode;
            currentPlayerId = playerId;

            // Send confirmation to joining player
            ws.send(
              JSON.stringify({
                type: 'party:joined',
                room: getPartyPayload(room),
                playerId,
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

            const player = room.players.get(currentPlayerId);
            if (player) {
              player.lastPing = Date.now();
              player.transform = msg.data;
            }

            broadcastToRoom(
              room,
              {
                type: 'player:sync',
                playerId: currentPlayerId,
                senderId: currentPlayerId,
                data: msg.data,
              },
              ws
            );
            break;
          }

          case 'player:action': {
            if (!currentRoomCode || !currentPlayerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            publishRoomEvent(
              room,
              'player:action',
              { action: msg.action },
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
