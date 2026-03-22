import { View, Text } from 'react-native';

type GlassHeaderVariant = 'home' | 'navigation' | 'branded';

interface GlassHeaderProps {
  variant: GlassHeaderVariant;
  title: string;
  subtitle?: string;
}

export function GlassHeader(props: GlassHeaderProps) {
  const { title, subtitle } = props;

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
            <Text className="text-secondary/70 font-body text-sm mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
