import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from 'zustand';
import { roomStore } from '../../../lib/room';
import { useWs } from '../../../shared/providers/websocket-provider';
import { ROOM_MESSAGE_TYPE, type WsMessage } from '@jellysync/shared';

export function useRoom() {
  const navigate = useNavigate();
  const { subscribe } = useWs();

  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const participants = useStore(roomStore, (s) => s.participants);
  const isHost = useStore(roomStore, (s) => s.isHost);
  const connectionState = useStore(roomStore, (s) => s.connectionState);

  useEffect(() => {
    const unsubClose = subscribe(ROOM_MESSAGE_TYPE.CLOSE, () => {
      roomStore.getState().clearRoom();
      window.alert('The room has been closed.');
      navigate('/', { replace: true });
    });

    const unsubError = subscribe('error', (msg: WsMessage) => {
      const payload = msg.payload as { code: string; message: string };
      window.alert(payload.message);
    });

    return () => {
      unsubClose();
      unsubError();
    };
  }, [subscribe, navigate]);

  return { roomCode, participants, isHost, connectionState };
}
