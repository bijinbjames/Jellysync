import { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from 'zustand';
import { authStore } from '../src/lib/auth';
import { roomStore } from '../src/lib/room';
import { GlassHeader } from '../src/shared/components/glass-header';
import { CodeInput } from '../src/shared/components/code-input';
import { useWs } from '../src/shared/providers/websocket-provider';
import {
  createWsMessage,
  ROOM_MESSAGE_TYPE,
  type RoomStatePayload,
} from '@jellysync/shared';

const JOIN_TIMEOUT_MS = 10_000;

export default function JoinScreen() {
  const router = useRouter();
  const username = useStore(authStore, (s) => s.username);
  const { send, subscribe } = useWs();

  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [joining, setJoining] = useState(false);
  const joiningCodeRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = subscribe(ROOM_MESSAGE_TYPE.STATE, (msg) => {
      const payload = msg.payload as RoomStatePayload;
      if (!joiningCodeRef.current || payload.roomCode !== joiningCodeRef.current) return;
      joiningCodeRef.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setJoining(false);
      router.push(`/room/${payload.roomCode}`);
    });

    const unsubErr = subscribe('error', (msg) => {
      const errPayload = msg.payload as { code: string; message: string; context?: string };
      if (errPayload.context === 'room:join') {
        joiningCodeRef.current = null;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setError(true);
        setErrorMessage(errPayload.message || "This code doesn't match an active room \u2014 check with your host");
        setJoining(false);
      }
    });

    return () => {
      unsub();
      unsubErr();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [subscribe, router]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (error) {
      setError(false);
      setErrorMessage('');
    }
  };

  const handleJoin = () => {
    if (code.length !== 6 || joining) return;
    setJoining(true);
    setError(false);
    setErrorMessage('');
    joiningCodeRef.current = code;
    send(createWsMessage(ROOM_MESSAGE_TYPE.JOIN, { roomCode: code, displayName: username ?? 'User' }));
    timeoutRef.current = setTimeout(() => {
      joiningCodeRef.current = null;
      setJoining(false);
      setError(true);
      setErrorMessage('Connection timed out \u2014 please try again');
    }, JOIN_TIMEOUT_MS);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const canJoin = code.length === 6 && !joining;

  return (
    <View className="flex-1 bg-surface">
      <GlassHeader variant="navigation" title="Join Room" onBack={handleBack} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-12 pt-4 gap-8 items-center"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-2 pt-8">
          <Text className="text-on-surface text-5xl">👥</Text>
          <Text className="text-on-surface font-display text-xl font-bold text-center mt-2">
            Join a Watch Party
          </Text>
          <Text className="text-on-surface-variant font-body text-sm text-center">
            Enter the 6-character code from your host
          </Text>
        </View>

        <View className="w-full gap-3">
          <CodeInput value={code} onChange={handleCodeChange} error={error} />
          {error && errorMessage ? (
            <Text className="text-error text-sm text-center font-body">
              {errorMessage}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={handleJoin}
          disabled={!canJoin}
          accessibilityRole="button"
          accessibilityLabel="Join Room"
          className={`w-full min-h-[48px] rounded-md items-center justify-center ${
            canJoin ? 'gradient-primary' : 'bg-surface-container-highest'
          }`}
        >
          <Text
            className={`font-display text-base font-bold ${
              canJoin ? 'text-on-primary' : 'text-on-surface-variant'
            }`}
          >
            {joining ? 'Joining...' : 'Join Room'}
          </Text>
        </Pressable>

        <View className="w-full flex-row items-center gap-3">
          <View className="flex-1 h-px bg-outline/20" />
          <Text className="text-on-surface-variant text-sm font-body">or</Text>
          <View className="flex-1 h-px bg-outline/20" />
        </View>

        <Text className="text-primary font-body text-sm text-center">
          Ask your host for a direct link
        </Text>
      </ScrollView>
    </View>
  );
}
