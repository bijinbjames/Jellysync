import type { WebSocket } from '@fastify/websocket';
import type { Room } from '../rooms/types.js';
import type { RoomManager } from '../rooms/room-manager.js';
import {
  SIGNAL_MESSAGE_TYPE,
  ERROR_CODE,
  ERROR_MESSAGE,
  createWsMessage,
  createWsError,
  isValidSignalOfferPayload,
  isValidSignalAnswerPayload,
  isValidSignalIceCandidatePayload,
  type WsMessage,
  type SignalOfferPayload,
  type SignalAnswerPayload,
  type SignalIceCandidatePayload,
} from '@jellysync/shared';

export interface SignalingHandlerDeps {
  roomManager: RoomManager;
  getParticipantId: (socket: WebSocket) => string | undefined;
  sendTo: (socket: WebSocket, message: WsMessage | ReturnType<typeof createWsError>) => void;
  getSocketByParticipantId: (participantId: string) => WebSocket | undefined;
}

export function createSignalingHandler(deps: SignalingHandlerDeps) {
  const { roomManager, getParticipantId, sendTo, getSocketByParticipantId } = deps;

  function getValidatedRoomAndTarget(
    socket: WebSocket,
    targetParticipantId: string,
  ): { room: Room; participantId: string; targetSocket: WebSocket } | null {
    const participantId = getParticipantId(socket);
    if (!participantId) {
      sendTo(socket, createWsError(ERROR_CODE.NOT_IN_ROOM, ERROR_MESSAGE[ERROR_CODE.NOT_IN_ROOM]));
      return null;
    }

    const room = roomManager.getRoomByParticipant(participantId);
    if (!room) {
      sendTo(socket, createWsError(ERROR_CODE.NOT_IN_ROOM, ERROR_MESSAGE[ERROR_CODE.NOT_IN_ROOM]));
      return null;
    }

    // Cannot send signal to yourself
    if (targetParticipantId === participantId) {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, ERROR_MESSAGE[ERROR_CODE.INVALID_PAYLOAD]));
      return null;
    }

    // Target must be in the same room
    if (!room.participants.has(targetParticipantId)) {
      sendTo(socket, createWsError(ERROR_CODE.PARTICIPANT_NOT_FOUND, ERROR_MESSAGE[ERROR_CODE.PARTICIPANT_NOT_FOUND]));
      return null;
    }

    const targetSocket = getSocketByParticipantId(targetParticipantId);
    if (!targetSocket) {
      sendTo(socket, createWsError(ERROR_CODE.PARTICIPANT_NOT_FOUND, ERROR_MESSAGE[ERROR_CODE.PARTICIPANT_NOT_FOUND]));
      return null;
    }

    return { room, participantId, targetSocket };
  }

  function handleSignalOffer(socket: WebSocket, msg: WsMessage): void {
    if (!isValidSignalOfferPayload(msg.payload)) {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, ERROR_MESSAGE[ERROR_CODE.INVALID_PAYLOAD]));
      return;
    }

    const payload = msg.payload as SignalOfferPayload;
    const result = getValidatedRoomAndTarget(socket, payload.targetParticipantId);
    if (!result) return;

    // Relay offer to target with server-injected fromParticipantId
    sendTo(result.targetSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.OFFER, {
      fromParticipantId: result.participantId,
      offer: payload.offer,
    }));
  }

  function handleSignalAnswer(socket: WebSocket, msg: WsMessage): void {
    if (!isValidSignalAnswerPayload(msg.payload)) {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, ERROR_MESSAGE[ERROR_CODE.INVALID_PAYLOAD]));
      return;
    }

    const payload = msg.payload as SignalAnswerPayload;
    const result = getValidatedRoomAndTarget(socket, payload.targetParticipantId);
    if (!result) return;

    // Relay answer to target with server-injected fromParticipantId
    sendTo(result.targetSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ANSWER, {
      fromParticipantId: result.participantId,
      answer: payload.answer,
    }));
  }

  function handleSignalIceCandidate(socket: WebSocket, msg: WsMessage): void {
    if (!isValidSignalIceCandidatePayload(msg.payload)) {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, ERROR_MESSAGE[ERROR_CODE.INVALID_PAYLOAD]));
      return;
    }

    const payload = msg.payload as SignalIceCandidatePayload;
    const result = getValidatedRoomAndTarget(socket, payload.targetParticipantId);
    if (!result) return;

    // Relay ICE candidate to target with server-injected fromParticipantId
    sendTo(result.targetSocket, createWsMessage(SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE, {
      fromParticipantId: result.participantId,
      candidate: payload.candidate,
    }));
  }

  return { handleSignalOffer, handleSignalAnswer, handleSignalIceCandidate };
}
