type GlassHeaderVariant = 'home' | 'navigation' | 'branded';

interface GlassHeaderProps {
  variant: GlassHeaderVariant;
  title: string;
  subtitle?: string;
}

export function GlassHeader(props: GlassHeaderProps) {
  const { title, subtitle } = props;

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
      </div>
    </header>
  );
}
