export interface BufferState {
  isBuffering: boolean;
  bufferedMs: number;
}

export interface PlaybackStatus {
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  isBuffering: boolean;
  didJustFinish: boolean;
}

export interface PlayerInterface {
  play(): void;
  pause(): void;
  seek(positionMs: number): void;
  getPosition(): number;
  getBufferState(): BufferState;
}
