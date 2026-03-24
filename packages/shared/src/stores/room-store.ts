import { createStore } from 'zustand/vanilla';
import type { Participant } from '../protocol/messages.js';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface RoomState {
  roomCode: string | null;
  participants: Participant[];
  hostId: string | null;
  isHost: boolean;
  connectionState: ConnectionState;
  participantId: string | null;
}

export interface RoomActions {
  setRoom: (code: string, hostId: string, participants: Participant[]) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (id: string) => void;
  updateHost: (newHostId: string) => void;
  clearRoom: () => void;
  setConnectionState: (state: ConnectionState) => void;
  setParticipantId: (id: string) => void;
}

export type RoomStore = RoomState & RoomActions;

const initialState: RoomState = {
  roomCode: null,
  participants: [],
  hostId: null,
  isHost: false,
  connectionState: 'disconnected',
  participantId: null,
};

export function createRoomStore() {
  return createStore<RoomStore>()((set, get) => ({
    ...initialState,

    setRoom: (code, hostId, participants) => {
      const { participantId } = get();
      set({
        roomCode: code,
        hostId,
        participants,
        isHost: hostId === participantId,
      });
    },

    addParticipant: (p) => {
      set((state) => ({
        participants: state.participants.some((existing) => existing.id === p.id)
          ? state.participants.map((existing) => (existing.id === p.id ? p : existing))
          : [...state.participants, p],
      }));
    },

    removeParticipant: (id) => {
      set((state) => ({
        participants: state.participants.filter((p) => p.id !== id),
      }));
    },

    updateHost: (newHostId) => {
      const { participantId } = get();
      set((state) => ({
        hostId: newHostId,
        isHost: newHostId === participantId,
        participants: state.participants.map((p) => ({
          ...p,
          isHost: p.id === newHostId,
        })),
      }));
    },

    clearRoom: () => {
      set({
        roomCode: null,
        participants: [],
        hostId: null,
        isHost: false,
        participantId: null,
      });
    },

    setConnectionState: (connectionState) => {
      set({ connectionState });
    },

    setParticipantId: (participantId) => {
      const { hostId } = get();
      set({
        participantId,
        isHost: hostId === participantId,
      });
    },
  }));
}

export type RoomStoreInstance = ReturnType<typeof createRoomStore>;
