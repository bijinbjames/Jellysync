import { useEffect, useRef, useCallback } from 'react';
import { useStore } from 'zustand';
import {
  SyncEngine,
  SYNC_MESSAGE_TYPE,
  type WsMessage,
  type RoomStatePayload,
} from '@jellysync/shared';
import type { PlayerInterface } from '@jellysync/shared';
import { syncStore } from '../../../lib/sync.js';
import { roomStore } from '../../../lib/room.js';
import { useWebSocket } from '../../../shared/hooks/use-websocket.js';

export function usePlaybackSync(playerInterface: PlayerInterface) {
  const { send, subscribe } = useWebSocket();
  const isHost = useStore(roomStore, (s) => s.isHost);
  const syncEngineRef = useRef<SyncEngine | null>(null);
  const initialPlaybackAppliedRef = useRef(false);
  const sendRef = useRef(send);
  sendRef.current = send;

  const getIsHost = useCallback(() => roomStore.getState().isHost, []);
  const stableSend = useCallback((msg: WsMessage) => sendRef.current(msg), []);

  // Create sync engine on mount
  useEffect(() => {
    const engine = new SyncEngine({
      playerInterface,
      sendMessage: stableSend,
      getIsHost,
      onSyncStatusChange: (status) => {
        syncStore.getState().setSyncStatus(status);
      },
      onServerStateChange: (positionMs, timestamp) => {
        syncStore.getState().setServerState(positionMs, timestamp);
      },
    });

    syncEngineRef.current = engine;
    engine.startDriftMonitor();

    return () => {
      engine.destroy();
      syncEngineRef.current = null;
      initialPlaybackAppliedRef.current = false;
    };
  }, [playerInterface, stableSend, getIsHost]);

  // Subscribe to sync messages
  useEffect(() => {
    const unsubscribes = [
      SYNC_MESSAGE_TYPE.PLAY,
      SYNC_MESSAGE_TYPE.PAUSE,
      SYNC_MESSAGE_TYPE.SEEK,
    ].map((type) =>
      subscribe(type, (msg: WsMessage) => {
        syncEngineRef.current?.handleSyncMessage(msg);
      }),
    );

    return () => {
      for (const unsub of unsubscribes) {
        unsub();
      }
    };
  }, [subscribe]);

  // Handle late join: listen for room:state with playback data
  useEffect(() => {
    const unsub = subscribe('room:state', (msg: WsMessage) => {
      if (initialPlaybackAppliedRef.current) return;
      const payload = msg.payload as RoomStatePayload;
      if (payload.playback) {
        initialPlaybackAppliedRef.current = true;
        syncEngineRef.current?.applyLateJoinState(
          payload.playback.positionMs,
          payload.playback.isPlaying,
          payload.playback.lastUpdated,
        );
      }
    });

    return unsub;
  }, [subscribe]);

  const requestPlay = useCallback(() => {
    syncEngineRef.current?.requestPlay();
  }, []);

  const requestPause = useCallback(() => {
    syncEngineRef.current?.requestPause();
  }, []);

  const requestSeek = useCallback((positionMs: number) => {
    syncEngineRef.current?.requestSeek(positionMs);
  }, []);

  return { requestPlay, requestPause, requestSeek, isHost };
}
