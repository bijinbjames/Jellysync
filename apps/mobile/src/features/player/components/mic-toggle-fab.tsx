import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';

interface MicToggleFABProps {
  isMuted: boolean;
  onToggle: () => void;
}

export function MicToggleFAB({ isMuted, onToggle }: MicToggleFABProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isMuted) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isMuted, pulseAnim]);

  const dotScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: !isMuted }}
      accessibilityLabel={isMuted ? 'Microphone muted' : 'Microphone on'}
      style={[styles.container, isMuted ? styles.mutedOpacity : styles.liveOpacity]}
    >
      {isMuted ? (
        <Animated.View
          style={[
            styles.dot,
            styles.mutedDot,
            { transform: [{ scale: dotScale }] },
          ]}
        />
      ) : (
        <View style={[styles.dot, styles.liveDot]} />
      )}
      <Text style={styles.icon}>{isMuted ? '🔇' : '🎙'}</Text>
      {isMuted && <Text style={styles.label}>MIC MUTED</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(54, 50, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 50,
  },
  liveOpacity: {
    opacity: 0.4,
  },
  mutedOpacity: {
    opacity: 0.6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveDot: {
    backgroundColor: '#6ee9e0',
  },
  mutedDot: {
    backgroundColor: '#f2b8b5',
  },
  icon: {
    fontSize: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#e6e1e5',
  },
});
