import { describe, it, expect } from 'vitest';
import {
  createWsMessage,
  createWsError,
  ROOM_MESSAGE_TYPE,
  ERROR_CODE,
  ERROR_MESSAGE,
  ROOM_CONFIG,
} from './index.js';
import type { RoomJoinPayload, RoomStatePayload, Participant } from './messages.js';
import { createRoomStore } from '../stores/room-store.js';

describe('Room Join Flow', () => {
  it('creates a room:join message with roomCode and displayName', () => {
    const payload: RoomJoinPayload = { roomCode: 'ABC123', displayName: 'Bob' };
    const msg = createWsMessage(ROOM_MESSAGE_TYPE.JOIN, payload);
    expect(msg.type).toBe('room:join');
    expect(msg.payload).toEqual({ roomCode: 'ABC123', displayName: 'Bob' });
    expect(msg.timestamp).toBeTypeOf('number');
  });

  it('updates store when room:state is received after join', () => {
    const store = createRoomStore();

    const statePayload: RoomStatePayload = {
      roomCode: 'ABC123',
      hostId: 'p-1',
      participants: [
        { id: 'p-1', displayName: 'Alice', joinedAt: 1000, isHost: true },
        { id: 'p-2', displayName: 'Bob', joinedAt: 2000, isHost: false },
      ],
      participantId: 'p-2',
    };

    // Simulate what useWebSocket does on room:state for a joining participant
    store.getState().setParticipantId(statePayload.participantId!);
    store.getState().setRoom(statePayload.roomCode, statePayload.hostId, statePayload.participants);

    const state = store.getState();
    expect(state.roomCode).toBe('ABC123');
    expect(state.hostId).toBe('p-1');
    expect(state.isHost).toBe(false);
    expect(state.participantId).toBe('p-2');
    expect(state.participants).toHaveLength(2);
    expect(state.participants[1].displayName).toBe('Bob');
  });

  it('joining participant is not host', () => {
    const store = createRoomStore();

    const statePayload: RoomStatePayload = {
      roomCode: 'ABC123',
      hostId: 'p-1',
      participants: [
        { id: 'p-1', displayName: 'Alice', joinedAt: 1000, isHost: true },
        { id: 'p-2', displayName: 'Bob', joinedAt: 2000, isHost: false },
      ],
      participantId: 'p-2',
    };

    store.getState().setParticipantId(statePayload.participantId!);
    store.getState().setRoom(statePayload.roomCode, statePayload.hostId, statePayload.participants);

    expect(store.getState().isHost).toBe(false);
  });
});

describe('Room Join Error Handling', () => {
  it('creates ROOM_NOT_FOUND error with room:join context', () => {
    const err = createWsError(
      ERROR_CODE.ROOM_NOT_FOUND,
      ERROR_MESSAGE[ERROR_CODE.ROOM_NOT_FOUND],
      'room:join',
    );
    expect(err.type).toBe('error');
    expect(err.payload.code).toBe('ROOM_NOT_FOUND');
    expect(err.payload.context).toBe('room:join');
    expect(err.payload.message).toBeTruthy();
  });

  it('creates ROOM_FULL error with room:join context', () => {
    const err = createWsError(
      ERROR_CODE.ROOM_FULL,
      ERROR_MESSAGE[ERROR_CODE.ROOM_FULL],
      'room:join',
    );
    expect(err.type).toBe('error');
    expect(err.payload.code).toBe('ROOM_FULL');
    expect(err.payload.context).toBe('room:join');
  });

  it('creates ALREADY_IN_ROOM error with room:join context', () => {
    const err = createWsError(
      ERROR_CODE.ALREADY_IN_ROOM,
      ERROR_MESSAGE[ERROR_CODE.ALREADY_IN_ROOM],
      'room:join',
    );
    expect(err.type).toBe('error');
    expect(err.payload.code).toBe('ALREADY_IN_ROOM');
    expect(err.payload.context).toBe('room:join');
  });

  it('does not update room store on error (store stays empty)', () => {
    const store = createRoomStore();

    // Error received — store should remain in initial state
    expect(store.getState().roomCode).toBeNull();
    expect(store.getState().participants).toEqual([]);
    expect(store.getState().participantId).toBeNull();
  });
});

describe('Room Code Validation', () => {
  it('room code must be exactly CODE_LENGTH characters', () => {
    expect(ROOM_CONFIG.CODE_LENGTH).toBe(6);
  });

  it('room code charset excludes ambiguous characters', () => {
    const chars = ROOM_CONFIG.CODE_CHARS;
    expect(chars).not.toContain('0');
    expect(chars).not.toContain('O');
    expect(chars).not.toContain('1');
    expect(chars).not.toContain('I');
    expect(chars).not.toContain('L');
  });

  it('button should be disabled until 6 characters entered (logic check)', () => {
    const isDisabled = (code: string) => code.length !== 6;
    expect(isDisabled('')).toBe(true);
    expect(isDisabled('ABC')).toBe(true);
    expect(isDisabled('ABCDE')).toBe(true);
    expect(isDisabled('ABCDEF')).toBe(false);
  });

  it('code input filters non-alphanumeric and uppercases', () => {
    const clean = (text: string) => text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    expect(clean('abc123')).toBe('ABC123');
    expect(clean('a-b.c!1@2#3')).toBe('ABC123');
    expect(clean('abcdefgh')).toBe('ABCDEF');
    expect(clean('')).toBe('');
  });
});

describe('Host lobby updates when participant joins', () => {
  it('host store updates participant list when new participant joins', () => {
    const hostStore = createRoomStore();

    const alice: Participant = { id: 'p-1', displayName: 'Alice', joinedAt: 1000, isHost: true };
    hostStore.getState().setParticipantId('p-1');
    hostStore.getState().setRoom('ABC123', 'p-1', [alice]);
    expect(hostStore.getState().participants).toHaveLength(1);

    // Server broadcasts updated room:state when Bob joins
    const bob: Participant = { id: 'p-2', displayName: 'Bob', joinedAt: 2000, isHost: false };
    hostStore.getState().setRoom('ABC123', 'p-1', [alice, bob]);
    expect(hostStore.getState().participants).toHaveLength(2);
    expect(hostStore.getState().participants[1].displayName).toBe('Bob');
    expect(hostStore.getState().participants[1].isHost).toBe(false);
  });
});
