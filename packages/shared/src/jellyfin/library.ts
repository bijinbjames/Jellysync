import { makeRequest } from './client.js';
import { LibraryError } from './types.js';
import type {
  JellyfinLibraryResponse,
  JellyfinMovieDetails,
  JellyfinGenresResponse,
} from './types.js';

export interface FetchMovieListOptions {
  genreId?: string;
  startIndex?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'Ascending' | 'Descending';
}

export interface ImageUrlOptions {
  fillWidth?: number;
  quality?: number;
}

function handleLibraryError(error: unknown): never {
  if (error instanceof LibraryError) throw error;
  if (error instanceof Response) {
    if (error.status === 401) {
      throw new LibraryError('unauthorized', 'Session expired — please sign in again', error);
    }
    if (error.status === 404) {
      throw new LibraryError('not-found', 'Content not found', error);
    }
    throw new LibraryError('unknown', 'Something went wrong — try again', error);
  }
  if (error instanceof TypeError) {
    throw new LibraryError('network', "Can't connect to server — check your connection", error);
  }
  if (error instanceof Error && error.name === 'AbortError') {
    throw new LibraryError('network', 'Request timed out — try again', error);
  }
  throw new LibraryError('unknown', 'Something went wrong — try again', error);
}

export async function fetchMovieList(
  serverUrl: string,
  token: string,
  userId: string,
  options?: FetchMovieListOptions,
): Promise<JellyfinLibraryResponse> {
  const params = new URLSearchParams({
    IncludeItemTypes: 'Movie',
    Recursive: 'true',
    Fields: 'Overview,Genres,MediaSources',
    SortBy: options?.sortBy ?? 'SortName',
    SortOrder: options?.sortOrder ?? 'Ascending',
    StartIndex: String(options?.startIndex ?? 0),
    Limit: String(options?.limit ?? 50),
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary',
  });
  if (options?.genreId) params.set('GenreIds', options.genreId);

  try {
    return await makeRequest<JellyfinLibraryResponse>(
      serverUrl,
      `/Users/${userId}/Items?${params}`,
      token,
    );
  } catch (error) {
    handleLibraryError(error);
  }
}

export async function fetchMovieDetails(
  serverUrl: string,
  token: string,
  userId: string,
  movieId: string,
): Promise<JellyfinMovieDetails> {
  try {
    return await makeRequest<JellyfinMovieDetails>(
      serverUrl,
      `/Users/${userId}/Items/${movieId}`,
      token,
    );
  } catch (error) {
    handleLibraryError(error);
  }
}

export async function fetchLibraryCategories(
  serverUrl: string,
  token: string,
): Promise<JellyfinGenresResponse> {
  const params = new URLSearchParams({
    IncludeItemTypes: 'Movie',
  });

  try {
    return await makeRequest<JellyfinGenresResponse>(
      serverUrl,
      `/Genres?${params}`,
      token,
    );
  } catch (error) {
    handleLibraryError(error);
  }
}

export function getImageUrl(
  serverUrl: string,
  itemId: string,
  imageTag?: string,
  options?: ImageUrlOptions,
): string {
  const params = new URLSearchParams({
    quality: String(options?.quality ?? 90),
    fillWidth: String(options?.fillWidth ?? 300),
  });
  if (imageTag) params.set('tag', imageTag);
  return `${serverUrl.replace(/\/+$/, '')}/Items/${itemId}/Images/Primary?${params}`;
}
