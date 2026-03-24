import { useEffect } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from 'zustand';
import { roomStore } from '../../src/lib/room';
import { useWs } from '../../src/shared/providers/websocket-provider';
import { createWsMessage, ROOM_MESSAGE_TYPE, ROOM_CONFIG } from '@jellysync/shared';
import { RoomCodeDisplay } from '../../src/features/room/components/room-code-display';
import { ParticipantChip } from '../../src/features/room/components/participant-chip';
import { MovieBriefCard } from '../../src/features/room/components/movie-brief-card';

const VISIBLE_SLOTS = 6;

export default function RoomLobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { send } = useWs();

  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const participants = useStore(roomStore, (s) => s.participants);
  const isHost = useStore(roomStore, (s) => s.isHost);

  const emptySlots = Math.max(0, VISIBLE_SLOTS - participants.length);

  const handleLeaveRoom = () => {
    send(createWsMessage(ROOM_MESSAGE_TYPE.LEAVE, {}));
    roomStore.getState().clearRoom();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  useEffect(() => {
    if (!roomCode && !code) {
      router.replace('/');
    }
  }, [roomCode, code, router]);

  const displayCode = roomCode ?? code ?? '';

  return (
    <View className="flex-1 bg-surface">
      <View className="px-6 pt-14 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={handleLeaveRoom}
          accessibilityRole="button"
          accessibilityLabel="Leave room and go back"
          className="min-h-[48px] min-w-[48px] items-center justify-center"
        >
          <Text className="text-on-surface-variant text-2xl">{'\u2190'}</Text>
        </Pressable>
        <Text className="text-on-surface-variant font-body text-xs uppercase tracking-widest">
          Room Lobby
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-12 pt-4 gap-8"
      >
        <RoomCodeDisplay code={displayCode} />

        <View className="gap-3">
          <Text className="text-on-surface-variant font-body text-xs uppercase tracking-widest">
            Participants ({participants.length}/{ROOM_CONFIG.MAX_PARTICIPANTS})
          </Text>
          <View className="gap-2">
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
          </View>
        </View>

        <MovieBriefCard />

        <View className="pt-4">
          <Pressable
            onPress={handleLeaveRoom}
            accessibilityRole="button"
            accessibilityLabel="Cancel room"
            className="min-h-[48px] items-center justify-center"
          >
            <Text className="text-error font-body text-sm font-medium">
              Cancel Room
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
