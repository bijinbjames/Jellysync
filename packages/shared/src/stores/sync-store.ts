import { createStore } from 'zustand/vanilla';
import type { ParticipantPermissions } from '../protocol/messages.js';

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
  controlsVisible: boolean;
  permissions: ParticipantPermissions;
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
  showControls: () => void;
  hideControls: () => void;
  setPermissions: (permissions: ParticipantPermissions) => void;
  reset: () => void;
}

export type SyncStore = SyncState & SyncActions;

const defaultPermissions: ParticipantPermissions = { canPlayPause: true, canSeek: true };

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
  controlsVisible: false,
  permissions: defaultPermissions,
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
    showControls: () => set({ controlsVisible: true }),
    hideControls: () => set({ controlsVisible: false }),
    setPermissions: (permissions) => set({ permissions }),
    reset: () => set(initialState),
  }));
}

export type SyncStoreInstance = ReturnType<typeof createSyncStore>;
