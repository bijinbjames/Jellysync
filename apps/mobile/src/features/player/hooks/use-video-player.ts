import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useVideoPlayer as useExpoVideoPlayer } from 'expo-video';
import { useStore } from 'zustand';
import { syncStore } from '../../../lib/sync.js';
import type { PlayerInterface, BufferState } from '@jellysync/shared';

export function useVideoPlayer(streamUrl: string | null) {
  const setPlaybackState = useStore(syncStore, (s) => s.setPlaybackState);
  const setBufferState = useStore(syncStore, (s) => s.setBufferState);
  const setPosition = useStore(syncStore, (s) => s.setPosition);
  const reset = useStore(syncStore, (s) => s.reset);

  const player = useExpoVideoPlayer(streamUrl, (player) => {
    player.staysActiveInBackground = true;
    player.showNowPlayingNotification = true;
  });

  const positionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);

  const startPolling = useCallback(() => {
    if (positionIntervalRef.current) return;
    positionIntervalRef.current = setInterval(() => {
      if (player.currentTime != null) {
        setPosition(player.currentTime * 1000);
      }
    }, 250);
  }, [player, setPosition]);

  const stopPolling = useCallback(() => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!player) return;

    const playingListener = player.addListener('playingChange', (event) => {
      isPlayingRef.current = event.isPlaying;
      setPlaybackState({ isPlaying: event.isPlaying });
      if (event.isPlaying) {
        startPolling();
      } else {
        stopPolling();
      }
    });

    const statusListener = player.addListener('statusChange', (event) => {
      if (event.status === 'readyToPlay') {
        setBufferState({ isBuffering: false, bufferProgress: 1 });
        const d = player.duration * 1000;
        if (Number.isFinite(d) && d > 0) {
          setPlaybackState({ duration: d });
        }
      } else if (event.status === 'loading') {
        setBufferState({ isBuffering: true, bufferProgress: 0 });
      } else if (event.status === 'idle') {
        reset();
      }
    });

    const playToEndListener = player.addListener('playToEnd', () => {
      setPlaybackState({ isPlaying: false });
      stopPolling();
    });

    return () => {
      playingListener.remove();
      statusListener.remove();
      playToEndListener.remove();
      stopPolling();
      reset();
    };
  }, [player, setPlaybackState, setBufferState, setPosition, reset, startPolling, stopPolling]);

  const play = useCallback(() => {
    player.play();
  }, [player]);

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const seek = useCallback((positionMs: number) => {
    player.currentTime = positionMs / 1000;
  }, [player]);

  const getPosition = useCallback((): number => {
    return (player.currentTime ?? 0) * 1000;
  }, [player]);

  const getBufferState = useCallback((): BufferState => {
    const state = syncStore.getState();
    const duration = state.duration;
    return {
      isBuffering: state.isBuffering,
      bufferedMs: duration > 0 ? state.bufferProgress * duration : 0,
    };
  }, []);

  const playerInterface = useMemo<PlayerInterface>(() => ({
    play,
    pause,
    seek,
    getPosition,
    getBufferState,
  }), [play, pause, seek, getPosition, getBufferState]);

  return { player, playerInterface };
}
