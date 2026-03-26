import type { Room } from './types.js';
import type { Participant } from '@jellysync/shared';
import { ROOM_CONFIG } from '@jellysync/shared';
import { generateRoomCode } from './room-code.js';

export class RoomManager {
  private rooms = new Map<string, Room>();
  private participantToRoom = new Map<string, string>();

  isInRoom(participantId: string): boolean {
    return this.participantToRoom.has(participantId);
  }

  isRoomFull(code: string): boolean {
    const room = this.rooms.get(code);
    if (!room) return false;
    return room.participants.size >= ROOM_CONFIG.MAX_PARTICIPANTS;
  }

  createRoom(hostId: string, displayName: string): Room {
    const existingCodes = new Set(this.rooms.keys());
    const code = generateRoomCode(existingCodes);

    const host: Participant = {
      id: hostId,
      displayName,
      joinedAt: Date.now(),
      isHost: true,
    };

    const room: Room = {
      code,
      hostId,
      participants: new Map([[hostId, host]]),
      movie: null,
      playbackState: null,
      bufferingParticipantId: null,
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.participantToRoom.set(hostId, code);

    return room;
  }

  joinRoom(code: string, participantId: string, displayName: string): Room | 'full' | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    if (room.participants.size >= ROOM_CONFIG.MAX_PARTICIPANTS) return 'full';

    const participant: Participant = {
      id: participantId,
      displayName,
      joinedAt: Date.now(),
      isHost: false,
    };

    room.participants.set(participantId, participant);
    this.participantToRoom.set(participantId, code);

    return room;
  }

  leaveRoom(code: string, participantId: string): Room | null {
    const room = this.rooms.get(code);
    if (!room) return null;

    room.participants.delete(participantId);
    this.participantToRoom.delete(participantId);

    // Room is empty — destroy it
    if (room.participants.size === 0) {
      this.rooms.delete(code);
      return null;
    }

    // Host transfer: assign to first participant by join order
    if (room.hostId === participantId) {
      const participants = Array.from(room.participants.values());
      participants.sort((a, b) => a.joinedAt - b.joinedAt);
      const newHost = participants[0];
      room.hostId = newHost.id;

      // Update isHost flags
      for (const p of room.participants.values()) {
        p.isHost = p.id === newHost.id;
      }
    }

    return room;
  }

  getRoom(code: string): Room | null {
    return this.rooms.get(code) ?? null;
  }

  getRoomByParticipant(participantId: string): Room | null {
    const code = this.participantToRoom.get(participantId);
    if (!code) return null;
    return this.rooms.get(code) ?? null;
  }

  removeParticipant(participantId: string): Room | null {
    const code = this.participantToRoom.get(participantId);
    if (!code) return null;
    return this.leaveRoom(code, participantId);
  }

  getRoomCodes(): Set<string> {
    return new Set(this.rooms.keys());
  }
}
