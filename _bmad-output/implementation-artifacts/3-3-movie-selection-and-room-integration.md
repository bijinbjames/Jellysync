# Story 3.3: Movie Selection & Room Integration

Status: done

## Story

As a host,
I want to select a movie and have it linked to my room,
so that participants can see what we're about to watch.

## Acceptance Criteria

1. **Given** the host is browsing the library after tapping Create Room, **When** the host taps a movie poster, **Then** a room is created (`room:create` sent to signaling server) with the selected movie attached, **And** the host lands on the Room Lobby screen, **And** the MovieBriefCard displays the selected movie's poster thumbnail (64x96px, `rounded-md`, ghost border), title (Manrope bold xl), and metadata (secondary label — year + runtime), **And** the room code and share functionality are immediately available.

2. **Given** the host is already in a Room Lobby without a movie selected, **When** the host navigates to the library and selects a movie, **Then** the Room Lobby updates with the selected movie's MovieBriefCard, **And** the room code remains the same.

3. **Given** participants are in the Room Lobby, **When** the host has selected a movie and at least one participant has joined, **Then** the "Start Movie" gradient primary button becomes enabled, **And** tapping "Start Movie" transitions to a placeholder player screen (playback implementation in Epic 4).

## Tasks / Subtasks

- [x] Task 1: Create movie selection store (AC: #1, #2)
  - [x] 1.1 Create `packages/shared/src/stores/movie-store.ts` with vanilla Zustand store
  - [x] 1.2 Store shape: `{ selectedMovie: SelectedMovie | null, setMovie: (movie) => void, clearMovie: () => void }`
  - [x] 1.3 Define `SelectedMovie` type: `{ id: string, name: string, year?: number, runtimeTicks?: number, imageTag?: string }`
  - [x] 1.4 Export from `packages/shared/src/stores/index.ts`
  - [x] 1.5 Create `movieStore` instance in `apps/web/src/lib/movie.ts` and `apps/mobile/src/lib/movie.ts`
  - [x] 1.6 Write tests for store actions

- [x] Task 2: Wire poster tap → movie selection + room creation flow (AC: #1)
  - [x] 2.1 `PosterGrid` already accepts `onMoviePress` prop and passes it to `PosterCard` as `onPress` — NO changes needed to grid components
  - [x] 2.2 In Library page (web): pass `onMoviePress` to `PosterGrid`, on poster tap call `movieStore.getState().setMovie(...)`, send `room:create` via WebSocket, navigate to `/room/:code` on `room:state` response
  - [x] 2.3 In Library screen (mobile): same flow using Expo Router `router.push(`/room/${code}`)`
  - [x] 2.4 Handle the case where host is already in a room (AC: #2) — set movie without re-creating room, navigate back to lobby

- [x] Task 3: Update MovieBriefCard to show selected movie (AC: #1, #2)
  - [x] 3.1 Web: Update `apps/web/src/features/room/components/movie-brief-card.tsx` to accept and display movie data
  - [x] 3.2 Show poster thumbnail via `getImageUrl(serverUrl, id, imageTag, { fillWidth: 128, quality: 90 })` — 64x96px rendered, `rounded-md`, ghost border (`border border-outline-variant/30`)
  - [x] 3.3 Show title (Manrope bold, `text-xl`) and metadata line: year + formatted runtime
  - [x] 3.4 Keep "No movie selected" empty state when `selectedMovie` is null
  - [x] 3.5 Mobile: Update `apps/mobile/src/features/room/components/movie-brief-card.tsx` with same logic using RN primitives
  - [x] 3.6 Read movie from `movieStore` using `useStore(movieStore, (s) => s.selectedMovie)`
  - [x] 3.7 Read `serverUrl` from `authStore` for image URL generation

- [x] Task 4: Add "Start Movie" button to Room Lobby (AC: #3)
  - [x] 4.1 Web lobby: Add gradient primary button below MovieBriefCard
  - [x] 4.2 Disabled state: `opacity-50 cursor-not-allowed` when `selectedMovie === null || participants.length < 2`
  - [x] 4.3 Enabled state: gradient-primary styling, navigates to `/player` placeholder screen
  - [x] 4.4 Mobile lobby: Same button using `Pressable` + gradient styling
  - [x] 4.5 Create placeholder player route — web: `apps/web/src/routes/player.tsx`, mobile: `apps/mobile/app/player.tsx`
  - [x] 4.6 Placeholder shows movie title + "Playback coming in Epic 4" centered on `surface_container_lowest` (#0e0e0e) background

- [x] Task 5: Handle library navigation from Room Lobby (AC: #2)
  - [x] 5.1 Add "Browse Library" / "Change Movie" button to Room Lobby (host only)
  - [x] 5.2 Web: navigates to `/library` with query param `?from=lobby` to indicate return-to-lobby intent
  - [x] 5.3 Mobile: pushes `/library` onto stack
  - [x] 5.4 In Library page, detect `from=lobby` context — on movie select, update `movieStore` and navigate back to lobby instead of creating a new room

- [x] Task 6: Format runtime helper (AC: #1)
  - [x] 6.1 Create `formatRuntime(ticks: number): string` in `packages/shared/src/jellyfin/library.ts`
  - [x] 6.2 Convert Jellyfin ticks (10,000,000 ticks per second) to "Xh Ym" format
  - [x] 6.3 Export from `packages/shared/src/jellyfin/index.ts`
  - [x] 6.4 Write unit test for formatting edge cases (0, < 1h, multi-hour)

- [x] Task 7: Write tests (AC: #1, #2, #3)
  - [x] 7.1 Test movie store: setMovie, clearMovie, initial state
  - [x] 7.2 Test formatRuntime: various tick values
  - [x] 7.3 Test MovieBriefCard renders movie data when selected, shows empty state when null
  - [x] 7.4 Co-locate tests: `movie-store.test.ts`, `library.test.ts` (append runtime tests)

- [x] Task 8: Run full test suite and verify no regressions
  - [x] 8.1 Run `pnpm test` from monorepo root
  - [x] 8.2 Verify all existing tests still pass
  - [x] 8.3 Verify TypeScript compilation succeeds

## Dev Notes

### Architecture Compliance

- **Movie state is CLIENT-ONLY** — the signaling server has zero knowledge of Jellyfin (architectural boundary). Movie selection is stored in a Zustand store on the client. The server only manages room/participant state.
- **Zustand for client state, TanStack Query for server/API state** — movie selection is client state (Zustand), movie metadata from Jellyfin is server state (TanStack Query). Do NOT put selected movie in TanStack Query cache.
- **Vanilla Zustand pattern:** `createStore` from `zustand/vanilla`, access via `useStore(movieStore, selector)` — NOT `useMovieStore()` hook pattern.
- **Feature folder pattern:** Room components in `apps/{platform}/src/features/room/components/`, library components in `apps/{platform}/src/features/library/components/`.
- **Component duplication across platforms is ACCEPTABLE** — React Native and web components are separate implementations.
- **File naming:** kebab-case (`movie-store.ts`, `movie-brief-card.tsx`).
- **Import extensions:** Use `.js` extensions in all imports (ESM convention).

### Reuse from Previous Stories — DO NOT RECREATE

| Import | From | Purpose |
|--------|------|---------|
| `useLibrary` | `@jellysync/shared` | Shared hook composing movie list + category queries |
| `useMovieDetails` | `@jellysync/shared` | TanStack Query hook for movie metadata |
| `getImageUrl` | `@jellysync/shared` | Builds poster image URL from serverUrl + itemId + imageTag |
| `JellyfinLibraryItem` | `@jellysync/shared` | Type for movie items from library list |
| `JellyfinMovieDetails` | `@jellysync/shared` | Extended movie metadata type |
| `createWsMessage` | `@jellysync/shared` | WebSocket message factory |
| `ROOM_MESSAGE_TYPE` | `@jellysync/shared` | Room message type constants (`CREATE`, `STATE`, etc.) |
| `createRoomStore` | `@jellysync/shared` | Room state store (already instantiated in `apps/*/src/lib/room.ts`) |
| `PosterCard` | `features/library/components/poster-card` | Already accepts `onPress` callback |
| `PosterGrid` | `features/library/components/poster-grid` | Grid layout — already has `onMoviePress` prop, just pass it from Library page |
| `CategoryChips` | `features/library/components/category-chips` | Category filter chips |
| `GlassHeader` | `shared/components/glass-header` | Navigation header component |
| `RoomCodeDisplay` | `features/room/components/room-code-display` | Room code display with share |
| `ParticipantChip` | `features/room/components/participant-chip` | Participant list chip |
| `MovieBriefCard` | `features/room/components/movie-brief-card` | Movie display in lobby — currently placeholder, needs update |

### Auth Store Access Pattern

```typescript
import { useStore } from 'zustand';
import { authStore } from '../../lib/auth';  // platform-specific path

const serverUrl = useStore(authStore, (s) => s.serverUrl);
const token = useStore(authStore, (s) => s.token);
const userId = useStore(authStore, (s) => s.userId);
const username = useStore(authStore, (s) => s.username);
```

### Movie Store Pattern (New — Follow Existing Store Conventions)

```typescript
// packages/shared/src/stores/movie-store.ts
import { createStore } from 'zustand/vanilla';

export interface SelectedMovie {
  id: string;
  name: string;
  year?: number;
  runtimeTicks?: number;
  imageTag?: string;
}

export interface MovieState {
  selectedMovie: SelectedMovie | null;
}

export interface MovieActions {
  setMovie: (movie: SelectedMovie) => void;
  clearMovie: () => void;
}

export type MovieStore = MovieState & MovieActions;

export function createMovieStore() {
  return createStore<MovieStore>()((set) => ({
    selectedMovie: null,
    setMovie: (movie) => set({ selectedMovie: movie }),
    clearMovie: () => set({ selectedMovie: null }),
  }));
}

export type MovieStoreInstance = ReturnType<typeof createMovieStore>;
```

```typescript
// apps/web/src/lib/movie.ts (and apps/mobile/src/lib/movie.ts)
import { createMovieStore } from '@jellysync/shared';

export const movieStore = createMovieStore();
```

### Room Creation Flow (Critical)

The UX spec states: "Room is created the moment a movie is selected — no separate 'create room' confirmation."

**Flow: Home Hub → Create Room → Library Browser → tap poster → room created + navigate to lobby**

```typescript
// In Library page onMovieSelect handler:
const handleMovieSelect = (item: JellyfinLibraryItem) => {
  // 1. Store selected movie in client state
  movieStore.getState().setMovie({
    id: item.Id,
    name: item.Name,
    year: item.ProductionYear,
    runtimeTicks: item.RunTimeTicks,
    imageTag: item.ImageTags?.Primary,
  });

  // 2. If already in a room (from=lobby), just navigate back
  if (fromLobby) {
    navigate(-1); // or router.back()
    return;
  }

  // 3. Otherwise, create room
  const username = authStore.getState().username;
  send(createWsMessage(ROOM_MESSAGE_TYPE.CREATE, { displayName: username ?? 'User' }));
  // Room code comes back via room:state message — handled by existing WS subscription
};

// Subscribe to room:state to navigate to lobby after room creation:
useEffect(() => {
  const unsub = subscribe(ROOM_MESSAGE_TYPE.STATE, (msg) => {
    const payload = msg.payload as { roomCode: string; hostId: string; participants: Participant[] };
    roomStore.getState().setRoom(payload.roomCode, payload.hostId, payload.participants);
    navigate(`/room/${payload.roomCode}`);
  });
  return unsub;
}, [subscribe, navigate]);
```

### WebSocket Integration Pattern

The Library page needs WebSocket access for room creation. It's already wrapped in `AuthenticatedRoutes` which includes `WebSocketProvider`, so `useWs()` is available.

```typescript
import { useWs } from '../../shared/providers/websocket-provider';

const { send, subscribe } = useWs();
```

### Runtime Formatting

```typescript
// Jellyfin uses ticks: 10,000,000 ticks = 1 second
export function formatRuntime(ticks: number): string {
  const totalMinutes = Math.round(ticks / (10_000_000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
```

### MovieBriefCard Updated Design

```
+---+-------------------------------+
| P |  Movie Title (Manrope bold)   |
| O |  2024 · 2h 15m (secondary)    |
| S |                               |
| T |                               |
+---+-------------------------------+
```

- Poster thumbnail: 64x96px (`w-16 h-24`), `rounded-md`, ghost border (`border border-outline-variant/30`)
- Image URL: `getImageUrl(serverUrl, id, imageTag, { fillWidth: 128, quality: 90 })`
- Title: Manrope bold, `text-xl`, `text-on-surface`
- Metadata: `text-on-surface-variant`, year + `formatRuntime(runtimeTicks)`, separated by " · "
- Container: `bg-surface-container-low rounded-2xl p-4` (matches existing)

### "Start Movie" Button Design

- Gradient primary button (`gradient-primary`), full width, `rounded-md`, `min-h-[48px]`
- Text: "Start Movie" (Manrope bold)
- **Disabled when:** `selectedMovie === null` OR `participants.length < 2` (host counts as 1, need at least 1 more)
- **Enabled when:** movie selected AND at least 2 participants (host + 1 guest)
- On tap: navigate to placeholder player screen

### Placeholder Player Screen

Minimal screen for Epic 4 handoff:
- Background: `surface_container_lowest` (#0e0e0e)
- Centered: movie title + "Playback coming in Epic 4"
- Back button to return to lobby

### Navigation Context Detection

To differentiate "creating a new room" vs "changing movie in existing room":
- Web: use URL search param `?from=lobby` when navigating from lobby to library
- Mobile: use Expo Router's `useLocalSearchParams` with `from=lobby` param
- If `from=lobby` is present, poster tap updates `movieStore` only (no `room:create`), then navigates back

### Existing Lobby Components (Room Lobby Already Has)

The Room Lobby screens (web: `apps/web/src/routes/room/lobby.tsx`, mobile: `apps/mobile/app/room/[code].tsx`) already render:
- `RoomCodeDisplay` — room code with share button
- `ParticipantChip` list — host, participants, empty slots
- `MovieBriefCard` — currently shows "No movie selected" placeholder
- "Cancel Room" / leave button

This story adds:
- Updated `MovieBriefCard` showing selected movie data from `movieStore`
- "Start Movie" button (below MovieBriefCard)
- "Browse Library" / "Change Movie" action (host-only, navigates to library with `?from=lobby`)

### Design Token Reference

| Token | Value | Usage |
|-------|-------|-------|
| `surface` | #131313 | Screen background |
| `surface_container_low` | #171717 | MovieBriefCard container |
| `surface_container_lowest` | #0e0e0e | Player placeholder bg |
| `surface_container_high` | #1e1e1e | Disabled button bg |
| `primary` | #6ee9e0 | Gradient start, active elements |
| `primary_container` | #005048 | Gradient end |
| `on-primary` | #003731 | Text on gradient buttons |
| `secondary` | #c8bfff | Metadata accent |
| `on-surface` | #e5e2e1 | Primary text |
| `on-surface-variant` | #bcc9c7 | Secondary text, metadata |
| `outline-variant` | at 30% opacity | Ghost borders |
| `error` | (existing) | Cancel/leave text |

### Query Key Scoping (Critical — from 3-1 review)

TanStack Query hooks already scope by `serverUrl` and `userId`. When navigating from lobby → library → lobby, the movie list is served from cache (staleTime 5min). No additional cache config needed.

### Anti-Patterns to Avoid

- DO NOT send movie data to the signaling server — the server has zero knowledge of Jellyfin (architectural boundary)
- DO NOT store selected movie in TanStack Query — it's client state (Zustand)
- DO NOT create custom navigation state management — use router params and URL search params
- DO NOT use raw `fetch()` for Jellyfin data — use TanStack Query hooks from `@jellysync/shared`
- DO NOT create a utils.ts grab-bag — name files specifically
- DO NOT use `any` type — all data is typed
- DO NOT use `.ts` extensions in imports — use `.js` per ESM convention
- DO NOT use `useXxxStore()` hook pattern — use `useStore(xxxStore, selector)` vanilla pattern
- DO NOT add modals or alerts for errors — inline error display only
- DO NOT duplicate hooks from `@jellysync/shared` — import them directly
- DO NOT create new HTTP client wrappers — `makeRequest` already exists

### Project Structure Notes

New files:
```
packages/shared/src/stores/movie-store.ts        # Movie selection store
packages/shared/src/stores/movie-store.test.ts    # Store tests
apps/web/src/lib/movie.ts                         # Web movie store instance
apps/mobile/src/lib/movie.ts                      # Mobile movie store instance
apps/web/src/routes/player.tsx                     # Placeholder player screen
apps/mobile/app/player.tsx                         # Placeholder player screen
```

Modified files:
```
packages/shared/src/stores/index.ts               # Export createMovieStore
packages/shared/src/jellyfin/library.ts            # Add formatRuntime
packages/shared/src/jellyfin/index.ts              # Export formatRuntime
apps/web/src/features/room/components/movie-brief-card.tsx   # Show selected movie
apps/mobile/src/features/room/components/movie-brief-card.tsx # Show selected movie
## NOTE: PosterGrid already has onMoviePress prop — NO modification needed
apps/web/src/routes/library.tsx                    # Wire movie selection + room creation
apps/mobile/app/library.tsx                        # Wire movie selection + room creation
apps/web/src/routes/room/lobby.tsx                 # Add Start Movie button + Browse Library
apps/mobile/app/room/[code].tsx                    # Add Start Movie button + Browse Library
apps/web/src/app.tsx                               # Add /player route
```

### Performance Target

- Library page load < 2 seconds (NFR10) — already met via TanStack Query caching
- UI interaction feedback < 100ms — poster tap → store update is synchronous
- Room creation (WebSocket round-trip) < 1 second on healthy connection

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3, Story 3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management, WebSocket Protocol, Signaling Server Boundary]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#MovieBriefCard, Room Lobby, Button Tiers, Screen Transitions]
- [Source: _bmad-output/planning-artifacts/prd.md#FR14, FR15, Journey 1, Journey 2]
- [Source: _bmad-output/implementation-artifacts/3-1-jellyfin-library-api-client-and-data-layer.md#Dev Notes]
- [Source: _bmad-output/implementation-artifacts/3-2-library-browser-screen.md#Dev Notes, Completion Notes]
- [Source: apps/server/src/rooms/room-manager.ts — Room creation is participant-only, no movie data]
- [Source: apps/web/src/routes/room/lobby.tsx — Current lobby with MovieBriefCard placeholder]
- [Source: packages/shared/src/stores/room-store.ts — Vanilla Zustand store pattern to follow]
- [Source: packages/shared/src/protocol/messages.ts — WebSocket message types]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Created vanilla Zustand movie selection store (`createMovieStore`) following exact pattern of `createRoomStore` — factory function exported from shared package, instances created per-platform.
- Added `formatRuntime(ticks)` to convert Jellyfin ticks to "Xh Ym" format in `library.ts`.
- Wired library pages (web + mobile) to handle movie selection with room creation flow: poster tap stores movie, sends `room:create`, navigates to lobby on `room:state` response.
- Implemented `from=lobby` navigation context to differentiate "new room" vs "change movie" flows.
- Updated `MovieBriefCard` on both platforms: reads from `movieStore` and `authStore`, shows poster thumbnail (64x96, rounded-md, ghost border), title (Manrope bold xl), and metadata (year + runtime).
- Added "Start Movie" gradient primary button to lobby — disabled when no movie or < 2 participants.
- Added host-only "Browse Library" / "Change Movie" button to lobby.
- Created placeholder player screens for Epic 4 handoff.
- Added `/player` route to web app router.
- Clears movie store on room leave to prevent stale state.
- All 138 shared package tests pass (6 new movie-store tests, 5 new formatRuntime tests). Full monorepo test suite green. TypeScript compiles cleanly.

### Change Log

- 2026-03-25: Implemented Story 3.3 — movie selection store, library-to-lobby room creation flow, MovieBriefCard with movie data, Start Movie button, Browse Library/Change Movie navigation, formatRuntime helper, placeholder player screens. All tests pass.
- 2026-03-25: Fixed Create Room flow — Home Hub "Create Room" now navigates to /library (browse first, room created on movie select) instead of creating an empty room immediately. Updated both web and mobile home screens.

### File List

New files:
- packages/shared/src/stores/movie-store.ts
- packages/shared/src/stores/movie-store.test.ts
- apps/web/src/lib/movie.ts
- apps/mobile/src/lib/movie.ts
- apps/web/src/routes/player.tsx
- apps/mobile/app/player.tsx

Modified files:
- apps/web/src/routes/index.tsx
- apps/mobile/app/index.tsx
- packages/shared/src/stores/index.ts
- packages/shared/src/jellyfin/library.ts
- packages/shared/src/jellyfin/index.ts
- packages/shared/src/jellyfin/library.test.ts
- apps/web/src/features/room/components/movie-brief-card.tsx
- apps/mobile/src/features/room/components/movie-brief-card.tsx
- apps/web/src/routes/library.tsx
- apps/mobile/app/library.tsx
- apps/web/src/routes/room/lobby.tsx
- apps/mobile/app/room/[code].tsx
- apps/web/src/app.tsx
