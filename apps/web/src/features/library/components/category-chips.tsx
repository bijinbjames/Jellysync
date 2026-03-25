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
    <div
      role="radiogroup"
      aria-label="Filter by category"
      className="flex gap-2 overflow-x-auto px-6 md:px-12 py-3 scrollbar-none"
    >
      <button
        type="button"
        role="radio"
        aria-checked={isAllSelected}
        onClick={() => onSelect(undefined)}
        className={`shrink-0 px-4 py-2 rounded-full font-body text-sm font-medium transition-colors cursor-pointer border-none min-h-[48px] ${
          isAllSelected
            ? 'bg-primary/20 text-secondary'
            : 'bg-surface-container-high text-on-surface'
        }`}
      >
        All
      </button>
      {categories.map((cat) => {
        const isActive = selectedCategory === cat.Id;
        return (
          <button
            key={cat.Id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onSelect(cat.Id)}
            className={`shrink-0 px-4 py-2 rounded-full font-body text-sm font-medium transition-colors cursor-pointer border-none min-h-[48px] ${
              isActive
                ? 'bg-primary/20 text-secondary'
                : 'bg-surface-container-high text-on-surface'
            }`}
          >
            {cat.Name}
          </button>
        );
      })}
    </div>
  );
}
