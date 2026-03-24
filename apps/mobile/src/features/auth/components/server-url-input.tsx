import { View, Text, TextInput } from 'react-native';

interface ServerUrlInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
}

export function ServerUrlInput({ value, onChangeText, error }: ServerUrlInputProps) {
  return (
    <View className="w-full mb-4">
      <Text className="text-secondary text-xs font-body uppercase tracking-widest mb-1.5">
        Server URL
      </Text>
      <View className="flex-row items-center bg-surface-container-lowest rounded-md min-h-[48px] px-3">
        <Text className="text-on-surface-variant mr-2 text-base">🔗</Text>
        <TextInput
          className="flex-1 text-on-surface font-body text-base py-3"
          value={value}
          onChangeText={onChangeText}
          placeholder="https://jellyfin.example.com"
          placeholderTextColor="#869391"
          keyboardType="url"
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="url"
        />
      </View>
      {error && (
        <Text className="text-error text-sm font-body mt-1">{error}</Text>
      )}
    </View>
  );
}
