// Message namespace constants
export const MESSAGE_NAMESPACE = {
  ROOM: 'room',
} as const;

// Room message types
export const ROOM_MESSAGE_TYPE = {
  CREATE: 'room:create',
  JOIN: 'room:join',
  REJOIN: 'room:rejoin',
  LEAVE: 'room:leave',
  CLOSE: 'room:close',
  STATE: 'room:state',
} as const;

// Error codes
export const ERROR_CODE = {
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  ALREADY_IN_ROOM: 'ALREADY_IN_ROOM',
  NOT_IN_ROOM: 'NOT_IN_ROOM',
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
