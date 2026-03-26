import { useCallback } from 'react';
import type { ParticipantPermissions } from '@jellysync/shared';

export interface PermissionSettingsProps {
  permissions: ParticipantPermissions;
  onUpdatePermissions: (permissions: ParticipantPermissions) => void;
  onClose: () => void;
}

export function PermissionSettings({
  permissions,
  onUpdatePermissions,
  onClose,
}: PermissionSettingsProps) {
  const handleTogglePlayPause = useCallback(() => {
    onUpdatePermissions({
      ...permissions,
      canPlayPause: !permissions.canPlayPause,
    });
  }, [permissions, onUpdatePermissions]);

  const handleToggleSeek = useCallback(() => {
    onUpdatePermissions({
      ...permissions,
      canSeek: !permissions.canSeek,
    });
  }, [permissions, onUpdatePermissions]);

  return (
    <div style={backdropStyle} onClick={onClose} role="dialog" aria-label="Permission settings">
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>Participant Controls</h2>

        <label style={toggleRowStyle}>
          <span style={labelTextStyle}>Allow play/pause</span>
          <button
            type="button"
            onClick={handleTogglePlayPause}
            style={permissions.canPlayPause ? toggleOnStyle : toggleOffStyle}
            role="switch"
            aria-checked={permissions.canPlayPause}
          >
            <span style={permissions.canPlayPause ? thumbOnStyle : thumbOffStyle} />
          </button>
        </label>

        <label style={toggleRowStyle}>
          <span style={labelTextStyle}>Allow seeking</span>
          <button
            type="button"
            onClick={handleToggleSeek}
            style={permissions.canSeek ? toggleOnStyle : toggleOffStyle}
            role="switch"
            aria-checked={permissions.canSeek}
          >
            <span style={permissions.canSeek ? thumbOnStyle : thumbOffStyle} />
          </button>
        </label>
      </div>
    </div>
  );
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 400,
  padding: 24,
  borderRadius: '16px 16px 0 0',
  backgroundColor: 'rgba(54, 50, 59, 0.9)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const titleStyle: React.CSSProperties = {
  color: '#E6E0E9',
  fontSize: 18,
  fontWeight: 700,
  fontFamily: 'Manrope, sans-serif',
  margin: 0,
};

const toggleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
};

const labelTextStyle: React.CSSProperties = {
  color: '#E6E0E9',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'Inter, sans-serif',
};

const toggleBaseStyle: React.CSSProperties = {
  width: 48,
  height: 28,
  borderRadius: 14,
  border: 'none',
  cursor: 'pointer',
  position: 'relative',
  transition: 'background-color 200ms',
  padding: 0,
};

const toggleOnStyle: React.CSSProperties = {
  ...toggleBaseStyle,
  backgroundColor: '#6ee9e0',
};

const toggleOffStyle: React.CSSProperties = {
  ...toggleBaseStyle,
  backgroundColor: '#36323B',
};

const thumbBaseStyle: React.CSSProperties = {
  position: 'absolute',
  top: 3,
  width: 22,
  height: 22,
  borderRadius: '50%',
  transition: 'left 200ms',
};

const thumbOnStyle: React.CSSProperties = {
  ...thumbBaseStyle,
  left: 23,
  backgroundColor: '#0e0e0e',
};

const thumbOffStyle: React.CSSProperties = {
  ...thumbBaseStyle,
  left: 3,
  backgroundColor: '#CAC4D0',
};
