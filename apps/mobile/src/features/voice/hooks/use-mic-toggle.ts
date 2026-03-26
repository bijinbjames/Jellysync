import { useCallback } from 'react';
import { useStore } from 'zustand';
import {
  PARTICIPANT_MESSAGE_TYPE,
  createWsMessage,
  type WebRTCManager,
} from '@jellysync/shared';
import { useWs } from '../../../shared/providers/websocket-provider.js';
import { voiceStore } from '../../../lib/voice.js';

export function useMicToggle(managerRef: React.RefObject<WebRTCManager | null>) {
  const { send } = useWs();
  const isMuted = useStore(voiceStore, (s) => s.isMuted);

  const toggleMute = useCallback(() => {
    if (!voiceStore.getState().localStreamActive) return;
    const newMuted = !voiceStore.getState().isMuted;
    voiceStore.getState().setMuted(newMuted);
    managerRef.current?.muteLocalAudio(newMuted);
    send(createWsMessage(PARTICIPANT_MESSAGE_TYPE.MIC_STATE, { isMuted: newMuted }));
  }, [managerRef, send]);

  return { isMuted, toggleMute };
}
