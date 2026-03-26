import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { VolumeOverlay } from './volume-overlay.js';
import type { Participant } from '@jellysync/shared';
import { voiceStore } from '../../../lib/voice.js';

const makeParticipant = (id: string, displayName: string): Participant => ({
  id,
  displayName,
  isHost: false,
  joinedAt: Date.now(),
});

describe('VolumeOverlay', () => {
  beforeEach(() => {
    voiceStore.getState().reset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders overall voice volume slider', () => {
    render(
      <VolumeOverlay
        participants={[]}
        onParticipantVolumeChange={vi.fn()}
        onVoiceGainChange={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Overall voice volume')).toBeTruthy();
  });

  it('shows "No other participants" when participants list is empty', () => {
    render(
      <VolumeOverlay
        participants={[]}
        onParticipantVolumeChange={vi.fn()}
        onVoiceGainChange={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText('No other participants')).toBeTruthy();
  });

  it('renders per-participant sliders with participant names', () => {
    const participants = [
      makeParticipant('p1', 'Alice'),
      makeParticipant('p2', 'Bob'),
    ];
    render(
      <VolumeOverlay
        participants={participants}
        onParticipantVolumeChange={vi.fn()}
        onVoiceGainChange={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
    expect(screen.getByLabelText('Alice volume')).toBeTruthy();
    expect(screen.getByLabelText('Bob volume')).toBeTruthy();
  });

  it('reflects voiceGain value in overall slider', () => {
    voiceStore.getState().setVoiceGain(0.5);
    render(
      <VolumeOverlay
        participants={[]}
        onParticipantVolumeChange={vi.fn()}
        onVoiceGainChange={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    const slider = screen.getByLabelText('Overall voice volume') as HTMLInputElement;
    expect(slider.value).toBe('50');
  });

  it('reflects stored volume in per-participant slider', () => {
    const participants = [makeParticipant('p1', 'Alice')];
    voiceStore.getState().setVolume('p1', 0.75);
    render(
      <VolumeOverlay
        participants={participants}
        onParticipantVolumeChange={vi.fn()}
        onVoiceGainChange={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    const slider = screen.getByLabelText('Alice volume') as HTMLInputElement;
    expect(slider.value).toBe('75');
  });

  it('calls onVoiceGainChange when overall slider changes', () => {
    const onVoiceGainChange = vi.fn();
    render(
      <VolumeOverlay
        participants={[]}
        onParticipantVolumeChange={vi.fn()}
        onVoiceGainChange={onVoiceGainChange}
        onDismiss={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Overall voice volume'), { target: { value: '60' } });
    expect(onVoiceGainChange).toHaveBeenCalledWith(0.6);
  });

  it('calls onParticipantVolumeChange when per-participant slider changes', () => {
    const onParticipantVolumeChange = vi.fn();
    const participants = [makeParticipant('p1', 'Alice')];
    render(
      <VolumeOverlay
        participants={participants}
        onParticipantVolumeChange={onParticipantVolumeChange}
        onVoiceGainChange={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Alice volume'), { target: { value: '40' } });
    expect(onParticipantVolumeChange).toHaveBeenCalledWith('p1', 0.4);
  });

  it('calls onDismiss on outside mousedown', () => {
    const onDismiss = vi.fn();
    render(
      <VolumeOverlay
        participants={[]}
        onParticipantVolumeChange={vi.fn()}
        onVoiceGainChange={vi.fn()}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.mouseDown(document.body);
    expect(onDismiss).toHaveBeenCalled();
  });
});
