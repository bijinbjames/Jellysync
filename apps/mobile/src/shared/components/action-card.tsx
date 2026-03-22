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

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${headline}. ${description}`}
        className={`w-full h-64 rounded-lg p-6 justify-between ${
          isPrimary
            ? 'gradient-primary shadow-[0_20px_40px_rgba(110,233,224,0.15)]'
            : 'bg-surface-container-high border border-outline-variant/15'
        }`}
      >
        <View>
          <Text className="text-3xl mb-2">{icon}</Text>
          <Text
            className={`font-display text-xl font-bold ${
              isPrimary ? 'text-surface-container-lowest' : 'text-on-surface'
            }`}
          >
            {headline}
          </Text>
          <Text
            className={`font-body text-sm mt-1 ${
              isPrimary ? 'text-surface-container-lowest/80' : 'text-on-surface-variant'
            }`}
          >
            {description}
          </Text>
        </View>
        {children && <View>{children}</View>}
      </Pressable>
    </Animated.View>
  );
}
