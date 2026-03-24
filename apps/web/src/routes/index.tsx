import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { authStore } from '../lib/auth';
import { GlassHeader } from '../shared/components/glass-header';
import { ActionCard } from '../shared/components/action-card';
import { useWs } from '../shared/providers/websocket-provider';
import {
  createWsMessage,
  ROOM_MESSAGE_TYPE,
  type RoomStatePayload,
} from '@jellysync/shared';

export default function HomePage() {
  const username = useStore(authStore, (s) => s.username);
  const serverUrl = useStore(authStore, (s) => s.serverUrl);
  const logout = useStore(authStore, (s) => s.logout);
  const navigate = useNavigate();
  const { send, subscribe } = useWs();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsub = subscribe(ROOM_MESSAGE_TYPE.STATE, (msg) => {
      if (!creating) return;
      const payload = msg.payload as RoomStatePayload;
      setCreating(false);
      navigate(`/room/${payload.roomCode}`);
    });

    const unsubError = subscribe('error', () => {
      setCreating(false);
    });

    return () => {
      unsub();
      unsubError();
    };
  }, [subscribe, creating, navigate]);

  const handleCreateRoom = () => {
    if (creating) return;
    setCreating(true);
    send(createWsMessage(ROOM_MESSAGE_TYPE.CREATE, { displayName: username ?? 'User' }));
  };

  const handleJoinRoom = () => {
    navigate('/join');
  };

  return (
    <div className="min-h-screen bg-surface">
      <GlassHeader
        variant="home"
        title={`Hey, ${username ?? 'User'}`}
        subtitle={serverUrl ?? 'Not connected'}
        onAction={logout}
      />
      <main className="px-6 md:px-12 pt-8 pb-12 max-w-screen-xl mx-auto">
        <h2 className="text-on-surface font-display text-3xl font-bold mb-8 tracking-tight">
          Ready for a<br />Private Screening?
        </h2>

        <div className="flex flex-col gap-4">
          <ActionCard
            variant="primary"
            headline="Create Room"
            description="Start a new watch session and invite your friends"
            icon="🎬"
            onPress={handleCreateRoom}
          />

          <ActionCard
            variant="secondary"
            headline="Join Room"
            description="Enter a room code to join an existing session"
            icon="🎟️"
            onPress={handleJoinRoom}
          />
        </div>
      </main>
    </div>
  );
}
