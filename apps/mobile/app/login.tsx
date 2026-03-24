import { View, Text, Linking, Pressable } from 'react-native';
import { LoginForm } from '../src/features/auth';

export default function LoginScreen() {
  return (
    <View className="flex-1 bg-surface items-center justify-center px-6">
      <View className="items-center mb-8">
        <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4">
          <Text className="text-surface text-2xl">▶</Text>
        </View>
        <Text className="text-primary font-display text-4xl font-extrabold">
          JellySync
        </Text>
        <Text className="text-on-surface-variant font-body text-sm uppercase tracking-widest mt-1">
          Watch Together.
        </Text>
      </View>
      <LoginForm />
      <Pressable
        onPress={() => Linking.openURL('https://jellyfin.org')}
        className="mt-8"
        accessibilityRole="link"
      >
        <Text className="text-on-surface-variant font-body text-sm">
          Learn more about Jellyfin ↗
        </Text>
      </Pressable>
    </View>
  );
}
