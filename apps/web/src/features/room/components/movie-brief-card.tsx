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
      <div
        className="flex bg-surface-container-low rounded-2xl p-4"
        {...(!onChangeMovie && { 'aria-label': 'No movie selected' })}
      >
        <div className="w-16 h-24 rounded-lg border border-dashed border-outline-variant/30 flex items-center justify-center shrink-0">
          <span className="text-outline-variant text-2xl">{'\uD83C\uDFAC'}</span>
        </div>
        <div className="flex-1 ml-4 flex flex-col justify-center">
          <span className="text-on-surface font-body text-sm font-medium">
            No movie selected
          </span>
          <span className="text-outline font-body text-xs mt-1">
            {onChangeMovie ? 'Click to browse the library' : 'Browse the library to pick a movie'}
          </span>
        </div>
      </div>
    );

    if (onChangeMovie) {
      return (
        <button
          type="button"
          onClick={onChangeMovie}
          aria-label="Browse Library"
          className="w-full text-left cursor-pointer"
        >
          {content}
        </button>
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
    <div
      className="flex bg-surface-container-low rounded-2xl p-4"
      aria-label={`Selected movie: ${selectedMovie.name}`}
    >
      <div className="w-16 h-24 rounded-md border border-outline-variant/30 overflow-hidden shrink-0">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
            <span className="text-on-surface-variant text-2xl">{'\uD83C\uDFAC'}</span>
          </div>
        )}
      </div>
      <div className="flex-1 ml-4 flex flex-col justify-center">
        <span className="text-on-surface font-display text-xl font-bold">
          {selectedMovie.name}
        </span>
        {metaLine && (
          <span className="text-on-surface-variant font-body text-sm mt-1">
            {metaLine}
          </span>
        )}
      </div>
      {onChangeMovie && (
        <button
          type="button"
          onClick={onChangeMovie}
          aria-label="Change Movie"
          className="min-h-[48px] min-w-[48px] flex items-center justify-center ml-2 shrink-0 text-on-surface-variant font-body text-xs font-medium cursor-pointer hover:text-on-surface transition-colors"
        >
          Change
        </button>
      )}
    </div>
  );
}
