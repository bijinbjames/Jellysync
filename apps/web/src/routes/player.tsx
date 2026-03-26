import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { buildStreamUrl, extractSubtitleTracks, getSubtitleUrl, useMovieDetails } from '@jellysync/shared';
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
import { useSteppedAway } from '../features/player/hooks/use-stepped-away.js';
import { SteppedAwayToast } from '../features/player/components/stepped-away-toast.js';
import { useVoice } from '../features/voice/index.js';

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
  const subtitlesEnabled = useStore(syncStore, (s) => s.subtitlesEnabled);
  const subtitleTrackIndex = useStore(syncStore, (s) => s.subtitleTrackIndex);
  const availableSubtitleTracks = useStore(syncStore, (s) => s.availableSubtitleTracks);
  const steppedAwayParticipantIds = useStore(syncStore, (s) => s.steppedAwayParticipantIds);
  const prevMovieIdRef = useRef<string | null>(selectedMovie?.id ?? null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const streamUrl = useMemo(() => {
    if (!selectedMovie || !serverUrl || !token) return null;
    return buildStreamUrl(serverUrl, token, selectedMovie.id);
  }, [selectedMovie, serverUrl, token]);

  const userId = useStore(authStore, (s) => s.userId);
  const { data: movieDetails } = useMovieDetails(serverUrl ?? '', token ?? '', userId ?? '', selectedMovie?.id);

  const { videoRef, playerInterface } = useHtmlVideo(streamUrl);
  const { requestPlay, requestPause, requestSeek, sendPermissionUpdate } = usePlaybackSync(playerInterface);
  const { controlsVisible, toggle, resetTimer, hide } = useControlsVisibility();
  useSteppedAway();
  useVoice();

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

  // Extract subtitle tracks from movie's MediaSources
  useEffect(() => {
    if (!movieDetails?.MediaSources) return;
    const tracks = extractSubtitleTracks(movieDetails.MediaSources);
    syncStore.getState().setAvailableSubtitleTracks(tracks);
    // Default to first English track, or first track if no English
    if (tracks.length > 0 && syncStore.getState().subtitleTrackIndex === null) {
      const englishTrack = tracks.find((t) => t.language === 'eng');
      syncStore.getState().setSubtitleTrackIndex(englishTrack?.index ?? tracks[0].index);
    }
  }, [movieDetails]);

  const handleSubtitleToggle = useCallback(() => {
    const current = syncStore.getState().subtitlesEnabled;
    syncStore.getState().setSubtitlesEnabled(!current);
  }, []);

  const subtitleUrl = useMemo(() => {
    if (!subtitlesEnabled || subtitleTrackIndex === null || !serverUrl || !selectedMovie) return null;
    const mediaSourceId = movieDetails?.MediaSources?.[0]?.Id;
    if (!mediaSourceId) return null;
    return getSubtitleUrl(serverUrl, selectedMovie.id, mediaSourceId, subtitleTrackIndex);
  }, [subtitlesEnabled, subtitleTrackIndex, serverUrl, selectedMovie, movieDetails]);

  // Manage subtitle <track> element on the video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Remove existing subtitle tracks
    const existingTracks = video.querySelectorAll('track[data-subtitle]');
    existingTracks.forEach((t) => t.remove());

    if (subtitleUrl) {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.src = subtitleUrl;
      track.srclang = availableSubtitleTracks.find((t) => t.index === subtitleTrackIndex)?.language ?? 'eng';
      track.label = availableSubtitleTracks.find((t) => t.index === subtitleTrackIndex)?.displayTitle ?? 'English';
      track.default = true;
      track.setAttribute('data-subtitle', 'true');
      video.appendChild(track);

      // Enable the track
      if (video.textTracks.length > 0) {
        const lastTrack = video.textTracks[video.textTracks.length - 1];
        lastTrack.mode = 'showing';
      }
    }

    return () => {
      if (video) {
        const tracks = video.querySelectorAll('track[data-subtitle]');
        tracks.forEach((t) => t.remove());
      }
    };
  }, [subtitleUrl, videoRef, subtitleTrackIndex, availableSubtitleTracks]);

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
        subtitlesEnabled={subtitlesEnabled}
        onSubtitleToggle={handleSubtitleToggle}
        steppedAwayParticipantIds={steppedAwayParticipantIds}
      />
      <SteppedAwayToast />
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
  width: '100vw',
  height: '100vh',
  animation: 'fadeIn 300ms ease-in forwards',
};
