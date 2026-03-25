import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { authStore } from '../../lib/auth';
import { roomStore } from '../../lib/room';
import { movieStore } from '../../lib/movie';
import { useWs } from '../../shared/providers/websocket-provider';
import { createWsMessage, ROOM_MESSAGE_TYPE, ROOM_CONFIG, ERROR_CODE } from '@jellysync/shared';
import { RoomCodeDisplay } from '../../features/room/components/room-code-display';
import { ParticipantChip } from '../../features/room/components/participant-chip';
import { MovieBriefCard } from '../../features/room/components/movie-brief-card';

const VISIBLE_SLOTS = 6;

export default function RoomLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { send, subscribe } = useWs();

  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const participants = useStore(roomStore, (s) => s.participants);
  const isHost = useStore(roomStore, (s) => s.isHost);
  const selectedMovie = useStore(movieStore, (s) => s.selectedMovie);

  const [autoJoining, setAutoJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | false>(false);
  const [roomClosed, setRoomClosed] = useState(false);
  const [movieNotification, setMovieNotification] = useState<string | null>(null);
  const joinSentRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMovieIdRef = useRef<string | null>(selectedMovie?.id ?? null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectionState = useStore(roomStore, (s) => s.connectionState);

  const emptySlots = Math.max(0, VISIBLE_SLOTS - participants.length);

  const canStartMovie = selectedMovie !== null && participants.length >= 2;

  const handleLeaveRoom = () => {
    send(createWsMessage(ROOM_MESSAGE_TYPE.LEAVE, {}));
    roomStore.getState().clearRoom();
    movieStore.getState().clearMovie();
    navigate('/');
  };

  const handleStartMovie = () => {
    if (canStartMovie) {
      navigate('/player');
    }
  };

  const handleBrowseLibrary = () => {
    navigate('/library?from=lobby');
  };

  // Detect movie change via store update (triggered by global room:state handler)
  useEffect(() => {
    const currentId = selectedMovie?.id ?? null;
    if (prevMovieIdRef.current && currentId && currentId !== prevMovieIdRef.current) {
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
      setMovieNotification(`Movie changed to ${selectedMovie!.name}`);
      notificationTimerRef.current = setTimeout(() => {
        setMovieNotification(null);
        notificationTimerRef.current = null;
      }, 3000);
    }
    prevMovieIdRef.current = currentId;
  }, [selectedMovie]);

  // Subscribe to room:close — room destroyed by server
  useEffect(() => {
    const unsub = subscribe(ROOM_MESSAGE_TYPE.CLOSE, () => {
      setRoomClosed(true);
    });
    return unsub;
  }, [subscribe]);

  // Auto-join via URL: subscribe first, then send when WS is ready
  useEffect(() => {
    const needsAutoJoin = code && !roomCode && !joinError && !roomClosed;
    if (!needsAutoJoin) return;

    setAutoJoining(true);

    const unsubErr = subscribe('error', (msg) => {
      const error = msg.payload as { code: string; message: string; context?: string };
      if (error.context === 'room:join') {
        joinSentRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setAutoJoining(false);
        setJoinError(
          error.code === ERROR_CODE.ALREADY_IN_ROOM
            ? 'You are already in another room'
            : 'This room is no longer active',
        );
      }
    });

    const sendJoin = () => {
      if (joinSentRef.current) return;
      joinSentRef.current = true;
      const username = authStore.getState().username;
      send(createWsMessage(ROOM_MESSAGE_TYPE.JOIN, { roomCode: code, displayName: username ?? 'User' }));
      timeoutRef.current = setTimeout(() => {
        joinSentRef.current = false;
        setAutoJoining(false);
        setJoinError('Connection timed out — please try again');
      }, 10_000);
    };

    if (connectionState === 'connected') {
      sendJoin();
    }

    return () => {
      unsubErr();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [code, roomCode, joinError, connectionState, send, subscribe]);

  // When room state arrives, auto-join is complete
  useEffect(() => {
    if (roomCode && autoJoining) {
      joinSentRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setAutoJoining(false);
    }
  }, [roomCode, autoJoining]);

  // Redirect home only if no code param AND no room state
  useEffect(() => {
    if (!roomCode && !code) {
      navigate('/', { replace: true });
    }
  }, [roomCode, code, navigate]);

  // Room closed by server
  if (roomClosed) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2 w-full max-w-sm">
          <h2 className="text-on-surface font-heading text-lg font-bold text-center">
            This room has ended
          </h2>
          <p className="text-on-surface-variant font-body text-sm text-center">
            The room was closed because everyone has left
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Back to Home"
            className="gradient-primary rounded-md min-h-[48px] w-full mt-4 font-display text-base font-bold text-on-primary cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Error state for invalid/expired room
  if (joinError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2 w-full max-w-sm">
          <h2 className="text-on-surface font-heading text-lg font-bold text-center">
            {joinError}
          </h2>
          <p className="text-on-surface-variant font-body text-sm text-center">
            {joinError === 'Connection timed out — please try again'
              ? 'Check your connection and try the link again'
              : 'The room may have ended or the code has expired'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Back to Home"
            className="gradient-primary rounded-md min-h-[48px] w-full mt-4 font-display text-base font-bold text-on-primary cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Loading state while auto-joining
  if (autoJoining) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayCode = roomCode ?? code ?? '';

  return (
    <div className="min-h-screen bg-surface">
      <div className="px-6 pt-6 pb-2 flex items-center justify-between max-w-screen-xl mx-auto">
        <button
          type="button"
          onClick={handleLeaveRoom}
          aria-label="Leave room and go back"
          className="min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="text-on-surface-variant font-body text-xs uppercase tracking-widest">
          Room Lobby
        </span>
        <div className="w-12" />
      </div>

      <main className="px-6 pb-12 pt-4 max-w-screen-xl mx-auto flex flex-col gap-8">
        <RoomCodeDisplay code={displayCode} />

        <div className="flex flex-col gap-3">
          <span className="text-on-surface-variant font-body text-xs uppercase tracking-widest">
            Participants ({participants.length}/{ROOM_CONFIG.MAX_PARTICIPANTS})
          </span>
          <div className="flex flex-col gap-2">
            {participants.map((p) => (
              <ParticipantChip
                key={p.id}
                variant={p.isHost ? 'host' : 'participant'}
                displayName={p.displayName}
              />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <ParticipantChip key={`empty-${i}`} variant="empty" />
            ))}
          </div>
        </div>

        {movieNotification && (
          <div className="bg-secondary/10 rounded-lg px-4 py-2">
            <span className="text-on-surface font-body text-sm">{movieNotification}</span>
          </div>
        )}

        <MovieBriefCard />

        {isHost && (
          <button
            type="button"
            onClick={handleBrowseLibrary}
            aria-label={selectedMovie ? 'Change Movie' : 'Browse Library'}
            className="min-h-[48px] text-on-surface-variant font-body text-sm font-medium cursor-pointer hover:text-on-surface transition-colors"
          >
            {selectedMovie ? 'Change Movie' : 'Browse Library'}
          </button>
        )}

        {isHost && (
          <button
            type="button"
            onClick={handleStartMovie}
            disabled={!canStartMovie}
            aria-label="Start Movie"
            className={`gradient-primary rounded-md min-h-[48px] w-full font-display text-base font-bold text-on-primary ${
              canStartMovie
                ? 'cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Start Movie
          </button>
        )}

        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={handleLeaveRoom}
            aria-label="Cancel room"
            className="min-h-[48px] text-error font-body text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
          >
            Cancel Room
          </button>
        </div>
      </main>
    </div>
  );
}
