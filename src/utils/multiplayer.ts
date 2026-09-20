import { PartyMember, PartyState, RemotePlayerState } from '../types';

export type MultiplayerEventHandler = {
  onPartyUpdate?: (party: PartyState) => void;
  onMatchStart?: (seed: number, roomCode: string, mode?: string, map?: string) => void;
  onPlayerSync?: (playerId: string, data: Partial<RemotePlayerState>) => void;
  onPlayerAction?: (playerId: string, action: any) => void;
  onPlayerLeave?: (playerId: string) => void;
  onChatMessage?: (sender: string, text: string, time: number) => void;
  onError?: (msg: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  onPingUpdate?: (pingMs: number) => void;
};

function generateInitialCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ROYALE-${rand}`;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private handlers: MultiplayerEventHandler = {};
  public myPlayerId: string = `p_${Math.floor(1000 + Math.random() * 9000)}`;

  public partyState: PartyState;

  public transport: 'ws' | 'http' | 'mesh' = 'http';
  public pingMs: number = 24;
  private pollTimer: any = null;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private lastEventId: number = 0;
  private channel: BroadcastChannel | null = null;
  private isGameRunning: boolean = false;
  private pendingSyncData: Partial<RemotePlayerState> | null = null;
  private activePlayerInfo = {
    name: 'Player',
    skinId: 'jonesy',
    level: 1,
  };

  constructor(handlers: MultiplayerEventHandler = {}) {
    this.handlers = handlers;
    this.myPlayerId = `p_${Math.floor(1000 + Math.random() * 9000)}`;

    const initialCode = generateInitialCode();
    this.partyState = {
      code: initialCode,
      isHost: true,
      members: [
        {
          id: this.myPlayerId,
          name: 'Player',
          skinId: 'jonesy',
          level: 1,
          isReady: true,
          isHost: true,
        },
      ],
      isConnected: true,
      error: null,
    };

    // Cross-tab / local mesh broadcast
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('fortnite_royale_network');
        this.channel.onmessage = (event) => {
          if (!event.data) return;
          const { type, senderId, ...rest } = event.data;
          if (senderId === this.myPlayerId) return;
          this.handleIncomingEvent(type, rest, senderId);
        };
      } catch (e) {
        console.warn('BroadcastChannel not available', e);
      }
    }

    // Auto-connect and join initial room
    this.connect();
    this.startPollingLoop();
  }

  public setHandlers(handlers: MultiplayerEventHandler) {
    this.handlers = { ...this.handlers, ...handlers };
    // Deliver immediate state to caller
    if (this.handlers.onPartyUpdate) {
      this.handlers.onPartyUpdate(this.partyState);
    }
    if (this.handlers.onConnectionChange) {
      this.handlers.onConnectionChange(true);
    }
    if (this.handlers.onPingUpdate) {
      this.handlers.onPingUpdate(this.pingMs);
    }
  }

  public setGameRunning(running: boolean) {
    this.isGameRunning = running;
    this.startPollingLoop();
  }

  public generateNewCode(playerInfo?: { name: string; skinId: string; level: number }): string {
    const newCode = generateInitialCode();
    if (playerInfo) {
      this.connectWithCode(newCode, playerInfo);
    } else {
      this.connectWithCode(newCode, this.activePlayerInfo);
    }
    return newCode;
  }

  public getShareableLink(code?: string): string {
    if (typeof window === 'undefined') return '';
    const targetCode = (code || this.partyState.code || '').trim().toUpperCase();
    const url = new URL(window.location.href);
    url.searchParams.set('room', targetCode);
    return url.toString();
  }

  public async fetchPublicRooms(): Promise<Array<{ code: string; playerCount: number; gameState: string; isGlobal?: boolean }>> {
    try {
      const res = await fetch('/api/parties/public', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.rooms) ? data.rooms : [];
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Connects to online matchmaking via HTTP & WebSocket
   */
  public async connect(): Promise<boolean> {
    this.partyState.isConnected = true;
    this.partyState.error = null;

    if (this.handlers.onConnectionChange) {
      this.handlers.onConnectionChange(true);
    }

    // Background probe HTTP API
    try {
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        this.partyState.isConnected = true;
        this.handlers.onConnectionChange?.(true);
      }
    } catch {
      this.transport = 'mesh';
    }

    // Background WebSocket attempt
    if (typeof window !== 'undefined') {
      this.tryWebSocket();
    }

    // Register active room with server
    if (this.partyState.code) {
      this.registerRoomWithServer(this.partyState.code);
    }

    return true;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (typeof window !== 'undefined') {
        this.tryWebSocket();
      }
    }, 2500);
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping', time: Date.now() }));
        } catch {
          // ignore
        }
      }
    }, 6000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private tryWebSocket() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        this.ws = socket;
        this.transport = 'ws';
        this.partyState.isConnected = true;
        this.partyState.error = null;
        this.handlers.onConnectionChange?.(true);
        this.startHeartbeat();

        if (this.partyState.code) {
          socket.send(
            JSON.stringify({
              type: 'party:connect',
              code: this.partyState.code,
              player: {
                id: this.myPlayerId,
                ...this.activePlayerInfo,
              },
            })
          );
        }
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'pong') {
            if (msg.time) {
              this.pingMs = Math.max(1, Math.round(Date.now() - msg.time));
              this.handlers.onPingUpdate?.(this.pingMs);
            }
            return;
          }
          this.handleMessage(msg);
        } catch (e) {
          console.error('Multiplayer WS parse error', e);
        }
      };

      socket.onerror = () => {
        this.transport = 'http';
        this.ws = null;
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      socket.onclose = () => {
        this.transport = 'http';
        this.ws = null;
        this.stopHeartbeat();
        this.scheduleReconnect();
      };
    } catch {
      this.transport = 'http';
      this.ws = null;
      this.stopHeartbeat();
      this.scheduleReconnect();
    }
  }

  private startPollingLoop() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }

    const interval = this.isGameRunning ? 90 : 600;

    this.pollTimer = setInterval(() => {
      this.pollHttpUpdates();
    }, interval);
  }

  private async pollHttpUpdates() {
    if (!this.partyState.code) return;

    try {
      const payload: any = {
        code: this.partyState.code,
        playerId: this.myPlayerId,
        sinceEventId: this.lastEventId,
      };

      if (this.pendingSyncData) {
        payload.transform = this.pendingSyncData;
        this.pendingSyncData = null;
      }

      const res = await fetch('/api/parties/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.room) {
        this.updatePartyFromPayload(data.room);
      }

      if (data.gameState === 'playing' && !this.isGameRunning) {
        this.handlers.onMatchStart?.(data.seed || 123456, data.room?.code || this.partyState.code);
      }

      if (data.lastEventId) {
        this.lastEventId = Math.max(this.lastEventId, data.lastEventId);
      }

      if (Array.isArray(data.events)) {
        for (const evt of data.events) {
          this.handleIncomingEvent(evt.type, evt.payload, evt.senderId);
        }
      }
    } catch {
      // Mesh/local fallback
    }
  }

  private async registerRoomWithServer(code: string) {
    try {
      const res = await fetch('/api/parties/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          player: { id: this.myPlayerId, ...this.activePlayerInfo },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.room) {
          this.updatePartyFromPayload(data.room);
        }
        if (data.lastEventId) {
          this.lastEventId = data.lastEventId;
        }
      }
    } catch {
      // Mesh fallback
    }
  }

  private updatePartyFromPayload(roomPayload: any) {
    const members: PartyMember[] = (roomPayload.players || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      skinId: p.skinId,
      level: p.level,
      isReady: p.isReady,
      isHost: p.id === roomPayload.hostId,
    }));

    if (!members.some((m) => m.id === this.myPlayerId)) {
      members.unshift({
        id: this.myPlayerId,
        name: this.activePlayerInfo.name,
        skinId: this.activePlayerInfo.skinId,
        level: this.activePlayerInfo.level,
        isReady: true,
        isHost: true,
      });
    }

    this.partyState = {
      code: roomPayload.code || this.partyState.code,
      isHost: roomPayload.hostId === this.myPlayerId || members.length <= 1,
      members,
      isConnected: true,
      error: null,
    };

    if (this.handlers.onPartyUpdate) {
      this.handlers.onPartyUpdate(this.partyState);
    }
  }

  private handleIncomingEvent(type: string, payload: any, senderId?: string) {
    if (senderId === this.myPlayerId) return;

    switch (type) {
      case 'match:start': {
        this.handlers.onMatchStart?.(payload.seed || 123456, payload.roomCode || this.partyState.code, payload.mode, payload.map);
        break;
      }

      case 'player:sync': {
        const pId = senderId || payload.playerId;
        if (pId && pId !== this.myPlayerId) {
          this.handlers.onPlayerSync?.(pId, payload.data || payload);
        }
        break;
      }

      case 'player:action': {
        const pId = senderId || payload.playerId;
        if (pId && pId !== this.myPlayerId) {
          this.handlers.onPlayerAction?.(pId, payload.action || payload);
        }
        break;
      }

      case 'player:leave': {
        const leftId = payload.playerId || senderId;
        if (leftId) {
          this.handlers.onPlayerLeave?.(leftId);
        }
        break;
      }

      case 'party:update': {
        if (payload) {
          this.updatePartyFromPayload(payload);
        }
        break;
      }

      case 'party:chat': {
        this.handlers.onChatMessage?.(payload.sender || 'Player', payload.text || '', payload.time || Date.now());
        break;
      }
    }
  }

  private handleMessage(msg: any) {
    switch (msg.type) {
      case 'party:joined': {
        this.myPlayerId = msg.playerId || this.myPlayerId;
        if (msg.room) {
          this.updatePartyFromPayload(msg.room);
        }
        break;
      }

      case 'party:update': {
        this.updatePartyFromPayload(msg);
        break;
      }

      case 'party:error': {
        this.partyState.error = msg.message;
        this.handlers.onError?.(msg.message);
        break;
      }

      case 'match:start': {
        this.handlers.onMatchStart?.(msg.seed, msg.roomCode || this.partyState.code, msg.mode, msg.map);
        break;
      }

      case 'player:sync': {
        const pId = msg.playerId || msg.senderId;
        if (pId && pId !== this.myPlayerId) {
          this.handlers.onPlayerSync?.(pId, msg.data);
        }
        break;
      }

      case 'player:action': {
        const pId = msg.playerId || msg.senderId;
        if (pId && pId !== this.myPlayerId) {
          this.handlers.onPlayerAction?.(pId, msg.action);
        }
        break;
      }

      case 'player:leave': {
        const pId = msg.playerId || msg.senderId;
        if (pId && pId !== this.myPlayerId) {
          this.handlers.onPlayerLeave?.(pId);
        }
        break;
      }

      case 'party:chat': {
        this.handlers.onChatMessage?.(msg.sender, msg.text, msg.time);
        break;
      }
    }
  }

  public async connectWithCode(code: string, playerInfo: { name: string; skinId: string; level: number }) {
    let cleanCode = (code || '').trim().toUpperCase();
    if (cleanCode && !cleanCode.startsWith('ROYALE-') && cleanCode.length <= 5 && /^[A-Z0-9]+$/.test(cleanCode)) {
      cleanCode = `ROYALE-${cleanCode}`;
    }
    if (!cleanCode) {
      cleanCode = generateInitialCode();
    }
    this.activePlayerInfo = { ...playerInfo };

    // Update local state immediately
    this.partyState.code = cleanCode;
    this.partyState.isConnected = true;
    this.partyState.error = null;

    if (!this.partyState.members.some((m) => m.id === this.myPlayerId)) {
      this.partyState.members = [
        {
          id: this.myPlayerId,
          name: playerInfo.name,
          skinId: playerInfo.skinId,
          level: playerInfo.level,
          isReady: true,
          isHost: true,
        },
      ];
    }
    this.handlers.onPartyUpdate?.(this.partyState);

    // Broadcast on local channel
    this.channel?.postMessage({
      type: 'party:join',
      senderId: this.myPlayerId,
      code: cleanCode,
      player: { id: this.myPlayerId, ...playerInfo },
    });

    // Send to WS if open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'party:connect',
          code: cleanCode,
          player: { id: this.myPlayerId, ...playerInfo },
        })
      );
    }

    // Always send HTTP Join
    await this.registerRoomWithServer(cleanCode);
    this.startPollingLoop();
  }

  public async quickMatch(playerInfo: { name: string; skinId: string; level: number }) {
    let targetCode = 'ROYALE-GLOBAL';

    try {
      const res = await fetch('/api/parties/public');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.rooms) && data.rooms.length > 0) {
          const activeRoom = data.rooms.find((r: any) => r.playerCount > 0 && r.playerCount < 16);
          if (activeRoom?.code) {
            targetCode = activeRoom.code;
          } else {
            targetCode = data.rooms[0].code || 'ROYALE-GLOBAL';
          }
        }
      }
    } catch {
      // use default
    }

    await this.connectWithCode(targetCode, playerInfo);
  }

  public async createParty(playerInfo: { name: string; skinId: string; level: number }, customCode?: string) {
    const code = customCode || generateInitialCode();
    await this.connectWithCode(code, playerInfo);
  }

  public async joinParty(code: string, playerInfo: { name: string; skinId: string; level: number }) {
    await this.connectWithCode(code, playerInfo);
  }

  public setReady(isReady: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'party:ready', isReady }));
    }
  }

  public startPartyMatch(mode?: string, map?: string) {
    const seed = Math.floor(Math.random() * 1000000);

    // Notify local channel
    this.channel?.postMessage({
      type: 'match:start',
      senderId: this.myPlayerId,
      seed,
      roomCode: this.partyState.code,
      mode,
      map,
    });

    // Notify WS
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'match:start', mode, map }));
    }

    // Notify HTTP backend
    if (this.partyState.code) {
      fetch('/api/parties/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: this.partyState.code, playerId: this.myPlayerId, mode, map }),
      }).catch(() => {});
    }

    this.handlers.onMatchStart?.(seed, this.partyState.code, mode, map);
  }

  public sendPlayerSync(data: Partial<RemotePlayerState>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'player:sync',
          data,
        })
      );
    } else {
      this.pendingSyncData = { ...this.pendingSyncData, ...data };
    }

    this.channel?.postMessage({
      type: 'player:sync',
      senderId: this.myPlayerId,
      data,
    });
  }

  public sendPlayerAction(action: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'player:action',
          action,
        })
      );
    }

    if (this.partyState.code) {
      fetch('/api/parties/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: this.partyState.code,
          playerId: this.myPlayerId,
          action,
        }),
      }).catch(() => {});
    }

    this.channel?.postMessage({
      type: 'player:action',
      senderId: this.myPlayerId,
      action,
    });
  }

  public sendPartyChat(text: string, sender: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'party:chat', text, sender }));
    }
    this.channel?.postMessage({
      type: 'party:chat',
      senderId: this.myPlayerId,
      text,
      sender,
    });
  }
}

export const multiplayerClient = new MultiplayerClient();
