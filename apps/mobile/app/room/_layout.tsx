import { Slot } from 'expo-router';
import { View } from 'react-native';

export default function RoomLayout() {
  return (
    <View className="flex-1 bg-surface">
      <Slot />
    </View>
  );
}
