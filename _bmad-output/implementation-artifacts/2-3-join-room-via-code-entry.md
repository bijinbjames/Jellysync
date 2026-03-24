# Story 2.3: Join Room via Code Entry

Status: done

## Story

As a participant,
I want to enter a room code and join an active room,
so that I can join a watch session my host has created.

## Acceptance Criteria

1. **Given** the user taps "Join Room" on the Home Hub, **When** the navigation completes, **Then** the user lands on a dedicated Join Room screen with a `GlassHeader` (Navigation variant) showing a back arrow and "Join Room" title, a centered group icon with instructional text, and a `CodeInput` component with 6 OTP-style input boxes.

2. **Given** the user is on the Join Room screen, **When** they type a character in a code box, **Then** the character displays in `primary` color (2xl monospace bold), focus auto-advances to the next empty box, backspace moves to the previous box and clears it, and pasting a 6-character string fills all boxes at once. Focused box shows 2px `primary` border with `primary/10` background tint.

3. **Given** the user enters a valid 6-character code and taps "Join Room", **When** a `room:join` message is sent to the server, **Then** the server validates the room exists and is active, the participant is added to the room's participant list, the user navigates to the Room Lobby screen (`/room/[code]`), and the host's lobby updates to show the new participant's `ParticipantChip`.

4. **Given** the user enters an invalid room code and taps "Join Room", **When** the join attempt fails, **Then** all input boxes show error border color (`#ffb4ab`) with a brief shake animation, an inline error message appears below: "This code doesn't match an active room -- check with your host", and no modal or toast is shown.

## Tasks / Subtasks

- [x] Task 1: Create Join Room screen for mobile (AC: #1, #2)
  - [x] 1.1 Create `apps/mobile/app/join.tsx` -- Join Room screen with `GlassHeader` (Navigation variant, back arrow, "Join Room" title)
  - [x] 1.2 Add centered group icon and instructional header text ("Enter the 6-character code from your host")
  - [x] 1.3 Integrate existing `CodeInput` component from `apps/mobile/src/shared/components/code-input.tsx`
  - [x] 1.4 Add gradient "Join Room" primary button (disabled until 6 chars entered)
  - [x] 1.5 Add "or" divider with deep link alternative text below button
  - [x] 1.6 Add error state: shake animation + `error` border on all boxes + inline error message

- [x] Task 2: Create Join Room screen for web (AC: #1, #2)
  - [x] 2.1 Create `apps/web/src/routes/join.tsx` -- mirror mobile layout with web equivalents
  - [x] 2.2 Integrate existing `CodeInput` from `apps/web/src/shared/components/code-input.tsx`
  - [x] 2.3 Add same gradient button, error states, and "or" divider as mobile

- [x] Task 3: Wire join logic via WebSocket (AC: #3, #4)
  - [x] 3.1 On "Join Room" tap: send `createWsMessage(ROOM_MESSAGE_TYPE.JOIN, { roomCode, displayName })` via `useWs().send()`
  - [x] 3.2 Subscribe to `ROOM_MESSAGE_TYPE.STATE` -- on receipt, the existing `use-websocket.ts` auto-updates `roomStore`; navigate to `/room/${roomCode}`
  - [x] 3.3 Subscribe to `'error'` messages -- if `context === 'room:join'`, show inline error with shake animation; do NOT use Alert/modal/toast
  - [x] 3.4 Add loading state on button while awaiting server response (disable button, optional subtle spinner)

- [x] Task 4: Update Home Hub navigation (AC: #1)
  - [x] 4.1 In `apps/mobile/app/index.tsx`: change `handleJoinRoom()` from `Alert.alert()` placeholder to `router.push('/join')`
  - [x] 4.2 In `apps/web/src/routes/index.tsx`: change Join Room handler to `navigate('/join')`

- [x] Task 5: Add web route registration (AC: #3)
  - [x] 5.1 In `apps/web/src/app.tsx`: add `<Route path="/join" element={<JoinScreen />} />` inside the authenticated route group

- [x] Task 6: Tests (AC: all)
  - [x] 6.1 Test `CodeInput` error state (shake animation trigger, error border, error message display)
  - [x] 6.2 Test join flow: enter 6-char code -> tap Join -> `room:join` sent -> `room:state` received -> navigation to `/room/{code}`
  - [x] 6.3 Test error flow: enter invalid code -> tap Join -> error received -> inline error displayed, no navigation
  - [x] 6.4 Test button disabled state until 6 characters entered
  - [x] 6.5 Test Home Hub "Join Room" button navigates to `/join`

## Dev Notes

### Architecture Compliance

- **Server is ALREADY DONE**: `handleRoomJoin()` in `apps/server/src/signaling/ws-handler.ts` (lines 108-145) fully handles `room:join` messages. It validates `displayName` and `roomCode`, checks if user is already in a room, generates a `participantId`, calls `roomManager.joinRoom()`, and broadcasts `room:state` to all participants. NO server changes needed.
- **Shared protocol is ALREADY DONE**: `ROOM_MESSAGE_TYPE.JOIN`, `RoomJoinPayload`, error codes (`ROOM_NOT_FOUND`, `ROOM_FULL`, `ALREADY_IN_ROOM`) all exist in `packages/shared/src/protocol/`. NO shared package changes needed.
- **CodeInput component ALREADY EXISTS**: Both `apps/mobile/src/shared/components/code-input.tsx` and `apps/web/src/shared/components/code-input.tsx` are implemented with 6-char alphanumeric input, auto-uppercase, character filtering, and auto-advance. You need to ADD error state styling (shake + error border) to the existing component.
- **WebSocket auto-updates roomStore**: The `use-websocket.ts` hook (lines 49-60) already handles incoming `room:state` messages and calls `setRoom()`, `setParticipantId()`, and `updateHost()`. Do NOT duplicate this logic. Your join screen only needs to: (1) send the `room:join` message, (2) subscribe to `room:state` for navigation trigger, (3) subscribe to `error` for inline error display.
- **Server-authoritative model**: Send `room:join` intent, wait for server `room:state` confirmation before navigating. Never set room state client-side without server confirmation.
- **Immersive navigation context**: Join screen should NOT show bottom tabs or persistent nav bars -- use contextual back arrow only (same pattern as Room Lobby).

### Established Code Patterns (from Stories 2-1 and 2-2)

**Sending a room:join message (follow room:create pattern from Home Hub):**
```typescript
import { createWsMessage, ROOM_MESSAGE_TYPE } from '@jellysync/shared';

const { send, subscribe } = useWs();

// Send join intent
send(createWsMessage(ROOM_MESSAGE_TYPE.JOIN, { roomCode: code, displayName: username }));

// Listen for state response (triggers navigation)
const unsub = subscribe(ROOM_MESSAGE_TYPE.STATE, (msg) => {
  const payload = msg.payload as RoomStatePayload;
  roomStore.getState().setParticipantId(payload.participantId!);
  // Store already updated by use-websocket.ts, just navigate
  router.push(`/room/${payload.roomCode}`);
});

// Listen for errors (triggers inline error display)
const unsubErr = subscribe('error', (msg) => {
  const error = msg.payload as { code: string; message: string };
  setErrorMessage(error.message); // Server messages are already user-friendly
  triggerShakeAnimation();
});
```

**Room store access (vanilla Zustand -- NOT hook-based store):**
```typescript
import { useStore } from 'zustand';
import { roomStore } from '../../lib/room';

// Read state
const roomCode = useStore(roomStore, (s) => s.roomCode);

// Write state (from event handlers)
roomStore.getState().clearRoom();
```

**WebSocket access:**
```typescript
import { useWs } from '../shared/providers/websocket-provider';
const { send, subscribe } = useWs();
```

### Key Types (from `@jellysync/shared`)

```typescript
interface RoomJoinPayload { roomCode: string; displayName: string; }
interface RoomStatePayload { roomCode: string; hostId: string; participants: Participant[]; participantId?: string; }
interface Participant { id: string; displayName: string; joinedAt: number; isHost: boolean; }

// Constants
ROOM_MESSAGE_TYPE.JOIN    // 'room:join'
ROOM_MESSAGE_TYPE.STATE   // 'room:state'
ROOM_MESSAGE_TYPE.LEAVE   // 'room:leave'
ERROR_CODE.ROOM_NOT_FOUND // 'ROOM_NOT_FOUND'
ERROR_CODE.ROOM_FULL      // 'ROOM_FULL'
ERROR_CODE.ALREADY_IN_ROOM // 'ALREADY_IN_ROOM'
ROOM_CONFIG.CODE_LENGTH   // 6
```

### Error Handling

- Server error messages (in `msg.payload.message`) are ALREADY user-friendly. Display them directly.
- Error display is INLINE ONLY -- below the CodeInput. No Alert, no modal, no toast.
- Error border: `#ffb4ab` (the `error` design token) on all 6 input boxes.
- Shake animation: brief horizontal shake on error (CSS `@keyframes shake` or RN `Animated`).
- Clear error state when user starts typing again.

### Design System Tokens

| Element | Token / Value |
|---------|--------------|
| Screen background | `bg-surface` (#131313) |
| Code input boxes | `w-12 h-14`, `bg-surface-container-high`, `rounded-md` |
| Focused input | 2px `primary` border + `primary/10` background tint |
| Input text | `text-primary font-mono text-2xl font-bold tracking-[0.2em]` |
| Error input border | `border-error` (#ffb4ab) |
| Error message text | `text-error text-sm` below CodeInput |
| Join button | `gradient-primary rounded-md` full-width (same as "Share Link" in lobby) |
| Disabled button | `bg-surface-container-highest text-on-surface-variant cursor-not-allowed` |
| "or" divider | `text-on-surface-variant text-sm` with horizontal rules |
| Deep link text | `text-primary` tertiary/ghost style |
| Section spacing | `gap-8` between major sections |
| Container padding | `p-6` |

### File Structure

```
NEW FILES:
  apps/mobile/app/join.tsx                    # Join Room screen
  apps/web/src/routes/join.tsx                # Join Room screen (web)

MODIFIED FILES:
  apps/mobile/app/index.tsx                   # Wire Join Room button -> /join
  apps/web/src/routes/index.tsx               # Wire Join Room button -> /join
  apps/web/src/app.tsx                        # Add /join route
  apps/mobile/src/shared/components/code-input.tsx  # Add error state (shake + border)
  apps/web/src/shared/components/code-input.tsx     # Add error state (shake + border)

NO CHANGES NEEDED:
  apps/server/                                # room:join already fully handled
  packages/shared/                            # Protocol types already complete
```

### Project Structure Notes

- Mobile uses Expo Router file-based routing: `app/join.tsx` auto-registers as `/join` route
- Web uses React Router: must explicitly add route in `apps/web/src/app.tsx`
- Both `CodeInput` components exist in `src/shared/components/` (NOT in features/room/) -- they are shared components used across features
- `GlassHeader` already exists in `src/shared/components/` on both platforms
- `roomStore` instance already exported from `src/lib/room.ts` in both apps
- `WebSocketProvider` already wraps authenticated routes in both app layouts
- The `glass` and `gradient-primary` utility classes are already defined in CSS/tailwind config
- Room code charset: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no ambiguous 0/O/1/I/L). Display as typed, no dash formatting needed on input (dashes are display-only in lobby's `RoomCodeDisplay`).

### Previous Story Intelligence (Story 2-2)

- **WebSocket hook already handles `room:state` store updates**: Lines 49-60 of `use-websocket.ts` automatically update the room store. Do NOT duplicate this logic in the join screen.
- **Store uses vanilla Zustand (`createStore`)**: Access via `useStore(roomStore, selector)` -- not a React hook-based store.
- **Server generates participant IDs**: The server assigns UUIDs; `participantId` is included in the first `room:state` response after join.
- **Grace period on disconnect**: Server waits 30s before removing a participant. Client auto-reconnects with exponential backoff.
- **Home Hub already has Join Room ActionCard**: Just need to change the `onPress` handler from Alert to navigation.
- **Existing tests**: 105 tests pass (74 shared/packages + 31 server). Ensure no regressions.
- **Pre-existing TS error**: `apps/mobile/index.ts` has an unrelated Expo template error -- ignore it.

### Git Intelligence

Recent commits show the project at Epic 2 in-progress:
- `6eb1d10` -- Story 2-2: Room Lobby with 23 files changed, all room UI components created
- `e706b5b` -- Story 2-1: Signaling server + WebSocket foundation (22 files)
- NativeWind styling fixed with `babel.config.js` and `.npmrc` `shamefully-hoist`
- Vitest configured for server in `apps/server/vitest.config.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#WebSocket Protocol]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture -- Mobile App Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#CodeInput -- OTP-style input]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Join Room Screen]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Error Handling -- Inline Only]
- [Source: _bmad-output/planning-artifacts/prd.md#FR7 -- Join room by 6-character code]
- [Source: _bmad-output/implementation-artifacts/2-2-room-creation-and-lobby-screen.md -- Previous story patterns]
- [Source: packages/shared/src/protocol/messages.ts -- WsMessage, RoomJoinPayload types]
- [Source: packages/shared/src/protocol/constants.ts -- ROOM_MESSAGE_TYPE, ERROR_CODE, ROOM_CONFIG]
- [Source: packages/shared/src/stores/room-store.ts -- createRoomStore, RoomState, RoomActions]
- [Source: apps/mobile/src/shared/hooks/use-websocket.ts -- useWebSocket hook with auto room:state handling]
- [Source: apps/mobile/src/shared/providers/websocket-provider.tsx -- useWs() context hook]
- [Source: apps/mobile/src/shared/components/code-input.tsx -- Existing CodeInput component]
- [Source: apps/server/src/signaling/ws-handler.ts#handleRoomJoin -- Server handler lines 108-145]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- Created mobile Join Room screen (`apps/mobile/app/join.tsx`) with navigation header, group icon, instructional text, CodeInput, gradient Join button, "or" divider, and deep link text
- Created web Join Room screen (`apps/web/src/routes/join.tsx`) mirroring mobile layout with web equivalents (SVG back arrow, HTML elements, CSS shake animation)
- Upgraded both CodeInput components to OTP-style 6-box input with error state support (shake animation + error border + primary/10 background tint on focused/filled boxes)
- Wired WebSocket join logic: sends `room:join`, subscribes to `room:state` for navigation, subscribes to `error` with `context === 'room:join'` for inline error display
- Updated mobile Home Hub to navigate to `/join` (removed Alert placeholder, removed unused Alert import)
- Updated web Home Hub to navigate to `/join` (removed inline CodeInput, changed handler to `navigate('/join')`)
- Added `/join` route in web app.tsx inside authenticated route group
- Added CSS `animate-shake` keyframe animation in web `index.css`
- Created comprehensive test suite (`room-join.test.ts`) covering join flow, error handling, code validation, and host lobby updates
- All 117 tests pass (86 shared/packages + 31 server), zero regressions

### File List

New files:
- apps/mobile/app/join.tsx
- apps/web/src/routes/join.tsx
- packages/shared/src/protocol/room-join.test.ts

Modified files:
- apps/mobile/src/shared/components/code-input.tsx (rewritten to OTP-style 6-box with error state)
- apps/web/src/shared/components/code-input.tsx (rewritten to OTP-style 6-box with error state)
- apps/mobile/app/index.tsx (Join Room button navigates to /join)
- apps/web/src/routes/index.tsx (Join Room button navigates to /join, removed inline CodeInput)
- apps/web/src/app.tsx (added /join route)
- apps/web/src/index.css (added shake keyframe animation)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status update)
- _bmad-output/implementation-artifacts/2-3-join-room-via-code-entry.md (story file updates)

### Change Log

- 2026-03-24: Implemented Story 2-3 Join Room via Code Entry -- all 6 tasks completed, all ACs satisfied
