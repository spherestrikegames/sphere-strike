import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: Number(PORT) });

// In-memory room tracking connected players
const players = new Map();

wss.on('connection', (ws) => {
  const playerId = randomUUID();

  // Initialize new player state
  const player = {
    id: playerId,
    x: 0,
    y: 0,
    z: 0,
    rotationY: 0,
    ws,
  };
  players.set(playerId, player);

  // Send initial join confirmation with assigned ID
  ws.send(JSON.stringify({ type: 'joined', id: playerId }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'move') {
        const p = players.get(playerId);
        if (p) {
          if (typeof msg.x === 'number') p.x = msg.x;
          if (typeof msg.y === 'number') p.y = msg.y;
          if (typeof msg.z === 'number') p.z = msg.z;
          if (typeof msg.rotationY === 'number') p.rotationY = msg.rotationY;
        }
      }
    } catch (err) {
      console.error('Invalid message received:', err.message);
    }
  });

  // Handle disconnect
  ws.on('close', () => {
    players.delete(playerId);
    broadcast(JSON.stringify({ type: 'player_disconnected', id: playerId }));
  });

  ws.on('error', (err) => {
    console.error(`Socket error for player ${playerId}:`, err.message);
  });
});

// Helper to broadcast to all active clients
function broadcast(payload) {
  for (const { ws } of players.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// 20-tick/sec loop (every 50ms) broadcasting current player positions
setInterval(() => {
  if (players.size === 0) return;

  const snapshot = Array.from(players.values()).map(({ id, x, y, z, rotationY }) => ({
    id,
    x,
    y,
    z,
    rotationY,
  }));

  broadcast(JSON.stringify({ type: 'state_update', players: snapshot }));
}, 50);

console.log(`WebSocket server running on port ${PORT} (20 ticks/sec)`);
