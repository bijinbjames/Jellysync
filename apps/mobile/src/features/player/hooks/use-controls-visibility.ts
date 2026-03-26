import { useCallback, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { useStore } from 'zustand';
import { syncStore } from '../../../lib/sync.js';

const AUTO_HIDE_MS = 5000;
const FADE_DURATION_MS = 200;

export function useControlsVisibility() {
  const controlsVisible = useStore(syncStore, (s) => s.controlsVisible);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();
      timerRef.current = null;
    }, AUTO_HIDE_MS);
  }, [clearTimer, fadeAnim]);

  const show = useCallback(() => {
    syncStore.getState().showControls();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    }).start();
    startTimer();
  }, [fadeAnim, startTimer]);

  const hide = useCallback(() => {
    syncStore.getState().hideControls();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    }).start();
    clearTimer();
  }, [fadeAnim, clearTimer]);

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

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return { controlsVisible, toggle, show, hide, resetTimer, fadeAnim };
}
