# Story 2.5: Room Lifecycle & Host Transfer

Status: done

## Story

As a participant,
I want rooms to persist while people are in them and the host role to transfer seamlessly,
so that the watch session is resilient to disconnections and exits.

## Acceptance Criteria

1. **Participant Exit**: Given a room has multiple participants, when a participant taps exit, then the participant is removed from the room, remaining participants see the ParticipantChip removed from the lobby, and no confirmation dialog is shown — exit is immediate.

2. **Host Transfer**: Given the host disconnects or exits the room, when other participants remain, then the host role automatically transfers to another participant (first in join order by `joinedAt`), the new host's ParticipantChip updates to show "(Host)" suffix, and all participants receive a `room:state` update reflecting the new host.

3. **Room Destruction**: Given a room has active participants, when the last participant exits, then the room is destroyed on the server, and the ephemeral room code is released and can no longer be used to join.

4. **Late Joiner State Sync**: Given a participant joins a room that is already active, when the late joiner enters, then the server sends full current room state (participant list, host ID, current playback timestamp if playing), the late joiner's lobby reflects the accurate current state, and existing participants see the late joiner's ParticipantChip appear.

## Tasks / Subtasks

- [x] Task 1: Add exit/leave button and flow to lobby screen (AC: #1)
  - [x] 1.1 Add a "Leave Room" back arrow / exit control to the room lobby header on mobile (`apps/mobile/app/room/[code].tsx`)
  - [x] 1.2 On tap, send `room:leave` message via WebSocket, clear room store, and navigate to Home Hub
  - [x] 1.3 Add the same exit control to web lobby (`apps/web/src/routes/room/lobby.tsx`)
  - [x] 1.4 No confirmation dialog — exit is immediate per UX spec

- [x] Task 2: Handle `room:state` updates for participant removal on client (AC: #1, #2)
  - [x] 2.1 Verify `roomStore.setRoom()` correctly replaces participant list when server broadcasts updated `room:state` after a participant leaves
  - [x] 2.2 Verify `isHost` derivation updates when `hostId` changes in incoming `room:state` (host transfer)
  - [x] 2.3 ParticipantChip list should reactively reflect the new participants array (already reactive via Zustand selector)

- [x] Task 3: Handle `room:close` message on client (AC: #3)
  - [x] 3.1 Subscribe to `room:close` in the lobby screen (or WebSocket hook)
  - [x] 3.2 On `room:close`, clear room store and navigate to Home Hub
  - [x] 3.3 Show a brief inline message: "This room has ended" (not a modal/toast — inline per UX spec)

- [x] Task 4: Server-side — verify and complete room lifecycle handlers (AC: #1, #2, #3)
  - [x] 4.1 Verify `handleRoomLeave` in `ws-handler.ts` correctly removes participant and broadcasts `room:state`
  - [x] 4.2 Verify host transfer logic in `room-manager.ts` selects earliest joiner by `joinedAt` when host leaves
  - [x] 4.3 Verify room destruction when last participant leaves (room removed from Map, code released)
  - [x] 4.4 Verify `room:close` is broadcast when room is destroyed (if any connections still open during cleanup)
  - [x] 4.5 Verify graceful disconnect (30s grace period) does NOT apply to explicit `room:leave` — only to unexpected connection drops

- [x] Task 5: Server-side — handle explicit leave vs. disconnect distinction (AC: #1, #2)
  - [x] 5.1 Explicit `room:leave`: remove participant immediately, no grace period
  - [x] 5.2 Connection drop (WebSocket close without `room:leave`): apply 30s grace period, then remove
  - [x] 5.3 Both paths must trigger host transfer if the leaving participant was host

- [x] Task 6: Late joiner state sync verification (AC: #4)
  - [x] 6.1 Verify that `handleRoomJoin` broadcasts full `room:state` to ALL participants (including late joiner)
  - [x] 6.2 Verify the late joiner's `room:state` includes `participantId` so the client can derive `isHost`
  - [x] 6.3 Verify existing participants see the new ParticipantChip appear immediately

- [x] Task 7: Write tests (AC: #1, #2, #3, #4)
  - [x] 7.1 Server tests: participant leave → room state broadcast to remaining
  - [x] 7.2 Server tests: host leave → host transfer to earliest joiner → room state broadcast
  - [x] 7.3 Server tests: last participant leave → room destroyed
  - [x] 7.4 Server tests: explicit leave (immediate) vs. disconnect (30s grace)
  - [x] 7.5 Client store tests: room state updates on participant removal and host transfer
  - [x] 7.6 Client store tests: clearRoom on room:close

## Dev Notes

### What Already Exists (DO NOT recreate)

The server already has most of the lifecycle logic implemented. **Verify and extend, don't rewrite:**

- `apps/server/src/rooms/room-manager.ts` — `RoomManager` class with `removeParticipant()`, host transfer logic (earliest joiner by `joinedAt`), auto-destroy on empty room. **Already implemented.**
- `apps/server/src/signaling/ws-handler.ts` — `handleRoomLeave()` and `handleDisconnect()` handlers. **Already implemented.** Check that explicit leave skips grace period.
- `packages/shared/src/stores/room-store.ts` — `setRoom()`, `removeParticipant()`, `updateHost()`, `clearRoom()` actions. **Already implemented.**
- `packages/shared/src/protocol/constants.ts` — `ROOM_MESSAGE_TYPE.LEAVE`, `ROOM_MESSAGE_TYPE.CLOSE`, `ROOM_MESSAGE_TYPE.STATE` constants. **Already defined.**
- `apps/mobile/src/shared/hooks/use-websocket.ts` — Auto-reconnect with exponential backoff, auto-rejoin on reconnect. **Already implemented.**

### Key Implementation Patterns (MUST follow)

**WebSocket message sending:**
```typescript
import { createWsMessage, ROOM_MESSAGE_TYPE } from '@jellysync/shared';
const { send, subscribe } = useWs();
send(createWsMessage(ROOM_MESSAGE_TYPE.LEAVE, {}));
```

**Room store access (vanilla Zustand — NOT a React hook):**
```typescript
import { useStore } from 'zustand';
import { roomStore } from '../../lib/room';

// Read (reactive)
const isHost = useStore(roomStore, (s) => s.isHost);
const participants = useStore(roomStore, (s) => s.participants);

// Write (non-reactive)
roomStore.getState().clearRoom();
```

**Error subscription with context filtering:**
```typescript
const unsub = subscribe('error', (msg) => {
  const error = msg.payload as { code: string; message: string; context?: string };
  if (error.context === 'room:leave') { /* handle */ }
});
```

**Navigation after leave:**
- Mobile: `router.replace('/')` (Expo Router)
- Web: `navigate('/')` (React Router)

### Server Architecture

- Server is authoritative — clients send intents, server validates and broadcasts confirmed state
- In-memory Map storage: `rooms: Map<code, Room>` and `participantToRoom: Map<participantId, code>`
- Connection tracking: `connectionToParticipant: Map<WebSocket, string>` and `participantToConnection: Map<string, WebSocket>`
- Grace period: `disconnectTimers: Map<string, setTimeout>` — 30s timeout for reconnection on connection drop only
- Host transfer: sort participants by `joinedAt` ascending, first one becomes new host
- Broadcast pattern: `broadcastToRoom(room, (participantId) => createWsMessage(ROOM_MESSAGE_TYPE.STATE, roomToStatePayload(room, participantId)))`

### UX Requirements

- **No confirmation dialog on exit** — exit is immediate (UX spec)
- **No toast/modal for room events** — inline feedback only
- **Error messages are user-friendly** — server already returns friendly messages, display directly
- **Immersive navigation** — room screens have no persistent nav bars; use contextual back arrow
- **ParticipantChip updates are reactive** — Zustand selector on `participants` array handles this automatically
- **"This room has ended"** — shown inline when `room:close` received, with "Back to Home" action
- **Silent recovery** — reconnection and rejoin happen automatically, only show "Reconnecting..." after 3+ seconds

### Anti-Patterns to Avoid

- DO NOT set room state client-side without server confirmation (server-authoritative model)
- DO NOT show Alert/modal for room leave or closure — inline only
- DO NOT add persistence to room store — rooms are ephemeral by design
- DO NOT duplicate types from `@jellysync/shared` — import from shared package
- DO NOT use `.ts` extensions in imports — use `.js` per existing ESM pattern
- DO NOT put business logic in components — use hooks or store actions
- DO NOT create grab-bag utility files — be specific with file names

### Project Structure Notes

- Mobile lobby: `apps/mobile/app/room/[code].tsx` (197 lines — modify this)
- Web lobby: `apps/web/src/routes/room/lobby.tsx` (modify this)
- Server WS handler: `apps/server/src/signaling/ws-handler.ts` (295 lines — verify/modify)
- Room manager: `apps/server/src/rooms/room-manager.ts` (110 lines — verify/modify)
- Room store: `packages/shared/src/stores/room-store.ts` (100 lines — verify actions exist)
- Protocol constants: `packages/shared/src/protocol/constants.ts`
- Protocol messages: `packages/shared/src/protocol/messages.ts`

### Previous Story Intelligence

**From Story 2-4 (Deep Link Join):**
- Auto-join detection distinguishes "direct entry" from "normal entry" — respect this logic when adding leave flow
- Connection state must be checked before sending messages — use `connectionState === 'connected'` guard

**From Story 2-3 (Join Room):**
- Server errors include `context` field for filtering — use `context === 'room:leave'` for leave-specific errors
- Error display is inline-only (no modals, toasts, or Alerts)

**From Story 2-2 (Room Creation & Lobby):**
- WebSocket hook auto-handles `room:state` updates to store — don't duplicate this logic
- ParticipantChip has three variants: host (with "(Host)" suffix + primary mic), participant, empty slot
- Vanilla Zustand: `useStore(roomStore, selector)` — not a React hook pattern

**From Story 2-1 (Signaling Server):**
- Host transfer rule: first participant by join order becomes new host — already in `room-manager.ts`
- Room destruction: when last participant leaves, remove from Map, release code — already implemented
- 30s grace period on disconnect — verify it only applies to connection drops, not explicit leave

### Git Intelligence

Recent commits show consistent patterns:
- Commit messages: `feat: implement [feature] (Story X-Y)`
- All stories in Epic 2 have been completed sequentially (2-1 through 2-4)
- Test counts increasing: 87 → 105 → 117 → 100+ per story
- Zero regressions across all platforms

### Testing Standards

- Framework: Vitest
- Co-locate tests with source: `component.test.ts` next to `component.ts`
- Server tests: mock WebSocket connections
- Store tests: direct state manipulation and assertion
- Test existing lifecycle flows still work (regression)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.5]
- [Source: _bmad-output/planning-artifacts/architecture.md — WebSocket Protocol, Room Management, State Management]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Room Lifecycle UI, Error Handling, Feedback Patterns]
- [Source: _bmad-output/implementation-artifacts/2-4-deep-link-join.md — Previous Story Learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
No debug issues encountered. All tests passed on first run.

### Completion Notes List
- Tasks 1, 2, 5, 6 were already fully implemented in previous stories (2-1 through 2-4). Verified all existing behavior is correct.
- Task 3: Implemented `room:close` handling — added subscription in both WebSocket hooks (mobile + web) to call `clearRoom()`, added `room:close` subscription in both lobby screens with inline "This room has ended" UI per UX spec.
- Task 4.4: Added `room:close` broadcast in server `handleRoomLeave` when room is destroyed (last participant leaves).
- Task 7: Added 4 new server tests (host transfer broadcast, room destruction + room:close, explicit leave immediacy) and 3 new store tests (participant removal via setRoom, host transfer via setRoom, clearRoom on room:close). All 141 tests pass (107 shared + 34 server) with zero regressions.

### Change Log
- 2026-03-25: Implemented room lifecycle & host transfer (Story 2-5)
  - Added `room:close` handling to mobile and web WebSocket hooks
  - Added `room:close` subscription and inline "This room has ended" UI to mobile and web lobby screens
  - Added `room:close` broadcast to server when room is destroyed on last participant leave
  - Added 7 new tests covering host transfer, room destruction, leave vs disconnect, and store lifecycle

### File List
- apps/server/src/signaling/ws-handler.ts (modified — added room:close broadcast on room destruction)
- apps/server/src/signaling/ws-handler.test.ts (modified — added 4 new tests)
- apps/mobile/src/shared/hooks/use-websocket.ts (modified — added room:close handler)
- apps/mobile/app/room/[code].tsx (modified — added room:close subscription and inline UI)
- apps/web/src/shared/hooks/use-websocket.ts (modified — added room:close handler)
- apps/web/src/routes/room/lobby.tsx (modified — added room:close subscription and inline UI)
- packages/shared/src/stores/room-store.test.ts (modified — added 3 new lifecycle tests)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified — status updates)
