import { describe, it, expect } from 'vitest';
import {
  isWsMessage,
  isRoomMessage,
  isValidRoomMessageType,
  isClientRoomMessageType,
  createWsMessage,
  createWsError,
  type WsMessage,
} from './messages.js';

describe('isWsMessage', () => {
  it('returns true for valid WsMessage', () => {
    expect(isWsMessage({ type: 'room:create', payload: {}, timestamp: 1234 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isWsMessage(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isWsMessage('string')).toBe(false);
    expect(isWsMessage(42)).toBe(false);
  });

  it('returns false for missing type', () => {
    expect(isWsMessage({ payload: {}, timestamp: 1234 })).toBe(false);
  });

  it('returns false for missing payload', () => {
    expect(isWsMessage({ type: 'room:create', timestamp: 1234 })).toBe(false);
  });

  it('returns false for missing timestamp', () => {
    expect(isWsMessage({ type: 'room:create', payload: {} })).toBe(false);
  });

  it('returns false for non-string type', () => {
    expect(isWsMessage({ type: 123, payload: {}, timestamp: 1234 })).toBe(false);
  });

  it('returns false for non-number timestamp', () => {
    expect(isWsMessage({ type: 'room:create', payload: {}, timestamp: '1234' })).toBe(false);
  });
});

describe('isRoomMessage', () => {
  it('returns true for room: prefixed messages', () => {
    const msg: WsMessage = { type: 'room:create', payload: {}, timestamp: 1234 };
    expect(isRoomMessage(msg)).toBe(true);
  });

  it('returns true for room:state messages', () => {
    const msg: WsMessage = { type: 'room:state', payload: {}, timestamp: 1234 };
    expect(isRoomMessage(msg)).toBe(true);
  });

  it('returns false for non-room messages', () => {
    const msg: WsMessage = { type: 'sync:play', payload: {}, timestamp: 1234 };
    expect(isRoomMessage(msg)).toBe(false);
  });
});

describe('isValidRoomMessageType', () => {
  it('returns true for all valid room message types', () => {
    expect(isValidRoomMessageType('room:create')).toBe(true);
    expect(isValidRoomMessageType('room:join')).toBe(true);
    expect(isValidRoomMessageType('room:rejoin')).toBe(true);
    expect(isValidRoomMessageType('room:leave')).toBe(true);
    expect(isValidRoomMessageType('room:close')).toBe(true);
    expect(isValidRoomMessageType('room:state')).toBe(true);
  });

  it('returns false for invalid types', () => {
    expect(isValidRoomMessageType('room:invalid')).toBe(false);
    expect(isValidRoomMessageType('sync:play')).toBe(false);
    expect(isValidRoomMessageType('')).toBe(false);
  });
});

describe('isClientRoomMessageType', () => {
  it('returns true for client-to-server message types', () => {
    expect(isClientRoomMessageType('room:create')).toBe(true);
    expect(isClientRoomMessageType('room:join')).toBe(true);
    expect(isClientRoomMessageType('room:rejoin')).toBe(true);
    expect(isClientRoomMessageType('room:leave')).toBe(true);
  });

  it('returns false for server-to-client message types', () => {
    expect(isClientRoomMessageType('room:close')).toBe(false);
    expect(isClientRoomMessageType('room:state')).toBe(false);
  });

  it('returns false for invalid types', () => {
    expect(isClientRoomMessageType('room:invalid')).toBe(false);
    expect(isClientRoomMessageType('')).toBe(false);
  });
});

describe('createWsMessage', () => {
  it('creates a message with correct structure', () => {
    const msg = createWsMessage('room:create', { displayName: 'Alice' });
    expect(msg.type).toBe('room:create');
    expect(msg.payload).toEqual({ displayName: 'Alice' });
    expect(typeof msg.timestamp).toBe('number');
    expect(msg.timestamp).toBeGreaterThan(0);
  });
});

describe('createWsError', () => {
  it('creates an error with correct structure', () => {
    const err = createWsError('ROOM_NOT_FOUND', 'Room not found', 'room:join');
    expect(err.type).toBe('error');
    expect(err.payload.code).toBe('ROOM_NOT_FOUND');
    expect(err.payload.message).toBe('Room not found');
    expect(err.payload.context).toBe('room:join');
    expect(typeof err.timestamp).toBe('number');
  });

  it('creates an error without context', () => {
    const err = createWsError('INVALID_MESSAGE', 'Invalid message');
    expect(err.payload.context).toBeUndefined();
  });
});
