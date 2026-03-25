// WebSocket message protocol types for JellySync signaling

export interface WsMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

export interface WsError {
  type: 'error';
  payload: {
    code: string;
    message: string;
    context?: string;
  };
  timestamp: number;
}

// Participant type used in room state
export interface Participant {
  id: string;
  displayName: string;
  joinedAt: number;
  isHost: boolean;
}

// --- Room message payloads ---

export interface RoomCreatePayload {
  displayName: string;
}

export interface RoomJoinPayload {
  roomCode: string;
  displayName: string;
}

export interface RoomRejoinPayload {
  roomCode: string;
  participantId: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RoomLeavePayload {}

export interface RoomClosePayload {
  reason: string;
}

export interface RoomMoviePayload {
  id: string;
  name: string;
  year?: number;
  runtimeTicks?: number;
  imageTag?: string;
}

export interface RoomMovieSelectPayload {
  movie: RoomMoviePayload | null;
}

export interface RoomStatePayload {
  roomCode: string;
  hostId: string;
  participants: Participant[];
  participantId?: string;
  movie?: RoomMoviePayload | null;
}

// --- Discriminated union types ---

export interface RoomCreateMessage extends WsMessage<RoomCreatePayload> {
  type: 'room:create';
}

export interface RoomJoinMessage extends WsMessage<RoomJoinPayload> {
  type: 'room:join';
}

export interface RoomRejoinMessage extends WsMessage<RoomRejoinPayload> {
  type: 'room:rejoin';
}

export interface RoomLeaveMessage extends WsMessage<RoomLeavePayload> {
  type: 'room:leave';
}

export interface RoomCloseMessage extends WsMessage<RoomClosePayload> {
  type: 'room:close';
}

export interface RoomStateMessage extends WsMessage<RoomStatePayload> {
  type: 'room:state';
}

export interface RoomMovieSelectMessage extends WsMessage<RoomMovieSelectPayload> {
  type: 'room:movie:select';
}

export type RoomMessage =
  | RoomCreateMessage
  | RoomJoinMessage
  | RoomRejoinMessage
  | RoomLeaveMessage
  | RoomCloseMessage
  | RoomStateMessage
  | RoomMovieSelectMessage;

// --- Type guards ---

export function isWsMessage(data: unknown): data is WsMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as WsMessage).type === 'string' &&
    'payload' in data &&
    typeof (data as WsMessage).timestamp === 'number'
  );
}

export function isRoomMessage(msg: WsMessage): msg is RoomMessage {
  return typeof msg.type === 'string' && msg.type.startsWith('room:');
}

const ROOM_MESSAGE_TYPES = new Set([
  'room:create',
  'room:join',
  'room:rejoin',
  'room:leave',
  'room:close',
  'room:state',
  'room:movie:select',
]);

// Client-to-server only message types
const CLIENT_ROOM_MESSAGE_TYPES = new Set([
  'room:create',
  'room:join',
  'room:rejoin',
  'room:leave',
  'room:movie:select',
]);

export function isValidRoomMessageType(type: string): boolean {
  return ROOM_MESSAGE_TYPES.has(type);
}

export function isClientRoomMessageType(type: string): boolean {
  return CLIENT_ROOM_MESSAGE_TYPES.has(type);
}

export function createWsMessage<T>(type: string, payload: T): WsMessage<T> {
  return { type, payload, timestamp: Date.now() };
}

export function createWsError(code: string, message: string, context?: string): WsError {
  return {
    type: 'error',
    payload: { code, message, context },
    timestamp: Date.now(),
  };
}
