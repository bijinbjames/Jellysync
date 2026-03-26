import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WebSocket } from '@fastify/websocket';
import { RoomManager } from './room-manager.js';
import { createSteppedAwayHandler } from './stepped-away.js';
import {
  PARTICIPANT_MESSAGE_TYPE,
  SYNC_MESSAGE_TYPE,
  createWsMessage,
  type WsMessage,
} from '@jellysync/shared';

function createMockSocket(): WebSocket {
  return { readyState: 1, OPEN: 1, send: vi.fn() } as unknown as WebSocket;
}

describe('stepped-away handler', () => {
  let roomManager: RoomManager;
  let sendTo: ReturnType<typeof vi.fn>;
  let broadcastToRoom: ReturnType<typeof vi.fn>;
  let participantMap: Map<WebSocket, string>;
  let handler: ReturnType<typeof createSteppedAwayHandler>;

  beforeEach(() => {
    roomManager = new RoomManager();
    sendTo = vi.fn();
    broadcastToRoom = vi.fn();
    participantMap = new Map();

    handler = createSteppedAwayHandler({
      roomManager,
      getParticipantId: (socket) => participantMap.get(socket),
      sendTo,
      broadcastToRoom,
    });
  });

  function setupRoom() {
    const hostSocket = createMockSocket();
    const guestSocket = createMockSocket();
    const room = roomManager.createRoom('host-1', 'Alice');
    roomManager.joinRoom(room.code, 'guest-1', 'Bob');
    participantMap.set(hostSocket, 'host-1');
    participantMap.set(guestSocket, 'guest-1');
    // Set initial playback state
    room.playbackState = { positionMs: 5000, isPlaying: true, lastUpdated: Date.now() };
    return { room, hostSocket, guestSocket };
  }

  describe('handleSteppedAway', () => {
    it('marks participant as stepped away and broadcasts', () => {
      const { room, guestSocket } = setupRoom();

      handler.handleSteppedAway(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY, {
        participantId: 'guest-1',
        participantName: 'Bob',
      }));

      expect(roomManager.isParticipantSteppedAway(room.code, 'guest-1')).toBe(true);

      // Should broadcast stepped-away to others (excluding sender)
      expect(broadcastToRoom).toHaveBeenCalledWith(
        room,
        expect.objectContaining({
          type: PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY,
          payload: { participantId: 'guest-1', participantName: 'Bob' },
        }),
        'guest-1',
      );
    });

    it('triggers sync:pause when participant steps away', () => {
      const { room, guestSocket } = setupRoom();

      handler.handleSteppedAway(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY, {
        participantId: 'guest-1',
        participantName: 'Bob',
      }));

      // Should broadcast sync:pause with bufferPausedBy
      expect(broadcastToRoom).toHaveBeenCalledWith(
        room,
        expect.objectContaining({
          type: SYNC_MESSAGE_TYPE.PAUSE,
          payload: expect.objectContaining({
            bufferPausedBy: 'Bob',
          }),
        }),
      );

      // Room playback state should be paused
      expect(room.playbackState!.isPlaying).toBe(false);
    });

    it('does not broadcast if already stepped away', () => {
      const { guestSocket } = setupRoom();

      handler.handleSteppedAway(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY, {
        participantId: 'guest-1',
        participantName: 'Bob',
      }));

      broadcastToRoom.mockClear();

      handler.handleSteppedAway(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY, {
        participantId: 'guest-1',
        participantName: 'Bob',
      }));

      expect(broadcastToRoom).not.toHaveBeenCalled();
    });

    it('sends error for invalid payload', () => {
      const { guestSocket } = setupRoom();

      handler.handleSteppedAway(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY, {
        // Missing participantName
        participantId: 'guest-1',
      }));

      expect(sendTo).toHaveBeenCalledWith(
        guestSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'INVALID_PAYLOAD' }),
        }),
      );
    });

    it('sends error when not in room', () => {
      const unknownSocket = createMockSocket();

      handler.handleSteppedAway(unknownSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY, {
        participantId: 'unknown',
        participantName: 'Unknown',
      }));

      expect(sendTo).toHaveBeenCalledWith(
        unknownSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'NOT_IN_ROOM' }),
        }),
      );
    });
  });

  describe('handleReturned', () => {
    it('marks participant as returned and broadcasts', () => {
      const { room, guestSocket } = setupRoom();
      roomManager.markSteppedAway(room.code, 'guest-1');

      handler.handleReturned(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.RETURNED, {
        participantId: 'guest-1',
        participantName: 'Bob',
      }));

      expect(roomManager.isParticipantSteppedAway(room.code, 'guest-1')).toBe(false);

      expect(broadcastToRoom).toHaveBeenCalledWith(
        room,
        expect.objectContaining({
          type: PARTICIPANT_MESSAGE_TYPE.RETURNED,
          payload: { participantId: 'guest-1', participantName: 'Bob' },
        }),
        'guest-1',
      );
    });

    it('triggers sync:play when all participants have returned', () => {
      const { room, guestSocket } = setupRoom();
      roomManager.markSteppedAway(room.code, 'guest-1');
      room.playbackState = { positionMs: 5000, isPlaying: false, lastUpdated: Date.now() };

      handler.handleReturned(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.RETURNED, {
        participantId: 'guest-1',
        participantName: 'Bob',
      }));

      expect(broadcastToRoom).toHaveBeenCalledWith(
        room,
        expect.objectContaining({
          type: SYNC_MESSAGE_TYPE.PLAY,
          payload: expect.objectContaining({
            positionMs: 5000,
          }),
        }),
      );

      expect(room.playbackState!.isPlaying).toBe(true);
    });

    it('does NOT resume if others are still stepped away', () => {
      const { room, guestSocket } = setupRoom();
      roomManager.joinRoom(room.code, 'guest-2', 'Charlie');
      roomManager.markSteppedAway(room.code, 'guest-1');
      roomManager.markSteppedAway(room.code, 'guest-2');
      room.playbackState = { positionMs: 5000, isPlaying: false, lastUpdated: Date.now() };

      handler.handleReturned(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.RETURNED, {
        participantId: 'guest-1',
        participantName: 'Bob',
      }));

      // Should NOT have broadcast sync:play (others still away)
      const playCalls = broadcastToRoom.mock.calls.filter(
        (call: [unknown, WsMessage]) => (call[1] as WsMessage).type === SYNC_MESSAGE_TYPE.PLAY,
      );
      expect(playCalls).toHaveLength(0);
      expect(room.playbackState!.isPlaying).toBe(false);
    });

    it('does not broadcast if not actually stepped away', () => {
      const { guestSocket } = setupRoom();

      handler.handleReturned(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.RETURNED, {
        participantId: 'guest-1',
        participantName: 'Bob',
      }));

      expect(broadcastToRoom).not.toHaveBeenCalled();
    });

    it('sends error for invalid payload', () => {
      const { guestSocket } = setupRoom();

      handler.handleReturned(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.RETURNED, {
        participantId: 'guest-1',
      }));

      expect(sendTo).toHaveBeenCalledWith(
        guestSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'INVALID_PAYLOAD' }),
        }),
      );
    });
  });

  describe('cleanup on participant leave', () => {
    it('clears stepped-away state when participant is removed', () => {
      const { room } = setupRoom();
      roomManager.markSteppedAway(room.code, 'guest-1');
      expect(room.steppedAwayParticipants.size).toBe(1);

      roomManager.removeParticipant('guest-1');
      expect(room.steppedAwayParticipants.has('guest-1')).toBe(false);
    });
  });

  describe('late joiner receives stepped-away state', () => {
    it('room steppedAwayParticipants is available for state payload', () => {
      const { room } = setupRoom();
      roomManager.markSteppedAway(room.code, 'guest-1');

      const steppedAwayArray = Array.from(room.steppedAwayParticipants);
      expect(steppedAwayArray).toEqual(['guest-1']);
    });
  });
});
