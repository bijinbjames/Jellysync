import { describe, it, expect, beforeEach } from 'vitest';
import { createSyncStore, type SyncStoreInstance } from './sync-store.js';

describe('permissions integration', () => {
  let store: SyncStoreInstance;

  beforeEach(() => {
    store = createSyncStore();
  });

  describe('permission state flow', () => {
    it('defaults to all permissions allowed', () => {
      const { permissions } = store.getState();
      expect(permissions.canPlayPause).toBe(true);
      expect(permissions.canSeek).toBe(true);
    });

    it('can restrict play/pause permission', () => {
      store.getState().setPermissions({ canPlayPause: false, canSeek: true });
      expect(store.getState().permissions.canPlayPause).toBe(false);
      expect(store.getState().permissions.canSeek).toBe(true);
    });

    it('can restrict seek permission', () => {
      store.getState().setPermissions({ canPlayPause: true, canSeek: false });
      expect(store.getState().permissions.canPlayPause).toBe(true);
      expect(store.getState().permissions.canSeek).toBe(false);
    });

    it('can restrict all permissions', () => {
      store.getState().setPermissions({ canPlayPause: false, canSeek: false });
      expect(store.getState().permissions.canPlayPause).toBe(false);
      expect(store.getState().permissions.canSeek).toBe(false);
    });

    it('reset restores default permissions', () => {
      store.getState().setPermissions({ canPlayPause: false, canSeek: false });
      store.getState().reset();
      expect(store.getState().permissions).toEqual({ canPlayPause: true, canSeek: true });
    });

    it('permissions persist through other state changes', () => {
      store.getState().setPermissions({ canPlayPause: false, canSeek: false });
      store.getState().setPlaybackState({ isPlaying: true, duration: 120000 });
      store.getState().setSyncStatus('syncing');

      expect(store.getState().permissions).toEqual({ canPlayPause: false, canSeek: false });
      expect(store.getState().isPlaying).toBe(true);
    });
  });

  describe('controls visibility with permissions', () => {
    it('controls visibility works independently of permissions', () => {
      store.getState().setPermissions({ canPlayPause: false, canSeek: false });
      store.getState().showControls();
      expect(store.getState().controlsVisible).toBe(true);

      store.getState().hideControls();
      expect(store.getState().controlsVisible).toBe(false);
    });
  });
});
