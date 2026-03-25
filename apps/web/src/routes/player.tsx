import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { movieStore } from '../lib/movie';

export default function PlayerPage() {
  const navigate = useNavigate();
  const selectedMovie = useStore(movieStore, (s) => s.selectedMovie);

  useEffect(() => {
    if (!selectedMovie) {
      navigate('/', { replace: true });
    }
  }, [selectedMovie, navigate]);

  if (!selectedMovie) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#0e0e0e' }}>
      <h1 className="text-on-surface font-heading text-2xl font-bold text-center">
        {selectedMovie.name}
      </h1>
      <p className="text-on-surface-variant font-body text-sm mt-2">
        Playback coming in Epic 4
      </p>
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back to lobby"
        className="mt-8 min-h-[48px] px-6 text-on-surface-variant font-body text-sm font-medium cursor-pointer hover:text-on-surface transition-colors"
      >
        Back to Lobby
      </button>
    </div>
  );
}
