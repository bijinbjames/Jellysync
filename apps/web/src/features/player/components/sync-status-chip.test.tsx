import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SyncStatusChip } from './sync-status-chip.js';
import { syncStore } from '../../../lib/sync.js';

describe('SyncStatusChip', () => {
  beforeEach(() => {
    syncStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders SYNCHRONIZED by default', () => {
    render(<SyncStatusChip />);
    expect(screen.getByLabelText('SYNCHRONIZED')).toBeTruthy();
  });

  it('renders WAITING FOR [NAME]... during buffer pause', () => {
    syncStore.getState().setBufferPause('Alice');
    render(<SyncStatusChip />);
    expect(screen.getByLabelText('WAITING FOR ALICE...')).toBeTruthy();
  });

  it('renders PAUSED during host pause', () => {
    syncStore.getState().setHostPause();
    render(<SyncStatusChip />);
    expect(screen.getByLabelText('PAUSED')).toBeTruthy();
  });

  it('transitions from buffering to synchronized on clearBufferPause', () => {
    syncStore.getState().setBufferPause('Alice');
    const { rerender } = render(<SyncStatusChip />);
    expect(screen.getByLabelText('WAITING FOR ALICE...')).toBeTruthy();

    syncStore.getState().clearBufferPause();
    rerender(<SyncStatusChip />);
    expect(screen.getByLabelText('SYNCHRONIZED')).toBeTruthy();
  });

  it('transitions from buffer to host pause', () => {
    syncStore.getState().setBufferPause('Alice');
    const { rerender } = render(<SyncStatusChip />);
    expect(screen.getByLabelText('WAITING FOR ALICE...')).toBeTruthy();

    syncStore.getState().setHostPause();
    rerender(<SyncStatusChip />);
    expect(screen.getByLabelText('PAUSED')).toBeTruthy();
  });
});
