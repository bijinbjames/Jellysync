import { useRef, useState } from 'react';
import { View, Text, Pressable, Image, Animated } from 'react-native';
import { getImageUrl } from '@jellysync/shared';
import type { JellyfinLibraryItem } from '@jellysync/shared';

interface PosterCardProps {
  item: JellyfinLibraryItem;
  serverUrl: string;
  onPress?: (item: JellyfinLibraryItem) => void;
}

export function PosterCard({ item, serverUrl, onPress }: PosterCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const hasPoster = !!item.ImageTags?.Primary;
  const posterUrl = hasPoster
    ? getImageUrl(serverUrl, item.Id, item.ImageTags!.Primary, {
        fillWidth: 300,
        quality: 90,
      })
    : undefined;
  const [imgFailed, setImgFailed] = useState(false);
  const year = item.ProductionYear;
  const label = `${item.Name}${year ? `, ${year}` : ''}`;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View className="relative aspect-[2/3] w-full overflow-hidden rounded-lg">
          {posterUrl && !imgFailed ? (
            <Image
              source={{ uri: posterUrl }}
              className="w-full h-full"
              resizeMode="cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <View className="w-full h-full bg-surface-container-high items-center justify-center">
              <Text className="text-on-surface-variant text-3xl">🎬</Text>
            </View>
          )}
          {/* Rim lighting: 1px top border at 5% white opacity (inset glow) */}
          <View
            className="absolute inset-0 rounded-lg"
            style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}
          />
        </View>
        <Text
          className="mt-2 text-on-surface font-display font-bold text-sm"
          numberOfLines={1}
        >
          {item.Name}
        </Text>
        {year && (
          <Text className="text-on-surface-variant font-body text-[10px] uppercase tracking-wider">
            {year}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}
