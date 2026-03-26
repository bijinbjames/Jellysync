import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPermissionHandler } from './permissions.js';
import { RoomManager } from './room-manager.js';
import {
  PARTICIPANT_MESSAGE_TYPE,
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

describe('permission-handler', () => {
  let roomManager: RoomManager;
  let socket: ReturnType<typeof createMockSocket>;
  let sentErrors: Array<{ code: string }>;
  let broadcasts: WsMessage[];
  let connectionMap: Map<unknown, string>;

  function setupHandler() {
    connectionMap = new Map();
    sentErrors = [];
    broadcasts = [];

    return createPermissionHandler({
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
      const msg = createWsMessage(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE, {
        permissions: { canPlayPause: false, canSeek: true },
        updatedBy: 'host-1',
      });
      handler.handleParticipantMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(sentErrors[0].code).toBe(ERROR_CODE.NOT_IN_ROOM);
    });

    it('rejects message from participant not in room', () => {
      const handler = setupHandler();
      connectionMap.set(socket, 'unknown-participant');
      const msg = createWsMessage(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE, {
        permissions: { canPlayPause: false, canSeek: true },
        updatedBy: 'unknown-participant',
      });
      handler.handleParticipantMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(sentErrors[0].code).toBe(ERROR_CODE.NOT_IN_ROOM);
    });

    it('rejects permission update from non-host', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      roomManager.joinRoom(room.code, 'guest-1', 'Guest');
      connectionMap.set(socket, 'guest-1');

      const msg = createWsMessage(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE, {
        permissions: { canPlayPause: false, canSeek: true },
        updatedBy: 'guest-1',
      });
      handler.handleParticipantMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(sentErrors[0].code).toBe(ERROR_CODE.NOT_HOST);
    });

    it('rejects invalid payload', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE, {
        invalid: true,
      });
      handler.handleParticipantMessage(socket, msg);
      expect(sentErrors).toHaveLength(1);
      expect(sentErrors[0].code).toBe(ERROR_CODE.INVALID_PAYLOAD);
    });
  });

  describe('successful permission update', () => {
    it('updates room permissions and broadcasts', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE, {
        permissions: { canPlayPause: false, canSeek: false },
        updatedBy: 'host-1',
      });
      handler.handleParticipantMessage(socket, msg);

      expect(sentErrors).toHaveLength(0);
      expect(room.permissions).toEqual({ canPlayPause: false, canSeek: false });
      expect(broadcasts).toHaveLength(1);
      expect(broadcasts[0].type).toBe(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE);
      expect((broadcasts[0].payload as Record<string, unknown>).permissions).toEqual({
        canPlayPause: false,
        canSeek: false,
      });
    });

    it('preserves permissions on room object for late joiners', () => {
      const handler = setupHandler();
      const room = roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      // Default permissions
      expect(room.permissions).toEqual({ canPlayPause: true, canSeek: true });

      // Update permissions
      const msg = createWsMessage(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE, {
        permissions: { canPlayPause: true, canSeek: false },
        updatedBy: 'host-1',
      });
      handler.handleParticipantMessage(socket, msg);

      // Verify room state is updated for late joiners
      expect(room.permissions).toEqual({ canPlayPause: true, canSeek: false });
    });

    it('broadcasts with updatedBy set to host participantId', () => {
      const handler = setupHandler();
      roomManager.createRoom('host-1', 'Host');
      connectionMap.set(socket, 'host-1');

      const msg = createWsMessage(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE, {
        permissions: { canPlayPause: false, canSeek: true },
        updatedBy: 'host-1',
      });
      handler.handleParticipantMessage(socket, msg);

      expect((broadcasts[0].payload as Record<string, unknown>).updatedBy).toBe('host-1');
    });
  });
});
