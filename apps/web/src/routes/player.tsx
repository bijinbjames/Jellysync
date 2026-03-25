import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { movieStore } from '../lib/movie';
import { roomStore } from '../lib/room';

export default function PlayerPage() {
  const navigate = useNavigate();
  const selectedMovie = useStore(movieStore, (s) => s.selectedMovie);
  const isHost = useStore(roomStore, (s) => s.isHost);
  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const prevMovieIdRef = useRef<string | null>(selectedMovie?.id ?? null);

  useEffect(() => {
    if (!selectedMovie) {
      navigate('/', { replace: true });
    }
  }, [selectedMovie, navigate]);

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

  if (!selectedMovie) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#0e0e0e' }}>
      <h1 className="text-on-surface font-heading text-2xl font-bold text-center">
        {selectedMovie.name}
      </h1>
      <p className="text-on-surface-variant font-body text-sm mt-2">
        Playback coming in Epic 4
      </p>
      {isHost && (
        <button
          type="button"
          onClick={() => navigate('/library?from=player')}
          aria-label="Change Movie"
          className="mt-6 min-h-[48px] px-6 text-primary font-body text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
        >
          Change Movie
        </button>
      )}
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back to lobby"
        className="mt-4 min-h-[48px] px-6 text-on-surface-variant font-body text-sm font-medium cursor-pointer hover:text-on-surface transition-colors"
      >
        Back to Lobby
      </button>
    </div>
  );
}
