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
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      onClick={onClick}
      className={`shrink-0 px-5 py-2.5 rounded-full font-body text-sm font-medium transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-primary/20 text-primary border border-primary/40'
          : 'bg-surface-container-high text-on-surface-variant border border-transparent hover:bg-surface-container-high/80 hover:text-on-surface'
      }`}
    >
      {label}
    </button>
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
    <div
      role="radiogroup"
      aria-label="Filter by category"
      className="flex gap-2.5 overflow-x-auto px-6 md:px-12 py-4 mb-2 scrollbar-none"
    >
      <Chip
        label="All"
        isActive={isAllSelected}
        onClick={() => onSelect(undefined)}
      />
      {categories.map((cat) => (
        <Chip
          key={cat.Id}
          label={cat.Name}
          isActive={selectedCategory === cat.Id}
          onClick={() => onSelect(cat.Id)}
        />
      ))}
      <Chip
        label="Recently Added"
        isActive={isRecentlyAdded}
        onClick={() => onSelect(RECENTLY_ADDED_CATEGORY)}
      />
    </div>
  );
}
