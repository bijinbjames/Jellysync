import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from 'zustand';
import * as ScreenOrientation from 'expo-screen-orientation';
import { buildStreamUrl, extractSubtitleTracks, useMovieDetails } from '@jellysync/shared';
import type { ParticipantPermissions } from '@jellysync/shared';
import { movieStore } from '../src/lib/movie';
import { roomStore } from '../src/lib/room';
import { authStore } from '../src/lib/auth';
import { syncStore } from '../src/lib/sync';
import {
  VideoPlayerView,
  useVideoPlayer,
  usePlaybackSync,
  GlassPlayerControls,
  useControlsVisibility,
  PermissionSettings,
} from '../src/features/player';
import { useSteppedAway } from '../src/features/player/hooks/use-stepped-away.js';
import { SteppedAwayToast } from '../src/features/player/components/stepped-away-toast.js';
import { useVoice } from '../src/features/voice/index.js';

export default function PlayerScreen() {
  const router = useRouter();
  const selectedMovie = useStore(movieStore, (s) => s.selectedMovie);
  const isHost = useStore(roomStore, (s) => s.isHost);
  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const hostId = useStore(roomStore, (s) => s.hostId);
  const participants = useStore(roomStore, (s) => s.participants);
  const serverUrl = useStore(authStore, (s) => s.serverUrl);
  const token = useStore(authStore, (s) => s.token);
  const isPlaying = useStore(syncStore, (s) => s.isPlaying);
  const currentPosition = useStore(syncStore, (s) => s.playbackPosition);
  const duration = useStore(syncStore, (s) => s.duration);
  const bufferProgress = useStore(syncStore, (s) => s.bufferProgress);
  const permissions = useStore(syncStore, (s) => s.permissions);
  const subtitlesEnabled = useStore(syncStore, (s) => s.subtitlesEnabled);
  const subtitleTrackIndex = useStore(syncStore, (s) => s.subtitleTrackIndex);
  const steppedAwayParticipantIds = useStore(syncStore, (s) => s.steppedAwayParticipantIds);
  const userId = useStore(authStore, (s) => s.userId);
  const prevMovieIdRef = useRef<string | null>(selectedMovie?.id ?? null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
      .then(() => {
        if (cancelled) {
          ScreenOrientation.unlockAsync().catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const streamUrl = useMemo(() => {
    if (!selectedMovie || !serverUrl || !token) return null;
    return buildStreamUrl(serverUrl, token, selectedMovie.id);
  }, [selectedMovie, serverUrl, token]);

  const { data: movieDetails } = useMovieDetails(serverUrl ?? '', token ?? '', userId ?? '', selectedMovie?.id);

  const { player, playerInterface } = useVideoPlayer(streamUrl);
  const { requestPlay, requestPause, requestSeek, sendPermissionUpdate } = usePlaybackSync(playerInterface);
  const { controlsVisible, toggle, resetTimer, fadeAnim: controlsFadeAnim } = useControlsVisibility();
  useSteppedAway();
  useVoice();

  // Extract subtitle tracks from movie's MediaSources
  useEffect(() => {
    if (!movieDetails?.MediaSources) return;
    const tracks = extractSubtitleTracks(movieDetails.MediaSources);
    syncStore.getState().setAvailableSubtitleTracks(tracks);
    if (tracks.length > 0 && syncStore.getState().subtitleTrackIndex === null) {
      const englishTrack = tracks.find((t) => t.language === 'eng');
      syncStore.getState().setSubtitleTrackIndex(englishTrack?.index ?? tracks[0].index);
    }
  }, [movieDetails]);

  // Configure expo-video subtitle track based on store state
  useEffect(() => {
    if (!player) return;
    if (!subtitlesEnabled) {
      player.subtitleTrack = null;
      return;
    }
    const available = player.availableSubtitleTracks;
    if (available.length === 0) return;
    // Match by language from our extracted tracks
    const storeState = syncStore.getState();
    const selectedTrack = storeState.availableSubtitleTracks.find((t) => t.index === subtitleTrackIndex);
    const lang = selectedTrack?.language ?? 'eng';
    const match = available.find((t) => t.language === lang) ?? available[0];
    player.subtitleTrack = match;
  }, [player, subtitlesEnabled, subtitleTrackIndex]);

  const handleSubtitleToggle = useCallback(() => {
    const current = syncStore.getState().subtitlesEnabled;
    syncStore.getState().setSubtitlesEnabled(!current);
  }, []);

  const handleOpenPermissions = useCallback(() => {
    setPermissionsOpen(true);
  }, []);

  const handleClosePermissions = useCallback(() => {
    setPermissionsOpen(false);
  }, []);

  const handleUpdatePermissions = useCallback((newPermissions: ParticipantPermissions) => {
    sendPermissionUpdate(newPermissions);
  }, [sendPermissionUpdate]);

  useEffect(() => {
    if (!selectedMovie) {
      router.replace('/');
    }
  }, [selectedMovie, router]);

  // Detect movie swap via global room:state handler — navigate back to lobby
  useEffect(() => {
    const currentId = selectedMovie?.id ?? null;
    if (prevMovieIdRef.current && currentId && currentId !== prevMovieIdRef.current) {
      prevMovieIdRef.current = currentId;
      if (roomCode) {
        router.replace(`/room/${roomCode}` as any);
      }
      return;
    }
    prevMovieIdRef.current = currentId;
  }, [selectedMovie, roomCode, router]);

  if (!selectedMovie || !player) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <VideoPlayerView player={player} />
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: controlsVisible ? controlsFadeAnim : 0 }]} pointerEvents={controlsVisible ? 'auto' : 'box-none'}>
        <GlassPlayerControls
          visible={controlsVisible}
          isPlaying={isPlaying}
          isHost={isHost}
          permissions={permissions}
          movieTitle={selectedMovie.name}
          currentPosition={currentPosition}
          duration={duration}
          bufferProgress={bufferProgress}
          participants={participants}
          hostId={hostId ?? ''}
          onToggleVisibility={toggle}
          onResetTimer={resetTimer}
          onPlay={requestPlay}
          onPause={requestPause}
          onSeek={requestSeek}
          onBack={() => router.back()}
          onOpenPermissions={isHost ? handleOpenPermissions : undefined}
          subtitlesEnabled={subtitlesEnabled}
          onSubtitleToggle={handleSubtitleToggle}
          steppedAwayParticipantIds={steppedAwayParticipantIds}
        />
      </Animated.View>
      <SteppedAwayToast />
      <PermissionSettings
        visible={permissionsOpen}
        permissions={permissions}
        onUpdatePermissions={handleUpdatePermissions}
        onClose={handleClosePermissions}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
});
