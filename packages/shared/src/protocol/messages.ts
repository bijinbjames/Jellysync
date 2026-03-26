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
  movie?: RoomMoviePayload | null;
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
  playback?: PlaybackStatePayload | null;
  permissions?: ParticipantPermissions;
}

// --- Sync message payloads ---

export interface SyncPlayPayload {
  positionMs: number;
  serverTimestamp: number;
}

export interface SyncPausePayload {
  positionMs: number;
  serverTimestamp: number;
  bufferPausedBy?: string;
}

export interface SyncSeekPayload {
  positionMs: number;
  serverTimestamp: number;
}

export interface SyncBufferStartPayload {
  participantId: string;
  displayName: string;
  positionMs: number;
}

export interface SyncBufferEndPayload {
  participantId: string;
  positionMs: number;
}

export interface SyncStatePayload {
  positionMs: number;
  isPlaying: boolean;
  serverTimestamp: number;
}

// --- Participant message payloads ---

export interface ParticipantPermissions {
  canPlayPause: boolean;
  canSeek: boolean;
}

export interface PermissionUpdatePayload {
  permissions: ParticipantPermissions;
  updatedBy: string;
}

// --- Playback state in room:state ---

export interface PlaybackStatePayload {
  positionMs: number;
  isPlaying: boolean;
  lastUpdated: number;
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

// --- Sync discriminated union types ---

export interface SyncPlayMessage extends WsMessage<SyncPlayPayload> {
  type: 'sync:play';
}

export interface SyncPauseMessage extends WsMessage<SyncPausePayload> {
  type: 'sync:pause';
}

export interface SyncSeekMessage extends WsMessage<SyncSeekPayload> {
  type: 'sync:seek';
}

export interface SyncStateMessage extends WsMessage<SyncStatePayload> {
  type: 'sync:state';
}

export interface SyncBufferStartMessage extends WsMessage<SyncBufferStartPayload> {
  type: 'sync:buffer-start';
}

export interface SyncBufferEndMessage extends WsMessage<SyncBufferEndPayload> {
  type: 'sync:buffer-end';
}

export type SyncMessage =
  | SyncPlayMessage
  | SyncPauseMessage
  | SyncSeekMessage
  | SyncStateMessage
  | SyncBufferStartMessage
  | SyncBufferEndMessage;

// --- Participant discriminated union types ---

export interface PermissionUpdateMessage extends WsMessage<PermissionUpdatePayload> {
  type: 'participant:permission-update';
}

export type ParticipantMessage = PermissionUpdateMessage;

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

// --- Sync type guards ---

const SYNC_MESSAGE_TYPES = new Set([
  'sync:play',
  'sync:pause',
  'sync:seek',
  'sync:state',
  'sync:buffer-start',
  'sync:buffer-end',
]);

const CLIENT_SYNC_MESSAGE_TYPES = new Set([
  'sync:play',
  'sync:pause',
  'sync:seek',
  'sync:buffer-start',
  'sync:buffer-end',
]);

export function isSyncMessage(msg: WsMessage): msg is SyncMessage {
  return typeof msg.type === 'string' && msg.type.startsWith('sync:');
}

export function isValidSyncMessageType(type: string): boolean {
  return SYNC_MESSAGE_TYPES.has(type);
}

export function isClientSyncMessageType(type: string): boolean {
  return CLIENT_SYNC_MESSAGE_TYPES.has(type);
}

// --- Participant type guards ---

const PARTICIPANT_MESSAGE_TYPES = new Set([
  'participant:permission-update',
]);

const CLIENT_PARTICIPANT_MESSAGE_TYPES = new Set([
  'participant:permission-update',
]);

export function isParticipantMessage(msg: WsMessage): msg is ParticipantMessage {
  return typeof msg.type === 'string' && msg.type.startsWith('participant:');
}

export function isValidParticipantMessageType(type: string): boolean {
  return PARTICIPANT_MESSAGE_TYPES.has(type);
}

export function isClientParticipantMessageType(type: string): boolean {
  return CLIENT_PARTICIPANT_MESSAGE_TYPES.has(type);
}

export function isValidPermissionUpdatePayload(payload: unknown): payload is PermissionUpdatePayload {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  if (typeof p.updatedBy !== 'string') return false;
  if (typeof p.permissions !== 'object' || p.permissions === null) return false;
  const perms = p.permissions as Record<string, unknown>;
  return typeof perms.canPlayPause === 'boolean' && typeof perms.canSeek === 'boolean';
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
