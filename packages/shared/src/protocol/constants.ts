// Message namespace constants
export const MESSAGE_NAMESPACE = {
  ROOM: 'room',
  SYNC: 'sync',
  PARTICIPANT: 'participant',
} as const;

// Room message types
export const ROOM_MESSAGE_TYPE = {
  CREATE: 'room:create',
  JOIN: 'room:join',
  REJOIN: 'room:rejoin',
  LEAVE: 'room:leave',
  CLOSE: 'room:close',
  STATE: 'room:state',
  MOVIE_SELECT: 'room:movie:select',
} as const;

// Sync message types
export const SYNC_MESSAGE_TYPE = {
  PLAY: 'sync:play',
  PAUSE: 'sync:pause',
  SEEK: 'sync:seek',
  STATE: 'sync:state',
  BUFFER_START: 'sync:buffer-start',
  BUFFER_END: 'sync:buffer-end',
} as const;

// Participant message types
export const PARTICIPANT_MESSAGE_TYPE = {
  PERMISSION_UPDATE: 'participant:permission-update',
  STEPPED_AWAY: 'participant:stepped-away',
  RETURNED: 'participant:returned',
} as const;

// Signal message types (WebRTC signaling)
export const SIGNAL_MESSAGE_TYPE = {
  OFFER: 'signal:offer',
  ANSWER: 'signal:answer',
  ICE_CANDIDATE: 'signal:ice-candidate',
} as const;

// Sync engine constants
export const SYNC_CONFIG = {
  SYNC_THRESHOLD_MS: 500,
  FORCE_SEEK_THRESHOLD_MS: 2000,
  DRIFT_CHECK_INTERVAL_MS: 2000,
  MAX_CORRECTIONS_PER_WINDOW: 3,
  CORRECTION_WINDOW_MS: 10000,
  SEEK_SETTLE_MS: 2000,
} as const;

// Error codes
export const ERROR_CODE = {
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  ALREADY_IN_ROOM: 'ALREADY_IN_ROOM',
  NOT_IN_ROOM: 'NOT_IN_ROOM',
  NOT_HOST: 'NOT_HOST',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PARTICIPANT_NOT_FOUND: 'PARTICIPANT_NOT_FOUND',
  UNKNOWN_MESSAGE_TYPE: 'UNKNOWN_MESSAGE_TYPE',
} as const;

// User-friendly error messages
export const ERROR_MESSAGE: Record<string, string> = {
  [ERROR_CODE.ROOM_NOT_FOUND]: 'That room doesn\'t exist or has already ended.',
  [ERROR_CODE.ROOM_FULL]: 'This room is full. Try again later.',
  [ERROR_CODE.INVALID_MESSAGE]: 'Something went wrong with the message format.',
  [ERROR_CODE.INVALID_PAYLOAD]: 'The message was missing required information.',
  [ERROR_CODE.ALREADY_IN_ROOM]: 'You\'re already in a room.',
  [ERROR_CODE.NOT_IN_ROOM]: 'You\'re not in a room.',
  [ERROR_CODE.NOT_HOST]: 'Only the host can do that.',
  [ERROR_CODE.PERMISSION_DENIED]: 'You do not have permission to do that.',
  [ERROR_CODE.PARTICIPANT_NOT_FOUND]: 'Could not find your session in the room.',
  [ERROR_CODE.UNKNOWN_MESSAGE_TYPE]: 'Unknown message type received.',
};

// Room configuration
export const ROOM_CONFIG = {
  CODE_LENGTH: 6,
  MAX_PARTICIPANTS: 20,
  CODE_CHARS: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', // Excludes ambiguous: 0/O, 1/I/L
} as const;

// WebSocket reconnection
export const WS_RECONNECT = {
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 30000,
  BACKOFF_MULTIPLIER: 2,
  DISCONNECT_GRACE_MS: 30000,
} as const;
