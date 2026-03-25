import type { JellyfinGenre } from '@jellysync/shared';
import { RECENTLY_ADDED_CATEGORY } from '@jellysync/shared';

interface CategoryChipsProps {
  categories: JellyfinGenre[];
  selectedCategory: string | undefined;
  onSelect: (categoryId: string | undefined) => void;
  isLoading?: boolean;
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
    <div
      role="radiogroup"
      aria-label="Filter by category"
      className="flex gap-2.5 overflow-x-auto px-6 md:px-12 py-4 mb-2 scrollbar-none"
    >
      <Chip
        label="Recently Added"
        isActive={isRecentlyAdded}
        onClick={() => onSelect(RECENTLY_ADDED_CATEGORY)}
      />
      <Chip
        label="All"
        isActive={isAllSelected}
        onClick={() => onSelect(undefined)}
      />
      {isLoading && categories.length === 0
        ? SHIMMER_WIDTHS.map((w, i) => (
            <div
              key={i}
              className="shrink-0 h-[40px] rounded-full bg-surface-container-high animate-pulse"
              style={{ width: w }}
            />
          ))
        : categories.map((cat) => (
            <Chip
              key={cat.Id}
              label={cat.Name}
              isActive={selectedCategory === cat.Id}
              onClick={() => onSelect(cat.Id)}
            />
          ))}
    </div>
  );
}
