import { View, Text, FlatList } from 'react-native';
import type { JellyfinLibraryItem } from '@jellysync/shared';
import { PosterCard } from './poster-card';
import { PosterShimmer } from './poster-shimmer';

interface PosterGridProps {
  movies: JellyfinLibraryItem[];
  serverUrl: string;
  isLoading: boolean;
  onMoviePress?: (item: JellyfinLibraryItem) => void;
}

const SHIMMER_DATA = Array.from({ length: 9 }).map((_, i) => ({
  id: `shimmer-${i}`,
}));

export function PosterGrid({
  movies,
  serverUrl,
  isLoading,
  onMoviePress,
}: PosterGridProps) {
  if (isLoading) {
    return (
      <View
        className="px-4"
        accessibilityRole="list"
        accessibilityLabel="Loading movies"
      >
        <View className="flex-row flex-wrap">
          {SHIMMER_DATA.map((s) => (
            <View key={s.id} className="w-1/3 px-2 mb-6">
              <PosterShimmer />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (movies.length === 0) {
    return (
      <View className="items-center justify-center py-20 px-6">
        <Text className="text-4xl mb-4">🎬</Text>
        <Text className="text-on-surface-variant font-body text-sm text-center">
          No movies found — check your Jellyfin library
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={movies}
      keyExtractor={(item) => item.Id}
      numColumns={3}
      contentContainerStyle={{ paddingHorizontal: 8 }}
      columnWrapperStyle={{ gap: 8 }}
      ItemSeparatorComponent={() => <View className="h-6" />}
      accessibilityRole="list"
      accessibilityLabel="Movie library"
      renderItem={({ item }) => (
        <View style={{ width: '33.33%' }} className="px-1">
          <PosterCard
            item={item}
            serverUrl={serverUrl}
            onPress={onMoviePress}
          />
        </View>
      )}
    />
  );
}
