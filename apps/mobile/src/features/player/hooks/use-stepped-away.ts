import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
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

    function handleAppStateChange(nextAppState: AppStateStatus) {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Start debounce timer
        if (timerRef.current) return;
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          // Re-check AppState — user may have returned during debounce
          if (AppState.currentState === 'active') return;
          isSteppedAwayRef.current = true;
          const info = getParticipantInfo();
          sendRef.current(createWsMessage(PARTICIPANT_MESSAGE_TYPE.STEPPED_AWAY, {
            participantId: info.participantId,
            participantName: info.participantName,
          } satisfies SteppedAwayPayload));
        }, STEPPED_AWAY_DEBOUNCE_MS);
      } else if (nextAppState === 'active') {
        // App foregrounded — cancel pending timer or send returned
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

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
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
