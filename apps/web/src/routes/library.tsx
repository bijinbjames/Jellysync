import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { JellyfinLibraryItem } from '@jellysync/shared';
import { createWsMessage, ROOM_MESSAGE_TYPE, type RoomStatePayload } from '@jellysync/shared';
import { useStore } from 'zustand';
import { GlassHeader } from '../shared/components/glass-header';
import { CategoryChips } from '../features/library/components/category-chips';
import { PosterGrid } from '../features/library/components/poster-grid';
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
  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const creatingRef = useRef(false);

  const { movies, categories, selectedCategory, setCategory, isLoading, error, serverUrl } =
    useLibrary();

  // Subscribe to room:state to navigate to lobby after room creation
  useEffect(() => {
    if (fromLobby) return; // Don't need this when changing movie in existing room

    const unsub = subscribe(ROOM_MESSAGE_TYPE.STATE, (msg) => {
      const payload = msg.payload as RoomStatePayload;
      creatingRef.current = false;
      navigate(`/room/${payload.roomCode}`, { replace: true });
    });
    return unsub;
  }, [fromLobby, subscribe, navigate]);

  const handleMovieSelect = (item: JellyfinLibraryItem) => {
    movieStore.getState().setMovie({
      id: item.Id,
      name: item.Name,
      year: item.ProductionYear,
      runtimeTicks: item.RunTimeTicks,
      imageTag: item.ImageTags?.Primary,
    });

    // If navigating from lobby, just go back (movie already updated in store)
    if (fromLobby) {
      if (roomCode) {
        navigate(-1);
      } else {
        navigate('/', { replace: true });
      }
      return;
    }

    // Prevent double room creation on rapid taps
    if (creatingRef.current) return;
    creatingRef.current = true;

    // Create a new room
    const username = authStore.getState().username;
    send(createWsMessage(ROOM_MESSAGE_TYPE.CREATE, { displayName: username ?? 'User' }));
  };

  return (
    <div className="min-h-screen bg-surface">
      <GlassHeader
        variant="navigation"
        title="Library"
        onBack={() => navigate(-1)}
      />
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
  );
}
