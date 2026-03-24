import { View, Text } from 'react-native';

export function MovieBriefCard() {
  return (
    <View
      className="flex-row bg-surface-container-low rounded-2xl p-4"
      accessibilityLabel="No movie selected"
    >
      <View className="w-16 h-24 rounded-lg border border-dashed border-outline-variant/30 items-center justify-center">
        <Text className="text-outline-variant text-2xl">{'\uD83C\uDFAC'}</Text>
      </View>
      <View className="flex-1 ml-4 justify-center">
        <Text className="text-on-surface font-body text-sm font-medium">
          No movie selected
        </Text>
        <Text className="text-outline font-body text-xs mt-1">
          Browse Library (coming in Epic 3)
        </Text>
      </View>
    </View>
  );
}
