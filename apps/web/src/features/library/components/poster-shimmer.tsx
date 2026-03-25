export function PosterShimmer() {
  return (
    <div className="flex flex-col">
      <div className="aspect-[2/3] w-full rounded-lg bg-surface-container-high animate-pulse" />
      <div className="mt-2 h-4 w-3/4 rounded bg-surface-container-high animate-pulse" />
      <div className="mt-1 h-3 w-1/3 rounded bg-surface-container-high animate-pulse" />
    </div>
  );
}
