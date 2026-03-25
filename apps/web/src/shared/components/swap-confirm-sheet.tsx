import { useEffect, useRef } from 'react';

interface SwapConfirmSheetProps {
  movieName: string;
  onConfirm: () => void;
  onCancel: () => void;
  visible: boolean;
}

export function SwapConfirmSheet({ movieName, onConfirm, onCancel, visible }: SwapConfirmSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus trap: move focus into the sheet on open, restore on close
  useEffect(() => {
    if (!visible) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    // Focus the first button in the sheet
    const firstButton = sheetRef.current?.querySelector('button');
    firstButton?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [visible]);

  if (!visible) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }

    // Trap Tab focus within the sheet
    if (e.key === 'Tab' && sheetRef.current) {
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Change to "${movieName}"?`}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div ref={sheetRef} className="relative w-full max-w-lg rounded-t-2xl border-t border-outline-variant/15 p-6 pb-safe backdrop-blur-xl bg-surface-container-high/80">
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-surface-container-high" />

        <h2 className="text-on-surface font-heading text-lg font-bold text-center mb-6">
          Change to &ldquo;{movieName}&rdquo;?
        </h2>

        <button
          type="button"
          onClick={onConfirm}
          aria-label="Change Movie"
          className="gradient-primary rounded-md min-h-[48px] w-full font-display text-base font-bold text-on-primary cursor-pointer"
        >
          Change Movie
        </button>

        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="min-h-[48px] w-full mt-2 text-primary font-body text-sm font-medium cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
