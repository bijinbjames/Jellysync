import { useRef, type ReactNode } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';

type ActionCardVariant = 'primary' | 'secondary';

interface ActionCardProps {
  variant: ActionCardVariant;
  headline: string;
  description: string;
  icon: string;
  onPress: () => void;
  children?: ReactNode;
}

export function ActionCard({
  variant,
  headline,
  description,
  icon,
  onPress,
  children,
}: ActionCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const activeAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const handlePressIn = () => {
    activeAnimation.current?.stop();
    activeAnimation.current = Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    });
    activeAnimation.current.start();
  };

  const handlePressOut = () => {
    activeAnimation.current?.stop();
    activeAnimation.current = Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    });
    activeAnimation.current.start();
  };

  const isPrimary = variant === 'primary';

  if (isPrimary) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={`${headline}. ${description}`}
          className="w-full rounded-2xl p-6 gradient-primary shadow-[0_20px_40px_rgba(110,233,224,0.15)]"
        >
          <View className="items-center justify-center py-6">
            <View className="relative">
              <Text className="text-5xl">{icon}</Text>
              <View className="absolute -top-2 -right-4 w-7 h-7 rounded-full bg-surface-container-lowest/30 items-center justify-center">
                <Text className="text-surface-container-lowest text-lg font-bold">+</Text>
              </View>
            </View>
          </View>
          <View className="mt-2">
            <Text className="font-display text-xl font-bold text-surface-container-lowest">
              {headline}
            </Text>
            <Text className="font-body text-sm mt-1 text-surface-container-lowest/80">
              {description}
            </Text>
          </View>
          {children && <View className="mt-4">{children}</View>}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${headline}. ${description}`}
        className="w-full rounded-2xl p-5 flex-row items-center bg-surface-container-high border border-outline-variant/15"
      >
        <View className="w-14 h-14 rounded-xl bg-surface-container-lowest/30 items-center justify-center mr-4">
          <Text className="text-2xl">{icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-display text-lg font-bold text-on-surface">
            {headline}
          </Text>
          <Text className="font-body text-sm mt-0.5 text-on-surface-variant">
            {description}
          </Text>
        </View>
        {children && <View className="ml-3">{children}</View>}
      </Pressable>
    </Animated.View>
  );
}
