import { ScrollView, Pressable, Text } from 'react-native';
import type { JellyfinGenre } from '@jellysync/shared';

interface CategoryChipsProps {
  categories: JellyfinGenre[];
  selectedCategory: string | undefined;
  onSelect: (categoryId: string | undefined) => void;
}

export function CategoryChips({
  categories,
  selectedCategory,
  onSelect,
}: CategoryChipsProps) {
  const isAllSelected = selectedCategory === undefined;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="py-3"
      accessibilityRole="radiogroup"
      accessibilityLabel="Filter by category"
    >
      <Pressable
        onPress={() => onSelect(undefined)}
        accessibilityRole="radio"
        accessibilityState={{ checked: isAllSelected }}
        className={`px-4 py-2 rounded-full min-h-[48px] justify-center ${
          isAllSelected ? 'bg-primary/20' : 'bg-surface-container-high'
        }`}
      >
        <Text
          className={`font-body text-sm font-medium ${
            isAllSelected ? 'text-secondary' : 'text-on-surface'
          }`}
        >
          All
        </Text>
      </Pressable>
      {categories.map((cat) => {
        const isActive = selectedCategory === cat.Id;
        return (
          <Pressable
            key={cat.Id}
            onPress={() => onSelect(cat.Id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isActive }}
            className={`px-4 py-2 rounded-full min-h-[48px] justify-center ${
              isActive ? 'bg-primary/20' : 'bg-surface-container-high'
            }`}
          >
            <Text
              className={`font-body text-sm font-medium ${
                isActive ? 'text-secondary' : 'text-on-surface'
              }`}
            >
              {cat.Name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
