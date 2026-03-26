# Story 4.4: Player Controls & Host Permissions

Status: done

## Story

As a host,
I want full playback controls and the ability to manage what other participants can control,
So that I can lead the watch session while keeping the screen sacred.

## Acceptance Criteria (BDD)

1. **Given** the player is in sacred screen mode (default during playback), **When** no interaction occurs, **Then** no UI elements are visible except the MicToggleFAB placeholder position (Epic 5), **And** the movie owns every pixel of the screen.

2. **Given** the user taps anywhere on the video, **When** controls are not visible, **Then** the GlassPlayerControls overlay appears with:
   - Top bar: glassmorphic header with back button, movie title (Manrope extrabold), quality label (`secondary` uppercase), CC icon placeholder (Story 4-5), menu action icons
   - Center: skip-back-10 button, Jewel play/pause button (large circle, `surface_container_highest/40` + blur + glow aura, `primary` icon, `active:scale-95`), skip-forward-10 button
   - Bottom: timestamp labels (tabular-nums), seek bar (gradient fill `primary/80` to `primary`, buffer line `white/20`, playhead dot), participant avatars + SyncStatusChip
   **And** controls auto-hide after 5 seconds of inactivity,
   **And** a subsequent tap hides the controls immediately.

3. **Given** the seek bar is interactive, **When** the user drags the playhead, **Then** the playhead enlarges and timestamp updates in real-time, **And** on release, a `sync:seek` command is sent if the user has seek permission.

4. **Given** the host accesses the permission settings, **When** the host configures playback permissions (FR21), **Then** the host can toggle which controls (play/pause, seek) other participants are allowed to use, **And** participants without permission see disabled controls (`surface_container_highest` background, `on_surface_variant` text, `cursor-not-allowed`), **And** permission changes are broadcast to all participants via `participant:permission-update`.

5. **Given** keyboard interaction on web, **When** the player is focused, **Then** Space toggles play/pause, Left/Right arrows seek +/-10s, M toggles mute (placeholder for Epic 5), F toggles fullscreen, Escape dismisses controls (UX-DR22).

## Tasks / Subtasks

- [x] **Task 1: Add permission message types to shared protocol** (AC: #4)
  - [x]1.1 Add `PARTICIPANT_MESSAGE_TYPE` with `PERMISSION_UPDATE: 'participant:permission-update'` to `packages/shared/src/protocol/constants.ts`
  - [x]1.2 Define payload types in `packages/shared/src/protocol/messages.ts`:
    - `ParticipantPermissions`: `{ canPlayPause: boolean; canSeek: boolean }`
    - `PermissionUpdatePayload`: `{ permissions: ParticipantPermissions; updatedBy: string }`
  - [x]1.3 Add discriminated union type `PermissionUpdateMessage`
  - [x]1.4 Export new types from `packages/shared/src/protocol/index.ts`
  - [x]1.5 Write protocol tests for new message type guards

- [x] **Task 2: Extend SyncStore with permission and controls-visibility state** (AC: #1, #2, #4)
  - [x]2.1 Add fields to `SyncState` in `packages/shared/src/stores/sync-store.ts`:
    - `controlsVisible: boolean` (whether GlassPlayerControls overlay is showing)
    - `permissions: ParticipantPermissions` (current user's permissions — host always has full permissions)
  - [x]2.2 Add actions:
    - `showControls: () => void` — sets `controlsVisible: true`
    - `hideControls: () => void` — sets `controlsVisible: false`
    - `setPermissions: (permissions: ParticipantPermissions) => void`
  - [x]2.3 Update `reset()` to clear new fields (default: `controlsVisible: false`, permissions: `{ canPlayPause: true, canSeek: true }`)
  - [x]2.4 Write sync-store tests for new fields and actions

- [x] **Task 3: Add server-side permission handler** (AC: #4)
  - [x]3.1 Create `apps/server/src/rooms/permissions.ts`:
    - `handlePermissionUpdate(ws, payload, deps)`: validates sender is host, updates room permission state, broadcasts `participant:permission-update` to all non-host participants
  - [x]3.2 Add `permissions: ParticipantPermissions` to `Room` interface in `apps/server/src/rooms/types.ts` (default: `{ canPlayPause: true, canSeek: true }`)
  - [x]3.3 Wire permission handler into `apps/server/src/signaling/ws-handler.ts` message routing
  - [x]3.4 Include current permissions in `room:state` payload for late joiners
  - [x]3.5 Write server tests for permission update handling (host-only validation, broadcast, late joiner state)

- [x] **Task 4: Enforce permissions in SyncEngine** (AC: #3, #4)
  - [x]4.1 Add `getPermissions` callback to `SyncEngineOptions`: `getPermissions?: () => ParticipantPermissions`
  - [x]4.2 Guard `requestPlay()` and `requestPause()`: only send if `getIsHost()` OR `permissions.canPlayPause`
  - [x]4.3 Guard `requestSeek()`: only send if `getIsHost()` OR `permissions.canSeek`
  - [x]4.4 Write sync-engine tests for permission enforcement

- [x] **Task 5: Create GlassPlayerControls component (Web)** (AC: #1, #2, #3)
  - [x]5.1 Create `apps/web/src/features/player/components/glass-player-controls.tsx`:
    - Full-screen overlay with three zones: top bar, center controls, bottom bar
    - Top bar: glassmorphic background (`surface_container_highest/40` + `backdrop-filter: blur(20px)`), back button, movie title (Manrope extrabold), quality label
    - Center: skip-back-10, Jewel play/pause button, skip-forward-10
    - Bottom: current time / duration labels (Inter, tabular-nums), seek bar, participant avatars, SyncStatusChip (moved from standalone overlay into controls bottom bar)
  - [x]5.2 Implement Jewel play/pause button:
    - Large circle (64px), `surface_container_highest/40` background + `backdrop-filter: blur(16px)`
    - `primary` colored play/pause icon (use SVG or unicode)
    - Box-shadow glow aura: `0 0 24px primary/30`
    - `active:scale-95` transform on click
  - [x]5.3 Implement seek bar:
    - Track: full-width, 4px height, `surface_container_highest` background
    - Buffer progress: `white/20` fill
    - Playback progress: gradient fill `primary/80` to `primary`
    - Playhead dot: 12px circle, `primary`, hidden until hover/touch, enlarges to 16px while dragging
    - Drag interaction: onMouseDown/onTouchStart to track drag, update position in real-time, call `requestSeek()` on release
    - Timestamp labels: current position (left), duration (right), Inter font, `on_surface_variant` color, `font-variant-numeric: tabular-nums`
  - [x]5.4 Implement disabled state for non-permitted controls:
    - Buttons: `surface_container_highest` background, `on_surface_variant` icon/text, `cursor: not-allowed`, `opacity: 0.5`
    - Seek bar: non-interactive (no drag), reduced opacity
  - [x]5.5 Export from `apps/web/src/features/player/index.ts`

- [x] **Task 6: Create GlassPlayerControls component (Mobile)** (AC: #1, #2, #3)
  - [x]6.1 Create `apps/mobile/src/features/player/components/glass-player-controls.tsx`:
    - Same three-zone layout as web, using React Native `View`, `Pressable`, `Text`
    - Glassmorphic backgrounds via `@react-native-community/blur` BlurView or semi-transparent background with opacity
    - Jewel button, skip buttons, seek bar adapted for touch (larger hit targets: 48px minimum)
  - [x]6.2 Implement seek bar for mobile:
    - Use `PanResponder` or `Gesture Handler` for drag interaction
    - Larger playhead dot (16px default, 24px while dragging) for touch accuracy
    - Same gradient fill and buffer visualization as web
  - [x]6.3 Implement disabled state same as web (visual treatment)
  - [x]6.4 Export from `apps/mobile/src/features/player/index.ts`

- [x] **Task 7: Implement controls visibility logic with auto-hide** (AC: #1, #2)
  - [x]7.1 Create `apps/web/src/features/player/hooks/use-controls-visibility.ts`:
    - Manages show/hide state with 5-second auto-hide timer
    - `toggle()`: if hidden → show + start timer; if visible → hide immediately
    - `resetTimer()`: restart 5-second countdown (called on any user interaction with controls)
    - `hide()`: immediately hide controls
    - Uses `syncStore.showControls()` / `syncStore.hideControls()` for state
    - Gradient overlays: top gradient (black/60 → transparent, 120px) and bottom gradient (transparent → black/60, 200px) visible only when controls are shown
  - [x]7.2 Create `apps/mobile/src/features/player/hooks/use-controls-visibility.ts`:
    - Same logic as web, using `setTimeout` / `clearTimeout`
    - Fade animation via React Native `Animated` (opacity 0→1 on show, 1→0 on hide, 200ms duration)
  - [x]7.3 Write tests for auto-hide timer logic

- [x] **Task 8: Implement host permission settings UI** (AC: #4)
  - [x]8.1 Create `apps/web/src/features/player/components/permission-settings.tsx`:
    - Bottom sheet or modal triggered from menu icon in GlassPlayerControls top bar (host only)
    - Two toggle switches: "Allow participants to play/pause" and "Allow participants to seek"
    - On toggle: send `participant:permission-update` via WebSocket
    - Glassmorphic card styling consistent with design system
  - [x]8.2 Create `apps/mobile/src/features/player/components/permission-settings.tsx`:
    - Same functionality as web, using React Native `Modal` or bottom sheet
    - Toggle switches using `Switch` component
  - [x]8.3 Wire permission state from server: subscribe to `participant:permission-update` in `usePlaybackSync` hooks
  - [x]8.4 Export from platform barrel files

- [x] **Task 9: Implement keyboard shortcuts (Web only)** (AC: #5)
  - [x]9.1 Create `apps/web/src/features/player/hooks/use-player-keyboard.ts`:
    - `useEffect` with `keydown` event listener on `window`
    - Space: toggle play/pause (call `requestPlay` / `requestPause`) — respects `canPlayPause` permission
    - ArrowLeft: seek -10s (call `requestSeek(position - 10000)`) — respects `canSeek` permission
    - ArrowRight: seek +10s (call `requestSeek(position + 10000)`) — respects `canSeek` permission
    - M: toggle mute (placeholder — log to console or no-op until Epic 5)
    - F: toggle fullscreen via `document.fullscreenElement` / `requestFullscreen()` / `exitFullscreen()`
    - Escape: hide controls if visible
    - Guard: ignore keyboard events when typing in input/textarea/contenteditable
    - `preventDefault()` on handled keys to prevent browser defaults (e.g., Space scrolling page)
  - [x]9.2 Write tests for keyboard shortcut handler (mock key events, verify correct actions called)

- [x] **Task 10: Wire GlassPlayerControls into player screens** (AC: #1, #2, #3, #4, #5)
  - [x]10.1 Update `apps/web/src/routes/player.tsx`:
    - Replace existing top bar and bottom overlay with GlassPlayerControls
    - Add tap-to-toggle interaction on the video container (click handler)
    - Wire `useControlsVisibility`, `usePlayerKeyboard` hooks
    - Pass `requestPlay`, `requestPause`, `requestSeek` from `usePlaybackSync` to GlassPlayerControls
    - Pass movie title, duration, current position from stores
    - Pass participant list from roomStore for avatar display
    - Move SyncStatusChip into GlassPlayerControls bottom bar (remove standalone overlay)
  - [x]10.2 Update `apps/mobile/app/player.tsx`:
    - Same integration as web: replace top bar / bottom overlay with GlassPlayerControls
    - Wire controls visibility with touch handler on video area
    - Fade animation for controls show/hide
    - Move SyncStatusChip into GlassPlayerControls bottom bar
  - [x]10.3 Ensure `usePlaybackSync` returns `isHost` and permission state for controls to consume

- [x] **Task 11: Create participant avatar display** (AC: #2)
  - [x]11.1 Create `apps/web/src/features/player/components/participant-avatars.tsx`:
    - Row of circular avatar chips showing participant initials
    - Host avatar has `primary` border ring
    - Max 4 visible + "+N" overflow indicator
    - Each avatar: 32px circle, `surface_container_high` background, `on_surface` text (first initial)
  - [x]11.2 Create `apps/mobile/src/features/player/components/participant-avatars.tsx`:
    - Same design as web, adapted for React Native
  - [x]11.3 Export from platform barrel files

- [x] **Task 12: Write comprehensive tests** (AC: #1, #2, #3, #4, #5)
  - [x]12.1 Protocol tests: permission message type guards, payload validation
  - [x]12.2 SyncStore tests: controlsVisible state, permissions state, actions
  - [x]12.3 Server tests: permission handler (host-only, broadcast, late joiner state)
  - [x]12.4 SyncEngine tests: permission enforcement on requestPlay/Pause/Seek
  - [x]12.5 GlassPlayerControls component tests (web): renders three zones, play/pause toggles, seek bar interaction, disabled state
  - [x]12.6 Controls visibility tests: auto-hide timer, toggle behavior
  - [x]12.7 Keyboard shortcut tests: all key bindings, permission gating, input field guard
  - [x]12.8 Ensure all existing 295 tests still pass — zero regressions

## Dev Notes

### Architecture Compliance

- **Sacred screen pattern**: The player screen defaults to zero UI. GlassPlayerControls is an overlay that appears/disappears on tap. The video component underneath is untouched — controls float above it using absolute positioning and z-index layering.
- **Permission model**: Server is authoritative for permissions. The host sends `participant:permission-update`, the server validates the sender is host, stores permissions on the `Room` object, and broadcasts to all participants. Non-host participants receive updated permissions and apply them locally. The SyncEngine enforces permissions client-side as a UX guard (disabled buttons), but the server also rejects unauthorized sync commands via existing `NOT_HOST` validation — extend this to check room-level permissions for non-host participants.
- **Glassmorphism**: Use `backdrop-filter: blur(20px)` on web and `@react-native-community/blur` or semi-transparent background on mobile. Background color: `surface_container_highest` at 40% opacity (`rgba(54, 50, 59, 0.4)` based on design tokens).
- **Message flow**: Permission updates use a NEW namespace `participant:` — this is the first `participant:` message type. Add routing in `ws-handler.ts` alongside existing `room:` and `sync:` handlers.

### Critical Reuse — DO NOT RECREATE

| Import | From | Purpose |
|--------|------|---------|
| `SyncEngine` | `@jellysync/shared` (sync/sync-engine.ts) | Extend with permission checks — do NOT create new class |
| `requestPlay`, `requestPause`, `requestSeek` | `usePlaybackSync` hook return | Wire to GlassPlayerControls — do NOT create new sync logic |
| `syncStore` | Platform-specific `lib/sync` | Read `isPlaying`, `playbackPosition`, `duration`, `controlsVisible`, `permissions` |
| `roomStore` | Platform-specific `lib/room` | Read `isHost`, `participants`, `roomCode` for avatar display and permission checks |
| `movieStore` | Platform-specific `lib/movie` | Read `selectedMovie.name` for title display |
| `SyncStatusChip` | `features/player/components/sync-status-chip.tsx` | Move into GlassPlayerControls bottom bar — reuse existing component as-is |
| `useWebSocket` / `subscribe` | Platform-specific shared hook | Subscribe to `participant:permission-update` |
| `SYNC_MESSAGE_TYPE` | `@jellysync/shared` (protocol/constants.ts) | Existing sync message types |
| `createWsMessage` | `@jellysync/shared` (protocol/messages.ts) | Message factory for permission messages |
| `broadcastToRoom` | Server ws-handler.ts | Existing broadcast function for permission updates |
| `getValidatedRoom` | Server sync-handler.ts | Validate sender is host for permission changes |
| `HtmlVideoPlayer` / `VideoPlayerView` | Existing player components | Video rendering — do NOT modify, overlay controls on top |

### GlassPlayerControls Layout Specification

```
┌─────────────────────────────────────────────┐
│ [Top Gradient: black/60 → transparent]      │
│ ← Back    Movie Title (Manrope XB)   CC ⚙️  │  ← Glassmorphic bar
│                                             │
│                                             │
│                                             │
│           ⏪  ▶ (Jewel)  ⏩                  │  ← Center controls
│                                             │
│                                             │
│                                             │
│  0:45:30 ━━━━━●━━━━━━━━━━━━━━━━ 2:01:15    │  ← Seek bar
│  👤👤👤 +2        SYNCHRONIZED ●             │  ← Avatars + SyncStatusChip
│ [Bottom Gradient: transparent → black/60]   │
└─────────────────────────────────────────────┘
```

### Design Token Values (from UX spec)

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#6ee9e0` (teal) | Play/pause icon, seek bar fill, active states |
| `secondary` | `#c8bfff` (violet) | Quality label, secondary accents |
| `surface_container_highest` | `#36323B` | Button/card backgrounds at 40% opacity for glassmorphism |
| `surface_container_high` | `#2B2930` | Avatar backgrounds, disabled control backgrounds |
| `on_surface` | `#E6E0E9` | Primary text |
| `on_surface_variant` | `#CAC4D0` | Secondary text, disabled text, timestamps |
| `surface_container_lowest` | `#0e0e0e` | Player background (already set) |
| Manrope Extrabold | — | Movie title in top bar |
| Inter 500 | — | Timestamps, labels |
| Gradient overlays | `rgba(0,0,0,0.6)` → transparent | Top: 120px height, Bottom: 200px height |

### Seek Bar Interaction Detail

- **Idle state**: 4px track height, no visible playhead dot
- **Hover/touch state (web)**: playhead dot appears (12px), track expands to 6px
- **Dragging state**: playhead dot enlarges (16px on web, 24px on mobile), timestamp snaps to drag position
- **On release**: call `requestSeek(positionMs)` — the sync engine handles host/permission validation
- **Position calculation**: `positionMs = (clientX - barLeft) / barWidth * duration`
- **Buffer visualization**: secondary fill track at `white/20` opacity showing `bufferProgress` from syncStore

### Auto-Hide Timer Logic

```
State: controlsVisible (boolean), hideTimer (timeout ID)

toggle():
  if (!controlsVisible) → show() + startTimer(5000)
  else → hide() immediately

show():
  controlsVisible = true
  clearTimeout(hideTimer)
  startTimer(5000)

hide():
  controlsVisible = false
  clearTimeout(hideTimer)

resetTimer():  // Called on any control interaction (seek drag, button tap)
  clearTimeout(hideTimer)
  startTimer(5000)

onSeekStart():
  clearTimeout(hideTimer)  // Don't auto-hide while seeking

onSeekEnd():
  startTimer(5000)  // Resume auto-hide after seek completes
```

### Keyboard Shortcuts (Web Only)

| Key | Action | Permission Required | Guard |
|-----|--------|-------------------|-------|
| Space | Toggle play/pause | `canPlayPause` (host always has) | Skip if in input/textarea |
| ArrowLeft | Seek -10s | `canSeek` | Skip if in input/textarea |
| ArrowRight | Seek +10s | `canSeek` | Skip if in input/textarea |
| M | Toggle mute | None | No-op placeholder (Epic 5) |
| F | Toggle fullscreen | None | Uses Fullscreen API |
| Escape | Hide controls | None | Only if controls visible |

### Permission Settings UI

Host-only bottom sheet/modal triggered from gear/menu icon in GlassPlayerControls top bar:
- Title: "Participant Controls" (Manrope bold)
- Toggle 1: "Allow play/pause" — controls `canPlayPause`
- Toggle 2: "Allow seeking" — controls `canSeek`
- Default: both ON (all participants can control)
- On toggle: immediately send `participant:permission-update` to server
- Server validates host → broadcasts to all participants
- Non-host participants update local `permissions` state → UI reflects instantly

### What This Story Does NOT Implement

- **Subtitles / CC toggle** — Story 4-5 (CC icon is a placeholder in top bar)
- **Stepped-away auto-pause** — Story 4-5
- **MicToggleFAB** — Epic 5 (reserve position but don't render)
- **Voice/mute functionality** — Epic 5 (M key is a no-op placeholder)
- **Volume control** — Epic 5
- **Participant entrance animations** — Phase 2 polish

### File Structure

```
# NEW FILES
apps/web/src/features/player/components/glass-player-controls.tsx      # Web GlassPlayerControls overlay
apps/web/src/features/player/components/permission-settings.tsx        # Web host permission settings modal
apps/web/src/features/player/components/participant-avatars.tsx         # Web participant avatar row
apps/web/src/features/player/hooks/use-controls-visibility.ts          # Web controls show/hide + auto-hide timer
apps/web/src/features/player/hooks/use-player-keyboard.ts              # Web keyboard shortcut handler
apps/mobile/src/features/player/components/glass-player-controls.tsx   # Mobile GlassPlayerControls overlay
apps/mobile/src/features/player/components/permission-settings.tsx     # Mobile host permission settings
apps/mobile/src/features/player/components/participant-avatars.tsx      # Mobile participant avatar row
apps/mobile/src/features/player/hooks/use-controls-visibility.ts       # Mobile controls visibility + fade animation
apps/server/src/rooms/permissions.ts                                   # Server permission handler

# MODIFIED FILES
packages/shared/src/protocol/constants.ts       # Add PARTICIPANT_MESSAGE_TYPE with PERMISSION_UPDATE
packages/shared/src/protocol/messages.ts        # Add ParticipantPermissions, PermissionUpdatePayload types
packages/shared/src/protocol/index.ts           # Export new permission types
packages/shared/src/stores/sync-store.ts        # Add controlsVisible, permissions state + actions
packages/shared/src/stores/sync-store.test.ts   # Tests for new store fields
packages/shared/src/sync/sync-engine.ts         # Add getPermissions callback, guard requestPlay/Pause/Seek
packages/shared/src/sync/sync-engine.test.ts    # Tests for permission enforcement
apps/server/src/rooms/types.ts                  # Add permissions to Room interface
apps/server/src/signaling/ws-handler.ts         # Route participant:permission-update messages
apps/server/src/signaling/ws-handler.test.ts    # Tests for permission message routing
apps/web/src/features/player/hooks/use-playback-sync.ts     # Subscribe to permission-update, pass permissions
apps/web/src/features/player/index.ts           # Export new components and hooks
apps/web/src/routes/player.tsx                  # Replace top/bottom bars with GlassPlayerControls, add tap handler
apps/mobile/src/features/player/hooks/use-playback-sync.ts  # Subscribe to permission-update, pass permissions
apps/mobile/src/features/player/index.ts        # Export new components and hooks
apps/mobile/app/player.tsx                      # Replace top/bottom bars with GlassPlayerControls, add tap handler
```

### Testing Standards

- Co-locate tests: `*.test.ts(x)` next to source files
- Use vitest (already configured)
- Component tests: verify GlassPlayerControls renders correct zones, play/pause toggles state, seek bar emits correct position, disabled state renders correctly per permissions
- Hook tests: auto-hide timer fires at 5s, toggle behavior, keyboard shortcut mapping
- Server tests: permission update validation (host-only), broadcast, late joiner receives permissions
- SyncEngine tests: permission enforcement prevents unauthorized sync commands
- Target: zero regressions on existing 295 tests

### Anti-Patterns to Avoid

- DO NOT create a new Zustand store for controls visibility or permissions — extend existing `SyncStore`
- DO NOT create separate WebSocket connection for permissions — use existing `useWebSocket()` / `send()`
- DO NOT modify `HtmlVideoPlayer` or `VideoPlayerView` — overlay controls on top, these components remain pure video renderers
- DO NOT implement custom video progress tracking — read `playbackPosition` and `duration` from `syncStore` (already updated by player hooks)
- DO NOT use `setInterval` for seek bar position updates — the syncStore `playbackPosition` is already updated by the player hooks via `requestAnimationFrame` or similar
- DO NOT hardcode colors — use design token values from the table above
- DO NOT use `.ts` extensions in imports — use `.js` per ESM convention
- DO NOT use `any` type — type all permission messages and payloads
- DO NOT create a `utils.ts` grab-bag file
- DO NOT use `useMovieStore()` hook pattern — use `useStore(store, selector)` with specific selectors
- DO NOT implement subtitles, mute, or voice features — those are Story 4-5 and Epic 5

### Previous Story Intelligence

**Story 4-3 (Buffer Detection & Communal Pause) established:**
- SyncStatusChip is currently rendered as a standalone overlay at the bottom of the player screen — move it into GlassPlayerControls bottom bar in this story
- `pauseSource` field on SyncStore distinguishes host vs buffer pauses — GlassPlayerControls should read this to show appropriate play/pause icon state
- 295 total tests (233 shared + 62 server) — maintain zero regressions
- Buffer detection and communal pause work — don't touch this logic, just render the visual state

**Story 4-2 (Sync Engine & Playback Coordination) established:**
- `requestPlay()`, `requestPause()`, `requestSeek()` are already returned from `usePlaybackSync` — wire these directly to GlassPlayerControls buttons
- Host echo guard: `if (this.getIsHost()) return` in `handleSyncMessage()` — for permission updates, ALL participants (including host) should process them to update local permission state
- `SyncEngine` currently gates `requestPlay/Pause/Seek` with `if (!this.getIsHost()) return` — this needs modification to also allow non-host participants with permissions

**Story 4-1 (Video Player Foundation) established:**
- `PlayerInterface` provides `getPosition()`, `getDuration()`, `getBufferState()` — use these for seek bar values
- `syncStore.playbackPosition` and `syncStore.duration` are continuously updated by player hooks — read from store for UI, don't poll player directly
- `useHtmlVideo` and `useVideoPlayer` hooks return `playerInterface` — this is already wired, don't change

**Key Pattern Change from 4-2:** The `requestPlay()` / `requestPause()` / `requestSeek()` methods on SyncEngine currently check `if (!this.getIsHost()) return`. For this story, modify to: `if (!this.getIsHost() && !this.getPermissions().canPlayPause) return` (and similarly for seek). This allows non-host participants with permissions to send sync commands.

### Git Intelligence

Recent commits follow `feat:` prefix convention. Tests included in feature commits. Changes span server + shared + web + mobile in single commits. Commit message pattern: `feat: implement [feature] with code review fixes (Story X-Y)`.

### Project Structure Notes

- New components go in existing `features/player/components/` directories
- New hooks go in existing `features/player/hooks/` directories
- Server permission handler goes in `apps/server/src/rooms/permissions.ts` (as specified in architecture doc)
- File naming: kebab-case (`glass-player-controls.tsx`, `use-controls-visibility.ts`)
- The `participant:` namespace is NEW — first message type in this namespace

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 4, Story 4.4]
- [Source: _bmad-output/planning-artifacts/architecture.md - Permission Model, Server State, Project Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - GlassPlayerControls, Sacred Screen Pattern, Design Tokens, Keyboard Shortcuts]
- [Source: _bmad-output/planning-artifacts/prd.md - FR20 (Host play/pause/seek), FR21 (Host configurable permissions)]
- [Source: packages/shared/src/sync/sync-engine.ts - SyncEngine class to extend with permission checks]
- [Source: packages/shared/src/protocol/constants.ts - Message type constants to extend]
- [Source: packages/shared/src/stores/sync-store.ts - SyncStore to extend with controls/permissions state]
- [Source: apps/web/src/routes/player.tsx - Current player page to restructure with GlassPlayerControls]
- [Source: apps/mobile/app/player.tsx - Current player screen to restructure with GlassPlayerControls]
- [Source: apps/web/src/features/player/hooks/use-playback-sync.ts - Hook returning requestPlay/Pause/Seek to wire]
- [Source: _bmad-output/implementation-artifacts/4-3-buffer-detection-and-communal-pause.md - Previous story learnings]
- [Source: _bmad-output/implementation-artifacts/4-2-sync-engine-and-playback-coordination.md - Sync engine patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Updated existing sync-engine tests: changed "does nothing when not host" to "non-host with default permissions sends play/pause/seek" since default permissions now allow non-host participants to control playback
- Updated server sync-handler test: replaced single non-host rejection test with permission-aware tests (allow when permitted, reject when denied)

### Completion Notes List

- Implemented full `participant:` message namespace — first participant message type in the project
- Added `PARTICIPANT_MESSAGE_TYPE.PERMISSION_UPDATE` constant and payload types with comprehensive validation
- Extended `SyncStore` with `controlsVisible` and `permissions` state fields and actions
- Created server-side `permissions.ts` handler with host-only validation and broadcast
- Modified `SyncEngine.requestPlay/Pause/Seek` to check `getPermissions()` — non-host participants with permissions can now send sync commands
- Updated server `sync-handler.ts` with `getValidatedRoomWithPermission()` — permission-aware validation replacing host-only checks
- Created GlassPlayerControls for web and mobile with three-zone layout (top bar, center controls, bottom bar)
- Implemented glassmorphic styling with design tokens: `surface_container_highest/40` + blur, `primary` (#6ee9e0) accents
- Built seek bar with buffer visualization, gradient progress fill, and interactive playhead
- Created Jewel play/pause button with glow aura and scale animation
- Implemented disabled state for non-permitted controls (reduced opacity, cursor-not-allowed)
- Created `useControlsVisibility` hook with 5-second auto-hide timer, toggle, and resetTimer
- Mobile version includes Animated fade in/out (200ms)
- Created `usePlayerKeyboard` hook: Space (play/pause), Arrow keys (seek ±10s), F (fullscreen), Escape (hide controls), M (mute placeholder)
- Input element guard prevents keyboard shortcuts when typing in input/textarea/contenteditable
- Created `PermissionSettings` modal/bottom sheet for host to toggle canPlayPause and canSeek
- Wire permission subscription in `usePlaybackSync`: listens to `participant:permission-update` and applies via `syncStore.setPermissions()`
- Late joiners receive permissions from `room:state` payload
- Created `ParticipantAvatars` component: circular avatar chips with host ring, overflow indicator
- Replaced old top bar and bottom overlay in both web and mobile player screens with GlassPlayerControls
- SyncStatusChip moved into GlassPlayerControls bottom bar
- Total: 389 tests (316 shared + 73 server), all passing. 94 new tests added.

### Change Log

- 2026-03-26: Implemented Story 4-4 Player Controls & Host Permissions — all 12 tasks, 389 tests passing

### File List

**New Files:**
- packages/shared/src/protocol/participant-messages.test.ts
- packages/shared/src/stores/controls-visibility.test.ts
- packages/shared/src/stores/permissions-integration.test.ts
- packages/shared/src/protocol/keyboard-shortcuts.test.ts
- apps/server/src/rooms/permissions.ts
- apps/server/src/rooms/permissions.test.ts
- apps/web/src/features/player/components/glass-player-controls.tsx
- apps/web/src/features/player/components/permission-settings.tsx
- apps/web/src/features/player/components/participant-avatars.tsx
- apps/web/src/features/player/hooks/use-controls-visibility.ts
- apps/web/src/features/player/hooks/use-controls-visibility.test.ts
- apps/web/src/features/player/hooks/use-player-keyboard.ts
- apps/mobile/src/features/player/components/glass-player-controls.tsx
- apps/mobile/src/features/player/components/permission-settings.tsx
- apps/mobile/src/features/player/components/participant-avatars.tsx
- apps/mobile/src/features/player/hooks/use-controls-visibility.ts

**Modified Files:**
- packages/shared/src/protocol/constants.ts
- packages/shared/src/protocol/messages.ts
- packages/shared/src/protocol/index.ts
- packages/shared/src/stores/sync-store.ts
- packages/shared/src/stores/sync-store.test.ts
- packages/shared/src/sync/sync-engine.ts
- packages/shared/src/sync/sync-engine.test.ts
- apps/server/src/rooms/types.ts
- apps/server/src/rooms/room-manager.ts
- apps/server/src/signaling/ws-handler.ts
- apps/server/src/sync/sync-handler.ts
- apps/server/src/sync/sync-handler.test.ts
- apps/web/src/features/player/hooks/use-playback-sync.ts
- apps/web/src/features/player/index.ts
- apps/web/src/routes/player.tsx
- apps/mobile/src/features/player/hooks/use-playback-sync.ts
- apps/mobile/src/features/player/index.ts
- apps/mobile/app/player.tsx
