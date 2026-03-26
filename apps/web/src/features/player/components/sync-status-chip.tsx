import { useEffect } from 'react';
import { useStore } from 'zustand';
import { syncStore } from '../../../lib/sync.js';

type ChipState = 'synchronized' | 'buffering' | 'paused';

function useChipState(): { state: ChipState; label: string } {
  const pauseSource = useStore(syncStore, (s) => s.pauseSource);
  const bufferPausedBy = useStore(syncStore, (s) => s.bufferPausedBy);
  const syncStatus = useStore(syncStore, (s) => s.syncStatus);

  if (pauseSource === 'buffer' && bufferPausedBy) {
    return { state: 'buffering', label: `WAITING FOR ${bufferPausedBy.toUpperCase()}...` };
  }

  if (pauseSource === 'host') {
    return { state: 'paused', label: 'PAUSED' };
  }

  return { state: 'synchronized', label: 'SYNCHRONIZED' };
}

let keyframesInjected = false;

export function SyncStatusChip() {
  const { state, label } = useChipState();

  useEffect(() => {
    if (keyframesInjected) return;
    keyframesInjected = true;
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
  }, []);

  const bgColor = state === 'synchronized'
    ? 'rgba(196, 167, 231, 0.2)'  // secondary_container/20
    : state === 'buffering'
    ? 'rgba(239, 184, 200, 0.2)'  // tertiary_container/20
    : '#36343b';  // surface_container_high

  const dotColor = state === 'synchronized'
    ? '#D0BCFF'  // secondary
    : state === 'buffering'
    ? '#EFB8C8'  // tertiary
    : '#CAC4D0'; // on_surface_variant

  const labelColor = dotColor;

  return (
    <div style={{ ...chipStyle, backgroundColor: bgColor }} role="status" aria-label={label}>
      <span
        style={{
          ...dotStyle,
          backgroundColor: dotColor,
          animation: state !== 'paused' ? 'syncPulse 2s ease-in-out infinite' : 'none',
        }}
      />
      <span style={{ ...labelStyle, color: labelColor }}>{label}</span>
    </div>
  );
}

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  paddingLeft: 12,
  paddingRight: 16,
  paddingTop: 6,
  paddingBottom: 6,
  borderRadius: 16,
};

const dotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: 0.5,
  fontFamily: 'Inter, sans-serif',
};

const keyframes = `
@keyframes syncPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.7; }
}`;
