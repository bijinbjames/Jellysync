import { useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from 'zustand';
import { buildStreamUrl } from '@jellysync/shared';
import { movieStore } from '../src/lib/movie';
import { roomStore } from '../src/lib/room';
import { authStore } from '../src/lib/auth';
import { VideoPlayerView, useVideoPlayer } from '../src/features/player';

export default function PlayerScreen() {
  const router = useRouter();
  const selectedMovie = useStore(movieStore, (s) => s.selectedMovie);
  const isHost = useStore(roomStore, (s) => s.isHost);
  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const serverUrl = useStore(authStore, (s) => s.serverUrl);
  const token = useStore(authStore, (s) => s.token);
  const prevMovieIdRef = useRef<string | null>(selectedMovie?.id ?? null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const streamUrl = useMemo(() => {
    if (!selectedMovie || !serverUrl || !token) return null;
    return buildStreamUrl(serverUrl, token, selectedMovie.id);
  }, [selectedMovie, serverUrl, token]);

  const { player } = useVideoPlayer(streamUrl);

  useEffect(() => {
    if (!selectedMovie) {
      router.replace('/');
    }
  }, [selectedMovie, router]);

  // Detect movie swap via global room:state handler — navigate back to lobby
  useEffect(() => {
    const currentId = selectedMovie?.id ?? null;
    if (prevMovieIdRef.current && currentId && currentId !== prevMovieIdRef.current) {
      prevMovieIdRef.current = currentId;
      if (roomCode) {
        router.replace(`/room/${roomCode}` as any);
      }
      return;
    }
    prevMovieIdRef.current = currentId;
  }, [selectedMovie, roomCode, router]);

  if (!selectedMovie || !player) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <VideoPlayerView player={player} />
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to lobby"
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            Back to Lobby
          </Text>
        </Pressable>
        {isHost && (
          <Pressable
            onPress={() => router.push('/library?from=player' as any)}
            accessibilityRole="button"
            accessibilityLabel="Change Movie"
            style={styles.changeButton}
          >
            <Text style={styles.changeButtonText}>
              Change Movie
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#CAC4D0',
    fontSize: 14,
    fontWeight: '500',
  },
  changeButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeButtonText: {
    color: '#D0BCFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
