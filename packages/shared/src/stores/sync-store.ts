import { createStore } from 'zustand/vanilla';

export interface SyncState {
  playbackPosition: number;
  duration: number;
  isPlaying: boolean;
  isBuffering: boolean;
  bufferProgress: number;
  playbackRate: number;
}

export interface SyncActions {
  setPlaybackState: (state: Partial<Pick<SyncState, 'playbackPosition' | 'duration' | 'isPlaying' | 'playbackRate'>>) => void;
  setBufferState: (state: Pick<SyncState, 'isBuffering' | 'bufferProgress'>) => void;
  setPosition: (positionMs: number) => void;
  reset: () => void;
}

export type SyncStore = SyncState & SyncActions;

const initialState: SyncState = {
  playbackPosition: 0,
  duration: 0,
  isPlaying: false,
  isBuffering: false,
  bufferProgress: 0,
  playbackRate: 1,
};

export function createSyncStore() {
  return createStore<SyncStore>()((set) => ({
    ...initialState,
    setPlaybackState: (state) => set(state),
    setBufferState: (state) => set(state),
    setPosition: (positionMs) => set({ playbackPosition: positionMs }),
    reset: () => set(initialState),
  }));
}

export type SyncStoreInstance = ReturnType<typeof createSyncStore>;
