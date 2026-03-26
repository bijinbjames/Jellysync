import { useEffect, useRef } from 'react';
import {
  PARTICIPANT_MESSAGE_TYPE,
  createWsMessage,
  type SteppedAwayPayload,
  type ReturnedPayload,
} from '@jellysync/shared';
import { useWs } from '../../../shared/providers/websocket-provider.js';
import { roomStore } from '../../../lib/room.js';

const STEPPED_AWAY_DEBOUNCE_MS = 5000;

export function useSteppedAway() {
  const { send } = useWs();
  const sendRef = useRef(send);
  sendRef.current = send;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSteppedAwayRef = useRef(false);

  useEffect(() => {
    function getParticipantInfo(): { participantId: string; participantName: string } {
      const state = roomStore.getState();
      const participant = state.participants.find((p) => p.id === state.participantId);
      return {
        participantId: state.participantId ?? '',
        participantName: participant?.displayName ?? '',
      };
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        // Start debounce timer — only send stepped-away after 5 seconds
        if (timerRef.current) return;
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (!document.hidden) return; // User came back during debounce
          isSteppedAwayRef.current = true;
          const info = getParticipantInfo();
          sendRef.current(createWsMessage(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY, {
            participantId: info.participantId,
            participantName: info.participantName,
          } satisfies SteppedAwayPayload));
        }, STEPPED_AWAY_DEBOUNCE_MS);
      } else {
        // Page became visible — cancel pending timer or send returned
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
          return;
        }
        if (isSteppedAwayRef.current) {
          isSteppedAwayRef.current = false;
          const info = getParticipantInfo();
          sendRef.current(createWsMessage(PARTICIPANT_MESSAGE_TYPE.RETURNED, {
            participantId: info.participantId,
            participantName: info.participantName,
          } satisfies ReturnedPayload));
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Send RETURNED if we're still stepped away when unmounting
      if (isSteppedAwayRef.current) {
        isSteppedAwayRef.current = false;
        const info = getParticipantInfo();
        sendRef.current(createWsMessage(PARTICIPANT_MESSAGE_TYPE.RETURNED, {
          participantId: info.participantId,
          participantName: info.participantName,
        } satisfies ReturnedPayload));
      }
    };
  }, []);
}
