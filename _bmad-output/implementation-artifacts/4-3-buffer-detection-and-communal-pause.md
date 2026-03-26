# Story 4.3: Buffer Detection & Communal Pause

Status: review

## Story

As a participant,
I want playback to pause for everyone when anyone buffers,
so that we stay on the same moment and no one misses anything.

## Acceptance Criteria (BDD)

1. **Given** any participant's stream begins buffering, **When** the buffer state is detected, **Then** the participant's client sends `sync:buffer-start` to the signaling server within < 1 second (NFR6), **And** the server broadcasts `sync:pause` to all participants with the buffering participant's name, **And** all participants see playback pause simultaneously.

2. **Given** the buffering participant's stream recovers, **When** sufficient buffer is available to resume, **Then** the participant's client sends `sync:buffer-end` to the server, **And** the server broadcasts `sync:play` to all participants, **And** all participants resume from the same position within 3-5 seconds of buffer start (NFR7).

3. **Given** playback is paused due to buffering, **When** the SyncStatusChip is visible, **Then** it displays "WAITING FOR [Name]..." in tertiary color with a pulsing tertiary dot (`tertiary_container/20` background), **And** when sync resumes, it transitions to "SYNCHRONIZED" with secondary color and pulsing secondary dot.

4. **Given** playback is manually paused by the host, **When** the SyncStatusChip is visible, **Then** it displays "PAUSED" with a static dot on `surface_container_high` background.

## Tasks / Subtasks

- [x] **Task 1: Add buffer message types to shared protocol** (AC: #1, #2)
  - [x] 1.1 Add `BUFFER_START: 'sync:buffer-start'` and `BUFFER_END: 'sync:buffer-end'` to `SYNC_MESSAGE_TYPE` in `packages/shared/src/protocol/constants.ts`
  - [x] 1.2 Define payload types in `packages/shared/src/protocol/messages.ts`:
    - `SyncBufferStartPayload`: `{ participantId: string; displayName: string; positionMs: number }`
    - `SyncBufferEndPayload`: `{ participantId: string; positionMs: number }`
  - [x] 1.3 Add discriminated union types `SyncBufferStartMessage` and `SyncBufferEndMessage`
  - [x] 1.4 Add `'sync:buffer-start'` and `'sync:buffer-end'` to `CLIENT_SYNC_MESSAGE_TYPES` and `SYNC_MESSAGE_TYPES` sets in `messages.ts`
  - [x] 1.5 Export new types from `packages/shared/src/protocol/index.ts`

- [x] **Task 2: Extend SyncStore with buffer-pause state** (AC: #1, #2, #3, #4)
  - [x] 2.1 Add fields to `SyncState` in `packages/shared/src/stores/sync-store.ts`:
    - `bufferPausedBy: string | null` (display name of participant causing buffer pause)
    - `pauseSource: 'host' | 'buffer' | null` (distinguish manual pause from buffer pause)
  - [x] 2.2 Add actions:
    - `setBufferPause: (displayName: string) => void` — sets `bufferPausedBy` and `pauseSource: 'buffer'`
    - `clearBufferPause: () => void` — clears `bufferPausedBy` and `pauseSource`
    - `setHostPause: () => void` — sets `pauseSource: 'host'`
  - [x] 2.3 Update `reset()` to clear new fields
  - [x] 2.4 Update sync-store tests

- [x] **Task 3: Implement server-side buffer handler** (AC: #1, #2)
  - [x] 3.1 Add buffer handling to `apps/server/src/sync/sync-handler.ts` (extend existing `createSyncHandler`)
  - [x] 3.2 Handle `sync:buffer-start`:
    - Validate sender is in a room (do NOT require host — any participant can buffer)
    - Look up sender's `displayName` from room participants
    - Update `room.playbackState.isPlaying = false`
    - Broadcast `sync:pause` to all participants with payload including `{ positionMs, serverTimestamp, bufferPausedBy: displayName }`
  - [x] 3.3 Handle `sync:buffer-end`:
    - Validate sender is in a room
    - Only resume if the sender is the participant who triggered the buffer pause (prevent race conditions with multiple bufferers)
    - Update `room.playbackState.isPlaying = true`
    - Broadcast `sync:play` to all participants with `{ positionMs, serverTimestamp }`
  - [x] 3.4 Track buffering participant on server Room: add `bufferingParticipantId: string | null` to `Room` interface in `apps/server/src/rooms/types.ts`
  - [x] 3.5 Write tests for buffer-start/end handling, including edge cases (multiple bufferers, buffer-end from wrong participant, participant leaves while buffering)

- [x] **Task 4: Add client-side buffer detection to SyncEngine** (AC: #1, #2)
  - [x] 4.1 Add `reportBufferStart()` method to `SyncEngine`:
    - Sends `sync:buffer-start` with current `positionMs` and participant info
    - Only sends if not already in buffer-pause state (debounce/guard)
  - [x] 4.2 Add `reportBufferEnd()` method to `SyncEngine`:
    - Sends `sync:buffer-end` with current `positionMs`
    - Only sends if we previously sent buffer-start (guard flag `isLocalBuffering`)
  - [x] 4.3 Extend `handleSyncMessage()` to handle incoming `sync:pause` with `bufferPausedBy` field:
    - Update SyncStore with `setBufferPause(displayName)` when `bufferPausedBy` is present
    - Update SyncStore with `setHostPause()` when `bufferPausedBy` is absent (manual host pause)
  - [x] 4.4 Extend `handleSyncMessage()` for `sync:play` after buffer:
    - Call `clearBufferPause()` on SyncStore when resuming
  - [x] 4.5 Add `SyncEngineOptions` callback: `onBufferPauseChange?: (pausedBy: string | null) => void`
  - [x] 4.6 Write unit tests for buffer detection in sync engine

- [x] **Task 5: Wire buffer detection in platform player hooks** (AC: #1, #2)
  - [x] 5.1 In `apps/web/src/features/player/hooks/use-playback-sync.ts`:
    - Monitor `playerInterface.getBufferState()` via existing HTML5 video `waiting`/`playing` events
    - When `isBuffering` transitions from `false → true`: call `syncEngine.reportBufferStart()`
    - When `isBuffering` transitions from `true → false`: call `syncEngine.reportBufferEnd()`
  - [x] 5.2 In `apps/mobile/src/features/player/hooks/use-playback-sync.ts`:
    - Same pattern: monitor expo-video buffer state changes
    - Wire `reportBufferStart()` / `reportBufferEnd()` on buffer state transitions
  - [x] 5.3 Subscribe to `sync:buffer-start` and `sync:buffer-end` message types in both hooks (add to existing subscription arrays)
  - [x] 5.4 Pass participant info (displayName, participantId) from roomStore to SyncEngine for buffer-start payloads

- [x] **Task 6: Create SyncStatusChip component** (AC: #3, #4)
  - [x] 6.1 Create `apps/web/src/features/player/components/sync-status-chip.tsx`:
    - Read `syncStatus`, `bufferPausedBy`, `pauseSource` from syncStore
    - Three visual states:
      - **Synchronized**: `secondary_container/20` bg, pulsing `secondary` dot, "SYNCHRONIZED" label
      - **Buffering**: `tertiary_container/20` bg, pulsing `tertiary` dot, "WAITING FOR [NAME]..." label (uppercase)
      - **Paused**: `surface_container_high` bg, static dot, "PAUSED" label
    - Pulsing dot animation: CSS `@keyframes pulse` scaling 1→1.5→1 with opacity
  - [x] 6.2 Create `apps/mobile/src/features/player/components/sync-status-chip.tsx`:
    - Same logic as web, using NativeWind/Tailwind classes
    - Pulsing animation via `react-native-reanimated` or simple Animated API
  - [x] 6.3 Export from `apps/web/src/features/player/index.ts` and `apps/mobile/src/features/player/index.ts`
  - [x] 6.4 Place SyncStatusChip in the player screen bottom area (it will be properly positioned in the GlassPlayerControls overlay in Story 4-4; for now, render it as a simple overlay at the bottom of the player)

- [x] **Task 7: Extend SyncPausePayload to carry buffer context** (AC: #1, #3)
  - [x] 7.1 Add optional `bufferPausedBy?: string` field to `SyncPausePayload` in `messages.ts`
  - [x] 7.2 Server populates this field when pause is triggered by buffer-start
  - [x] 7.3 Client reads this field to determine pause source (host vs buffer)
  - [x] 7.4 Existing host-initiated pause continues to omit this field (backward compatible)

- [x] **Task 8: Write comprehensive tests** (AC: #1, #2, #3, #4)
  - [x] 8.1 Unit tests for sync-engine buffer methods: reportBufferStart/End, guard flags, message emission
  - [x] 8.2 Server tests for buffer-start/end: validation, broadcast, room state update, multiple bufferer edge case, participant-leaves-while-buffering
  - [x] 8.3 Protocol tests: new message type guards, payload validation for buffer types
  - [x] 8.4 SyncStore tests: buffer pause state transitions, reset behavior
  - [x] 8.5 SyncStatusChip component tests: renders correct state for synced/buffering/paused
  - [x] 8.6 Ensure all existing tests still pass — zero regressions

## Dev Notes

### Architecture Compliance

- **Buffer messages flow through existing WebSocket**: `sync:buffer-start` and `sync:buffer-end` are client→server messages. The server translates them into existing `sync:pause` / `sync:play` broadcasts. This means guests' players react to the same pause/play mechanism already implemented in Story 4-2 — no new broadcast message types needed.
- **Any participant can trigger buffer pause**: Unlike play/pause/seek which are host-only, buffer detection is NOT host-gated. Any participant's client can send `sync:buffer-start`. The server validates the sender is in a room but does NOT check `hostId`.
- **Server tracks who is buffering**: `room.bufferingParticipantId` prevents race conditions when multiple participants buffer simultaneously. Only the first buffer-start triggers a pause; subsequent ones are noted but don't re-pause. Only the buffer-end from the participant who triggered the pause resumes playback.
- **SyncStore is the single source of truth**: The `pauseSource` field distinguishes host pauses from buffer pauses. The SyncStatusChip reads this field to display the correct UI state.

### Critical Reuse — DO NOT RECREATE

| Import | From | Purpose |
|--------|------|---------|
| `SyncEngine` | `@jellysync/shared` (sync/sync-engine.ts) | Extend with buffer methods — do NOT create new class |
| `SYNC_MESSAGE_TYPE` | `@jellysync/shared` (protocol/constants.ts) | Add BUFFER_START, BUFFER_END constants |
| `createWsMessage` | `@jellysync/shared` (protocol/messages.ts) | Message factory for buffer messages |
| `createSyncHandler` | `apps/server/src/sync/sync-handler.ts` | Extend with buffer handling — do NOT create new handler |
| `createSyncStore` / `SyncState` | `@jellysync/shared` (stores/sync-store.ts) | Extend existing store with buffer fields |
| `syncStore` | `../../lib/sync` (platform-specific) | Platform store instance |
| `roomStore` | `../../lib/room` (platform-specific) | Get displayName, participantId for buffer messages |
| `useWebSocket` / `subscribe` | Platform-specific shared hook | Subscribe to buffer message types |
| `PlayerInterface.getBufferState()` | `@jellysync/shared` (types/playback.ts) | Already returns `{ isBuffering, bufferedMs }` — use this |
| `useHtmlVideo` | Web features/player/hooks | Already tracks buffer state via HTML5 video events |
| `useVideoPlayer` | Mobile features/player/hooks | Already tracks buffer state via expo-video events |
| `broadcastToRoom` | Server ws-handler.ts | Existing broadcast function — reuse via deps injection |

### Server Buffer Handling Logic

```
On sync:buffer-start from participant P:
  1. Validate P is in a room
  2. If room.bufferingParticipantId is already set → ignore (someone else is already causing pause)
  3. Set room.bufferingParticipantId = P.id
  4. Set room.playbackState.isPlaying = false
  5. Broadcast sync:pause to all with { positionMs, serverTimestamp, bufferPausedBy: P.displayName }

On sync:buffer-end from participant P:
  1. Validate P is in a room
  2. If room.bufferingParticipantId !== P.id → ignore (not the one who triggered pause)
  3. Clear room.bufferingParticipantId = null
  4. Set room.playbackState.isPlaying = true
  5. Broadcast sync:play to all with { positionMs, serverTimestamp }

Edge case — buffering participant leaves room:
  - In existing handleRoomLeave/handleDisconnect, check if leaving participant is bufferingParticipantId
  - If so, clear bufferingParticipantId and broadcast sync:play to resume
```

### Client Buffer Detection Flow

```
PlayerInterface.getBufferState() → { isBuffering: true }
  ↓
usePlaybackSync detects isBuffering transition false→true
  ↓
syncEngine.reportBufferStart() → sends sync:buffer-start { participantId, displayName, positionMs }
  ↓
Server receives → broadcasts sync:pause { positionMs, serverTimestamp, bufferPausedBy: "Alice" }
  ↓
All clients receive sync:pause → SyncEngine.handleSyncMessage() → player.pause()
  ↓
SyncStore.setBufferPause("Alice") → SyncStatusChip shows "WAITING FOR ALICE..."

Buffer recovers:
  ↓
PlayerInterface.getBufferState() → { isBuffering: false }
  ↓
syncEngine.reportBufferEnd() → sends sync:buffer-end { participantId, positionMs }
  ↓
Server receives → broadcasts sync:play { positionMs, serverTimestamp }
  ↓
All clients receive sync:play → SyncEngine.handleSyncMessage() → player.play()
  ↓
SyncStore.clearBufferPause() → SyncStatusChip shows "SYNCHRONIZED"
```

### SyncStatusChip Visual Design

Per UX spec, three states:

| State | Background | Dot | Dot Animation | Label | Label Color |
|-------|-----------|-----|---------------|-------|-------------|
| Synchronized | `secondary_container/20` | `secondary` | Pulsing (scale 1→1.5→1) | "SYNCHRONIZED" | `secondary` |
| Buffering | `tertiary_container/20` | `tertiary` | Pulsing (scale 1→1.5→1) | "WAITING FOR [NAME]..." | `tertiary` |
| Paused | `surface_container_high` | `on_surface_variant` | Static (no animation) | "PAUSED" | `on_surface_variant` |

Chip anatomy: `[● LABEL]` — dot (2px circle) + uppercase label text in `Label Medium` (Inter 500-600).

### SyncPausePayload Extension

The existing `SyncPausePayload` (`{ positionMs, serverTimestamp }`) gains an optional `bufferPausedBy?: string` field. This is backward compatible:
- Host pause: `{ positionMs, serverTimestamp }` (no bufferPausedBy)
- Buffer pause: `{ positionMs, serverTimestamp, bufferPausedBy: "Alice" }`
- Client checks `payload.bufferPausedBy` to determine pause source

### Buffer Detection Debouncing

Video players can flicker between buffering/playing rapidly. To prevent spam:
- Add a guard flag `isLocalBuffering` on SyncEngine — only send `buffer-start` if not already sent
- Only send `buffer-end` if we previously sent `buffer-start`
- No timeout-based debounce needed — the server's `bufferingParticipantId` guard handles concurrent buffer events

### What This Story Does NOT Implement

- **GlassPlayerControls overlay** — Story 4-4 (SyncStatusChip is rendered as a standalone overlay for now)
- **Host permission enforcement** — Story 4-4
- **Seek bar, play/pause button** — Story 4-4
- **Subtitles** — Story 4-5
- **Stepped-away auto-pause** — Story 4-5
- **Voice chat / MicToggleFAB** — Epic 5

### File Structure

```
# NEW FILES
apps/web/src/features/player/components/sync-status-chip.tsx        # Web SyncStatusChip component
apps/mobile/src/features/player/components/sync-status-chip.tsx     # Mobile SyncStatusChip component

# MODIFIED FILES
packages/shared/src/protocol/constants.ts       # Add BUFFER_START, BUFFER_END to SYNC_MESSAGE_TYPE
packages/shared/src/protocol/messages.ts        # Add buffer payload types, extend SyncPausePayload, update type sets
packages/shared/src/protocol/index.ts           # Export new buffer types
packages/shared/src/stores/sync-store.ts        # Add bufferPausedBy, pauseSource, related actions
packages/shared/src/stores/sync-store.test.ts   # Tests for new store fields
packages/shared/src/sync/sync-engine.ts         # Add reportBufferStart/End, extend handleSyncMessage
packages/shared/src/sync/sync-engine.test.ts    # Tests for buffer detection
apps/server/src/rooms/types.ts                  # Add bufferingParticipantId to Room
apps/server/src/sync/sync-handler.ts            # Add buffer-start/end handlers
apps/server/src/sync/sync-handler.test.ts       # Tests for buffer handling
apps/server/src/signaling/ws-handler.ts         # Handle participant-leaves-while-buffering edge case
apps/web/src/features/player/hooks/use-playback-sync.ts     # Wire buffer detection, subscribe to buffer messages
apps/web/src/features/player/index.ts           # Export SyncStatusChip
apps/web/src/routes/player.tsx                  # Render SyncStatusChip overlay
apps/mobile/src/features/player/hooks/use-playback-sync.ts  # Wire buffer detection, subscribe to buffer messages
apps/mobile/src/features/player/index.ts        # Export SyncStatusChip
apps/mobile/app/player.tsx                      # Render SyncStatusChip overlay
```

### Testing Standards

- Co-locate tests: `sync-engine.test.ts` next to `sync-engine.ts`
- Use vitest (already configured)
- Mock `PlayerInterface.getBufferState()` for buffer detection tests
- Server tests: mock `broadcastToRoom`, test buffer-start/end flows including edge cases
- Component tests: verify SyncStatusChip renders correct visual state per store values
- Target: zero regressions on existing 249 tests

### Anti-Patterns to Avoid

- DO NOT create a separate handler file for buffer messages — extend `createSyncHandler` in existing `sync-handler.ts`
- DO NOT create a new Zustand store for buffer state — extend existing `SyncStore`
- DO NOT use `setTimeout`-based debounce for buffer detection — use a simple boolean guard flag
- DO NOT send buffer-start/end via a different WebSocket connection — use existing `useWs()` / `send()`
- DO NOT bypass server for buffer pause — all buffer events go through server for authoritative state
- DO NOT use `.ts` extensions in imports — use `.js` per ESM convention
- DO NOT use `any` type — type all buffer messages and payloads
- DO NOT create a `utils.ts` grab-bag file
- DO NOT use `useMovieStore()` hook pattern — use `useStore(store, selector)` with specific selectors
- DO NOT implement GlassPlayerControls or seek bar — that's Story 4-4

### Previous Story Intelligence

**Story 4-2 (Sync Engine & Playback Coordination) established:**
- `SyncEngine` class in `packages/shared/src/sync/sync-engine.ts` — extend this, don't replace
- Host echo guard pattern: `if (this.getIsHost()) return;` in `handleSyncMessage()` — buffer messages are different: ALL participants process them (including host), since any participant can trigger buffer pause
- `onSyncStatusChange` callback pattern — follow this for the new `onBufferPauseChange` callback
- Server `getValidatedRoom()` validates sender is host — for buffer messages, create a variant that validates sender is in room WITHOUT requiring host
- `isClientSyncMessageType()` set in `messages.ts` needs `buffer-start` and `buffer-end` added for ws-handler routing
- All 249 tests passing (203 shared + 46 server)

**Story 4-1 (Video Player Foundation) established:**
- `PlayerInterface.getBufferState()` returns `{ isBuffering: boolean; bufferedMs: number }` — this is the source of truth for buffer detection on each platform
- `useHtmlVideo` hook already tracks `isBuffering` state from HTML5 video `waiting`/`playing` events
- `useVideoPlayer` hook already tracks buffer state from expo-video events
- `SyncStore` already has `isBuffering` and `bufferProgress` fields — these track local player buffer state; the new `bufferPausedBy` / `pauseSource` track the communal pause state

**Key lesson from Story 4-2:** The host echo guard (`if (this.getIsHost()) return`) prevents the host from double-processing their own sync messages. For buffer events, this guard must NOT be applied — if the host's player is buffering, they still need to process the server's sync:pause broadcast (even though their player is already paused, they need the SyncStore updated for the SyncStatusChip).

### Git Intelligence

Recent commits follow `feat:` prefix convention with `with code review fixes` appended when applicable. Tests included in feature commits. Changes span server + shared + web + mobile in single commits.

### Project Structure Notes

- No new directories needed — all files go in existing feature directories
- SyncStatusChip components go in existing `features/player/components/` directories (created in Story 4-1)
- File naming: kebab-case (`sync-status-chip.tsx`)

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 4, Story 4.3]
- [Source: _bmad-output/planning-artifacts/architecture.md - Sync Engine, WebSocket Protocol, Server State Management]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - SyncStatusChip, Communal Buffering, Sacred Screen]
- [Source: packages/shared/src/sync/sync-engine.ts - Existing SyncEngine class to extend]
- [Source: packages/shared/src/protocol/constants.ts - SYNC_MESSAGE_TYPE, SYNC_CONFIG]
- [Source: packages/shared/src/protocol/messages.ts - WsMessage, SyncPausePayload, createWsMessage]
- [Source: packages/shared/src/stores/sync-store.ts - Existing SyncStore to extend]
- [Source: packages/shared/src/types/playback.ts - PlayerInterface, BufferState]
- [Source: apps/server/src/sync/sync-handler.ts - Existing sync handler to extend]
- [Source: apps/server/src/rooms/types.ts - Room interface to extend]
- [Source: apps/server/src/signaling/ws-handler.ts - Message routing, broadcastToRoom, disconnect handling]
- [Source: _bmad-output/implementation-artifacts/4-2-sync-engine-and-playback-coordination.md - Previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- Implemented buffer detection and communal pause across all layers (shared protocol, server, client, UI)
- Added `sync:buffer-start` and `sync:buffer-end` message types to shared protocol constants and message types
- Extended `SyncPausePayload` with optional `bufferPausedBy` field for backward-compatible buffer context
- Added `bufferPausedBy`, `pauseSource`, and related actions to SyncStore
- Server-side buffer handler validates any participant (not host-only), tracks `bufferingParticipantId` on Room to prevent race conditions with multiple bufferers
- Edge case handled: buffering participant leaves room — server auto-resumes playback for remaining participants
- SyncEngine extended with `reportBufferStart()`/`reportBufferEnd()` with boolean guard flag for debouncing
- Host echo guard bypassed for buffer-related pause messages — all participants (including host) process buffer pause/play
- Platform hooks (web + mobile) monitor `isBuffering` transitions from syncStore and call sync engine accordingly
- SyncStatusChip created for web (CSS animations) and mobile (react-native Animated API) with three visual states: Synchronized, Buffering ("WAITING FOR [NAME]..."), and Paused
- 295 total tests (233 shared + 62 server), up from 249 — zero regressions
- TypeScript type-check clean across entire project

### Change Log

- 2026-03-26: Story 4.3 implementation complete — buffer detection and communal pause with SyncStatusChip

### File List

New files:
- apps/web/src/features/player/components/sync-status-chip.tsx
- apps/mobile/src/features/player/components/sync-status-chip.tsx

Modified files:
- packages/shared/src/protocol/constants.ts
- packages/shared/src/protocol/messages.ts
- packages/shared/src/protocol/index.ts
- packages/shared/src/stores/sync-store.ts
- packages/shared/src/stores/sync-store.test.ts
- packages/shared/src/sync/sync-engine.ts
- packages/shared/src/sync/sync-engine.test.ts
- packages/shared/src/protocol/sync-messages.test.ts
- apps/server/src/rooms/types.ts
- apps/server/src/rooms/room-manager.ts
- apps/server/src/sync/sync-handler.ts
- apps/server/src/sync/sync-handler.test.ts
- apps/server/src/signaling/ws-handler.ts
- apps/web/src/features/player/hooks/use-playback-sync.ts
- apps/web/src/features/player/index.ts
- apps/web/src/routes/player.tsx
- apps/mobile/src/features/player/hooks/use-playback-sync.ts
- apps/mobile/src/features/player/index.ts
- apps/mobile/app/player.tsx
