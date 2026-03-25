import { ScrollView, Pressable, Text } from 'react-native';
import type { JellyfinGenre } from '@jellysync/shared';
import { RECENTLY_ADDED_CATEGORY } from '@jellysync/shared';

interface CategoryChipsProps {
  categories: JellyfinGenre[];
  selectedCategory: string | undefined;
  onSelect: (categoryId: string | undefined) => void;
}

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
      className={`px-5 py-2.5 rounded-full ${
        isActive
          ? 'bg-primary/20 border border-primary/40'
          : 'bg-surface-container-high border border-transparent'
      }`}
    >
      <Text
        className={`font-body text-sm font-medium ${
          isActive ? 'text-primary' : 'text-on-surface-variant'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CategoryChips({
  categories,
  selectedCategory,
  onSelect,
}: CategoryChipsProps) {
  const isAllSelected = selectedCategory === undefined;
  const isRecentlyAdded = selectedCategory === RECENTLY_ADDED_CATEGORY;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      className="py-4 mb-2"
      accessibilityRole="radiogroup"
      accessibilityLabel="Filter by category"
    >
      <Chip
        label="All"
        isActive={isAllSelected}
        onPress={() => onSelect(undefined)}
      />
      {categories.map((cat) => (
        <Chip
          key={cat.Id}
          label={cat.Name}
          isActive={selectedCategory === cat.Id}
          onPress={() => onSelect(cat.Id)}
        />
      ))}
      <Chip
        label="Recently Added"
        isActive={isRecentlyAdded}
        onPress={() => onSelect(RECENTLY_ADDED_CATEGORY)}
      />
    </ScrollView>
  );
}
