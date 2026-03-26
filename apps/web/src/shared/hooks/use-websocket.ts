import { useEffect, useRef, useCallback } from 'react';
import { useStore } from 'zustand';
import { authStore } from '../../lib/auth';
import { roomStore } from '../../lib/room';
import { movieStore } from '../../lib/movie';
import {
  isWsMessage,
  WS_RECONNECT,
  ROOM_MESSAGE_TYPE,
  createWsMessage,
  type WsMessage,
  type RoomStatePayload,
} from '@jellysync/shared';

type MessageHandler = (message: WsMessage) => void;

export interface UseWebSocket {
  connectionState: 'disconnected' | 'connecting' | 'connected';
  send: <T>(message: WsMessage<T>) => void;
  subscribe: (type: string, handler: MessageHandler) => () => void;
  disconnect: () => void;
}

function deriveWsUrl(serverUrl: string): string {
  return serverUrl.replace(/^http/, 'ws').replace(/\/+$/, '') + '/ws';
}

export function useWebSocket(): UseWebSocket {
  const serverUrl = useStore(authStore, (s) => s.serverUrl);
  const signalingUrl = useStore(authStore, (s) => s.signalingUrl);
  const isAuthenticated = useStore(authStore, (s) => s.isAuthenticated);
  const connectionState = useStore(roomStore, (s) => s.connectionState);

  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef<number>(WS_RECONNECT.INITIAL_DELAY_MS);
  const intentionalCloseRef = useRef(false);

  const handleMessage = useCallback((event: MessageEvent) => {
    let data: unknown;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    if (!isWsMessage(data)) return;

    if (data.type === ROOM_MESSAGE_TYPE.STATE) {
      const payload = data.payload as RoomStatePayload;
      const { setRoom, setParticipantId } = roomStore.getState();

      // Server includes our participantId in the payload
      if (payload.participantId) {
        setParticipantId(payload.participantId);
      }

      setRoom(payload.roomCode, payload.hostId, payload.participants);

      // Sync movie selection from server state
      if (payload.movie !== undefined) {
        if (payload.movie) {
          movieStore.getState().setMovie(payload.movie);
        } else {
          movieStore.getState().clearMovie();
        }
      }
    }

    // Clear room store on room:close (room destroyed by server)
    if (data.type === ROOM_MESSAGE_TYPE.CLOSE) {
      roomStore.getState().clearRoom();
    }

    const handlers = subscribersRef.current.get(data.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }

    const wildcardHandlers = subscribersRef.current.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        handler(data);
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (!serverUrl || !isAuthenticated) return;

    const wsUrl = deriveWsUrl(signalingUrl || serverUrl);
    roomStore.getState().setConnectionState('connecting');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      roomStore.getState().setConnectionState('connected');
      backoffRef.current = WS_RECONNECT.INITIAL_DELAY_MS;

      const { roomCode: currentRoomCode, participantId: currentPId } = roomStore.getState();
      if (currentRoomCode && currentPId) {
        ws.send(
          JSON.stringify(
            createWsMessage(ROOM_MESSAGE_TYPE.REJOIN, {
              roomCode: currentRoomCode,
              participantId: currentPId,
            }),
          ),
        );
      }
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      roomStore.getState().setConnectionState('disconnected');
      wsRef.current = null;

      if (!intentionalCloseRef.current && isAuthenticated) {
        reconnectTimeoutRef.current = setTimeout(() => {
          backoffRef.current = Math.min(
            backoffRef.current * WS_RECONNECT.BACKOFF_MULTIPLIER,
            WS_RECONNECT.MAX_DELAY_MS,
          );
          connect();
        }, backoffRef.current);
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror
    };
  }, [serverUrl, signalingUrl, isAuthenticated, handleMessage]);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    roomStore.getState().setConnectionState('disconnected');
  }, []);

  const send = useCallback(<T,>(message: WsMessage<T>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!subscribersRef.current.has(type)) {
      subscribersRef.current.set(type, new Set());
    }
    subscribersRef.current.get(type)!.add(handler);

    return () => {
      const handlers = subscribersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          subscribersRef.current.delete(type);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && serverUrl) {
      intentionalCloseRef.current = false;
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, serverUrl, signalingUrl, connect, disconnect]);

  return { connectionState, send, subscribe, disconnect };
}
