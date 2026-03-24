type GlassHeaderVariant = 'home' | 'navigation' | 'branded';

interface GlassHeaderProps {
  variant: GlassHeaderVariant;
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
  onBack?: () => void;
}

function BackIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function GlassHeader(props: GlassHeaderProps) {
  const { variant, title, subtitle, onAction, actionLabel = 'Log out', onBack } = props;

  if (variant === 'navigation') {
    return (
      <header className="glass px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="min-h-[48px] min-w-[48px] flex items-center justify-center cursor-pointer text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <BackIcon />
          </button>
          <span className="text-on-surface-variant font-body text-xs uppercase tracking-widest">
            {title}
          </span>
          <div className="w-12" />
        </div>
      </header>
    );
  }

  return (
    <header className="glass px-6 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div>
          <h1 className="text-on-surface font-display text-2xl font-bold truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-secondary/70 font-body text-sm mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            aria-label={actionLabel}
            className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-colors cursor-pointer"
          >
            <LogoutIcon />
          </button>
        )}
      </div>
    </header>
  );
}
