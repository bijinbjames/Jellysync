import type { JellyfinMediaSource, SubtitleTrack } from './types.js';

export interface StreamUrlOptions {
  mediaSourceId?: string;
  maxBitrate?: number;
  audioCodec?: string;
  videoCodec?: string;
  container?: string;
}

export function buildStreamUrl(
  serverUrl: string,
  token: string,
  itemId: string,
  options?: StreamUrlOptions,
): string {
  const baseUrl = serverUrl.replace(/\/+$/, '');

  // Use HLS transcoding if mediaSourceId is provided, otherwise direct stream
  if (options?.mediaSourceId) {
    const params = new URLSearchParams({
      api_key: token,
      MediaSourceId: options.mediaSourceId,
    });
    if (options.maxBitrate) params.set('MaxStreamingBitrate', String(options.maxBitrate));
    if (options.audioCodec) params.set('AudioCodec', options.audioCodec);
    if (options.videoCodec) params.set('VideoCodec', options.videoCodec);
    if (options.container) params.set('Container', options.container);
    return `${baseUrl}/Videos/${itemId}/master.m3u8?${params}`;
  }

  const params = new URLSearchParams({
    static: 'true',
    api_key: token,
  });
  if (options?.container) params.set('Container', options.container);
  return `${baseUrl}/Videos/${itemId}/stream?${params}`;
}

export function extractSubtitleTracks(mediaSources: JellyfinMediaSource[]): SubtitleTrack[] {
  const tracks: SubtitleTrack[] = [];
  for (const source of mediaSources) {
    if (!source.MediaStreams) continue;
    for (const stream of source.MediaStreams) {
      if (stream.Type === 'Subtitle') {
        tracks.push({
          index: stream.Index ?? 0,
          language: stream.Language ?? 'und',
          displayTitle: stream.DisplayTitle ?? stream.Language ?? 'Unknown',
          codec: stream.Codec,
          isDefault: stream.IsDefault ?? false,
          isForced: stream.IsForced ?? false,
        });
      }
    }
  }
  return tracks;
}

export function getSubtitleUrl(
  serverUrl: string,
  itemId: string,
  mediaSourceId: string,
  streamIndex: number,
  format: string = 'vtt',
): string {
  const baseUrl = serverUrl.replace(/\/+$/, '');
  return `${baseUrl}/Videos/${itemId}/${mediaSourceId}/Subtitles/${streamIndex}/Stream.${format}`;
}
