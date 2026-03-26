import type { PeerConnectionState, VoiceConfig, WebRTCManagerCallbacks } from './types.js';
import { SIGNAL_MESSAGE_TYPE } from '../protocol/constants.js';

const RENEGOTIATION_DELAY_MS = 2000;
const DISCONNECT_REPORT_DELAY_MS = 3000;

interface PeerEntry {
  connection: RTCPeerConnection;
  makingOffer: boolean;
  disconnectTimer?: ReturnType<typeof setTimeout>;
}

export class WebRTCManager {
  private peers = new Map<string, PeerEntry>();
  private localStream: MediaStream | null = null;
  private config: VoiceConfig;
  private callbacks: WebRTCManagerCallbacks;
  private disposed = false;

  constructor(config: VoiceConfig, callbacks: WebRTCManagerCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  createPeerConnection(participantId: string): RTCPeerConnection {
    // Clean up existing connection if any
    const existing = this.peers.get(participantId);
    if (existing) {
      if (existing.disconnectTimer) clearTimeout(existing.disconnectTimer);
      existing.connection.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    const entry: PeerEntry = { connection: pc, makingOffer: false };
    this.peers.set(participantId, entry);

    // Handle ICE candidates — trickle ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.sendSignalingMessage(SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE, {
          targetParticipantId: participantId,
          candidate: {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        });
      }
    };

    // Handle remote tracks — when the remote sender has no track yet
    // (e.g. addTransceiver before getUserMedia), event.streams is empty
    // because there is no a=msid in the SDP. Fall back to wrapping event.track.
    pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      this.callbacks.onRemoteStream(participantId, stream);
    };

    // Handle connection state changes
    pc.oniceconnectionstatechange = () => {
      const state = this.mapIceState(pc.iceConnectionState);
      const currentEntry = this.peers.get(participantId);

      // Clear any pending disconnect timer on state change
      if (currentEntry?.disconnectTimer) {
        clearTimeout(currentEntry.disconnectTimer);
        currentEntry.disconnectTimer = undefined;
      }

      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        // Delay reporting disconnected/failed state by 3 seconds (AC6)
        const timer = setTimeout(() => {
          if (!this.disposed && this.peers.has(participantId)) {
            this.callbacks.onConnectionStateChange(participantId, state);
          }
        }, DISCONNECT_REPORT_DELAY_MS);
        if (currentEntry) currentEntry.disconnectTimer = timer;

        // Auto-renegotiation on failure: restartIce + createOffer
        if (pc.iceConnectionState === 'failed') {
          setTimeout(() => {
            if (!this.disposed && this.peers.has(participantId)) {
              pc.restartIce();
              this.createOffer(participantId).catch(() => {
                // Renegotiation offer failed — will be retried by peer
              });
            }
          }, RENEGOTIATION_DELAY_MS);
        }
      } else {
        // Report non-error states immediately
        this.callbacks.onConnectionStateChange(participantId, state);
      }
    };

    // Ensure audio is always negotiated in the SDP even if mic isn't ready yet.
    // addTrack below will reuse this transceiver when the local stream arrives.
    pc.addTransceiver('audio', { direction: 'sendrecv' });

    // Add local stream tracks if available
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    return pc;
  }

  async createOffer(participantId: string): Promise<RTCSessionDescriptionInit> {
    const entry = this.peers.get(participantId);
    if (!entry) {
      throw new Error(`No peer connection for ${participantId}`);
    }

    entry.makingOffer = true;
    try {
      const offer = await entry.connection.createOffer();
      await entry.connection.setLocalDescription(offer);
      return entry.connection.localDescription ?? offer;
    } finally {
      entry.makingOffer = false;
    }
  }

  async handleOffer(fromParticipantId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (this.disposed) {
      throw new Error('WebRTCManager is disposed');
    }

    let entry = this.peers.get(fromParticipantId);
    if (!entry) {
      this.createPeerConnection(fromParticipantId);
      entry = this.peers.get(fromParticipantId)!;
    }

    await entry.connection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await entry.connection.createAnswer();
    await entry.connection.setLocalDescription(answer);
    return entry.connection.localDescription ?? answer;
  }

  async handleAnswer(fromParticipantId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const entry = this.peers.get(fromParticipantId);
    if (!entry) {
      throw new Error(`No peer connection for ${fromParticipantId}`);
    }

    await entry.connection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(fromParticipantId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const entry = this.peers.get(fromParticipantId);
    if (!entry) {
      throw new Error(`No peer connection for ${fromParticipantId}`);
    }

    await entry.connection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  muteLocalAudio(muted: boolean): void {
    if (this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        track.enabled = !muted;
      }
    }
  }

  addLocalStream(stream: MediaStream): void {
    this.localStream = stream;
    this.callbacks.onLocalStream(stream);

    // Attach tracks to all existing peer connections.
    // Use replaceTrack on existing transceivers (created by addTransceiver)
    // to avoid triggering negotiationneeded after the initial offer/answer.
    for (const [, entry] of this.peers) {
      for (const track of stream.getTracks()) {
        const transceiver = entry.connection.getTransceivers().find(
          (t) => t.sender.track === null && t.receiver.track?.kind === track.kind,
        );
        if (transceiver) {
          transceiver.sender.replaceTrack(track).catch(() => {
            // replaceTrack failed — fall back to addTrack
            entry.connection.addTrack(track, stream);
          });
        } else {
          entry.connection.addTrack(track, stream);
        }
      }
    }
  }

  removePeer(participantId: string): void {
    const entry = this.peers.get(participantId);
    if (entry) {
      if (entry.disconnectTimer) clearTimeout(entry.disconnectTimer);
      entry.connection.close();
      this.peers.delete(participantId);
    }
  }

  dispose(): void {
    this.disposed = true;
    const peerIds = Array.from(this.peers.keys());
    for (const participantId of peerIds) {
      this.removePeer(participantId);
    }
    this.localStream = null;
  }

  getPeerConnection(participantId: string): RTCPeerConnection | undefined {
    return this.peers.get(participantId)?.connection;
  }

  getConnectedPeerIds(): string[] {
    return Array.from(this.peers.keys());
  }

  isDisposed(): boolean {
    return this.disposed;
  }

  private mapIceState(iceState: RTCIceConnectionState): PeerConnectionState {
    switch (iceState) {
      case 'new': return 'new';
      case 'checking': return 'connecting';
      case 'connected':
      case 'completed': return 'connected';
      case 'disconnected': return 'disconnected';
      case 'failed': return 'failed';
      case 'closed': return 'closed';
      default: return 'new';
    }
  }
}

/**
 * Munge SDP to enforce minimum Opus bitrate of 48kbps.
 * Adds maxaveragebitrate to the Opus fmtp line if not already present.
 */
export function enforceOpusMinBitrate(sdp: string, minBitrateKbps = 48): string {
  const minBitrateBps = minBitrateKbps * 1000;
  const lines = sdp.split('\r\n');
  const result: string[] = [];

  // Find the Opus payload type
  let opusPayloadType: string | null = null;
  for (const line of lines) {
    const match = line.match(/^a=rtpmap:(\d+)\s+opus\//i);
    if (match) {
      opusPayloadType = match[1];
      break;
    }
  }

  if (!opusPayloadType) return sdp;

  let foundFmtp = false;
  for (const line of lines) {
    if (line.startsWith(`a=fmtp:${opusPayloadType} `)) {
      foundFmtp = true;
      if (line.includes('maxaveragebitrate')) {
        result.push(line);
      } else {
        result.push(`${line};maxaveragebitrate=${minBitrateBps}`);
      }
    } else {
      result.push(line);
    }
  }

  // If no fmtp line exists for Opus, add one
  if (!foundFmtp) {
    const insertIdx = result.findIndex((l) => l.startsWith(`a=rtpmap:${opusPayloadType}`));
    if (insertIdx !== -1) {
      result.splice(insertIdx + 1, 0, `a=fmtp:${opusPayloadType} minptime=10;useinbandfec=1;maxaveragebitrate=${minBitrateBps}`);
    }
  }

  return result.join('\r\n');
}
