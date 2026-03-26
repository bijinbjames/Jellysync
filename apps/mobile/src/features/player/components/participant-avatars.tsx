import { View, Text, StyleSheet } from 'react-native';
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

  return (
    <View style={styles.container}>
      {visible.map((p) => {
        const isSteppedAway = steppedAwayParticipantIds.includes(p.id);
        return (
          <View
            key={p.id}
            style={[
              styles.avatar,
              p.id === hostId && styles.hostAvatar,
              isSteppedAway && styles.steppedAway,
            ]}
            accessibilityLabel={`${p.displayName}${p.id === hostId ? ' (host)' : ''}${isSteppedAway ? ' (stepped away)' : ''}`}
          >
            <Text style={styles.avatarText}>{p.displayName.charAt(0).toUpperCase()}</Text>
            {isSteppedAway && (
              <Text style={styles.steppedAwayIndicator}>💤</Text>
            )}
          </View>
        );
      })}
      {overflow > 0 && (
        <View style={styles.avatar}>
          <Text style={styles.overflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2B2930',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatar: {
    borderWidth: 2,
    borderColor: '#6ee9e0',
  },
  avatarText: {
    color: '#E6E0E9',
    fontSize: 13,
    fontWeight: '600',
  },
  steppedAway: {
    opacity: 0.4,
  },
  steppedAwayIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 10,
  },
  overflowText: {
    color: '#CAC4D0',
    fontSize: 11,
    fontWeight: '600',
  },
});
