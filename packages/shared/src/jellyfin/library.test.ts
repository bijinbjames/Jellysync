import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchMovieList, fetchMovieDetails, fetchLibraryCategories, getImageUrl } from './library.js';
import { LibraryError } from './types.js';

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

function mockFetch(data: unknown, status = 200) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(data), { status }),
  );
}

describe('fetchMovieList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch movies with default params', async () => {
    mockFetch(mockLibraryResponse);

    const result = await fetchMovieList(SERVER_URL, TOKEN, USER_ID);

    expect(result).toEqual(mockLibraryResponse);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/Users/${USER_ID}/Items?`),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Emby-Authorization': expect.stringContaining('MediaBrowser'),
        }),
      }),
    );
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('IncludeItemTypes=Movie');
    expect(url).toContain('Recursive=true');
    expect(url).toContain('SortBy=SortName');
    expect(url).toContain('SortOrder=Ascending');
    expect(url).toContain('StartIndex=0');
    expect(url).toContain('Limit=50');
  });

  it('should apply custom options', async () => {
    mockFetch(mockLibraryResponse);

    await fetchMovieList(SERVER_URL, TOKEN, USER_ID, {
      genreId: 'genre-1',
      startIndex: 10,
      limit: 25,
      sortBy: 'DateCreated',
      sortOrder: 'Descending',
    });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('GenreIds=genre-1');
    expect(url).toContain('StartIndex=10');
    expect(url).toContain('Limit=25');
    expect(url).toContain('SortBy=DateCreated');
    expect(url).toContain('SortOrder=Descending');
  });

  it('should include auth token in header', async () => {
    mockFetch(mockLibraryResponse);

    await fetchMovieList(SERVER_URL, TOKEN, USER_ID);

    const callHeaders = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(callHeaders['X-Emby-Authorization']).toContain(`Token="${TOKEN}"`);
  });

  it('should throw LibraryError unauthorized on 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 401 }),
    );

    await expect(
      fetchMovieList(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toThrow(LibraryError);

    await expect(
      fetchMovieList(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toMatchObject({ type: 'unauthorized' });
  });

  it('should throw LibraryError not-found on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 404 }),
    );

    await expect(
      fetchMovieList(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toMatchObject({ type: 'not-found' });
  });

  it('should throw LibraryError network on TypeError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

    await expect(
      fetchMovieList(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toMatchObject({ type: 'network' });
  });

  it('should throw LibraryError network on AbortError', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(abortError);

    await expect(
      fetchMovieList(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toMatchObject({ type: 'network' });
  });

  it('should throw LibraryError unknown on 500', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 500 }),
    );

    await expect(
      fetchMovieList(SERVER_URL, TOKEN, USER_ID),
    ).rejects.toMatchObject({ type: 'unknown' });
  });
});

describe('fetchMovieDetails', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch movie details', async () => {
    mockFetch(mockMovieDetails);

    const result = await fetchMovieDetails(SERVER_URL, TOKEN, USER_ID, 'movie-1');

    expect(result).toEqual(mockMovieDetails);
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain(`/Users/${USER_ID}/Items/movie-1`);
  });

  it('should throw LibraryError on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 404 }),
    );

    await expect(
      fetchMovieDetails(SERVER_URL, TOKEN, USER_ID, 'nonexistent'),
    ).rejects.toMatchObject({ type: 'not-found' });
  });
});

describe('fetchLibraryCategories', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch genres', async () => {
    mockFetch(mockGenresResponse);

    const result = await fetchLibraryCategories(SERVER_URL, TOKEN);

    expect(result).toEqual(mockGenresResponse);
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/Genres?');
    expect(url).toContain('IncludeItemTypes=Movie');
  });

  it('should throw LibraryError on 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 401 }),
    );

    await expect(
      fetchLibraryCategories(SERVER_URL, TOKEN),
    ).rejects.toMatchObject({ type: 'unauthorized' });
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
