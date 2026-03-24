import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { roomStore } from '../../lib/room';
import { useWs } from '../../shared/providers/websocket-provider';
import { createWsMessage, ROOM_MESSAGE_TYPE, ROOM_CONFIG } from '@jellysync/shared';
import { RoomCodeDisplay } from '../../features/room/components/room-code-display';
import { ParticipantChip } from '../../features/room/components/participant-chip';
import { MovieBriefCard } from '../../features/room/components/movie-brief-card';

const VISIBLE_SLOTS = 6;

export default function RoomLobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { send } = useWs();

  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const participants = useStore(roomStore, (s) => s.participants);
  const isHost = useStore(roomStore, (s) => s.isHost);

  const emptySlots = Math.max(0, VISIBLE_SLOTS - participants.length);

  const handleLeaveRoom = () => {
    send(createWsMessage(ROOM_MESSAGE_TYPE.LEAVE, {}));
    roomStore.getState().clearRoom();
    navigate('/');
  };

  useEffect(() => {
    if (!roomCode && !code) {
      navigate('/', { replace: true });
    }
  }, [roomCode, code, navigate]);

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

        <MovieBriefCard />

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
