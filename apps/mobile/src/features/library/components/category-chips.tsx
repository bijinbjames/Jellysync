import { ScrollView, View, Pressable, Text } from 'react-native';
import type { JellyfinGenre } from '@jellysync/shared';
import { RECENTLY_ADDED_CATEGORY } from '@jellysync/shared';

interface CategoryChipsProps {
  categories: JellyfinGenre[];
  selectedCategory: string | undefined;
  onSelect: (categoryId: string | undefined) => void;
  isLoading?: boolean;
}

const CHIP_HEIGHT = 36;

function Chip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: isActive }}
      style={{ height: CHIP_HEIGHT, paddingHorizontal: 20 }}
      className={`rounded-full items-center justify-center ${
        isActive
          ? 'bg-primary/20 border border-primary/40'
          : 'bg-surface-container-high border border-transparent'
      }`}
    >
      <Text
        numberOfLines={1}
        className={`font-body text-sm font-medium ${
          isActive ? 'text-primary' : 'text-on-surface-variant'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const SHIMMER_WIDTHS = [72, 88, 64, 80, 96];

export function CategoryChips({
  categories,
  selectedCategory,
  onSelect,
  isLoading,
}: CategoryChipsProps) {
  const isAllSelected = selectedCategory === undefined;
  const isRecentlyAdded = selectedCategory === RECENTLY_ADDED_CATEGORY;

  return (
    <View style={{ height: CHIP_HEIGHT + 20 }} className="mb-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 10,
          alignItems: 'center',
          height: CHIP_HEIGHT + 20,
        }}
        accessibilityRole="radiogroup"
        accessibilityLabel="Filter by category"
      >
        <Chip
          label="Recently Added"
          isActive={isRecentlyAdded}
          onPress={() => onSelect(RECENTLY_ADDED_CATEGORY)}
        />
        <Chip
          label="All"
          isActive={isAllSelected}
          onPress={() => onSelect(undefined)}
        />
        {isLoading && categories.length === 0
          ? SHIMMER_WIDTHS.map((w, i) => (
              <View
                key={`shimmer-${i}`}
                className="rounded-full bg-surface-container-high/60"
                style={{ width: w, height: CHIP_HEIGHT }}
              />
            ))
          : categories.map((cat) => (
              <Chip
                key={cat.Id}
                label={cat.Name}
                isActive={selectedCategory === cat.Id}
                onPress={() => onSelect(cat.Id)}
              />
            ))}
      </ScrollView>
    </View>
  );
}
