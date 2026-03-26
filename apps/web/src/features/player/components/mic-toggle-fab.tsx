import React, { useState, useEffect } from 'react';

interface MicToggleFABProps {
  isMuted: boolean;
  onToggle: () => void;
}

function MicIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

export function MicToggleFAB({ isMuted, onToggle }: MicToggleFABProps) {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (document.getElementById('mic-muted-pulse-style')) return;
    const style = document.createElement('style');
    style.id = 'mic-muted-pulse-style';
    style.textContent = `
      @keyframes micMutedPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(242, 184, 181, 0.4); }
        50% { box-shadow: 0 0 6px 3px rgba(242, 184, 181, 0.6); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    ...(isMuted ? mutedContainerStyle : liveContainerStyle),
    ...(focused ? focusVisibleStyle : {}),
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!isMuted}
      aria-label={isMuted ? 'Microphone muted' : 'Microphone on'}
      onClick={onToggle}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={containerStyle}
    >
      <span style={isMuted ? mutedDotStyle : liveDotStyle} />
      <span style={iconStyle}>
        {isMuted ? <MicOffIcon /> : <MicIcon />}
      </span>
      {isMuted && <span style={labelStyle}>MIC MUTED</span>}
    </button>
  );
}

const baseContainerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 999,
  backgroundColor: 'rgba(54, 50, 59, 0.4)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  cursor: 'pointer',
  transition: 'opacity 200ms',
  zIndex: 50,
  outline: 'none',
};

const liveContainerStyle: React.CSSProperties = {
  ...baseContainerStyle,
  opacity: 0.4,
  color: '#e6e1e5',
};

const mutedContainerStyle: React.CSSProperties = {
  ...baseContainerStyle,
  opacity: 0.6,
  color: '#e6e1e5',
};

const focusVisibleStyle: React.CSSProperties = {
  outline: '2px solid rgba(110, 233, 224, 0.8)',
  outlineOffset: 2,
};

const liveDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: '#6ee9e0',
  flexShrink: 0,
};

const mutedDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: '#f2b8b5',
  flexShrink: 0,
  animation: 'micMutedPulse 2s ease-in-out infinite',
};

const iconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};
