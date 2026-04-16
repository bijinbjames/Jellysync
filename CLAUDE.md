# JellySync — Claude Code Context

**Project:** JellySync
**Owner:** Bijin
**Type:** Cross-platform synchronized watch party app for Jellyfin
**Stack:** React Native (Expo) · React (Vite) · Fastify · TypeScript · WebRTC · Zustand

---

## What This Is

A personal app that lets you watch Jellyfin movies with friends in real-time across Android, iOS, and Web. Hard-synced playback (sub-500ms drift), always-on WebRTC voice chat, glassmorphic "Private Screening" UI. Two buttons: Create Room or Join Room.

---

## Monorepo Structure

```
/mnt/256/myapp/
├── apps/
│   ├── mobile/          # Expo 54 + React Native + NativeWind
│   ├── web/             # React 19 + Vite + Tailwind CSS
│   └── server/          # Fastify + WebSocket signaling server
├── packages/
│   ├── shared/          # Cross-platform stores, types, sync engine, protocol
│   └── ui/              # Design tokens (theme.css, utilities.css)
├── _bmad-output/
│   ├── planning-artifacts/   # PRD, architecture, epics, UX spec
│   └── implementation-artifacts/  # Story files + sprint-status.yaml
├── CLAUDE.md            # This file (auto-updated on git push)
├── DESIGN.md            # Design system specification
└── README.md
```

---

## Dev Commands

```bash
pnpm dev                        # Start all apps in parallel (Turborepo)
pnpm lint                       # ESLint across all packages
pnpm typecheck                  # TypeScript strict check
pnpm test                       # Vitest across all packages
pnpm format:fix                 # Prettier auto-format
pnpm build                      # Production build

# Per-app
pnpm --filter @jellysync/mobile dev
pnpm --filter @jellysync/web dev
pnpm --filter @jellysync/server dev
pnpm --filter @jellysync/shared build
```

---

## Architecture

- **Signaling server** (`apps/server`): Fastify + WebSocket. Server-authoritative playback sync. Coordinates room state, timestamps, pause/resume, host transfer.
- **Shared package** (`packages/shared`): Zustand stores, sync engine, WebSocket protocol types, TanStack Query hooks. Used by both mobile and web.
- **Voice chat**: WebRTC peer-to-peer (not server-relayed). DTLS-SRTP encrypted. TURN server (COTURN) for NAT traversal. Background audio continues when mobile app is backgrounded.
- **Video playback**: `expo-video` on mobile, HTML5 `<video>` on web. Per-user individually transcoded Jellyfin streams (HLS).
- **Auth**: Jellyfin credentials in platform secure storage (Keychain/Keystore/encrypted). Auth tokens used after login — raw credentials never leave auth flow.
- **Design**: Glassmorphic "Private Screening" theme. `backdrop-filter` blur + translucent surfaces. Design tokens in `packages/ui`. NativeWind on mobile, Tailwind on web.

### WebSocket Message Flow
```
Client → Server: join_room, play, pause, seek, buffer_start, buffer_end, stepped_away
Server → Clients: sync_state, host_transfer, participant_update, playback_command
```

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/shared/src/protocol/` | WebSocket message types (source of truth) |
| `packages/shared/src/stores/` | Zustand stores (room, playback, voice, movie) |
| `packages/shared/src/sync-engine/` | Playback sync logic (drift correction, buffer coordination) |
| `apps/server/src/room-manager.ts` | Room lifecycle, host transfer, participant tracking |
| `apps/server/src/ws-handler.ts` | WebSocket message routing |
| `apps/mobile/src/shared/components/` | Shared UI components (GlassHeader, ActionCard, etc.) |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Sprint tracking (source of truth) |
| `_bmad-output/planning-artifacts/architecture.md` | Full architecture decision doc |
| `_bmad-output/planning-artifacts/prd.md` | Product requirements |
| `_bmad-output/planning-artifacts/epics.md` | Epic + story breakdown |

---

## Design System

Theme name: **"Private Screening"** — cinematic glassmorphic aesthetic.

- **Surfaces**: Deep charcoal (`#0D0D0F` base), translucent glass panels with `backdrop-filter: blur(20px)`
- **Accent**: Muted teal (`#6EE9E0`), highlight (`#C8BFFF`)
- **Typography**: Manrope (headings), Inter (body)
- **Components**: GlassHeader, ActionCard, MovieBriefCard, ParticipantChip, SyncStatusChip, MicToggleFAB
- **Rule**: The screen is sacred — no overlays fight the video. Controls fade out during playback.

See [DESIGN.md](DESIGN.md) for the full specification.

---

## Testing

- Vitest across all packages
- `packages/shared` has the most unit tests (sync engine, stores, protocol)
- `apps/server` has integration tests for room lifecycle and WebSocket protocol
- No E2E tests yet (Epic 6 backlog)
- Run per-package: `pnpm --filter @jellysync/<package> test`

---

## Environment

```env
JELLYSYNC_STUN_URL=stun:stun.l.google.com:19302
JELLYSYNC_TURN_URL=turn:your-server:3478
JELLYSYNC_TURN_USERNAME=jellysync
JELLYSYNC_TURN_CREDENTIAL=jellysync-turn-secret
```

Copy `.env.example` → `.env`. COTURN Docker config included (`docker-compose.yml`).

---

## Sprint Status
<!-- AUTO-UPDATED by .claude/hooks/post-commit-push.py on git commit/push -->

| Epic | Title | Status |
|------|-------|--------|
| 1 | Project Foundation & Authentication | ✅ done |
| 2 | Room Creation & Joining | ✅ done |
| 3 | Library Browsing & Movie Selection | ✅ done |
| 4 | Synchronized Playback | ✅ done |
| 5 | Voice Chat & Audio | ✅ done |
| 6 | Cross-Platform Polish & Deployment | ⏳ backlog |

**Stories done:** 1-1, 1-2, 1-3, 1-4, 1-5, 2-1, 2-2, 2-3, 2-4, 2-5, 3-1, 3-2, 3-3, 3-4, 4-1, 4-2, 4-3, 4-4, 4-5, 5-1, 5-2, 5-3, 5-4
**Stories backlog:** 6-1 (web responsive), 6-2 (accessibility), 6-3 (parity testing), 6-4 (Docker deployment)

<!-- SPRINT_STATUS_END -->

---

## Recent Changes
<!-- AUTO-UPDATED by .claude/hooks/post-commit-push.py on git commit/push -->

<!-- RECENT_CHANGES_START -->
- `aeca72d 2026-03-27 fix: allow HTTP connections for self-hosted Jellyfin servers`
- `5e653d3 2026-03-26 chore: update app icons, web PWA assets, and EAS project config`
- `dac14d6 2026-03-26 fix: resolve WebRTC voice audio not playing between participants`
- `e360fbd 2026-03-26 feat: implement mic toggle, volume control, and background audio with code review fixes (Stories 5-2, 5-3, 5-4)`
- `b3b7f26 2026-03-26 feat: implement WebRTC voice connection and signaling with code review fixes (Story 5-1)`
- `6e4032d 2026-03-26 feat: implement subtitles and stepped-away with code review fixes (Story 4-5)`
- `7d2c87c 2026-03-26 feat: implement player controls and host permissions with code review fixes (Story 4-4)`
- `b13132b 2026-03-26 feat: implement buffer detection and communal pause with code review fixes (Story 4-3)`
<!-- RECENT_CHANGES_END -->

---

## Conventions

- **Monorepo packages**: `@jellysync/mobile`, `@jellysync/web`, `@jellysync/server`, `@jellysync/shared`, `@jellysync/ui`
- **TypeScript**: strict mode everywhere
- **Imports**: absolute from package root, not relative deep paths
- **State**: Zustand stores in `packages/shared` — no local component state for cross-platform data
- **WebSocket messages**: always typed via protocol types in `packages/shared/src/protocol/`
- **Error handling**: silent recovery with friendly inline messages — never raw errors to UI
- **Platform differences**: abstract behind shared interfaces in `packages/shared`, implement in each app

<!-- SPRINT_STATUS_START -->
| Epic | Title | Status |
|------|-------|--------|
| 1 | Project Foundation & Authentication | ✅ done |
| 2 | Room Creation & Joining | ✅ done |
| 3 | Library Browsing & Movie Selection | ✅ done |
| 4 | Synchronized Playback | 🔄 in-progress |
| 5 | Voice Chat & Audio | ✅ done |
| 6 | Cross-Platform Polish & Deployment | ⏳ backlog |

**Stories done:** 1-1-monorepo-initialization-and-shared-package-setup, 1-2-design-system-token-implementation, 1-3-jellyfin-authentication-flow, 1-4-home-hub-screen, 1-5-user-logout, 2-1-signaling-server-and-websocket-foundation, 2-2-room-creation-and-lobby-screen, 2-3-join-room-via-code-entry, 2-4-deep-link-join, 2-5-room-lifecycle-and-host-transfer, 3-1-jellyfin-library-api-client-and-data-layer, 3-2-library-browser-screen, 3-3-movie-selection-and-room-integration, 3-4-mid-session-movie-swap, 4-1-video-player-foundation, 4-2-sync-engine-and-playback-coordination, 4-3-buffer-detection-and-communal-pause, 4-4-player-controls-and-host-permissions, 4-5-subtitles-and-stepped-away, 5-1-webrtc-voice-connection-and-signaling, 5-2-mic-toggle-and-mictogglefab, 5-3-per-participant-volume-control-and-audio-mixing, 5-4-background-audio-on-mobile
**Stories backlog:** 6-1-web-responsive-adaptation, 6-2-accessibility-audit-and-compliance, 6-3-cross-platform-parity-testing-and-fixes, 6-4-docker-compose-deployment
<!-- SPRINT_STATUS_END -->
