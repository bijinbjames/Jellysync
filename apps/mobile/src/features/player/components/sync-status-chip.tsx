import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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

const COLORS = {
  synchronized: {
    bg: 'rgba(196, 167, 231, 0.2)',
    dot: '#D0BCFF',
  },
  buffering: {
    bg: 'rgba(239, 184, 200, 0.2)',
    dot: '#EFB8C8',
  },
  paused: {
    bg: '#36343b',
    dot: '#CAC4D0',
  },
};

export function SyncStatusChip() {
  const { state, label } = useChipState();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'paused') {
      pulseAnim.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [state, pulseAnim]);

  const colors = COLORS[state];

  return (
    <View
      style={[styles.chip, { backgroundColor: colors.bg }]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: colors.dot,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Text style={[styles.label, { color: colors.dot }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
