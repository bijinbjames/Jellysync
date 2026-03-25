import { useQuery } from '@tanstack/react-query';
import { fetchMovieList, fetchMovieDetails, fetchLibraryCategories } from './library.js';
import type { FetchMovieListOptions } from './library.js';
import type {
  JellyfinLibraryResponse,
  JellyfinMovieDetails,
  JellyfinGenresResponse,
  LibraryErrorType,
} from './types.js';
import { LibraryError } from './types.js';

const LIBRARY_ERROR_MESSAGES: Record<LibraryErrorType, string> = {
  network: "Can't connect to server — check your connection",
  unauthorized: 'Session expired — please sign in again',
  'not-found': 'Content not found',
  unknown: 'Something went wrong — try again',
};

function mapError(error: unknown): LibraryError {
  if (error instanceof LibraryError) return error;
  return new LibraryError('unknown', LIBRARY_ERROR_MESSAGES.unknown, error);
}

export function useMovieList(
  serverUrl: string,
  token: string,
  userId: string,
  options?: FetchMovieListOptions,
) {
  return useQuery<JellyfinLibraryResponse, LibraryError>({
    queryKey: [
      'jellyfin',
      'movies',
      { genreId: options?.genreId, startIndex: options?.startIndex, limit: options?.limit },
    ],
    queryFn: () => fetchMovieList(serverUrl, token, userId, options),
    enabled: !!serverUrl && !!token && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    throwOnError: false,
    select: (data) => data,
    meta: { errorMap: mapError },
  });
}

export function useMovieDetails(
  serverUrl: string,
  token: string,
  userId: string,
  movieId?: string,
) {
  return useQuery<JellyfinMovieDetails, LibraryError>({
    queryKey: ['jellyfin', 'movie', movieId],
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
    queryKey: ['jellyfin', 'genres'],
    queryFn: () => fetchLibraryCategories(serverUrl, token),
    enabled: !!serverUrl && !!token && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes — genres rarely change
    gcTime: 30 * 60 * 1000,
    throwOnError: false,
  });
}
