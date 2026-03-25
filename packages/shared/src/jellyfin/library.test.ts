import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchMovieList, fetchMovieDetails, fetchLibraryCategories, getImageUrl, formatRuntime } from './library.js';
import { LibraryError } from './types.js';

vi.mock('./client.js', () => ({
  makeRequest: vi.fn(),
}));

import { makeRequest } from './client.js';

const mockMakeRequest = vi.mocked(makeRequest);

const SERVER_URL = 'https://jellyfin.example.com';
const TOKEN = 'test-token-123';
const USER_ID = 'user-guid-123';

const mockLibraryResponse = {
  Items: [
    {
      Id: 'movie-1',
      Name: 'Test Movie',
      ProductionYear: 2024,
      RunTimeTicks: 72000000000,
      Overview: 'A test movie',
      ImageTags: { Primary: 'abc123' },
      Type: 'Movie',
    },
  ],
  TotalRecordCount: 1,
};

const mockMovieDetails = {
  Id: 'movie-1',
  Name: 'Test Movie',
  ProductionYear: 2024,
  RunTimeTicks: 72000000000,
  Overview: 'A test movie',
  Genres: ['Action', 'Comedy'],
  ImageTags: { Primary: 'abc123' },
  MediaSources: [{ Id: 'source-1', Container: 'mkv' }],
  CommunityRating: 8.5,
};

const mockGenresResponse = {
  Items: [
    { Id: 'genre-1', Name: 'Action' },
    { Id: 'genre-2', Name: 'Comedy' },
  ],
};

describe('fetchMovieList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch movies with default params', async () => {
    mockMakeRequest.mockResolvedValue(mockLibraryResponse);

    const result = await fetchMovieList(SERVER_URL, TOKEN, USER_ID);

    expect(result).toEqual(mockLibraryResponse);
    expect(mockMakeRequest).toHaveBeenCalledWith(
      SERVER_URL,
      expect.stringContaining(`/Users/${USER_ID}/Items?`),
      TOKEN,
    );
    const path = mockMakeRequest.mock.calls[0][1] as string;
    expect(path).toContain('IncludeItemTypes=Movie');
    expect(path).toContain('Recursive=true');
    expect(path).toContain('SortBy=SortName');
    expect(path).toContain('SortOrder=Ascending');
    expect(path).toContain('StartIndex=0');
    expect(path).toContain('Limit=50');
  });

  it('should apply custom options', async () => {
    mockMakeRequest.mockResolvedValue(mockLibraryResponse);

    await fetchMovieList(SERVER_URL, TOKEN, USER_ID, {
      genreId: 'genre-1',
      startIndex: 10,
      limit: 25,
      sortBy: 'DateCreated',
      sortOrder: 'Descending',
    });

    const path = mockMakeRequest.mock.calls[0][1] as string;
    expect(path).toContain('GenreIds=genre-1');
    expect(path).toContain('StartIndex=10');
    expect(path).toContain('Limit=25');
    expect(path).toContain('SortBy=DateCreated');
    expect(path).toContain('SortOrder=Descending');
  });

  it('should pass token to makeRequest', async () => {
    mockMakeRequest.mockResolvedValue(mockLibraryResponse);

    await fetchMovieList(SERVER_URL, TOKEN, USER_ID);

    expect(mockMakeRequest).toHaveBeenCalledWith(
      SERVER_URL,
      expect.any(String),
      TOKEN,
    );
  });

  it('should throw LibraryError unauthorized with message on 401', async () => {
    mockMakeRequest.mockRejectedValue(new Response('', { status: 401 }));

    await expect(
      fetchMovieList(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toMatchObject({
      type: 'unauthorized',
      message: 'Session expired — please sign in again',
    });
  });

  it('should throw LibraryError not-found with message on 404', async () => {
    mockMakeRequest.mockRejectedValue(new Response('', { status: 404 }));

    await expect(
      fetchMovieList(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toMatchObject({
      type: 'not-found',
      message: 'Content not found',
    });
  });

  it('should throw LibraryError network with message on TypeError', async () => {
    mockMakeRequest.mockRejectedValue(new TypeError('fetch failed'));

    await expect(
      fetchMovieList(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toMatchObject({
      type: 'network',
      message: "Can't connect to server — check your connection",
    });
  });

  it('should throw LibraryError network with message on AbortError', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockMakeRequest.mockRejectedValue(abortError);

    await expect(
      fetchMovieList(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toMatchObject({
      type: 'network',
      message: 'Request timed out — try again',
    });
  });

  it('should throw LibraryError unknown with message on 500', async () => {
    mockMakeRequest.mockRejectedValue(new Response('', { status: 500 }));

    await expect(
      fetchMovieList(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toMatchObject({
      type: 'unknown',
      message: 'Something went wrong — try again',
    });
  });

  it('should throw LibraryError on empty serverUrl', async () => {
    await expect(
      fetchMovieList('', TOKEN, USER_ID),
    ).rejects.toThrow(LibraryError);
  });

  it('should throw LibraryError on empty userId', async () => {
    await expect(
      fetchMovieList(SERVER_URL, TOKEN, ''),
    ).rejects.toThrow(LibraryError);
  });
});

describe('fetchMovieDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch movie details', async () => {
    mockMakeRequest.mockResolvedValue(mockMovieDetails);

    const result = await fetchMovieDetails(SERVER_URL, TOKEN, USER_ID, 'movie-1');

    expect(result).toEqual(mockMovieDetails);
    const path = mockMakeRequest.mock.calls[0][1] as string;
    expect(path).toContain(`/Users/${USER_ID}/Items/movie-1`);
  });

  it('should pass token to makeRequest', async () => {
    mockMakeRequest.mockResolvedValue(mockMovieDetails);

    await fetchMovieDetails(SERVER_URL, TOKEN, USER_ID, 'movie-1');

    expect(mockMakeRequest).toHaveBeenCalledWith(
      SERVER_URL,
      expect.any(String),
      TOKEN,
    );
  });

  it('should throw LibraryError not-found with message on 404', async () => {
    mockMakeRequest.mockRejectedValue(new Response('', { status: 404 }));

    await expect(
      fetchMovieDetails(SERVER_URL, TOKEN, USER_ID, 'nonexistent'),
    ).rejects.toMatchObject({
      type: 'not-found',
      message: 'Content not found',
    });
  });

  it('should throw LibraryError on empty movieId', async () => {
    await expect(
      fetchMovieDetails(SERVER_URL, TOKEN, USER_ID, ''),
    ).rejects.toThrow(LibraryError);
  });
});

describe('fetchLibraryCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch genres', async () => {
    mockMakeRequest.mockResolvedValue(mockGenresResponse);

    const result = await fetchLibraryCategories(SERVER_URL, TOKEN, USER_ID);

    expect(result).toEqual(mockGenresResponse);
    const path = mockMakeRequest.mock.calls[0][1] as string;
    expect(path).toContain('/Genres?');
    expect(path).toContain('IncludeItemTypes=Movie');
    expect(path).toContain(`UserId=${USER_ID}`);
  });

  it('should pass token to makeRequest', async () => {
    mockMakeRequest.mockResolvedValue(mockGenresResponse);

    await fetchLibraryCategories(SERVER_URL, TOKEN, USER_ID);

    expect(mockMakeRequest).toHaveBeenCalledWith(
      SERVER_URL,
      expect.any(String),
      TOKEN,
    );
  });

  it('should work without userId', async () => {
    mockMakeRequest.mockResolvedValue(mockGenresResponse);

    const result = await fetchLibraryCategories(SERVER_URL, TOKEN);

    expect(result).toEqual(mockGenresResponse);
    const path = mockMakeRequest.mock.calls[0][1] as string;
    expect(path).not.toContain('UserId=');
  });

  it('should throw LibraryError unauthorized with message on 401', async () => {
    mockMakeRequest.mockRejectedValue(new Response('', { status: 401 }));

    await expect(
      fetchLibraryCategories(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toMatchObject({
      type: 'unauthorized',
      message: 'Session expired — please sign in again',
    });
  });
});

describe('getImageUrl', () => {
  it('should build image URL with defaults', () => {
    const url = getImageUrl(SERVER_URL, 'movie-1', 'abc123');

    expect(url).toContain('/Items/movie-1/Images/Primary');
    expect(url).toContain('tag=abc123');
    expect(url).toContain('quality=90');
    expect(url).toContain('fillWidth=300');
  });

  it('should build image URL with custom options', () => {
    const url = getImageUrl(SERVER_URL, 'movie-1', 'abc123', {
      fillWidth: 600,
      quality: 80,
    });

    expect(url).toContain('fillWidth=600');
    expect(url).toContain('quality=80');
  });

  it('should work without imageTag', () => {
    const url = getImageUrl(SERVER_URL, 'movie-1');

    expect(url).toContain('/Items/movie-1/Images/Primary');
    expect(url).not.toContain('tag=');
  });

  it('should strip trailing slashes from server URL', () => {
    const url = getImageUrl('https://jellyfin.example.com///', 'movie-1', 'abc');

    expect(url).toMatch(/^https:\/\/jellyfin\.example\.com\/Items\//);
  });
});

describe('formatRuntime', () => {
  it('should format zero ticks as 0m', () => {
    expect(formatRuntime(0)).toBe('0m');
  });

  it('should format ticks less than 1 hour as minutes only', () => {
    // 45 minutes = 45 * 60 * 10,000,000
    expect(formatRuntime(27_000_000_000)).toBe('45m');
  });

  it('should format ticks for exactly 1 hour', () => {
    // 60 minutes = 60 * 60 * 10,000,000
    expect(formatRuntime(36_000_000_000)).toBe('1h 0m');
  });

  it('should format multi-hour runtime', () => {
    // 2h 15m = 135 * 60 * 10,000,000
    expect(formatRuntime(81_000_000_000)).toBe('2h 15m');
  });

  it('should round fractional minutes', () => {
    // 90.5 minutes worth of ticks
    expect(formatRuntime(54_300_000_000)).toBe('1h 31m');
  });
});
