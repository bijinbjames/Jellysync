import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type { RoomManager } from '../rooms/index.js';
import type { Room } from '../rooms/types.js';
import {
  isWsMessage,
  isClientRoomMessageType,
  isClientSyncMessageType,
  isClientParticipantMessageType,
  isClientSignalMessageType,
  createWsError,
  createWsMessage,
  ERROR_CODE,
  ERROR_MESSAGE,
  PARTICIPANT_MESSAGE_TYPE,
  ROOM_MESSAGE_TYPE,
  SIGNAL_MESSAGE_TYPE,
  SYNC_MESSAGE_TYPE,
  WS_RECONNECT,
  type WsMessage,
  type RoomStatePayload,
  type SyncPlayPayload,
  type Participant as SharedParticipant,
  type RoomMovieSelectPayload,
} from '@jellysync/shared';
import { createSyncHandler } from '../sync/sync-handler.js';
import { createPermissionHandler } from '../rooms/permissions.js';
import { createSteppedAwayHandler } from '../rooms/stepped-away.js';
import { createMicStateHandler } from '../rooms/mic-state.js';
import { createSignalingHandler } from './signaling-handler.js';

const MAX_DISPLAY_NAME_LENGTH = 50;

function roomToStatePayload(room: Room, forParticipantId?: string): RoomStatePayload {
  const participants: SharedParticipant[] = Array.from(room.participants.values()).map((p) => ({
    id: p.id,
    displayName: p.displayName,
    joinedAt: p.joinedAt,
    isHost: p.isHost,
  }));

  return {
    roomCode: room.code,
    hostId: room.hostId,
    participants,
    movie: room.movie,
    playback: room.playbackState
      ? {
          positionMs: room.playbackState.positionMs,
          isPlaying: room.playbackState.isPlaying,
          lastUpdated: room.playbackState.lastUpdated,
        }
      : null,
    permissions: room.permissions,
    steppedAwayParticipants: Array.from(room.steppedAwayParticipants),
    ...(forParticipantId ? { participantId: forParticipantId } : {}),
  };
}

function sendTo(socket: WebSocket, message: WsMessage | ReturnType<typeof createWsError>): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function validateDisplayName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

export function registerWebSocketHandler(server: FastifyInstance, roomManager: RoomManager) {
  const connectionToParticipant = new Map<WebSocket, string>();
  const participantToConnection = new Map<string, WebSocket>();
  const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function generateParticipantId(): string {
    return randomUUID();
  }

  function broadcastToRoom(room: Room, message: WsMessage): void;
  function broadcastToRoom(room: Room, message: WsMessage, excludeParticipantId: string): void;
  function broadcastToRoom(room: Room, payloadBuilder: (participantId: string) => WsMessage): void;
  function broadcastToRoom(room: Room, msgOrBuilder: WsMessage | ((participantId: string) => WsMessage), excludeParticipantId?: string): void {
    for (const participant of room.participants.values()) {
      if (excludeParticipantId && participant.id === excludeParticipantId) continue;
      const conn = participantToConnection.get(participant.id);
      if (conn) {
        const message = typeof msgOrBuilder === 'function' ? msgOrBuilder(participant.id) : msgOrBuilder;
        sendTo(conn, message);
      }
    }
  }

  const syncHandler = createSyncHandler({
    roomManager,
    getParticipantId: (socket) => connectionToParticipant.get(socket),
    sendTo,
    broadcastToRoom,
  });

  const permissionHandler = createPermissionHandler({
    roomManager,
    getParticipantId: (socket) => connectionToParticipant.get(socket),
    sendTo,
    broadcastToRoom,
  });

  const steppedAwayHandler = createSteppedAwayHandler({
    roomManager,
    getParticipantId: (socket) => connectionToParticipant.get(socket),
    sendTo,
    broadcastToRoom,
  });

  const micStateHandler = createMicStateHandler({
    roomManager,
    getParticipantId: (socket) => connectionToParticipant.get(socket),
    sendTo,
    broadcastToRoom,
  });

  const signalingHandler = createSignalingHandler({
    roomManager,
    getParticipantId: (socket) => connectionToParticipant.get(socket),
    sendTo,
    getSocketByParticipantId: (id) => participantToConnection.get(id),
  });

  function cancelGraceTimer(participantId: string): void {
    const timer = disconnectTimers.get(participantId);
    if (timer) {
      clearTimeout(timer);
      disconnectTimers.delete(participantId);
    }
  }

  function handleRoomCreate(
    socket: WebSocket,
    msg: WsMessage,
    log: FastifyInstance['log'],
  ): void {
    const payload = msg.payload as { displayName?: string; movie?: { id: string; name: string } | null };
    const displayName = validateDisplayName(payload?.displayName);
    if (!displayName) {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, ERROR_MESSAGE[ERROR_CODE.INVALID_PAYLOAD], ROOM_MESSAGE_TYPE.CREATE));
      return;
    }

    // Check if already in a room
    const existingId = connectionToParticipant.get(socket);
    if (existingId && roomManager.isInRoom(existingId)) {
      sendTo(socket, createWsError(ERROR_CODE.ALREADY_IN_ROOM, ERROR_MESSAGE[ERROR_CODE.ALREADY_IN_ROOM], ROOM_MESSAGE_TYPE.CREATE));
      return;
    }

    const participantId = generateParticipantId();
    connectionToParticipant.set(socket, participantId);
    participantToConnection.set(participantId, socket);

    const room = roomManager.createRoom(participantId, displayName);

    // Set initial movie if provided with room creation
    if (payload.movie) {
      room.movie = payload.movie as Room['movie'];
    }

    log.info({ roomCode: room.code, hostId: participantId, movieId: payload.movie?.id ?? null }, 'Room created');

    sendTo(socket, createWsMessage(ROOM_MESSAGE_TYPE.STATE, roomToStatePayload(room, participantId)));
  }

  function handleRoomJoin(
    socket: WebSocket,
    msg: WsMessage,
    log: FastifyInstance['log'],
  ): void {
    const payload = msg.payload as { roomCode?: string; displayName?: string };
    const displayName = validateDisplayName(payload?.displayName);
    if (!displayName || typeof payload?.roomCode !== 'string') {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, ERROR_MESSAGE[ERROR_CODE.INVALID_PAYLOAD], ROOM_MESSAGE_TYPE.JOIN));
      return;
    }

    // Check if already in a room
    const existingId = connectionToParticipant.get(socket);
    if (existingId && roomManager.isInRoom(existingId)) {
      sendTo(socket, createWsError(ERROR_CODE.ALREADY_IN_ROOM, ERROR_MESSAGE[ERROR_CODE.ALREADY_IN_ROOM], ROOM_MESSAGE_TYPE.JOIN));
      return;
    }

    const participantId = generateParticipantId();
    connectionToParticipant.set(socket, participantId);
    participantToConnection.set(participantId, socket);

    const result = roomManager.joinRoom(payload.roomCode, participantId, displayName);
    if (result === null) {
      sendTo(socket, createWsError(ERROR_CODE.ROOM_NOT_FOUND, ERROR_MESSAGE[ERROR_CODE.ROOM_NOT_FOUND], ROOM_MESSAGE_TYPE.JOIN));
      return;
    }
    if (result === 'full') {
      sendTo(socket, createWsError(ERROR_CODE.ROOM_FULL, ERROR_MESSAGE[ERROR_CODE.ROOM_FULL], ROOM_MESSAGE_TYPE.JOIN));
      return;
    }

    log.info({ roomCode: result.code, participantId }, 'Participant joined room');
    broadcastToRoom(result, (pid) =>
      createWsMessage(ROOM_MESSAGE_TYPE.STATE, roomToStatePayload(result, pid)),
    );
  }

  function handleRoomRejoin(
    socket: WebSocket,
    msg: WsMessage,
    log: FastifyInstance['log'],
  ): void {
    const payload = msg.payload as { roomCode?: string; participantId?: string };
    if (!payload || typeof payload.roomCode !== 'string' || typeof payload.participantId !== 'string') {
      sendTo(socket, createWsError(ERROR_CODE.INVALID_PAYLOAD, ERROR_MESSAGE[ERROR_CODE.INVALID_PAYLOAD], ROOM_MESSAGE_TYPE.REJOIN));
      return;
    }

    const room = roomManager.getRoom(payload.roomCode);
    if (!room) {
      sendTo(socket, createWsError(ERROR_CODE.ROOM_NOT_FOUND, ERROR_MESSAGE[ERROR_CODE.ROOM_NOT_FOUND], ROOM_MESSAGE_TYPE.REJOIN));
      return;
    }

    const participant = room.participants.get(payload.participantId);
    if (!participant) {
      sendTo(socket, createWsError(ERROR_CODE.PARTICIPANT_NOT_FOUND, ERROR_MESSAGE[ERROR_CODE.PARTICIPANT_NOT_FOUND], ROOM_MESSAGE_TYPE.REJOIN));
      return;
    }

    // Cancel any pending grace timer for this participant
    cancelGraceTimer(payload.participantId);

    // Remove old socket mapping if it exists
    const oldSocket = participantToConnection.get(payload.participantId);
    if (oldSocket && oldSocket !== socket) {
      connectionToParticipant.delete(oldSocket);
    }

    // Update connection mappings for the reconnected participant
    connectionToParticipant.set(socket, payload.participantId);
    participantToConnection.set(payload.participantId, socket);

    log.info({ roomCode: room.code, participantId: payload.participantId }, 'Participant rejoined room');
    sendTo(socket, createWsMessage(ROOM_MESSAGE_TYPE.STATE, roomToStatePayload(room, payload.participantId)));
  }

  function clearBufferPauseIfNeeded(participantId: string, room: Room): void {
    if (room.bufferingParticipantId === participantId) {
      room.bufferingParticipantId = null;
      if (!room.playbackState) return;
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

  function clearSteppedAwayPauseIfNeeded(room: Room): void {
    if (room.steppedAwayParticipants.size === 0 && room.playbackState && !room.playbackState.isPlaying) {
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

  function handleRoomLeave(
    socket: WebSocket,
    log: FastifyInstance['log'],
  ): void {
    const participantId = connectionToParticipant.get(socket);
    if (!participantId) {
      sendTo(socket, createWsError(ERROR_CODE.NOT_IN_ROOM, ERROR_MESSAGE[ERROR_CODE.NOT_IN_ROOM], ROOM_MESSAGE_TYPE.LEAVE));
      return;
    }

    // Check if leaving participant was causing buffer pause before removing
    const roomBeforeLeave = roomManager.getRoomByParticipant(participantId);
    if (roomBeforeLeave) {
      clearBufferPauseIfNeeded(participantId, roomBeforeLeave);
    }

    cancelGraceTimer(participantId);
    const room = roomManager.removeParticipant(participantId);
    connectionToParticipant.delete(socket);
    participantToConnection.delete(participantId);

    log.info({ participantId }, 'Participant left room');

    if (room) {
      clearSteppedAwayPauseIfNeeded(room);
      broadcastToRoom(room, (pid) =>
        createWsMessage(ROOM_MESSAGE_TYPE.STATE, roomToStatePayload(room, pid)),
      );
    } else {
      // Room destroyed (last participant left) — notify the leaving socket
      sendTo(socket, createWsMessage(ROOM_MESSAGE_TYPE.CLOSE, { reason: 'Room ended' }));
    }
  }

  function handleMovieSelect(
    socket: WebSocket,
    msg: WsMessage,
    log: FastifyInstance['log'],
  ): void {
    const participantId = connectionToParticipant.get(socket);
    if (!participantId) {
      sendTo(socket, createWsError(ERROR_CODE.NOT_IN_ROOM, ERROR_MESSAGE[ERROR_CODE.NOT_IN_ROOM], ROOM_MESSAGE_TYPE.MOVIE_SELECT));
      return;
    }

    const room = roomManager.getRoomByParticipant(participantId);
    if (!room) {
      sendTo(socket, createWsError(ERROR_CODE.NOT_IN_ROOM, ERROR_MESSAGE[ERROR_CODE.NOT_IN_ROOM], ROOM_MESSAGE_TYPE.MOVIE_SELECT));
      return;
    }

    if (room.hostId !== participantId) {
      sendTo(socket, createWsError(ERROR_CODE.NOT_HOST, ERROR_MESSAGE[ERROR_CODE.NOT_HOST], ROOM_MESSAGE_TYPE.MOVIE_SELECT));
      return;
    }

    const payload = msg.payload as RoomMovieSelectPayload;
    const movie = payload?.movie ?? null;
    room.movie = movie;
    room.playbackState = null;
    room.bufferingParticipantId = null;

    log.info({ roomCode: room.code, movieId: movie?.id ?? null }, 'Movie selected');

    // Broadcast updated state to all participants
    broadcastToRoom(room, (pid) =>
      createWsMessage(ROOM_MESSAGE_TYPE.STATE, roomToStatePayload(room, pid)),
    );
  }

  function handleDisconnect(
    socket: WebSocket,
    log: FastifyInstance['log'],
  ): void {
    const participantId = connectionToParticipant.get(socket);
    if (!participantId) return;

    // Only process if this socket is still the active one for this participant
    const activeSocket = participantToConnection.get(participantId);
    if (activeSocket !== socket) {
      connectionToParticipant.delete(socket);
      return;
    }

    connectionToParticipant.delete(socket);
    participantToConnection.delete(participantId);

    // If participant is in a room, start grace period instead of immediate removal
    if (roomManager.isInRoom(participantId)) {
      log.info({ participantId }, 'Connection closed, starting grace period');

      const timer = setTimeout(() => {
        disconnectTimers.delete(participantId);
        // Clear buffer pause if the disconnecting participant was buffering
        const roomBeforeRemove = roomManager.getRoomByParticipant(participantId);
        if (roomBeforeRemove) {
          clearBufferPauseIfNeeded(participantId, roomBeforeRemove);
        }
        const room = roomManager.removeParticipant(participantId);
        log.info({ participantId }, 'Grace period expired, participant removed');

        if (room) {
          clearSteppedAwayPauseIfNeeded(room);
          broadcastToRoom(room, (pid) =>
            createWsMessage(ROOM_MESSAGE_TYPE.STATE, roomToStatePayload(room, pid)),
          );
        }
        // When room is destroyed (null), no remaining connections to notify
      }, WS_RECONNECT.DISCONNECT_GRACE_MS);

      disconnectTimers.set(participantId, timer);
    }
  }

  server.get('/ws', { websocket: true }, (socket) => {
    server.log.info('WebSocket connection established');

    socket.on('message', (rawData: { toString(): string }) => {
      let data: unknown;
      try {
        data = JSON.parse(rawData.toString());
      } catch {
        sendTo(socket, createWsError(ERROR_CODE.INVALID_MESSAGE, ERROR_MESSAGE[ERROR_CODE.INVALID_MESSAGE]));
        return;
      }

      if (!isWsMessage(data)) {
        sendTo(socket, createWsError(ERROR_CODE.INVALID_MESSAGE, ERROR_MESSAGE[ERROR_CODE.INVALID_MESSAGE]));
        return;
      }

      if (isClientSignalMessageType(data.type)) {
        if (data.type === SIGNAL_MESSAGE_TYPE.OFFER) {
          signalingHandler.handleSignalOffer(socket, data);
        } else if (data.type === SIGNAL_MESSAGE_TYPE.ANSWER) {
          signalingHandler.handleSignalAnswer(socket, data);
        } else if (data.type === SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE) {
          signalingHandler.handleSignalIceCandidate(socket, data);
        }
        return;
      }

      if (isClientSyncMessageType(data.type)) {
        syncHandler.handleSyncMessage(socket, data);
        return;
      }

      if (isClientParticipantMessageType(data.type)) {
        if (data.type === PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY) {
          steppedAwayHandler.handleSteppedAway(socket, data);
        } else if (data.type === PARTICIPANT_MESSAGE_TYPE.RETURNED) {
          steppedAwayHandler.handleReturned(socket, data);
        } else if (data.type === PARTICIPANT_MESSAGE_TYPE.MIC_STATE) {
          micStateHandler.handleMicState(socket, data);
        } else {
          permissionHandler.handleParticipantMessage(socket, data);
        }
        return;
      }

      if (!isClientRoomMessageType(data.type)) {
        sendTo(socket, createWsError(ERROR_CODE.UNKNOWN_MESSAGE_TYPE, ERROR_MESSAGE[ERROR_CODE.UNKNOWN_MESSAGE_TYPE], data.type));
        return;
      }

      switch (data.type) {
        case ROOM_MESSAGE_TYPE.CREATE:
          handleRoomCreate(socket, data, server.log);
          break;
        case ROOM_MESSAGE_TYPE.JOIN:
          handleRoomJoin(socket, data, server.log);
          break;
        case ROOM_MESSAGE_TYPE.REJOIN:
          handleRoomRejoin(socket, data, server.log);
          break;
        case ROOM_MESSAGE_TYPE.LEAVE:
          handleRoomLeave(socket, server.log);
          break;
        case ROOM_MESSAGE_TYPE.MOVIE_SELECT:
          handleMovieSelect(socket, data, server.log);
          break;
        default:
          sendTo(socket, createWsError(ERROR_CODE.UNKNOWN_MESSAGE_TYPE, ERROR_MESSAGE[ERROR_CODE.UNKNOWN_MESSAGE_TYPE], data.type));
      }
    });

    socket.on('close', () => {
      handleDisconnect(socket, server.log);
    });
  });

  return { connectionToParticipant, participantToConnection, disconnectTimers };
}
