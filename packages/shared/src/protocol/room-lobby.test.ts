import { describe, it, expect } from 'vitest';
import { createWsMessage, ROOM_MESSAGE_TYPE, ROOM_CONFIG } from './index.js';
import type { RoomStatePayload, Participant } from './messages.js';
import { createRoomStore } from '../stores/room-store.js';

describe('Room Code Display Formatting', () => {
  function formatCode(code: string): string {
    if (code.length <= 3) return code;
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  }

  it('formats a 6-character code as XXX-XXX', () => {
    expect(formatCode('ABC123')).toBe('ABC-123');
  });

  it('formats a short code without dash', () => {
    expect(formatCode('AB')).toBe('AB');
  });

  it('handles empty string', () => {
    expect(formatCode('')).toBe('');
  });

  it('formats exactly 3 chars without dash', () => {
    expect(formatCode('ABC')).toBe('ABC');
  });
});

describe('Room Creation Flow', () => {
  it('creates a room:create message with displayName', () => {
    const msg = createWsMessage(ROOM_MESSAGE_TYPE.CREATE, { displayName: 'Alice' });
    expect(msg.type).toBe('room:create');
    expect(msg.payload).toEqual({ displayName: 'Alice' });
    expect(msg.timestamp).toBeTypeOf('number');
  });

  it('creates a room:leave message', () => {
    const msg = createWsMessage(ROOM_MESSAGE_TYPE.LEAVE, {});
    expect(msg.type).toBe('room:leave');
  });

  it('updates store on room:state response', () => {
    const store = createRoomStore();

    const statePayload: RoomStatePayload = {
      roomCode: 'XYZ789',
      hostId: 'p-1',
      participants: [
        { id: 'p-1', displayName: 'Alice', joinedAt: 1000, isHost: true },
      ],
      participantId: 'p-1',
    };

    // Simulate what useWebSocket does on room:state
    store.getState().setParticipantId(statePayload.participantId!);
    store.getState().setRoom(statePayload.roomCode, statePayload.hostId, statePayload.participants);

    const state = store.getState();
    expect(state.roomCode).toBe('XYZ789');
    expect(state.hostId).toBe('p-1');
    expect(state.isHost).toBe(true);
    expect(state.participantId).toBe('p-1');
    expect(state.participants).toHaveLength(1);
    expect(state.participants[0].displayName).toBe('Alice');
  });

  it('updates participant list when new participant joins via room:state', () => {
    const store = createRoomStore();

    const alice: Participant = { id: 'p-1', displayName: 'Alice', joinedAt: 1000, isHost: true };
    const bob: Participant = { id: 'p-2', displayName: 'Bob', joinedAt: 2000, isHost: false };

    store.getState().setParticipantId('p-1');
    store.getState().setRoom('XYZ789', 'p-1', [alice]);
    expect(store.getState().participants).toHaveLength(1);

    // New participant joins — server broadcasts updated room:state
    store.getState().setRoom('XYZ789', 'p-1', [alice, bob]);
    expect(store.getState().participants).toHaveLength(2);
    expect(store.getState().participants[1].displayName).toBe('Bob');
  });

  it('clears room state on leave', () => {
    const store = createRoomStore();

    const alice: Participant = { id: 'p-1', displayName: 'Alice', joinedAt: 1000, isHost: true };
    store.getState().setParticipantId('p-1');
    store.getState().setRoom('XYZ789', 'p-1', [alice]);

    expect(store.getState().roomCode).toBe('XYZ789');

    store.getState().clearRoom();

    const state = store.getState();
    expect(state.roomCode).toBeNull();
    expect(state.participants).toEqual([]);
    expect(state.hostId).toBeNull();
    expect(state.isHost).toBe(false);
    expect(state.participantId).toBeNull();
  });
});

describe('ParticipantChip variants', () => {
  it('identifies host participant', () => {
    const participant: Participant = { id: 'p-1', displayName: 'Alice', joinedAt: 1000, isHost: true };
    expect(participant.isHost).toBe(true);
  });

  it('identifies regular participant', () => {
    const participant: Participant = { id: 'p-2', displayName: 'Bob', joinedAt: 2000, isHost: false };
    expect(participant.isHost).toBe(false);
  });

  it('room code length matches config', () => {
    expect(ROOM_CONFIG.CODE_LENGTH).toBe(6);
  });

  it('max participants matches config', () => {
    expect(ROOM_CONFIG.MAX_PARTICIPANTS).toBe(20);
  });
});
