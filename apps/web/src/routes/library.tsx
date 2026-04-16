import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { JellyfinLibraryItem } from '@jellysync/shared';
import type { SelectedMovie } from '@jellysync/shared';
import { createWsMessage, ROOM_MESSAGE_TYPE, type RoomStatePayload } from '@jellysync/shared';
import { GlassHeader } from '../shared/components/glass-header';
import { SwapConfirmSheet } from '../shared/components/swap-confirm-sheet';
import { CategoryChips } from '../features/library/components/category-chips';
import { PosterGrid } from '../features/library/components/poster-grid';
import { LibraryNav } from '../features/library/components/library-nav';
import { useLibrary } from '../features/library/hooks/use-library';
import { useWs } from '../shared/providers/websocket-provider';
import { movieStore } from '../lib/movie';
import { authStore } from '../lib/auth';
import { roomStore } from '../lib/room';

export default function LibraryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { send, subscribe } = useWs();

  const fromLobby = searchParams.get('from') === 'lobby';
  const fromPlayer = searchParams.get('from') === 'player';
  const isSwapContext = fromLobby || fromPlayer;
  const roomCode = roomStore.getState().roomCode;
  const creatingRef = useRef(false);

  const [pendingMovie, setPendingMovie] = useState<SelectedMovie | null>(null);

  const { movies, categories, selectedCategory, setCategory, isLoading, error, serverUrl } =
    useLibrary();

  // Subscribe to room:state to navigate to lobby after room creation
  useEffect(() => {
    if (isSwapContext) return; // Don't need this when changing movie in existing room

    const unsub = subscribe(ROOM_MESSAGE_TYPE.STATE, (msg) => {
      const payload = msg.payload as RoomStatePayload;
      creatingRef.current = false;
      navigate(`/room/${payload.roomCode}`, { replace: true });
    });
    return unsub;
  }, [isSwapContext, subscribe, navigate]);

  const handleMovieSelect = (item: JellyfinLibraryItem) => {
    const movie: SelectedMovie = {
      id: item.Id,
      name: item.Name,
      year: item.ProductionYear,
      runtimeTicks: item.RunTimeTicks,
      imageTag: item.ImageTags?.Primary,
    };

    if (isSwapContext) {
      setPendingMovie(movie);
      return;
    }

    movieStore.getState().setMovie(movie);

    // Prevent double room creation on rapid taps
    if (creatingRef.current) return;
    creatingRef.current = true;

    // Create a new room with selected movie
    const username = authStore.getState().username;
    send(createWsMessage(ROOM_MESSAGE_TYPE.CREATE, { displayName: username ?? 'User', movie }));
  };

  const handleConfirmSwap = () => {
    if (!pendingMovie) return;
    movieStore.getState().setMovie(pendingMovie);
    send(createWsMessage(ROOM_MESSAGE_TYPE.MOVIE_SELECT, { movie: pendingMovie }));
    setPendingMovie(null);
    if (roomCode) {
      navigate(`/room/${roomCode}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleCancelSwap = () => {
    setPendingMovie(null);
  };

  return (
    <div className="min-h-screen bg-surface">
      <GlassHeader
        variant="navigation"
        title="Library"
        onBack={() => navigate(-1)}
      />
      <div className="max-w-screen-xl mx-auto pb-24 lg:pb-12">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <p className="text-error font-body text-sm text-center">
              {error.message}
            </p>
          </div>
        ) : (
          <>
            <CategoryChips
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setCategory}
              isLoading={isLoading}
            />
            <PosterGrid
              movies={movies}
              serverUrl={serverUrl}
              isLoading={isLoading}
              onMoviePress={handleMovieSelect}
            />
          </>
        )}
      </div>
      {!isSwapContext && <LibraryNav />}
      <SwapConfirmSheet
        movieName={pendingMovie?.name ?? ''}
        onConfirm={handleConfirmSwap}
        onCancel={handleCancelSwap}
        visible={pendingMovie !== null}
      />
    </div>
  );
}
