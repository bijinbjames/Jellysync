import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type { RoomManager } from '../rooms/index.js';
import type { Room } from '../rooms/types.js';
import {
  isWsMessage,
  isClientRoomMessageType,
  createWsError,
  createWsMessage,
  ERROR_CODE,
  ERROR_MESSAGE,
  ROOM_MESSAGE_TYPE,
  WS_RECONNECT,
  type WsMessage,
  type RoomStatePayload,
  type Participant as SharedParticipant,
} from '@jellysync/shared';

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
  function broadcastToRoom(room: Room, payloadBuilder: (participantId: string) => WsMessage): void;
  function broadcastToRoom(room: Room, msgOrBuilder: WsMessage | ((participantId: string) => WsMessage)): void {
    for (const participant of room.participants.values()) {
      const conn = participantToConnection.get(participant.id);
      if (conn) {
        const message = typeof msgOrBuilder === 'function' ? msgOrBuilder(participant.id) : msgOrBuilder;
        sendTo(conn, message);
      }
    }
  }

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
    const payload = msg.payload as { displayName?: string };
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
    log.info({ roomCode: room.code, hostId: participantId }, 'Room created');

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

  function handleRoomLeave(
    socket: WebSocket,
    log: FastifyInstance['log'],
  ): void {
    const participantId = connectionToParticipant.get(socket);
    if (!participantId) {
      sendTo(socket, createWsError(ERROR_CODE.NOT_IN_ROOM, ERROR_MESSAGE[ERROR_CODE.NOT_IN_ROOM], ROOM_MESSAGE_TYPE.LEAVE));
      return;
    }

    cancelGraceTimer(participantId);
    const room = roomManager.removeParticipant(participantId);
    connectionToParticipant.delete(socket);
    participantToConnection.delete(participantId);

    log.info({ participantId }, 'Participant left room');

    if (room) {
      broadcastToRoom(room, (pid) =>
        createWsMessage(ROOM_MESSAGE_TYPE.STATE, roomToStatePayload(room, pid)),
      );
    } else {
      // Room destroyed (last participant left) — notify the leaving socket
      sendTo(socket, createWsMessage(ROOM_MESSAGE_TYPE.CLOSE, { reason: 'Room ended' }));
    }
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
        const room = roomManager.removeParticipant(participantId);
        log.info({ participantId }, 'Grace period expired, participant removed');

        if (room) {
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
