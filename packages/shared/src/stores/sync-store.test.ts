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

    it('has null bufferPausedBy', () => {
      expect(store.getState().bufferPausedBy).toBeNull();
    });

    it('has null pauseSource', () => {
      expect(store.getState().pauseSource).toBeNull();
    });

    it('has controlsVisible false', () => {
      expect(store.getState().controlsVisible).toBe(false);
    });

    it('has default permissions (all allowed)', () => {
      expect(store.getState().permissions).toEqual({ canPlayPause: true, canSeek: true });
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

  describe('setBufferPause', () => {
    it('sets bufferPausedBy and pauseSource to buffer', () => {
      store.getState().setBufferPause('Alice');
      expect(store.getState().bufferPausedBy).toBe('Alice');
      expect(store.getState().pauseSource).toBe('buffer');
    });
  });

  describe('clearBufferPause', () => {
    it('clears bufferPausedBy and pauseSource', () => {
      store.getState().setBufferPause('Alice');
      store.getState().clearBufferPause();
      expect(store.getState().bufferPausedBy).toBeNull();
      expect(store.getState().pauseSource).toBeNull();
    });
  });

  describe('setHostPause', () => {
    it('sets pauseSource to host and clears bufferPausedBy', () => {
      store.getState().setBufferPause('Alice');
      store.getState().setHostPause();
      expect(store.getState().pauseSource).toBe('host');
      expect(store.getState().bufferPausedBy).toBeNull();
    });
  });

  describe('SyncStatusChip state derivation', () => {
    it('synchronized state: no pause source, synced status', () => {
      // Default state — no pauseSource, syncStatus = synced
      const state = store.getState();
      expect(state.pauseSource).toBeNull();
      expect(state.bufferPausedBy).toBeNull();
      expect(state.syncStatus).toBe('synced');
    });

    it('buffering state: buffer pause with display name', () => {
      store.getState().setBufferPause('Alice');
      const state = store.getState();
      expect(state.pauseSource).toBe('buffer');
      expect(state.bufferPausedBy).toBe('Alice');
    });

    it('paused state: host pause source', () => {
      store.getState().setHostPause();
      const state = store.getState();
      expect(state.pauseSource).toBe('host');
      expect(state.bufferPausedBy).toBeNull();
    });

    it('transitions from buffer to synchronized on clearBufferPause', () => {
      store.getState().setBufferPause('Alice');
      store.getState().clearBufferPause();
      const state = store.getState();
      expect(state.pauseSource).toBeNull();
      expect(state.bufferPausedBy).toBeNull();
    });

    it('transitions from buffer to host pause', () => {
      store.getState().setBufferPause('Alice');
      store.getState().setHostPause();
      const state = store.getState();
      expect(state.pauseSource).toBe('host');
      expect(state.bufferPausedBy).toBeNull();
    });
  });

  describe('showControls / hideControls', () => {
    it('showControls sets controlsVisible to true', () => {
      store.getState().showControls();
      expect(store.getState().controlsVisible).toBe(true);
    });

    it('hideControls sets controlsVisible to false', () => {
      store.getState().showControls();
      store.getState().hideControls();
      expect(store.getState().controlsVisible).toBe(false);
    });

    it('toggle pattern: show then hide', () => {
      store.getState().showControls();
      expect(store.getState().controlsVisible).toBe(true);
      store.getState().hideControls();
      expect(store.getState().controlsVisible).toBe(false);
    });
  });

  describe('setPermissions', () => {
    it('updates permissions', () => {
      store.getState().setPermissions({ canPlayPause: false, canSeek: false });
      expect(store.getState().permissions).toEqual({ canPlayPause: false, canSeek: false });
    });

    it('can update individual permission values', () => {
      store.getState().setPermissions({ canPlayPause: false, canSeek: true });
      expect(store.getState().permissions.canPlayPause).toBe(false);
      expect(store.getState().permissions.canSeek).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      store.getState().setPlaybackState({ isPlaying: true, duration: 120000, playbackPosition: 50000, playbackRate: 1.5 });
      store.getState().setBufferState({ isBuffering: true, bufferProgress: 0.7 });
      store.getState().setSyncStatus('drifted');
      store.getState().setServerState(5000, 1234567890);
      store.getState().setBufferPause('Alice');
      store.getState().showControls();
      store.getState().setPermissions({ canPlayPause: false, canSeek: false });
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
      expect(state.bufferPausedBy).toBeNull();
      expect(state.pauseSource).toBeNull();
      expect(state.controlsVisible).toBe(false);
      expect(state.permissions).toEqual({ canPlayPause: true, canSeek: true });
    });
  });
});
