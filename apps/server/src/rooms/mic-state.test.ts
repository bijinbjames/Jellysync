import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WebSocket } from '@fastify/websocket';
import { RoomManager } from './room-manager.js';
import { createMicStateHandler } from './mic-state.js';
import {
  PARTICIPANT_MESSAGE_TYPE,
  ERROR_CODE,
  createWsMessage,
} from '@jellysync/shared';

function createMockSocket(): WebSocket {
  return { readyState: 1, OPEN: 1, send: vi.fn() } as unknown as WebSocket;
}

describe('mic-state handler', () => {
  let roomManager: RoomManager;
  let sendTo: ReturnType<typeof vi.fn>;
  let broadcastToRoom: ReturnType<typeof vi.fn>;
  let participantMap: Map<WebSocket, string>;
  let handler: ReturnType<typeof createMicStateHandler>;

  beforeEach(() => {
    roomManager = new RoomManager();
    sendTo = vi.fn();
    broadcastToRoom = vi.fn();
    participantMap = new Map();

    handler = createMicStateHandler({
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
    return { room, hostSocket, guestSocket };
  }

  it('broadcasts mic-state to room excluding sender', () => {
    const { room, guestSocket } = setupRoom();

    handler.handleMicState(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.MIC_STATE, {
      isMuted: true,
    }));

    expect(broadcastToRoom).toHaveBeenCalledWith(
      room,
      expect.objectContaining({
        type: PARTICIPANT_MESSAGE_TYPE.MIC_STATE,
        payload: { participantId: 'guest-1', isMuted: true },
      }),
      'guest-1',
    );
  });

  it('injects server-side participantId (does not trust client)', () => {
    const { guestSocket } = setupRoom();

    handler.handleMicState(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.MIC_STATE, {
      participantId: 'spoofed-id',
      isMuted: true,
    }));

    // The broadcast should use guest-1, not spoofed-id
    expect(broadcastToRoom).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        payload: { participantId: 'guest-1', isMuted: true },
      }),
      'guest-1',
    );
  });

  it('sends error when participant not in room', () => {
    const unknownSocket = createMockSocket();

    handler.handleMicState(unknownSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.MIC_STATE, {
      isMuted: true,
    }));

    expect(sendTo).toHaveBeenCalledWith(
      unknownSocket,
      expect.objectContaining({
        payload: expect.objectContaining({ code: ERROR_CODE.NOT_IN_ROOM }),
      }),
    );
    expect(broadcastToRoom).not.toHaveBeenCalled();
  });

  it('sends error for invalid payload', () => {
    const { guestSocket } = setupRoom();

    handler.handleMicState(guestSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.MIC_STATE, {
      invalid: 'payload',
    }));

    expect(sendTo).toHaveBeenCalledWith(
      guestSocket,
      expect.objectContaining({
        payload: expect.objectContaining({ code: ERROR_CODE.INVALID_PAYLOAD }),
      }),
    );
    expect(broadcastToRoom).not.toHaveBeenCalled();
  });

  it('broadcasts unmute state correctly', () => {
    const { room, hostSocket } = setupRoom();

    handler.handleMicState(hostSocket, createWsMessage(PARTICIPANT_MESSAGE_TYPE.MIC_STATE, {
      isMuted: false,
    }));

    expect(broadcastToRoom).toHaveBeenCalledWith(
      room,
      expect.objectContaining({
        payload: { participantId: 'host-1', isMuted: false },
      }),
      'host-1',
    );
  });
});
