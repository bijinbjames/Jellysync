import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function CreateRoomScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <Text className="text-on-surface font-display text-2xl font-bold mb-2">
        Create Room
      </Text>
      <Text className="text-on-surface-variant font-body text-base text-center mb-8">
        Coming in Epic 2
      </Text>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="bg-surface-container-high rounded-md min-h-[48px] px-6 items-center justify-center"
      >
        <Text className="text-on-surface font-display text-sm font-bold">
          Go Back
        </Text>
      </Pressable>
    </View>
  );
}
