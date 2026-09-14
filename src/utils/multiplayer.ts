import { PartyMember, PartyState, RemotePlayerState } from '../types';

export type MultiplayerEventHandler = {
  onPartyUpdate?: (party: PartyState) => void;
  onMatchStart?: (seed: number, roomCode: string) => void;
  onPlayerSync?: (playerId: string, data: Partial<RemotePlayerState>) => void;
  onPlayerAction?: (playerId: string, action: any) => void;
  onChatMessage?: (sender: string, text: string, time: number) => void;
  onError?: (msg: string) => void;
};

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private handlers: MultiplayerEventHandler = {};
  public partyState: PartyState = {
    code: '',
    isHost: false,
    members: [],
    isConnected: false,
    error: null,
  };
  public myPlayerId: string = `p_${Math.floor(1000 + Math.random() * 9000)}`;

  constructor(handlers: MultiplayerEventHandler = {}) {
    this.handlers = handlers;
    this.myPlayerId = `p_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  public setHandlers(handlers: MultiplayerEventHandler) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.partyState.isConnected = true;
          this.partyState.error = null;
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this.handleMessage(msg);
          } catch (e) {
            console.error('Multiplayer msg parse error', e);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('WS error or standalone offline mode', err);
          this.partyState.isConnected = false;
          resolve(false);
        };

        this.ws.onclose = () => {
          this.partyState.isConnected = false;
        };
      } catch (err) {
        console.warn('Failed to initialize WebSocket', err);
        resolve(false);
      }
    });
  }

  private handleMessage(msg: any) {
    switch (msg.type) {
      case 'party:joined': {
        this.myPlayerId = msg.playerId || this.myPlayerId;
        const room = msg.room;
        this.partyState = {
          code: room.code,
          isHost: room.hostId === this.myPlayerId,
          members: room.players,
          isConnected: true,
          error: null,
        };
        if (this.handlers.onPartyUpdate) {
          this.handlers.onPartyUpdate(this.partyState);
        }
        break;
      }

      case 'party:update': {
        this.partyState = {
          code: msg.code,
          isHost: msg.hostId === this.myPlayerId,
          members: msg.players,
          isConnected: true,
          error: null,
        };
        if (this.handlers.onPartyUpdate) {
          this.handlers.onPartyUpdate(this.partyState);
        }
        break;
      }

      case 'party:error': {
        this.partyState.error = msg.message;
        if (this.handlers.onError) {
          this.handlers.onError(msg.message);
        }
        break;
      }

      case 'match:start': {
        if (this.handlers.onMatchStart) {
          this.handlers.onMatchStart(msg.seed, msg.roomCode);
        }
        break;
      }

      case 'player:sync': {
        if (this.handlers.onPlayerSync) {
          this.handlers.onPlayerSync(msg.playerId, msg.data);
        }
        break;
      }

      case 'player:action': {
        if (this.handlers.onPlayerAction) {
          this.handlers.onPlayerAction(msg.playerId, msg.action);
        }
        break;
      }

      case 'party:chat': {
        if (this.handlers.onChatMessage) {
          this.handlers.onChatMessage(msg.sender, msg.text, msg.time);
        }
        break;
      }
    }
  }

  public async createParty(playerInfo: { name: string; skinId: string; level: number }, customCode?: string) {
    await this.connect();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'party:create',
          code: customCode,
          player: {
            id: this.myPlayerId,
            ...playerInfo,
          },
        })
      );
    }
  }

  public async joinParty(code: string, playerInfo: { name: string; skinId: string; level: number }) {
    await this.connect();
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'party:join',
          code: code.trim().toUpperCase(),
          player: {
            id: this.myPlayerId,
            ...playerInfo,
          },
        })
      );
    }
  }

  public setReady(isReady: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'party:ready',
          isReady,
        })
      );
    }
  }

  public startPartyMatch() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'match:start',
        })
      );
    }
  }

  public sendPlayerSync(data: Partial<RemotePlayerState>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'player:sync',
          data,
        })
      );
    }
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
  }

  public sendPartyChat(text: string, sender: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'party:chat',
          text,
          sender,
        })
      );
    }
  }
}

export const multiplayerClient = new MultiplayerClient();
