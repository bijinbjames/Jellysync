export function MovieBriefCard() {
  return (
    <div
      className="flex bg-surface-container-low rounded-2xl p-4"
      aria-label="No movie selected"
    >
      <div className="w-16 h-24 rounded-lg border border-dashed border-outline-variant/30 flex items-center justify-center shrink-0">
        <span className="text-outline-variant text-2xl">{'\uD83C\uDFAC'}</span>
      </div>
      <div className="flex-1 ml-4 flex flex-col justify-center">
        <span className="text-on-surface font-body text-sm font-medium">
          No movie selected
        </span>
        <span className="text-outline font-body text-xs mt-1">
          Browse Library (coming in Epic 3)
        </span>
      </div>
    </div>
  );
}
