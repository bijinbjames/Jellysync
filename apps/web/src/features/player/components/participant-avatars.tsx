import type { Participant } from '@jellysync/shared';

export interface ParticipantAvatarsProps {
  participants: Participant[];
  hostId: string;
  maxVisible?: number;
}

export function ParticipantAvatars({ participants, hostId, maxVisible = 4 }: ParticipantAvatarsProps) {
  const visible = participants.slice(0, maxVisible);
  const overflow = participants.length - maxVisible;

  return (
    <div style={containerStyle}>
      {visible.map((p) => (
        <div
          key={p.id}
          style={p.id === hostId ? hostAvatarStyle : avatarStyle}
          title={p.displayName}
          aria-label={`${p.displayName}${p.id === hostId ? ' (host)' : ''}`}
        >
          {p.displayName.charAt(0).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div style={overflowStyle}>+{overflow}</div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const avatarStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  backgroundColor: '#2B2930',
  color: '#E6E0E9',
  fontSize: 13,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Inter, sans-serif',
};

const hostAvatarStyle: React.CSSProperties = {
  ...avatarStyle,
  border: '2px solid #6ee9e0',
};

const overflowStyle: React.CSSProperties = {
  ...avatarStyle,
  fontSize: 11,
  color: '#CAC4D0',
};
