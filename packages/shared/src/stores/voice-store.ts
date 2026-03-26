import { createStore } from 'zustand/vanilla';
import { persist, type StateStorage, createJSONStorage } from 'zustand/middleware';
import type { PeerConnectionState } from '../voice/types.js';

export interface VoiceState {
  isVoiceEnabled: boolean;
  isMuted: boolean;
  peerConnections: Map<string, PeerConnectionState>;
  localStreamActive: boolean;
  volumeLevels: Map<string, number>;
}

export interface VoiceActions {
  setVoiceEnabled: (enabled: boolean) => void;
  setMuted: (muted: boolean) => void;
  setPeerConnectionState: (participantId: string, state: PeerConnectionState) => void;
  removePeerConnection: (participantId: string) => void;
  setLocalStreamActive: (active: boolean) => void;
  setVolume: (participantId: string, volume: number) => void;
  reset: () => void;
}

export type VoiceStore = VoiceState & VoiceActions;

const initialState: VoiceState = {
  isVoiceEnabled: false,
  isMuted: false,
  peerConnections: new Map(),
  localStreamActive: false,
  volumeLevels: new Map(),
};

export function createVoiceStore(storage?: StateStorage) {
  const storeCreator = (set: (partial: Partial<VoiceStore> | ((state: VoiceStore) => Partial<VoiceStore>)) => void): VoiceStore => ({
    ...initialState,
    peerConnections: new Map(),
    volumeLevels: new Map(),
    setVoiceEnabled: (enabled) => set({ isVoiceEnabled: enabled }),
    setMuted: (muted) => set({ isMuted: muted }),
    setPeerConnectionState: (participantId, state) => set((current) => {
      const updated = new Map(current.peerConnections);
      updated.set(participantId, state);
      return { peerConnections: updated };
    }),
    removePeerConnection: (participantId) => set((current) => {
      const updatedPeers = new Map(current.peerConnections);
      updatedPeers.delete(participantId);
      const updatedVolumes = new Map(current.volumeLevels);
      updatedVolumes.delete(participantId);
      return { peerConnections: updatedPeers, volumeLevels: updatedVolumes };
    }),
    setLocalStreamActive: (active) => set({ localStreamActive: active }),
    setVolume: (participantId, volume) => set((current) => {
      const updated = new Map(current.volumeLevels);
      updated.set(participantId, Math.max(0, Math.min(1, volume)));
      return { volumeLevels: updated };
    }),
    reset: () => set((current) => ({
      ...initialState,
      isMuted: current.isMuted,
      peerConnections: new Map(),
      volumeLevels: new Map(),
    })),
  });

  if (storage) {
    return createStore<VoiceStore>()(
      persist(storeCreator, {
        name: 'jellysync-voice-prefs',
        storage: createJSONStorage(() => storage),
        partialize: (state) => ({
          isMuted: state.isMuted,
        }),
      }),
    );
  }

  return createStore<VoiceStore>()(storeCreator);
}

export type VoiceStoreInstance = ReturnType<typeof createVoiceStore>;
