import { useState, useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from 'zustand';
import { authStore } from '../src/lib/auth';
import { GlassHeader } from '../src/shared/components/glass-header';
import { ActionCard } from '../src/shared/components/action-card';
import { useWs } from '../src/shared/providers/websocket-provider';
import {
  createWsMessage,
  ROOM_MESSAGE_TYPE,
  type RoomStatePayload,
} from '@jellysync/shared';

export default function HomeScreen() {
  const username = useStore(authStore, (s) => s.username);
  const serverUrl = useStore(authStore, (s) => s.serverUrl);
  const logout = useStore(authStore, (s) => s.logout);
  const router = useRouter();
  const { send, subscribe } = useWs();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsub = subscribe(ROOM_MESSAGE_TYPE.STATE, (msg) => {
      if (!creating) return;
      const payload = msg.payload as RoomStatePayload;
      setCreating(false);
      router.push(`/room/${payload.roomCode}`);
    });

    const unsubError = subscribe('error', () => {
      setCreating(false);
    });

    return () => {
      unsub();
      unsubError();
    };
  }, [subscribe, creating, router]);

  const handleCreateRoom = () => {
    if (creating) return;
    setCreating(true);
    send(createWsMessage(ROOM_MESSAGE_TYPE.CREATE, { displayName: username ?? 'User' }));
  };

  const handleJoinRoom = () => {
    router.push('/join');
  };

  return (
    <View className="flex-1 bg-surface">
      <GlassHeader
        variant="home"
        title={`Hey, ${username ?? 'User'}`}
        subtitle={serverUrl ?? 'Not connected'}
        onAction={logout}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 md:px-12 pt-8 pb-12 max-w-screen-xl self-center w-full"
      >
        <Text className="text-on-surface font-display text-3xl font-bold mb-8 tracking-tight">
          Ready for a{'\n'}Private Screening?
        </Text>

        <View className="gap-4">
          <ActionCard
            variant="primary"
            headline="Create Room"
            description="Pick a movie and invite others"
            icon="🎬"
            onPress={handleCreateRoom}
          />

          <ActionCard
            variant="secondary"
            headline="Join Room"
            description="Enter a code or tap a link"
            icon="🚪"
            onPress={handleJoinRoom}
          />
        </View>

        <Text className="text-outline text-xs font-body uppercase tracking-widest text-center mt-auto pt-12">
          Synced via JellySync Core v2.4.5
        </Text>
      </ScrollView>
    </View>
  );
}
