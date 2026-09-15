import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface PartyPlayer {
  id: string;
  name: string;
  skinId: string;
  level: number;
  isReady: boolean;
  ws: WebSocket;
  lastPing: number;
}

interface PartyRoom {
  code: string;
  hostId: string;
  createdAt: number;
  players: Map<string, PartyPlayer>;
  gameState: 'lobby' | 'playing';
  seed?: number;
}

const rooms = new Map<string, PartyRoom>();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', partiesCount: rooms.size });
  });

  app.get('/api/parties/:code', (req, res) => {
    const room = rooms.get(req.params.code.toUpperCase());
    if (!room) {
      return res.status(404).json({ error: 'Party code not found' });
    }
    const playerList = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      skinId: p.skinId,
      level: p.level,
      isReady: p.isReady,
      isHost: p.id === room.hostId,
    }));
    res.json({
      code: room.code,
      hostId: room.hostId,
      gameState: room.gameState,
      players: playerList,
    });
  });

  // WebSocket Server setup
  const wss = new WebSocketServer({ server, path: '/ws' });

  function broadcastToRoom(room: PartyRoom, message: object, excludeWs?: WebSocket) {
    const data = JSON.stringify(message);
    room.players.forEach((player) => {
      if (player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(data);
      }
    });
  }

  function getPartyPayload(room: PartyRoom) {
    return {
      type: 'party:update',
      code: room.code,
      hostId: room.hostId,
      gameState: room.gameState,
      players: Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        skinId: p.skinId,
        level: p.level,
        isReady: p.isReady,
        isHost: p.id === room.hostId,
      })),
    };
  }

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomCode: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case 'party:connect':
          case 'party:join':
          case 'party:create': {
            let upperCode = (msg.code || '').toUpperCase().trim();
            if (!upperCode) {
              upperCode = 'ROYALE-' + Math.floor(1000 + Math.random() * 9000).toString();
            }
            const playerId = msg.player?.id || `p_${Date.now()}`;

            let room = rooms.get(upperCode);
            const isNewRoom = !room;

            if (!room) {
              room = {
                code: upperCode,
                hostId: playerId,
                createdAt: Date.now(),
                players: new Map(),
                gameState: 'lobby',
                seed: Math.floor(Math.random() * 1000000),
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
            broadcastToRoom(room, getPartyPayload(room), ws);
            break;
          }

          case 'party:ready': {
            if (!currentRoomCode || !currentPlayerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;
            const player = room.players.get(currentPlayerId);
            if (!player) return;

            player.isReady = !!msg.isReady;
            broadcastToRoom(room, getPartyPayload(room));
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

            broadcastToRoom(room, {
              type: 'match:start',
              seed: room.seed,
              roomCode: room.code,
            });
            break;
          }

          case 'match:end':
          case 'party:return_lobby': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;
            room.gameState = 'lobby';
            broadcastToRoom(room, getPartyPayload(room));
            break;
          }

          // Real-time In-game sync (position, action, building, shoot)
          case 'player:sync': {
            if (!currentRoomCode || !currentPlayerId) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            broadcastToRoom(
              room,
              {
                type: 'player:sync',
                playerId: currentPlayerId,
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

            broadcastToRoom(
              room,
              {
                type: 'player:action',
                playerId: currentPlayerId,
                action: msg.action,
              },
              ws
            );
            break;
          }

          case 'party:chat': {
            if (!currentRoomCode) return;
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            broadcastToRoom(room, {
              type: 'party:chat',
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
          // Broadcast player leave to others in game
          broadcastToRoom(room, {
            type: 'player:leave',
            playerId: currentPlayerId,
          });
          if (room.players.size === 0) {
            rooms.delete(currentRoomCode);
          } else {
            // If host left, assign next player
            if (room.hostId === currentPlayerId) {
              const nextHost = room.players.keys().next().value;
              if (nextHost) room.hostId = nextHost;
            }
            broadcastToRoom(room, getPartyPayload(room));
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
