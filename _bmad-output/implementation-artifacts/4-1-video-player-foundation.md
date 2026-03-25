# Story 4.1: Video Player Foundation

Status: done

## Story

As a participant,
I want to watch a movie streamed from Jellyfin on any platform,
so that I can view content with quality optimized for my device and connection.

## Acceptance Criteria (BDD)

1. **Given** a movie has been selected and playback is initiated, **When** the player screen loads on mobile, **Then** `expo-video` renders the movie in a full-screen `VideoView` with a separate `VideoPlayer` instance, the video fills the entire viewport (sacred screen -- `surface_container_lowest` #0e0e0e background), gradient overlays are applied at top and bottom edges for future control overlay readability, and the stream URL is generated via the Jellyfin streaming API with per-user transcoding parameters (FR19).

2. **Given** a movie has been selected and playback is initiated, **When** the player screen loads on web, **Then** an HTML5 `<video>` element renders the movie full-viewport, the stream is individually transcoded via Jellyfin for the web participant, and the same gradient overlay and sacred screen layout is applied.

3. **Given** the video player is active, **When** playback events occur, **Then** the player exposes a shared interface (`play`, `pause`, `seek`, `getPosition`, `getBufferState`) consumable by the sync engine, `useSyncStore` is updated with current playback position and buffer status, and the player supports background audio on mobile (audio continues when app is backgrounded or screen locks).

## Tasks / Subtasks

- [x] **Task 1: Install expo-video and configure Expo dev build** (AC: #1)
  - [x]1.1 Add `expo-video` to `apps/mobile/package.json`
  - [x]1.2 Configure `app.config.ts` plugin for expo-video
  - [x]1.3 Verify dev build compiles with expo-video native module

- [x] **Task 2: Create `useSyncStore` in shared package** (AC: #3)
  - [x]2.1 Create `packages/shared/src/stores/sync-store.ts` with Zustand vanilla store
  - [x]2.2 State: `playbackPosition` (number), `duration` (number), `isPlaying` (boolean), `isBuffering` (boolean), `bufferProgress` (number), `playbackRate` (number)
  - [x]2.3 Actions: `setPlaybackState()`, `setBufferState()`, `setPosition()`, `reset()`
  - [x]2.4 Create platform-specific lib files: `apps/mobile/src/lib/sync.ts` and `apps/web/src/lib/sync.ts`
  - [x]2.5 Export from `packages/shared/src/stores/index.ts`

- [x] **Task 3: Define shared player interface** (AC: #3)
  - [x]3.1 Create `packages/shared/src/types/playback.ts` with `PlayerInterface` type: `{ play(): void; pause(): void; seek(positionMs: number): void; getPosition(): number; getBufferState(): BufferState; }`
  - [x]3.2 Define `BufferState`: `{ isBuffering: boolean; bufferedMs: number; }`
  - [x]3.3 Define `PlaybackStatus`: `{ positionMs: number; durationMs: number; isPlaying: boolean; isBuffering: boolean; didJustFinish: boolean; }`

- [x] **Task 4: Build mobile video player with expo-video** (AC: #1, #3)
  - [x]4.1 Create `apps/mobile/src/features/player/hooks/use-video-player.ts`
    - Instantiate `VideoPlayer` with stream URL from `buildStreamUrl()`
    - Subscribe to playback events via expo-video EventEmitter API
    - Update `syncStore` on position/buffer changes
    - Expose `PlayerInterface` methods
    - Configure background audio (audio session category)
  - [x]4.2 Create `apps/mobile/src/features/player/components/video-player-view.tsx`
    - Render `VideoView` component from expo-video, full-screen
    - `surface_container_lowest` (#0e0e0e) background
    - Top gradient overlay: `linear-gradient(to bottom, black/60 0%, transparent 15%)`
    - Bottom gradient overlay: `linear-gradient(to top, black/60 0%, transparent 15%)`
  - [x]4.3 Create `apps/mobile/src/features/player/index.ts` barrel export
  - [x]4.4 Update `apps/mobile/app/player.tsx` to replace placeholder with real video player
    - Preserve existing movie swap detection logic (prevMovieIdRef pattern)
    - Preserve host "Change Movie" button
    - Generate stream URL using `buildStreamUrl(serverUrl, authToken, movieId)`

- [x] **Task 5: Build web video player with HTML5 `<video>`** (AC: #2, #3)
  - [x]5.1 Create `apps/web/src/features/player/hooks/use-html-video.ts`
    - Create and manage HTML5 `<video>` element ref
    - Set `src` to Jellyfin stream URL from `buildStreamUrl()`
    - Listen to `timeupdate`, `playing`, `pause`, `waiting`, `canplay`, `ended` events
    - Update `syncStore` on position/buffer changes
    - Expose `PlayerInterface` methods
  - [x]5.2 Create `apps/web/src/features/player/components/html-video-player.tsx`
    - Render `<video>` element, full-viewport
    - `surface_container_lowest` (#0e0e0e) background
    - Same gradient overlays as mobile
    - CSS: `object-fit: contain`, `width: 100vw`, `height: 100vh`
  - [x]5.3 Create `apps/web/src/features/player/index.ts` barrel export
  - [x]5.4 Update `apps/web/src/routes/player.tsx` to replace placeholder with real video player
    - Preserve existing movie swap detection logic
    - Preserve host "Change Movie" button

- [x] **Task 6: Background audio on mobile** (AC: #3)
  - [x]6.1 Configure expo-video audio session for background playback
  - [x]6.2 Update `app.config.ts` with `UIBackgroundModes: ['audio']` (iOS) and appropriate Android config
  - [x]6.3 Verify audio continues when app is backgrounded

- [x] **Task 7: Write tests** (AC: #1, #2, #3)
  - [x]7.1 Unit tests for `sync-store.ts` (state transitions, actions)
  - [x]7.2 Unit tests for `use-html-video.ts` hook (mock HTML5 video element events)
  - [x]7.3 Integration test: web player renders video element with correct stream URL
  - [x]7.4 Ensure all existing tests still pass (200 tests, zero regressions)

## Dev Notes

### Architecture Compliance

- **Sacred screen pattern**: Video canvas is the base layer; gradient overlays sit above; future controls overlay (Story 4-4) will sit on top. This story builds layers 1 and 2 only.
- **Platform-specific video, shared sync**: `expo-video` on mobile, HTML5 `<video>` on web. Both update the same `useSyncStore` via platform-specific hooks. The sync engine (Story 4-2) will consume this store.
- **Component duplication is acceptable**: Web and mobile player components are separate implementations per established project pattern (confirmed in Epic 3 retro).
- **Store pattern**: Use `zustand/vanilla` `createStore()` in shared package, instantiate in platform-specific `lib/sync.ts` files. Follow exact pattern from `movie-store.ts` and `room-store.ts`.
- **Movie state is CLIENT-ONLY**: Server has zero Jellyfin knowledge. Stream URLs are generated client-side via `buildStreamUrl()` from `packages/shared/src/jellyfin/streaming.ts`.

### Critical Reuse -- DO NOT RECREATE

| Import | From | Purpose |
|--------|------|---------|
| `buildStreamUrl` | `@jellysync/shared` (jellyfin/streaming.ts) | Generate HLS/direct stream URLs |
| `fetchMovieDetails` | `@jellysync/shared` (jellyfin/library.ts) | Get MediaSources for stream params |
| `movieStore` | `../../lib/movie` (platform-specific) | Selected movie state (id, name, runtimeTicks, imageTag) |
| `roomStore` | `../../lib/room` (platform-specific) | Room state, isHost, roomCode |
| `authStore` | `../../lib/auth` (platform-specific) | serverUrl, auth token for stream URLs |
| `useWs()` | `../../shared/hooks/use-websocket` | WebSocket subscribe for room:state (movie swap) |
| `createWsMessage` | `@jellysync/shared` | WebSocket message factory |
| `ROOM_MESSAGE_TYPE` | `@jellysync/shared` | Message type constants |
| `getImageUrl` | `@jellysync/shared` | Poster thumbnail URL builder |

### Stream URL Generation

`buildStreamUrl()` in `packages/shared/src/jellyfin/streaming.ts` already supports:
- **Direct stream**: `/Videos/{itemId}/stream?static=true&api_key={token}` -- use for high-bandwidth connections
- **HLS transcoding**: `/Videos/{itemId}/master.m3u8?api_key={token}&MediaSourceId={id}` -- use for adaptive bitrate

For Story 4-1, start with direct stream for simplicity. HLS adaptive bitrate can be refined when sync engine (4-2) needs precise buffer monitoring.

To get `MediaSourceId` for HLS, call `fetchMovieDetails(serverUrl, token, movieId)` which returns `MediaSources[]` with `Id` field.

### Expo-Video Specifics

- **Library**: `expo-video` (part of Expo SDK 55 ecosystem)
- **Key components**: `VideoView` (UI), `VideoPlayer` (controller instance) -- these are SEPARATE. Create player instance, pass to view.
- **Event API**: `VideoPlayer` has EventEmitter pattern: `player.addListener('playingChange', ...)`, `player.addListener('statusChange', ...)`
- **Background audio**: Configure `staysActiveInBackground: true` on the VideoPlayer and set audio category to playback
- **Important**: expo-video replaces the older `expo-av` Video component. Do NOT use expo-av.

### HTML5 Video Specifics

- Use native `<video>` element, NOT a third-party React video library
- Events to monitor: `timeupdate` (position), `playing`/`pause` (state), `waiting`/`canplay` (buffer), `ended` (completion)
- `buffered` TimeRanges API for buffer progress tracking
- For Jellyfin direct streams, the browser handles progressive download natively
- For HLS streams, native HLS support in Safari; may need `hls.js` for Chrome/Firefox (evaluate if HLS is used)

### Player Screen Layout (Sacred Screen)

```
+--------------------------------------------------+
|  Gradient overlay (top, black/60 → transparent)   |
|                                                    |
|                                                    |
|           VIDEO (full viewport)                    |
|        surface_container_lowest #0e0e0e            |
|           object-fit: contain                      |
|                                                    |
|                                                    |
|  Gradient overlay (bottom, transparent → black/60) |
+--------------------------------------------------+
```

- No controls in this story (controls are Story 4-4)
- No sync indicators (SyncStatusChip is Story 4-3)
- MicToggleFAB position is reserved but not implemented (Epic 5)
- Player entry uses crossfade transition, not slide (per UX spec)

### File Structure

```
# NEW FILES
packages/shared/src/stores/sync-store.ts
packages/shared/src/types/playback.ts
apps/mobile/src/features/player/hooks/use-video-player.ts
apps/mobile/src/features/player/components/video-player-view.tsx
apps/mobile/src/features/player/index.ts
apps/web/src/features/player/hooks/use-html-video.ts
apps/web/src/features/player/components/html-video-player.tsx
apps/web/src/features/player/index.ts
apps/mobile/src/lib/sync.ts
apps/web/src/lib/sync.ts

# MODIFIED FILES
apps/mobile/app/player.tsx  (replace placeholder with real player)
apps/web/src/routes/player.tsx   (replace placeholder with real player)
apps/mobile/package.json         (add expo-video)
apps/mobile/app.config.ts        (expo-video plugin + background audio)
packages/shared/src/stores/index.ts (export sync store)
packages/shared/src/types/index.ts  (export playback types)
```

### Testing Standards

- Co-locate tests: `sync-store.test.ts` next to `sync-store.ts`
- Use vitest (already set up in web app from Story 3-4; shared package likely uses vitest too)
- Use `@testing-library/react` for web component tests
- Always include `afterEach(cleanup)` in React component tests (lesson from Story 3-4)
- Participant test data needs `joinedAt` field per type definition

### Anti-Patterns to Avoid

- DO NOT use `expo-av` -- use `expo-video` (the modern replacement)
- DO NOT use a third-party React video library on web -- use native `<video>`
- DO NOT create sync protocol messages in this story -- that's Story 4-2
- DO NOT implement player controls in this story -- that's Story 4-4
- DO NOT implement buffer-triggered communal pause -- that's Story 4-3
- DO NOT implement SyncStatusChip -- that's Story 4-3
- DO NOT create new WebSocket message types -- reuse existing ones
- DO NOT use `any` type -- type all video events and store state
- DO NOT use `.ts` extensions in imports -- use `.js` per ESM convention
- DO NOT use `useMovieStore()` hook pattern -- use `useStore(movieStore, selector)`
- DO NOT create a utils.ts grab-bag file
- DO NOT put business logic in components -- extract to hooks

### Previous Story Intelligence

**Patterns from Epic 3 to follow:**
- Platform-specific lib instantiation: `apps/{platform}/src/lib/sync.ts` creates store instance
- Component access via `useStore(syncStore, selector)` with specific selectors
- Movie swap detection via `prevMovieIdRef` pattern is already in player.tsx -- preserve it
- WebSocket subscription pattern: `subscribe(ROOM_MESSAGE_TYPE.STATE, handler)` returns unsubscribe

**Epic 3 retro lessons to apply:**
- Foundation-first pays off: This story is the foundation for all of Epic 4. Build the player interface and sync store correctly, and Stories 4-2 through 4-5 become straightforward.
- Frontend polish must carry forward: Glassmorphic design quality into sacred screen. Gradient overlays must look premium.
- Identical hooks across platforms should go in `@jellysync/shared` if they have no platform-specific imports. The sync store is shared; the video player hooks are platform-specific.

### Git Intelligence

Recent commit patterns: `feat:` prefix for new features, fix: for patches. Tests included in feature commits. Story 3-4 added 12 tests with vitest + @testing-library/react for web. All 200 tests passing.

### Project Structure Notes

- Alignment with architecture.md directory structure: all new files match the prescribed paths exactly
- `apps/mobile/src/features/player/` directory is new but prescribed in architecture
- `apps/web/src/features/player/` directory is new but prescribed in architecture
- File naming: kebab-case throughout (e.g., `use-video-player.ts`, `html-video-player.tsx`)

### References

- [Source: _bmad-output/planning-artifacts/epics.md - Epic 4, Story 4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md - Frontend Architecture, Video Player, Project Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - Sacred Screen, GlassPlayerControls, Color System]
- [Source: _bmad-output/planning-artifacts/prd.md - FR16-FR19, NFR Performance]
- [Source: packages/shared/src/jellyfin/streaming.ts - buildStreamUrl API]
- [Source: packages/shared/src/stores/movie-store.ts - Store creation pattern]
- [Source: _bmad-output/implementation-artifacts/3-4-mid-session-movie-swap.md - Previous story learnings]
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-03-25.md - Epic 3 retrospective]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
- All 232 tests pass (155 shared + 27 web + 34 server + 16 UI) — zero regressions
- New tests: 17 sync-store + 12 use-html-video + 4 player page = 33 new tests

### Completion Notes List
- Installed `expo-video ~3.0.16` and `expo-linear-gradient ~15.0.8` for mobile video playback with gradient overlays
- Created `useSyncStore` Zustand vanilla store following exact pattern from movie-store.ts (createStore factory, platform-specific lib files)
- Defined `PlayerInterface`, `BufferState`, `PlaybackStatus` types in new `packages/shared/src/types/` directory
- Built mobile video player using `expo-video` VideoView/VideoPlayer with background audio support (`staysActiveInBackground: true`, iOS `UIBackgroundModes: ['audio']`)
- Built web video player using native HTML5 `<video>` element with timeupdate/playing/pause/waiting/canplay/ended event handling
- Both platforms update the same `useSyncStore` and expose the shared `PlayerInterface`
- Sacred screen layout: full-viewport video with `#0e0e0e` background and gradient overlays (top/bottom, black/60 to transparent over 15% height)
- Player screens preserve existing movie swap detection (prevMovieIdRef) and host "Change Movie" button
- Stream URLs generated client-side via existing `buildStreamUrl()` using direct stream mode
- Used direct stream (not HLS) per Dev Notes guidance for Story 4-1 simplicity

### Change Log
- 2026-03-25: Implemented Story 4-1 Video Player Foundation — all 7 tasks complete, 33 new tests added

### File List
#### New Files
- packages/shared/src/stores/sync-store.ts
- packages/shared/src/stores/sync-store.test.ts
- packages/shared/src/types/playback.ts
- packages/shared/src/types/index.ts
- apps/mobile/src/features/player/hooks/use-video-player.ts
- apps/mobile/src/features/player/components/video-player-view.tsx
- apps/mobile/src/features/player/index.ts
- apps/web/src/features/player/hooks/use-html-video.ts
- apps/web/src/features/player/hooks/use-html-video.test.ts
- apps/web/src/features/player/components/html-video-player.tsx
- apps/web/src/features/player/index.ts
- apps/mobile/src/lib/sync.ts
- apps/web/src/lib/sync.ts

#### Modified Files
- apps/mobile/app/player.tsx (replaced placeholder with real expo-video player)
- apps/web/src/routes/player.tsx (replaced placeholder with real HTML5 video player)
- apps/web/src/routes/player.test.tsx (updated tests for new player implementation)
- apps/mobile/package.json (added expo-video, expo-linear-gradient)
- apps/mobile/app.json (added expo-video plugin, UIBackgroundModes audio)
- packages/shared/src/stores/index.ts (export sync store)
- packages/shared/src/index.ts (export types)
