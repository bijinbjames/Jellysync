import { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from 'zustand';
import { authStore } from '../../src/lib/auth';
import { roomStore } from '../../src/lib/room';
import { movieStore } from '../../src/lib/movie';
import { useWs } from '../../src/shared/providers/websocket-provider';
import { createWsMessage, ROOM_MESSAGE_TYPE, ROOM_CONFIG, ERROR_CODE } from '@jellysync/shared';
import { RoomCodeDisplay } from '../../src/features/room/components/room-code-display';
import { ParticipantChip } from '../../src/features/room/components/participant-chip';
import { MovieBriefCard } from '../../src/features/room/components/movie-brief-card';

const VISIBLE_SLOTS = 6;

export default function RoomLobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { send, subscribe } = useWs();

  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const participants = useStore(roomStore, (s) => s.participants);
  const isHost = useStore(roomStore, (s) => s.isHost);
  const selectedMovie = useStore(movieStore, (s) => s.selectedMovie);

  const [autoJoining, setAutoJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | false>(false);
  const [roomClosed, setRoomClosed] = useState(false);
  const joinSentRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectionState = useStore(roomStore, (s) => s.connectionState);

  const emptySlots = Math.max(0, VISIBLE_SLOTS - participants.length);

  const canStartMovie = selectedMovie !== null && participants.length >= 2;

  const handleLeaveRoom = () => {
    send(createWsMessage(ROOM_MESSAGE_TYPE.LEAVE, {}));
    roomStore.getState().clearRoom();
    movieStore.getState().clearMovie();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleStartMovie = () => {
    if (canStartMovie) {
      router.push('/player' as any);
    }
  };

  const handleBrowseLibrary = () => {
    router.push('/library?from=lobby' as any);
  };

  // Subscribe to room:close — room destroyed by server
  useEffect(() => {
    const unsub = subscribe(ROOM_MESSAGE_TYPE.CLOSE, () => {
      setRoomClosed(true);
    });
    return unsub;
  }, [subscribe]);

  // Auto-join via deep link: subscribe first, then send when WS is ready
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

  // Redirect home only if no code param AND no room state (not a deep link, not in a room)
  useEffect(() => {
    if (!roomCode && !code) {
      router.replace('/');
    }
  }, [roomCode, code, router]);

  // Room closed by server
  if (roomClosed) {
    return (
      <View className="flex-1 bg-surface items-center justify-center p-6">
        <Text className="text-on-surface font-heading text-lg font-bold text-center">
          This room has ended
        </Text>
        <Text className="text-on-surface-variant font-body text-sm text-center mt-2">
          The room was closed because everyone has left
        </Text>
        <Pressable
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          className="gradient-primary rounded-md min-h-[48px] items-center justify-center w-full mt-6"
        >
          <Text className="text-on-primary font-display text-base font-bold">
            Back to Home
          </Text>
        </Pressable>
      </View>
    );
  }

  // Error state for invalid/expired room
  if (joinError) {
    return (
      <View className="flex-1 bg-surface items-center justify-center p-6">
        <Text className="text-on-surface font-heading text-lg font-bold text-center">
          {joinError}
        </Text>
        <Text className="text-on-surface-variant font-body text-sm text-center mt-2">
          {joinError === 'Connection timed out — please try again'
            ? 'Check your connection and try the link again'
            : 'The room may have ended or the code has expired'}
        </Text>
        <Pressable
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          className="gradient-primary rounded-md min-h-[48px] items-center justify-center w-full mt-6"
        >
          <Text className="text-on-primary font-display text-base font-bold">
            Back to Home
          </Text>
        </Pressable>
      </View>
    );
  }

  // Loading state while auto-joining
  if (autoJoining) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

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

        {isHost && (
          <Pressable
            onPress={handleBrowseLibrary}
            accessibilityRole="button"
            accessibilityLabel={selectedMovie ? 'Change Movie' : 'Browse Library'}
            className="min-h-[48px] items-center justify-center"
          >
            <Text className="text-on-surface-variant font-body text-sm font-medium">
              {selectedMovie ? 'Change Movie' : 'Browse Library'}
            </Text>
          </Pressable>
        )}

        {isHost && (
          <Pressable
            onPress={handleStartMovie}
            disabled={!canStartMovie}
            accessibilityRole="button"
            accessibilityLabel="Start Movie"
            className={`gradient-primary rounded-md min-h-[48px] items-center justify-center w-full ${
              canStartMovie ? '' : 'opacity-50'
            }`}
          >
            <Text className="text-on-primary font-display text-base font-bold">
              Start Movie
            </Text>
          </Pressable>
        )}

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
