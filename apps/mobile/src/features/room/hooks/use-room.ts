import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useStore } from 'zustand';
import { roomStore } from '../../../lib/room';
import { useWs } from '../../../shared/providers/websocket-provider';
import { ROOM_MESSAGE_TYPE, type WsMessage } from '@jellysync/shared';
import { Alert } from 'react-native';

export function useRoom() {
  const router = useRouter();
  const { subscribe } = useWs();

  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const participants = useStore(roomStore, (s) => s.participants);
  const isHost = useStore(roomStore, (s) => s.isHost);
  const connectionState = useStore(roomStore, (s) => s.connectionState);

  useEffect(() => {
    const unsubClose = subscribe(ROOM_MESSAGE_TYPE.CLOSE, () => {
      roomStore.getState().clearRoom();
      Alert.alert('Room Closed', 'The room has been closed.');
      router.replace('/');
    });

    const unsubError = subscribe('error', (msg: WsMessage) => {
      const payload = msg.payload as { code: string; message: string };
      Alert.alert('Error', payload.message);
    });

    return () => {
      unsubClose();
      unsubError();
    };
  }, [subscribe, router]);

  return { roomCode, participants, isHost, connectionState };
}
