import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useControlsVisibility } from './use-controls-visibility.js';
import { syncStore } from '../../../lib/sync.js';

describe('useControlsVisibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    syncStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with controls hidden', () => {
    const { result } = renderHook(() => useControlsVisibility());
    expect(result.current.controlsVisible).toBe(false);
  });

  it('toggle shows controls when hidden', () => {
    const { result } = renderHook(() => useControlsVisibility());
    act(() => {
      result.current.toggle();
    });
    expect(result.current.controlsVisible).toBe(true);
  });

  it('toggle hides controls when visible', () => {
    const { result } = renderHook(() => useControlsVisibility());
    act(() => {
      result.current.show();
    });
    expect(result.current.controlsVisible).toBe(true);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.controlsVisible).toBe(false);
  });

  it('auto-hides after 5 seconds', () => {
    const { result } = renderHook(() => useControlsVisibility());
    act(() => {
      result.current.show();
    });
    expect(result.current.controlsVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.controlsVisible).toBe(false);
  });

  it('does not auto-hide before 5 seconds', () => {
    const { result } = renderHook(() => useControlsVisibility());
    act(() => {
      result.current.show();
    });
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(result.current.controlsVisible).toBe(true);
  });

  it('resetTimer restarts the 5-second countdown', () => {
    const { result } = renderHook(() => useControlsVisibility());
    act(() => {
      result.current.show();
    });

    // Advance 3 seconds then reset
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => {
      result.current.resetTimer();
    });

    // After 4 more seconds (total 7s), should still be visible
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.controlsVisible).toBe(true);

    // After 5 seconds from reset, should hide
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.controlsVisible).toBe(false);
  });

  it('hide immediately hides controls and clears timer', () => {
    const { result } = renderHook(() => useControlsVisibility());
    act(() => {
      result.current.show();
    });
    act(() => {
      result.current.hide();
    });
    expect(result.current.controlsVisible).toBe(false);

    // Advance past auto-hide time — should not cause errors
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.controlsVisible).toBe(false);
  });

  it('show after hide resets timer', () => {
    const { result } = renderHook(() => useControlsVisibility());
    act(() => {
      result.current.show();
    });
    act(() => {
      result.current.hide();
    });
    act(() => {
      result.current.show();
    });
    expect(result.current.controlsVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.controlsVisible).toBe(false);
  });
});
