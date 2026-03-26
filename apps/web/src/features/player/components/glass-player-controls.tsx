import { useCallback, useRef, useEffect, useState } from 'react';
import type { ParticipantPermissions, Participant } from '@jellysync/shared';
import { SyncStatusChip } from './sync-status-chip.js';
import { ParticipantAvatars } from './participant-avatars.js';

export interface GlassPlayerControlsProps {
  visible: boolean;
  isPlaying: boolean;
  isHost: boolean;
  permissions: ParticipantPermissions;
  movieTitle: string;
  currentPosition: number;
  duration: number;
  bufferProgress: number;
  participants: Participant[];
  hostId: string;
  onToggleVisibility: () => void;
  onResetTimer: () => void;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (positionMs: number) => void;
  onBack: () => void;
  onOpenPermissions?: () => void;
  onVolumePress?: () => void;
  subtitlesEnabled?: boolean;
  onSubtitleToggle?: () => void;
  steppedAwayParticipantIds?: string[];
}

function formatTime(ms: number): string {
  const safeMs = Math.max(0, ms || 0);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function GlassPlayerControls({
  visible,
  isPlaying,
  isHost,
  permissions,
  movieTitle,
  currentPosition,
  duration,
  bufferProgress,
  participants,
  hostId,
  onToggleVisibility,
  onResetTimer,
  onPlay,
  onPause,
  onSeek,
  onBack,
  onOpenPermissions,
  onVolumePress,
  subtitlesEnabled = false,
  onSubtitleToggle,
  steppedAwayParticipantIds = [],
}: GlassPlayerControlsProps) {
  const seekBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragPositionRef = useRef(currentPosition);
  const cleanupDragRef = useRef<(() => void) | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDisplayPosition, setDragDisplayPosition] = useState(0);
  const [jewelPressed, setJewelPressed] = useState(false);

  const canPlayPause = isHost || permissions.canPlayPause;
  const canSeek = isHost || permissions.canSeek;

  const displayPosition = isDragging ? dragDisplayPosition : currentPosition;
  const progress = duration > 0 ? displayPosition / duration : 0;
  const bufferFraction = duration > 0 ? bufferProgress : 0;

  // Clean up drag listeners on unmount
  useEffect(() => {
    return () => {
      cleanupDragRef.current?.();
    };
  }, []);

  const computeSeekPosition = useCallback((clientX: number): number | undefined => {
    if (!seekBarRef.current || !canSeek) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const pos = fraction * duration;
    dragPositionRef.current = pos;
    setDragDisplayPosition(pos);
    return pos;
  }, [duration, canSeek]);

  const handleSeekMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canSeek) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    onResetTimer();
    computeSeekPosition(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      computeSeekPosition(moveEvent.clientX);
    };

    const cleanup = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      cleanupDragRef.current = null;
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      isDraggingRef.current = false;
      setIsDragging(false);
      const pos = computeSeekPosition(upEvent.clientX);
      if (pos !== undefined) {
        onSeek(pos);
      }
      onResetTimer();
      cleanup();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    cleanupDragRef.current = cleanup;
  }, [canSeek, duration, onSeek, onResetTimer, computeSeekPosition]);

  const handlePlayPause = useCallback(() => {
    if (!canPlayPause) return;
    onResetTimer();
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [canPlayPause, isPlaying, onPlay, onPause, onResetTimer]);

  const handleSkipBack = useCallback(() => {
    if (!canSeek) return;
    onResetTimer();
    onSeek(Math.max(0, currentPosition - 10000));
  }, [canSeek, currentPosition, onSeek, onResetTimer]);

  const handleSkipForward = useCallback(() => {
    if (!canSeek) return;
    onResetTimer();
    onSeek(Math.min(duration, currentPosition + 10000));
  }, [canSeek, currentPosition, duration, onSeek, onResetTimer]);

  if (!visible) {
    return (
      <div
        style={tapAreaStyle}
        onClick={onToggleVisibility}
        role="button"
        tabIndex={0}
        aria-label="Show player controls"
      />
    );
  }

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onToggleVisibility();
      }}
      role="button"
      tabIndex={0}
      aria-label="Player controls overlay"
    >
      {/* Top gradient */}
      <div style={topGradientStyle} />

      {/* Top bar */}
      <div style={topBarStyle}>
        <div style={glassBarStyle}>
          <button type="button" onClick={onBack} style={iconButtonStyle} aria-label="Back">
            ←
          </button>
          <span style={movieTitleStyle}>{movieTitle}</span>
          <div style={topBarActionsStyle}>
            <span style={qualityLabelStyle}>HD</span>
            <button
              type="button"
              style={subtitlesEnabled ? ccActiveButtonStyle : iconButtonStyle}
              aria-label={subtitlesEnabled ? 'Disable subtitles' : 'Enable subtitles'}
              onClick={onSubtitleToggle}
            >
              CC
            </button>
            <button
              type="button"
              onClick={onVolumePress}
              style={iconButtonStyle}
              aria-label="Volume controls"
            >
              🔊
            </button>
            {isHost && onOpenPermissions && (
              <button type="button" onClick={onOpenPermissions} style={iconButtonStyle} aria-label="Permission settings">
                ⚙
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Center controls */}
      <div style={centerControlsStyle}>
        <button
          type="button"
          onClick={handleSkipBack}
          style={canSeek ? skipButtonStyle : disabledButtonStyle}
          aria-label="Skip back 10 seconds"
          disabled={!canSeek}
        >
          ⏪
        </button>
        <button
          type="button"
          onClick={handlePlayPause}
          onMouseDown={() => canPlayPause && setJewelPressed(true)}
          onMouseUp={() => setJewelPressed(false)}
          onMouseLeave={() => setJewelPressed(false)}
          style={canPlayPause
            ? { ...jewButtonStyle, ...(jewelPressed ? { transform: 'scale(0.95)' } : {}) }
            : disabledJewelStyle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          disabled={!canPlayPause}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          onClick={handleSkipForward}
          style={canSeek ? skipButtonStyle : disabledButtonStyle}
          aria-label="Skip forward 10 seconds"
          disabled={!canSeek}
        >
          ⏩
        </button>
      </div>

      {/* Bottom section */}
      <div style={bottomSectionStyle}>
        {/* Seek bar */}
        <div style={seekBarContainerStyle}>
          <span style={timestampStyle}>{formatTime(displayPosition)}</span>
          <div
            ref={seekBarRef}
            style={canSeek ? seekBarTrackStyle : { ...seekBarTrackStyle, opacity: 0.5 }}
            onMouseDown={handleSeekMouseDown}
            role="slider"
            aria-label="Seek bar"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentPosition}
            tabIndex={canSeek ? 0 : -1}
          >
            {/* Buffer progress */}
            <div style={{ ...bufferBarStyle, width: `${bufferFraction * 100}%` }} />
            {/* Playback progress */}
            <div style={{ ...progressBarStyle, width: `${progress * 100}%` }} />
            {/* Playhead dot */}
            {canSeek && (
              <div style={{
                ...playheadStyle,
                left: `${progress * 100}%`,
                ...(isDragging ? { width: 16, height: 16 } : {}),
              }} />
            )}
          </div>
          <span style={timestampStyle}>{formatTime(duration)}</span>
        </div>

        {/* Avatars + SyncStatusChip */}
        <div style={bottomRowStyle}>
          <ParticipantAvatars participants={participants} hostId={hostId} steppedAwayParticipantIds={steppedAwayParticipantIds} />
          <SyncStatusChip />
        </div>
      </div>

      {/* Bottom gradient */}
      <div style={bottomGradientStyle} />
    </div>
  );
}

const tapAreaStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 10,
  cursor: 'pointer',
};

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const topGradientStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 120,
  background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
  pointerEvents: 'none',
};

const bottomGradientStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 200,
  background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
  pointerEvents: 'none',
};

const topBarStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 11,
  padding: '48px 16px 0',
};

const glassBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 12px',
  borderRadius: 12,
  backgroundColor: 'rgba(54, 50, 59, 0.4)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

const movieTitleStyle: React.CSSProperties = {
  flex: 1,
  color: '#E6E0E9',
  fontSize: 16,
  fontWeight: 800,
  fontFamily: 'Manrope, sans-serif',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const topBarActionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const qualityLabelStyle: React.CSSProperties = {
  color: '#c8bfff',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  fontFamily: 'Inter, sans-serif',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#E6E0E9',
  fontSize: 18,
  cursor: 'pointer',
  padding: 8,
  minWidth: 40,
  minHeight: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const ccActiveButtonStyle: React.CSSProperties = {
  ...iconButtonStyle,
  color: '#6ee9e0',
  backgroundColor: 'rgba(110, 233, 224, 0.2)',
  borderRadius: 8,
};

const centerControlsStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 11,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 32,
  flex: 1,
};

const skipButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#E6E0E9',
  fontSize: 28,
  cursor: 'pointer',
  padding: 12,
  minWidth: 48,
  minHeight: 48,
};

const disabledButtonStyle: React.CSSProperties = {
  ...skipButtonStyle,
  color: '#CAC4D0',
  backgroundColor: 'rgba(54, 50, 59, 0.4)',
  borderRadius: 24,
  cursor: 'not-allowed',
  opacity: 0.5,
};

const jewButtonStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  backgroundColor: 'rgba(54, 50, 59, 0.4)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: 'none',
  color: '#6ee9e0',
  fontSize: 24,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 24px rgba(110, 233, 224, 0.3)',
  transition: 'transform 100ms',
};

const disabledJewelStyle: React.CSSProperties = {
  ...jewButtonStyle,
  color: '#CAC4D0',
  boxShadow: 'none',
  cursor: 'not-allowed',
  opacity: 0.5,
};

const bottomSectionStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 11,
  padding: '0 16px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const seekBarContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const timestampStyle: React.CSSProperties = {
  color: '#CAC4D0',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'Inter, sans-serif',
  fontVariantNumeric: 'tabular-nums',
  minWidth: 48,
  textAlign: 'center',
};

const seekBarTrackStyle: React.CSSProperties = {
  flex: 1,
  height: 4,
  backgroundColor: '#36323B',
  borderRadius: 2,
  position: 'relative',
  cursor: 'pointer',
};

const bufferBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 2,
};

const progressBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  background: 'linear-gradient(to right, rgba(110, 233, 224, 0.8), #6ee9e0)',
  borderRadius: 2,
};

const playheadStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: '#6ee9e0',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
};

const bottomRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};
