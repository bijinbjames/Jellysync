import type { JellyfinLibraryItem } from '@jellysync/shared';
import { PosterCard } from './poster-card';
import { PosterShimmer } from './poster-shimmer';

interface PosterGridProps {
  movies: JellyfinLibraryItem[];
  serverUrl: string;
  isLoading: boolean;
  onMoviePress?: (item: JellyfinLibraryItem) => void;
}

export function PosterGrid({
  movies,
  serverUrl,
  isLoading,
  onMoviePress,
}: PosterGridProps) {
  if (isLoading) {
    return (
      <div
        role="list"
        aria-label="Loading movies"
        className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 px-6 md:px-12"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} role="listitem">
            <PosterShimmer />
          </div>
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <span className="text-4xl mb-4">🎬</span>
        <p className="text-on-surface-variant font-body text-sm">
          No movies found — check your Jellyfin library
        </p>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Movie library"
      className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 px-6 md:px-12"
    >
      {movies.map((item) => (
        <div key={item.Id} role="listitem">
          <PosterCard
            item={item}
            serverUrl={serverUrl}
            onPress={onMoviePress}
          />
        </div>
      ))}
    </div>
  );
}
