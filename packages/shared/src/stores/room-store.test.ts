import { describe, it, expect, beforeEach } from 'vitest';
import { createRoomStore, type RoomStoreInstance } from './room-store.js';
import type { Participant } from '../protocol/messages.js';

describe('roomStore', () => {
  let store: RoomStoreInstance;

  const alice: Participant = { id: 'p-1', displayName: 'Alice', joinedAt: 1000, isHost: true };
  const bob: Participant = { id: 'p-2', displayName: 'Bob', joinedAt: 2000, isHost: false };

  beforeEach(() => {
    store = createRoomStore();
  });

  describe('initial state', () => {
    it('has correct defaults', () => {
      const state = store.getState();
      expect(state.roomCode).toBeNull();
      expect(state.participants).toEqual([]);
      expect(state.hostId).toBeNull();
      expect(state.isHost).toBe(false);
      expect(state.connectionState).toBe('disconnected');
      expect(state.participantId).toBeNull();
    });
  });

  describe('setRoom', () => {
    it('sets room state', () => {
      store.getState().setRoom('ABC123', 'p-1', [alice, bob]);
      const state = store.getState();
      expect(state.roomCode).toBe('ABC123');
      expect(state.hostId).toBe('p-1');
      expect(state.participants).toHaveLength(2);
    });

    it('derives isHost correctly when participantId matches hostId', () => {
      store.getState().setParticipantId('p-1');
      store.getState().setRoom('ABC123', 'p-1', [alice, bob]);
      expect(store.getState().isHost).toBe(true);
    });

    it('derives isHost correctly when participantId does not match', () => {
      store.getState().setParticipantId('p-2');
      store.getState().setRoom('ABC123', 'p-1', [alice, bob]);
      expect(store.getState().isHost).toBe(false);
    });
  });

  describe('addParticipant', () => {
    it('adds a participant to the list', () => {
      store.getState().setRoom('ABC123', 'p-1', [alice]);
      store.getState().addParticipant(bob);
      expect(store.getState().participants).toHaveLength(2);
      expect(store.getState().participants[1]).toEqual(bob);
    });
  });

  describe('removeParticipant', () => {
    it('removes a participant by id', () => {
      store.getState().setRoom('ABC123', 'p-1', [alice, bob]);
      store.getState().removeParticipant('p-2');
      expect(store.getState().participants).toHaveLength(1);
      expect(store.getState().participants[0].id).toBe('p-1');
    });
  });

  describe('updateHost', () => {
    it('updates host and recalculates isHost', () => {
      store.getState().setParticipantId('p-2');
      store.getState().setRoom('ABC123', 'p-1', [alice, bob]);
      expect(store.getState().isHost).toBe(false);

      store.getState().updateHost('p-2');
      expect(store.getState().hostId).toBe('p-2');
      expect(store.getState().isHost).toBe(true);
      expect(store.getState().participants[1].isHost).toBe(true);
      expect(store.getState().participants[0].isHost).toBe(false);
    });
  });

  describe('clearRoom', () => {
    it('resets room state and participantId but keeps connection state', () => {
      store.getState().setConnectionState('connected');
      store.getState().setParticipantId('p-1');
      store.getState().setRoom('ABC123', 'p-1', [alice]);
      store.getState().clearRoom();

      const state = store.getState();
      expect(state.roomCode).toBeNull();
      expect(state.participants).toEqual([]);
      expect(state.hostId).toBeNull();
      expect(state.isHost).toBe(false);
      expect(state.connectionState).toBe('connected');
      expect(state.participantId).toBeNull();
    });
  });

  describe('setConnectionState', () => {
    it('updates connection state', () => {
      store.getState().setConnectionState('connecting');
      expect(store.getState().connectionState).toBe('connecting');

      store.getState().setConnectionState('connected');
      expect(store.getState().connectionState).toBe('connected');

      store.getState().setConnectionState('disconnected');
      expect(store.getState().connectionState).toBe('disconnected');
    });
  });

  describe('setParticipantId', () => {
    it('sets participant ID and recalculates isHost', () => {
      store.getState().setRoom('ABC123', 'p-1', [alice]);
      store.getState().setParticipantId('p-1');
      expect(store.getState().participantId).toBe('p-1');
      expect(store.getState().isHost).toBe(true);
    });
  });
});
