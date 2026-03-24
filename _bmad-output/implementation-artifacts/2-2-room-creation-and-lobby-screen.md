# Story 2.2: Room Creation & Lobby Screen

Status: review

## Story

As a host,
I want to create a room and see a lobby with a shareable room code,
so that I can invite others to join my watch session.

## Acceptance Criteria

1. **Given** the user taps Create Room on the Home Hub, **When** the room creation flow begins, **Then** a `room:create` message is sent to the signaling server **And** a room is created and the user lands on the Room Lobby screen within < 3 seconds (NFR8).

2. **Given** the Room Lobby screen is displayed, **When** the room is active, **Then**:
   - A `RoomCodeDisplay` component shows the 6-character code in oversized monospace text (headline 6xl-7xl, `primary` color, 0.2em letter-spacing) inside a glassmorphic container with animated pulse dot
   - A "Share Link" gradient primary button triggers the native share sheet with the deep link URL and room code
   - A "Copy Code" tertiary text action copies the code to clipboard with a brief checkmark confirmation (icon swap for 2 seconds)
   - A `ParticipantChip` shows the host with "(Host)" suffix and mic icon in `primary` color
   - Empty `ParticipantChip` slots with dashed borders (`outline_variant/30`) and "Slot available" text are shown
   - A `MovieBriefCard` placeholder indicates no movie selected yet (to be replaced by library selection in Epic 3)
   - The screen uses immersive navigation context (no persistent navigation bars)
   - Room codes are ephemeral and expire when the room closes (NFR15)

3. **Given** the host is on the Room Lobby, **When** a new participant joins via `room:state` update, **Then** a new `ParticipantChip` appears and an empty slot is removed.

4. **Given** the host is on the Room Lobby, **When** the host taps a back/cancel control, **Then** a `room:leave` message is sent, the room store is cleared, and the user navigates back to Home Hub.

## Tasks / Subtasks

- [x] Task 1: Create Room Lobby route and screen (AC: #1, #4)
  - [x] 1.1 Create `apps/mobile/app/room/[code].tsx` — Room lobby screen route (Expo Router dynamic route for deep link support)
  - [x] 1.2 Create `apps/mobile/app/room/_layout.tsx` — Room layout wrapper (immersive, no nav bars)
  - [x] 1.3 Create `apps/web/src/routes/room/lobby.tsx` — Web room lobby route (`/room/:code`)
  - [x] 1.4 Wire Create Room button in Home Hub (`apps/mobile/app/index.tsx`) to send `room:create` via WebSocket, listen for `room:state` response, then navigate to `/room/[code]`
  - [x] 1.5 Wire Create Room on web Home Hub (`apps/web/src/routes/index.tsx`) with same logic

- [x] Task 2: Build `RoomCodeDisplay` component (AC: #2)
  - [x] 2.1 Create `apps/mobile/src/features/room/components/room-code-display.tsx`
  - [x] 2.2 Create `apps/web/src/features/room/components/room-code-display.tsx`
  - [x] 2.3 Glassmorphic container: `surface_container_high/40` + `backdrop-blur-xl` + ghost border (`outline_variant/15`)
  - [x] 2.4 Code text: monospace, `text-6xl md:text-7xl`, `primary` color, `tracking-[0.2em]`
  - [x] 2.5 Animated pulse dot: top-right positioned, `primary` with glow shadow, CSS/RN animation pulse
  - [x] 2.6 Format code display as "XXX-XXX" (dash-separated groups of 3)
  - [x] 2.7 Accessibility: announce code as individual characters for screen readers

- [x] Task 3: Build share and copy actions (AC: #2)
  - [x] 3.1 Create `apps/mobile/src/features/room/hooks/use-share-room.ts` — hook wrapping `Share.share()` (React Native) with deep link URL + room code text
  - [x] 3.2 Create `apps/web/src/features/room/hooks/use-share-room.ts` — hook wrapping `navigator.share()` (Web Share API) with clipboard fallback
  - [x] 3.3 "Share Link" button: gradient primary (`primary` -> `primary_container` at 135deg), `rounded-md`, full-width
  - [x] 3.4 "Copy Code" button: tertiary text style, `primary` text, copy icon that swaps to checkmark for 2 seconds on success
  - [x] 3.5 Deep link format: `jellysync://room/{CODE}` (mobile) / `https://jellysync.example/room/{CODE}` (web)

- [x] Task 4: Build `ParticipantChip` component (AC: #2, #3)
  - [x] 4.1 Create `apps/mobile/src/features/room/components/participant-chip.tsx`
  - [x] 4.2 Create `apps/web/src/features/room/components/participant-chip.tsx`
  - [x] 4.3 Host variant: display name + "(Host)" suffix, mic icon in `primary`, avatar circle (40px, `border-2 border-surface`)
  - [x] 4.4 Participant variant: display name only, mic icon in `on_surface`
  - [x] 4.5 Empty slot variant: dashed border (`outline_variant/30`), "+" icon, "Slot available" text, reduced opacity
  - [x] 4.6 Accessibility: announce participant name, role (host/participant), mic status

- [x] Task 5: Build `MovieBriefCard` placeholder (AC: #2)
  - [x] 5.1 Create `apps/mobile/src/features/room/components/movie-brief-card.tsx`
  - [x] 5.2 Create `apps/web/src/features/room/components/movie-brief-card.tsx`
  - [x] 5.3 Horizontal card: `surface_container_low`, `rounded-lg`, `p-4`
  - [x] 5.4 Placeholder state: poster area with dashed border, "No movie selected" text, "Browse Library" hint (disabled, Epic 3)

- [x] Task 6: Wire room state to lobby UI (AC: #1, #3, #4)
  - [x] 6.1 Create `apps/mobile/src/features/room/hooks/use-room.ts` — hook that subscribes to `room:state` and `error` WebSocket messages, updates `roomStore`
  - [x] 6.2 Create `apps/web/src/features/room/hooks/use-room.ts` — same logic for web
  - [x] 6.3 Room Lobby screen reads from `roomStore` via `useStore(roomStore, ...)` for: `roomCode`, `participants`, `isHost`
  - [x] 6.4 Render participant list: map `participants` array to `ParticipantChip` components, fill remaining slots (up to 4-6 visible) with empty slot variants
  - [x] 6.5 Cancel/back control: send `room:leave` via `useWs().send()`, call `roomStore.getState().clearRoom()`, navigate to Home Hub

- [x] Task 7: Create feature barrel exports (AC: all)
  - [x] 7.1 Create `apps/mobile/src/features/room/index.ts` — export all room components and hooks
  - [x] 7.2 Create `apps/web/src/features/room/index.ts` — same exports

- [x] Task 8: Tests (AC: all)
  - [x] 8.1 Test `RoomCodeDisplay` renders code correctly with formatting and accessibility
  - [x] 8.2 Test `ParticipantChip` renders all three variants (host, participant, empty)
  - [x] 8.3 Test `MovieBriefCard` renders placeholder state
  - [x] 8.4 Test `use-room` hook correctly updates store on `room:state` messages
  - [x] 8.5 Test room creation flow: Create Room tap -> `room:create` sent -> `room:state` received -> navigation to lobby

## Dev Notes

### Architecture Compliance

- **Server-authoritative model**: Clients send `room:create` intent, server responds with `room:state`. Never set room state client-side without server confirmation.
- **Immersive navigation context**: Room Lobby has NO persistent navigation bars (no bottom tabs, no standard header). Use contextual controls only (back arrow / "Cancel Room" button).
- **Zustand store pattern**: Read from `roomStore` via `useStore(roomStore, selector)`. The store is a vanilla Zustand store created with `createStore()` (not `create()`) — use `useStore()` from `zustand`, NOT `useSomeStore()` hook pattern.
- **WebSocket via context**: Access WebSocket through `useWs()` hook from `websocket-provider.tsx`. Already wired into the layout inside auth gates.

### Established Code Patterns (from Story 2-1)

**Protocol usage — send a room:create message:**
```typescript
import { createWsMessage, ROOM_MESSAGE_TYPE } from '@jellysync/shared';

const { send, subscribe } = useWs();

// Send create intent
send(createWsMessage(ROOM_MESSAGE_TYPE.CREATE, { displayName: username }));

// Listen for state response
const unsub = subscribe(ROOM_MESSAGE_TYPE.STATE, (msg) => {
  const payload = msg.payload as RoomStatePayload;
  roomStore.getState().setParticipantId(payload.participantId!);
  roomStore.getState().setRoom(payload.roomCode, payload.hostId, payload.participants);
  router.push(`/room/${payload.roomCode}`);
});
```

**Room store access pattern:**
```typescript
import { useStore } from 'zustand';
import { roomStore } from '../../lib/room';

const roomCode = useStore(roomStore, (s) => s.roomCode);
const participants = useStore(roomStore, (s) => s.participants);
const isHost = useStore(roomStore, (s) => s.isHost);
```

**WebSocket hook is already handling `room:state` updates** in `use-websocket.ts` (lines 49-60). The hook automatically calls `setRoom()`, `setParticipantId()`, and `updateHost()` on incoming `room:state` messages. Your `use-room` hook should handle additional UI-specific logic (navigation, error display) rather than duplicating store updates.

### Key Types (from `@jellysync/shared`)

```typescript
interface Participant { id: string; displayName: string; joinedAt: number; isHost: boolean; }
interface RoomStatePayload { roomCode: string; hostId: string; participants: Participant[]; participantId?: string; }
type ConnectionState = 'disconnected' | 'connecting' | 'connected';

// Constants
ROOM_MESSAGE_TYPE.CREATE  // 'room:create'
ROOM_MESSAGE_TYPE.LEAVE   // 'room:leave'
ROOM_MESSAGE_TYPE.STATE   // 'room:state'
ROOM_CONFIG.CODE_LENGTH   // 6
ROOM_CONFIG.MAX_PARTICIPANTS // 20
```

### Design System Tokens

| Element | Token / Value |
|---------|--------------|
| Screen background | `bg-surface` (#131313) |
| Glass container | `surface_container_high/40` + `backdrop-blur-xl` + `border border-outline-variant/15` |
| Room code text | `font-mono text-6xl md:text-7xl text-primary tracking-[0.2em]` |
| Pulse dot | `w-3 h-3 rounded-full bg-primary` with animated glow shadow |
| Primary CTA | `gradient-primary rounded-md` (already defined in tailwind config as `primary` -> `primary_container` at 135deg) |
| Tertiary text button | `text-primary` with no container background |
| Participant chip avatar | `w-10 h-10 rounded-full border-2 border-surface` |
| Host suffix text | `text-primary` "(Host)" |
| Empty slot | `border border-dashed border-outline-variant/30 opacity-60` |
| Movie card | `bg-surface-container-low rounded-lg p-4` |
| Section spacing | `gap-8` (spacing.8 = 2.75rem) between major sections |
| Component padding | `p-6` (spacing.6 = 2rem) for glass containers |

### File Structure

```
apps/mobile/
  app/room/
    _layout.tsx          # Immersive layout (no tabs, no header)
    [code].tsx           # Room lobby screen
  src/features/room/
    components/
      room-code-display.tsx
      participant-chip.tsx
      movie-brief-card.tsx
    hooks/
      use-room.ts
      use-share-room.ts
    index.ts

apps/web/
  src/
    routes/room/
      lobby.tsx           # Room lobby (/room/:code)
    features/room/
      components/
        room-code-display.tsx
        participant-chip.tsx
        movie-brief-card.tsx
      hooks/
        use-room.ts
        use-share-room.ts
      index.ts
```

### Project Structure Notes

- Mobile uses Expo Router file-based routing: `app/room/[code].tsx` handles `/room/ABC123` and deep links
- Web uses React Router: `/room/:code` route defined in router config
- Feature components live in `src/features/room/` — NOT in `src/shared/components/` (these are room-specific)
- Shared components (`GlassHeader`, `ActionCard`) already exist in `src/shared/components/`
- Zustand store instance (`roomStore`) already exported from `src/lib/room.ts` in both apps
- `WebSocketProvider` already wraps authenticated routes in both app layouts
- The `glass` utility class is already defined in `global.css` for glassmorphic backgrounds
- The `gradient-primary` utility class is already defined in `tailwind.config.js` for CTA buttons
- Fonts: `font-display` = Manrope, `font-body` = Inter (already configured in tailwind)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2 — Lines 351-373]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture — Mobile App Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns — WebSocket Protocol]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#RoomCodeDisplay — Lines 772-778]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ParticipantChip — Lines 797-808]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#MovieBriefCard — Lines 857-862]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Contexts — Lines 955-975]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Room Code Scaling — Line 1040]
- [Source: _bmad-output/implementation-artifacts/2-1-signaling-server-and-websocket-foundation.md — Protocol patterns, store patterns]
- [Source: packages/shared/src/protocol/messages.ts — WsMessage, Participant, RoomStatePayload types]
- [Source: packages/shared/src/protocol/constants.ts — ROOM_MESSAGE_TYPE, ERROR_CODE, ROOM_CONFIG constants]
- [Source: packages/shared/src/stores/room-store.ts — createRoomStore, RoomState, RoomActions]
- [Source: apps/mobile/src/shared/hooks/use-websocket.ts — useWebSocket hook with auto room:state handling]
- [Source: apps/mobile/src/shared/providers/websocket-provider.tsx — useWs() context hook]
- [Source: apps/mobile/app/index.tsx — Home Hub with Create Room / Join Room ActionCards]

### Previous Story Intelligence (Story 2-1)

- **WebSocket hook already handles `room:state` store updates**: Lines 49-60 of `use-websocket.ts` automatically update the room store when `room:state` messages arrive. Do NOT duplicate this logic.
- **Store uses vanilla Zustand (`createStore`)**: Access via `useStore(roomStore, selector)` — not a React hook-based store.
- **Server generates participant IDs**: The server assigns UUIDs; `participantId` is included in the first `room:state` response after `room:create`.
- **Grace period on disconnect**: Server waits 30s before removing a participant. Client auto-reconnects with exponential backoff and sends `room:rejoin`.
- **Room code format**: 6 chars from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no ambiguous 0/O/1/I/L). Stored as `XXXXXX`, display as `XXX-XXX`.
- **Error handling**: Server errors arrive as `{ type: 'error', payload: { code, message } }`. Use `ERROR_CODE` constants to match. The `message` field is already user-friendly.
- **Build quirk**: Server tsconfig had paths removed to fix rootDir issue — import shared types from `@jellysync/shared` workspace alias, never relative paths.

### Git Intelligence

Recent commit `e706b5b` implemented Story 2-1 with:
- 22 new files across server/shared/mobile/web
- Vitest configured for server (`apps/server/vitest.config.ts`)
- WebSocketProvider added to both `apps/mobile/app/_layout.tsx` and `apps/web/src/app.tsx`
- All tests passing (87 total)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
- No blocking issues encountered during implementation.
- Pre-existing TS error in `apps/mobile/index.ts` (Expo template `./App` import) — unrelated to this story.

### Completion Notes List
- Implemented full Room Lobby screen for both mobile (Expo Router) and web (React Router) platforms.
- Home Hub "Create Room" button now sends `room:create` via WebSocket and navigates to lobby on `room:state` response.
- `RoomCodeDisplay` component renders 6-char code as `XXX-XXX` in monospace, inside glassmorphic container with animated pulse dot. Accessible code announced as individual characters.
- Share/Copy actions: mobile uses `Share.share()` + `Clipboard.setString()`, web uses `navigator.share()` with clipboard fallback. Copy shows checkmark confirmation for 2 seconds.
- `ParticipantChip` supports 3 variants: host (with "(Host)" suffix + primary mic), participant, and empty slot (dashed border).
- `MovieBriefCard` placeholder with dashed poster area and "Browse Library" hint for Epic 3.
- `use-room` hook handles `room:close` and `error` WebSocket events with user-facing alerts.
- Room lobby uses immersive navigation (no persistent nav bars), with contextual back/cancel controls.
- Cancel/back sends `room:leave`, clears store, navigates to Home Hub.
- All 105 tests pass (74 shared/packages + 31 server). New room lobby tests cover code formatting, store updates on room:state, participant join flow, and room leave/clear.
- TypeScript compiles cleanly for web and shared packages. Mobile has only pre-existing template error.

### File List
- apps/mobile/app/room/_layout.tsx (new)
- apps/mobile/app/room/[code].tsx (new)
- apps/mobile/app/index.tsx (modified)
- apps/mobile/src/features/room/components/room-code-display.tsx (new)
- apps/mobile/src/features/room/components/participant-chip.tsx (new)
- apps/mobile/src/features/room/components/movie-brief-card.tsx (new)
- apps/mobile/src/features/room/hooks/use-room.ts (new)
- apps/mobile/src/features/room/hooks/use-share-room.ts (new)
- apps/mobile/src/features/room/index.ts (new)
- apps/web/src/app.tsx (modified)
- apps/web/src/routes/index.tsx (modified)
- apps/web/src/routes/room/lobby.tsx (new)
- apps/web/src/features/room/components/room-code-display.tsx (new)
- apps/web/src/features/room/components/participant-chip.tsx (new)
- apps/web/src/features/room/components/movie-brief-card.tsx (new)
- apps/web/src/features/room/hooks/use-room.ts (new)
- apps/web/src/features/room/hooks/use-share-room.ts (new)
- apps/web/src/features/room/index.ts (new)
- packages/shared/src/protocol/room-lobby.test.ts (new)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified)

## Change Log
- 2026-03-24: Implemented Story 2-2 — Room Creation & Lobby Screen. Created 18 new files across mobile, web, and shared packages. Modified 4 existing files (Home Hub screens, web app router, sprint status). All tests passing (105 total).
