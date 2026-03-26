import { useCallback, useRef, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, PanResponder, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const seekBarWidthRef = useRef(0);
  const seekBarRef = useRef<View>(null);

  const canPlayPause = isHost || permissions.canPlayPause;
  const canSeek = isHost || permissions.canSeek;

  const progress = duration > 0 ? currentPosition / duration : 0;
  const bufferFraction = duration > 0 ? bufferProgress : 0;

  // Store current values in refs so PanResponder callbacks always read fresh values
  const canSeekRef = useRef(canSeek);
  canSeekRef.current = canSeek;
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;
  const onResetTimerRef = useRef(onResetTimer);
  onResetTimerRef.current = onResetTimer;

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => canSeekRef.current,
      onMoveShouldSetPanResponder: () => canSeekRef.current,
      onPanResponderGrant: () => {
        onResetTimerRef.current();
      },
      onPanResponderMove: () => {
        // Real-time position update during drag — visual feedback via progress bar
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (seekBarWidthRef.current > 0) {
          // Use x0 (initial touch X) + dx (accumulated delta) for screen-absolute position
          const touchX = gestureState.x0 + gestureState.dx;
          // Measure absolute page position of the seek bar
          seekBarRef.current?.measure((_x, _y, width, _height, pageX) => {
            const barWidth = width || seekBarWidthRef.current;
            const fraction = Math.max(0, Math.min(1, (touchX - pageX) / barWidth));
            onSeekRef.current(fraction * durationRef.current);
          });
        }
        onResetTimerRef.current();
      },
    }),
    [], // Stable — all mutable values read through refs
  );

  const handleSeekBarLayout = useCallback((e: LayoutChangeEvent) => {
    seekBarWidthRef.current = e.nativeEvent.layout.width;
  }, []);

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
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onToggleVisibility}
        accessibilityRole="button"
        accessibilityLabel="Show player controls"
      />
    );
  }

  return (
    <View style={styles.overlay}>
      {/* Tap to dismiss */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onToggleVisibility}
      />

      {/* Top gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.glassBar}>
          <Pressable onPress={onBack} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.iconText}>←</Text>
          </Pressable>
          <Text style={styles.movieTitle} numberOfLines={1}>{movieTitle}</Text>
          <View style={styles.topBarActions}>
            <Text style={styles.qualityLabel}>HD</Text>
            <Pressable
              onPress={onSubtitleToggle}
              style={subtitlesEnabled ? styles.ccActiveButton : styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={subtitlesEnabled ? 'Disable subtitles' : 'Enable subtitles'}
            >
              <Text style={subtitlesEnabled ? styles.ccActiveText : styles.iconText}>CC</Text>
            </Pressable>
            <Pressable onPress={onVolumePress} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Volume controls">
              <Text style={styles.iconText}>🔊</Text>
            </Pressable>
            {isHost && onOpenPermissions && (
              <Pressable onPress={onOpenPermissions} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Permission settings">
                <Text style={styles.iconText}>⚙</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Center controls */}
      <View style={styles.centerControls}>
        <Pressable
          onPress={handleSkipBack}
          style={canSeek ? styles.skipButton : styles.disabledButton}
          disabled={!canSeek}
          accessibilityRole="button"
          accessibilityLabel="Skip back 10 seconds"
        >
          <Text style={canSeek ? styles.skipText : styles.disabledText}>⏪</Text>
        </Pressable>
        <Pressable
          onPress={handlePlayPause}
          style={canPlayPause ? styles.jewelButton : styles.disabledJewel}
          disabled={!canPlayPause}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          <Text style={canPlayPause ? styles.jewelIcon : styles.disabledJewelIcon}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSkipForward}
          style={canSeek ? styles.skipButton : styles.disabledButton}
          disabled={!canSeek}
          accessibilityRole="button"
          accessibilityLabel="Skip forward 10 seconds"
        >
          <Text style={canSeek ? styles.skipText : styles.disabledText}>⏩</Text>
        </Pressable>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Seek bar */}
        <View style={styles.seekBarContainer}>
          <Text style={styles.timestamp}>{formatTime(currentPosition)}</Text>
          <View
            ref={seekBarRef}
            style={[styles.seekBarTrack, !canSeek && { opacity: 0.5 }]}
            onLayout={handleSeekBarLayout}
            {...(canSeek ? panResponder.panHandlers : {})}
          >
            <View style={[styles.bufferBar, { width: `${bufferFraction * 100}%` }]} />
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            {canSeek && (
              <View style={[styles.playhead, { left: `${progress * 100}%` }]} />
            )}
          </View>
          <Text style={styles.timestamp}>{formatTime(duration)}</Text>
        </View>

        {/* Avatars + SyncStatusChip */}
        <View style={styles.bottomRow}>
          <ParticipantAvatars participants={participants} hostId={hostId} steppedAwayParticipantIds={steppedAwayParticipantIds} />
          <SyncStatusChip />
        </View>
      </View>

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'space-between',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  topBar: {
    zIndex: 11,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  glassBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(54, 50, 59, 0.4)',
  },
  movieTitle: {
    flex: 1,
    color: '#E6E0E9',
    fontSize: 16,
    fontWeight: '800',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityLabel: {
    color: '#c8bfff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#E6E0E9',
    fontSize: 18,
  },
  ccActiveButton: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(110, 233, 224, 0.2)',
    borderRadius: 8,
  },
  ccActiveText: {
    color: '#6ee9e0',
    fontSize: 18,
  },
  centerControls: {
    zIndex: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    flex: 1,
  },
  skipButton: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
  },
  skipText: {
    color: '#E6E0E9',
    fontSize: 28,
    textAlign: 'center',
  },
  disabledButton: {
    padding: 12,
    minWidth: 48,
    minHeight: 48,
    backgroundColor: 'rgba(54, 50, 59, 0.4)',
    borderRadius: 24,
    opacity: 0.5,
  },
  disabledText: {
    color: '#CAC4D0',
    fontSize: 28,
    textAlign: 'center',
  },
  jewelButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(54, 50, 59, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jewelIcon: {
    color: '#6ee9e0',
    fontSize: 24,
  },
  disabledJewel: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(54, 50, 59, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  disabledJewelIcon: {
    color: '#CAC4D0',
    fontSize: 24,
  },
  bottomSection: {
    zIndex: 11,
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 8,
  },
  seekBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    color: '#CAC4D0',
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    minWidth: 48,
    textAlign: 'center',
  },
  seekBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#36323B',
    borderRadius: 2,
    justifyContent: 'center',
  },
  bufferBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#6ee9e0',
    borderRadius: 2,
  },
  playhead: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6ee9e0',
    marginLeft: -8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
