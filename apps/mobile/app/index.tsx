import { Alert, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from 'zustand';
import { authStore } from '../src/lib/auth';
import { GlassHeader } from '../src/shared/components/glass-header';
import { ActionCard } from '../src/shared/components/action-card';
import { CodeInput } from '../src/shared/components/code-input';

export default function HomeScreen() {
  const username = useStore(authStore, (s) => s.username);
  const serverUrl = useStore(authStore, (s) => s.serverUrl);
  const router = useRouter();

  const handleCreateRoom = () => {
    router.push('/create-room');
  };

  const handleJoinRoom = (code: string) => {
    Alert.alert(
      'Join Room',
      `Room joining is coming in Epic 2. Code entered: ${code}`,
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <GlassHeader
        variant="home"
        title={`Hey, ${username ?? 'User'}`}
        subtitle={serverUrl ?? 'Not connected'}
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
            description="Start a new watch session and invite your friends"
            icon="🎬"
            onPress={handleCreateRoom}
          />

          <ActionCard
            variant="secondary"
            headline="Join Room"
            description="Enter a room code to join an existing session"
            icon="🎟️"
            onPress={() => {}}
          >
            <CodeInput onSubmit={handleJoinRoom} />
          </ActionCard>
        </View>
      </ScrollView>
    </View>
  );
}
