import { useEffect, useRef, useCallback } from 'react';
import { useStore } from 'zustand';
import {
  WebRTCManager,
  enforceOpusMinBitrate,
  SIGNAL_MESSAGE_TYPE,
  ROOM_MESSAGE_TYPE,
  createWsMessage,
  type WsMessage,
  type RoomStatePayload,
  type VoiceConfig,
  type PeerConnectionState,
} from '@jellysync/shared';
import { useWs } from '../../../shared/providers/websocket-provider.js';
import { roomStore } from '../../../lib/room.js';
import { voiceStore } from '../../../lib/voice.js';

function getIceServers(): RTCIceServer[] {
  const stunUrl = (globalThis as Record<string, unknown>).__JELLYSYNC_STUN_URL__ as string | undefined
    ?? 'stun:stun.l.google.com:19302';
  const turnUrl = (globalThis as Record<string, unknown>).__JELLYSYNC_TURN_URL__ as string | undefined;
  const turnUsername = (globalThis as Record<string, unknown>).__JELLYSYNC_TURN_USERNAME__ as string | undefined;
  const turnCredential = (globalThis as Record<string, unknown>).__JELLYSYNC_TURN_CREDENTIAL__ as string | undefined;

  const servers: RTCIceServer[] = [{ urls: stunUrl }];

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return servers;
}

export function useVoice(): void {
  const { send, subscribe } = useWs();
  const participantId = useStore(roomStore, (s) => s.participantId);
  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const managerRef = useRef<WebRTCManager | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const hasInitiatedOffersRef = useRef(false);
  const sendRef = useRef(send);
  sendRef.current = send;

  const sendSignalingMessage = useCallback((type: string, payload: unknown) => {
    sendRef.current(createWsMessage(type, payload));
  }, []);

  const onConnectionStateChange = useCallback((pId: string, state: PeerConnectionState) => {
    voiceStore.getState().setPeerConnectionState(pId, state);
  }, []);

  const onLocalStream = useCallback(() => {
    voiceStore.getState().setLocalStreamActive(true);
  }, []);

  const onRemoteStream = useCallback((pId: string, stream: MediaStream) => {
    // Clean up existing audio element for this participant
    const existing = audioElementsRef.current.get(pId);
    if (existing) {
      existing.pause();
      existing.srcObject = null;
    }

    const audio = new Audio();
    audio.srcObject = stream;
    audio.autoplay = true;
    audioElementsRef.current.set(pId, audio);
  }, []);

  // Initialize voice when joining a room
  useEffect(() => {
    if (!roomCode || !participantId) return;

    hasInitiatedOffersRef.current = false;

    const config: VoiceConfig = { iceServers: getIceServers() };
    const manager = new WebRTCManager(config, {
      onLocalStream,
      onRemoteStream,
      onConnectionStateChange,
      sendSignalingMessage,
    });
    managerRef.current = manager;
    voiceStore.getState().setVoiceEnabled(true);

    // Request microphone
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        if (managerRef.current === manager) {
          manager.addLocalStream(stream);
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          // Mic denied — listen-only mode, voice playback still works
        } else {
          console.warn('[voice] getUserMedia failed:', err);
        }
      });

    // Subscribe to signaling messages from server
    const unsubOffer = subscribe(SIGNAL_MESSAGE_TYPE.OFFER, async (msg: WsMessage) => {
      if (manager.isDisposed()) return;
      try {
        const payload = msg.payload as { fromParticipantId: string; offer: RTCSessionDescriptionInit };
        const answer = await manager.handleOffer(payload.fromParticipantId, payload.offer);
        const mungedAnswer = { ...answer, sdp: answer.sdp ? enforceOpusMinBitrate(answer.sdp) : answer.sdp };
        sendRef.current(createWsMessage(SIGNAL_MESSAGE_TYPE.ANSWER, {
          targetParticipantId: payload.fromParticipantId,
          answer: mungedAnswer,
        }));
      } catch (err) {
        console.warn('[voice] handleOffer failed:', err);
      }
    });

    const unsubAnswer = subscribe(SIGNAL_MESSAGE_TYPE.ANSWER, async (msg: WsMessage) => {
      if (manager.isDisposed()) return;
      try {
        const payload = msg.payload as { fromParticipantId: string; answer: RTCSessionDescriptionInit };
        await manager.handleAnswer(payload.fromParticipantId, payload.answer);
      } catch (err) {
        console.warn('[voice] handleAnswer failed:', err);
      }
    });

    const unsubIce = subscribe(SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE, async (msg: WsMessage) => {
      if (manager.isDisposed()) return;
      try {
        const payload = msg.payload as { fromParticipantId: string; candidate: RTCIceCandidateInit };
        await manager.handleIceCandidate(payload.fromParticipantId, payload.candidate);
      } catch (err) {
        console.warn('[voice] handleIceCandidate failed:', err);
      }
    });

    // On room:state, initiate offers to existing participants (joiner initiates)
    // Only on the first room:state after joining to prevent glare from re-offers
    const unsubRoomState = subscribe(ROOM_MESSAGE_TYPE.STATE, async (msg: WsMessage) => {
      if (manager.isDisposed()) return;
      const payload = msg.payload as RoomStatePayload;
      if (!payload.participantId) return;

      // Only initiate offers once (on initial join)
      if (!hasInitiatedOffersRef.current) {
        hasInitiatedOffersRef.current = true;

        for (const participant of payload.participants) {
          if (participant.id === participantId) continue;
          if (manager.getPeerConnection(participant.id)) continue;

          manager.createPeerConnection(participant.id);
          try {
            const offer = await manager.createOffer(participant.id);
            const mungedOffer = { ...offer, sdp: offer.sdp ? enforceOpusMinBitrate(offer.sdp) : offer.sdp };
            sendRef.current(createWsMessage(SIGNAL_MESSAGE_TYPE.OFFER, {
              targetParticipantId: participant.id,
              offer: mungedOffer,
            }));
          } catch {
            // Offer creation failed, peer will retry on their side
          }
        }
      }

      // Clean up connections for participants no longer in room
      const currentIds = new Set(payload.participants.map((p) => p.id));
      for (const peerId of manager.getConnectedPeerIds()) {
        if (!currentIds.has(peerId)) {
          manager.removePeer(peerId);
          voiceStore.getState().removePeerConnection(peerId);
          // Clean up audio element
          const audio = audioElementsRef.current.get(peerId);
          if (audio) {
            audio.pause();
            audio.srcObject = null;
            audioElementsRef.current.delete(peerId);
          }
        }
      }
    });

    return () => {
      unsubOffer();
      unsubAnswer();
      unsubIce();
      unsubRoomState();
      manager.dispose();
      managerRef.current = null;
      hasInitiatedOffersRef.current = false;
      // Clean up all audio elements
      for (const [, audio] of audioElementsRef.current) {
        audio.pause();
        audio.srcObject = null;
      }
      audioElementsRef.current.clear();
      voiceStore.getState().reset();
    };
  }, [roomCode, participantId, subscribe, sendSignalingMessage, onConnectionStateChange, onLocalStream, onRemoteStream]);
}
