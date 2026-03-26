import { View, Text, Image, Pressable } from 'react-native';
import { useStore } from 'zustand';
import { getImageUrl, formatRuntime } from '@jellysync/shared';
import { movieStore } from '../../../lib/movie';
import { authStore } from '../../../lib/auth';

interface MovieBriefCardProps {
  onChangeMovie?: () => void;
}

export function MovieBriefCard({ onChangeMovie }: MovieBriefCardProps) {
  const selectedMovie = useStore(movieStore, (s) => s.selectedMovie);
  const serverUrl = useStore(authStore, (s) => s.serverUrl);

  if (!selectedMovie) {
    const content = (
      <View
        className="flex-row bg-surface-container-low rounded-2xl p-4"
        {...(!onChangeMovie && { accessibilityLabel: 'No movie selected' })}
      >
        <View className="w-16 h-24 rounded-lg border border-dashed border-outline-variant/30 items-center justify-center">
          <Text className="text-outline-variant text-2xl">{'\uD83C\uDFAC'}</Text>
        </View>
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-on-surface font-body text-sm font-medium">
            No movie selected
          </Text>
          <Text className="text-outline font-body text-xs mt-1">
            {onChangeMovie ? 'Tap to browse the library' : 'Browse the library to pick a movie'}
          </Text>
        </View>
      </View>
    );

    if (onChangeMovie) {
      return (
        <Pressable onPress={onChangeMovie} accessibilityRole="button" accessibilityLabel="Browse Library">
          {content}
        </Pressable>
      );
    }

    return content;
  }

  const posterUrl = selectedMovie.imageTag && serverUrl
    ? getImageUrl(serverUrl, selectedMovie.id, selectedMovie.imageTag, { fillWidth: 128, quality: 90 })
    : undefined;

  const metaParts: string[] = [];
  if (selectedMovie.year) metaParts.push(String(selectedMovie.year));
  if (selectedMovie.runtimeTicks) metaParts.push(formatRuntime(selectedMovie.runtimeTicks));
  const metaLine = metaParts.join(' \u00B7 ');

  return (
    <View
      className="flex-row bg-surface-container-low rounded-2xl p-4"
      accessibilityLabel={`Selected movie: ${selectedMovie.name}`}
    >
      <View className="w-16 h-24 rounded-md border border-outline-variant/30 overflow-hidden">
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            className="w-full h-full"
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className="w-full h-full bg-surface-container-high items-center justify-center">
            <Text className="text-on-surface-variant text-2xl">{'\uD83C\uDFAC'}</Text>
          </View>
        )}
      </View>
      <View className="flex-1 ml-4 justify-center">
        <Text className="text-on-surface font-display text-xl font-bold">
          {selectedMovie.name}
        </Text>
        {metaLine ? (
          <Text className="text-on-surface-variant font-body text-sm mt-1">
            {metaLine}
          </Text>
        ) : null}
      </View>
      {onChangeMovie && (
        <Pressable
          onPress={onChangeMovie}
          accessibilityRole="button"
          accessibilityLabel="Change Movie"
          className="min-h-[48px] min-w-[48px] items-center justify-center ml-2"
        >
          <Text className="text-on-surface-variant font-body text-xs font-medium">
            Change
          </Text>
        </Pressable>
      )}
    </View>
  );
}
