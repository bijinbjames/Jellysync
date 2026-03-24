# Story 2.4: Deep Link Join

Status: done

## Story

As a participant,
I want to tap a shared deep link and land directly in a room,
so that joining a watch session takes under 10 seconds with zero effort.

## Acceptance Criteria

1. **Given** the user taps a JellySync deep link (`jellysync://room/ABC123` or `https://jellysync.example/room/ABC123`), **When** the app is installed and the user is logged in, **Then** the app opens and routes directly to the room using the code from the link, the user joins the room automatically without entering a code, and the total time from link tap to in-room is < 5 seconds.

2. **Given** the user taps a deep link but is not logged in, **When** the app opens, **Then** the user is redirected to the Login screen, the deep link intent is preserved, and after successful authentication the user is automatically joined to the room from the original link.

3. **Given** the user taps a deep link for a room that no longer exists, **When** the join attempt fails, **Then** a friendly message is shown: "This room is no longer active", a "Back to Home" button navigates to the Home Hub, and no technical error details are exposed.

4. **Given** deep link handling is configured, **When** links are received on different platforms, **Then** Expo Router handles deep links on mobile via the `jellysync://` URL scheme (Android intents and iOS universal links), and React Router handles URL-based routing on web (`/room/:code`).

## Tasks / Subtasks

- [x] Task 1: Configure Expo deep link handling for mobile (AC: #4)
  - [x] 1.1 Verify `app.json` already has `"scheme": "jellysync"` (it does) -- no change needed
  - [x] 1.2 Ensure the existing file-based route `apps/mobile/app/room/[code].tsx` handles deep links automatically via Expo Router's built-in linking (`jellysync://room/ABC123` -> `/room/ABC123`)
  - [x] 1.3 Test that `npx uri-scheme open "jellysync://room/TEST01" --android` (or iOS equivalent) opens the room lobby screen

- [x] Task 2: Add auto-join logic to Room Lobby screen on mobile (AC: #1, #3)
  - [x] 2.1 In `apps/mobile/app/room/[code].tsx`: detect "direct entry" (no `roomStore.roomCode` set, but `code` param present from deep link/URL)
  - [x] 2.2 On direct entry: automatically send `room:join` message using the `code` param (same pattern as Join Room screen -- `createWsMessage(ROOM_MESSAGE_TYPE.JOIN, { roomCode: code, displayName: username })`)
  - [x] 2.3 Subscribe to `error` messages: if join fails (room not found/expired), show inline friendly error "This room is no longer active" with "Back to Home" button
  - [x] 2.4 Show a minimal loading state while the auto-join is in progress (e.g., centered spinner on surface background)

- [x] Task 3: Add auto-join logic to Room Lobby screen on web (AC: #1, #3)
  - [x] 3.1 In `apps/web/src/routes/room/lobby.tsx`: same direct-entry detection as mobile -- if URL is `/room/ABC123` but `roomStore.roomCode` is null, auto-send `room:join`
  - [x] 3.2 Wire same `room:join` + error subscription pattern as mobile
  - [x] 3.3 Show same loading and error states (friendly message + "Back to Home" button)

- [x] Task 4: Preserve deep link intent across login on mobile (AC: #2)
  - [x] 4.1 In `apps/mobile/app/_layout.tsx` `AuthGate`: when redirecting an unauthenticated user to `/login`, capture the current URL/segments (the deep link target) and store in a lightweight pending-intent store or ref
  - [x] 4.2 After successful login, check for pending intent -- if present, navigate to the preserved room URL instead of Home Hub
  - [x] 4.3 Clear the pending intent after use or after a reasonable timeout (e.g., 5 minutes)

- [x] Task 5: Preserve deep link intent across login on web (AC: #2)
  - [x] 5.1 In `apps/web/src/app.tsx` `AuthGuard`: when redirecting to `/login`, include the original path as a query parameter or store in sessionStorage (e.g., `sessionStorage.setItem('pendingDeepLink', location.pathname)`)
  - [x] 5.2 After successful login in the web auth flow, check for `pendingDeepLink` -- if present, navigate to it instead of `/`
  - [x] 5.3 Clear `pendingDeepLink` after use

- [x] Task 6: Tests (AC: all)
  - [x] 6.1 Test deep link auto-join: navigating to `/room/ABC123` without existing room state triggers `room:join` message
  - [x] 6.2 Test successful auto-join: after `room:state` received, lobby renders normally with participants
  - [x] 6.3 Test failed auto-join: error response shows "This room is no longer active" + "Back to Home" button
  - [x] 6.4 Test intent preservation: unauthenticated deep link -> login -> auto-redirect to room
  - [x] 6.5 Test web URL routing: `/room/:code` route correctly extracts code and triggers auto-join
  - [x] 6.6 Ensure no regressions: existing room creation flow (Home Hub -> Create Room -> Lobby) still works without triggering auto-join

## Dev Notes

### Architecture Compliance

- **Expo Router handles deep linking automatically**: With `"scheme": "jellysync"` already in `app.json` and the file-based route at `app/room/[code].tsx`, Expo Router will automatically route `jellysync://room/ABC123` to the `[code].tsx` screen with `code = "ABC123"` as a search param. No additional linking configuration is needed.
- **Web already handles `/room/:code` via React Router**: The route `<Route path="/room/:code" element={...} />` in `apps/web/src/app.tsx` already exists. Navigating directly to `https://example.com/room/ABC123` will render `RoomLobbyPage` with `code = "ABC123"`.
- **The key change is auto-join logic**: Currently, the room lobby screens assume the user already has room state (set by the create/join flow). For deep links, the user arrives with only a URL code param and no room state. The lobby must detect this "direct entry" case and trigger an automatic `room:join`.
- **Server-authoritative model**: Send `room:join` intent, wait for server `room:state` confirmation. Never set room state client-side.
- **WebSocket auto-updates roomStore**: The `use-websocket.ts` hook (lines 49-60) already handles incoming `room:state` messages and calls `setRoom()`, `setParticipantId()`, and `updateHost()`. Do NOT duplicate this logic.

### Existing Code That Supports This Story (DO NOT RECREATE)

- **`apps/mobile/app.json`** line 6: `"scheme": "jellysync"` -- URL scheme already configured
- **`apps/mobile/app/room/[code].tsx`**: Room lobby screen already receives `code` param via `useLocalSearchParams()`
- **`apps/web/src/app.tsx`** line 76: Route `"/room/:code"` already registered
- **`apps/web/src/routes/room/lobby.tsx`**: Room lobby already receives `code` via `useParams()`
- **`use-websocket.ts`** (both platforms): Already auto-updates `roomStore` on `room:state` messages
- **`use-share-room.ts`** (mobile): Already builds deep links as `jellysync://room/${code}`
- **`use-share-room.ts`** (web): Already builds web links as `${window.location.origin}/room/${code}`
- **Server `handleRoomJoin()`**: `apps/server/src/signaling/ws-handler.ts` already handles `room:join` -- validates room, adds participant, broadcasts `room:state`

### Deep Link URL Formats

| Platform | Link Format | Handling |
|----------|------------|----------|
| Mobile (custom scheme) | `jellysync://room/ABC123` | Expo Router file-based routing |
| Web | `https://host/room/ABC123` | React Router `/room/:code` |
| iOS Universal Links | `https://jellysync.example/room/ABC123` | Future: requires apple-app-site-association (out of scope for MVP -- use custom scheme) |

For MVP, mobile uses the `jellysync://` custom scheme. Universal links (iOS) and App Links (Android) with HTTPS are a Phase 2 concern requiring server-side association files.

### Auto-Join Detection Pattern

The room lobby screen needs to distinguish two entry modes:

1. **Normal entry** (via Create Room or Join Room flow): `roomStore.roomCode` is already set by the time the user reaches the lobby. No action needed.
2. **Direct entry** (via deep link or URL): `roomStore.roomCode` is `null`, but `code` param from the URL is present. Trigger auto-join.

```typescript
// In room lobby useEffect:
const roomCode = useStore(roomStore, (s) => s.roomCode);
const connectionState = useStore(roomStore, (s) => s.connectionState);
const { code } = useLocalSearchParams<{ code: string }>(); // mobile
// const { code } = useParams<{ code: string }>(); // web

useEffect(() => {
  // Direct entry via deep link -- auto-join (wait for WS to be connected)
  if (code && !roomCode && connectionState === 'connected') {
    // Subscribe to errors FIRST, then send
    const unsubErr = subscribe('error', (msg) => { /* handle room:join errors */ });
    const username = authStore.getState().username;
    send(createWsMessage(ROOM_MESSAGE_TYPE.JOIN, { roomCode: code, displayName: username }));
    // Add a 10s timeout to avoid infinite spinner
    return () => { unsubErr(); clearTimeout(timeout); };
  }
}, [code, roomCode, connectionState]);
```

**Important:** The `send()` function silently drops messages when the WebSocket is not in `OPEN` state. On deep link cold start, the WS connection may still be establishing when the lobby mounts. Always check `connectionState === 'connected'` before sending, and include the state in the effect's dependency array so the effect re-fires once connected.

### Intent Preservation Pattern (Login Redirect)

The `AuthGate` (mobile) and `AuthGuard` (web) currently redirect unauthenticated users to `/login` but lose the original deep link URL. To preserve it:

**Mobile (`_layout.tsx` AuthGate):**
- Use a simple module-level variable or lightweight Zustand store to capture the pending room URL
- When `!isAuthenticated && !onLoginPage`, capture `segments` before redirecting
- After login (when `isAuthenticated` transitions to `true`), check for pending URL and navigate there

**Web (`app.tsx` AuthGuard):**
- Use `sessionStorage` to store `location.pathname` before redirecting to `/login`
- After login, check `sessionStorage.getItem('pendingDeepLink')` and navigate

**Important**: Do NOT use `expo-linking` `useURL()` for this. Expo Router's file-based routing already handles the URL parsing. The intent preservation is purely about remembering where to go after login.

### Error State for Invalid Room

When auto-join fails (room not found, expired), display a simple centered error state:
- Friendly message: "This room is no longer active"
- Subtitle: "The room may have ended or the code has expired"
- "Back to Home" gradient button navigating to `/`
- Use `bg-surface` background, `text-on-surface` for message, `text-on-surface-variant` for subtitle
- NO modal, NO toast -- inline only (matches project error philosophy)

### Established Code Patterns (from Stories 2-1, 2-2, 2-3)

**Sending room:join (same as Join Room screen):**
```typescript
import { createWsMessage, ROOM_MESSAGE_TYPE } from '@jellysync/shared';
const { send, subscribe } = useWs();

send(createWsMessage(ROOM_MESSAGE_TYPE.JOIN, { roomCode: code, displayName: username }));

const unsubErr = subscribe('error', (msg) => {
  const error = msg.payload as { code: string; message: string; context?: string };
  if (error.context === 'room:join') {
    setErrorState(true);
  }
});
```

**Room store access (vanilla Zustand):**
```typescript
import { useStore } from 'zustand';
import { roomStore } from '../../lib/room'; // mobile: ../../src/lib/room
const roomCode = useStore(roomStore, (s) => s.roomCode);
```

**Auth store access:**
```typescript
import { authStore } from '../../lib/auth'; // or ../../src/lib/auth
const username = authStore.getState().username; // for non-reactive reads
```

### Key Types (from `@jellysync/shared`)

```typescript
interface RoomJoinPayload { roomCode: string; displayName: string; }
interface RoomStatePayload { roomCode: string; hostId: string; participants: Participant[]; participantId?: string; }
ROOM_MESSAGE_TYPE.JOIN    // 'room:join'
ROOM_MESSAGE_TYPE.STATE   // 'room:state'
ERROR_CODE.ROOM_NOT_FOUND // 'ROOM_NOT_FOUND'
```

### Design System Tokens

| Element | Token / Value |
|---------|--------------|
| Screen background | `bg-surface` (#131313) |
| Error message text | `text-on-surface font-heading text-lg font-bold` |
| Error subtitle | `text-on-surface-variant font-body text-sm` |
| "Back to Home" button | `gradient-primary rounded-md` full-width |
| Loading spinner | `text-primary` centered on `bg-surface` |
| Container padding | `p-6` |

### File Structure

```
MODIFIED FILES:
  apps/mobile/app/room/[code].tsx          # Add auto-join logic for deep link entry
  apps/mobile/app/_layout.tsx              # Add intent preservation in AuthGate
  apps/web/src/routes/room/lobby.tsx       # Add auto-join logic for URL entry
  apps/web/src/app.tsx                     # Add intent preservation in AuthGuard

NO CHANGES NEEDED:
  apps/mobile/app.json                     # scheme: "jellysync" already set
  apps/server/                             # room:join already handled
  packages/shared/                         # Protocol types already complete
  apps/mobile/app/room/_layout.tsx         # Slot layout unchanged
```

### Project Structure Notes

- Mobile uses Expo Router file-based routing: `app/room/[code].tsx` auto-registers as `/room/:code` AND handles deep links for `jellysync://room/:code`
- Web uses React Router: `/room/:code` route already registered in `app.tsx`
- Both lobby screens already receive the `code` param -- they just need the auto-join logic added
- `WebSocketProvider` wraps authenticated routes on both platforms, so `useWs()` is available in room lobby
- Room code charset: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no ambiguous chars)

### Previous Story Intelligence (Story 2-3)

- **Join Room screen already sends `room:join` successfully**: The pattern in `apps/mobile/app/join.tsx` and `apps/web/src/routes/join.tsx` is the exact same `room:join` + subscribe pattern needed here. Reuse the same approach, but triggered automatically instead of on button press.
- **Error context filtering**: Server errors include a `context` field. Filter for `context === 'room:join'` to distinguish join errors from other WebSocket errors.
- **117 tests pass** (86 shared/packages + 31 server) as of Story 2-3 completion. Ensure no regressions.
- **Pre-existing TS error**: `apps/mobile/index.ts` has an unrelated Expo template error -- ignore it.
- **WebSocket hook auto-handles `room:state`**: After `room:join` succeeds, `use-websocket.ts` automatically updates `roomStore` with room state. Your auto-join code only needs to: (1) send the join message, (2) handle errors for the failure case.

### Git Intelligence

Recent commits show Epic 2 progressing:
- `7a3afb0` -- Story 2-3: Join Room via Code Entry (13 files, 1003 insertions)
- `6eb1d10` -- Story 2-2: Room Lobby (23 files)
- `e706b5b` -- Story 2-1: Signaling server + WebSocket foundation (22 files)
- Room lobby screens on both platforms are well-established with consistent patterns

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture -- Navigation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision Impact Analysis -- Deep links depend on Expo Router]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Journey 2 -- Partner Joins via Deep Link]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Experience Mechanics -- The Link Tap]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Flow Optimization Principles -- Preserve Intent]
- [Source: _bmad-output/planning-artifacts/prd.md#FR8 -- Join room by tapping deep link]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR9 -- Deep link to in-room < 5 seconds]
- [Source: _bmad-output/implementation-artifacts/2-3-join-room-via-code-entry.md -- Join flow patterns]
- [Source: apps/mobile/app.json -- scheme: "jellysync"]
- [Source: apps/mobile/app/room/[code].tsx -- Room lobby screen with code param]
- [Source: apps/mobile/app/_layout.tsx -- AuthGate with redirect logic]
- [Source: apps/web/src/app.tsx -- AuthGuard + /room/:code route]
- [Source: apps/web/src/routes/room/lobby.tsx -- Web room lobby with code param]
- [Source: apps/mobile/src/features/room/hooks/use-share-room.ts -- Deep link format: jellysync://room/{code}]
- [Source: apps/web/src/features/room/hooks/use-share-room.ts -- Web link format: origin/room/{code}]
- [Source: packages/shared/src/stores/auth-store.ts -- AuthStore with isAuthenticated]
- [Source: packages/shared/src/stores/room-store.ts -- RoomStore with roomCode]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- All 100 tests pass (12 test files) including 17 new deep-link-join tests
- TypeScript compiles clean on web; mobile has only pre-existing `apps/mobile/index.ts` Expo template error (unrelated)

### Completion Notes List

- **Task 1**: Verified `app.json` scheme "jellysync" (line 5) and file-based route `app/room/[code].tsx` already exist. Expo Router handles `jellysync://room/CODE` automatically. No changes needed.
- **Task 2**: Added auto-join logic to mobile room lobby. On direct entry (code param present, no roomStore.roomCode), automatically sends `room:join`. Shows ActivityIndicator during join, inline error state with "This room is no longer active" + "Back to Home" button on failure.
- **Task 3**: Added identical auto-join logic to web room lobby. Uses CSS spinner for loading state, same error UI pattern with gradient button.
- **Task 4**: Added intent preservation to mobile `AuthGate` in `_layout.tsx`. Uses module-level variables (`pendingDeepLink`, `pendingDeepLinkTimestamp`) to capture path before login redirect. After login, navigates to preserved URL. 5-minute timeout on pending intent.
- **Task 5**: Added intent preservation to web `AuthGuard` and `GuestGuard` in `app.tsx`. Uses `sessionStorage` to store `location.pathname` before redirect. `GuestGuard` checks for pending link after login and navigates there instead of `/`.
- **Task 6**: Created `packages/shared/src/protocol/deep-link-join.test.ts` with 17 tests covering: auto-join detection logic, successful join via room:state, error handling (ROOM_NOT_FOUND), intent preservation patterns, timeout expiry, URL code extraction, and no-regression checks for normal create/join flows.

### Change Log

- 2026-03-24: Implemented deep link join (Story 2-4) - auto-join on mobile and web, intent preservation across login, error states, 17 new tests

### File List

- `apps/mobile/app/room/[code].tsx` (modified) - Added auto-join logic, error state, loading state
- `apps/mobile/app/_layout.tsx` (modified) - Added intent preservation in AuthGate with 5-min timeout
- `apps/web/src/routes/room/lobby.tsx` (modified) - Added auto-join logic, error state, loading state
- `apps/web/src/app.tsx` (modified) - Added intent preservation via sessionStorage in AuthGuard/GuestGuard
- `packages/shared/src/protocol/deep-link-join.test.ts` (new) - 17 tests for deep link join flow
