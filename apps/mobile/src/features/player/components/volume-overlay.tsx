import { useRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, PanResponder, type LayoutChangeEvent } from 'react-native';
import { useStore } from 'zustand';
import type { Participant } from '@jellysync/shared';
import { voiceStore } from '../../../lib/voice';

export interface VolumeOverlayProps {
  participants: Participant[];
  onParticipantVolumeChange: (participantId: string, volume: number) => void;
  onVoiceGainChange: (gain: number) => void;
  onDismiss: () => void;
}

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  accessibilityLabel: string;
}

function VolumeSlider({ value, onValueChange, accessibilityLabel }: SliderProps) {
  const trackWidthRef = useRef(0);
  const trackRef = useRef<View>(null);
  const trackPageXRef = useRef(0);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          if (trackWidthRef.current > 0) {
            trackRef.current?.measure((_x, _y, _w, _h, pageX) => {
              trackPageXRef.current = pageX;
              const fraction = Math.max(0, Math.min(1, (evt.nativeEvent.pageX - pageX) / trackWidthRef.current));
              onValueChange(fraction);
            });
          }
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (trackWidthRef.current > 0) {
            const touchX = gestureState.x0 + gestureState.dx;
            const fraction = Math.max(0, Math.min(1, (touchX - trackPageXRef.current) / trackWidthRef.current));
            onValueChange(fraction);
          }
        },
        onPanResponderRelease: (_evt, gestureState) => {
          if (trackWidthRef.current > 0) {
            const touchX = gestureState.x0 + gestureState.dx;
            const fraction = Math.max(0, Math.min(1, (touchX - trackPageXRef.current) / trackWidthRef.current));
            onValueChange(fraction);
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onValueChange],
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  return (
    <View style={sliderStyles.row}>
      <View
        ref={trackRef}
        style={sliderStyles.track}
        onLayout={handleLayout}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="adjustable"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
        {...panResponder.panHandlers}
      >
        <View style={[sliderStyles.fill, { width: `${value * 100}%` as any }]} />
        <View style={[sliderStyles.thumb, { left: `${value * 100}%` as any }]} />
      </View>
      <Text style={sliderStyles.valueText}>{Math.round(value * 100)}%</Text>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#6ee9e0',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#6ee9e0',
    marginLeft: -7,
    top: -5,
  },
  valueText: {
    color: '#E6E0E9',
    fontSize: 12,
    fontFamily: 'Inter',
    minWidth: 36,
    textAlign: 'right',
  },
});

export function VolumeOverlay({
  participants,
  onParticipantVolumeChange,
  onVoiceGainChange,
  onDismiss,
}: VolumeOverlayProps) {
  const volumeLevels = useStore(voiceStore, (s) => s.volumeLevels);
  const voiceGain = useStore(voiceStore, (s) => s.voiceGain);
  return (
    // Full-screen backdrop to dismiss on outside tap
    <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Close volume overlay">
      <Pressable style={styles.overlay} onPress={() => {/* prevent dismiss on inner tap */}}>
        {/* Overall voice volume */}
        {/* Note: On mobile, react-native-webrtc plays remote audio at system volume.
            Voice gain and per-participant volume sliders update the store but have
            no direct hardware effect. Values are preserved for future-proofing. */}
        <View style={styles.section}>
          <Text style={styles.label}>Voice Volume</Text>
          <VolumeSlider
            value={voiceGain}
            onValueChange={onVoiceGainChange}
            accessibilityLabel="Overall voice volume"
          />
        </View>

        {participants.length === 0 ? (
          <Text style={styles.emptyNote}>No other participants</Text>
        ) : (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.label}>Per Participant</Text>
              {participants.map((p) => {
                const vol = volumeLevels.get(p.id) ?? 1.0;
                return (
                  <View key={p.id} style={styles.participantRow}>
                    <Text style={styles.participantName} numberOfLines={1}>{p.displayName}</Text>
                    <VolumeSlider
                      value={vol}
                      onValueChange={(v) => onParticipantVolumeChange(p.id, v)}
                      accessibilityLabel={`${p.displayName} volume`}
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(54, 50, 59, 0.85)',
    borderRadius: 12,
    padding: 16,
    minWidth: 220,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
  },
  section: {
    gap: 8,
  },
  label: {
    color: '#CAC4D0',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Inter',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  participantRow: {
    gap: 4,
  },
  participantName: {
    color: '#E6E0E9',
    fontSize: 13,
    fontFamily: 'Manrope',
    fontWeight: '600',
  },
  emptyNote: {
    color: '#CAC4D0',
    fontSize: 12,
    fontFamily: 'Inter',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
