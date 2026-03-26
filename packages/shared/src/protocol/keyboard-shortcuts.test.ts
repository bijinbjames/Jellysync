import { describe, it, expect, vi } from 'vitest';

// Test keyboard shortcut logic as pure functions (mirrors use-player-keyboard.ts)

function isInputElement(target: { tagName?: string; isContentEditable?: boolean } | null): boolean {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable === true;
}

interface KeyboardActions {
  play: () => void;
  pause: () => void;
  seek: (positionMs: number) => void;
  hideControls: () => void;
}

function handleKeyAction(
  key: string,
  options: {
    isHost: boolean;
    canPlayPause: boolean;
    canSeek: boolean;
    isPlaying: boolean;
    currentPosition: number;
    controlsVisible: boolean;
  },
  actions: KeyboardActions,
): boolean {
  const { isHost, canPlayPause, canSeek, isPlaying, currentPosition, controlsVisible } = options;
  const effectivePlayPause = isHost || canPlayPause;
  const effectiveSeek = isHost || canSeek;

  switch (key) {
    case ' ':
      if (effectivePlayPause) {
        if (isPlaying) actions.pause();
        else actions.play();
      }
      return true;
    case 'ArrowLeft':
      if (effectiveSeek) actions.seek(Math.max(0, currentPosition - 10000));
      return true;
    case 'ArrowRight':
      if (effectiveSeek) actions.seek(currentPosition + 10000);
      return true;
    case 'Escape':
      if (controlsVisible) actions.hideControls();
      return true;
    default:
      return false;
  }
}

describe('keyboard shortcut logic', () => {
  describe('input guard', () => {
    it('detects input elements', () => {
      expect(isInputElement({ tagName: 'INPUT' })).toBe(true);
      expect(isInputElement({ tagName: 'TEXTAREA' })).toBe(true);
    });

    it('detects contenteditable', () => {
      expect(isInputElement({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    });

    it('returns false for non-input elements', () => {
      expect(isInputElement({ tagName: 'DIV' })).toBe(false);
      expect(isInputElement(null)).toBe(false);
    });
  });

  describe('Space key', () => {
    it('calls pause when playing and has permission', () => {
      const actions = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), hideControls: vi.fn() };
      handleKeyAction(' ', { isHost: false, canPlayPause: true, canSeek: true, isPlaying: true, currentPosition: 5000, controlsVisible: false }, actions);
      expect(actions.pause).toHaveBeenCalled();
      expect(actions.play).not.toHaveBeenCalled();
    });

    it('calls play when paused and has permission', () => {
      const actions = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), hideControls: vi.fn() };
      handleKeyAction(' ', { isHost: false, canPlayPause: true, canSeek: true, isPlaying: false, currentPosition: 5000, controlsVisible: false }, actions);
      expect(actions.play).toHaveBeenCalled();
    });

    it('does nothing without canPlayPause permission (non-host)', () => {
      const actions = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), hideControls: vi.fn() };
      handleKeyAction(' ', { isHost: false, canPlayPause: false, canSeek: true, isPlaying: true, currentPosition: 5000, controlsVisible: false }, actions);
      expect(actions.pause).not.toHaveBeenCalled();
      expect(actions.play).not.toHaveBeenCalled();
    });

    it('host can always play/pause regardless of permissions', () => {
      const actions = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), hideControls: vi.fn() };
      handleKeyAction(' ', { isHost: true, canPlayPause: false, canSeek: false, isPlaying: true, currentPosition: 5000, controlsVisible: false }, actions);
      expect(actions.pause).toHaveBeenCalled();
    });
  });

  describe('ArrowLeft key', () => {
    it('seeks back 10 seconds with permission', () => {
      const actions = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), hideControls: vi.fn() };
      handleKeyAction('ArrowLeft', { isHost: false, canPlayPause: true, canSeek: true, isPlaying: true, currentPosition: 15000, controlsVisible: false }, actions);
      expect(actions.seek).toHaveBeenCalledWith(5000);
    });

    it('clamps to 0', () => {
      const actions = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), hideControls: vi.fn() };
      handleKeyAction('ArrowLeft', { isHost: false, canPlayPause: true, canSeek: true, isPlaying: true, currentPosition: 3000, controlsVisible: false }, actions);
      expect(actions.seek).toHaveBeenCalledWith(0);
    });

    it('does nothing without canSeek permission', () => {
      const actions = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), hideControls: vi.fn() };
      handleKeyAction('ArrowLeft', { isHost: false, canPlayPause: true, canSeek: false, isPlaying: true, currentPosition: 15000, controlsVisible: false }, actions);
      expect(actions.seek).not.toHaveBeenCalled();
    });
  });

  describe('ArrowRight key', () => {
    it('seeks forward 10 seconds with permission', () => {
      const actions = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), hideControls: vi.fn() };
      handleKeyAction('ArrowRight', { isHost: false, canPlayPause: true, canSeek: true, isPlaying: true, currentPosition: 15000, controlsVisible: false }, actions);
      expect(actions.seek).toHaveBeenCalledWith(25000);
    });

    it('does nothing without canSeek permission', () => {
      const actions = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), hideControls: vi.fn() };
      handleKeyAction('ArrowRight', { isHost: false, canPlayPause: true, canSeek: false, isPlaying: true, currentPosition: 15000, controlsVisible: false }, actions);
      expect(actions.seek).not.toHaveBeenCalled();
    });
  });

  describe('Escape key', () => {
    it('hides controls when visible', () => {
      const actions = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), hideControls: vi.fn() };
      handleKeyAction('Escape', { isHost: false, canPlayPause: true, canSeek: true, isPlaying: true, currentPosition: 5000, controlsVisible: true }, actions);
      expect(actions.hideControls).toHaveBeenCalled();
    });

    it('does nothing when controls are hidden', () => {
      const actions = { play: vi.fn(), pause: vi.fn(), seek: vi.fn(), hideControls: vi.fn() };
      handleKeyAction('Escape', { isHost: false, canPlayPause: true, canSeek: true, isPlaying: true, currentPosition: 5000, controlsVisible: false }, actions);
      expect(actions.hideControls).not.toHaveBeenCalled();
    });
  });
});
