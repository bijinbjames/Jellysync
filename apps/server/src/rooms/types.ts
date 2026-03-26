import type { Participant, RoomMoviePayload } from '@jellysync/shared';

export type { Participant };

export interface PlaybackState {
  positionMs: number;
  isPlaying: boolean;
  lastUpdated: number;
}

export interface Room {
  code: string;
  hostId: string;
  participants: Map<string, Participant>;
  movie: RoomMoviePayload | null;
  playbackState: PlaybackState | null;
  createdAt: number;
}
