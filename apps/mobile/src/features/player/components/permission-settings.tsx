import { useCallback } from 'react';
import { View, Text, Modal, Pressable, Switch, StyleSheet } from 'react-native';
import type { ParticipantPermissions } from '@jellysync/shared';

export interface PermissionSettingsProps {
  visible: boolean;
  permissions: ParticipantPermissions;
  onUpdatePermissions: (permissions: ParticipantPermissions) => void;
  onClose: () => void;
}

export function PermissionSettings({
  visible,
  permissions,
  onUpdatePermissions,
  onClose,
}: PermissionSettingsProps) {
  const handleTogglePlayPause = useCallback((value: boolean) => {
    onUpdatePermissions({ ...permissions, canPlayPause: value });
  }, [permissions, onUpdatePermissions]);

  const handleToggleSeek = useCallback((value: boolean) => {
    onUpdatePermissions({ ...permissions, canSeek: value });
  }, [permissions, onUpdatePermissions]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Participant Controls</Text>

          <View style={styles.toggleRow}>
            <Text style={styles.labelText}>Allow play/pause</Text>
            <Switch
              value={permissions.canPlayPause}
              onValueChange={handleTogglePlayPause}
              trackColor={{ false: '#36323B', true: '#6ee9e0' }}
              thumbColor={permissions.canPlayPause ? '#0e0e0e' : '#CAC4D0'}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.labelText}>Allow seeking</Text>
            <Switch
              value={permissions.canSeek}
              onValueChange={handleToggleSeek}
              trackColor={{ false: '#36323B', true: '#6ee9e0' }}
              thumbColor={permissions.canSeek ? '#0e0e0e' : '#CAC4D0'}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: 'rgba(54, 50, 59, 0.95)',
    gap: 20,
  },
  title: {
    color: '#E6E0E9',
    fontSize: 18,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelText: {
    color: '#E6E0E9',
    fontSize: 14,
    fontWeight: '500',
  },
});
