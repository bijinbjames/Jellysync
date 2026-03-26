import { createStore } from 'zustand/vanilla';

export type SyncStatus = 'synced' | 'syncing' | 'drifted';

export type PauseSource = 'host' | 'buffer' | null;

export interface SyncState {
  playbackPosition: number;
  duration: number;
  isPlaying: boolean;
  isBuffering: boolean;
  bufferProgress: number;
  playbackRate: number;
  syncStatus: SyncStatus;
  lastServerTimestamp: number;
  lastServerPosition: number;
  bufferPausedBy: string | null;
  pauseSource: PauseSource;
}

export interface SyncActions {
  setPlaybackState: (state: Partial<Pick<SyncState, 'playbackPosition' | 'duration' | 'isPlaying' | 'playbackRate'>>) => void;
  setBufferState: (state: Pick<SyncState, 'isBuffering' | 'bufferProgress'>) => void;
  setPosition: (positionMs: number) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setServerState: (positionMs: number, timestamp: number) => void;
  setBufferPause: (displayName: string) => void;
  clearBufferPause: () => void;
  setHostPause: () => void;
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
  syncStatus: 'synced',
  lastServerTimestamp: 0,
  lastServerPosition: 0,
  bufferPausedBy: null,
  pauseSource: null,
};

export function createSyncStore() {
  return createStore<SyncStore>()((set) => ({
    ...initialState,
    setPlaybackState: (state) => set(state),
    setBufferState: (state) => set(state),
    setPosition: (positionMs) => set({ playbackPosition: positionMs }),
    setSyncStatus: (status) => set({ syncStatus: status }),
    setServerState: (positionMs, timestamp) => set({ lastServerPosition: positionMs, lastServerTimestamp: timestamp }),
    setBufferPause: (displayName) => set({ bufferPausedBy: displayName, pauseSource: 'buffer' }),
    clearBufferPause: () => set({ bufferPausedBy: null, pauseSource: null }),
    setHostPause: () => set({ pauseSource: 'host', bufferPausedBy: null }),
    reset: () => set(initialState),
  }));
}

export type SyncStoreInstance = ReturnType<typeof createSyncStore>;
