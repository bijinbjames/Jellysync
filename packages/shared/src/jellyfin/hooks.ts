import { useQuery } from '@tanstack/react-query';
import { fetchMovieList, fetchMovieDetails, fetchLibraryCategories } from './library.js';
import type { FetchMovieListOptions } from './library.js';
import type {
  JellyfinLibraryResponse,
  JellyfinMovieDetails,
  JellyfinGenresResponse,
} from './types.js';
import { LibraryError } from './types.js';

export function useMovieList(
  serverUrl: string,
  token: string,
  userId: string,
  options?: FetchMovieListOptions,
) {
  return useQuery<JellyfinLibraryResponse, LibraryError>({
    queryKey: [
      'jellyfin',
      serverUrl,
      userId,
      'movies',
      {
        genreId: options?.genreId,
        startIndex: options?.startIndex,
        limit: options?.limit,
        sortBy: options?.sortBy,
        sortOrder: options?.sortOrder,
      },
    ],
    queryFn: () => fetchMovieList(serverUrl, token, userId, options),
    enabled: !!serverUrl && !!token && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    throwOnError: false,
  });
}

export function useMovieDetails(
  serverUrl: string,
  token: string,
  userId: string,
  movieId?: string,
) {
  return useQuery<JellyfinMovieDetails, LibraryError>({
    queryKey: ['jellyfin', serverUrl, userId, 'movie', movieId],
    queryFn: () => fetchMovieDetails(serverUrl, token, userId, movieId!),
    enabled: !!serverUrl && !!token && !!userId && !!movieId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    throwOnError: false,
  });
}

export function useLibraryCategories(
  serverUrl: string,
  token: string,
  userId: string,
) {
  return useQuery<JellyfinGenresResponse, LibraryError>({
    queryKey: ['jellyfin', serverUrl, userId, 'genres'],
    queryFn: () => fetchLibraryCategories(serverUrl, token, userId),
    enabled: !!serverUrl && !!token && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes — genres rarely change
    gcTime: 30 * 60 * 1000,
    throwOnError: false,
  });
}
