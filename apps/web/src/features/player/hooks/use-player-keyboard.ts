import { useEffect, useRef } from 'react';
import type { ParticipantPermissions } from '@jellysync/shared';
import { syncStore } from '../../../lib/sync.js';

export interface UsePlayerKeyboardOptions {
  isHost: boolean;
  permissions: ParticipantPermissions;
  isPlaying: boolean;
  controlsVisible: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (positionMs: number) => void;
  onHideControls: () => void;
}

function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export function usePlayerKeyboard({
  isHost,
  permissions,
  isPlaying,
  controlsVisible,
  onPlay,
  onPause,
  onSeek,
  onHideControls,
}: UsePlayerKeyboardOptions) {
  // Store callbacks in refs to avoid re-registering the listener on every change
  const stateRef = useRef({ isHost, permissions, isPlaying, controlsVisible });
  stateRef.current = { isHost, permissions, isPlaying, controlsVisible };

  const callbacksRef = useRef({ onPlay, onPause, onSeek, onHideControls });
  callbacksRef.current = { onPlay, onPause, onSeek, onHideControls };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isInputElement(e.target)) return;

      const { isHost: host, permissions: perms, isPlaying: playing, controlsVisible: visible } = stateRef.current;
      const { onPlay: play, onPause: pause, onSeek: seek, onHideControls: hideControls } = callbacksRef.current;
      const canPlayPause = host || perms.canPlayPause;
      const canSeek = host || perms.canSeek;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (canPlayPause) {
            if (playing) {
              pause();
            } else {
              play();
            }
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (canSeek) {
            const pos = syncStore.getState().playbackPosition;
            seek(Math.max(0, pos - 10000));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (canSeek) {
            const pos = syncStore.getState().playbackPosition;
            const dur = syncStore.getState().duration;
            seek(Math.min(dur, pos + 10000));
          }
          break;
        case 'm':
        case 'M':
          // Mute toggle placeholder (Epic 5)
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen().catch(() => {
              // Fullscreen may be blocked by browser policy
            });
          }
          break;
        case 'Escape':
          if (visible) {
            e.preventDefault();
            hideControls();
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Stable — all mutable values read through refs
}
