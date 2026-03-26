import type { WebSocket } from '@fastify/websocket';
import type { Room } from './types.js';
import type { RoomManager } from './room-manager.js';
import {
  PARTICIPANT_MESSAGE_TYPE,
  ERROR_CODE,
  ERROR_MESSAGE,
  createWsMessage,
  createWsError,
  isValidParticipantMicStatePayload,
  type WsMessage,
  type ParticipantMicStatePayload,
} from '@jellysync/shared';

export interface MicStateHandlerDeps {
  roomManager: RoomManager;
  getParticipantId: (socket: WebSocket) => string | undefined;
  sendTo: (socket: WebSocket, message: WsMessage | ReturnType<typeof createWsError>) => void;
  broadcastToRoom: {
    (room: Room, message: WsMessage): void;
    (room: Room, message: WsMessage, excludeId: string): void;
  };
}

export function createMicStateHandler(deps: MicStateHandlerDeps) {
  const { roomManager, getParticipantId, sendTo, broadcastToRoom } = deps;

  function handleMicState(socket: WebSocket, msg: WsMessage): void {
    const participantId = getParticipantId(socket);
    if (!participantId) {
      sendTo(socket, createWsError(ERROR_CODE.NOT_IN_ROOM, ERROR_MESSAGE[ERROR_CODE.NOT_IN_ROOM]));
      return;
    }

    const room = roomManager.getRoomByParticipant(participantId);
    if (!room) {
      sendTo(socket, createWsError(ERROR_CODE.NOT_IN_ROOM, ERROR_MESSAGE[ERROR_CODE.NOT_IN_ROOM]));
      return;
    }

    if (!isValidParticipantMicStatePayload(msg.payload)) {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, ERROR_MESSAGE[ERROR_CODE.INVALID_PAYLOAD]));
      return;
    }

    // Server injects fromParticipantId — never trust client-provided IDs
    broadcastToRoom(room, createWsMessage(PARTICIPANT_MESSAGE_TYPE.MIC_STATE, {
      participantId,
      isMuted: msg.payload.isMuted,
    } satisfies ParticipantMicStatePayload), participantId);
  }

  return { handleMicState };
}
