import { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { JellyfinLibraryItem } from '@jellysync/shared';
import { createWsMessage, ROOM_MESSAGE_TYPE, type RoomStatePayload } from '@jellysync/shared';
import { useStore } from 'zustand';
import { GlassHeader } from '../src/shared/components/glass-header';
import { CategoryChips } from '../src/features/library/components/category-chips';
import { PosterGrid } from '../src/features/library/components/poster-grid';
import { useLibrary } from '../src/features/library/hooks/use-library';
import { useWs } from '../src/shared/providers/websocket-provider';
import { movieStore } from '../src/lib/movie';
import { authStore } from '../src/lib/auth';
import { roomStore } from '../src/lib/room';

export default function LibraryScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { send, subscribe } = useWs();

  const fromLobby = from === 'lobby';
  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const creatingRef = useRef(false);

  const { movies, categories, selectedCategory, setCategory, isLoading, error, serverUrl } =
    useLibrary();

  // Subscribe to room:state to navigate to lobby after room creation
  useEffect(() => {
    if (fromLobby) return;

    const unsub = subscribe(ROOM_MESSAGE_TYPE.STATE, (msg) => {
      const payload = msg.payload as RoomStatePayload;
      creatingRef.current = false;
      router.replace(`/room/${payload.roomCode}` as any);
    });
    return unsub;
  }, [fromLobby, subscribe, router]);

  const handleMovieSelect = (item: JellyfinLibraryItem) => {
    const movie = {
      id: item.Id,
      name: item.Name,
      year: item.ProductionYear,
      runtimeTicks: item.RunTimeTicks,
      imageTag: item.ImageTags?.Primary,
    };

    movieStore.getState().setMovie(movie);

    // If navigating from lobby, broadcast selection to room and go back
    if (fromLobby) {
      send(createWsMessage(ROOM_MESSAGE_TYPE.MOVIE_SELECT, { movie }));
      if (roomCode) {
        router.back();
      } else {
        router.replace('/');
      }
      return;
    }

    // Prevent double room creation on rapid taps
    if (creatingRef.current) return;
    creatingRef.current = true;

    // Create a new room
    const username = authStore.getState().username;
    send(createWsMessage(ROOM_MESSAGE_TYPE.CREATE, { displayName: username ?? 'User' }));
  };

  return (
    <View className="flex-1 bg-surface">
      <GlassHeader
        variant="navigation"
        title="Library"
        onBack={() => router.back()}
      />
      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-error font-body text-sm text-center">
            {error.message}
          </Text>
        </View>
      ) : (
        <>
          <CategoryChips
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setCategory}
            isLoading={isLoading}
          />
          <PosterGrid
            movies={movies}
            serverUrl={serverUrl}
            isLoading={isLoading}
            onMoviePress={handleMovieSelect}
          />
        </>
      )}
    </View>
  );
}
