import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { buildStreamUrl } from '@jellysync/shared';
import { movieStore } from '../lib/movie';
import { roomStore } from '../lib/room';
import { authStore } from '../lib/auth';
import { HtmlVideoPlayer, useHtmlVideo, usePlaybackSync, SyncStatusChip } from '../features/player';

export default function PlayerPage() {
  const navigate = useNavigate();
  const selectedMovie = useStore(movieStore, (s) => s.selectedMovie);
  const isHost = useStore(roomStore, (s) => s.isHost);
  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const serverUrl = useStore(authStore, (s) => s.serverUrl);
  const token = useStore(authStore, (s) => s.token);
  const prevMovieIdRef = useRef<string | null>(selectedMovie?.id ?? null);

  const streamUrl = useMemo(() => {
    if (!selectedMovie || !serverUrl || !token) return null;
    return buildStreamUrl(serverUrl, token, selectedMovie.id);
  }, [selectedMovie, serverUrl, token]);

  const { videoRef, playerInterface } = useHtmlVideo(streamUrl);
  usePlaybackSync(playerInterface);

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
      <div style={topBarStyle}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back to lobby"
          style={backButtonStyle}
        >
          Back to Lobby
        </button>
        {isHost && (
          <button
            type="button"
            onClick={() => navigate('/library?from=player')}
            aria-label="Change Movie"
            style={changeButtonStyle}
          >
            Change Movie
          </button>
        )}
      </div>
      <div style={bottomOverlayStyle}>
        <SyncStatusChip />
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  animation: 'fadeIn 300ms ease-in forwards',
};

const topBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 48,
  left: 16,
  right: 16,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 10,
};

const backButtonStyle: React.CSSProperties = {
  minHeight: 48,
  paddingLeft: 16,
  paddingRight: 16,
  color: '#CAC4D0',
  fontSize: 14,
  fontWeight: 500,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};

const changeButtonStyle: React.CSSProperties = {
  minHeight: 48,
  paddingLeft: 16,
  paddingRight: 16,
  color: '#D0BCFF',
  fontSize: 14,
  fontWeight: 500,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};

const bottomOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 24,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  zIndex: 10,
  pointerEvents: 'none',
};
