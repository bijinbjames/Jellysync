import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WebSocket } from '@fastify/websocket';
import { RoomManager } from '../rooms/room-manager.js';
import { createSignalingHandler } from './signaling-handler.js';
import {
  SIGNAL_MESSAGE_TYPE,
  createWsMessage,
} from '@jellysync/shared';

function createMockSocket(): WebSocket {
  return { readyState: 1, OPEN: 1, send: vi.fn() } as unknown as WebSocket;
}

describe('signaling handler', () => {
  let roomManager: RoomManager;
  let sendTo: ReturnType<typeof vi.fn>;
  let participantMap: Map<WebSocket, string>;
  let socketMap: Map<string, WebSocket>;
  let handler: ReturnType<typeof createSignalingHandler>;

  beforeEach(() => {
    roomManager = new RoomManager();
    sendTo = vi.fn();
    participantMap = new Map();
    socketMap = new Map();

    handler = createSignalingHandler({
      roomManager,
      getParticipantId: (socket) => participantMap.get(socket),
      sendTo,
      getSocketByParticipantId: (id) => socketMap.get(id),
    });
  });

  function setupRoom() {
    const hostSocket = createMockSocket();
    const guestSocket = createMockSocket();
    const room = roomManager.createRoom('host-1', 'Alice');
    roomManager.joinRoom(room.code, 'guest-1', 'Bob');
    participantMap.set(hostSocket, 'host-1');
    participantMap.set(guestSocket, 'guest-1');
    socketMap.set('host-1', hostSocket);
    socketMap.set('guest-1', guestSocket);
    return { room, hostSocket, guestSocket };
  }

  describe('handleSignalOffer', () => {
    it('relays offer to the correct target with fromParticipantId injected', () => {
      const { guestSocket, hostSocket } = setupRoom();

      handler.handleSignalOffer(guestSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.OFFER, {
        targetParticipantId: 'host-1',
        offer: { type: 'offer', sdp: 'v=0\r\noffer-sdp' },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        hostSocket,
        expect.objectContaining({
          type: SIGNAL_MESSAGE_TYPE.OFFER,
          payload: {
            fromParticipantId: 'guest-1',
            offer: { type: 'offer', sdp: 'v=0\r\noffer-sdp' },
          },
        }),
      );
    });

    it('sends error when sender not in a room', () => {
      const unknownSocket = createMockSocket();

      handler.handleSignalOffer(unknownSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.OFFER, {
        targetParticipantId: 'host-1',
        offer: { type: 'offer', sdp: 'v=0\r\noffer-sdp' },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        unknownSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'NOT_IN_ROOM' }),
        }),
      );
    });

    it('sends error when target not in the same room', () => {
      const { guestSocket } = setupRoom();
      // Create another room with a different participant
      const otherRoom = roomManager.createRoom('other-host', 'Charlie');
      const otherSocket = createMockSocket();
      participantMap.set(otherSocket, 'other-host');
      socketMap.set('other-host', otherSocket);

      handler.handleSignalOffer(guestSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.OFFER, {
        targetParticipantId: 'other-host',
        offer: { type: 'offer', sdp: 'v=0\r\noffer-sdp' },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        guestSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'PARTICIPANT_NOT_FOUND' }),
        }),
      );
    });

    it('sends error when target is sender themselves', () => {
      const { guestSocket } = setupRoom();

      handler.handleSignalOffer(guestSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.OFFER, {
        targetParticipantId: 'guest-1',
        offer: { type: 'offer', sdp: 'v=0\r\noffer-sdp' },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        guestSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'INVALID_PAYLOAD' }),
        }),
      );
    });

    it('sends error for invalid payload', () => {
      const { guestSocket } = setupRoom();

      handler.handleSignalOffer(guestSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.OFFER, {
        // Missing offer field
        targetParticipantId: 'host-1',
      }));

      expect(sendTo).toHaveBeenCalledWith(
        guestSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'INVALID_PAYLOAD' }),
        }),
      );
    });

    it('injects fromParticipantId server-side (does not trust client)', () => {
      const { guestSocket, hostSocket } = setupRoom();

      handler.handleSignalOffer(guestSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.OFFER, {
        targetParticipantId: 'host-1',
        offer: { type: 'offer', sdp: 'v=0\r\noffer-sdp' },
      }));

      const relayedMessage = sendTo.mock.calls[0][1];
      expect(relayedMessage.payload.fromParticipantId).toBe('guest-1');
      // Should NOT contain the client-provided targetParticipantId in outgoing message
      expect(relayedMessage.payload.targetParticipantId).toBeUndefined();
    });
  });

  describe('handleSignalAnswer', () => {
    it('relays answer to the correct target with fromParticipantId injected', () => {
      const { hostSocket, guestSocket } = setupRoom();

      handler.handleSignalAnswer(hostSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ANSWER, {
        targetParticipantId: 'guest-1',
        answer: { type: 'answer', sdp: 'v=0\r\nanswer-sdp' },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        guestSocket,
        expect.objectContaining({
          type: SIGNAL_MESSAGE_TYPE.ANSWER,
          payload: {
            fromParticipantId: 'host-1',
            answer: { type: 'answer', sdp: 'v=0\r\nanswer-sdp' },
          },
        }),
      );
    });

    it('sends error when sender not in a room', () => {
      const unknownSocket = createMockSocket();

      handler.handleSignalAnswer(unknownSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ANSWER, {
        targetParticipantId: 'guest-1',
        answer: { type: 'answer', sdp: 'v=0\r\nanswer-sdp' },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        unknownSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'NOT_IN_ROOM' }),
        }),
      );
    });

    it('sends error when target not in the same room', () => {
      const { hostSocket } = setupRoom();

      handler.handleSignalAnswer(hostSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ANSWER, {
        targetParticipantId: 'nonexistent',
        answer: { type: 'answer', sdp: 'v=0\r\nanswer-sdp' },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        hostSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'PARTICIPANT_NOT_FOUND' }),
        }),
      );
    });

    it('sends error when target is sender themselves', () => {
      const { hostSocket } = setupRoom();

      handler.handleSignalAnswer(hostSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ANSWER, {
        targetParticipantId: 'host-1',
        answer: { type: 'answer', sdp: 'v=0\r\nanswer-sdp' },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        hostSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'INVALID_PAYLOAD' }),
        }),
      );
    });

    it('sends error for invalid payload', () => {
      const { hostSocket } = setupRoom();

      handler.handleSignalAnswer(hostSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ANSWER, {
        targetParticipantId: 'guest-1',
        // Missing answer field
      }));

      expect(sendTo).toHaveBeenCalledWith(
        hostSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'INVALID_PAYLOAD' }),
        }),
      );
    });
  });

  describe('handleSignalIceCandidate', () => {
    it('relays ICE candidate to the correct target with fromParticipantId injected', () => {
      const { guestSocket, hostSocket } = setupRoom();

      handler.handleSignalIceCandidate(guestSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE, {
        targetParticipantId: 'host-1',
        candidate: { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 0 },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        hostSocket,
        expect.objectContaining({
          type: SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE,
          payload: {
            fromParticipantId: 'guest-1',
            candidate: { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 0 },
          },
        }),
      );
    });

    it('relays ICE candidate with null sdpMid and sdpMLineIndex', () => {
      const { guestSocket, hostSocket } = setupRoom();

      handler.handleSignalIceCandidate(guestSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE, {
        targetParticipantId: 'host-1',
        candidate: { candidate: 'candidate:1 ...', sdpMid: null, sdpMLineIndex: null },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        hostSocket,
        expect.objectContaining({
          type: SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE,
          payload: {
            fromParticipantId: 'guest-1',
            candidate: { candidate: 'candidate:1 ...', sdpMid: null, sdpMLineIndex: null },
          },
        }),
      );
    });

    it('sends error when sender not in a room', () => {
      const unknownSocket = createMockSocket();

      handler.handleSignalIceCandidate(unknownSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE, {
        targetParticipantId: 'host-1',
        candidate: { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 0 },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        unknownSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'NOT_IN_ROOM' }),
        }),
      );
    });

    it('sends error when target not in the same room', () => {
      const { guestSocket } = setupRoom();

      handler.handleSignalIceCandidate(guestSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE, {
        targetParticipantId: 'nonexistent',
        candidate: { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 0 },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        guestSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'PARTICIPANT_NOT_FOUND' }),
        }),
      );
    });

    it('sends error when target is sender themselves', () => {
      const { guestSocket } = setupRoom();

      handler.handleSignalIceCandidate(guestSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE, {
        targetParticipantId: 'guest-1',
        candidate: { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 0 },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        guestSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'INVALID_PAYLOAD' }),
        }),
      );
    });

    it('sends error for invalid payload', () => {
      const { guestSocket } = setupRoom();

      handler.handleSignalIceCandidate(guestSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE, {
        targetParticipantId: 'host-1',
        // Missing candidate field
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

  describe('target socket not connected', () => {
    it('sends error when target participant has no active socket', () => {
      const { guestSocket } = setupRoom();
      // Remove host socket from map
      socketMap.delete('host-1');

      handler.handleSignalOffer(guestSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.OFFER, {
        targetParticipantId: 'host-1',
        offer: { type: 'offer', sdp: 'v=0\r\noffer-sdp' },
      }));

      expect(sendTo).toHaveBeenCalledWith(
        guestSocket,
        expect.objectContaining({
          type: 'error',
          payload: expect.objectContaining({ code: 'PARTICIPANT_NOT_FOUND' }),
        }),
      );
    });
  });
});
