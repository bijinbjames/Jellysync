import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from './room-manager.js';

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = new RoomManager();
  });

  describe('createRoom', () => {
    it('creates a room with a valid code', () => {
      const room = manager.createRoom('host-1', 'Alice');
      expect(room.code).toHaveLength(6);
      expect(room.hostId).toBe('host-1');
      expect(room.participants.size).toBe(1);
    });

    it('sets the creator as host', () => {
      const room = manager.createRoom('host-1', 'Alice');
      const host = room.participants.get('host-1');
      expect(host).toBeDefined();
      expect(host!.isHost).toBe(true);
      expect(host!.displayName).toBe('Alice');
    });

    it('stores the room retrievable by code', () => {
      const room = manager.createRoom('host-1', 'Alice');
      const found = manager.getRoom(room.code);
      expect(found).toBe(room);
    });
  });

  describe('joinRoom', () => {
    it('adds a participant to an existing room', () => {
      const room = manager.createRoom('host-1', 'Alice');
      const updated = manager.joinRoom(room.code, 'user-2', 'Bob');
      expect(updated).not.toBeNull();
      expect(updated!.participants.size).toBe(2);
      const bob = updated!.participants.get('user-2');
      expect(bob!.displayName).toBe('Bob');
      expect(bob!.isHost).toBe(false);
    });

    it('returns null for non-existent room', () => {
      const result = manager.joinRoom('ZZZZZZ', 'user-1', 'Alice');
      expect(result).toBeNull();
    });
  });

  describe('leaveRoom', () => {
    it('removes participant from room', () => {
      const room = manager.createRoom('host-1', 'Alice');
      manager.joinRoom(room.code, 'user-2', 'Bob');
      const updated = manager.leaveRoom(room.code, 'user-2');
      expect(updated).not.toBeNull();
      expect(updated!.participants.size).toBe(1);
      expect(updated!.participants.has('user-2')).toBe(false);
    });

    it('destroys room when last participant leaves', () => {
      const room = manager.createRoom('host-1', 'Alice');
      const result = manager.leaveRoom(room.code, 'host-1');
      expect(result).toBeNull();
      expect(manager.getRoom(room.code)).toBeNull();
    });

    it('transfers host to earliest joiner when host leaves', () => {
      const room = manager.createRoom('host-1', 'Alice');
      manager.joinRoom(room.code, 'user-2', 'Bob');
      manager.joinRoom(room.code, 'user-3', 'Charlie');

      const updated = manager.leaveRoom(room.code, 'host-1');
      expect(updated).not.toBeNull();
      expect(updated!.hostId).toBe('user-2');
      expect(updated!.participants.get('user-2')!.isHost).toBe(true);
      expect(updated!.participants.get('user-3')!.isHost).toBe(false);
    });

    it('returns null for non-existent room', () => {
      expect(manager.leaveRoom('ZZZZZZ', 'user-1')).toBeNull();
    });
  });

  describe('getRoom', () => {
    it('returns null for non-existent room', () => {
      expect(manager.getRoom('ZZZZZZ')).toBeNull();
    });
  });

  describe('getRoomByParticipant', () => {
    it('finds room by participant id', () => {
      const room = manager.createRoom('host-1', 'Alice');
      manager.joinRoom(room.code, 'user-2', 'Bob');
      const found = manager.getRoomByParticipant('user-2');
      expect(found).not.toBeNull();
      expect(found!.code).toBe(room.code);
    });

    it('returns null for unknown participant', () => {
      expect(manager.getRoomByParticipant('unknown')).toBeNull();
    });
  });

  describe('removeParticipant', () => {
    it('removes participant and returns updated room', () => {
      const room = manager.createRoom('host-1', 'Alice');
      manager.joinRoom(room.code, 'user-2', 'Bob');
      const updated = manager.removeParticipant('user-2');
      expect(updated).not.toBeNull();
      expect(updated!.participants.size).toBe(1);
    });

    it('returns null for unknown participant', () => {
      expect(manager.removeParticipant('unknown')).toBeNull();
    });

    it('destroys room when last participant is removed', () => {
      const room = manager.createRoom('host-1', 'Alice');
      const result = manager.removeParticipant('host-1');
      expect(result).toBeNull();
      expect(manager.getRoom(room.code)).toBeNull();
    });

    it('cleans up stepped-away state when participant is removed', () => {
      const room = manager.createRoom('host-1', 'Alice');
      manager.joinRoom(room.code, 'user-2', 'Bob');
      manager.markSteppedAway(room.code, 'user-2');
      expect(room.steppedAwayParticipants.has('user-2')).toBe(true);
      manager.removeParticipant('user-2');
      expect(room.steppedAwayParticipants.has('user-2')).toBe(false);
    });
  });

  describe('stepped-away tracking', () => {
    it('initializes room with empty steppedAwayParticipants set', () => {
      const room = manager.createRoom('host-1', 'Alice');
      expect(room.steppedAwayParticipants).toBeInstanceOf(Set);
      expect(room.steppedAwayParticipants.size).toBe(0);
    });

    it('markSteppedAway adds participant and returns true', () => {
      const room = manager.createRoom('host-1', 'Alice');
      const result = manager.markSteppedAway(room.code, 'host-1');
      expect(result).toBe(true);
      expect(room.steppedAwayParticipants.has('host-1')).toBe(true);
    });

    it('markSteppedAway returns false if already stepped away', () => {
      const room = manager.createRoom('host-1', 'Alice');
      manager.markSteppedAway(room.code, 'host-1');
      const result = manager.markSteppedAway(room.code, 'host-1');
      expect(result).toBe(false);
    });

    it('markSteppedAway returns false for non-existent room', () => {
      expect(manager.markSteppedAway('NONEXIST', 'host-1')).toBe(false);
    });

    it('markReturned removes participant and returns true', () => {
      const room = manager.createRoom('host-1', 'Alice');
      manager.markSteppedAway(room.code, 'host-1');
      const result = manager.markReturned(room.code, 'host-1');
      expect(result).toBe(true);
      expect(room.steppedAwayParticipants.has('host-1')).toBe(false);
    });

    it('markReturned returns false if not stepped away', () => {
      const room = manager.createRoom('host-1', 'Alice');
      const result = manager.markReturned(room.code, 'host-1');
      expect(result).toBe(false);
    });

    it('markReturned returns false for non-existent room', () => {
      expect(manager.markReturned('NONEXIST', 'host-1')).toBe(false);
    });

    it('isParticipantSteppedAway returns correct state', () => {
      const room = manager.createRoom('host-1', 'Alice');
      expect(manager.isParticipantSteppedAway(room.code, 'host-1')).toBe(false);
      manager.markSteppedAway(room.code, 'host-1');
      expect(manager.isParticipantSteppedAway(room.code, 'host-1')).toBe(true);
      manager.markReturned(room.code, 'host-1');
      expect(manager.isParticipantSteppedAway(room.code, 'host-1')).toBe(false);
    });

    it('isParticipantSteppedAway returns false for non-existent room', () => {
      expect(manager.isParticipantSteppedAway('NONEXIST', 'host-1')).toBe(false);
    });

    it('supports multiple stepped-away participants', () => {
      const room = manager.createRoom('host-1', 'Alice');
      manager.joinRoom(room.code, 'user-2', 'Bob');
      manager.joinRoom(room.code, 'user-3', 'Charlie');
      manager.markSteppedAway(room.code, 'user-2');
      manager.markSteppedAway(room.code, 'user-3');
      expect(room.steppedAwayParticipants.size).toBe(2);
      manager.markReturned(room.code, 'user-2');
      expect(room.steppedAwayParticipants.size).toBe(1);
      expect(room.steppedAwayParticipants.has('user-3')).toBe(true);
    });
  });
});
