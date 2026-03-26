import type { WebSocket } from '@fastify/websocket';
import type { Room } from './types.js';
import type { RoomManager } from './room-manager.js';
import {
  PARTICIPANT_MESSAGE_TYPE,
  ERROR_CODE,
  ERROR_MESSAGE,
  createWsMessage,
  createWsError,
  isValidPermissionUpdatePayload,
  type WsMessage,
  type PermissionUpdatePayload,
} from '@jellysync/shared';

export interface PermissionHandlerDeps {
  roomManager: RoomManager;
  getParticipantId: (socket: WebSocket) => string | undefined;
  sendTo: (socket: WebSocket, message: WsMessage | ReturnType<typeof createWsError>) => void;
  broadcastToRoom: (room: Room, message: WsMessage) => void;
}

export function createPermissionHandler(deps: PermissionHandlerDeps) {
  const { roomManager, getParticipantId, sendTo, broadcastToRoom } = deps;

  function handlePermissionUpdate(socket: WebSocket, msg: WsMessage): void {
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

    if (room.hostId !== participantId) {
      sendTo(socket, createWsError(ERROR_CODE.NOT_HOST, ERROR_MESSAGE[ERROR_CODE.NOT_HOST]));
      return;
    }

    if (!isValidPermissionUpdatePayload(msg.payload)) {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, ERROR_MESSAGE[ERROR_CODE.INVALID_PAYLOAD]));
      return;
    }

    const payload = msg.payload as PermissionUpdatePayload;
    room.permissions = payload.permissions;

    broadcastToRoom(room, createWsMessage(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE, {
      permissions: payload.permissions,
      updatedBy: participantId,
    } satisfies PermissionUpdatePayload));
  }

  function handleParticipantMessage(socket: WebSocket, msg: WsMessage): void {
    switch (msg.type) {
      case PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE:
        handlePermissionUpdate(socket, msg);
        break;
    }
  }

  return { handleParticipantMessage };
}
