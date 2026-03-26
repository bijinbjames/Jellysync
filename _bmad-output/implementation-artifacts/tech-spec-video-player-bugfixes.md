---
title: 'Video Player Bug Fixes — Source, Sync, Seek, Landscape'
slug: 'video-player-bugfixes'
created: '2026-03-26'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['react', 'react-native', 'expo-video', 'expo-screen-orientation', 'zustand', 'fastify-websocket', 'vitest', '@testing-library/react']
files_to_modify:
  - 'apps/web/src/features/player/components/html-video-player.tsx'
  - 'apps/web/src/features/player/hooks/use-playback-sync.ts'
  - 'apps/mobile/src/features/player/hooks/use-playback-sync.ts'
  - 'apps/mobile/app/player.tsx'
  - 'apps/web/src/routes/player.tsx'
code_patterns:
  - 'All non-player hooks use useWs() from WebSocketProvider context — usePlaybackSync is the only outlier'
  - 'Zustand stores used for state; hooks compose PlayerInterface for SyncEngine'
  - 'Web player uses raw HTML <video> with useHtmlVideo hook; mobile uses expo-video'
  - 'Server broadcastToRoom sends to participantToConnection map — only one socket per participant'
test_patterns:
  - 'vitest + @testing-library/react for web hooks/components'
  - 'Mock video elements with addEventListener/removeEventListener stubs'
  - 'syncStore used directly in tests for state assertions'
  - 'No mobile player tests exist currently'
---

# Tech-Spec: Video Player Bug Fixes — Source, Sync, Seek, Landscape

**Created:** 2026-03-26

## Overview

### Problem Statement

Three critical bugs in the video player:
1. **Web video never loads:** `HtmlVideoPlayer` receives `streamUrl` prop but never sets it as `src` on the `<video>` element — no video loads, so playback, seek, and sync all fail on web.
2. **Playback sync broken (both platforms):** `usePlaybackSync` imports `useWebSocket` directly (raw hook) instead of the shared `WebSocketProvider` context (`useWs`). This creates a second WebSocket connection per player screen. Both connections race to `room:rejoin` with the same participantId — the server's `handleRoomRejoin` replaces `participantToConnection` mapping, orphaning whichever connection loses. Sync messages sent/received on the orphaned connection are silently dropped.
3. **No landscape orientation:** Neither platform locks to landscape on the player screen.

### Solution

- Set `src={streamUrl}` on the web `<video>` element.
- Change `usePlaybackSync` on both platforms to use the shared WebSocket provider (`useWs`) instead of creating a new connection.
- Lock orientation to landscape on mobile (expo-screen-orientation) and enforce landscape layout on web.

### Scope

**In Scope:**
- Fix web `<video>` source binding
- Fix dual-WebSocket race condition in `usePlaybackSync` (web + mobile)
- Add landscape orientation lock on mobile player screen
- Ensure web player fills viewport in landscape layout

**Out of Scope:**
- New player features (subtitles, voice chat)
- Refactoring WebSocket architecture beyond the immediate fix
- Server-side changes (server logic is correct)

## Context for Development

### Codebase Patterns

- Monorepo: `apps/web`, `apps/mobile`, `apps/server`, `packages/shared`
- State management: Zustand stores (`syncStore`, `roomStore`, `authStore`)
- WebSocket: Each platform has `useWebSocket` (raw hook) and `WebSocketProvider` (context-based shared connection via `useWs`)
- Sync: `SyncEngine` in `packages/shared` handles drift correction, play/pause/seek coordination
- Mobile video: `expo-video` (`useVideoPlayer` + `VideoView`)
- Web video: raw HTML `<video>` element with custom `useHtmlVideo` hook

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `apps/web/src/features/player/components/html-video-player.tsx` | Web video element — missing `src` |
| `apps/web/src/features/player/hooks/use-html-video.ts` | Web video hook — event listeners + PlayerInterface |
| `apps/web/src/features/player/hooks/use-playback-sync.ts` | Web sync hook — uses wrong WebSocket import |
| `apps/mobile/src/features/player/hooks/use-playback-sync.ts` | Mobile sync hook — uses wrong WebSocket import |
| `apps/web/src/shared/hooks/use-websocket.ts` | Raw WebSocket hook (creates own connection) |
| `apps/web/src/shared/providers/websocket-provider.tsx` | Shared WebSocket provider (exports `useWs`) |
| `apps/mobile/src/shared/hooks/use-websocket.ts` | Mobile raw WebSocket hook |
| `apps/mobile/src/shared/providers/websocket-provider.tsx` | Mobile shared WebSocket provider |
| `apps/mobile/app/player.tsx` | Mobile player screen — needs landscape lock |
| `apps/web/src/routes/player.tsx` | Web player page |
| `packages/shared/src/sync/sync-engine.ts` | Shared SyncEngine class |
| `apps/server/src/signaling/ws-handler.ts` | Server WebSocket handler — rejoin logic |

### Technical Decisions

- Use `useWs()` from WebSocketProvider context instead of raw `useWebSocket()` to share a single connection per client. Every other hook/component in the codebase already uses `useWs` — `usePlaybackSync` is the only outlier (confirmed via grep).
- On mobile, `expo-screen-orientation` is NOT installed — needs `npx expo install expo-screen-orientation`. Lock landscape on player mount, unlock on unmount.
- On web, the player container is already 100vw × 100vh which is effectively landscape on desktop; no additional lock needed beyond ensuring the layout.
- The `UseWebSocket` interface (`send`, `subscribe`, `disconnect`, `connectionState`) is identical between raw hook and provider — drop-in replacement, no API changes needed.

## Implementation Plan

### Tasks

- [x] Task 1: Fix web video source binding
  - File: `apps/web/src/features/player/components/html-video-player.tsx`
  - Action: Add `src={streamUrl}` attribute to the `<video>` element (line 13)
  - Notes: The `streamUrl` prop is already received but never bound. This single-line fix unblocks all web playback, seek, and sync.

- [x] Task 2: Fix web `usePlaybackSync` — use shared WebSocket provider
  - File: `apps/web/src/features/player/hooks/use-playback-sync.ts`
  - Action: Change import from `import { useWebSocket } from '../../../shared/hooks/use-websocket.js'` to `import { useWs } from '../../../shared/providers/websocket-provider.js'`
  - Action: Replace `useWebSocket()` call with `useWs()` in the hook body (line 18)
  - Notes: The `UseWebSocket` interface is identical — `send`, `subscribe`, `disconnect`, `connectionState` — so no other code changes needed. This eliminates the duplicate WebSocket connection.

- [x] Task 3: Fix mobile `usePlaybackSync` — use shared WebSocket provider
  - File: `apps/mobile/src/features/player/hooks/use-playback-sync.ts`
  - Action: Same change as Task 2 — swap `useWebSocket` import to `useWs` from provider
  - Notes: Mobile provider exports identical `useWs` hook with same interface.

- [x] Task 4: Install `expo-screen-orientation` for mobile
  - Action: Run `npx expo install expo-screen-orientation` in `apps/mobile/`
  - Notes: Required for Task 5. Expo manages native config automatically.

- [x] Task 5: Add landscape orientation lock to mobile player screen
  - File: `apps/mobile/app/player.tsx`
  - Action: Import `* as ScreenOrientation` from `expo-screen-orientation`. Add `useEffect` that calls `ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)` on mount and `ScreenOrientation.unlockAsync()` on cleanup.
  - Notes: Place the effect early in the component, before the navigation guards. This ensures landscape is set before any renders.

- [x] Task 6: Ensure web player has landscape-friendly layout
  - File: `apps/web/src/routes/player.tsx`
  - Action: Update `containerStyle` to include `width: '100vw'`, `height: '100vh'`, `overflow: 'hidden'` to ensure full viewport coverage.
  - Notes: The container currently only has `position: 'relative'` and `animation`. The `HtmlVideoPlayer` child already uses 100vw/100vh, but the parent should enforce it too for proper containment.

- [x] Task 7: Run existing tests and verify no regressions
  - Action: Run `pnpm test` (or equivalent) across the monorepo
  - Notes: Verify `use-html-video.test.ts`, `sync-status-chip.test.tsx`, `use-controls-visibility.test.ts`, and all shared package tests pass.

### Acceptance Criteria

- [ ] AC 1: Given a web player screen with a selected movie, when the player page loads, then the `<video>` element has its `src` set to the stream URL and the video begins loading/buffering.
- [ ] AC 2: Given a host on any platform who presses play, when the sync:play message is broadcast by the server, then all participants' video players start playing at the same position.
- [ ] AC 3: Given a participant on any platform, when the host seeks to a new position, then the participant's player seeks to the same position within the sync threshold.
- [ ] AC 4: Given a web player, when the user drags the seek bar or clicks skip forward/back, then the video position updates to the new time.
- [ ] AC 5: Given the mobile player screen, when it mounts, then the device orientation locks to landscape. When the user navigates away, the orientation unlocks.
- [ ] AC 6: Given the web player, when it loads, then the video fills the full viewport width and height in a landscape-friendly layout.
- [ ] AC 7: Given any platform's player screen, when `usePlaybackSync` initializes, then only ONE WebSocket connection exists (the shared provider connection) — no duplicate connections are created.

## Additional Context

### Dependencies

- `expo-screen-orientation` — must be installed in `apps/mobile/` via `npx expo install expo-screen-orientation`. No other new dependencies required.

### Testing Strategy

**Automated (existing tests):**
- Run all existing vitest tests to confirm no regressions from the import change
- `use-html-video.test.ts` — verify PlayerInterface still works correctly
- `sync-engine.test.ts` — shared sync logic unaffected
- `sync-store.test.ts` — store behavior unaffected

**Manual testing (required):**
- Web: Load player screen → verify video loads and plays
- Web: Host presses play → verify participant's video starts
- Web: Drag seek bar → verify position updates
- Web: Skip forward/back buttons → verify position changes
- Mobile: Open player → verify landscape lock activates
- Mobile: Navigate back → verify orientation unlocks
- Both: Host play/pause/seek → verify all participants stay in sync
- Both: Participant with permissions seeks → verify sync propagates

### Notes

- The server-side sync handler logic is correct — `broadcastToRoom` sends to `participantToConnection.get(pid)`, which only has the last-rejoined socket. The bug is purely client-side (creating two connections).
- The web video source bug is the most critical — it completely breaks the web player. This is a one-line fix with maximum impact.
- The `useWebSocket` → `useWs` swap is a drop-in replacement because the interface is identical. The only difference is connection lifecycle: `useWs` uses the existing shared connection instead of creating a new one.
- Risk: `expo-screen-orientation` may require an Expo prebuild on bare workflow. If using Expo Go or managed workflow, it should work out of the box.

## Review Notes
- Adversarial review completed
- Findings: 7 total, 2 fixed, 5 skipped (architectural/out-of-scope/noise)
- Resolution approach: auto-fix
- F2 (orientation race): Fixed with cancelled flag to handle unmount-before-lock-completes
- F4 (redundant styles): Removed duplicate `overflow: hidden` from parent container
- Skipped: F1 (token-in-URL, architectural), F3 (duplicated file, architectural), F5/F6 (test-only, minor), F7 (crossOrigin, contextual)
