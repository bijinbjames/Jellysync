import type { Participant, RoomMoviePayload } from '@jellysync/shared';

export type { Participant };

export interface Room {
  code: string;
  hostId: string;
  participants: Map<string, Participant>;
  movie: RoomMoviePayload | null;
  createdAt: number;
}
