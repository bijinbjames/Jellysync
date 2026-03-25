import { useState } from 'react';
import { getImageUrl } from '@jellysync/shared';
import type { JellyfinLibraryItem } from '@jellysync/shared';

interface PosterCardProps {
  item: JellyfinLibraryItem;
  serverUrl: string;
  onPress?: (item: JellyfinLibraryItem) => void;
}

export function PosterCard({ item, serverUrl, onPress }: PosterCardProps) {
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

  return (
    <button
      type="button"
      onClick={() => onPress?.(item)}
      aria-label={label}
      className="group flex flex-col text-left cursor-pointer bg-transparent border-none p-0 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-transform duration-200 hover:scale-[1.02]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg">
        {posterUrl && !imgFailed ? (
          <img
            src={posterUrl}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
            <span className="text-on-surface-variant text-3xl">🎬</span>
          </div>
        )}
        <div className="absolute inset-0 rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]" />
      </div>
      <p className="mt-2 text-on-surface font-display font-bold text-sm truncate group-hover:text-primary transition-colors duration-200">
        {item.Name}
      </p>
      {year && (
        <p className="text-on-surface-variant font-body text-[0.625rem] uppercase tracking-wider">
          {year}
        </p>
      )}
    </button>
  );
}
