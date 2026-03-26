export type PeerConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export interface PeerConnection {
  participantId: string;
  state: PeerConnectionState;
}

export interface VoiceConfig {
  iceServers: RTCIceServer[];
}

export interface WebRTCManagerCallbacks {
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (participantId: string, stream: MediaStream) => void;
  onConnectionStateChange: (participantId: string, state: PeerConnectionState) => void;
  sendSignalingMessage: (type: string, payload: unknown) => void;
}
