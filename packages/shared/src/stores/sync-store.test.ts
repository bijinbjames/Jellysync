import { describe, it, expect, beforeEach } from 'vitest';
import { createSyncStore, type SyncStoreInstance } from './sync-store.js';

describe('syncStore', () => {
  let store: SyncStoreInstance;

  beforeEach(() => {
    store = createSyncStore();
  });

  describe('initial state', () => {
    it('has zero playback position', () => {
      expect(store.getState().playbackPosition).toBe(0);
    });

    it('has zero duration', () => {
      expect(store.getState().duration).toBe(0);
    });

    it('is not playing', () => {
      expect(store.getState().isPlaying).toBe(false);
    });

    it('is not buffering', () => {
      expect(store.getState().isBuffering).toBe(false);
    });

    it('has zero buffer progress', () => {
      expect(store.getState().bufferProgress).toBe(0);
    });

    it('has playback rate of 1', () => {
      expect(store.getState().playbackRate).toBe(1);
    });

    it('has synced sync status', () => {
      expect(store.getState().syncStatus).toBe('synced');
    });

    it('has zero last server timestamp', () => {
      expect(store.getState().lastServerTimestamp).toBe(0);
    });

    it('has zero last server position', () => {
      expect(store.getState().lastServerPosition).toBe(0);
    });
  });

  describe('setPlaybackState', () => {
    it('updates isPlaying', () => {
      store.getState().setPlaybackState({ isPlaying: true });
      expect(store.getState().isPlaying).toBe(true);
    });

    it('updates duration', () => {
      store.getState().setPlaybackState({ duration: 120000 });
      expect(store.getState().duration).toBe(120000);
    });

    it('updates playback position', () => {
      store.getState().setPlaybackState({ playbackPosition: 5000 });
      expect(store.getState().playbackPosition).toBe(5000);
    });

    it('updates playback rate', () => {
      store.getState().setPlaybackState({ playbackRate: 2 });
      expect(store.getState().playbackRate).toBe(2);
    });

    it('updates multiple fields at once', () => {
      store.getState().setPlaybackState({ isPlaying: true, duration: 90000, playbackPosition: 1000 });
      expect(store.getState().isPlaying).toBe(true);
      expect(store.getState().duration).toBe(90000);
      expect(store.getState().playbackPosition).toBe(1000);
    });

    it('does not affect unspecified fields', () => {
      store.getState().setPlaybackState({ duration: 60000 });
      store.getState().setPlaybackState({ isPlaying: true });
      expect(store.getState().duration).toBe(60000);
      expect(store.getState().isPlaying).toBe(true);
    });
  });

  describe('setBufferState', () => {
    it('sets buffering state', () => {
      store.getState().setBufferState({ isBuffering: true, bufferProgress: 0.5 });
      expect(store.getState().isBuffering).toBe(true);
      expect(store.getState().bufferProgress).toBe(0.5);
    });

    it('clears buffering state', () => {
      store.getState().setBufferState({ isBuffering: true, bufferProgress: 0.3 });
      store.getState().setBufferState({ isBuffering: false, bufferProgress: 1 });
      expect(store.getState().isBuffering).toBe(false);
      expect(store.getState().bufferProgress).toBe(1);
    });
  });

  describe('setPosition', () => {
    it('updates playback position', () => {
      store.getState().setPosition(42000);
      expect(store.getState().playbackPosition).toBe(42000);
    });

    it('does not affect other state', () => {
      store.getState().setPlaybackState({ isPlaying: true, duration: 100000 });
      store.getState().setPosition(5000);
      expect(store.getState().isPlaying).toBe(true);
      expect(store.getState().duration).toBe(100000);
      expect(store.getState().playbackPosition).toBe(5000);
    });
  });

  describe('setSyncStatus', () => {
    it('updates sync status', () => {
      store.getState().setSyncStatus('syncing');
      expect(store.getState().syncStatus).toBe('syncing');
    });

    it('updates to drifted', () => {
      store.getState().setSyncStatus('drifted');
      expect(store.getState().syncStatus).toBe('drifted');
    });
  });

  describe('setServerState', () => {
    it('updates last server position and timestamp', () => {
      store.getState().setServerState(5000, 1234567890);
      expect(store.getState().lastServerPosition).toBe(5000);
      expect(store.getState().lastServerTimestamp).toBe(1234567890);
    });

    it('does not affect other state', () => {
      store.getState().setPlaybackState({ isPlaying: true });
      store.getState().setServerState(5000, 1234567890);
      expect(store.getState().isPlaying).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      store.getState().setPlaybackState({ isPlaying: true, duration: 120000, playbackPosition: 50000, playbackRate: 1.5 });
      store.getState().setBufferState({ isBuffering: true, bufferProgress: 0.7 });
      store.getState().setSyncStatus('drifted');
      store.getState().setServerState(5000, 1234567890);
      store.getState().reset();

      const state = store.getState();
      expect(state.playbackPosition).toBe(0);
      expect(state.duration).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(state.isBuffering).toBe(false);
      expect(state.bufferProgress).toBe(0);
      expect(state.playbackRate).toBe(1);
      expect(state.syncStatus).toBe('synced');
      expect(state.lastServerTimestamp).toBe(0);
      expect(state.lastServerPosition).toBe(0);
    });
  });
});
