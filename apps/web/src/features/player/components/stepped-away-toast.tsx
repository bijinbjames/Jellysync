import { useEffect, useState, useRef } from 'react';
import { useStore } from 'zustand';
import { syncStore } from '../../../lib/sync.js';
import { roomStore } from '../../../lib/room.js';

interface ToastMessage {
  id: string;
  text: string;
}

const TOAST_DURATION_MS = 3000;

export function SteppedAwayToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevIdsRef = useRef<string[]>([]);

  const steppedAwayIds = useStore(syncStore, (s) => s.steppedAwayParticipantIds);
  const participants = useStore(roomStore, (s) => s.participants);

  useEffect(() => {
    const prevIds = prevIdsRef.current;
    const currentIds = steppedAwayIds;

    // Find newly added IDs
    const added = currentIds.filter((id) => !prevIds.includes(id));
    // Find removed IDs
    const removed = prevIds.filter((id) => !currentIds.includes(id));

    prevIdsRef.current = currentIds;

    let message: string | null = null;

    if (added.length > 0) {
      const name = participants.find((p) => p.id === added[added.length - 1])?.displayName ?? 'Someone';
      message = `${name} stepped away`;
    } else if (removed.length > 0) {
      const name = participants.find((p) => p.id === removed[removed.length - 1])?.displayName ?? 'Someone';
      message = `${name} is back`;
    }

    if (message) {
      if (timerRef.current) clearTimeout(timerRef.current);
      const toastId = `${Date.now()}`;
      setToast({ id: toastId, text: message });
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setToast(null);
      }, TOAST_DURATION_MS);
    }
  }, [steppedAwayIds, participants]);

  // Cleanup timer only on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  if (!toast) return null;

  return (
    <div style={toastContainerStyle}>
      <div style={toastPillStyle} key={toast.id}>
        {toast.text}
      </div>
    </div>
  );
}

const toastContainerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 120,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  zIndex: 20,
  pointerEvents: 'none',
};

const toastPillStyle: React.CSSProperties = {
  backgroundColor: 'rgba(54, 50, 59, 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  color: '#E6E0E9',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'Inter, sans-serif',
  padding: '8px 20px',
  borderRadius: 20,
};
