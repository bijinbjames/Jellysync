import { describe, it, expect } from 'vitest';
import {
  isSyncMessage,
  isValidSyncMessageType,
  isClientSyncMessageType,
  isRoomMessage,
  createWsMessage,
  type WsMessage,
} from './messages.js';

describe('isSyncMessage', () => {
  it('returns true for sync:play messages', () => {
    const msg: WsMessage = { type: 'sync:play', payload: { positionMs: 0, serverTimestamp: 0 }, timestamp: 1234 };
    expect(isSyncMessage(msg)).toBe(true);
  });

  it('returns true for sync:pause messages', () => {
    const msg: WsMessage = { type: 'sync:pause', payload: { positionMs: 0, serverTimestamp: 0 }, timestamp: 1234 };
    expect(isSyncMessage(msg)).toBe(true);
  });

  it('returns true for sync:seek messages', () => {
    const msg: WsMessage = { type: 'sync:seek', payload: { positionMs: 5000, serverTimestamp: 0 }, timestamp: 1234 };
    expect(isSyncMessage(msg)).toBe(true);
  });

  it('returns true for sync:state messages', () => {
    const msg: WsMessage = { type: 'sync:state', payload: { positionMs: 0, isPlaying: true, serverTimestamp: 0 }, timestamp: 1234 };
    expect(isSyncMessage(msg)).toBe(true);
  });

  it('returns false for room messages', () => {
    const msg: WsMessage = { type: 'room:create', payload: {}, timestamp: 1234 };
    expect(isSyncMessage(msg)).toBe(false);
  });

  it('returns false for error messages', () => {
    const msg: WsMessage = { type: 'error', payload: {}, timestamp: 1234 };
    expect(isSyncMessage(msg)).toBe(false);
  });
});

describe('isValidSyncMessageType', () => {
  it('returns true for all valid sync message types', () => {
    expect(isValidSyncMessageType('sync:play')).toBe(true);
    expect(isValidSyncMessageType('sync:pause')).toBe(true);
    expect(isValidSyncMessageType('sync:seek')).toBe(true);
    expect(isValidSyncMessageType('sync:state')).toBe(true);
  });

  it('returns false for invalid types', () => {
    expect(isValidSyncMessageType('sync:invalid')).toBe(false);
    expect(isValidSyncMessageType('room:create')).toBe(false);
    expect(isValidSyncMessageType('')).toBe(false);
  });
});

describe('isClientSyncMessageType', () => {
  it('returns true for client-to-server sync message types', () => {
    expect(isClientSyncMessageType('sync:play')).toBe(true);
    expect(isClientSyncMessageType('sync:pause')).toBe(true);
    expect(isClientSyncMessageType('sync:seek')).toBe(true);
  });

  it('returns false for server-only sync message types', () => {
    expect(isClientSyncMessageType('sync:state')).toBe(false);
  });

  it('returns false for non-sync types', () => {
    expect(isClientSyncMessageType('room:create')).toBe(false);
    expect(isClientSyncMessageType('')).toBe(false);
  });
});

describe('sync messages are not room messages', () => {
  it('sync:play is not a room message', () => {
    const msg: WsMessage = { type: 'sync:play', payload: {}, timestamp: 1234 };
    expect(isRoomMessage(msg)).toBe(false);
  });
});

describe('buffer message type guards', () => {
  it('isSyncMessage returns true for sync:buffer-start', () => {
    const msg: WsMessage = { type: 'sync:buffer-start', payload: { participantId: 'p1', displayName: 'Alice', positionMs: 0 }, timestamp: 1234 };
    expect(isSyncMessage(msg)).toBe(true);
  });

  it('isSyncMessage returns true for sync:buffer-end', () => {
    const msg: WsMessage = { type: 'sync:buffer-end', payload: { participantId: 'p1', positionMs: 0 }, timestamp: 1234 };
    expect(isSyncMessage(msg)).toBe(true);
  });

  it('isValidSyncMessageType recognizes buffer types', () => {
    expect(isValidSyncMessageType('sync:buffer-start')).toBe(true);
    expect(isValidSyncMessageType('sync:buffer-end')).toBe(true);
  });

  it('isClientSyncMessageType recognizes buffer types as client messages', () => {
    expect(isClientSyncMessageType('sync:buffer-start')).toBe(true);
    expect(isClientSyncMessageType('sync:buffer-end')).toBe(true);
  });
});

describe('createWsMessage with sync payloads', () => {
  it('creates a sync:play message', () => {
    const msg = createWsMessage('sync:play', { positionMs: 5000, serverTimestamp: Date.now() });
    expect(msg.type).toBe('sync:play');
    expect(msg.payload.positionMs).toBe(5000);
    expect(typeof msg.timestamp).toBe('number');
  });

  it('creates a sync:buffer-start message', () => {
    const msg = createWsMessage('sync:buffer-start', { participantId: 'p1', displayName: 'Alice', positionMs: 5000 });
    expect(msg.type).toBe('sync:buffer-start');
    expect(msg.payload.participantId).toBe('p1');
    expect(msg.payload.displayName).toBe('Alice');
    expect(msg.payload.positionMs).toBe(5000);
  });

  it('creates a sync:buffer-end message', () => {
    const msg = createWsMessage('sync:buffer-end', { participantId: 'p1', positionMs: 5500 });
    expect(msg.type).toBe('sync:buffer-end');
    expect(msg.payload.participantId).toBe('p1');
    expect(msg.payload.positionMs).toBe(5500);
  });

  it('creates a sync:pause message with bufferPausedBy', () => {
    const msg = createWsMessage('sync:pause', { positionMs: 5000, serverTimestamp: Date.now(), bufferPausedBy: 'Alice' });
    expect(msg.type).toBe('sync:pause');
    expect(msg.payload.bufferPausedBy).toBe('Alice');
  });
});
