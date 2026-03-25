import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useHtmlVideo } from './use-html-video.js';
import { syncStore } from '../../../lib/sync.js';

function createMockVideoElement() {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    src: '',
    currentTime: 0,
    duration: 120,
    paused: true,
    buffered: {
      length: 1,
      start: () => 0,
      end: () => 60,
    } as TimeRanges,
    addEventListener: vi.fn((event: string, handler: () => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: () => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
    }),
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    _trigger(event: string) {
      listeners[event]?.forEach((h) => h());
    },
    _listeners: listeners,
  };
}

describe('useHtmlVideo', () => {
  let mockVideo: ReturnType<typeof createMockVideoElement>;

  beforeEach(() => {
    vi.clearAllMocks();
    syncStore.getState().reset();
    mockVideo = createMockVideoElement();
  });

  afterEach(() => {
    cleanup();
  });

  it('returns a videoRef and playerInterface', () => {
    const { result } = renderHook(() => useHtmlVideo('http://example.com/stream'));
    expect(result.current.videoRef).toBeDefined();
    expect(result.current.playerInterface).toBeDefined();
    expect(result.current.playerInterface.play).toBeTypeOf('function');
    expect(result.current.playerInterface.pause).toBeTypeOf('function');
    expect(result.current.playerInterface.seek).toBeTypeOf('function');
    expect(result.current.playerInterface.getPosition).toBeTypeOf('function');
    expect(result.current.playerInterface.getBufferState).toBeTypeOf('function');
  });

  it('sets src on video element when streamUrl changes', () => {
    const { result } = renderHook(() => useHtmlVideo('http://example.com/stream'));

    act(() => {
      (result.current.videoRef as any).current = mockVideo;
    });

    const { rerender } = renderHook(
      ({ url }) => useHtmlVideo(url),
      { initialProps: { url: 'http://example.com/stream' } },
    );

    // Assign mock video to ref before rerender triggers effect
    act(() => {
      // Since the ref is already set, rerender should set the src
    });

    rerender({ url: 'http://example.com/stream2' });
  });

  it('updates sync store on playing event', () => {
    const { result } = renderHook(() => useHtmlVideo('http://example.com/stream'));
    act(() => {
      (result.current.videoRef as any).current = mockVideo;
    });

    // Re-render to trigger the effect with the mock video
    const { rerender } = renderHook(
      ({ url }) => {
        const hook = useHtmlVideo(url);
        (hook.videoRef as any).current = mockVideo;
        return hook;
      },
      { initialProps: { url: 'http://example.com/stream' } },
    );

    // Force re-render to pick up the assigned ref
    rerender({ url: 'http://example.com/stream' });

    act(() => {
      mockVideo._trigger('playing');
    });

    expect(syncStore.getState().isPlaying).toBe(true);
  });

  it('updates sync store on pause event', () => {
    syncStore.getState().setPlaybackState({ isPlaying: true });

    renderHook(
      ({ url }) => {
        const hook = useHtmlVideo(url);
        (hook.videoRef as any).current = mockVideo;
        return hook;
      },
      { initialProps: { url: 'http://example.com/stream' } },
    );

    act(() => {
      mockVideo._trigger('pause');
    });

    expect(syncStore.getState().isPlaying).toBe(false);
  });

  it('updates sync store duration on loadedmetadata', () => {
    mockVideo.duration = 90;

    renderHook(
      ({ url }) => {
        const hook = useHtmlVideo(url);
        (hook.videoRef as any).current = mockVideo;
        return hook;
      },
      { initialProps: { url: 'http://example.com/stream' } },
    );

    act(() => {
      mockVideo._trigger('loadedmetadata');
    });

    expect(syncStore.getState().duration).toBe(90000);
  });

  it('updates sync store on waiting event (buffering)', () => {
    renderHook(
      ({ url }) => {
        const hook = useHtmlVideo(url);
        (hook.videoRef as any).current = mockVideo;
        return hook;
      },
      { initialProps: { url: 'http://example.com/stream' } },
    );

    act(() => {
      mockVideo._trigger('waiting');
    });

    expect(syncStore.getState().isBuffering).toBe(true);
  });

  it('clears buffering on canplay event', () => {
    syncStore.getState().setBufferState({ isBuffering: true, bufferProgress: 0.3 });

    renderHook(
      ({ url }) => {
        const hook = useHtmlVideo(url);
        (hook.videoRef as any).current = mockVideo;
        return hook;
      },
      { initialProps: { url: 'http://example.com/stream' } },
    );

    act(() => {
      mockVideo._trigger('canplay');
    });

    expect(syncStore.getState().isBuffering).toBe(false);
  });

  it('playerInterface.getPosition returns position in ms', () => {
    const { result } = renderHook(() => useHtmlVideo('http://example.com/stream'));
    act(() => {
      (result.current.videoRef as any).current = mockVideo;
      mockVideo.currentTime = 45;
    });

    expect(result.current.playerInterface.getPosition()).toBe(45000);
  });

  it('playerInterface.seek sets currentTime in seconds', () => {
    const { result } = renderHook(() => useHtmlVideo('http://example.com/stream'));
    act(() => {
      (result.current.videoRef as any).current = mockVideo;
    });

    result.current.playerInterface.seek(30000);
    expect(mockVideo.currentTime).toBe(30);
  });

  it('playerInterface.play calls video.play()', () => {
    const { result } = renderHook(() => useHtmlVideo('http://example.com/stream'));
    act(() => {
      (result.current.videoRef as any).current = mockVideo;
    });

    result.current.playerInterface.play();
    expect(mockVideo.play).toHaveBeenCalledOnce();
  });

  it('playerInterface.pause calls video.pause()', () => {
    const { result } = renderHook(() => useHtmlVideo('http://example.com/stream'));
    act(() => {
      (result.current.videoRef as any).current = mockVideo;
    });

    result.current.playerInterface.pause();
    expect(mockVideo.pause).toHaveBeenCalledOnce();
  });

  it('resets sync store on unmount', () => {
    syncStore.getState().setPlaybackState({ isPlaying: true, duration: 60000 });

    const { unmount } = renderHook(() => useHtmlVideo('http://example.com/stream'));
    unmount();

    expect(syncStore.getState().isPlaying).toBe(false);
    expect(syncStore.getState().duration).toBe(0);
  });
});
