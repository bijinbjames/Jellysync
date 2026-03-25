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
