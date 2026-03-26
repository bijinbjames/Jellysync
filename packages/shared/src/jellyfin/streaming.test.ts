import { describe, it, expect } from 'vitest';
import { buildStreamUrl, extractSubtitleTracks, getSubtitleUrl } from './streaming.js';
import type { JellyfinMediaSource } from './types.js';

const SERVER_URL = 'https://jellyfin.example.com';
const TOKEN = 'test-token-123';
const ITEM_ID = 'movie-1';

describe('buildStreamUrl', () => {
  it('should build direct stream URL by default', () => {
    const url = buildStreamUrl(SERVER_URL, TOKEN, ITEM_ID);

    expect(url).toContain(`/Videos/${ITEM_ID}/stream?`);
    expect(url).toContain('static=true');
    expect(url).toContain(`api_key=${TOKEN}`);
  });

  it('should build HLS stream URL when mediaSourceId is provided', () => {
    const url = buildStreamUrl(SERVER_URL, TOKEN, ITEM_ID, {
      mediaSourceId: 'source-1',
    });

    expect(url).toContain(`/Videos/${ITEM_ID}/master.m3u8?`);
    expect(url).toContain(`api_key=${TOKEN}`);
    expect(url).toContain('MediaSourceId=source-1');
  });

  it('should include transcoding params for HLS', () => {
    const url = buildStreamUrl(SERVER_URL, TOKEN, ITEM_ID, {
      mediaSourceId: 'source-1',
      maxBitrate: 8000000,
      audioCodec: 'aac',
      videoCodec: 'h264',
      container: 'ts',
    });

    expect(url).toContain('MaxStreamingBitrate=8000000');
    expect(url).toContain('AudioCodec=aac');
    expect(url).toContain('VideoCodec=h264');
    expect(url).toContain('Container=ts');
  });

  it('should include container for direct stream when specified', () => {
    const url = buildStreamUrl(SERVER_URL, TOKEN, ITEM_ID, {
      container: 'mp4',
    });

    expect(url).toContain(`/Videos/${ITEM_ID}/stream?`);
    expect(url).toContain('Container=mp4');
  });

  it('should include auth token in URL', () => {
    const url = buildStreamUrl(SERVER_URL, TOKEN, ITEM_ID);

    expect(url).toContain(`api_key=${TOKEN}`);
  });

  it('should strip trailing slashes from server URL', () => {
    const url = buildStreamUrl('https://jellyfin.example.com///', TOKEN, ITEM_ID);

    expect(url).toMatch(/^https:\/\/jellyfin\.example\.com\/Videos\//);
  });
});

describe('extractSubtitleTracks', () => {
  it('should extract subtitle tracks from MediaStreams', () => {
    const mediaSources: JellyfinMediaSource[] = [
      {
        Id: 'source-1',
        Container: 'mkv',
        MediaStreams: [
          { Type: 'Video', Codec: 'h264', Index: 0 },
          { Type: 'Audio', Codec: 'aac', Index: 1 },
          { Type: 'Subtitle', Codec: 'srt', Index: 2, Language: 'eng', DisplayTitle: 'English', IsDefault: true, IsForced: false },
          { Type: 'Subtitle', Codec: 'ass', Index: 3, Language: 'spa', DisplayTitle: 'Spanish', IsDefault: false, IsForced: false },
        ],
      },
    ];

    const tracks = extractSubtitleTracks(mediaSources);

    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toEqual({
      index: 2,
      language: 'eng',
      displayTitle: 'English',
      codec: 'srt',
      isDefault: true,
      isForced: false,
    });
    expect(tracks[1]).toEqual({
      index: 3,
      language: 'spa',
      displayTitle: 'Spanish',
      codec: 'ass',
      isDefault: false,
      isForced: false,
    });
  });

  it('should return empty array when no subtitle streams exist', () => {
    const mediaSources: JellyfinMediaSource[] = [
      {
        Id: 'source-1',
        Container: 'mp4',
        MediaStreams: [
          { Type: 'Video', Codec: 'h264', Index: 0 },
          { Type: 'Audio', Codec: 'aac', Index: 1 },
        ],
      },
    ];

    expect(extractSubtitleTracks(mediaSources)).toEqual([]);
  });

  it('should return empty array when MediaStreams is undefined', () => {
    const mediaSources: JellyfinMediaSource[] = [
      { Id: 'source-1', Container: 'mp4' },
    ];

    expect(extractSubtitleTracks(mediaSources)).toEqual([]);
  });

  it('should return empty array for empty mediaSources', () => {
    expect(extractSubtitleTracks([])).toEqual([]);
  });

  it('should handle missing optional fields with defaults', () => {
    const mediaSources: JellyfinMediaSource[] = [
      {
        Id: 'source-1',
        Container: 'mkv',
        MediaStreams: [
          { Type: 'Subtitle', Codec: 'srt' },
        ],
      },
    ];

    const tracks = extractSubtitleTracks(mediaSources);

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toEqual({
      index: 0,
      language: 'und',
      displayTitle: 'Unknown',
      codec: 'srt',
      isDefault: false,
      isForced: false,
    });
  });

  it('should extract tracks from multiple media sources', () => {
    const mediaSources: JellyfinMediaSource[] = [
      {
        Id: 'source-1',
        Container: 'mkv',
        MediaStreams: [
          { Type: 'Subtitle', Codec: 'srt', Index: 2, Language: 'eng', DisplayTitle: 'English', IsDefault: true, IsForced: false },
        ],
      },
      {
        Id: 'source-2',
        Container: 'mkv',
        MediaStreams: [
          { Type: 'Subtitle', Codec: 'ass', Index: 3, Language: 'fra', DisplayTitle: 'French', IsDefault: false, IsForced: false },
        ],
      },
    ];

    const tracks = extractSubtitleTracks(mediaSources);

    expect(tracks).toHaveLength(2);
    expect(tracks[0].language).toBe('eng');
    expect(tracks[1].language).toBe('fra');
  });
});

describe('getSubtitleUrl', () => {
  it('should build correct subtitle URL with default format', () => {
    const url = getSubtitleUrl(SERVER_URL, ITEM_ID, 'source-1', 2);

    expect(url).toBe(`${SERVER_URL}/Videos/${ITEM_ID}/source-1/Subtitles/2/Stream.vtt`);
  });

  it('should build subtitle URL with custom format', () => {
    const url = getSubtitleUrl(SERVER_URL, ITEM_ID, 'source-1', 3, 'srt');

    expect(url).toBe(`${SERVER_URL}/Videos/${ITEM_ID}/source-1/Subtitles/3/Stream.srt`);
  });

  it('should strip trailing slashes from server URL', () => {
    const url = getSubtitleUrl('https://jellyfin.example.com///', ITEM_ID, 'source-1', 2);

    expect(url).toMatch(/^https:\/\/jellyfin\.example\.com\/Videos\//);
    expect(url).not.toContain('///');
  });
});
