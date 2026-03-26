import { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from 'zustand';
import { authStore } from '../../src/lib/auth';
import { roomStore } from '../../src/lib/room';
import { movieStore } from '../../src/lib/movie';
import { voiceStore } from '../../src/lib/voice';
import { useWs } from '../../src/shared/providers/websocket-provider';
import { createWsMessage, ROOM_MESSAGE_TYPE, SYNC_MESSAGE_TYPE, ROOM_CONFIG, ERROR_CODE, type WsMessage, type RoomStatePayload } from '@jellysync/shared';
import { RoomCodeDisplay } from '../../src/features/room/components/room-code-display';
import { ParticipantChip } from '../../src/features/room/components/participant-chip';
import { MovieBriefCard } from '../../src/features/room/components/movie-brief-card';

export default function RoomLobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { send, subscribe } = useWs();

  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const participants = useStore(roomStore, (s) => s.participants);
  const participantId = useStore(roomStore, (s) => s.participantId);
  const isHost = useStore(roomStore, (s) => s.isHost);
  const selectedMovie = useStore(movieStore, (s) => s.selectedMovie);
  const isMuted = useStore(voiceStore, (s) => s.isMuted);
  const peerMutedState = useStore(voiceStore, (s) => s.peerMutedState);

  const [autoJoining, setAutoJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | false>(false);
  const [roomClosed, setRoomClosed] = useState(false);
  const [movieNotification, setMovieNotification] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const joinSentRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMovieIdRef = useRef<string | null>(selectedMovie?.id ?? null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectionState = useStore(roomStore, (s) => s.connectionState);

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

  // Navigate participant to player when host starts playback
  useEffect(() => {
    if (isHost) return;

    const unsubPlay = subscribe(SYNC_MESSAGE_TYPE.PLAY, () => {
      router.push('/player' as any);
    });

    const unsubState = subscribe('room:state', (msg: WsMessage) => {
      const payload = msg.payload as RoomStatePayload;
      if (payload.playback?.isPlaying) {
        router.push('/player' as any);
      }
    });

    return () => {
      unsubPlay();
      unsubState();
    };
  }, [isHost, subscribe, router]);

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

  // Android back button shows confirmation instead of navigating away
  useEffect(() => {
    if (!showCancelConfirm) {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setShowCancelConfirm(true);
        return true;
      });
      return () => sub.remove();
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowCancelConfirm(false);
      return true;
    });
    return () => sub.remove();
  }, [showCancelConfirm]);

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
          onPress={() => setShowCancelConfirm(true)}
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
        <MovieBriefCard onChangeMovie={isHost ? handleBrowseLibrary : undefined} />

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
                isMuted={p.id === participantId ? isMuted : peerMutedState.get(p.id)}
              />
            ))}
          </View>
        </View>

        {movieNotification && (
          <View className="bg-secondary/10 rounded-lg px-4 py-2">
            <Text className="text-on-surface font-body text-sm">{movieNotification}</Text>
          </View>
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
            onPress={() => setShowCancelConfirm(true)}
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

      {showCancelConfirm && (
        <View className="absolute inset-0 z-50">
          <Pressable
            onPress={() => setShowCancelConfirm(false)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            className="absolute inset-0 bg-black/50"
          />
          <View className="absolute bottom-0 left-0 right-0 bg-surface-container-high/80 border-t border-outline-variant/15 rounded-t-2xl px-6 pt-6 pb-10">
            <Text className="text-on-surface font-heading text-lg font-bold">
              {isHost ? 'Cancel this room?' : 'Leave this room?'}
            </Text>
            <Text className="text-on-surface-variant font-body text-sm mt-1">
              {isHost ? 'All participants will be disconnected' : 'You can rejoin with the room code'}
            </Text>
            <Pressable
              onPress={handleLeaveRoom}
              accessibilityRole="button"
              accessibilityLabel="Confirm cancel room"
              className="bg-error/20 rounded-md min-h-[48px] items-center justify-center mt-6"
            >
              <Text className="text-error font-display text-base font-bold">
                {isHost ? 'Cancel Room' : 'Leave Room'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowCancelConfirm(false)}
              accessibilityRole="button"
              accessibilityLabel="Keep room"
              className="min-h-[48px] items-center justify-center mt-2"
            >
              <Text className="text-on-surface-variant font-body text-sm font-medium">
                Stay
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
