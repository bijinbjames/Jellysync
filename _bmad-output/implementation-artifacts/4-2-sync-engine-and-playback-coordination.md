# Story 4.2: Sync Engine & Playback Coordination

Status: done

## Story

As a participant,
I want all participants to see the same frame at the same time,
so that we're truly watching together and can react to the same moments.

## Acceptance Criteria (BDD)

1. **Given** the sync engine is implemented in `packages/shared/src/sync/`, **When** the host starts playback, **Then** a `sync:play` message is sent to the signaling server with the server-authoritative timestamp, **And** the server broadcasts `sync:play` to all participants, **And** all participants begin playback at the same position, **And** playback sync drift between any two participants stays < 500ms (NFR1).

2. **Given** the host pauses playback, **When** a `sync:pause` message is sent, **Then** all participants pause within < 200ms of the command (NFR2), **And** all participants see the same paused frame.

3. **Given** the host seeks to a new position, **When** a `sync:seek` message is sent with the target timestamp, **Then** all participants seek to the target position within < 200ms (NFR2), **And** playback resumes in sync from the new position.

4. **Given** a late joiner enters an active session, **When** the participant joins, **Then** the server sends the current playback position in the `room:state` message, **And** the late joiner's player starts at the current timestamp (FR12), **And** sync drift from existing participants is < 500ms within 3 seconds of joining.

5. **Given** the sync engine detects drift exceeding 500ms, **When** a participant falls behind or ahead, **Then** the sync engine performs a micro-correction (seek adjustment) to bring the participant back in sync, **And** the correction is invisible to the user — no pause or stutter.

## Tasks / Subtasks

- [x] **Task 1: Add sync message types to shared protocol** (AC: #1, #2, #3)
  - [x] 1.1 Add `sync:play`, `sync:pause`, `sync:seek` to `ROOM_MESSAGE_TYPE` in `packages/shared/src/protocol/constants.ts`
  - [x] 1.2 Add `sync:state` server→client broadcast type for periodic state sync
  - [x] 1.3 Define payload types in `packages/shared/src/protocol/messages.ts`:
    - `SyncPlayPayload`: `{ positionMs: number; serverTimestamp: number }`
    - `SyncPausePayload`: `{ positionMs: number; serverTimestamp: number }`
    - `SyncSeekPayload`: `{ positionMs: number; serverTimestamp: number }`
    - `SyncStatePayload`: `{ positionMs: number; isPlaying: boolean; serverTimestamp: number }`
  - [x] 1.4 Add `isSyncMessage()` type guard and `isValidSyncMessageType()` validator
  - [x] 1.5 Export new types and constants from `packages/shared/src/protocol/index.ts`

- [x] **Task 2: Add playback state to server Room object** (AC: #1, #2, #3, #4)
  - [x] 2.1 Extend `Room` interface in `apps/server/src/rooms/room-manager.ts` with:
    - `playbackState: { positionMs: number; isPlaying: boolean; lastUpdated: number } | null`
  - [x] 2.2 Initialize `playbackState` to `null` on room creation
  - [x] 2.3 Update `roomToStatePayload()` in `ws-handler.ts` to include `playbackState` in `room:state` messages (for late joiners, AC #4)
  - [x] 2.4 Extend `RoomStatePayload` in `messages.ts` to include optional `playback` field

- [x] **Task 3: Implement server-side sync handler** (AC: #1, #2, #3)
  - [x] 3.1 Create `apps/server/src/sync/sync-handler.ts`
  - [x] 3.2 Handle `sync:play`: validate sender is host (or has permission), update Room `playbackState`, broadcast `sync:play` to all room participants with `serverTimestamp = Date.now()`
  - [x] 3.3 Handle `sync:pause`: validate sender, update Room `playbackState.isPlaying = false`, broadcast `sync:pause` to all
  - [x] 3.4 Handle `sync:seek`: validate sender, update Room `playbackState.positionMs`, broadcast `sync:seek` to all
  - [x] 3.5 Register sync message handlers in `ws-handler.ts` message routing (follow existing pattern: check message type, delegate to handler)

- [x] **Task 4: Create client-side sync engine** (AC: #1, #2, #3, #5)
  - [x] 4.1 Create `packages/shared/src/sync/sync-engine.ts` with:
    - `SyncEngine` class or set of pure functions
    - Constructor/init takes: `playerInterface: PlayerInterface`, `sendMessage: (msg) => void`, `getIsHost: () => boolean`
    - Exposes: `handleSyncMessage(msg)`, `requestPlay()`, `requestPause()`, `requestSeek(positionMs)`, `startDriftMonitor()`, `stopDriftMonitor()`, `destroy()`
  - [x] 4.2 Implement `requestPlay()`: if host, send `sync:play` with current position; apply optimistic local play immediately
  - [x] 4.3 Implement `requestPause()`: if host, send `sync:pause` with current position; apply optimistic local pause immediately
  - [x] 4.4 Implement `requestSeek(positionMs)`: if host, send `sync:seek` with target position; apply optimistic local seek immediately
  - [x] 4.5 Implement `handleSyncMessage(msg)`:
    - `sync:play`: call `playerInterface.play()`, seek to `positionMs` if drift > threshold
    - `sync:pause`: call `playerInterface.pause()`, seek to `positionMs` if needed
    - `sync:seek`: call `playerInterface.seek(positionMs)`, then `playerInterface.play()` if was playing
  - [x] 4.6 Create `packages/shared/src/sync/index.ts` barrel export

- [x] **Task 5: Implement drift detection and micro-correction** (AC: #5)
  - [x] 5.1 Add drift monitor to sync engine: periodic check (every 2-3 seconds) comparing local position to last known server position
  - [x] 5.2 Calculate drift: `localPosition - expectedPosition` where expectedPosition = `serverPositionMs + (Date.now() - serverTimestamp)`
  - [x] 5.3 If `|drift| > 500ms` (SYNC_THRESHOLD_MS): perform micro-seek correction to expected position
  - [x] 5.4 If `|drift| > 2000ms`: force seek (larger jumps indicate serious desync, e.g., after tab backgrounding)
  - [x] 5.5 Add `SYNC_THRESHOLD_MS = 500` and `DRIFT_CHECK_INTERVAL_MS = 2000` to sync constants
  - [x] 5.6 Track correction count to avoid infinite correction loops (max 3 corrections per 10s window)

- [x] **Task 6: Create platform-specific `usePlaybackSync` hooks** (AC: #1, #2, #3, #4, #5)
  - [x] 6.1 Create `apps/web/src/features/player/hooks/use-playback-sync.ts`
    - Initialize sync engine with web PlayerInterface from `useHtmlVideo`
    - Subscribe to sync messages via `useWs().subscribe('sync:*')`
    - Wire `requestPlay/Pause/Seek` for host controls
    - Start drift monitor on mount, stop on unmount
    - Handle late join: on mount, if `room:state` includes playback position, seek to it and play
  - [x] 6.2 Create `apps/mobile/src/features/player/hooks/use-playback-sync.ts`
    - Same pattern as web, using mobile PlayerInterface from `useVideoPlayer`
    - Wire expo-video player controls through sync engine
  - [x] 6.3 Integrate hooks into player screens:
    - `apps/web/src/routes/player.tsx`: add `usePlaybackSync` hook, pass PlayerInterface
    - `apps/mobile/app/player.tsx`: add `usePlaybackSync` hook, pass PlayerInterface

- [x] **Task 7: Implement late-joiner sync** (AC: #4)
  - [x] 7.1 Server: when sending `room:state` to joining participant, include current `playbackState` (position extrapolated to join time if playing)
  - [x] 7.2 Client: in `usePlaybackSync`, on initial mount check if room has active playback state
  - [x] 7.3 If playback is active: calculate current position = `serverPositionMs + (Date.now() - serverTimestamp)`, seek to position, auto-play
  - [x] 7.4 If playback is paused: seek to paused position, remain paused

- [x] **Task 8: Extend `useSyncStore` with sync engine state** (AC: #1, #5)
  - [x] 8.1 Add to `SyncState`: `syncStatus: 'synced' | 'syncing' | 'drifted'`, `lastServerTimestamp: number`, `lastServerPosition: number`
  - [x] 8.2 Add actions: `setSyncStatus()`, `setServerState(positionMs, timestamp)`
  - [x] 8.3 Sync engine updates these fields on every sync message and drift check

- [x] **Task 9: Write tests** (AC: #1, #2, #3, #4, #5)
  - [x] 9.1 Unit tests for `sync-engine.ts`: test requestPlay/Pause/Seek emit correct messages, handleSyncMessage calls correct PlayerInterface methods, drift detection triggers correction
  - [x] 9.2 Unit tests for server `sync-handler.ts`: test message routing, playback state updates, broadcast to room
  - [x] 9.3 Unit tests for sync protocol types: type guards, payload validation
  - [x] 9.4 Integration test for `use-playback-sync.ts` (web): verify sync messages are processed and player methods called
  - [x] 9.5 Ensure all existing tests still pass (232 tests, zero regressions)

## Dev Notes

### Architecture Compliance

- **Sync engine location**: `packages/shared/src/sync/` — platform-agnostic TypeScript. NO React imports, NO DOM, NO React Native. Pure logic consumable by both platforms.
- **Server sync handler**: `apps/server/src/sync/sync-handler.ts` — follows same pattern as `ws-handler.ts` message delegation.
- **Server is authoritative**: Clients send intents (e.g., `sync:play`), server validates and broadcasts confirmed state with `serverTimestamp`. Clients NEVER directly tell other clients what to do.
- **Optimistic UI**: Host applies local play/pause/seek immediately (< 100ms feedback per NFR), then server confirms and broadcasts to others.
- **Store pattern**: Extend existing `useSyncStore` — do NOT create a new store. Follow same `zustand/vanilla` `createStore()` pattern.
- **WebSocket message format**: `{ type: 'sync:play', payload: { positionMs: number, serverTimestamp: number }, timestamp: number }` — follow existing `WsMessage<T>` generic pattern in `messages.ts`.

### Critical Reuse — DO NOT RECREATE

| Import | From | Purpose |
|--------|------|---------|
| `WsMessage<T>`, `createWsMessage` | `@jellysync/shared` (protocol/messages.ts) | Base message type and factory |
| `ROOM_MESSAGE_TYPE` | `@jellysync/shared` (protocol/constants.ts) | Extend with sync message types |
| `isWsMessage()` | `@jellysync/shared` (protocol/messages.ts) | Message validation |
| `PlayerInterface`, `BufferState`, `PlaybackStatus` | `@jellysync/shared` (types/playback.ts) | Player control interface — already defined in Story 4-1 |
| `createSyncStore` / `SyncState` | `@jellysync/shared` (stores/sync-store.ts) | Extend existing store, do NOT create new one |
| `syncStore` | `../../lib/sync` (platform-specific) | Platform store instance |
| `useWs()` | `../../shared/hooks/use-websocket` | WebSocket send/subscribe — existing hook |
| `roomStore` | `../../lib/room` (platform-specific) | Room state for isHost, participantId |
| `broadcastToRoom()` | Server ws-handler.ts | Broadcast pattern — reuse or import |
| `roomManager` | Server rooms/room-manager.ts | Room lookup, participant validation |
| `useHtmlVideo` | Web features/player/hooks/use-html-video.ts | Web PlayerInterface — Story 4-1 |
| `useVideoPlayer` | Mobile features/player/hooks/use-video-player.ts | Mobile PlayerInterface — Story 4-1 |

### WebSocket Protocol Extension Pattern

The existing protocol in `packages/shared/src/protocol/` uses:
- `ROOM_MESSAGE_TYPE` object in `constants.ts` for type string constants
- `WsMessage<T>` generic in `messages.ts` for typed messages
- `createWsMessage(type, payload)` factory function
- `isWsMessage()` type guard for runtime validation
- Discriminated union: `type WsMessageType = ... | SyncPlayMessage | ...`

Follow this EXACTLY. Add sync types to the same files — do NOT create separate protocol files.

### Server Message Handling Pattern

In `apps/server/src/signaling/ws-handler.ts`, messages are routed via:
```
if (isRoomMessage(parsed.type)) { handleRoomMessage(...) }
// ADD: if (isSyncMessage(parsed.type)) { handleSyncMessage(...) }
```

The `broadcastToRoom(room, message)` function:
- Takes a Room object and either a message or a payload builder function
- Iterates `room.participants`, looks up each WebSocket connection via `participantToConnection` map
- Sends to each connected participant (checks `readyState === WebSocket.OPEN`)

For sync broadcasts, use the same `broadcastToRoom()` — pass the sync message directly.

### Drift Detection Algorithm

```
expectedPosition = lastServerPositionMs + (Date.now() - lastServerTimestamp)
actualPosition = playerInterface.getPosition()
drift = actualPosition - expectedPosition

if (|drift| > SYNC_THRESHOLD_MS && |drift| < FORCE_SEEK_THRESHOLD_MS):
  playerInterface.seek(expectedPosition)  // micro-correction
if (|drift| > FORCE_SEEK_THRESHOLD_MS):
  playerInterface.seek(expectedPosition)  // force correction
```

Key considerations:
- Only run drift checks when `isPlaying === true`
- Skip drift check immediately after a seek (allow 1-2 seconds settle time)
- Track correction count: max 3 corrections per 10-second window to prevent oscillation
- `Date.now()` is good enough for < 500ms tolerance (no NTP sync needed for this MVP)

### Late Joiner Flow

1. Client joins room → server sends `room:state` with `playback: { positionMs, isPlaying, lastUpdated }`
2. `usePlaybackSync` hook on mount reads playback state from room:state
3. If `isPlaying`: calculate `currentPosition = positionMs + (Date.now() - lastUpdated)`, seek there, auto-play
4. If `!isPlaying`: seek to `positionMs`, stay paused
5. Drift monitor kicks in immediately, corrects within 3 seconds to < 500ms

### Timestamps — All Unix Milliseconds

Per architecture: "No ISO strings in WebSocket messages — numbers only for sync precision." All `positionMs`, `serverTimestamp`, and `lastUpdated` fields are `number` (Unix ms from `Date.now()`).

### What This Story Does NOT Implement

- **Buffer-triggered communal pause** — Story 4-3 (sync:buffer-start/end messages)
- **SyncStatusChip UI** — Story 4-3
- **Player controls UI** (GlassPlayerControls) — Story 4-4
- **Host permission enforcement UI** — Story 4-4
- **Keyboard shortcuts** — Story 4-4
- **Subtitles** — Story 4-5
- **Stepped-away auto-pause** — Story 4-5
- **Voice chat** — Epic 5

For now, the sync engine handles play/pause/seek from the host only. Buffer and permission logic are added in later stories. The host controls playback programmatically (e.g., the existing "Change Movie" button flow or auto-play on movie select). Story 4-4 adds the visual controls.

### File Structure

```
# NEW FILES
packages/shared/src/sync/sync-engine.ts        # Client-side sync logic
packages/shared/src/sync/sync-engine.test.ts    # Sync engine unit tests
packages/shared/src/sync/index.ts               # Barrel export
apps/server/src/sync/sync-handler.ts            # Server-side sync message handling
apps/server/src/sync/sync-handler.test.ts       # Server sync handler tests
apps/web/src/features/player/hooks/use-playback-sync.ts      # Web sync hook
apps/mobile/src/features/player/hooks/use-playback-sync.ts   # Mobile sync hook

# MODIFIED FILES
packages/shared/src/protocol/constants.ts       # Add SYNC_MESSAGE_TYPE constants
packages/shared/src/protocol/messages.ts        # Add sync payload types, type guards
packages/shared/src/protocol/index.ts           # Export sync types
packages/shared/src/stores/sync-store.ts        # Add syncStatus, serverState fields
packages/shared/src/stores/sync-store.test.ts   # Update tests for new fields
apps/server/src/signaling/ws-handler.ts         # Route sync messages to handler
apps/server/src/rooms/room-manager.ts           # Add playbackState to Room
apps/web/src/routes/player.tsx                  # Integrate usePlaybackSync
apps/mobile/app/player.tsx                      # Integrate usePlaybackSync
```

### Testing Standards

- Co-locate tests: `sync-engine.test.ts` next to `sync-engine.ts`
- Use vitest (already configured for shared package and web app)
- Mock `PlayerInterface` for sync engine tests (mock play/pause/seek/getPosition/getBufferState)
- Mock WebSocket send for message emission tests
- Server tests: mock broadcastToRoom and room lookup
- Always include `afterEach(cleanup)` in React component/hook tests
- Participant test data needs `joinedAt` field per type definition
- Target: zero regressions on existing 232 tests

### Anti-Patterns to Avoid

- DO NOT create a separate WebSocket connection for sync — reuse existing `useWs()` connection
- DO NOT put sync logic in React components — extract to `sync-engine.ts` (pure logic) and `usePlaybackSync` hooks
- DO NOT use `setInterval` for position broadcasting from clients — server is authoritative, clients only send intents
- DO NOT implement P2P sync between clients — all sync flows through server
- DO NOT use `any` type — type all sync messages and payloads
- DO NOT use `.ts` extensions in imports — use `.js` per ESM convention
- DO NOT use `useMovieStore()` hook pattern — use `useStore(store, selector)` with specific selectors
- DO NOT create a utils.ts grab-bag file
- DO NOT implement sync:buffer-start/end messages — that's Story 4-3
- DO NOT implement permission checking on the client — that's Story 4-4 (for now, only host sends sync commands)
- DO NOT add HLS.js or adaptive bitrate switching — keep direct stream from Story 4-1

### Previous Story Intelligence

**Story 4-1 (Video Player Foundation) established:**
- `PlayerInterface` with `play()`, `pause()`, `seek(positionMs)`, `getPosition()`, `getBufferState()` — the sync engine consumes this interface directly
- `useSyncStore` with `playbackPosition`, `duration`, `isPlaying`, `isBuffering`, `bufferProgress`, `playbackRate` — extend, don't replace
- Both platform hooks (`useHtmlVideo`, `useVideoPlayer`) already update `syncStore` on local playback events
- Platform-specific lib instantiation pattern: `apps/{platform}/src/lib/sync.ts` creates store instance
- Stream URLs are client-side via `buildStreamUrl()` — sync engine has no involvement with stream URLs
- 232 tests passing (155 shared + 27 web + 34 server + 16 UI)

**Epic 3 retro lessons to apply:**
- Foundation-first: This story IS the sync foundation. Get the protocol and drift detection right, and Stories 4-3 through 4-5 layer on top cleanly.
- Component duplication is acceptable: Web and mobile `usePlaybackSync` hooks are separate implementations (they wire different player hooks to the shared sync engine).

### Git Intelligence

Recent commit: `355bf5b feat: implement video player foundation with code review fixes (Story 4-1)` — 25 files changed, 1372 insertions. Convention: `feat:` prefix, tests included in feature commits, code review fixes bundled.

### Project Structure Notes

- `packages/shared/src/sync/` directory is NEW but prescribed in architecture.md
- `apps/server/src/sync/` directory is NEW but prescribed in architecture.md
- Both player hooks (`use-playback-sync.ts`) go in existing `features/player/hooks/` directories created in Story 4-1
- File naming: kebab-case throughout (e.g., `sync-engine.ts`, `sync-handler.ts`, `use-playback-sync.ts`)

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 4, Story 4.2]
- [Source: _bmad-output/planning-artifacts/architecture.md - API & Communication Patterns, WebSocket Protocol Rules, Sync Engine, Project Structure]
- [Source: _bmad-output/planning-artifacts/prd.md - FR12, FR16-FR20, NFR1, NFR2]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - SyncStatusChip, Sacred Screen]
- [Source: packages/shared/src/protocol/messages.ts - WsMessage, createWsMessage, ROOM_MESSAGE_TYPE]
- [Source: packages/shared/src/protocol/constants.ts - Message type constants pattern]
- [Source: packages/shared/src/stores/sync-store.ts - Existing sync store to extend]
- [Source: packages/shared/src/types/playback.ts - PlayerInterface, BufferState, PlaybackStatus]
- [Source: apps/server/src/signaling/ws-handler.ts - broadcastToRoom, message routing pattern]
- [Source: apps/server/src/rooms/room-manager.ts - Room interface, room lookup]
- [Source: apps/web/src/shared/hooks/use-websocket.ts - useWs hook, subscribe pattern]
- [Source: apps/web/src/features/player/hooks/use-html-video.ts - Web PlayerInterface]
- [Source: apps/mobile/src/features/player/hooks/use-video-player.ts - Mobile PlayerInterface]
- [Source: _bmad-output/implementation-artifacts/4-1-video-player-foundation.md - Previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Two drift detection test failures fixed: mock return values needed to account for total elapsed fake-timer time before drift check fires.

### Completion Notes List

- **Task 1**: Added `SYNC_MESSAGE_TYPE` constants (play/pause/seek/state), `SYNC_CONFIG` constants, sync payload types (`SyncPlayPayload`, `SyncPausePayload`, `SyncSeekPayload`, `SyncStatePayload`), `PlaybackStatePayload` for room:state, discriminated union types, `isSyncMessage()`, `isValidSyncMessageType()`, `isClientSyncMessageType()` type guards. All exported from protocol barrel.
- **Task 2**: Extended `Room` interface with `playbackState: PlaybackState | null`, initialized to null in `createRoom()`. Updated `roomToStatePayload()` to include playback state in room:state messages for late joiners.
- **Task 3**: Created `sync-handler.ts` with `createSyncHandler()` factory. Handles sync:play/pause/seek messages: validates sender is host, updates Room playbackState, broadcasts to all room participants with server-authoritative timestamp. Integrated into ws-handler.ts message routing via `isClientSyncMessageType()` check.
- **Task 4**: Created `SyncEngine` class in `packages/shared/src/sync/`. Pure TypeScript, no framework dependencies. Exposes `requestPlay/Pause/Seek()` (host-only, optimistic UI), `handleSyncMessage()`, `startDriftMonitor()`, `stopDriftMonitor()`, `applyLateJoinState()`, `destroy()`. Callbacks for sync status and server state changes.
- **Task 5**: Drift detection integrated into SyncEngine. Periodic checks every 2s, compares local position to extrapolated server position. Micro-seek correction for drift >500ms, force seek for >2000ms. Rate-limited to 3 corrections per 10s window. Skips checks during seek settle period (2s).
- **Task 6**: Created `usePlaybackSync` hooks for both web and mobile. Wire SyncEngine to platform-specific PlayerInterface, subscribe to sync messages via useWebSocket, handle late-join via room:state subscription. Integrated into player screens.
- **Task 7**: Late-joiner logic in SyncEngine.applyLateJoinState(): extrapolates current position from server state timestamp, seeks and auto-plays if session is active. Hook listens for room:state messages with playback data on mount.
- **Task 8**: Extended `SyncStore` with `syncStatus`, `lastServerTimestamp`, `lastServerPosition` fields and `setSyncStatus()`, `setServerState()` actions. All reset to initial values on `reset()`.
- **Task 9**: 17 new tests added (12 sync-engine, 12 sync-messages type guards, 15 sync-handler server, 7 sync-store extension). All 249 tests pass (203 shared + 46 server), zero regressions from 232 baseline.

### Change Log

- 2026-03-25: Implemented sync engine and playback coordination (Story 4-2). Added sync protocol types, server-side sync handler, client-side sync engine with drift detection, platform-specific usePlaybackSync hooks, late-joiner sync, and extended sync store. 249 tests passing.

### File List

**New files:**
- packages/shared/src/sync/sync-engine.ts
- packages/shared/src/sync/sync-engine.test.ts
- packages/shared/src/sync/index.ts
- packages/shared/src/protocol/sync-messages.test.ts
- apps/server/src/sync/sync-handler.ts
- apps/server/src/sync/sync-handler.test.ts
- apps/web/src/features/player/hooks/use-playback-sync.ts
- apps/mobile/src/features/player/hooks/use-playback-sync.ts

**Modified files:**
- packages/shared/src/protocol/constants.ts
- packages/shared/src/protocol/messages.ts
- packages/shared/src/protocol/index.ts
- packages/shared/src/stores/sync-store.ts
- packages/shared/src/stores/sync-store.test.ts
- packages/shared/src/stores/index.ts
- packages/shared/src/index.ts
- apps/server/src/rooms/types.ts
- apps/server/src/rooms/room-manager.ts
- apps/server/src/rooms/index.ts
- apps/server/src/signaling/ws-handler.ts
- apps/web/src/features/player/index.ts
- apps/web/src/routes/player.tsx
- apps/mobile/src/features/player/index.ts
- apps/mobile/app/player.tsx
