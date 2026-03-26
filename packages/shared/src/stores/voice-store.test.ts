import { describe, it, expect, beforeEach } from 'vitest';
import { createVoiceStore, type VoiceStoreInstance } from './voice-store.js';

describe('voice-store', () => {
  let store: VoiceStoreInstance;

  beforeEach(() => {
    store = createVoiceStore();
  });

  describe('initial state', () => {
    it('has voice disabled by default', () => {
      expect(store.getState().isVoiceEnabled).toBe(false);
    });

    it('has muted off by default', () => {
      expect(store.getState().isMuted).toBe(false);
    });

    it('has empty peer connections', () => {
      expect(store.getState().peerConnections.size).toBe(0);
    });

    it('has local stream inactive', () => {
      expect(store.getState().localStreamActive).toBe(false);
    });

    it('has empty volume levels', () => {
      expect(store.getState().volumeLevels.size).toBe(0);
    });
  });

  describe('setVoiceEnabled', () => {
    it('enables voice', () => {
      store.getState().setVoiceEnabled(true);
      expect(store.getState().isVoiceEnabled).toBe(true);
    });

    it('disables voice', () => {
      store.getState().setVoiceEnabled(true);
      store.getState().setVoiceEnabled(false);
      expect(store.getState().isVoiceEnabled).toBe(false);
    });
  });

  describe('setMuted', () => {
    it('mutes', () => {
      store.getState().setMuted(true);
      expect(store.getState().isMuted).toBe(true);
    });

    it('unmutes', () => {
      store.getState().setMuted(true);
      store.getState().setMuted(false);
      expect(store.getState().isMuted).toBe(false);
    });
  });

  describe('setPeerConnectionState', () => {
    it('adds a new peer connection', () => {
      store.getState().setPeerConnectionState('user-1', 'connecting');
      expect(store.getState().peerConnections.get('user-1')).toBe('connecting');
    });

    it('updates an existing peer connection', () => {
      store.getState().setPeerConnectionState('user-1', 'connecting');
      store.getState().setPeerConnectionState('user-1', 'connected');
      expect(store.getState().peerConnections.get('user-1')).toBe('connected');
    });

    it('manages multiple peer connections', () => {
      store.getState().setPeerConnectionState('user-1', 'connected');
      store.getState().setPeerConnectionState('user-2', 'connecting');
      expect(store.getState().peerConnections.size).toBe(2);
      expect(store.getState().peerConnections.get('user-1')).toBe('connected');
      expect(store.getState().peerConnections.get('user-2')).toBe('connecting');
    });
  });

  describe('removePeerConnection', () => {
    it('removes an existing peer connection', () => {
      store.getState().setPeerConnectionState('user-1', 'connected');
      store.getState().removePeerConnection('user-1');
      expect(store.getState().peerConnections.has('user-1')).toBe(false);
    });

    it('also removes the volume level for that participant', () => {
      store.getState().setPeerConnectionState('user-1', 'connected');
      store.getState().setVolume('user-1', 0.8);
      store.getState().removePeerConnection('user-1');
      expect(store.getState().volumeLevels.has('user-1')).toBe(false);
    });

    it('does not affect other peer connections', () => {
      store.getState().setPeerConnectionState('user-1', 'connected');
      store.getState().setPeerConnectionState('user-2', 'connected');
      store.getState().removePeerConnection('user-1');
      expect(store.getState().peerConnections.has('user-2')).toBe(true);
    });

    it('is safe to call for non-existent peer', () => {
      store.getState().removePeerConnection('nonexistent');
      expect(store.getState().peerConnections.size).toBe(0);
    });
  });

  describe('setLocalStreamActive', () => {
    it('sets local stream active', () => {
      store.getState().setLocalStreamActive(true);
      expect(store.getState().localStreamActive).toBe(true);
    });

    it('sets local stream inactive', () => {
      store.getState().setLocalStreamActive(true);
      store.getState().setLocalStreamActive(false);
      expect(store.getState().localStreamActive).toBe(false);
    });
  });

  describe('setVolume', () => {
    it('sets volume for a participant', () => {
      store.getState().setVolume('user-1', 0.5);
      expect(store.getState().volumeLevels.get('user-1')).toBe(0.5);
    });

    it('clamps volume to 0 minimum', () => {
      store.getState().setVolume('user-1', -0.5);
      expect(store.getState().volumeLevels.get('user-1')).toBe(0);
    });

    it('clamps volume to 1 maximum', () => {
      store.getState().setVolume('user-1', 1.5);
      expect(store.getState().volumeLevels.get('user-1')).toBe(1);
    });

    it('allows edge values 0 and 1', () => {
      store.getState().setVolume('user-1', 0);
      expect(store.getState().volumeLevels.get('user-1')).toBe(0);
      store.getState().setVolume('user-1', 1);
      expect(store.getState().volumeLevels.get('user-1')).toBe(1);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values but preserves isMuted', () => {
      store.getState().setVoiceEnabled(true);
      store.getState().setMuted(true);
      store.getState().setPeerConnectionState('user-1', 'connected');
      store.getState().setLocalStreamActive(true);
      store.getState().setVolume('user-1', 0.7);

      store.getState().reset();

      const state = store.getState();
      expect(state.isVoiceEnabled).toBe(false);
      expect(state.isMuted).toBe(true); // isMuted is preserved across resets
      expect(state.peerConnections.size).toBe(0);
      expect(state.localStreamActive).toBe(false);
      expect(state.volumeLevels.size).toBe(0);
    });
  });
});
