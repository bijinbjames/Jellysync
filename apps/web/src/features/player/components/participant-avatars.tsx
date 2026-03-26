import type { Participant } from '@jellysync/shared';

export interface ParticipantAvatarsProps {
  participants: Participant[];
  hostId: string;
  maxVisible?: number;
  steppedAwayParticipantIds?: string[];
}

export function ParticipantAvatars({ participants, hostId, maxVisible = 4, steppedAwayParticipantIds = [] }: ParticipantAvatarsProps) {
  const visible = participants.slice(0, maxVisible);
  const overflow = participants.length - maxVisible;

  function getAvatarStyle(p: Participant): React.CSSProperties {
    const isSteppedAway = steppedAwayParticipantIds.includes(p.id);
    const baseStyle = p.id === hostId ? hostAvatarStyle : avatarStyle;
    if (isSteppedAway) {
      return { ...baseStyle, opacity: 0.4 };
    }
    return baseStyle;
  }

  return (
    <div style={containerStyle}>
      {visible.map((p) => (
        <div
          key={p.id}
          style={getAvatarStyle(p)}
          title={`${p.displayName}${steppedAwayParticipantIds.includes(p.id) ? ' (stepped away)' : ''}`}
          aria-label={`${p.displayName}${p.id === hostId ? ' (host)' : ''}${steppedAwayParticipantIds.includes(p.id) ? ' (stepped away)' : ''}`}
        >
          <span>{p.displayName.charAt(0).toUpperCase()}</span>
          {steppedAwayParticipantIds.includes(p.id) && (
            <span style={steppedAwayIndicatorStyle}>💤</span>
          )}
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
  position: 'relative',
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

const steppedAwayIndicatorStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: -2,
  right: -2,
  fontSize: 10,
  lineHeight: 1,
};

const overflowStyle: React.CSSProperties = {
  ...avatarStyle,
  fontSize: 11,
  color: '#CAC4D0',
};
