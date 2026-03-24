import { useShareRoom } from '../hooks/use-share-room';

interface RoomCodeDisplayProps {
  code: string;
}

function formatCode(code: string): string {
  if (code.length <= 3) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

export function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const { shareRoom, copyCode, copied } = useShareRoom(code);
  const accessibleCode = code.split('').join(' ');

  return (
    <div className="p-6 rounded-2xl bg-surface-container-high/40 backdrop-blur-xl border border-outline-variant/15">
      <div className="flex justify-center">
        <div className="relative">
          <span
            className="font-mono text-6xl md:text-7xl text-primary tracking-[0.2em]"
            aria-label={`Room code: ${accessibleCode}`}
          >
            {formatCode(code)}
          </span>
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(110,233,224,0.6)]" />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={shareRoom}
          aria-label="Share room link"
          className="gradient-primary rounded-xl min-h-[48px] flex items-center justify-center cursor-pointer font-display text-sm font-bold text-surface-container-lowest hover:opacity-90 transition-opacity"
        >
          Share Link
        </button>

        <button
          type="button"
          onClick={copyCode}
          aria-label={copied ? 'Code copied' : 'Copy room code'}
          className="text-primary font-body text-sm text-center py-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {copied ? '\u2713 Copied!' : 'Copy Code'}
        </button>
      </div>
    </div>
  );
}
