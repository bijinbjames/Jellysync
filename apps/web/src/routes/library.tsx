import { useNavigate } from 'react-router';
import { GlassHeader } from '../shared/components/glass-header';
import { CategoryChips } from '../features/library/components/category-chips';
import { PosterGrid } from '../features/library/components/poster-grid';
import { useLibrary } from '../features/library/hooks/use-library';

export default function LibraryPage() {
  const navigate = useNavigate();

  const { movies, categories, selectedCategory, setCategory, isLoading, error, serverUrl } =
    useLibrary();

  return (
    <div className="min-h-screen bg-surface">
      <GlassHeader
        variant="navigation"
        title="Library"
        onBack={() => navigate(-1)}
      />
      {error ? (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <p className="text-error font-body text-sm text-center">
            {error.message}
          </p>
        </div>
      ) : (
        <>
          <CategoryChips
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setCategory}
          />
          <PosterGrid
            movies={movies}
            serverUrl={serverUrl}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
