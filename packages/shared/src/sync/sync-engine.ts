import type { PlayerInterface } from '../types/playback.js';
import type { WsMessage, SyncPlayPayload, SyncPausePayload, SyncSeekPayload, SyncBufferStartPayload, SyncBufferEndPayload, ParticipantPermissions } from '../protocol/messages.js';
import { SYNC_MESSAGE_TYPE, SYNC_CONFIG } from '../protocol/constants.js';
import { createWsMessage } from '../protocol/messages.js';

export interface SyncEngineOptions {
  playerInterface: PlayerInterface;
  sendMessage: (msg: WsMessage) => void;
  getIsHost: () => boolean;
  getPermissions?: () => ParticipantPermissions;
  getParticipantInfo?: () => { participantId: string; displayName: string };
  onSyncStatusChange?: (status: 'synced' | 'syncing' | 'drifted') => void;
  onServerStateChange?: (positionMs: number, timestamp: number) => void;
  onBufferPauseChange?: (pausedBy: string | null) => void;
  onHostPauseChange?: (isPaused: boolean) => void;
}

export class SyncEngine {
  private player: PlayerInterface;
  private sendMessage: (msg: WsMessage) => void;
  private getIsHost: () => boolean;
  private getPermissions: () => ParticipantPermissions;
  private getParticipantInfo?: () => { participantId: string; displayName: string };
  private onSyncStatusChange?: (status: 'synced' | 'syncing' | 'drifted') => void;
  private onServerStateChange?: (positionMs: number, timestamp: number) => void;
  private onBufferPauseChange?: (pausedBy: string | null) => void;
  private onHostPauseChange?: (isPaused: boolean) => void;

  private lastServerPositionMs = 0;
  private lastServerTimestamp = 0;
  private isPlaying = false;
  private driftCheckTimer: ReturnType<typeof setInterval> | null = null;
  private lastSeekTime = 0;
  private correctionTimestamps: number[] = [];
  private destroyed = false;
  private isLocalBuffering = false;
  private bufferPauseActive = false;

  constructor(options: SyncEngineOptions) {
    this.player = options.playerInterface;
    this.sendMessage = options.sendMessage;
    this.getIsHost = options.getIsHost;
    this.getPermissions = options.getPermissions ?? (() => ({ canPlayPause: true, canSeek: true }));
    this.getParticipantInfo = options.getParticipantInfo;
    this.onSyncStatusChange = options.onSyncStatusChange;
    this.onServerStateChange = options.onServerStateChange;
    this.onBufferPauseChange = options.onBufferPauseChange;
    this.onHostPauseChange = options.onHostPauseChange;
  }

  requestPlay(): void {
    if (!this.getIsHost() && !this.getPermissions().canPlayPause) return;
    const positionMs = this.player.getPosition();
    if (this.getIsHost()) {
      this.player.play();
    }
    this.sendMessage(createWsMessage(SYNC_MESSAGE_TYPE.PLAY, {
      positionMs,
      serverTimestamp: 0,
    } satisfies SyncPlayPayload));
  }

  requestPause(): void {
    if (!this.getIsHost() && !this.getPermissions().canPlayPause) return;
    const positionMs = this.player.getPosition();
    if (this.getIsHost()) {
      this.player.pause();
    }
    this.sendMessage(createWsMessage(SYNC_MESSAGE_TYPE.PAUSE, {
      positionMs,
      serverTimestamp: 0,
    } satisfies SyncPausePayload));
  }

  reportBufferStart(): void {
    if (this.isLocalBuffering) return;

    const info = this.getParticipantInfo?.();
    if (!info) return;

    this.isLocalBuffering = true;
    this.sendMessage(createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_START, {
      participantId: info.participantId,
      displayName: info.displayName,
      positionMs: this.player.getPosition(),
    } satisfies SyncBufferStartPayload));
  }

  reportBufferEnd(): void {
    if (!this.isLocalBuffering) return;

    const info = this.getParticipantInfo?.();
    if (!info) return;

    this.isLocalBuffering = false;
    this.sendMessage(createWsMessage(SYNC_MESSAGE_TYPE.BUFFER_END, {
      participantId: info.participantId,
      positionMs: this.player.getPosition(),
    } satisfies SyncBufferEndPayload));
  }

  requestSeek(positionMs: number): void {
    if (!this.getIsHost() && !this.getPermissions().canSeek) return;
    if (this.getIsHost()) {
      this.player.seek(positionMs);
      this.lastSeekTime = Date.now();
    }
    this.sendMessage(createWsMessage(SYNC_MESSAGE_TYPE.SEEK, {
      positionMs,
      serverTimestamp: 0,
    } satisfies SyncSeekPayload));
  }

  handleSyncMessage(msg: WsMessage): void {
    if (this.destroyed) return;

    const payload = msg.payload as Record<string, unknown>;
    const isBufferPause = msg.type === SYNC_MESSAGE_TYPE.PAUSE && typeof payload.bufferPausedBy === 'string';

    // Host already applied optimistic local action — skip server echo
    // EXCEPT for buffer-related pause/play which all participants must process
    if (this.getIsHost()) {
      if (isBufferPause) {
        // Buffer pause is guest-initiated — host must process it
        this.handlePause(msg.payload as SyncPausePayload);
        this.onBufferPauseChange?.(payload.bufferPausedBy as string);
        this.bufferPauseActive = true;
        return;
      }
      if (msg.type === SYNC_MESSAGE_TYPE.PLAY && this.bufferPauseActive) {
        // Play after buffer recovery — host was paused by server, must resume
        this.handlePlay(msg.payload as SyncPlayPayload);
        this.onBufferPauseChange?.(null);
        this.bufferPauseActive = false;
        return;
      }
      // Normal host echo — skip
      return;
    }

    switch (msg.type) {
      case SYNC_MESSAGE_TYPE.PLAY:
        this.handlePlay(msg.payload as SyncPlayPayload);
        this.onBufferPauseChange?.(null);
        this.bufferPauseActive = false;
        break;
      case SYNC_MESSAGE_TYPE.PAUSE:
        this.handlePause(msg.payload as SyncPausePayload);
        if (isBufferPause) {
          this.onBufferPauseChange?.(payload.bufferPausedBy as string);
          this.bufferPauseActive = true;
        } else {
          this.onHostPauseChange?.(true);
        }
        break;
      case SYNC_MESSAGE_TYPE.SEEK:
        this.handleSeek(msg.payload as SyncSeekPayload);
        break;
    }
  }

  private handlePlay(payload: SyncPlayPayload): void {
    this.updateServerState(payload.positionMs, payload.serverTimestamp, true);

    const drift = Math.abs(this.player.getPosition() - payload.positionMs);
    if (drift > SYNC_CONFIG.SYNC_THRESHOLD_MS) {
      this.player.seek(payload.positionMs);
      this.lastSeekTime = Date.now();
    }
    this.player.play();
  }

  private handlePause(payload: SyncPausePayload): void {
    this.updateServerState(payload.positionMs, payload.serverTimestamp, false);

    this.player.pause();
    const drift = Math.abs(this.player.getPosition() - payload.positionMs);
    if (drift > SYNC_CONFIG.SYNC_THRESHOLD_MS) {
      this.player.seek(payload.positionMs);
      this.lastSeekTime = Date.now();
    }
  }

  private handleSeek(payload: SyncSeekPayload): void {
    const wasPlaying = this.isPlaying;
    this.updateServerState(payload.positionMs, payload.serverTimestamp, wasPlaying);

    this.player.seek(payload.positionMs);
    this.lastSeekTime = Date.now();
    if (wasPlaying) {
      this.player.play();
    }
  }

  private updateServerState(positionMs: number, serverTimestamp: number, isPlaying: boolean): void {
    this.lastServerPositionMs = positionMs;
    this.lastServerTimestamp = serverTimestamp;
    this.isPlaying = isPlaying;
    this.onServerStateChange?.(positionMs, serverTimestamp);
    this.onSyncStatusChange?.('synced');
  }

  startDriftMonitor(): void {
    if (this.driftCheckTimer) return;
    this.driftCheckTimer = setInterval(() => {
      this.checkDrift();
    }, SYNC_CONFIG.DRIFT_CHECK_INTERVAL_MS);
  }

  stopDriftMonitor(): void {
    if (this.driftCheckTimer) {
      clearInterval(this.driftCheckTimer);
      this.driftCheckTimer = null;
    }
  }

  private checkDrift(): void {
    // Host is source of truth — no self-correction needed
    if (this.getIsHost()) return;
    if (!this.isPlaying || this.lastServerTimestamp === 0) return;

    // Skip drift check if we just seeked
    if (Date.now() - this.lastSeekTime < SYNC_CONFIG.SEEK_SETTLE_MS) return;

    // Rate-limit corrections
    const now = Date.now();
    this.correctionTimestamps = this.correctionTimestamps.filter(
      (t) => now - t < SYNC_CONFIG.CORRECTION_WINDOW_MS,
    );
    if (this.correctionTimestamps.length >= SYNC_CONFIG.MAX_CORRECTIONS_PER_WINDOW) return;

    const expectedPosition = this.lastServerPositionMs + (now - this.lastServerTimestamp);
    const actualPosition = this.player.getPosition();
    const drift = Math.abs(actualPosition - expectedPosition);

    if (drift > SYNC_CONFIG.FORCE_SEEK_THRESHOLD_MS) {
      this.player.seek(expectedPosition);
      this.lastSeekTime = now;
      this.correctionTimestamps.push(now);
      this.onSyncStatusChange?.('drifted');
    } else if (drift > SYNC_CONFIG.SYNC_THRESHOLD_MS) {
      this.player.seek(expectedPosition);
      this.lastSeekTime = now;
      this.correctionTimestamps.push(now);
      this.onSyncStatusChange?.('syncing');
    } else {
      this.onSyncStatusChange?.('synced');
    }
  }

  applyLateJoinState(positionMs: number, isPlaying: boolean, lastUpdated: number): void {
    if (isPlaying) {
      const currentPosition = positionMs + (Date.now() - lastUpdated);
      this.player.seek(currentPosition);
      this.player.play();
      this.updateServerState(positionMs, lastUpdated, true);
    } else {
      this.player.seek(positionMs);
      this.updateServerState(positionMs, lastUpdated, false);
    }
    this.lastSeekTime = Date.now();
  }

  destroy(): void {
    this.destroyed = true;
    this.stopDriftMonitor();
  }
}
