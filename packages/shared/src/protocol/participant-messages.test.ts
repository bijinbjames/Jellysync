import { describe, it, expect } from 'vitest';
import {
  isParticipantMessage,
  isValidParticipantMessageType,
  isClientParticipantMessageType,
  isValidPermissionUpdatePayload,
  isValidSteppedAwayPayload,
  isValidReturnedPayload,
  createWsMessage,
  type WsMessage,
} from './messages.js';
import { PARTICIPANT_MESSAGE_TYPE } from './constants.js';

describe('PARTICIPANT_MESSAGE_TYPE', () => {
  it('has PERMISSION_UPDATE constant', () => {
    expect(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE).toBe('participant:permission-update');
  });

  it('has STEPPED_AWAY constant', () => {
    expect(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY).toBe('participant:stepped-away');
  });

  it('has RETURNED constant', () => {
    expect(PARTICIPANT_MESSAGE_TYPE.RETURNED).toBe('participant:returned');
  });
});

describe('isParticipantMessage', () => {
  it('returns true for participant: prefixed messages', () => {
    const msg: WsMessage = { type: 'participant:permission-update', payload: {}, timestamp: 1234 };
    expect(isParticipantMessage(msg)).toBe(true);
  });

  it('returns false for non-participant messages', () => {
    const msg: WsMessage = { type: 'room:create', payload: {}, timestamp: 1234 };
    expect(isParticipantMessage(msg)).toBe(false);
  });

  it('returns false for sync messages', () => {
    const msg: WsMessage = { type: 'sync:play', payload: {}, timestamp: 1234 };
    expect(isParticipantMessage(msg)).toBe(false);
  });
});

describe('isValidParticipantMessageType', () => {
  it('returns true for participant:permission-update', () => {
    expect(isValidParticipantMessageType('participant:permission-update')).toBe(true);
  });

  it('returns true for participant:stepped-away', () => {
    expect(isValidParticipantMessageType('participant:stepped-away')).toBe(true);
  });

  it('returns true for participant:returned', () => {
    expect(isValidParticipantMessageType('participant:returned')).toBe(true);
  });

  it('returns false for invalid types', () => {
    expect(isValidParticipantMessageType('participant:invalid')).toBe(false);
    expect(isValidParticipantMessageType('room:create')).toBe(false);
    expect(isValidParticipantMessageType('')).toBe(false);
  });
});

describe('isClientParticipantMessageType', () => {
  it('returns true for client participant message types', () => {
    expect(isClientParticipantMessageType('participant:permission-update')).toBe(true);
  });

  it('returns true for stepped-away client message', () => {
    expect(isClientParticipantMessageType('participant:stepped-away')).toBe(true);
  });

  it('returns true for returned client message', () => {
    expect(isClientParticipantMessageType('participant:returned')).toBe(true);
  });

  it('returns false for invalid types', () => {
    expect(isClientParticipantMessageType('participant:invalid')).toBe(false);
    expect(isClientParticipantMessageType('')).toBe(false);
  });
});

describe('isValidPermissionUpdatePayload', () => {
  it('returns true for valid payload', () => {
    const payload = {
      permissions: { canPlayPause: true, canSeek: false },
      updatedBy: 'host-123',
    };
    expect(isValidPermissionUpdatePayload(payload)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidPermissionUpdatePayload(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidPermissionUpdatePayload('string')).toBe(false);
  });

  it('returns false for missing updatedBy', () => {
    const payload = { permissions: { canPlayPause: true, canSeek: true } };
    expect(isValidPermissionUpdatePayload(payload)).toBe(false);
  });

  it('returns false for missing permissions', () => {
    const payload = { updatedBy: 'host-123' };
    expect(isValidPermissionUpdatePayload(payload)).toBe(false);
  });

  it('returns false for invalid permissions shape', () => {
    const payload = { permissions: { canPlayPause: 'yes', canSeek: true }, updatedBy: 'host-123' };
    expect(isValidPermissionUpdatePayload(payload)).toBe(false);
  });

  it('returns false for missing canSeek', () => {
    const payload = { permissions: { canPlayPause: true }, updatedBy: 'host-123' };
    expect(isValidPermissionUpdatePayload(payload)).toBe(false);
  });

  it('returns false for non-string updatedBy', () => {
    const payload = { permissions: { canPlayPause: true, canSeek: true }, updatedBy: 123 };
    expect(isValidPermissionUpdatePayload(payload)).toBe(false);
  });
});

describe('isValidSteppedAwayPayload', () => {
  it('returns true for valid payload', () => {
    expect(isValidSteppedAwayPayload({ participantId: 'user-1', participantName: 'Alice' })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidSteppedAwayPayload(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidSteppedAwayPayload('string')).toBe(false);
  });

  it('returns false for missing participantId', () => {
    expect(isValidSteppedAwayPayload({ participantName: 'Alice' })).toBe(false);
  });

  it('returns false for missing participantName', () => {
    expect(isValidSteppedAwayPayload({ participantId: 'user-1' })).toBe(false);
  });

  it('returns false for non-string participantId', () => {
    expect(isValidSteppedAwayPayload({ participantId: 123, participantName: 'Alice' })).toBe(false);
  });

  it('returns false for non-string participantName', () => {
    expect(isValidSteppedAwayPayload({ participantId: 'user-1', participantName: 123 })).toBe(false);
  });
});

describe('isValidReturnedPayload', () => {
  it('returns true for valid payload', () => {
    expect(isValidReturnedPayload({ participantId: 'user-1', participantName: 'Alice' })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidReturnedPayload(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidReturnedPayload(42)).toBe(false);
  });

  it('returns false for missing participantId', () => {
    expect(isValidReturnedPayload({ participantName: 'Alice' })).toBe(false);
  });

  it('returns false for missing participantName', () => {
    expect(isValidReturnedPayload({ participantId: 'user-1' })).toBe(false);
  });
});

describe('createWsMessage for participant messages', () => {
  it('creates a permission-update message', () => {
    const msg = createWsMessage(PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE, {
      permissions: { canPlayPause: false, canSeek: true },
      updatedBy: 'host-456',
    });
    expect(msg.type).toBe('participant:permission-update');
    expect(msg.payload).toEqual({
      permissions: { canPlayPause: false, canSeek: true },
      updatedBy: 'host-456',
    });
    expect(typeof msg.timestamp).toBe('number');
  });

  it('creates a stepped-away message', () => {
    const msg = createWsMessage(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY, {
      participantId: 'user-1',
      participantName: 'Alice',
    });
    expect(msg.type).toBe('participant:stepped-away');
    expect(msg.payload).toEqual({ participantId: 'user-1', participantName: 'Alice' });
    expect(typeof msg.timestamp).toBe('number');
  });

  it('creates a returned message', () => {
    const msg = createWsMessage(PARTICIPANT_MESSAGE_TYPE.RETURNED, {
      participantId: 'user-1',
      participantName: 'Alice',
    });
    expect(msg.type).toBe('participant:returned');
    expect(msg.payload).toEqual({ participantId: 'user-1', participantName: 'Alice' });
    expect(typeof msg.timestamp).toBe('number');
  });
});
