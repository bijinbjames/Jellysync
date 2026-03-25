import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from 'zustand';
import { syncStore } from '../../../lib/sync.js';
import type { PlayerInterface, BufferState } from '@jellysync/shared';

export function useHtmlVideo(streamUrl: string | null) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const setPlaybackState = useStore(syncStore, (s) => s.setPlaybackState);
  const setBufferState = useStore(syncStore, (s) => s.setBufferState);
  const setPosition = useStore(syncStore, (s) => s.setPosition);
  const reset = useStore(syncStore, (s) => s.reset);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    const onTimeUpdate = () => {
      setPosition(video.currentTime * 1000);
    };

    const onPlaying = () => {
      setPlaybackState({ isPlaying: true });
    };

    const onPause = () => {
      setPlaybackState({ isPlaying: false });
    };

    const onWaiting = () => {
      setBufferState({ isBuffering: true, bufferProgress: getBufferedProgress(video) });
    };

    const onCanPlay = () => {
      setBufferState({ isBuffering: false, bufferProgress: getBufferedProgress(video) });
    };

    const onLoadedMetadata = () => {
      const d = video.duration * 1000;
      if (Number.isFinite(d)) {
        setPlaybackState({ duration: d });
      }
    };

    const onEnded = () => {
      setPlaybackState({ isPlaying: false });
    };

    const onProgress = () => {
      setBufferState({
        isBuffering: syncStore.getState().isBuffering,
        bufferProgress: getBufferedProgress(video),
      });
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);
    video.addEventListener('progress', onProgress);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('progress', onProgress);
    };
  }, [streamUrl, setPlaybackState, setBufferState, setPosition, reset]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const play = useCallback(() => {
    videoRef.current?.play().catch(() => {
      // Autoplay blocked by browser policy — sync store already reflects paused state
    });
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const seek = useCallback((positionMs: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = positionMs / 1000;
    }
  }, []);

  const getPosition = useCallback((): number => {
    return (videoRef.current?.currentTime ?? 0) * 1000;
  }, []);

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

  return { videoRef, playerInterface };
}

function getBufferedProgress(video: HTMLVideoElement): number {
  if (video.buffered.length === 0 || !Number.isFinite(video.duration) || video.duration === 0) return 0;
  try {
    return video.buffered.end(video.buffered.length - 1) / video.duration;
  } catch {
    return 0;
  }
}
