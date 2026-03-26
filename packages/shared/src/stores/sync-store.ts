import { createStore } from 'zustand/vanilla';
import { persist, type StateStorage, createJSONStorage } from 'zustand/middleware';
import type { ParticipantPermissions } from '../protocol/messages.js';
import type { SubtitleTrack } from '../jellyfin/types.js';

export type SyncStatus = 'synced' | 'syncing' | 'drifted';

export type PauseSource = 'host' | 'buffer' | 'stepped-away' | null;

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
  subtitlesEnabled: boolean;
  subtitleTrackIndex: number | null;
  availableSubtitleTracks: SubtitleTrack[];
  steppedAwayParticipantIds: string[];
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
  setSubtitlesEnabled: (enabled: boolean) => void;
  setSubtitleTrackIndex: (index: number | null) => void;
  setAvailableSubtitleTracks: (tracks: SubtitleTrack[]) => void;
  addSteppedAway: (id: string) => void;
  removeSteppedAway: (id: string) => void;
  setSteppedAwayParticipants: (ids: string[]) => void;
  setSteppedAwayPause: (displayName: string) => void;
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
  subtitlesEnabled: false,
  subtitleTrackIndex: null,
  availableSubtitleTracks: [],
  steppedAwayParticipantIds: [],
};

export function createSyncStore(storage?: StateStorage) {
  const storeCreator = (set: (partial: Partial<SyncStore> | ((state: SyncStore) => Partial<SyncStore>)) => void): SyncStore => ({
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
    setSubtitlesEnabled: (enabled) => set({ subtitlesEnabled: enabled }),
    setSubtitleTrackIndex: (index) => set({ subtitleTrackIndex: index }),
    setAvailableSubtitleTracks: (tracks) => set({ availableSubtitleTracks: tracks }),
    addSteppedAway: (id) => set((state) => ({
      steppedAwayParticipantIds: state.steppedAwayParticipantIds.includes(id)
        ? state.steppedAwayParticipantIds
        : [...state.steppedAwayParticipantIds, id],
    })),
    removeSteppedAway: (id) => set((state) => ({
      steppedAwayParticipantIds: state.steppedAwayParticipantIds.filter((pid) => pid !== id),
    })),
    setSteppedAwayParticipants: (ids) => set({ steppedAwayParticipantIds: ids }),
    setSteppedAwayPause: (displayName) => set({ pauseSource: 'stepped-away', bufferPausedBy: displayName }),
    reset: () => set(initialState),
  });

  if (storage) {
    return createStore<SyncStore>()(
      persist(storeCreator, {
        name: 'jellysync-subtitle-prefs',
        storage: createJSONStorage(() => storage),
        partialize: (state) => ({
          subtitlesEnabled: state.subtitlesEnabled,
          subtitleTrackIndex: state.subtitleTrackIndex,
        }),
      }),
    );
  }

  return createStore<SyncStore>()(storeCreator);
}

export type SyncStoreInstance = ReturnType<typeof createSyncStore>;
