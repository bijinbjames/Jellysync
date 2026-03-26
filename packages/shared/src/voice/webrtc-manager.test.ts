import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WebRTCManager, enforceOpusMinBitrate } from './webrtc-manager.js';
import type { VoiceConfig, WebRTCManagerCallbacks } from './types.js';
import { SIGNAL_MESSAGE_TYPE } from '../protocol/constants.js';

// Mock RTCPeerConnection
function createMockPeerConnection() {
  const pc = {
    onicecandidate: null as ((event: { candidate: unknown }) => void) | null,
    ontrack: null as ((event: { streams: unknown[]; track: unknown }) => void) | null,
    oniceconnectionstatechange: null as (() => void) | null,
    iceConnectionState: 'new' as string,
    localDescription: null as RTCSessionDescriptionInit | null,
    createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer-sdp' }),
    createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer-sdp' }),
    setLocalDescription: vi.fn().mockImplementation(function (this: typeof pc, desc: RTCSessionDescriptionInit) {
      this.localDescription = desc;
      return Promise.resolve();
    }),
    setRemoteDescription: vi.fn().mockResolvedValue(undefined),
    addIceCandidate: vi.fn().mockResolvedValue(undefined),
    addTrack: vi.fn(),
    addTransceiver: vi.fn(),
    getTransceivers: vi.fn().mockReturnValue([]),
    close: vi.fn(),
    restartIce: vi.fn(),
  };
  return pc;
}

let mockPCs: ReturnType<typeof createMockPeerConnection>[];

// Setup global mocks
beforeEach(() => {
  mockPCs = [];

  globalThis.RTCPeerConnection = vi.fn().mockImplementation(function () {
    const pc = createMockPeerConnection();
    mockPCs.push(pc);
    return pc;
  }) as unknown as typeof RTCPeerConnection;

  globalThis.RTCSessionDescription = vi.fn().mockImplementation(function (desc: RTCSessionDescriptionInit) {
    return desc;
  }) as unknown as typeof RTCSessionDescription;
  globalThis.RTCIceCandidate = vi.fn().mockImplementation(function (candidate: RTCIceCandidateInit) {
    return candidate;
  }) as unknown as typeof RTCIceCandidate;
});

describe('WebRTCManager', () => {
  let config: VoiceConfig;
  let callbacks: WebRTCManagerCallbacks;
  let manager: WebRTCManager;

  beforeEach(() => {
    config = {
      iceServers: [{ urls: 'stun:stun.example.com:3478' }],
    };

    callbacks = {
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
      onConnectionStateChange: vi.fn(),
      sendSignalingMessage: vi.fn(),
    };

    manager = new WebRTCManager(config, callbacks);
  });

  describe('createPeerConnection', () => {
    it('creates a new RTCPeerConnection with ICE servers', () => {
      manager.createPeerConnection('user-1');

      expect(RTCPeerConnection).toHaveBeenCalledWith({
        iceServers: [{ urls: 'stun:stun.example.com:3478' }],
      });
      expect(mockPCs).toHaveLength(1);
    });

    it('sets up ICE candidate handler', () => {
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      // Simulate ICE candidate
      pc.onicecandidate!({
        candidate: {
          candidate: 'candidate:1 ...',
          sdpMid: '0',
          sdpMLineIndex: 0,
        },
      });

      expect(callbacks.sendSignalingMessage).toHaveBeenCalledWith(
        SIGNAL_MESSAGE_TYPE.ICE_CANDIDATE,
        {
          targetParticipantId: 'user-1',
          candidate: {
            candidate: 'candidate:1 ...',
            sdpMid: '0',
            sdpMLineIndex: 0,
          },
        },
      );
    });

    it('does not send when candidate is null (gathering complete)', () => {
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      pc.onicecandidate!({ candidate: null });

      expect(callbacks.sendSignalingMessage).not.toHaveBeenCalled();
    });

    it('sets up remote track handler with stream', () => {
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];
      const mockStream = {} as MediaStream;

      pc.ontrack!({ streams: [mockStream], track: {} });

      expect(callbacks.onRemoteStream).toHaveBeenCalledWith('user-1', mockStream);
    });

    it('creates MediaStream from track when event.streams is empty', () => {
      const mockCreatedStream = {} as MediaStream;
      globalThis.MediaStream = vi.fn().mockImplementation(function () { return mockCreatedStream; }) as unknown as typeof MediaStream;

      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];
      const mockTrack = { kind: 'audio' };

      pc.ontrack!({ streams: [], track: mockTrack });

      expect(globalThis.MediaStream).toHaveBeenCalledWith([mockTrack]);
      expect(callbacks.onRemoteStream).toHaveBeenCalledWith('user-1', mockCreatedStream);
    });

    it('reports non-error connection state changes immediately', () => {
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      pc.iceConnectionState = 'checking';
      pc.oniceconnectionstatechange!();
      expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith('user-1', 'connecting');

      pc.iceConnectionState = 'connected';
      pc.oniceconnectionstatechange!();
      expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith('user-1', 'connected');
    });

    it('delays reporting disconnected/failed states by 3 seconds', () => {
      vi.useFakeTimers();
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      pc.iceConnectionState = 'disconnected';
      pc.oniceconnectionstatechange!();
      expect(callbacks.onConnectionStateChange).not.toHaveBeenCalledWith('user-1', 'disconnected');

      vi.advanceTimersByTime(3000);
      expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith('user-1', 'disconnected');

      vi.useRealTimers();
    });

    it('cancels delayed error report if state recovers', () => {
      vi.useFakeTimers();
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      pc.iceConnectionState = 'disconnected';
      pc.oniceconnectionstatechange!();

      // State recovers before 3 seconds
      pc.iceConnectionState = 'connected';
      pc.oniceconnectionstatechange!();

      vi.advanceTimersByTime(3000);
      expect(callbacks.onConnectionStateChange).not.toHaveBeenCalledWith('user-1', 'disconnected');
      expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith('user-1', 'connected');

      vi.useRealTimers();
    });

    it('attempts renegotiation on failed state with restartIce + createOffer', () => {
      vi.useFakeTimers();
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      pc.iceConnectionState = 'failed';
      pc.oniceconnectionstatechange!();

      expect(pc.restartIce).not.toHaveBeenCalled();
      vi.advanceTimersByTime(2000);
      expect(pc.restartIce).toHaveBeenCalled();
      expect(pc.createOffer).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('closes existing connection when recreating for same participant', () => {
      manager.createPeerConnection('user-1');
      const firstPc = mockPCs[0];

      manager.createPeerConnection('user-1');
      expect(firstPc.close).toHaveBeenCalled();
      expect(mockPCs).toHaveLength(2);
    });

    it('adds existing local stream tracks to new connection', () => {
      const mockTrack = { kind: 'audio' } as MediaStreamTrack;
      const mockStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;
      manager.addLocalStream(mockStream);

      manager.createPeerConnection('user-1');
      expect(mockPCs[0].addTrack).toHaveBeenCalledWith(mockTrack, mockStream);
    });
  });

  describe('createOffer', () => {
    it('creates and sets local description', async () => {
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      const offer = await manager.createOffer('user-1');

      expect(pc.createOffer).toHaveBeenCalled();
      expect(pc.setLocalDescription).toHaveBeenCalledWith({ type: 'offer', sdp: 'mock-offer-sdp' });
      expect(offer).toEqual({ type: 'offer', sdp: 'mock-offer-sdp' });
    });

    it('throws for unknown participant', async () => {
      await expect(manager.createOffer('nonexistent')).rejects.toThrow('No peer connection for nonexistent');
    });
  });

  describe('handleOffer', () => {
    it('sets remote description and creates answer', async () => {
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      const offer = { type: 'offer' as const, sdp: 'remote-offer-sdp' };
      const answer = await manager.handleOffer('user-1', offer);

      expect(pc.setRemoteDescription).toHaveBeenCalled();
      expect(pc.createAnswer).toHaveBeenCalled();
      expect(pc.setLocalDescription).toHaveBeenCalledWith({ type: 'answer', sdp: 'mock-answer-sdp' });
      expect(answer).toEqual({ type: 'answer', sdp: 'mock-answer-sdp' });
    });

    it('creates peer connection if it does not exist', async () => {
      const offer = { type: 'offer' as const, sdp: 'remote-offer-sdp' };
      const answer = await manager.handleOffer('new-user', offer);

      expect(mockPCs).toHaveLength(1);
      expect(answer).toEqual({ type: 'answer', sdp: 'mock-answer-sdp' });
    });
  });

  describe('handleAnswer', () => {
    it('sets remote description', async () => {
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      const answer = { type: 'answer' as const, sdp: 'remote-answer-sdp' };
      await manager.handleAnswer('user-1', answer);

      expect(pc.setRemoteDescription).toHaveBeenCalled();
    });

    it('throws for unknown participant', async () => {
      const answer = { type: 'answer' as const, sdp: 'remote-answer-sdp' };
      await expect(manager.handleAnswer('nonexistent', answer)).rejects.toThrow('No peer connection for nonexistent');
    });
  });

  describe('handleIceCandidate', () => {
    it('adds ICE candidate to peer connection', async () => {
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      const candidate = { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 0 };
      await manager.handleIceCandidate('user-1', candidate);

      expect(pc.addIceCandidate).toHaveBeenCalled();
    });

    it('throws for unknown participant', async () => {
      const candidate = { candidate: 'candidate:1 ...', sdpMid: '0', sdpMLineIndex: 0 };
      await expect(manager.handleIceCandidate('nonexistent', candidate)).rejects.toThrow('No peer connection for nonexistent');
    });
  });

  describe('muteLocalAudio', () => {
    it('sets audio track enabled to false when muting', () => {
      const mockTrack1 = { kind: 'audio', enabled: true } as MediaStreamTrack;
      const mockTrack2 = { kind: 'audio', enabled: true } as MediaStreamTrack;
      const mockStream = {
        getTracks: () => [mockTrack1, mockTrack2],
        getAudioTracks: () => [mockTrack1, mockTrack2],
      } as unknown as MediaStream;
      manager.addLocalStream(mockStream);

      manager.muteLocalAudio(true);

      expect(mockTrack1.enabled).toBe(false);
      expect(mockTrack2.enabled).toBe(false);
    });

    it('sets audio track enabled to true when unmuting', () => {
      const mockTrack = { kind: 'audio', enabled: false } as MediaStreamTrack;
      const mockStream = {
        getTracks: () => [mockTrack],
        getAudioTracks: () => [mockTrack],
      } as unknown as MediaStream;
      manager.addLocalStream(mockStream);

      manager.muteLocalAudio(false);

      expect(mockTrack.enabled).toBe(true);
    });

    it('does nothing when no local stream is set', () => {
      // Should not throw
      expect(() => manager.muteLocalAudio(true)).not.toThrow();
    });
  });

  describe('addLocalStream', () => {
    it('fires onLocalStream callback', () => {
      const mockStream = { getTracks: () => [] } as unknown as MediaStream;
      manager.addLocalStream(mockStream);

      expect(callbacks.onLocalStream).toHaveBeenCalledWith(mockStream);
    });

    it('uses replaceTrack on existing transceivers', () => {
      manager.createPeerConnection('user-1');
      manager.createPeerConnection('user-2');

      const mockReplaceTrack = vi.fn().mockResolvedValue(undefined);
      const mockTransceiver = {
        sender: { track: null },
        receiver: { track: { kind: 'audio' } },
      };
      mockPCs[0].getTransceivers.mockReturnValue([mockTransceiver]);
      mockPCs[0].addTrack = vi.fn(); // should NOT be called
      // Give the transceiver a replaceTrack mock
      mockTransceiver.sender.replaceTrack = mockReplaceTrack;

      // Second PC has no matching transceiver — falls back to addTrack
      mockPCs[1].getTransceivers.mockReturnValue([]);

      const mockTrack = { kind: 'audio' } as MediaStreamTrack;
      const mockStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;
      manager.addLocalStream(mockStream);

      expect(mockReplaceTrack).toHaveBeenCalledWith(mockTrack);
      expect(mockPCs[0].addTrack).not.toHaveBeenCalled();
      expect(mockPCs[1].addTrack).toHaveBeenCalledWith(mockTrack, mockStream);
    });

    it('falls back to addTrack when no matching transceiver exists', () => {
      manager.createPeerConnection('user-1');

      const mockTrack = { kind: 'audio' } as MediaStreamTrack;
      const mockStream = { getTracks: () => [mockTrack] } as unknown as MediaStream;
      manager.addLocalStream(mockStream);

      expect(mockPCs[0].addTrack).toHaveBeenCalledWith(mockTrack, mockStream);
    });
  });

  describe('removePeer', () => {
    it('closes and removes peer connection', () => {
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      manager.removePeer('user-1');

      expect(pc.close).toHaveBeenCalled();
      expect(manager.getPeerConnection('user-1')).toBeUndefined();
    });

    it('is safe to call for non-existent peer', () => {
      expect(() => manager.removePeer('nonexistent')).not.toThrow();
    });
  });

  describe('dispose', () => {
    it('closes all peer connections', () => {
      manager.createPeerConnection('user-1');
      manager.createPeerConnection('user-2');

      manager.dispose();

      expect(mockPCs[0].close).toHaveBeenCalled();
      expect(mockPCs[1].close).toHaveBeenCalled();
      expect(manager.getConnectedPeerIds()).toHaveLength(0);
    });

    it('prevents renegotiation after dispose', () => {
      vi.useFakeTimers();
      manager.createPeerConnection('user-1');
      const pc = mockPCs[0];

      pc.iceConnectionState = 'failed';
      pc.oniceconnectionstatechange!();

      manager.dispose();
      vi.advanceTimersByTime(2000);

      // restartIce should NOT be called since manager is disposed
      expect(pc.restartIce).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('handleOffer with disposed manager', () => {
    it('throws when manager is disposed', async () => {
      manager.dispose();
      const offer = { type: 'offer' as const, sdp: 'remote-offer-sdp' };
      await expect(manager.handleOffer('user-1', offer)).rejects.toThrow('WebRTCManager is disposed');
    });
  });

  describe('isDisposed', () => {
    it('returns false initially', () => {
      expect(manager.isDisposed()).toBe(false);
    });

    it('returns true after dispose', () => {
      manager.dispose();
      expect(manager.isDisposed()).toBe(true);
    });
  });

  describe('getConnectedPeerIds', () => {
    it('returns all peer IDs', () => {
      manager.createPeerConnection('user-1');
      manager.createPeerConnection('user-2');

      expect(manager.getConnectedPeerIds()).toEqual(['user-1', 'user-2']);
    });

    it('returns empty array when no peers', () => {
      expect(manager.getConnectedPeerIds()).toEqual([]);
    });
  });
});

describe('enforceOpusMinBitrate', () => {
  const baseSdp = [
    'v=0',
    'm=audio 9 UDP/TLS/RTP/SAVPF 111',
    'a=rtpmap:111 opus/48000/2',
    'a=fmtp:111 minptime=10;useinbandfec=1',
    '',
  ].join('\r\n');

  it('appends maxaveragebitrate to existing fmtp line', () => {
    const result = enforceOpusMinBitrate(baseSdp);
    expect(result).toContain('a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=48000');
  });

  it('does not duplicate maxaveragebitrate if already present', () => {
    const sdpWithBitrate = baseSdp.replace(
      'a=fmtp:111 minptime=10;useinbandfec=1',
      'a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=64000',
    );
    const result = enforceOpusMinBitrate(sdpWithBitrate);
    expect(result).toContain('maxaveragebitrate=64000');
    expect(result.match(/maxaveragebitrate/g)?.length).toBe(1);
  });

  it('returns SDP unchanged if no Opus codec', () => {
    const noOpusSdp = 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 96\r\na=rtpmap:96 PCMU/8000\r\n';
    expect(enforceOpusMinBitrate(noOpusSdp)).toBe(noOpusSdp);
  });

  it('adds fmtp line if none exists for Opus', () => {
    const noFmtpSdp = [
      'v=0',
      'm=audio 9 UDP/TLS/RTP/SAVPF 111',
      'a=rtpmap:111 opus/48000/2',
      '',
    ].join('\r\n');
    const result = enforceOpusMinBitrate(noFmtpSdp);
    expect(result).toContain('a=fmtp:111 minptime=10;useinbandfec=1;maxaveragebitrate=48000');
  });

  it('uses custom bitrate', () => {
    const result = enforceOpusMinBitrate(baseSdp, 64);
    expect(result).toContain('maxaveragebitrate=64000');
  });
});
