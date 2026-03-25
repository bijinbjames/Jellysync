import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useMovieList, useMovieDetails, useLibraryCategories } from './hooks.js';

vi.mock('./library.js', () => ({
  fetchMovieList: vi.fn(),
  fetchMovieDetails: vi.fn(),
  fetchLibraryCategories: vi.fn(),
}));

import { fetchMovieList, fetchMovieDetails, fetchLibraryCategories } from './library.js';

const mockFetchMovieList = vi.mocked(fetchMovieList);
const mockFetchMovieDetails = vi.mocked(fetchMovieDetails);
const mockFetchLibraryCategories = vi.mocked(fetchLibraryCategories);

const SERVER_URL = 'https://jellyfin.example.com';
const TOKEN = 'test-token';
const USER_ID = 'user-123';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useMovieList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch movies and return data', async () => {
    const mockResponse = {
      Items: [{ Id: 'movie-1', Name: 'Test', Type: 'Movie' }],
      TotalRecordCount: 1,
    };
    mockFetchMovieList.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useMovieList(SERVER_URL, TOKEN, USER_ID),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(mockFetchMovieList).toHaveBeenCalledWith(SERVER_URL, TOKEN, USER_ID, undefined);
  });

  it('should pass genreId option', async () => {
    mockFetchMovieList.mockResolvedValue({ Items: [], TotalRecordCount: 0 });

    const { result } = renderHook(
      () => useMovieList(SERVER_URL, TOKEN, USER_ID, { genreId: 'genre-1' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetchMovieList).toHaveBeenCalledWith(
      SERVER_URL, TOKEN, USER_ID,
      expect.objectContaining({ genreId: 'genre-1' }),
    );
  });

  it('should not fetch when credentials are missing', () => {
    const { result } = renderHook(
      () => useMovieList('', '', ''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetchMovieList).not.toHaveBeenCalled();
  });

  it('should return error on failure', async () => {
    const { LibraryError } = await import('./types.js');
    mockFetchMovieList.mockRejectedValue(
      new LibraryError('network', "Can't connect to server — check your connection"),
    );

    const { result } = renderHook(
      () => useMovieList(SERVER_URL, TOKEN, USER_ID),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.type).toBe('network');
  });
});

describe('useLibraryCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch categories', async () => {
    const mockResponse = {
      Items: [
        { Id: 'genre-1', Name: 'Action' },
        { Id: 'genre-2', Name: 'Comedy' },
      ],
    };
    mockFetchLibraryCategories.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useLibraryCategories(SERVER_URL, TOKEN, USER_ID),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
  });

  it('should not fetch when credentials are missing', () => {
    const { result } = renderHook(
      () => useLibraryCategories('', '', ''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetchLibraryCategories).not.toHaveBeenCalled();
  });
});

describe('useMovieDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch movie details when movieId provided', async () => {
    const mockDetails = {
      Id: 'movie-1',
      Name: 'Test Movie',
      ProductionYear: 2024,
    };
    mockFetchMovieDetails.mockResolvedValue(mockDetails as any);

    const { result } = renderHook(
      () => useMovieDetails(SERVER_URL, TOKEN, USER_ID, 'movie-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDetails);
  });

  it('should not fetch when movieId is undefined', () => {
    const { result } = renderHook(
      () => useMovieDetails(SERVER_URL, TOKEN, USER_ID, undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetchMovieDetails).not.toHaveBeenCalled();
  });
});
