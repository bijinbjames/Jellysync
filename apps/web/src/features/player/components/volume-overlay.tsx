import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';
import type { Participant } from '@jellysync/shared';
import { voiceStore } from '../../../lib/voice.js';

export interface VolumeOverlayProps {
  participants: Participant[];
  onParticipantVolumeChange: (participantId: string, volume: number) => void;
  onVoiceGainChange: (gain: number) => void;
  onDismiss: () => void;
}

export function VolumeOverlay({
  participants,
  onParticipantVolumeChange,
  onVoiceGainChange,
  onDismiss,
}: VolumeOverlayProps) {
  const volumeLevels = useStore(voiceStore, (s) => s.volumeLevels);
  const voiceGain = useStore(voiceStore, (s) => s.voiceGain);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Dismiss on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onDismiss]);

  return (
    <div ref={overlayRef} style={overlayStyle}>
      {/* Overall voice volume */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Voice Volume</label>
        <div style={sliderRowStyle}>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(voiceGain * 100)}
            onChange={(e) => onVoiceGainChange(Number(e.target.value) / 100)}
            style={sliderStyle}
            aria-label="Overall voice volume"
          />
          <span style={valueStyle}>{Math.round(voiceGain * 100)}%</span>
        </div>
      </div>

      {participants.length === 0 ? (
        <div style={emptyNoteStyle}>No other participants</div>
      ) : (
        <>
          <div style={dividerStyle} />
          <div style={sectionStyle}>
            <label style={labelStyle}>Per Participant</label>
            {participants.map((p) => {
              const vol = volumeLevels.get(p.id) ?? 1.0;
              return (
                <div key={p.id} style={participantRowStyle}>
                  <span style={participantNameStyle}>{p.displayName}</span>
                  <div style={sliderRowStyle}>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(vol * 100)}
                      onChange={(e) => onParticipantVolumeChange(p.id, Number(e.target.value) / 100)}
                      style={sliderStyle}
                      aria-label={`${p.displayName} volume`}
                    />
                    <span style={valueStyle}>{Math.round(vol * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: '60px',
  right: '16px',
  background: 'rgba(54, 50, 59, 0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px',
  minWidth: '220px',
  zIndex: 100,
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  color: '#CAC4D0',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontFamily: 'Inter, sans-serif',
};

const sliderRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const sliderStyle: React.CSSProperties = {
  flex: 1,
  accentColor: '#6ee9e0',
  cursor: 'pointer',
};

const valueStyle: React.CSSProperties = {
  color: '#E6E0E9',
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
  minWidth: 36,
  textAlign: 'right',
};

const dividerStyle: React.CSSProperties = {
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  margin: '8px 0',
};

const participantRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const participantNameStyle: React.CSSProperties = {
  color: '#E6E0E9',
  fontSize: 13,
  fontFamily: 'Manrope, sans-serif',
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const emptyNoteStyle: React.CSSProperties = {
  color: '#CAC4D0',
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
  marginTop: 8,
  fontStyle: 'italic',
};
