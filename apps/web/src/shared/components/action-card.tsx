import { type ReactNode, type KeyboardEvent } from 'react';

type ActionCardVariant = 'primary' | 'secondary';

interface ActionCardProps {
  variant: ActionCardVariant;
  headline: string;
  description: string;
  icon: string;
  onPress: () => void;
  children?: ReactNode;
}

export function ActionCard({
  variant,
  headline,
  description,
  icon,
  onPress,
  children,
}: ActionCardProps) {
  const isPrimary = variant === 'primary';
  const hasInteractiveChildren = !!children;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPress();
    }
  };

  const sharedClassName = `w-full h-64 rounded-lg p-6 flex flex-col justify-between text-left cursor-pointer transition-transform duration-150 active:scale-95 hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
    isPrimary
      ? 'gradient-primary shadow-[0_20px_40px_rgba(110,233,224,0.15)]'
      : 'bg-surface-container-high border border-outline-variant/15'
  }`;

  const content = (
    <>
      <div>
        <span className="text-3xl block mb-2">{icon}</span>
        <span
          className={`font-display text-xl font-bold block ${
            isPrimary ? 'text-surface-container-lowest' : 'text-on-surface'
          }`}
        >
          {headline}
        </span>
        <span
          className={`font-body text-sm mt-1 block ${
            isPrimary ? 'text-surface-container-lowest/80' : 'text-on-surface-variant'
          }`}
        >
          {description}
        </span>
      </div>
      {children && <div>{children}</div>}
    </>
  );

  if (hasInteractiveChildren) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onPress}
        onKeyDown={handleKeyDown}
        aria-label={`${headline}. ${description}`}
        className={sharedClassName}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={`${headline}. ${description}`}
      className={sharedClassName}
    >
      {content}
    </button>
  );
}
