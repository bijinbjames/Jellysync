import { describe, it, expect } from 'vitest';
import { buildStreamUrl } from './streaming.js';

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
