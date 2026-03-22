interface ServerUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export function ServerUrlInput({ value, onChange, error }: ServerUrlInputProps) {
  return (
    <div className="w-full mb-4">
      <label className="text-secondary text-xs font-body uppercase tracking-widest mb-1.5 block">
        Server URL
      </label>
      <div className="flex items-center bg-surface-container-lowest rounded-md min-h-[48px] px-3 focus-within:ring-2 focus-within:ring-primary">
        <span className="text-on-surface-variant mr-2 text-base">🔗</span>
        <input
          type="text"
          inputMode="url"
          className="flex-1 bg-transparent text-on-surface font-body text-base py-3 outline-none placeholder:text-outline"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="jellyfin.example.com"
          autoCorrect="off"
          autoCapitalize="none"
          autoComplete="url"
        />
      </div>
      {error && (
        <p className="text-error text-sm font-body mt-1">{error}</p>
      )}
    </div>
  );
}
