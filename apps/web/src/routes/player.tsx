import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { buildStreamUrl } from '@jellysync/shared';
import type { ParticipantPermissions } from '@jellysync/shared';
import { movieStore } from '../lib/movie';
import { roomStore } from '../lib/room';
import { authStore } from '../lib/auth';
import { syncStore } from '../lib/sync';
import {
  HtmlVideoPlayer,
  useHtmlVideo,
  usePlaybackSync,
  GlassPlayerControls,
  useControlsVisibility,
  usePlayerKeyboard,
  PermissionSettings,
} from '../features/player';

export default function PlayerPage() {
  const navigate = useNavigate();
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

  const streamUrl = useMemo(() => {
    if (!selectedMovie || !serverUrl || !token) return null;
    return buildStreamUrl(serverUrl, token, selectedMovie.id);
  }, [selectedMovie, serverUrl, token]);

  const { videoRef, playerInterface } = useHtmlVideo(streamUrl);
  const { requestPlay, requestPause, requestSeek, sendPermissionUpdate } = usePlaybackSync(playerInterface);
  const { controlsVisible, toggle, resetTimer, hide } = useControlsVisibility();

  usePlayerKeyboard({
    isHost,
    permissions,
    isPlaying,
    controlsVisible,
    onPlay: requestPlay,
    onPause: requestPause,
    onSeek: requestSeek,
    onHideControls: hide,
  });

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
    if (!selectedMovie || !streamUrl) {
      navigate('/', { replace: true });
    }
  }, [selectedMovie, streamUrl, navigate]);

  // Detect movie swap via global room:state handler — navigate back to lobby
  useEffect(() => {
    const currentId = selectedMovie?.id ?? null;
    if (prevMovieIdRef.current && currentId && currentId !== prevMovieIdRef.current) {
      prevMovieIdRef.current = currentId;
      if (roomCode) {
        navigate(`/room/${roomCode}`, { replace: true });
      }
      return;
    }
    prevMovieIdRef.current = currentId;
  }, [selectedMovie, roomCode, navigate]);

  if (!selectedMovie || !streamUrl) return null;

  return (
    <div style={containerStyle}>
      <HtmlVideoPlayer videoRef={videoRef} streamUrl={streamUrl} />
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
        onBack={() => navigate(-1)}
        onOpenPermissions={isHost ? handleOpenPermissions : undefined}
      />
      {permissionsOpen && (
        <PermissionSettings
          permissions={permissions}
          onUpdatePermissions={handleUpdatePermissions}
          onClose={handleClosePermissions}
        />
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  animation: 'fadeIn 300ms ease-in forwards',
};
