import { useEffect, useRef, useCallback } from 'react';
import { useStore } from 'zustand';
import {
  SyncEngine,
  SYNC_MESSAGE_TYPE,
  PARTICIPANT_MESSAGE_TYPE,
  type WsMessage,
  type RoomStatePayload,
  type PermissionUpdatePayload,
  type SteppedAwayPayload,
  type ReturnedPayload,
  type ParticipantPermissions,
} from '@jellysync/shared';
import type { PlayerInterface } from '@jellysync/shared';
import { syncStore } from '../../../lib/sync.js';
import { roomStore } from '../../../lib/room.js';
import { useWs } from '../../../shared/providers/websocket-provider.js';

export function usePlaybackSync(playerInterface: PlayerInterface) {
  const { send, subscribe } = useWs();
  const isHost = useStore(roomStore, (s) => s.isHost);
  const isBuffering = useStore(syncStore, (s) => s.isBuffering);
  const syncEngineRef = useRef<SyncEngine | null>(null);
  const initialPlaybackAppliedRef = useRef(false);
  const prevBufferingRef = useRef(false);
  const sendRef = useRef(send);
  sendRef.current = send;

  const getIsHost = useCallback(() => roomStore.getState().isHost, []);
  const getPermissions = useCallback(() => syncStore.getState().permissions, []);
  const stableSend = useCallback((msg: WsMessage) => sendRef.current(msg), []);
  const getParticipantInfo = useCallback(() => {
    const state = roomStore.getState();
    const participant = state.participants.find((p) => p.id === state.participantId);
    return {
      participantId: state.participantId ?? '',
      displayName: participant?.displayName ?? '',
    };
  }, []);

  // Create sync engine on mount
  useEffect(() => {
    const engine = new SyncEngine({
      playerInterface,
      sendMessage: stableSend,
      getIsHost,
      getPermissions,
      getParticipantInfo,
      onSyncStatusChange: (status) => {
        syncStore.getState().setSyncStatus(status);
      },
      onServerStateChange: (positionMs, timestamp) => {
        syncStore.getState().setServerState(positionMs, timestamp);
      },
      onBufferPauseChange: (pausedBy) => {
        if (pausedBy) {
          syncStore.getState().setBufferPause(pausedBy);
        } else {
          syncStore.getState().clearBufferPause();
        }
      },
      onHostPauseChange: (isPaused) => {
        if (isPaused) {
          syncStore.getState().setHostPause();
        } else {
          syncStore.getState().clearBufferPause();
        }
      },
      onSteppedAwayPauseChange: (pausedBy) => {
        if (pausedBy) {
          syncStore.getState().setSteppedAwayPause(pausedBy);
        } else {
          syncStore.getState().clearBufferPause();
        }
      },
    });

    syncEngineRef.current = engine;
    engine.startDriftMonitor();

    return () => {
      engine.destroy();
      syncEngineRef.current = null;
      initialPlaybackAppliedRef.current = false;
    };
  }, [playerInterface, stableSend, getIsHost, getPermissions, getParticipantInfo]);

  // Monitor buffer state transitions and report to sync engine
  useEffect(() => {
    if (isBuffering && !prevBufferingRef.current) {
      syncEngineRef.current?.reportBufferStart();
    } else if (!isBuffering && prevBufferingRef.current) {
      syncEngineRef.current?.reportBufferEnd();
    }
    prevBufferingRef.current = isBuffering;
  }, [isBuffering]);

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

  // Handle late join: listen for room:state with playback data and permissions
  useEffect(() => {
    const unsub = subscribe('room:state', (msg: WsMessage) => {
      const payload = msg.payload as RoomStatePayload;

      // Apply permissions from room state (for late joiners and reconnects)
      if (payload.permissions) {
        syncStore.getState().setPermissions(payload.permissions);
      }

      // Reconcile stepped-away state from authoritative server list
      syncStore.getState().setSteppedAwayParticipants(payload.steppedAwayParticipants ?? []);

      if (initialPlaybackAppliedRef.current) return;
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

  // Subscribe to permission updates
  useEffect(() => {
    const unsub = subscribe(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE, (msg: WsMessage) => {
      const payload = msg.payload as PermissionUpdatePayload;
      syncStore.getState().setPermissions(payload.permissions);
    });

    return unsub;
  }, [subscribe]);

  // Subscribe to stepped-away / returned messages
  useEffect(() => {
    const unsubSteppedAway = subscribe(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY, (msg: WsMessage) => {
      const payload = msg.payload as SteppedAwayPayload;
      syncStore.getState().addSteppedAway(payload.participantId);
      syncStore.getState().setSteppedAwayPause(payload.participantName);
    });

    const unsubReturned = subscribe(PARTICIPANT_MESSAGE_TYPE.RETURNED, (msg: WsMessage) => {
      const payload = msg.payload as ReturnedPayload;
      syncStore.getState().removeSteppedAway(payload.participantId);
      if (syncStore.getState().steppedAwayParticipantIds.length === 0) {
        syncStore.getState().clearBufferPause();
      }
    });

    return () => {
      unsubSteppedAway();
      unsubReturned();
    };
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

  const sendPermissionUpdate = useCallback((permissions: ParticipantPermissions) => {
    const state = roomStore.getState();
    if (!state.isHost) return;
    sendRef.current(
      {
        type: PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE,
        payload: {
          permissions,
          updatedBy: state.participantId ?? '',
        } satisfies PermissionUpdatePayload,
        timestamp: Date.now(),
      },
    );
    // Optimistically update local state
    syncStore.getState().setPermissions(permissions);
  }, []);

  return { requestPlay, requestPause, requestSeek, isHost, sendPermissionUpdate };
}
