import { View, Text, Pressable } from 'react-native';

type GlassHeaderVariant = 'home' | 'navigation' | 'branded';

interface GlassHeaderProps {
  variant: GlassHeaderVariant;
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
  onBack?: () => void;
}

export function GlassHeader(props: GlassHeaderProps) {
  const { variant, title, subtitle, onAction, actionLabel = 'Log out', onBack } = props;

  if (variant === 'navigation') {
    return (
      <View
        className="glass px-6 pt-14 pb-2"
        accessibilityRole="header"
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="min-h-[48px] min-w-[48px] items-center justify-center"
          >
            <Text className="text-on-surface-variant text-2xl">{'\u2190'}</Text>
          </Pressable>
          <Text className="text-on-surface-variant font-body text-xs uppercase tracking-widest">
            {title}
          </Text>
          <View className="w-12" />
        </View>
      </View>
    );
  }

  return (
    <View
      className="glass px-6 pt-14 pb-4"
      accessibilityRole="header"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text
            className="text-on-surface font-display text-2xl font-bold"
            accessibilityRole="header"
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text className="text-secondary/70 font-body text-xs mt-0.5 uppercase tracking-widest" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {onAction && (
          <Pressable
            onPress={onAction}
            accessibilityLabel={actionLabel}
            accessibilityRole="button"
            className="w-12 h-12 items-center justify-center rounded-full"
          >
            {({ pressed }) => (
              <View className={`w-6 h-6 items-center justify-center ${pressed ? 'opacity-70' : ''}`}>
                {/* Door frame */}
                <View className={`absolute left-0 top-0 w-3.5 h-6 border-l-2 border-t-2 border-b-2 rounded-l ${pressed ? 'border-on-surface' : 'border-on-surface-variant'}`} />
                {/* Arrow shaft */}
                <View className={`absolute right-0.5 top-1/2 w-3.5 h-0.5 -translate-y-px ${pressed ? 'bg-on-surface' : 'bg-on-surface-variant'}`} />
                {/* Arrow head top */}
                <View className={`absolute right-0 top-1.5 w-2 h-0.5 rotate-45 origin-right ${pressed ? 'bg-on-surface' : 'bg-on-surface-variant'}`} />
                {/* Arrow head bottom */}
                <View className={`absolute right-0 bottom-1.5 w-2 h-0.5 -rotate-45 origin-right ${pressed ? 'bg-on-surface' : 'bg-on-surface-variant'}`} />
              </View>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
