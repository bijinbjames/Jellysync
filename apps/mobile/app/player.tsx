import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from 'zustand';
import { movieStore } from '../src/lib/movie';

export default function PlayerScreen() {
  const router = useRouter();
  const selectedMovie = useStore(movieStore, (s) => s.selectedMovie);

  useEffect(() => {
    if (!selectedMovie) {
      router.replace('/');
    }
  }, [selectedMovie, router]);

  if (!selectedMovie) return null;

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#0e0e0e' }}>
      <Text className="text-on-surface font-heading text-2xl font-bold text-center">
        {selectedMovie.name}
      </Text>
      <Text className="text-on-surface-variant font-body text-sm mt-2">
        Playback coming in Epic 4
      </Text>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to lobby"
        className="mt-8 min-h-[48px] px-6 items-center justify-center"
      >
        <Text className="text-on-surface-variant font-body text-sm font-medium">
          Back to Lobby
        </Text>
      </Pressable>
    </View>
  );
}
