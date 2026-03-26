import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSyncStore, type SyncStoreInstance } from './sync-store.js';

// Test the auto-hide timer logic that will be used by useControlsVisibility hook
describe('controls visibility logic', () => {
  let store: SyncStoreInstance;

  beforeEach(() => {
    vi.useFakeTimers();
    store = createSyncStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with controls hidden', () => {
    expect(store.getState().controlsVisible).toBe(false);
  });

  it('showControls makes controls visible', () => {
    store.getState().showControls();
    expect(store.getState().controlsVisible).toBe(true);
  });

  it('hideControls makes controls hidden', () => {
    store.getState().showControls();
    store.getState().hideControls();
    expect(store.getState().controlsVisible).toBe(false);
  });

  describe('auto-hide timer simulation', () => {
    const AUTO_HIDE_MS = 5000;

    it('auto-hide fires after 5 seconds', () => {
      store.getState().showControls();
      const timer = setTimeout(() => {
        store.getState().hideControls();
      }, AUTO_HIDE_MS);

      expect(store.getState().controlsVisible).toBe(true);
      vi.advanceTimersByTime(AUTO_HIDE_MS);
      expect(store.getState().controlsVisible).toBe(false);

      clearTimeout(timer);
    });

    it('does not auto-hide before 5 seconds', () => {
      store.getState().showControls();
      const timer = setTimeout(() => {
        store.getState().hideControls();
      }, AUTO_HIDE_MS);

      vi.advanceTimersByTime(4999);
      expect(store.getState().controlsVisible).toBe(true);

      vi.advanceTimersByTime(1);
      expect(store.getState().controlsVisible).toBe(false);

      clearTimeout(timer);
    });

    it('resetTimer restarts countdown', () => {
      store.getState().showControls();
      let timer: ReturnType<typeof setTimeout>;

      const startTimer = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          store.getState().hideControls();
        }, AUTO_HIDE_MS);
      };

      startTimer();
      vi.advanceTimersByTime(3000);
      expect(store.getState().controlsVisible).toBe(true);

      // Reset timer at 3s
      startTimer();

      // 4 more seconds (total 7s) — should still be visible
      vi.advanceTimersByTime(4000);
      expect(store.getState().controlsVisible).toBe(true);

      // 1 more second (5s after reset) — should hide
      vi.advanceTimersByTime(1000);
      expect(store.getState().controlsVisible).toBe(false);

      clearTimeout(timer!);
    });

    it('toggle pattern: show → timer → hide', () => {
      // Toggle to show
      store.getState().showControls();
      const timer = setTimeout(() => {
        store.getState().hideControls();
      }, AUTO_HIDE_MS);

      expect(store.getState().controlsVisible).toBe(true);

      // Toggle to hide (immediate)
      store.getState().hideControls();
      clearTimeout(timer);
      expect(store.getState().controlsVisible).toBe(false);

      // Should not fire timer callback since it was cleared
      vi.advanceTimersByTime(AUTO_HIDE_MS);
      expect(store.getState().controlsVisible).toBe(false);
    });
  });
});
