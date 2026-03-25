import { View, Text, FlatList, Dimensions } from 'react-native';
import type { JellyfinLibraryItem } from '@jellysync/shared';
import { PosterCard } from './poster-card';
import { PosterShimmer } from './poster-shimmer';

interface PosterGridProps {
  movies: JellyfinLibraryItem[];
  serverUrl: string;
  isLoading: boolean;
  onMoviePress?: (item: JellyfinLibraryItem) => void;
}

const NUM_COLUMNS = 3;
const HORIZONTAL_PADDING = 16;
const COLUMN_GAP = 12;
const screenWidth = Dimensions.get('window').width;
const itemWidth =
  (screenWidth - HORIZONTAL_PADDING * 2 - COLUMN_GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

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
        <View className="flex-row flex-wrap" style={{ gap: COLUMN_GAP }}>
          {SHIMMER_DATA.map((s) => (
            <View key={s.id} style={{ width: itemWidth }}>
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
      numColumns={NUM_COLUMNS}
      contentContainerStyle={{
        paddingHorizontal: HORIZONTAL_PADDING,
        rowGap: 20,
      }}
      columnWrapperStyle={{ gap: COLUMN_GAP }}
      accessibilityRole="list"
      accessibilityLabel="Movie library"
      renderItem={({ item }) => (
        <View style={{ width: itemWidth }}>
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
