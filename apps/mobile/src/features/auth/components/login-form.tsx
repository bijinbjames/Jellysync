import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useStore } from 'zustand';
import { authStore } from '../../../lib/auth';
import { ServerUrlInput } from './server-url-input';

export function LoginForm() {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const isLoading = useStore(authStore, (s) => s.isLoading);
  const error = useStore(authStore, (s) => s.error);
  const errorField = useStore(authStore, (s) => s.errorField);
  const login = useStore(authStore, (s) => s.login);
  const clearError = useStore(authStore, (s) => s.clearError);

  const handleConnect = async () => {
    if (!serverUrl.trim() || !username.trim() || !password.trim()) return;
    clearError();
    try {
      await login(serverUrl.trim(), username.trim(), password);
    } catch {
      // Error is handled in the store
    }
  };

  const serverError = errorField === 'server' ? error : null;
  const credentialsError = errorField === 'credentials' ? error : null;

  return (
    <View className="w-full max-w-sm">
      <View className="glass rounded-lg p-6">
        <Text className="text-on-surface font-display text-2xl font-bold mb-1">
          Connect Server
        </Text>
        <Text className="text-on-surface-variant font-body text-sm mb-6">
          Enter your Jellyfin details to start syncing.
        </Text>

        <ServerUrlInput
          value={serverUrl}
          onChangeText={(text) => {
            setServerUrl(text);
            if (error) clearError();
          }}
          error={serverError}
        />

        <View className="w-full mb-4">
          <Text className="text-secondary text-xs font-body uppercase tracking-widest mb-1.5">
            Username
          </Text>
          <View className="flex-row items-center bg-surface-container-lowest rounded-md min-h-[48px] px-3">
            <Text className="text-on-surface-variant mr-2 text-base">👤</Text>
            <TextInput
              className="flex-1 text-on-surface font-body text-base py-3"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (error) clearError();
              }}
              placeholder="Your username"
              placeholderTextColor="#869391"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
            />
          </View>
        </View>

        <View className="w-full mb-6">
          <Text className="text-secondary text-xs font-body uppercase tracking-widest mb-1.5">
            Password
          </Text>
          <View className="flex-row items-center bg-surface-container-lowest rounded-md min-h-[48px] px-3">
            <Text className="text-on-surface-variant mr-2 text-base">🔒</Text>
            <TextInput
              className="flex-1 text-on-surface font-body text-base py-3"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) clearError();
              }}
              placeholder="Password"
              placeholderTextColor="#869391"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
            />
          </View>
          {credentialsError && (
            <Text className="text-error text-sm font-body mt-1">{credentialsError}</Text>
          )}
        </View>

        <Pressable
          className="bg-primary rounded-md min-h-[48px] items-center justify-center flex-row"
          onPress={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#131313" />
          ) : (
            <Text className="text-surface font-display text-base font-bold">
              Connect  →
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
