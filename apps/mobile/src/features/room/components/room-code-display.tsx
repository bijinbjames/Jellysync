import { useEffect, useRef } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { useShareRoom } from '../hooks/use-share-room';

interface RoomCodeDisplayProps {
  code: string;
}

function formatCode(code: string): string {
  if (code.length <= 3) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

function PulseDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className="w-3 h-3 rounded-full bg-primary absolute -top-1 -right-1"
    />
  );
}

export function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const { shareRoom, copyCode, copied } = useShareRoom(code);
  const accessibleCode = code.split('').join(' ');

  return (
    <View className="p-6 rounded-2xl bg-surface-container-high/40 border border-outline-variant/15">
      <View className="items-center">
        <View className="relative">
          <Text
            className="font-mono text-6xl text-primary tracking-[0.2em]"
            accessibilityLabel={`Room code: ${accessibleCode}`}
            accessibilityRole="text"
          >
            {formatCode(code)}
          </Text>
          <PulseDot />
        </View>
      </View>

      <View className="mt-6 gap-3">
        <Pressable
          onPress={shareRoom}
          accessibilityRole="button"
          accessibilityLabel="Share room link"
          className="gradient-primary rounded-xl min-h-[48px] items-center justify-center"
        >
          <Text className="text-surface-container-lowest font-display text-sm font-bold">
            Share Link
          </Text>
        </Pressable>

        <Pressable
          onPress={copyCode}
          accessibilityRole="button"
          accessibilityLabel={copied ? 'Code copied' : 'Copy room code'}
          className="min-h-[48px] items-center justify-center"
        >
          <Text className="text-primary font-body text-sm text-center">
            {copied ? '\u2713 Copied!' : 'Copy Code'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
