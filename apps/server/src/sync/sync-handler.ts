import type { WebSocket } from '@fastify/websocket';
import type { Room } from '../rooms/types.js';
import type { RoomManager } from '../rooms/room-manager.js';
import {
  SYNC_MESSAGE_TYPE,
  ERROR_CODE,
  ERROR_MESSAGE,
  createWsMessage,
  createWsError,
  type WsMessage,
  type SyncPlayPayload,
  type SyncPausePayload,
  type SyncSeekPayload,
  type SyncBufferStartPayload,
  type SyncBufferEndPayload,
} from '@jellysync/shared';

interface SyncHandlerDeps {
  roomManager: RoomManager;
  getParticipantId: (socket: WebSocket) => string | undefined;
  sendTo: (socket: WebSocket, message: WsMessage | ReturnType<typeof createWsError>) => void;
  broadcastToRoom: (room: Room, message: WsMessage) => void;
}

export function createSyncHandler(deps: SyncHandlerDeps) {
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

    if (room.hostId !== participantId) {
      sendTo(socket, createWsError(ERROR_CODE.NOT_HOST, ERROR_MESSAGE[ERROR_CODE.NOT_HOST]));
      return null;
    }

    return { room, participantId };
  }

  function getValidatedRoomWithPermission(
    socket: WebSocket,
    permission: 'canPlayPause' | 'canSeek',
  ): { room: Room; participantId: string } | null {
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

    // Host always has full permissions
    if (room.hostId === participantId) {
      return { room, participantId };
    }

    // Non-host: check room-level permissions
    if (!room.permissions[permission]) {
      sendTo(socket, createWsError(ERROR_CODE.PERMISSION_DENIED, ERROR_MESSAGE[ERROR_CODE.PERMISSION_DENIED]));
      return null;
    }

    return { room, participantId };
  }

  function isValidPositionMs(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
  }

  function validateSyncPayload(socket: WebSocket, payload: unknown): payload is { positionMs: number } {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !isValidPositionMs((payload as Record<string, unknown>).positionMs)
    ) {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, 'positionMs must be a finite non-negative number'));
      return false;
    }
    return true;
  }

  function getValidatedRoomAnyParticipant(socket: WebSocket): { room: Room; participantId: string } | null {
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

  function handleBufferStart(socket: WebSocket, msg: WsMessage): void {
    const result = getValidatedRoomAnyParticipant(socket);
    if (!result) return;
    if (!validateSyncPayload(socket, msg.payload)) return;

    const { room, participantId } = result;
    const payload = msg.payload as SyncBufferStartPayload;

    // If someone is already causing a buffer pause, ignore subsequent buffer-starts
    if (room.bufferingParticipantId !== null) return;

    const participant = room.participants.get(participantId);
    if (!participant) return;

    room.bufferingParticipantId = participantId;
    room.playbackState = {
      positionMs: payload.positionMs,
      isPlaying: false,
      lastUpdated: Date.now(),
    };

    const serverTimestamp = Date.now();
    broadcastToRoom(room, createWsMessage(SYNC_MESSAGE_TYPE.PAUSE, {
      positionMs: payload.positionMs,
      serverTimestamp,
      bufferPausedBy: participant.displayName,
    } satisfies SyncPausePayload));
  }

  function handleBufferEnd(socket: WebSocket, msg: WsMessage): void {
    const result = getValidatedRoomAnyParticipant(socket);
    if (!result) return;
    if (!validateSyncPayload(socket, msg.payload)) return;

    const { room, participantId } = result;
    const payload = msg.payload as SyncBufferEndPayload;

    // Only the participant who triggered the pause can resume
    if (room.bufferingParticipantId !== participantId) return;

    room.bufferingParticipantId = null;
    const serverTimestamp = Date.now();

    room.playbackState = {
      positionMs: payload.positionMs,
      isPlaying: true,
      lastUpdated: serverTimestamp,
    };

    broadcastToRoom(room, createWsMessage(SYNC_MESSAGE_TYPE.PLAY, {
      positionMs: payload.positionMs,
      serverTimestamp,
    } satisfies SyncPlayPayload));
  }

  function handleSyncPlay(socket: WebSocket, msg: WsMessage): void {
    const result = getValidatedRoomWithPermission(socket, 'canPlayPause');
    if (!result) return;
    if (!validateSyncPayload(socket, msg.payload)) return;

    const { room } = result;
    const payload = msg.payload as SyncPlayPayload;
    const serverTimestamp = Date.now();

    room.playbackState = {
      positionMs: payload.positionMs,
      isPlaying: true,
      lastUpdated: serverTimestamp,
    };

    broadcastToRoom(room, createWsMessage(SYNC_MESSAGE_TYPE.PLAY, {
      positionMs: payload.positionMs,
      serverTimestamp,
    } satisfies SyncPlayPayload));
  }

  function handleSyncPause(socket: WebSocket, msg: WsMessage): void {
    const result = getValidatedRoomWithPermission(socket, 'canPlayPause');
    if (!result) return;
    if (!validateSyncPayload(socket, msg.payload)) return;

    const { room } = result;
    const payload = msg.payload as SyncPausePayload;
    const serverTimestamp = Date.now();

    room.playbackState = {
      positionMs: payload.positionMs,
      isPlaying: false,
      lastUpdated: serverTimestamp,
    };

    broadcastToRoom(room, createWsMessage(SYNC_MESSAGE_TYPE.PAUSE, {
      positionMs: payload.positionMs,
      serverTimestamp,
    } satisfies SyncPausePayload));
  }

  function handleSyncSeek(socket: WebSocket, msg: WsMessage): void {
    const result = getValidatedRoomWithPermission(socket, 'canSeek');
    if (!result) return;
    if (!validateSyncPayload(socket, msg.payload)) return;

    const { room } = result;
    const payload = msg.payload as SyncSeekPayload;
    const serverTimestamp = Date.now();

    const wasPlaying = room.playbackState?.isPlaying ?? false;

    room.playbackState = {
      positionMs: payload.positionMs,
      isPlaying: wasPlaying,
      lastUpdated: serverTimestamp,
    };

    broadcastToRoom(room, createWsMessage(SYNC_MESSAGE_TYPE.SEEK, {
      positionMs: payload.positionMs,
      serverTimestamp,
    } satisfies SyncSeekPayload));
  }

  function handleSyncMessage(socket: WebSocket, msg: WsMessage): void {
    switch (msg.type) {
      case SYNC_MESSAGE_TYPE.PLAY:
        handleSyncPlay(socket, msg);
        break;
      case SYNC_MESSAGE_TYPE.PAUSE:
        handleSyncPause(socket, msg);
        break;
      case SYNC_MESSAGE_TYPE.SEEK:
        handleSyncSeek(socket, msg);
        break;
      case SYNC_MESSAGE_TYPE.BUFFER_START:
        handleBufferStart(socket, msg);
        break;
      case SYNC_MESSAGE_TYPE.BUFFER_END:
        handleBufferEnd(socket, msg);
        break;
    }
  }

  return { handleSyncMessage };
}
