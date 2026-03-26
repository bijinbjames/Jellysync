import { useCallback, useRef, useEffect } from 'react';
import { useStore } from 'zustand';
import { syncStore } from '../../../lib/sync.js';

const AUTO_HIDE_MS = 5000;

export function useControlsVisibility() {
  const controlsVisible = useStore(syncStore, (s) => s.controlsVisible);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      syncStore.getState().hideControls();
      timerRef.current = null;
    }, AUTO_HIDE_MS);
  }, [clearTimer]);

  const show = useCallback(() => {
    syncStore.getState().showControls();
    startTimer();
  }, [startTimer]);

  const hide = useCallback(() => {
    syncStore.getState().hideControls();
    clearTimer();
  }, [clearTimer]);

  const toggle = useCallback(() => {
    if (!syncStore.getState().controlsVisible) {
      show();
    } else {
      hide();
    }
  }, [show, hide]);

  const resetTimer = useCallback(() => {
    if (syncStore.getState().controlsVisible) {
      startTimer();
    }
  }, [startTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return { controlsVisible, toggle, show, hide, resetTimer };
}
