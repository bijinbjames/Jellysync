import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from 'zustand';
import { buildStreamUrl } from '@jellysync/shared';
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
  const prevMovieIdRef = useRef<string | null>(selectedMovie?.id ?? null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const { player, playerInterface } = useVideoPlayer(streamUrl);
  const { requestPlay, requestPause, requestSeek, sendPermissionUpdate } = usePlaybackSync(playerInterface);
  const { controlsVisible, toggle, resetTimer, fadeAnim: controlsFadeAnim } = useControlsVisibility();

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
        />
      </Animated.View>
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
