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
import { mediaDevices, RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';
import Constants from 'expo-constants';

function getIceServers(): RTCIceServer[] {
  const extra = Constants.expoConfig?.extra ?? {};
  const stunUrl = (extra.JELLYSYNC_STUN_URL as string | undefined) ?? 'stun:stun.l.google.com:19302';
  const turnUrl = extra.JELLYSYNC_TURN_URL as string | undefined;
  const turnUsername = extra.JELLYSYNC_TURN_USERNAME as string | undefined;
  const turnCredential = extra.JELLYSYNC_TURN_CREDENTIAL as string | undefined;

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

// Polyfill globalThis WebRTC APIs for the shared WebRTCManager
function setupWebRTCGlobals() {
  if (!globalThis.RTCPeerConnection) {
    (globalThis as Record<string, unknown>).RTCPeerConnection = RTCPeerConnection;
  }
  if (!globalThis.RTCSessionDescription) {
    (globalThis as Record<string, unknown>).RTCSessionDescription = RTCSessionDescription;
  }
  if (!globalThis.RTCIceCandidate) {
    (globalThis as Record<string, unknown>).RTCIceCandidate = RTCIceCandidate;
  }
}

export function useVoice(): void {
  const { send, subscribe } = useWs();
  const participantId = useStore(roomStore, (s) => s.participantId);
  const roomCode = useStore(roomStore, (s) => s.roomCode);
  const managerRef = useRef<WebRTCManager | null>(null);
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

  const onRemoteStream = useCallback((_pId: string, _stream: MediaStream) => {
    // react-native-webrtc handles audio playback automatically for remote streams
  }, []);

  // Initialize voice when joining a room
  useEffect(() => {
    if (!roomCode || !participantId) return;

    setupWebRTCGlobals();
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

    // Request microphone via react-native-webrtc
    mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (managerRef.current === manager) {
          manager.addLocalStream(stream as unknown as MediaStream);
        } else {
          (stream as unknown as MediaStream).getTracks().forEach((t) => t.stop());
        }
      })
      .catch((err) => {
        if (err?.name === 'NotAllowedError' || err?.message?.includes('permission')) {
          // Mic denied — listen-only mode
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
            // Offer creation failed
          }
        }
      }

      // Clean up connections for participants no longer in room
      const currentIds = new Set(payload.participants.map((p) => p.id));
      for (const peerId of manager.getConnectedPeerIds()) {
        if (!currentIds.has(peerId)) {
          manager.removePeer(peerId);
          voiceStore.getState().removePeerConnection(peerId);
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
      voiceStore.getState().reset();
    };
  }, [roomCode, participantId, subscribe, sendSignalingMessage, onConnectionStateChange, onLocalStream, onRemoteStream]);
}
