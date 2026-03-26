import type { WebSocket } from '@fastify/websocket';
import type { Room } from './types.js';
import type { RoomManager } from './room-manager.js';
import {
  PARTICIPANT_MESSAGE_TYPE,
  SYNC_MESSAGE_TYPE,
  ERROR_CODE,
  ERROR_MESSAGE,
  createWsMessage,
  createWsError,
  isValidSteppedAwayPayload,
  isValidReturnedPayload,
  type WsMessage,
  type SteppedAwayPayload,
  type ReturnedPayload,
  type SyncPausePayload,
  type SyncPlayPayload,
} from '@jellysync/shared';

export interface SteppedAwayHandlerDeps {
  roomManager: RoomManager;
  getParticipantId: (socket: WebSocket) => string | undefined;
  sendTo: (socket: WebSocket, message: WsMessage | ReturnType<typeof createWsError>) => void;
  broadcastToRoom: {
    (room: Room, message: WsMessage): void;
    (room: Room, message: WsMessage, excludeId: string): void;
  };
}

export function createSteppedAwayHandler(deps: SteppedAwayHandlerDeps) {
  const { roomManager, getParticipantId, sendTo, broadcastToRoom } = deps;

  function getValidatedRoom(socket: WebSocket): { room: Room; participantId: string } | null {
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

    return { room, participantId };
  }

  function handleSteppedAway(socket: WebSocket, msg: WsMessage): void {
    const result = getValidatedRoom(socket);
    if (!result) return;

    if (!isValidSteppedAwayPayload(msg.payload)) {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, ERROR_MESSAGE[ERROR_CODE.INVALID_PAYLOAD]));
      return;
    }

    const { room, participantId } = result;

    const stateChanged = roomManager.markSteppedAway(room.code, participantId);
    if (!stateChanged) return;

    // Use server-side display name — don't trust client-provided name
    const participant = room.participants.get(participantId);
    const participantName = participant?.displayName ?? 'Unknown';

    // Broadcast stepped-away to all OTHER participants
    broadcastToRoom(room, createWsMessage(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY, {
      participantId,
      participantName,
    } satisfies SteppedAwayPayload), participantId);

    // Trigger sync:pause with stepped-away source
    if (room.playbackState) {
      const serverTimestamp = Date.now();
      room.playbackState = {
        positionMs: room.playbackState.positionMs,
        isPlaying: false,
        lastUpdated: serverTimestamp,
      };

      broadcastToRoom(room, createWsMessage(SYNC_MESSAGE_TYPE.PAUSE, {
        positionMs: room.playbackState.positionMs,
        serverTimestamp,
        bufferPausedBy: participantName,
        pauseSource: 'stepped-away',
      } satisfies SyncPausePayload));
    }
  }

  function handleReturned(socket: WebSocket, msg: WsMessage): void {
    const result = getValidatedRoom(socket);
    if (!result) return;

    if (!isValidReturnedPayload(msg.payload)) {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, ERROR_MESSAGE[ERROR_CODE.INVALID_PAYLOAD]));
      return;
    }

    const { room, participantId } = result;

    const stateChanged = roomManager.markReturned(room.code, participantId);
    if (!stateChanged) return;

    // Use server-side display name — don't trust client-provided name
    const participant = room.participants.get(participantId);
    const participantName = participant?.displayName ?? 'Unknown';

    // Broadcast returned to all OTHER participants
    broadcastToRoom(room, createWsMessage(PARTICIPANT_MESSAGE_TYPE.RETURNED, {
      participantId,
      participantName,
    } satisfies ReturnedPayload), participantId);

    // Resume ONLY if no other participants are still stepped away
    if (room.steppedAwayParticipants.size === 0 && room.playbackState) {
      const serverTimestamp = Date.now();
      room.playbackState = {
        positionMs: room.playbackState.positionMs,
        isPlaying: true,
        lastUpdated: serverTimestamp,
      };

      broadcastToRoom(room, createWsMessage(SYNC_MESSAGE_TYPE.PLAY, {
        positionMs: room.playbackState.positionMs,
        serverTimestamp,
      } satisfies SyncPlayPayload));
    }
  }

  return { handleSteppedAway, handleReturned };
}
