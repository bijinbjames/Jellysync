import type { Participant, RoomMoviePayload, ParticipantPermissions } from '@jellysync/shared';

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
  bufferingParticipantId: string | null;
  permissions: ParticipantPermissions;
  createdAt: number;
}
