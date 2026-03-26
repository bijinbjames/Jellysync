type ParticipantChipVariant = 'host' | 'participant' | 'empty';

interface FilledProps {
  variant: 'host' | 'participant';
  displayName: string;
  isMuted?: boolean;
}

interface EmptyProps {
  variant: 'empty';
  displayName?: never;
}

type ParticipantChipProps = FilledProps | EmptyProps;

function MicIcon({ className }: { className: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function MicOffIcon({ className }: { className: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-surface-container-highest border-2 border-surface flex items-center justify-center shrink-0">
      <span className="text-on-surface font-display text-sm font-bold">
        {initial}
      </span>
    </div>
  );
}

export function ParticipantChip(props: ParticipantChipProps) {
  if (props.variant === 'empty') {
    return (
      <div
        className="flex items-center p-3 rounded-xl border border-dashed border-outline-variant/30 opacity-60"
        aria-label="Slot available"
      >
        <div className="w-10 h-10 rounded-full border border-dashed border-outline-variant/30 flex items-center justify-center shrink-0">
          <span className="text-outline-variant text-lg">+</span>
        </div>
        <span className="ml-3 text-outline-variant font-body text-sm">
          Slot available
        </span>
      </div>
    );
  }

  const { variant, displayName, isMuted } = props;
  const isHost = variant === 'host';
  const micColor = isMuted ? 'text-error' : isHost ? 'text-primary' : 'text-on-surface';

  return (
    <div
      className="flex items-center p-3 rounded-xl bg-surface-container"
      aria-label={`${displayName}${isHost ? ', Host' : ''}${isMuted ? ', muted' : ''}`}
    >
      <Avatar name={displayName} />
      <div className="flex-1 ml-3">
        <span className="text-on-surface font-body text-sm font-medium">
          {displayName}
          {isHost && (
            <span className="text-primary"> (Host)</span>
          )}
        </span>
      </div>
      {isMuted ? <MicOffIcon className={micColor} /> : <MicIcon className={micColor} />}
    </div>
  );
}
