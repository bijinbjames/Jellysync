import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSyncHandler } from './sync-handler.js';
import { RoomManager } from '../rooms/room-manager.js';
import {
  SYNC_MESSAGE_TYPE,
  ERROR_CODE,
  createWsMessage,
  type WsMessage,
} from '@jellysync/shared';

function createMockSocket() {
  return {
    OPEN: 1,
    readyState: 1,
    send: vi.fn(),
  } as unknown as import('@fastify/websocket').WebSocket;
}

describe('sync-handler', () => {
  let roomManager: RoomManager;
  let socket: ReturnType<typeof createMockSocket>;
  let sentErrors: Array<{ code: string }>;
  let broadcasts: WsMessage[];
  let connectionMap: Map<unknown, string>;

  function setupHandler() {
    connectionMap = new Map();
    sentErrors = [];
    broadcasts = [];

    return createSyncHandler({
      roomManager,
      getParticipantId: (s) => connectionMap.get(s),
      sendTo: (_s, msg) => {
        if ('payload' in msg && typeof msg.payload === 'object' && msg.payload !== null && 'code' in msg.payload) {
          sentErrors.push(msg.payload as { code: string });
        }
      },
      broadcastToRoom: (_room, msg) => {
        broadcasts.push(msg as WsMessage);
      },
    });
  }

  beforeEach(() => {
    roomManager = new RoomManager();
    socket = createMockSocket();
  });

  describe('validation', () => {
    it('rejects message from unknown connection', () => {
      const handler = setupHandler();
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 0, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(sentErrors[0].code).toBe(ERROR_CODE.NOT_IN_ROOM);
    });

    it('rejects message from participant not in room', () => {
      const handler = setupHandler();
      connectionMap.set(socket, 'unknown-participant');
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 0, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(sentErrors[0].code).toBe(ERROR_CODE.NOT_IN_ROOM);
    });

    it('allows play from non-host when permissions grant canPlayPause', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Guest');
      connectionMap.set(socket, 'guest-1');

      // Default permissions: canPlayPause = true
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 0, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);
      expect(sentErrors).toHaveLength(0);
      expect(broadcasts).toHaveLength(1);
    });

    it('rejects play from non-host when permissions deny canPlayPause', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      room.permissions = { canPlayPause: false, canSeek: false };
      roomManager.joinRoom(room.code, 'guest-1', 'Guest');
      connectionMap.set(socket, 'guest-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 0, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(sentErrors[0].code).toBe(ERROR_CODE.PERMISSION_DENIED);
    });

    it('rejects seek from non-host when permissions deny canSeek', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      room.permissions = { canPlayPause: true, canSeek: false };
      roomManager.joinRoom(room.code, 'guest-1', 'Guest');
      connectionMap.set(socket, 'guest-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.SEEK, { positionMs: 5000, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(sentErrors[0].code).toBe(ERROR_CODE.PERMISSION_DENIED);
    });
  });

  describe('payload validation', () => {
    it('rejects sync message with non-numeric positionMs', () => {
      const handler = setupHandler();
      roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 'abc', serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(broadcasts).toHaveLength(0);
    });

    it('rejects sync message with negative positionMs', () => {
      const handler = setupHandler();
      roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: -100, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(broadcasts).toHaveLength(0);
    });

    it('rejects sync message with NaN positionMs', () => {
      const handler = setupHandler();
      roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: NaN, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(broadcasts).toHaveLength(0);
    });

    it('rejects sync message with missing payload', () => {
      const handler = setupHandler();
      roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, null);
      handler.handleSyncMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(broadcasts).toHaveLength(0);
    });
  });

  describe('sync:play', () => {
    it('broadcasts sync:play to all room participants', () => {
      const handler = setupHandler();
      roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 5000, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);

      expect(broadcasts).toHaveLength(1);
      expect(broadcasts[0].type).toBe(SYNC_MESSAGE_TYPE.PLAY);
      expect((broadcasts[0].payload as { positionMs: number }).positionMs).toBe(5000);
    });

    it('sets server-authoritative timestamp', () => {
      const handler = setupHandler();
      roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 5000, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);

      const serverTimestamp = (broadcasts[0].payload as { serverTimestamp: number }).serverTimestamp;
      expect(serverTimestamp).toBeGreaterThan(0);
    });

    it('updates room playbackState to playing', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 5000, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);

      expect(room.playbackState).not.toBeNull();
      expect(room.playbackState!.isPlaying).toBe(true);
      expect(room.playbackState!.positionMs).toBe(5000);
    });
  });

  describe('sync:pause', () => {
    it('broadcasts sync:pause to all room participants', () => {
      const handler = setupHandler();
      roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PAUSE, { positionMs: 15000, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);

      expect(broadcasts).toHaveLength(1);
      expect(broadcasts[0].type).toBe(SYNC_MESSAGE_TYPE.PAUSE);
      expect((broadcasts[0].payload as { positionMs: number }).positionMs).toBe(15000);
    });

    it('updates room playbackState to paused', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PAUSE, { positionMs: 15000, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);

      expect(room.playbackState!.isPlaying).toBe(false);
      expect(room.playbackState!.positionMs).toBe(15000);
    });
  });

  describe('sync:seek', () => {
    it('broadcasts sync:seek to all room participants', () => {
      const handler = setupHandler();
      roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.SEEK, { positionMs: 60000, serverTimestamp: 0 });
      handler.handleSyncMessage(socket, msg);

      expect(broadcasts).toHaveLength(1);
      expect(broadcasts[0].type).toBe(SYNC_MESSAGE_TYPE.SEEK);
      expect((broadcasts[0].payload as { positionMs: number }).positionMs).toBe(60000);
    });

    it('preserves playing state on seek', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      // First play
      handler.handleSyncMessage(socket, createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 5000, serverTimestamp: 0 }));
      expect(room.playbackState!.isPlaying).toBe(true);

      // Then seek
      handler.handleSyncMessage(socket, createWsMessage(SYNC_MESSAGE_TYPE.SEEK, { positionMs: 60000, serverTimestamp: 0 }));
      expect(room.playbackState!.isPlaying).toBe(true);
      expect(room.playbackState!.positionMs).toBe(60000);
    });

    it('preserves paused state on seek', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      // Pause first
      handler.handleSyncMessage(socket, createWsMessage(SYNC_MESSAGE_TYPE.PAUSE, { positionMs: 5000, serverTimestamp: 0 }));
      expect(room.playbackState!.isPlaying).toBe(false);

      // Then seek
      handler.handleSyncMessage(socket, createWsMessage(SYNC_MESSAGE_TYPE.SEEK, { positionMs: 60000, serverTimestamp: 0 }));
      expect(room.playbackState!.isPlaying).toBe(false);
      expect(room.playbackState!.positionMs).toBe(60000);
    });
  });

  describe('playback state in room', () => {
    it('starts as null', () => {
      const room = roomManager.createRoom('host-1', 'Host');
      expect(room.playbackState).toBeNull();
    });
  });

  describe('sync:buffer-start', () => {
    it('broadcasts sync:pause with bufferPausedBy when participant buffers', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Alice');
      const guestSocket = createMockSocket();
      connectionMap.set(guestSocket, 'guest-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'guest-1', displayName: 'Alice', positionMs: 5000 });
      handler.handleSyncMessage(guestSocket, msg);

      expect(broadcasts).toHaveLength(1);
      expect(broadcasts[0].type).toBe(SYNC_MESSAGE_TYPE.PAUSE);
      const payload = broadcasts[0].payload as { positionMs: number; bufferPausedBy: string };
      expect(payload.positionMs).toBe(5000);
      expect(payload.bufferPausedBy).toBe('Alice');
    });

    it('sets room.bufferingParticipantId', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Alice');
      const guestSocket = createMockSocket();
      connectionMap.set(guestSocket, 'guest-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'guest-1', displayName: 'Alice', positionMs: 5000 });
      handler.handleSyncMessage(guestSocket, msg);

      expect(room.bufferingParticipantId).toBe('guest-1');
    });

    it('updates room playbackState to paused', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Alice');
      const guestSocket = createMockSocket();
      connectionMap.set(guestSocket, 'guest-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'guest-1', displayName: 'Alice', positionMs: 5000 });
      handler.handleSyncMessage(guestSocket, msg);

      expect(room.playbackState!.isPlaying).toBe(false);
      expect(room.playbackState!.positionMs).toBe(5000);
    });

    it('does NOT require host — any participant can trigger', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Alice');
      const guestSocket = createMockSocket();
      connectionMap.set(guestSocket, 'guest-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'guest-1', displayName: 'Alice', positionMs: 5000 });
      handler.handleSyncMessage(guestSocket, msg);

      expect(sentErrors).toHaveLength(0);
      expect(broadcasts).toHaveLength(1);
    });

    it('ignores subsequent buffer-start when someone is already buffering', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Alice');
      roomManager.joinRoom(room.code, 'guest-2', 'Bob');
      const guestSocket1 = createMockSocket();
      const guestSocket2 = createMockSocket();
      connectionMap.set(guestSocket1, 'guest-1');
      connectionMap.set(guestSocket2, 'guest-2');

      handler.handleSyncMessage(guestSocket1, createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'guest-1', displayName: 'Alice', positionMs: 5000 }));
      handler.handleSyncMessage(guestSocket2, createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'guest-2', displayName: 'Bob', positionMs: 6000 }));

      expect(broadcasts).toHaveLength(1);
      expect(room.bufferingParticipantId).toBe('guest-1');
    });

    it('rejects buffer-start from unknown connection', () => {
      const handler = setupHandler();
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'unknown', displayName: 'Unknown', positionMs: 0 });
      handler.handleSyncMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(sentErrors[0].code).toBe(ERROR_CODE.NOT_IN_ROOM);
    });

    it('rejects buffer-start with invalid positionMs', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Alice');
      const guestSocket = createMockSocket();
      connectionMap.set(guestSocket, 'guest-1');

      const msg = createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'guest-1', displayName: 'Alice', positionMs: -1 });
      handler.handleSyncMessage(guestSocket, msg);
      expect(broadcasts).toHaveLength(0);
    });
  });

  describe('sync:buffer-end', () => {
    it('broadcasts sync:play when buffering participant recovers', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Alice');
      const guestSocket = createMockSocket();
      connectionMap.set(guestSocket, 'guest-1');

      handler.handleSyncMessage(guestSocket, createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'guest-1', displayName: 'Alice', positionMs: 5000 }));
      handler.handleSyncMessage(guestSocket, createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_END, { participantId: 'guest-1', positionMs: 5500 }));

      expect(broadcasts).toHaveLength(2);
      expect(broadcasts[1].type).toBe(SYNC_MESSAGE_TYPE.PLAY);
      expect((broadcasts[1].payload as { positionMs: number }).positionMs).toBe(5500);
    });

    it('clears room.bufferingParticipantId on buffer-end', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Alice');
      const guestSocket = createMockSocket();
      connectionMap.set(guestSocket, 'guest-1');

      handler.handleSyncMessage(guestSocket, createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'guest-1', displayName: 'Alice', positionMs: 5000 }));
      handler.handleSyncMessage(guestSocket, createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_END, { participantId: 'guest-1', positionMs: 5500 }));

      expect(room.bufferingParticipantId).toBeNull();
    });

    it('updates room playbackState to playing on buffer-end', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Alice');
      const guestSocket = createMockSocket();
      connectionMap.set(guestSocket, 'guest-1');

      handler.handleSyncMessage(guestSocket, createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'guest-1', displayName: 'Alice', positionMs: 5000 }));
      handler.handleSyncMessage(guestSocket, createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_END, { participantId: 'guest-1', positionMs: 5500 }));

      expect(room.playbackState!.isPlaying).toBe(true);
    });

    it('ignores buffer-end from participant who did not trigger the pause', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Alice');
      roomManager.joinRoom(room.code, 'guest-2', 'Bob');
      const guestSocket1 = createMockSocket();
      const guestSocket2 = createMockSocket();
      connectionMap.set(guestSocket1, 'guest-1');
      connectionMap.set(guestSocket2, 'guest-2');

      handler.handleSyncMessage(guestSocket1, createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'guest-1', displayName: 'Alice', positionMs: 5000 }));
      handler.handleSyncMessage(guestSocket2, createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_END, { participantId: 'guest-2', positionMs: 5500 }));

      // Only the buffer-start broadcast should exist; buffer-end from wrong participant is ignored
      expect(broadcasts).toHaveLength(1);
      expect(room.bufferingParticipantId).toBe('guest-1');
    });

    it('ignores buffer-end when no one is buffering', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Alice');
      const guestSocket = createMockSocket();
      connectionMap.set(guestSocket, 'guest-1');

      handler.handleSyncMessage(guestSocket, createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_END, { participantId: 'guest-1', positionMs: 5500 }));

      expect(broadcasts).toHaveLength(0);
    });
  });
});
