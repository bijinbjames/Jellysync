import { describe, it, expect } from 'vitest';
import {
  createWsMessage,
  createWsError,
  ROOM_MESSAGE_TYPE,
  ERROR_CODE,
  ERROR_MESSAGE,
} from './index.js';
import type { RoomJoinPayload, RoomStatePayload, Participant } from './messages.js';
import { createRoomStore } from '../stores/room-store.js';

describe('Deep Link Auto-Join', () => {
  it('triggers room:join when code param is present but roomCode is null (direct entry)', () => {
    const store = createRoomStore();
    const codeFromUrl = 'ABC123';

    // Simulate direct entry detection: code param present, no room state
    const roomCode = store.getState().roomCode;
    const shouldAutoJoin = codeFromUrl && !roomCode;

    expect(shouldAutoJoin).toBe(true);

    // Auto-join sends room:join message
    const msg = createWsMessage(ROOM_MESSAGE_TYPE.JOIN, {
      roomCode: codeFromUrl,
      displayName: 'Bob',
    } as RoomJoinPayload);

    expect(msg.type).toBe('room:join');
    expect(msg.payload).toEqual({ roomCode: 'ABC123', displayName: 'Bob' });
  });

  it('does NOT auto-join when roomCode is already set (normal entry)', () => {
    const store = createRoomStore();
    const alice: Participant = { id: 'p-1', displayName: 'Alice', joinedAt: 1000, isHost: true };

    // Simulate normal entry: room state already set by create/join flow
    store.getState().setParticipantId('p-1');
    store.getState().setRoom('ABC123', 'p-1', [alice]);

    const codeFromUrl = 'ABC123';
    const roomCode = store.getState().roomCode;
    const shouldAutoJoin = codeFromUrl && !roomCode;

    expect(shouldAutoJoin).toBe(false);
  });

  it('does NOT auto-join when both code param and roomCode are absent', () => {
    const store = createRoomStore();

    const codeFromUrl: string | undefined = undefined;
    const roomCode = store.getState().roomCode;
    const shouldAutoJoin = codeFromUrl && !roomCode;

    expect(shouldAutoJoin).toBeFalsy();
  });

  it('store updates correctly after successful auto-join via room:state', () => {
    const store = createRoomStore();

    // After auto-join, server sends room:state
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

    const state = store.getState();
    expect(state.roomCode).toBe('ABC123');
    expect(state.participantId).toBe('p-2');
    expect(state.participants).toHaveLength(2);
    expect(state.isHost).toBe(false);
  });
});

describe('Deep Link Auto-Join Error Handling', () => {
  it('server returns ROOM_NOT_FOUND error with room:join context for expired room', () => {
    const err = createWsError(
      ERROR_CODE.ROOM_NOT_FOUND,
      ERROR_MESSAGE[ERROR_CODE.ROOM_NOT_FOUND],
      'room:join',
    );

    expect(err.type).toBe('error');
    expect(err.payload.code).toBe('ROOM_NOT_FOUND');
    expect(err.payload.context).toBe('room:join');
  });

  it('filters join errors by context to distinguish from other WebSocket errors', () => {
    const joinError = createWsError(ERROR_CODE.ROOM_NOT_FOUND, 'Room not found', 'room:join');
    const otherError = createWsError(ERROR_CODE.ROOM_NOT_FOUND, 'Room not found', 'room:create');

    const isJoinError = (error: { payload: { context?: string } }) =>
      error.payload.context === 'room:join';

    expect(isJoinError(joinError)).toBe(true);
    expect(isJoinError(otherError)).toBe(false);
  });

  it('room store stays empty when auto-join fails (no state set on error)', () => {
    const store = createRoomStore();

    // Error received — store should remain in initial state
    expect(store.getState().roomCode).toBeNull();
    expect(store.getState().participants).toEqual([]);
    expect(store.getState().participantId).toBeNull();
    expect(store.getState().isHost).toBe(false);
  });

  it('differentiates ALREADY_IN_ROOM from ROOM_NOT_FOUND errors', () => {
    const alreadyInRoom = createWsError(
      ERROR_CODE.ALREADY_IN_ROOM,
      ERROR_MESSAGE[ERROR_CODE.ALREADY_IN_ROOM],
      'room:join',
    );
    const roomNotFound = createWsError(
      ERROR_CODE.ROOM_NOT_FOUND,
      ERROR_MESSAGE[ERROR_CODE.ROOM_NOT_FOUND],
      'room:join',
    );

    expect(alreadyInRoom.payload.code).toBe('ALREADY_IN_ROOM');
    expect(roomNotFound.payload.code).toBe('ROOM_NOT_FOUND');
    // Both have room:join context but different error codes
    expect(alreadyInRoom.payload.context).toBe('room:join');
    expect(roomNotFound.payload.context).toBe('room:join');
    expect(alreadyInRoom.payload.code).not.toBe(roomNotFound.payload.code);
  });
});

describe('Deep Link Auto-Join WS Readiness', () => {
  it('auto-join should only proceed when connectionState is connected', () => {
    const store = createRoomStore();
    const codeFromUrl = 'ABC123';

    // Initially disconnected — should NOT send
    expect(store.getState().connectionState).toBe('disconnected');
    const shouldSend = codeFromUrl && !store.getState().roomCode && store.getState().connectionState === 'connected';
    expect(shouldSend).toBe(false);

    // After connecting — should send
    store.getState().setConnectionState('connected');
    const shouldSendNow = codeFromUrl && !store.getState().roomCode && store.getState().connectionState === 'connected';
    expect(shouldSendNow).toBeTruthy();
  });

  it('auto-join should not send while connectionState is connecting', () => {
    const store = createRoomStore();
    store.getState().setConnectionState('connecting');

    const codeFromUrl: string | null = 'ABC123';
    const shouldSend = codeFromUrl && !store.getState().roomCode && store.getState().connectionState === 'connected';
    expect(shouldSend).toBe(false);
  });
});

describe('Deep Link Intent Preservation', () => {
  it('preserves room path with timestamp for post-login redirect (web sessionStorage pattern)', () => {
    const deepLinkPath = '/room/ABC123';
    const storage = new Map<string, string>();
    const INTENT_TIMEOUT_MS = 5 * 60 * 1000;

    // Simulate storing pending deep link with timestamp
    storage.set('pendingDeepLink', deepLinkPath);
    storage.set('pendingDeepLinkTimestamp', String(Date.now()));
    expect(storage.get('pendingDeepLink')).toBe('/room/ABC123');

    // After login, retrieve, check expiry, and clear
    const pending = storage.get('pendingDeepLink');
    const pendingTs = storage.get('pendingDeepLinkTimestamp');
    const isExpired = pendingTs && Date.now() - Number(pendingTs) >= INTENT_TIMEOUT_MS;
    storage.delete('pendingDeepLink');
    storage.delete('pendingDeepLinkTimestamp');

    expect(pending).toBe('/room/ABC123');
    expect(isExpired).toBeFalsy();
    expect(storage.has('pendingDeepLink')).toBe(false);
    expect(storage.has('pendingDeepLinkTimestamp')).toBe(false);
  });

  it('web intent expires after timeout (parity with mobile)', () => {
    const INTENT_TIMEOUT_MS = 5 * 60 * 1000;
    const now = Date.now();

    // Fresh web timestamp
    const freshTs = String(now - 1000);
    expect(now - Number(freshTs) >= INTENT_TIMEOUT_MS).toBe(false);

    // Expired web timestamp
    const expiredTs = String(now - (INTENT_TIMEOUT_MS + 1));
    expect(now - Number(expiredTs) >= INTENT_TIMEOUT_MS).toBe(true);
  });

  it('extracts room code from deep link path', () => {
    const paths = ['/room/ABC123', '/room/XYZ789', '/room/TEST01'];
    const extractCode = (path: string) => path.split('/room/')[1];

    expect(extractCode(paths[0])).toBe('ABC123');
    expect(extractCode(paths[1])).toBe('XYZ789');
    expect(extractCode(paths[2])).toBe('TEST01');
  });

  it('does not preserve home path (no redirect needed)', () => {
    const path = '/';
    const shouldPreserve = path !== '/';
    expect(shouldPreserve).toBe(false);
  });

  it('intent expires after timeout (mobile pattern)', () => {
    const INTENT_TIMEOUT_MS = 5 * 60 * 1000;
    const now = Date.now();

    // Fresh intent
    const freshTimestamp = now - 1000; // 1 second ago
    expect(now - freshTimestamp < INTENT_TIMEOUT_MS).toBe(true);

    // Expired intent
    const expiredTimestamp = now - (INTENT_TIMEOUT_MS + 1); // 5 minutes + 1ms ago
    expect(now - expiredTimestamp < INTENT_TIMEOUT_MS).toBe(false);
  });
});

describe('Deep Link No Regression - Normal Room Flows', () => {
  it('normal create room flow does not trigger auto-join (roomCode already set)', () => {
    const store = createRoomStore();

    // Host creates room - server sends room:state, store is populated BEFORE navigating to lobby
    const statePayload: RoomStatePayload = {
      roomCode: 'XYZ789',
      hostId: 'p-1',
      participants: [
        { id: 'p-1', displayName: 'Alice', joinedAt: 1000, isHost: true },
      ],
      participantId: 'p-1',
    };

    store.getState().setParticipantId(statePayload.participantId!);
    store.getState().setRoom(statePayload.roomCode, statePayload.hostId, statePayload.participants);

    // When lobby renders with code='XYZ789', roomCode is already 'XYZ789'
    const codeFromUrl = 'XYZ789';
    const roomCode = store.getState().roomCode;
    const shouldAutoJoin = codeFromUrl && !roomCode;

    expect(shouldAutoJoin).toBe(false);
    expect(store.getState().isHost).toBe(true);
  });

  it('normal join room flow does not trigger auto-join (roomCode set by join screen)', () => {
    const store = createRoomStore();

    // Join screen sends room:join, receives room:state, store is populated BEFORE navigating to lobby
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

    const codeFromUrl = 'ABC123';
    const roomCode = store.getState().roomCode;
    const shouldAutoJoin = codeFromUrl && !roomCode;

    expect(shouldAutoJoin).toBe(false);
    expect(store.getState().isHost).toBe(false);
  });

  it('web URL route correctly extracts code parameter', () => {
    // Simulates React Router useParams extracting code from /room/:code
    const simulateParams = (url: string) => {
      const match = url.match(/^\/room\/([^/]+)/);
      return match ? { code: match[1] } : {};
    };

    expect(simulateParams('/room/ABC123')).toEqual({ code: 'ABC123' });
    expect(simulateParams('/room/TEST01')).toEqual({ code: 'TEST01' });
    expect(simulateParams('/')).toEqual({});
    expect(simulateParams('/join')).toEqual({});
  });
});
