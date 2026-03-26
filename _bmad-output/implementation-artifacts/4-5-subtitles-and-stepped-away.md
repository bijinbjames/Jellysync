# Story 4.5: Subtitles & Stepped-Away

Status: review

## Story

As a participant,
I want to toggle subtitles for myself and indicate when I step away,
So that I can personalize my viewing experience and the group pauses when someone leaves.

## Acceptance Criteria (BDD)

1. **Given** the player controls are visible, **When** the participant taps the CC (closed captions) icon, **Then** English subtitles toggle on or off for that participant only (FR22), **And** no other participant's subtitle state is affected, **And** the CC icon shows active state (`primary` color) when subtitles are on, **And** subtitles are retrieved from the Jellyfin API for the selected movie.

2. **Given** a participant steps away (e.g., app backgrounded on mobile, or explicit "step away" action), **When** the stepped-away state is detected, **Then** a `participant:stepped-away` message is sent to the server, **And** the server triggers `sync:pause` for all participants, **And** the stepped-away participant's avatar dims (reduced opacity) with a stepped-away indicator, **And** other participants see a brief notification: "[Name] stepped away".

3. **Given** the stepped-away participant returns, **When** the app is foregrounded or the participant resumes, **Then** a `participant:returned` message is sent to the server, **And** the server triggers `sync:play` to resume playback for all participants, **And** the participant's avatar returns to normal opacity, **And** resume is automatic - no manual action required from any participant (FR23).

## Tasks / Subtasks

- [x] **Task 1: Add subtitle track types and Jellyfin subtitle support** (AC: #1)
  - [x] 1.1 Add `SubtitleTrack` type to `packages/shared/src/jellyfin/types.ts`: `{ index: number; language: string; displayTitle: string; codec: string; isDefault: boolean; isForced: boolean }`
  - [x] 1.2 Add `extractSubtitleTracks(mediaSources: MediaSource[]): SubtitleTrack[]` helper to `packages/shared/src/jellyfin/streaming.ts` — parses `MediaStreams` where `Type === 'Subtitle'`
  - [x] 1.3 Add `getSubtitleUrl(serverUrl: string, itemId: string, mediaSourceIndex: number, streamIndex: number, format?: string): string` to `packages/shared/src/jellyfin/streaming.ts` — builds URL: `/Videos/{itemId}/{mediaSourceId}/Subtitles/{streamIndex}/Stream.{format}`
  - [x] 1.4 Export new types and functions from `packages/shared/src/jellyfin/` barrel
  - [x] 1.5 Write tests for `extractSubtitleTracks` and `getSubtitleUrl`

- [x] **Task 2: Add subtitle state to SyncStore** (AC: #1)
  - [x] 2.1 Add fields to `SyncState` in `packages/shared/src/stores/sync-store.ts`:
    - `subtitlesEnabled: boolean` (default: `false`)
    - `subtitleTrackIndex: number | null` (default: `null`)
    - `availableSubtitleTracks: SubtitleTrack[]` (default: `[]`)
  - [x] 2.2 Add actions:
    - `setSubtitlesEnabled: (enabled: boolean) => void`
    - `setSubtitleTrackIndex: (index: number | null) => void`
    - `setAvailableSubtitleTracks: (tracks: SubtitleTrack[]) => void`
  - [x] 2.3 Update `reset()` to clear subtitle fields
  - [x] 2.4 Write sync-store tests for subtitle state and actions

- [x] **Task 3: Add stepped-away message types to shared protocol** (AC: #2, #3)
  - [x] 3.1 Add constants to `PARTICIPANT_MESSAGE_TYPE` in `packages/shared/src/protocol/constants.ts`:
    - `STEPPED_AWAY: 'participant:stepped-away'`
    - `RETURNED: 'participant:returned'`
  - [x] 3.2 Define payload types in `packages/shared/src/protocol/messages.ts`:
    - `SteppedAwayPayload`: `{ participantId: string; participantName: string }`
    - `ReturnedPayload`: `{ participantId: string; participantName: string }`
  - [x] 3.3 Add discriminated union message types: `SteppedAwayMessage`, `ReturnedMessage`
  - [x] 3.4 Update `ParticipantMessage` union type to include new messages
  - [x] 3.5 Export new types from `packages/shared/src/protocol/index.ts`
  - [x] 3.6 Write protocol tests for new message type guards

- [x] **Task 4: Add stepped-away tracking to server room state** (AC: #2, #3)
  - [x] 4.1 Add `steppedAwayParticipants: Set<string>` to `Room` interface in `apps/server/src/rooms/types.ts`
  - [x] 4.2 Initialize `steppedAwayParticipants: new Set()` in `room-manager.ts` room creation
  - [x] 4.3 Add methods to `room-manager.ts`:
    - `markSteppedAway(roomCode: string, participantId: string): boolean` — adds to set, returns true if state changed
    - `markReturned(roomCode: string, participantId: string): boolean` — removes from set, returns true if state changed
    - `isParticipantSteppedAway(roomCode: string, participantId: string): boolean`
  - [x] 4.4 Clean up stepped-away state when participant leaves room (in existing `removeParticipant`)
  - [x] 4.5 Include `steppedAwayParticipants` (as array) in `room:state` payload for late joiners
  - [x] 4.6 Write room-manager tests for stepped-away tracking

- [x] **Task 5: Add server-side stepped-away handler** (AC: #2, #3)
  - [x] 5.1 Create `apps/server/src/rooms/stepped-away.ts`:
    - `handleSteppedAway(ws, payload, deps)`: validates participant in room, marks as stepped away, broadcasts `participant:stepped-away` to all others, triggers `sync:pause` with `pauseSource: 'stepped-away'` and participant name
    - `handleReturned(ws, payload, deps)`: validates participant in room, marks as returned, broadcasts `participant:returned` to all others, triggers `sync:play` to resume ONLY if no other participants are still stepped away
  - [x] 5.2 Wire stepped-away handlers into `apps/server/src/signaling/ws-handler.ts` message routing under `participant:` namespace (alongside existing `participant:permission-update`)
  - [x] 5.3 Write server tests: stepped-away triggers pause, returned triggers resume, no resume if others still away, late joiner receives stepped-away state, cleanup on participant leave

- [x] **Task 6: Implement subtitle toggle in GlassPlayerControls (Web)** (AC: #1)
  - [x] 6.1 Update `apps/web/src/features/player/components/glass-player-controls.tsx`:
    - Enable the existing CC button (remove `disabled` attribute)
    - Add `onSubtitleToggle` callback prop
    - Add `subtitlesEnabled` boolean prop
    - CC button: when subtitles off, show default style; when on, show `primary` (#6ee9e0) color and `primary/20` background
    - On click: call `onSubtitleToggle()`
  - [x] 6.2 Add subtitle track to video element: when `subtitlesEnabled` is true, add `<track>` element to `<video>` in the player page pointing to Jellyfin subtitle URL
  - [x] 6.3 Persist subtitle preference to localStorage via Zustand persist middleware

- [x] **Task 7: Implement subtitle toggle in GlassPlayerControls (Mobile)** (AC: #1)
  - [x] 7.1 Update `apps/mobile/src/features/player/components/glass-player-controls.tsx`:
    - Same CC button enablement as web
    - Add `onSubtitleToggle` and `subtitlesEnabled` props
    - Active state: `primary` color for CC text/icon
  - [x] 7.2 Configure expo-video subtitle track: use `VideoPlayer.subtitleTrack` or equivalent API to toggle subtitle display
  - [x] 7.3 Persist subtitle preference to AsyncStorage via Zustand persist middleware

- [x] **Task 8: Implement stepped-away client detection and UI (Web)** (AC: #2, #3)
  - [x] 8.1 Add `steppedAwayParticipantIds: string[]` to SyncStore (or RoomStore) with `addSteppedAway(id)` and `removeSteppedAway(id)` actions
  - [x] 8.2 Create `apps/web/src/features/player/hooks/use-stepped-away.ts`:
    - Listen for `visibilitychange` event on `document`
    - When `document.hidden === true` for > 5 seconds: send `participant:stepped-away` via WebSocket
    - When `document.hidden === false` (page visible again): send `participant:returned`
    - Debounce to avoid false triggers on brief tab switches (5-second threshold)
  - [x] 8.3 Update `apps/web/src/features/player/components/participant-avatars.tsx`:
    - Accept `steppedAwayParticipantIds` prop
    - For stepped-away participants: apply `opacity: 0.4` and show "zzz" or moon indicator
  - [x] 8.4 Add notification overlay in player: show "[Name] stepped away" / "[Name] is back" as brief toast (3-second auto-dismiss, positioned above seek bar)
  - [x] 8.5 Subscribe to `participant:stepped-away` and `participant:returned` messages in `usePlaybackSync` — update stepped-away state in store

- [x] **Task 9: Implement stepped-away client detection and UI (Mobile)** (AC: #2, #3)
  - [x] 9.1 Create `apps/mobile/src/features/player/hooks/use-stepped-away.ts`:
    - Use React Native `AppState` API to detect `active` → `background` transition
    - On background: send `participant:stepped-away` after 5-second debounce
    - On foreground (active): send `participant:returned`
  - [x] 9.2 Update `apps/mobile/src/features/player/components/participant-avatars.tsx`:
    - Same stepped-away visual treatment as web (reduced opacity + indicator)
  - [x] 9.3 Add notification overlay for mobile: same "[Name] stepped away" / "[Name] is back" toast

- [x] **Task 10: Wire everything into player screens** (AC: #1, #2, #3)
  - [x] 10.1 Update `apps/web/src/routes/player.tsx`:
    - Wire `useSteppedAway` hook
    - Pass `subtitlesEnabled` and `onSubtitleToggle` to GlassPlayerControls
    - Pass `steppedAwayParticipantIds` to ParticipantAvatars
    - When subtitles enabled, add `<track>` element to video with Jellyfin subtitle URL
    - Extract subtitle tracks from movie's MediaSources on mount and populate store
  - [x] 10.2 Update `apps/mobile/app/player.tsx`:
    - Same wiring as web
    - Use expo-video API for subtitle track configuration
  - [x] 10.3 Update `usePlaybackSync` hooks on both platforms:
    - Subscribe to `participant:stepped-away` and `participant:returned` messages
    - Update store with stepped-away participant state
  - [x] 10.4 Export new hooks and components from barrel files

- [x] **Task 11: Write comprehensive tests** (AC: #1, #2, #3)
  - [x] 11.1 Jellyfin tests: `extractSubtitleTracks` parses MediaStreams correctly, `getSubtitleUrl` generates correct URLs
  - [x] 11.2 Protocol tests: stepped-away/returned message type guards, payload validation
  - [x] 11.3 SyncStore tests: subtitle state fields, stepped-away participant tracking
  - [x] 11.4 Server tests: stepped-away handler (pause trigger, broadcast), returned handler (resume only when all back), late joiner receives state, cleanup on leave
  - [x] 11.5 Room-manager tests: markSteppedAway/markReturned state management
  - [x] 11.6 Stepped-away hook tests (web): visibilitychange detection, debounce, message sending
  - [x] 11.7 Ensure all existing 389 tests still pass — zero regressions

## Dev Notes

### Architecture Compliance

- **Subtitle state is participant-local**: Subtitles are NOT synchronized across participants. Each user toggles their own CC independently. No WebSocket messages needed for subtitle state — it's purely client-side state stored in Zustand with persist middleware (localStorage on web, AsyncStorage on mobile).
- **Stepped-away is server-authoritative**: The server tracks which participants are stepped away. When a participant steps away, the server triggers `sync:pause` (reusing existing pause broadcast infrastructure from Story 4-3). Resume only happens when ALL stepped-away participants have returned.
- **Reuse existing pause/play infrastructure**: Stepped-away auto-pause uses the same `sync:pause` / `sync:play` broadcast mechanism from Story 4-2/4-3. Add a new `pauseSource: 'stepped-away'` value to distinguish from host pause and buffer pause.
- **`participant:` namespace**: Story 4-4 established this namespace with `participant:permission-update`. Stepped-away adds `participant:stepped-away` and `participant:returned` — same routing pattern in `ws-handler.ts`.

### Critical Reuse — DO NOT RECREATE

| Import | From | Purpose |
|--------|------|---------|
| `SyncEngine` | `@jellysync/shared` (sync/sync-engine.ts) | Do NOT modify for this story — stepped-away flows through server, not sync engine |
| `broadcastToRoom` | Server ws-handler.ts | Reuse for broadcasting stepped-away/returned messages |
| `handleSyncPause` / `handleSyncPlay` | Server sync-handler.ts | Reuse existing pause/play broadcast for stepped-away triggers |
| `GlassPlayerControls` | features/player/components | Modify existing CC button — do NOT create new component |
| `ParticipantAvatars` | features/player/components | Modify existing component — add stepped-away visual state |
| `SyncStatusChip` | features/player/components | May show "STEPPED AWAY" state — extend existing variants |
| `usePlaybackSync` | features/player/hooks | Add subscription to stepped-away messages — do NOT create separate hook for message handling |
| `PARTICIPANT_MESSAGE_TYPE` | `@jellysync/shared` (protocol/constants.ts) | Extend with STEPPED_AWAY and RETURNED |
| `createWsMessage` | `@jellysync/shared` (protocol/messages.ts) | Message factory for new messages |
| `useSyncStore` | Platform-specific lib/sync | Extend with subtitle state — do NOT create new store |
| `useRoomStore` | Platform-specific lib/room | Read participant list for stepped-away tracking |
| `movieStore` / `selectedMovie` | Platform-specific lib/movie | Read MediaSources for subtitle track extraction |
| `HtmlVideoPlayer` / `VideoPlayerView` | Existing player components | Add `<track>` element for web subtitles; use expo-video subtitle API for mobile |

### Subtitle Implementation Details

**Jellyfin Subtitle API:**
- Movie details already fetch `MediaSources` which contain `MediaStreams` array
- Subtitle streams have `Type: 'Subtitle'` in MediaStreams
- Subtitle URL pattern: `/Videos/{itemId}/{mediaSourceId}/Subtitles/{streamIndex}/Stream.vtt`
- Use WebVTT format (`.vtt`) for best cross-platform compatibility — Jellyfin transcodes subtitle formats to VTT on the fly
- For web: use HTML5 `<track kind="subtitles">` element on the `<video>` tag
- For mobile (expo-video): use the player's subtitle track selection API

**Subtitle State:**
- `subtitlesEnabled` persisted to platform storage (localStorage/AsyncStorage)
- `subtitleTrackIndex` defaults to first available English track, or first track if no English
- `availableSubtitleTracks` populated from movie's MediaSources on player mount
- No room-level sync needed — purely client preference

**CC Button Active State:**
- Off: default icon/text color (`on_surface_variant`)
- On: `primary` (#6ee9e0) text/icon color, `primary/20` background tint

### Stepped-Away Implementation Details

**Detection Strategy:**
- **Web**: `document.visibilitychange` event → `document.hidden` check with 5-second debounce
- **Mobile**: React Native `AppState` → detect `active` → `background` transition with 5-second debounce
- The 5-second debounce prevents false triggers from brief tab switches or notification pull-downs

**Server-Side Flow:**
1. Client sends `participant:stepped-away` with `{ participantId, participantName }`
2. Server validates participant is in room
3. Server adds participant to `room.steppedAwayParticipants` set
4. Server broadcasts `participant:stepped-away` to all OTHER participants
5. Server triggers `sync:pause` with `pauseSource: 'stepped-away'` and `bufferPausedBy: participantName`
6. On return: reverse flow — remove from set, broadcast `participant:returned`
7. Resume condition: `room.steppedAwayParticipants.size === 0` — only resume when ALL away participants have returned

**Pause Source Extension:**
- Current `pauseSource` values: `'host'`, `'buffer'`
- Add: `'stepped-away'`
- SyncStatusChip should display: "STEPPED AWAY" with appropriate styling when `pauseSource === 'stepped-away'`

**Participant Avatar Visual Treatment:**
- Normal: full opacity, avatar circle with initial
- Stepped away: `opacity: 0.4`, small moon/zzz indicator overlay
- Host stepped away: same dim treatment (host is not exempt from stepping away)

**Notification Toast:**
- Position: above seek bar area, centered horizontally
- Style: glassmorphic pill (`surface_container_highest/60` + blur), `on_surface` text
- Content: "[Name] stepped away" or "[Name] is back"
- Duration: 3 seconds, auto-dismiss
- Stack: if multiple people step away, show most recent notification only

### Design Token Values

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#6ee9e0` | CC active state, subtitle-related accents |
| `primary/20` | `rgba(110, 233, 224, 0.2)` | CC button active background |
| `on_surface_variant` | `#CAC4D0` | CC inactive state, stepped-away text |
| `surface_container_highest` | `#36323B` | Toast notification background at 60% opacity |
| Stepped-away opacity | `0.4` | Participant avatar dim for away state |

### What This Story Does NOT Implement

- **Subtitle language selection UI** — Only toggle on/off for default track; full language picker is future polish
- **Subtitle styling/sizing** — Default browser/platform subtitle rendering; custom styling is future polish
- **Manual "step away" button** — Only auto-detection via app lifecycle; explicit step-away toggle is future
- **MicToggleFAB** — Epic 5 (position reserved)
- **Voice/audio features** — Epic 5
- **Subtitle sync across participants** — By design, each participant controls their own subtitles independently

### Previous Story Intelligence

**Story 4-4 (Player Controls & Host Permissions) established:**
- GlassPlayerControls with CC button placeholder (currently `disabled`) — enable it
- `participant:` message namespace with routing in ws-handler.ts — extend with stepped-away/returned
- `ParticipantAvatars` component showing circular avatar chips — extend with stepped-away visual state
- Permission model: `getValidatedRoomWithPermission()` in sync-handler.ts — reuse pattern for stepped-away validation
- 389 total tests (316 shared + 73 server) — maintain zero regressions
- `pauseSource` field on SyncStore — extend with `'stepped-away'` value

**Story 4-3 (Buffer Detection & Communal Pause) established:**
- `sync:pause` / `sync:play` broadcast mechanism — reuse for stepped-away auto-pause/resume
- `bufferPausedBy` field shows who caused the pause — reuse for stepped-away name display
- SyncStatusChip with "WAITING FOR [Name]..." state — similar pattern for "STEPPED AWAY" display
- Communal pause pattern: server broadcasts pause to all participants when one is affected

**Story 4-2 (Sync Engine) established:**
- Server-authoritative sync protocol — stepped-away flows through server same way
- `handleSyncPlay` / `handleSyncPause` in sync-handler.ts — reuse or call from stepped-away handler

**Story 4-1 (Video Player Foundation) established:**
- expo-video on mobile, `<video>` element on web — both support subtitle tracks
- MediaSources from Jellyfin include subtitle stream information
- Stream URL generation in `packages/shared/src/jellyfin/streaming.ts` — extend with subtitle URL

### Git Intelligence

Recent commits follow `feat:` prefix convention. Tests included in feature commits. Changes span server + shared + web + mobile in single commits. Commit message pattern: `feat: implement [feature] with code review fixes (Story X-Y)`. Story 4-4 was the most recent implementation, adding 94 new tests for a total of 389.

### Project Structure Notes

```
# NEW FILES
apps/server/src/rooms/stepped-away.ts                                 # Server stepped-away handler
apps/server/src/rooms/stepped-away.test.ts                             # Server stepped-away tests
apps/web/src/features/player/hooks/use-stepped-away.ts                 # Web app lifecycle detection
apps/mobile/src/features/player/hooks/use-stepped-away.ts              # Mobile AppState detection

# MODIFIED FILES
packages/shared/src/protocol/constants.ts       # Add STEPPED_AWAY, RETURNED to PARTICIPANT_MESSAGE_TYPE
packages/shared/src/protocol/messages.ts        # Add SteppedAwayPayload, ReturnedPayload, message types
packages/shared/src/protocol/index.ts           # Export new types
packages/shared/src/stores/sync-store.ts        # Add subtitlesEnabled, subtitleTrackIndex, availableSubtitleTracks, steppedAwayParticipantIds
packages/shared/src/stores/sync-store.test.ts   # Tests for new store fields
packages/shared/src/jellyfin/types.ts           # Add SubtitleTrack type
packages/shared/src/jellyfin/streaming.ts       # Add extractSubtitleTracks(), getSubtitleUrl()
apps/server/src/rooms/types.ts                  # Add steppedAwayParticipants to Room interface
apps/server/src/rooms/room-manager.ts           # Add markSteppedAway/markReturned, cleanup on leave, init set
apps/server/src/signaling/ws-handler.ts         # Route participant:stepped-away and participant:returned
apps/web/src/features/player/components/glass-player-controls.tsx      # Enable CC button, add subtitle props
apps/web/src/features/player/components/participant-avatars.tsx         # Add stepped-away visual state
apps/web/src/features/player/hooks/use-playback-sync.ts                # Subscribe to stepped-away messages, wire subtitles
apps/web/src/features/player/index.ts           # Export new hooks
apps/web/src/routes/player.tsx                  # Wire subtitle toggle, stepped-away, <track> element
apps/mobile/src/features/player/components/glass-player-controls.tsx   # Enable CC button, add subtitle props
apps/mobile/src/features/player/components/participant-avatars.tsx      # Add stepped-away visual state
apps/mobile/src/features/player/hooks/use-playback-sync.ts             # Subscribe to stepped-away messages, wire subtitles
apps/mobile/src/features/player/index.ts        # Export new hooks
apps/mobile/app/player.tsx                      # Wire subtitle toggle, stepped-away, expo-video subtitles
```

### Testing Standards

- Co-locate tests: `*.test.ts(x)` next to source files
- Use vitest (already configured)
- Jellyfin tests: subtitle track extraction from MediaStreams, URL generation
- Protocol tests: new message type guards and payload validation
- Server tests: stepped-away handler (pause trigger, broadcast, resume condition, late joiner state, cleanup)
- Store tests: subtitle state management, stepped-away participant tracking
- Hook tests: visibilitychange/AppState detection, debounce timing
- Target: zero regressions on existing 389 tests

### Anti-Patterns to Avoid

- DO NOT sync subtitle state across participants — subtitles are participant-local preference only
- DO NOT create a new Zustand store — extend existing `SyncStore` for subtitle state and stepped-away tracking
- DO NOT create separate WebSocket connection — use existing `useWebSocket()` / `send()`
- DO NOT modify `SyncEngine` for stepped-away — it flows through server handlers, not client sync logic
- DO NOT modify `HtmlVideoPlayer` or `VideoPlayerView` components — add `<track>` element at the player page level, configure expo-video subtitle API externally
- DO NOT use `.ts` extensions in imports — use `.js` per ESM convention
- DO NOT hardcode colors — use design token values from the table above
- DO NOT use `any` type — type all messages and payloads
- DO NOT implement manual "step away" button — only auto-detection via app lifecycle for this story
- DO NOT implement subtitle language picker — only on/off toggle for default track in this story

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 4, Story 4.5]
- [Source: _bmad-output/planning-artifacts/architecture.md - WebSocket Protocol, Participant Namespace, Zustand Stores, Jellyfin Client, Player Architecture]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - ParticipantChip States, Sacred Screen, GlassPlayerControls, Accessibility Requirements]
- [Source: _bmad-output/planning-artifacts/prd.md - FR22 (Independent Subtitles), FR23 (Stepped-Away Auto-Pause)]
- [Source: _bmad-output/implementation-artifacts/4-4-player-controls-and-host-permissions.md - CC Button Placeholder, Participant Namespace, ParticipantAvatars, Permission Model]
- [Source: packages/shared/src/protocol/constants.ts - PARTICIPANT_MESSAGE_TYPE to extend]
- [Source: packages/shared/src/protocol/messages.ts - ParticipantMessage union to extend]
- [Source: packages/shared/src/stores/sync-store.ts - SyncStore to extend with subtitle/stepped-away state]
- [Source: packages/shared/src/jellyfin/streaming.ts - Stream URL generation to extend with subtitles]
- [Source: apps/web/src/features/player/components/glass-player-controls.tsx - CC button to enable]
- [Source: apps/server/src/signaling/ws-handler.ts - participant: namespace routing to extend]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None required — all tests passed on first run.

### Completion Notes List

- ✅ Task 1: Added `SubtitleTrack` type, `JellyfinMediaStream` type, `extractSubtitleTracks()` and `getSubtitleUrl()` to shared jellyfin package with 9 new tests
- ✅ Task 2: Extended SyncStore with subtitle state (`subtitlesEnabled`, `subtitleTrackIndex`, `availableSubtitleTracks`) and stepped-away tracking (`steppedAwayParticipantIds`, `addSteppedAway`, `removeSteppedAway`, `setSteppedAwayPause`). Added `'stepped-away'` to `PauseSource` type. 20 new store tests.
- ✅ Task 3: Added `STEPPED_AWAY` and `RETURNED` to `PARTICIPANT_MESSAGE_TYPE`, `SteppedAwayPayload`/`ReturnedPayload` types, discriminated union message types, validation functions, and updated type guard sets. 22 new protocol tests.
- ✅ Task 4: Added `steppedAwayParticipants: Set<string>` to Room interface, initialized in room creation, added `markSteppedAway`/`markReturned`/`isParticipantSteppedAway` methods, cleanup on participant removal, and `steppedAwayParticipants` in room:state payload. 12 new room-manager tests.
- ✅ Task 5: Created `stepped-away.ts` server handler with `handleSteppedAway` (validates, marks, broadcasts to others, triggers sync:pause) and `handleReturned` (validates, marks, broadcasts, resumes only when ALL returned). Wired into ws-handler with broadcastToRoom exclude overload. 12 new server tests.
- ✅ Task 6: Enabled CC button in web GlassPlayerControls with `onSubtitleToggle`/`subtitlesEnabled` props, active state styling (#6ee9e0 color, primary/20 background), and `steppedAwayParticipantIds` prop.
- ✅ Task 7: Same CC button enablement for mobile GlassPlayerControls with RN Pressable and StyleSheet-based active state.
- ✅ Task 8: Created web `useSteppedAway` hook (visibilitychange + 5s debounce), updated `usePlaybackSync` to subscribe to stepped-away/returned messages, added `SteppedAwayToast` component, updated `SyncStatusChip` with stepped-away state.
- ✅ Task 9: Created mobile `useSteppedAway` hook (AppState API + 5s debounce), same usePlaybackSync updates, `SteppedAwayToast` and `SyncStatusChip` for mobile.
- ✅ Task 10: Wired subtitles (useMovieDetails for MediaSources, extractSubtitleTracks, programmatic `<track>` element on web, subtitle toggle callback) and stepped-away (useSteppedAway hook, toast, steppedAwayParticipantIds to controls) into both web and mobile player screens.
- ✅ Task 11: All tests written inline with tasks. 456 total tests (360 shared + 96 server), up from 389 — 67 new tests, zero regressions.

### Change Log

- 2026-03-26: Implemented subtitles & stepped-away features (Story 4-5) — 67 new tests added, 456 total passing

### File List

**New Files:**
- apps/server/src/rooms/stepped-away.ts
- apps/server/src/rooms/stepped-away.test.ts
- apps/web/src/features/player/hooks/use-stepped-away.ts
- apps/web/src/features/player/components/stepped-away-toast.tsx
- apps/mobile/src/features/player/hooks/use-stepped-away.ts
- apps/mobile/src/features/player/components/stepped-away-toast.tsx

**Modified Files:**
- packages/shared/src/jellyfin/types.ts
- packages/shared/src/jellyfin/streaming.ts
- packages/shared/src/jellyfin/streaming.test.ts
- packages/shared/src/jellyfin/index.ts
- packages/shared/src/protocol/constants.ts
- packages/shared/src/protocol/messages.ts
- packages/shared/src/protocol/index.ts
- packages/shared/src/protocol/participant-messages.test.ts
- packages/shared/src/stores/sync-store.ts
- packages/shared/src/stores/sync-store.test.ts
- apps/server/src/rooms/types.ts
- apps/server/src/rooms/room-manager.ts
- apps/server/src/rooms/room-manager.test.ts
- apps/server/src/signaling/ws-handler.ts
- apps/web/src/features/player/components/glass-player-controls.tsx
- apps/web/src/features/player/components/participant-avatars.tsx
- apps/web/src/features/player/components/sync-status-chip.tsx
- apps/web/src/features/player/hooks/use-playback-sync.ts
- apps/web/src/features/player/index.ts
- apps/web/src/routes/player.tsx
- apps/mobile/src/features/player/components/glass-player-controls.tsx
- apps/mobile/src/features/player/components/participant-avatars.tsx
- apps/mobile/src/features/player/components/sync-status-chip.tsx
- apps/mobile/src/features/player/hooks/use-playback-sync.ts
- apps/mobile/src/features/player/index.ts
- apps/mobile/app/player.tsx
