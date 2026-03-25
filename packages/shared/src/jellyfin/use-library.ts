import { useState } from 'react';
import { useMovieList, useLibraryCategories } from './hooks.js';
import type { LibraryError } from './types.js';

export const RECENTLY_ADDED_CATEGORY = '__recently_added__';

export interface UseLibraryResult {
  movies: import('./types.js').JellyfinLibraryItem[];
  categories: import('./types.js').JellyfinGenre[];
  selectedCategory: string | undefined;
  setCategory: (category: string | undefined) => void;
  isLoading: boolean;
  error: LibraryError | null;
  serverUrl: string;
}

export function useLibrary(
  serverUrl: string,
  token: string,
  userId: string,
): UseLibraryResult {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  );

  const isRecentlyAdded = selectedCategory === RECENTLY_ADDED_CATEGORY;

  const {
    data: movieData,
    isLoading: isLoadingMovies,
    error: movieError,
  } = useMovieList(serverUrl, token, userId, {
    genreId: isRecentlyAdded ? undefined : selectedCategory,
    sortBy: isRecentlyAdded ? 'DateCreated' : undefined,
    sortOrder: isRecentlyAdded ? 'Descending' : undefined,
  });

  const {
    data: categoryData,
    isLoading: isLoadingCategories,
    error: categoryError,
  } = useLibraryCategories(serverUrl, token, userId);

  // Prioritize auth errors over transient errors (P6)
  const error = ((): LibraryError | null => {
    if (!movieError && !categoryError) return null;
    if (movieError && categoryError) {
      if (categoryError.type === 'unauthorized') return categoryError;
      if (movieError.type === 'unauthorized') return movieError;
      return movieError;
    }
    return movieError ?? categoryError;
  })();

  return {
    movies: movieData?.Items ?? [],
    categories: categoryData?.Items ?? [],
    selectedCategory,
    setCategory: setSelectedCategory,
    isLoading: isLoadingMovies || isLoadingCategories,
    error,
    serverUrl,
  };
}
