import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassHeader } from '../src/shared/components/glass-header';
import { CategoryChips } from '../src/features/library/components/category-chips';
import { PosterGrid } from '../src/features/library/components/poster-grid';
import { useLibrary } from '../src/features/library/hooks/use-library';

export default function LibraryScreen() {
  const router = useRouter();

  const { movies, categories, selectedCategory, setCategory, isLoading, error, serverUrl } =
    useLibrary();

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
          />
          <PosterGrid
            movies={movies}
            serverUrl={serverUrl}
            isLoading={isLoading}
          />
        </>
      )}
    </View>
  );
}
