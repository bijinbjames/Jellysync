import { useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from 'zustand';
import { movieStore } from '../src/lib/movie';
import { roomStore } from '../src/lib/room';

export default function PlayerScreen() {
  const router = useRouter();
  const selectedMovie = useStore(movieStore, (s) => s.selectedMovie);
  const isHost = useStore(roomStore, (s) => s.isHost);
  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const prevMovieIdRef = useRef<string | null>(selectedMovie?.id ?? null);

  useEffect(() => {
    if (!selectedMovie) {
      router.replace('/');
    }
  }, [selectedMovie, router]);

  // Detect movie swap via global room:state handler — navigate back to lobby
  useEffect(() => {
    const currentId = selectedMovie?.id ?? null;
    if (prevMovieIdRef.current && currentId && currentId !== prevMovieIdRef.current) {
      prevMovieIdRef.current = currentId;
      if (roomCode) {
        router.replace(`/room/${roomCode}` as any);
      }
      return;
    }
    prevMovieIdRef.current = currentId;
  }, [selectedMovie, roomCode, router]);

  if (!selectedMovie) return null;

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#0e0e0e' }}>
      <Text className="text-on-surface font-heading text-2xl font-bold text-center">
        {selectedMovie.name}
      </Text>
      <Text className="text-on-surface-variant font-body text-sm mt-2">
        Playback coming in Epic 4
      </Text>
      {isHost && (
        <Pressable
          onPress={() => router.push('/library?from=player' as any)}
          accessibilityRole="button"
          accessibilityLabel="Change Movie"
          className="mt-6 min-h-[48px] px-6 items-center justify-center"
        >
          <Text className="text-primary font-body text-sm font-medium">
            Change Movie
          </Text>
        </Pressable>
      )}
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back to lobby"
        className="mt-4 min-h-[48px] px-6 items-center justify-center"
      >
        <Text className="text-on-surface-variant font-body text-sm font-medium">
          Back to Lobby
        </Text>
      </Pressable>
    </View>
  );
}
