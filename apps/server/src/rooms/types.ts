import type { Participant } from '@jellysync/shared';

export type { Participant };

export interface Room {
  code: string;
  hostId: string;
  participants: Map<string, Participant>;
  createdAt: number;
}
