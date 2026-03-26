import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncEngine } from './sync-engine.js';
import { SYNC_MESSAGE_TYPE, SYNC_CONFIG } from '../protocol/constants.js';
import { createWsMessage } from '../protocol/messages.js';
import type { PlayerInterface, BufferState } from '../types/playback.js';
import type { WsMessage } from '../protocol/messages.js';

function createMockPlayer(): PlayerInterface {
  let position = 0;
  return {
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn((posMs: number) => {
      position = posMs;
    }),
    getPosition: vi.fn(() => position),
    getBufferState: vi.fn((): BufferState => ({ isBuffering: false, bufferedMs: 0 })),
  };
}

describe('SyncEngine', () => {
  let player: ReturnType<typeof createMockPlayer>;
  let sentMessages: WsMessage[];
  let syncStatusChanges: string[];
  let serverStateChanges: Array<{ positionMs: number; timestamp: number }>;
  let engine: SyncEngine;
  let isHost: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    player = createMockPlayer();
    sentMessages = [];
    syncStatusChanges = [];
    serverStateChanges = [];
    isHost = true;

    engine = new SyncEngine({
      playerInterface: player,
      sendMessage: (msg) => sentMessages.push(msg),
      getIsHost: () => isHost,
      onSyncStatusChange: (status) => syncStatusChanges.push(status),
      onServerStateChange: (positionMs, timestamp) => serverStateChanges.push({ positionMs, timestamp }),
    });
  });

  afterEach(() => {
    engine.destroy();
    vi.useRealTimers();
  });

  describe('requestPlay', () => {
    it('sends sync:play message when host', () => {
      engine.requestPlay();
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].type).toBe(SYNC_MESSAGE_TYPE.PLAY);
    });

    it('applies optimistic local play immediately', () => {
      engine.requestPlay();
      expect(player.play).toHaveBeenCalled();
    });

    it('does nothing when not host', () => {
      isHost = false;
      engine.requestPlay();
      expect(sentMessages).toHaveLength(0);
      expect(player.play).not.toHaveBeenCalled();
    });

    it('includes current position in payload', () => {
      (player.getPosition as ReturnType<typeof vi.fn>).mockReturnValue(5000);
      engine.requestPlay();
      expect((sentMessages[0].payload as { positionMs: number }).positionMs).toBe(5000);
    });
  });

  describe('requestPause', () => {
    it('sends sync:pause message when host', () => {
      engine.requestPause();
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].type).toBe(SYNC_MESSAGE_TYPE.PAUSE);
    });

    it('applies optimistic local pause immediately', () => {
      engine.requestPause();
      expect(player.pause).toHaveBeenCalled();
    });

    it('does nothing when not host', () => {
      isHost = false;
      engine.requestPause();
      expect(sentMessages).toHaveLength(0);
      expect(player.pause).not.toHaveBeenCalled();
    });
  });

  describe('requestSeek', () => {
    it('sends sync:seek message when host', () => {
      engine.requestSeek(10000);
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].type).toBe(SYNC_MESSAGE_TYPE.SEEK);
      expect((sentMessages[0].payload as { positionMs: number }).positionMs).toBe(10000);
    });

    it('applies optimistic local seek immediately', () => {
      engine.requestSeek(10000);
      expect(player.seek).toHaveBeenCalledWith(10000);
    });

    it('does nothing when not host', () => {
      isHost = false;
      engine.requestSeek(10000);
      expect(sentMessages).toHaveLength(0);
      expect(player.seek).not.toHaveBeenCalled();
    });
  });

  describe('handleSyncMessage', () => {
    // handleSyncMessage is for guests — host skips server echo
    beforeEach(() => {
      isHost = false;
    });

    it('handles sync:play - calls player.play and seeks if drifted', () => {
      (player.getPosition as ReturnType<typeof vi.fn>).mockReturnValue(0);
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 5000, serverTimestamp: Date.now() });
      engine.handleSyncMessage(msg);
      expect(player.play).toHaveBeenCalled();
      expect(player.seek).toHaveBeenCalledWith(5000);
    });

    it('handles sync:play - does not seek if within threshold', () => {
      (player.getPosition as ReturnType<typeof vi.fn>).mockReturnValue(4800);
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 5000, serverTimestamp: Date.now() });
      engine.handleSyncMessage(msg);
      expect(player.play).toHaveBeenCalled();
      expect(player.seek).not.toHaveBeenCalled();
    });

    it('handles sync:pause - calls player.pause', () => {
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PAUSE, { positionMs: 5000, serverTimestamp: Date.now() });
      engine.handleSyncMessage(msg);
      expect(player.pause).toHaveBeenCalled();
    });

    it('handles sync:seek - calls player.seek with correct position', () => {
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.SEEK, { positionMs: 30000, serverTimestamp: Date.now() });
      engine.handleSyncMessage(msg);
      expect(player.seek).toHaveBeenCalledWith(30000);
    });

    it('handles sync:seek - resumes play if was playing', () => {
      // First set playing state via sync:play
      const playMsg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 5000, serverTimestamp: Date.now() });
      engine.handleSyncMessage(playMsg);
      vi.clearAllMocks();

      const seekMsg = createWsMessage(SYNC_MESSAGE_TYPE.SEEK, { positionMs: 30000, serverTimestamp: Date.now() });
      engine.handleSyncMessage(seekMsg);
      expect(player.seek).toHaveBeenCalledWith(30000);
      expect(player.play).toHaveBeenCalled();
    });

    it('updates sync status on message receipt', () => {
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 0, serverTimestamp: Date.now() });
      engine.handleSyncMessage(msg);
      expect(syncStatusChanges).toContain('synced');
    });

    it('updates server state on message receipt', () => {
      const now = Date.now();
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 5000, serverTimestamp: now });
      engine.handleSyncMessage(msg);
      expect(serverStateChanges).toContainEqual({ positionMs: 5000, timestamp: now });
    });

    it('skips processing when host (avoids double-apply from server echo)', () => {
      isHost = true;
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 5000, serverTimestamp: Date.now() });
      engine.handleSyncMessage(msg);
      expect(player.play).not.toHaveBeenCalled();
    });

    it('does nothing after destroy', () => {
      engine.destroy();
      const msg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 5000, serverTimestamp: Date.now() });
      engine.handleSyncMessage(msg);
      expect(player.play).not.toHaveBeenCalled();
    });
  });

  describe('drift detection', () => {
    // Drift detection is for guests — host is source of truth
    beforeEach(() => {
      isHost = false;
    });

    it('corrects drift exceeding threshold', () => {
      const now = Date.now();
      // Set up server state via a play message
      const playMsg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 10000, serverTimestamp: now });
      engine.handleSyncMessage(playMsg);
      vi.clearAllMocks();

      // Advance time past the seek settle period
      vi.advanceTimersByTime(SYNC_CONFIG.SEEK_SETTLE_MS + 100);

      // Expected position at drift check = 10000 + settleMs + 100 + driftCheckInterval
      const totalElapsed = SYNC_CONFIG.SEEK_SETTLE_MS + 100 + SYNC_CONFIG.DRIFT_CHECK_INTERVAL_MS;
      const expectedPos = 10000 + totalElapsed;
      // Set drift >500ms but <2000ms to trigger micro-correction (syncing)
      (player.getPosition as ReturnType<typeof vi.fn>).mockReturnValue(expectedPos - 800);

      engine.startDriftMonitor();
      vi.advanceTimersByTime(SYNC_CONFIG.DRIFT_CHECK_INTERVAL_MS);

      expect(player.seek).toHaveBeenCalled();
      expect(syncStatusChanges).toContain('syncing');
    });

    it('does not correct drift within threshold', () => {
      const now = Date.now();
      const playMsg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 10000, serverTimestamp: now });
      engine.handleSyncMessage(playMsg);
      vi.clearAllMocks();

      // Advance past settle period
      vi.advanceTimersByTime(SYNC_CONFIG.SEEK_SETTLE_MS + 100);

      // Calculate what the expected position will be when drift check fires
      // Total elapsed at drift check = SEEK_SETTLE_MS + 100 + DRIFT_CHECK_INTERVAL_MS
      const totalElapsed = SYNC_CONFIG.SEEK_SETTLE_MS + 100 + SYNC_CONFIG.DRIFT_CHECK_INTERVAL_MS;
      const expectedPos = 10000 + totalElapsed;
      // Set mock to return a position within 500ms threshold BEFORE starting monitor
      (player.getPosition as ReturnType<typeof vi.fn>).mockReturnValue(expectedPos - 200);

      engine.startDriftMonitor();
      vi.advanceTimersByTime(SYNC_CONFIG.DRIFT_CHECK_INTERVAL_MS);

      expect(player.seek).not.toHaveBeenCalled();
    });

    it('rate-limits corrections to max per window', () => {
      const now = Date.now();
      const playMsg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 10000, serverTimestamp: now });
      engine.handleSyncMessage(playMsg);
      vi.clearAllMocks();

      vi.advanceTimersByTime(SYNC_CONFIG.SEEK_SETTLE_MS + 100);

      // Always report drifted position
      (player.getPosition as ReturnType<typeof vi.fn>).mockReturnValue(0);

      engine.startDriftMonitor();

      // Trigger more than MAX_CORRECTIONS_PER_WINDOW drift checks
      for (let i = 0; i < SYNC_CONFIG.MAX_CORRECTIONS_PER_WINDOW + 2; i++) {
        vi.advanceTimersByTime(SYNC_CONFIG.DRIFT_CHECK_INTERVAL_MS);
      }

      // Should be capped at MAX_CORRECTIONS_PER_WINDOW
      expect(player.seek).toHaveBeenCalledTimes(SYNC_CONFIG.MAX_CORRECTIONS_PER_WINDOW);
    });

    it('skips drift check during seek settle period', () => {
      const now = Date.now();
      const playMsg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 10000, serverTimestamp: now });
      engine.handleSyncMessage(playMsg);
      vi.clearAllMocks();

      // Do NOT advance past seek settle period — start monitor immediately
      (player.getPosition as ReturnType<typeof vi.fn>).mockReturnValue(0);

      engine.startDriftMonitor();
      // Drift check fires but should be skipped since still in settle period
      // DRIFT_CHECK_INTERVAL_MS (2000) < SEEK_SETTLE_MS (2000), so we're at boundary
      // Advance by less than SEEK_SETTLE_MS to guarantee settle skip
      vi.advanceTimersByTime(SYNC_CONFIG.SEEK_SETTLE_MS - 100);

      expect(player.seek).not.toHaveBeenCalled();
    });

    it('does not check drift when not playing', () => {
      // Pause state
      const pauseMsg = createWsMessage(SYNC_MESSAGE_TYPE.PAUSE, { positionMs: 10000, serverTimestamp: Date.now() });
      engine.handleSyncMessage(pauseMsg);
      vi.clearAllMocks();

      vi.advanceTimersByTime(SYNC_CONFIG.SEEK_SETTLE_MS + 100);

      (player.getPosition as ReturnType<typeof vi.fn>).mockReturnValue(0);

      engine.startDriftMonitor();
      vi.advanceTimersByTime(SYNC_CONFIG.DRIFT_CHECK_INTERVAL_MS);

      expect(player.seek).not.toHaveBeenCalled();
    });

    it('skips drift check when host (source of truth)', () => {
      isHost = false;
      const now = Date.now();
      const playMsg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 10000, serverTimestamp: now });
      engine.handleSyncMessage(playMsg);
      vi.clearAllMocks();

      // Switch to host
      isHost = true;
      vi.advanceTimersByTime(SYNC_CONFIG.SEEK_SETTLE_MS + 100);
      (player.getPosition as ReturnType<typeof vi.fn>).mockReturnValue(0);

      engine.startDriftMonitor();
      vi.advanceTimersByTime(SYNC_CONFIG.DRIFT_CHECK_INTERVAL_MS);

      expect(player.seek).not.toHaveBeenCalled();
    });

    it('reports drifted status for force-seek threshold', () => {
      const now = Date.now();
      const playMsg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 10000, serverTimestamp: now });
      engine.handleSyncMessage(playMsg);
      syncStatusChanges = [];

      vi.advanceTimersByTime(SYNC_CONFIG.SEEK_SETTLE_MS + 100);

      // Set position far enough to exceed FORCE_SEEK_THRESHOLD_MS (2000ms)
      const totalElapsed = SYNC_CONFIG.SEEK_SETTLE_MS + 100 + SYNC_CONFIG.DRIFT_CHECK_INTERVAL_MS;
      const expectedPos = 10000 + totalElapsed;
      (player.getPosition as ReturnType<typeof vi.fn>).mockReturnValue(expectedPos - 3000);

      engine.startDriftMonitor();
      vi.advanceTimersByTime(SYNC_CONFIG.DRIFT_CHECK_INTERVAL_MS);

      expect(syncStatusChanges).toContain('drifted');
    });

    it('stops drift monitor on destroy', () => {
      engine.startDriftMonitor();
      engine.destroy();

      const now = Date.now();
      const playMsg = createWsMessage(SYNC_MESSAGE_TYPE.PLAY, { positionMs: 10000, serverTimestamp: now });
      // Can't handle messages after destroy
      engine.handleSyncMessage(playMsg);

      vi.advanceTimersByTime(SYNC_CONFIG.DRIFT_CHECK_INTERVAL_MS * 5);
      expect(player.seek).not.toHaveBeenCalled();
    });
  });

  describe('late joiner', () => {
    it('seeks and plays when session is active', () => {
      const now = Date.now();
      engine.applyLateJoinState(10000, true, now);

      expect(player.seek).toHaveBeenCalled();
      expect(player.play).toHaveBeenCalled();
    });

    it('seeks to paused position when session is paused', () => {
      engine.applyLateJoinState(10000, false, Date.now());

      expect(player.seek).toHaveBeenCalledWith(10000);
      expect(player.play).not.toHaveBeenCalled();
    });

    it('extrapolates position for active playback', () => {
      const pastTime = Date.now() - 2000;
      engine.applyLateJoinState(10000, true, pastTime);

      const seekArg = (player.seek as ReturnType<typeof vi.fn>).mock.calls[0][0] as number;
      // Should be approximately 12000 (10000 + 2000ms elapsed)
      expect(seekArg).toBeGreaterThanOrEqual(11900);
      expect(seekArg).toBeLessThanOrEqual(12100);
    });

    it('notifies server state change', () => {
      const now = Date.now();
      engine.applyLateJoinState(10000, true, now);
      expect(serverStateChanges).toContainEqual({ positionMs: 10000, timestamp: now });
    });
  });
});
