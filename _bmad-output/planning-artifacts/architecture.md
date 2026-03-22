---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-22'
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-myapp-2026-03-22.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
project_name: 'myapp'
user_name: 'Bijin'
date: '2026-03-22'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
36 functional requirements across 7 domains. The core architectural challenge is that most requirements involve real-time coordination between multiple participants — room state, playback sync, and voice chat are deeply interdependent. The room system (FR4-FR12) and playback sync (FR16-FR23) form the backbone, with voice chat (FR24-FR30) running as a parallel real-time channel. Authentication (FR1-FR3) and library browsing (FR13-FR15) are more conventional CRUD-like interactions proxied through the Jellyfin API.

**Non-Functional Requirements:**
The NFRs are aggressive for a cross-platform app and will heavily shape architecture:
- **Sync drift < 500ms** and **command propagation < 200ms** require a low-latency signaling channel (WebSocket) with server-authoritative timestamps
- **Voice latency < 300ms** with **zero echo** requires WebRTC with platform AEC, ruling out any relay-based voice architecture
- **Buffer resync 3-5 seconds** requires active buffer state monitoring and coordinated pause/resume protocol
- **UI interaction < 100ms feedback** drives optimistic UI patterns with eventual consistency
- **Security** requires platform-specific secure storage and standard WebRTC encryption — no custom crypto needed

**UX Architectural Implications:**
- Glassmorphism design system requires `backdrop-filter` support — verified available on all target platforms
- Sacred screen pattern requires a layered rendering approach — video canvas base, gradient overlays, controls overlay with show/hide state
- Component strategy (GlassHeader, ActionCard, PosterGrid, etc.) maps to a shared component library consumed by both React Native (NativeWind) and React (Tailwind CSS)
- Three navigation contexts (task-focused, browse, immersive) suggest a navigation architecture that supports modal/stack/tab patterns
- Deep link handling requires platform-specific entry points converging to shared routing logic
- Background audio on mobile requires native module integration for audio session management

**Scale & Complexity:**

- Primary domain: Full-stack cross-platform (React Native + React + signaling server)
- Complexity level: Medium-High
- Estimated architectural components: ~8-10 major modules (auth, room management, sync engine, voice/WebRTC, Jellyfin client, video player, UI component library, signaling server, navigation/routing, audio mixing)

### Technical Constraints & Dependencies

- **Jellyfin server** — hard dependency for all content-related features. App is non-functional without a running Jellyfin instance. Architecture must account for Jellyfin API versioning and error handling.
- **WebRTC** — required for voice chat. Browser WebRTC API vs React Native WebRTC library differences require an abstraction layer.
- **STUN/TURN servers** — required for NAT traversal. TURN relay needed as fallback for symmetric NAT scenarios.
- **React Native limitations** — background audio, WebRTC, and video playback require native module bridges. These are the highest-risk platform-specific components.
- **Solo developer** — architecture must favor simplicity and shared code. Maximum code reuse between platforms. Minimize platform-specific implementations.
- **Sideloaded distribution** — no app store constraints, but also no push notification infrastructure (out of scope for MVP).

### Cross-Cutting Concerns Identified

1. **Real-time state synchronization** — Room state, playback position, and participant status must stay consistent across all connected clients. Requires a well-defined sync protocol with conflict resolution (server-authoritative).
2. **Network resilience** — Graceful handling of connection drops, reconnection, and state recovery for both WebSocket (signaling) and WebRTC (voice) channels. Silent recovery where possible.
3. **Cross-platform abstraction** — Video player, audio session management, deep link handling, secure storage, and share sheet all require platform-specific implementations behind shared interfaces.
4. **Audio pipeline** — Device-side mixing of movie audio and voice audio with per-participant volume control. Echo cancellation must prevent movie audio from looping back through the mic.
5. **Permission management** — Microphone permission handling across platforms, host-configurable playback permissions, and the stepped-away auto-pause system.
6. **Error handling philosophy** — The UX mandates silent recovery, friendly non-technical language, and inline errors. Architecture must support this pattern at every layer.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack cross-platform (React Native mobile + React web + Node.js signaling server) based on project requirements. Monorepo architecture required for shared TypeScript core across all three targets.

### Technical Preferences

- **Backend:** Node.js with Fastify (lightweight, WebSocket plugin, TypeScript-first)
- **Deployment:** Self-hosted (VPS/Docker alongside Jellyfin server)
- **Mobile Framework:** Expo with development builds (for WebRTC native modules)
- **State Management:** Zustand (lightweight, minimal boilerplate)

### Starter Options Considered

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| **Expo + Turborepo monorepo** | Official starters combined in pnpm monorepo | Expo auto-configures Metro for monorepos (SDK 52+), Turborepo caches builds, well-documented | Requires assembling from individual starters |
| **Nx Monorepo** | Nx workspace with Expo/React/Node plugins | Code generation, dependency graph, plugin ecosystem | Heavier tooling, steeper learning curve, overkill for solo dev |
| **Custom pnpm workspaces** | Manual monorepo setup | Maximum flexibility, minimal tooling | No task caching, more manual configuration |

### Selected Approach: Monorepo with Purpose-Specific Starters

**Rationale:** No single starter covers Expo + React + Fastify. A pnpm monorepo with Turborepo orchestration and individual starters per app gives the best solo-developer experience: shared code, cached builds, and each app using its ecosystem's best tooling.

**Monorepo Structure:**

```
jellysync/
  apps/
    mobile/          # Expo (React Native) — Android & iOS
    web/             # Vite + React — SPA
    server/          # Fastify — signaling server
  packages/
    shared/          # TypeScript core — sync engine, room mgmt, Jellyfin client, types
    ui/              # Shared design tokens & cross-platform component primitives
  turbo.json
  pnpm-workspace.yaml
  tsconfig.base.json
```

**Initialization Commands:**

```bash
# 1. Create monorepo root
mkdir jellysync && cd jellysync
pnpm init
# Configure pnpm-workspace.yaml and turbo.json

# 2. Mobile app (Expo SDK 55, React Native 0.83)
cd apps
npx create-expo-app@latest mobile --template blank-typescript
# Add dev build dependencies:
# npx expo install expo-dev-client
# npm install react-native-webrtc @config-plugins/react-native-webrtc
# npm install nativewind tailwindcss react-native-reanimated react-native-safe-area-context

# 3. Web app (Vite + React + TypeScript)
npm create vite@latest web -- --template react-swc-ts
# Add: tailwindcss, react-router

# 4. Signaling server (Fastify + TypeScript)
mkdir server && cd server
pnpm init
# Add: fastify @fastify/websocket typescript tsx
```

**Architectural Decisions Provided by Starters:**

**Language & Runtime:**
- TypeScript across all targets (strict mode)
- Node.js runtime for signaling server
- React Native 0.83 (via Expo SDK 55) for mobile
- React 19 for web

**Styling Solution:**
- NativeWind v5 (Tailwind CSS v4 for React Native) — mobile
- Tailwind CSS v4 — web
- Shared design tokens via unified Tailwind config consumed by both

**Build Tooling:**
- Turborepo for monorepo task orchestration and caching
- Metro (Expo-managed) for React Native bundling
- Vite + SWC for web bundling
- tsx for server development, esbuild/tsc for server production builds

**State Management:**
- Zustand 5.x — shared stores in `packages/shared`, consumed by both mobile and web apps

**WebRTC Setup:**
- `react-native-webrtc` + `@config-plugins/react-native-webrtc` for Expo dev builds (mobile)
- Native browser WebRTC API (web)
- Abstraction layer in `packages/shared` to unify both

**Development Experience:**
- Expo dev builds for native module testing (WebRTC, background audio)
- Vite HMR for web development
- Fastify watch mode via tsx for server development
- pnpm workspace linking for instant shared package changes

**Note:** Project initialization using these commands should be the first implementation story. The monorepo setup and workspace configuration is a prerequisite for all other development.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- WebSocket protocol design (JSON with typed messages)
- Jellyfin API connectivity pattern (direct client-to-Jellyfin)
- WebRTC voice topology (P2P mesh)
- Server state management (in-memory)
- Video player choice (expo-video)
- Navigation framework (Expo Router v7)

**Important Decisions (Shape Architecture):**
- Client-side persistence strategy (Zustand persist + secure storage)
- Data fetching layer (TanStack Query)
- Containerization (Docker Compose)
- STUN/TURN infrastructure (self-hosted Coturn)
- Web app serving (Fastify static)

**Deferred Decisions (Post-MVP):**
- Horizontal scaling (would require Redis-backed state)
- SFU voice topology (only needed if groups grow beyond 6)
- CI/CD pipeline (manual deployment sufficient for personal project MVP)
- Monitoring/logging infrastructure (console logging sufficient initially)

### Data Architecture

- **Server state:** In-memory only. Room objects, participant lists, and playback positions stored in JavaScript Maps/objects on the Fastify server. Rooms are ephemeral — lost on server restart by design.
- **Client persistence:** Zustand 5.x persist middleware with platform-specific storage adapters:
  - **Credentials/tokens:** expo-secure-store (mobile), encrypted localStorage wrapper (web)
  - **Preferences (volume levels, subtitle state):** AsyncStorage (mobile), localStorage (web)
- **No database required.** All persistent user data, media metadata, and library content lives in Jellyfin. JellySync has zero long-term storage needs.
- **Data fetching:** TanStack Query v5.x for all Jellyfin API interactions (library browsing, metadata, search). Provides caching, background refetching, and loading/error state management out of the box.

### Authentication & Security

- **Authentication:** Delegated entirely to Jellyfin. Clients authenticate directly with the Jellyfin server using server URL + username/password. Jellyfin returns an auth token used for subsequent API calls.
- **Token storage:** Platform secure storage (Keychain on iOS, Keystore on Android, encrypted web storage). Raw credentials never stored after initial login.
- **Room security:** 6-character alphanumeric room codes are ephemeral — they exist only while the room is active. No persistent room state to protect.
- **Voice encryption:** DTLS-SRTP (WebRTC standard) — encrypted by default, no custom implementation needed.
- **Transport security:** WSS (WebSocket Secure) for signaling server communication. HTTPS for Jellyfin API calls.
- **No custom auth system, no JWT, no session management.** Jellyfin handles all identity concerns.

### API & Communication Patterns

- **Signaling protocol:** JSON messages over WebSocket with discriminated union types. Message format: `{ type: 'room:join', payload: { roomCode: string } }`. TypeScript types shared between client and server via `packages/shared`.
- **Message categories:**
  - `room:*` — Room lifecycle (create, join, leave, close)
  - `sync:*` — Playback synchronization (play, pause, seek, buffer, timestamp)
  - `signal:*` — WebRTC signaling (offer, answer, ICE candidate)
  - `participant:*` — Participant state (permission changes, stepped-away)
- **Jellyfin API:** Direct client-to-Jellyfin communication. Each client stores its own Jellyfin server URL and auth token. The signaling server has no knowledge of Jellyfin.
- **WebRTC voice:** P2P mesh topology. Signaling server relays WebRTC offers/answers/ICE candidates, but never touches media streams. Each participant maintains direct peer connections with all other participants.
- **STUN/TURN:** Self-hosted Coturn 4.9.x in Docker. STUN for NAT traversal, TURN relay as fallback for symmetric NAT.

### Frontend Architecture

- **Navigation:** Expo Router v7 (file-based routing, included in Expo SDK 55). Automatic deep link handling via route conventions. Three navigation contexts:
  - Stack navigation for task-focused flows (login, join room)
  - Tab navigation for browse context (library, future: watchlist/settings)
  - Modal/fullscreen for immersive context (player, room lobby)
- **Video player:** expo-video v55.x. Separate VideoPlayer instance from VideoView component. EventEmitter API for playback state monitoring. Supports background audio on mobile.
- **Web video:** HTML5 `<video>` element with MediaSource Extensions for Jellyfin stream consumption.
- **State management:** Zustand 5.x stores in `packages/shared`:
  - `useAuthStore` — Jellyfin session, server URL, user info
  - `useRoomStore` — Room state, participants, permissions
  - `useSyncStore` — Playback position, sync state, buffer status
  - `useVoiceStore` — WebRTC connections, mute state, volume levels
- **Data fetching:** TanStack Query v5.x for Jellyfin API calls. Custom hooks wrapping query functions in `packages/shared`.
- **Component architecture:** Shared design tokens in `packages/ui`. Platform-specific component implementations where needed (video player, native share). Cross-platform components via React Native + react-native-web compatibility where possible.

### Infrastructure & Deployment

- **Containerization:** Docker Compose orchestrating:
  - `jellysync-server` — Fastify signaling server (also serves web SPA as static files)
  - `coturn` — TURN/STUN server
  - (Jellyfin assumed already running separately)
- **Web hosting:** Vite-built SPA served as static files from the Fastify server via `@fastify/static`. Single deployment artifact, single domain, single port.
- **Mobile distribution:** Sideloaded APK (Android), TestFlight or ad-hoc (iOS). Expo dev builds for development, EAS Build for production builds.
- **Environment config:** `.env` files per environment. Signaling server URL, Coturn credentials, and feature flags configured via environment variables.
- **Logging:** Console-based structured logging on server (pino, Fastify's default). No external logging infrastructure for MVP.

### Decision Impact Analysis

**Implementation Sequence:**
1. Monorepo setup (pnpm + Turborepo + shared packages)
2. Signaling server (Fastify + WebSocket + room management)
3. Jellyfin API client (shared package, TanStack Query hooks)
4. Auth flow (Jellyfin login, secure token storage)
5. Room creation/joining (WebSocket protocol, Expo Router deep links)
6. Video playback (expo-video mobile, HTML5 web, Jellyfin streaming)
7. Sync engine (playback coordination over WebSocket)
8. WebRTC voice (signaling, P2P connections, audio mixing)
9. UI polish (design system, glassmorphism, sacred screen)
10. Docker deployment (Compose with Coturn)

**Cross-Component Dependencies:**
- Sync engine depends on WebSocket protocol and room management
- Voice depends on WebSocket (for signaling) and room management (for participant list)
- Video playback depends on Jellyfin client and sync engine
- Deep links depend on Expo Router and room management
- Audio mixing depends on both video player and WebRTC voice layers

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

12 areas where AI agents could make different choices, organized into naming, structure, format, communication, and process patterns.

### Naming Patterns

**File Naming:**
- All source files: `kebab-case.ts` / `kebab-case.tsx`
- Example: `room-lobby.tsx`, `sync-engine.ts`, `use-room-store.ts`, `jellyfin-client.ts`
- Test files: `room-lobby.test.tsx` (co-located with source)
- Index files: `index.ts` for barrel exports from feature directories

**Component Naming:**
- React/RN components: PascalCase — `RoomLobby`, `GlassHeader`, `PosterGrid`
- Component file exports its PascalCase component as default
- Example: `glass-header.tsx` exports `GlassHeader`

**Function & Variable Naming:**
- Functions: camelCase — `createRoom()`, `handleBufferDetected()`, `formatRoomCode()`
- Variables: camelCase — `roomCode`, `playbackPosition`, `participantList`
- Constants: SCREAMING_SNAKE_CASE — `MAX_PARTICIPANTS`, `SYNC_THRESHOLD_MS`, `ROOM_CODE_LENGTH`
- Types/Interfaces: PascalCase — `RoomState`, `SyncMessage`, `JellyfinAuthResponse`
- Zustand stores: `use[Name]Store` — `useRoomStore`, `useSyncStore`, `useAuthStore`
- TanStack Query hooks: `use[Entity][Action]` — `useMovieList`, `useMovieDetails`, `useLibraryCategories`

**WebSocket Message Types:**
- Format: `namespace:action` — lowercase, colon-separated
- Namespaces: `room`, `sync`, `signal`, `participant`
- Examples: `room:create`, `room:join`, `sync:play`, `sync:pause`, `sync:seek`, `sync:buffer-start`, `signal:offer`, `signal:answer`, `signal:ice-candidate`, `participant:stepped-away`

### Structure Patterns

**Feature-Based Organization (within each app):**

```
src/
  features/
    auth/
      components/
        login-form.tsx
        server-url-input.tsx
      hooks/
        use-auth.ts
      auth-screen.tsx
      index.ts
    room/
      components/
        room-code-display.tsx
        participant-chip.tsx
      hooks/
        use-room.ts
        use-room-code.ts
      room-lobby-screen.tsx
      index.ts
    player/
      components/
        glass-player-controls.tsx
        mic-toggle-fab.tsx
        sync-status-chip.tsx
      hooks/
        use-playback-sync.ts
        use-voice-chat.ts
      player-screen.tsx
      index.ts
    library/
      components/
        poster-grid.tsx
        category-chips.tsx
      hooks/
        use-library.ts
      library-screen.tsx
      index.ts
  shared/
    components/       # Truly cross-feature UI (glass-header, gradient-button)
    hooks/            # Cross-feature hooks (use-websocket, use-network-status)
    utils/            # Pure utility functions
    constants.ts
```

**Shared Package Organization (`packages/shared`):**

```
packages/shared/
  src/
    jellyfin/         # Jellyfin API client and types
    sync/             # Sync engine protocol and logic
    room/             # Room management types and logic
    voice/            # WebRTC abstraction layer
    stores/           # Zustand store definitions
    types/            # Shared TypeScript types
    protocol/         # WebSocket message type definitions
    utils/            # Shared utility functions
  index.ts
```

**Test Co-location:**
- Test file sits next to its source: `sync-engine.ts` + `sync-engine.test.ts`
- Test utils in `__test-utils__/` directories when needed
- No separate test directories

### Format Patterns

**WebSocket Message Format:**

```typescript
interface WsMessage<T = unknown> {
  type: string;          // e.g., 'room:join'
  payload: T;            // typed per message type
  timestamp: number;     // server-authoritative Unix ms
}
```

**API Response Patterns (Jellyfin proxied data in TanStack Query):**
- Success: Return data directly — TanStack Query wraps it
- Error: Throw typed errors that map to user-friendly messages
- No custom wrapper — let TanStack Query handle loading/error/data states

**Error Response Format (WebSocket errors from server):**

```typescript
interface WsError {
  type: 'error';
  payload: {
    code: string;        // e.g., 'ROOM_NOT_FOUND', 'ROOM_FULL'
    message: string;     // User-friendly message (non-technical)
    context?: string;    // The message type that caused the error
  };
}
```

**Date/Time:**
- All timestamps in protocol: Unix milliseconds (number)
- Display formatting: use a lightweight formatter, relative time where appropriate
- No ISO strings in WebSocket messages — numbers only for sync precision

**JSON Naming:**
- camelCase for all JSON fields in WebSocket messages and internal APIs
- Jellyfin API returns its own format — don't transform, consume as-is

### Communication Patterns

**WebSocket Protocol Rules:**
- All messages flow through a single WebSocket connection per client
- Server is authoritative for room state and playback position
- Clients send intents (e.g., `sync:play`), server broadcasts confirmed state
- Discriminated union types in TypeScript: `type WsMessageType = RoomCreateMessage | RoomJoinMessage | SyncPlayMessage | ...`

**Zustand Store Patterns:**
- Stores defined in `packages/shared`, consumed by both apps
- Immutable updates via Zustand's `set()` (spread/replace, never mutate)
- Selectors for derived state: `useRoomStore(state => state.participants.length)`
- Actions co-located in store definition, not external
- WebSocket events update stores via a central `handleMessage()` dispatcher

**Example Store Pattern:**

```typescript
// packages/shared/src/stores/room-store.ts
interface RoomState {
  roomCode: string | null;
  participants: Participant[];
  isHost: boolean;
  // actions
  setRoom: (code: string, isHost: boolean) => void;
  addParticipant: (p: Participant) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>()(
  (set) => ({
    roomCode: null,
    participants: [],
    isHost: false,
    setRoom: (code, isHost) => set({ roomCode: code, isHost }),
    addParticipant: (p) => set((s) => ({
      participants: [...s.participants, p]
    })),
    clearRoom: () => set({
      roomCode: null, participants: [], isHost: false
    }),
  })
);
```

### Process Patterns

**Error Handling:**
- **Server errors:** Log with pino (structured JSON), return user-friendly WsError to client
- **Client network errors:** Silent auto-reconnect for WebSocket (exponential backoff, max 5 retries). Only show UI after 3+ seconds of failure.
- **Jellyfin API errors:** TanStack Query retry (3 attempts), then surface inline error with friendly message
- **WebRTC errors:** Log and attempt renegotiation. If voice fails, playback continues — voice is degraded, not broken.
- **Never expose:** stack traces, error codes, server internals, or technical jargon to users
- **Error message mapping:** Maintain a `error-messages.ts` map from error codes to user-friendly strings

**Loading States:**
- Use TanStack Query's `isLoading`/`isPending` for data fetching states
- No global loading state — each feature manages its own
- Shimmer placeholders for content loading (poster grids, library)
- No spinner/loading screen for navigation — show destination screen immediately with progressive content
- WebSocket connection state: `connecting` | `connected` | `reconnecting` | `disconnected`

**Reconnection Pattern:**
- WebSocket: Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- On reconnect: Client sends `room:rejoin` with last known room code
- Server responds with full current state (room, participants, playback position)
- WebRTC: Renegotiate peer connections on network change

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow kebab-case file naming and PascalCase component naming without exception
2. Place new features in `src/features/[feature-name]/` with components, hooks, and screen co-located
3. Use the `WsMessage` typed protocol for all WebSocket communication — never send untyped messages
4. Define Zustand store actions inside the store, not as external functions
5. Use TanStack Query for all Jellyfin API calls — never raw fetch in components
6. Return user-friendly error messages — never expose technical details to the UI
7. Co-locate tests with source files
8. Use `packages/shared` for any logic consumed by more than one app

**Anti-Patterns to Avoid:**
- Creating `utils.ts` or `helpers.ts` grab-bag files — be specific: `format-room-code.ts`, `validate-server-url.ts`
- Putting business logic in components — extract to hooks or shared packages
- Direct WebSocket `send()` calls in components — always go through store actions or a service layer
- Creating new Zustand stores without consulting the existing store structure
- Using `any` type — always type WebSocket messages, API responses, and store state

## Project Structure & Boundaries

### Complete Project Directory Structure

```
jellysync/
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .gitignore
├── .env.example
├── docker-compose.yml
├── Dockerfile.server
│
├── apps/
│   ├── mobile/                          # Expo (React Native) — Android & iOS
│   │   ├── app.json
│   │   ├── app.config.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   ├── global.css
│   │   ├── metro.config.js
│   │   ├── eas.json
│   │   ├── app/                         # Expo Router file-based routes
│   │   │   ├── _layout.tsx              # Root layout (providers, auth gate)
│   │   │   ├── index.tsx                # Home hub screen
│   │   │   ├── login.tsx                # Login screen
│   │   │   ├── join.tsx                 # Join room screen
│   │   │   ├── room/
│   │   │   │   ├── _layout.tsx          # Room layout (voice provider)
│   │   │   │   ├── [code].tsx           # Room lobby (deep link: /room/ABC123)
│   │   │   │   └── player.tsx           # Full screen player
│   │   │   └── (tabs)/
│   │   │       ├── _layout.tsx          # Tab navigation layout
│   │   │       ├── library.tsx          # Library browser
│   │   │       ├── watchlist.tsx        # Future: watchlist
│   │   │       └── settings.tsx         # Future: settings
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── login-form.tsx
│   │   │   │   │   │   └── server-url-input.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── use-auth-gate.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── room/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── room-code-display.tsx
│   │   │   │   │   │   ├── participant-chip.tsx
│   │   │   │   │   │   ├── movie-brief-card.tsx
│   │   │   │   │   │   └── code-input.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── use-room.ts
│   │   │   │   │   │   └── use-share-room.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── player/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── glass-player-controls.tsx
│   │   │   │   │   │   ├── mic-toggle-fab.tsx
│   │   │   │   │   │   ├── sync-status-chip.tsx
│   │   │   │   │   │   ├── seek-bar.tsx
│   │   │   │   │   │   └── volume-controls.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── use-video-player.ts
│   │   │   │   │   │   └── use-player-controls-visibility.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── library/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── poster-grid.tsx
│   │   │   │   │   │   ├── poster-card.tsx
│   │   │   │   │   │   ├── category-chips.tsx
│   │   │   │   │   │   └── poster-shimmer.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── use-library.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── voice/
│   │   │   │       ├── components/
│   │   │   │       │   └── voice-provider.tsx
│   │   │   │       ├── hooks/
│   │   │   │       │   ├── use-voice-chat.ts
│   │   │   │       │   └── use-audio-mix.ts
│   │   │   │       └── index.ts
│   │   │   ├── shared/
│   │   │   │   ├── components/
│   │   │   │   │   ├── glass-header.tsx
│   │   │   │   │   ├── gradient-button.tsx
│   │   │   │   │   ├── action-card.tsx
│   │   │   │   │   ├── glass-container.tsx
│   │   │   │   │   └── icon-button.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── use-websocket.ts
│   │   │   │   │   └── use-network-status.ts
│   │   │   │   └── providers/
│   │   │   │       ├── query-provider.tsx
│   │   │   │       └── websocket-provider.tsx
│   │   │   └── constants.ts
│   │   └── assets/
│   │       └── images/
│   │
│   ├── web/                             # Vite + React — SPA
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── app.tsx
│   │       ├── global.css
│   │       ├── routes/                  # React Router routes
│   │       │   ├── index.tsx            # Home hub
│   │       │   ├── login.tsx
│   │       │   ├── join.tsx
│   │       │   ├── room/
│   │       │   │   ├── lobby.tsx        # Room lobby (/room/:code)
│   │       │   │   └── player.tsx       # Full screen player
│   │       │   └── library.tsx
│   │       ├── features/                # Same structure as mobile
│   │       │   ├── auth/
│   │       │   ├── room/
│   │       │   ├── player/
│   │       │   │   ├── components/
│   │       │   │   │   ├── html-video-player.tsx
│   │       │   │   │   ├── glass-player-controls.tsx
│   │       │   │   │   └── ...          # (mirrors mobile player components)
│   │       │   │   └── hooks/
│   │       │   │       └── use-html-video.ts
│   │       │   ├── library/
│   │       │   └── voice/
│   │       └── shared/                  # Same structure as mobile
│   │           ├── components/
│   │           ├── hooks/
│   │           └── providers/
│   │
│   └── server/                          # Fastify — signaling server
│       ├── package.json
│       ├── tsconfig.json
│       ├── Dockerfile
│       ├── .env
│       ├── .env.example
│       └── src/
│           ├── index.ts                 # Server entry point
│           ├── app.ts                   # Fastify app setup + plugin registration
│           ├── config.ts                # Environment config validation
│           ├── rooms/
│           │   ├── room-manager.ts      # In-memory room state management
│           │   ├── room-manager.test.ts
│           │   ├── room-code.ts         # 6-char code generation
│           │   ├── room-code.test.ts
│           │   └── types.ts
│           ├── sync/
│           │   ├── sync-handler.ts      # Playback sync protocol logic
│           │   ├── sync-handler.test.ts
│           │   ├── buffer-monitor.ts    # Buffer detection + communal pause
│           │   └── buffer-monitor.test.ts
│           ├── signaling/
│           │   ├── ws-handler.ts        # WebSocket message routing
│           │   ├── ws-handler.test.ts
│           │   ├── webrtc-relay.ts      # WebRTC offer/answer/ICE relay
│           │   └── webrtc-relay.test.ts
│           ├── participants/
│           │   ├── participant-manager.ts
│           │   ├── participant-manager.test.ts
│           │   └── permissions.ts       # Host permission model
│           └── utils/
│               ├── error-messages.ts    # Error code → user-friendly message map
│               └── logger.ts            # Pino logger config
│
├── packages/
│   ├── shared/                          # Shared TypeScript core
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── jellyfin/
│   │       │   ├── client.ts            # Jellyfin API client
│   │       │   ├── client.test.ts
│   │       │   ├── auth.ts              # Auth helpers
│   │       │   ├── library.ts           # Library browsing queries
│   │       │   ├── streaming.ts         # Stream URL generation
│   │       │   └── types.ts             # Jellyfin API response types
│   │       ├── protocol/
│   │       │   ├── messages.ts          # WsMessage type definitions (discriminated union)
│   │       │   ├── messages.test.ts
│   │       │   └── constants.ts         # Protocol constants (namespaces, codes)
│   │       ├── stores/
│   │       │   ├── auth-store.ts        # useAuthStore
│   │       │   ├── room-store.ts        # useRoomStore
│   │       │   ├── sync-store.ts        # useSyncStore
│   │       │   └── voice-store.ts       # useVoiceStore
│   │       ├── sync/
│   │       │   ├── sync-engine.ts       # Client-side sync logic
│   │       │   ├── sync-engine.test.ts
│   │       │   └── timestamp.ts         # Timestamp utilities
│   │       ├── voice/
│   │       │   ├── webrtc-manager.ts    # Platform-agnostic WebRTC abstraction
│   │       │   ├── webrtc-manager.test.ts
│   │       │   └── types.ts
│   │       ├── types/
│   │       │   ├── room.ts              # Room, Participant, Permission types
│   │       │   ├── playback.ts          # PlaybackState, SyncState types
│   │       │   └── common.ts            # Shared utility types
│   │       └── utils/
│   │           ├── format-room-code.ts
│   │           ├── validate-server-url.ts
│   │           └── error-messages.ts    # Client-side error code → message map
│   │
│   └── ui/                              # Shared design tokens
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── tokens/
│           │   ├── colors.ts            # Color token definitions
│           │   ├── typography.ts        # Font scale definitions
│           │   ├── spacing.ts           # Spacing scale
│           │   └── radii.ts             # Corner radius tokens
│           └── tailwind-preset.ts       # Shared Tailwind preset consumed by both apps
│
└── coturn/
    └── turnserver.conf                  # Coturn configuration
```

### Architectural Boundaries

**Client ↔ Signaling Server Boundary:**
- Single WebSocket connection per client
- All communication via typed `WsMessage` protocol
- Server is authoritative for room state and playback timestamps
- Clients send intents, server broadcasts confirmed state
- No HTTP REST endpoints — WebSocket only (plus static file serving for web SPA)

**Client ↔ Jellyfin Boundary:**
- Direct HTTPS from client to Jellyfin server
- TanStack Query manages caching, retries, and loading states
- Jellyfin client in `packages/shared/src/jellyfin/` provides typed API methods
- Auth tokens stored in platform secure storage
- Signaling server has zero knowledge of Jellyfin

**Client ↔ Client Boundary (WebRTC Voice):**
- P2P mesh — direct connections between all participants
- Signaling server only relays WebRTC negotiation messages (offer/answer/ICE)
- Media streams never touch the server
- Platform-specific WebRTC implementations behind `packages/shared/src/voice/webrtc-manager.ts` abstraction

**Shared Packages ↔ Apps Boundary:**
- `packages/shared` exports platform-agnostic TypeScript (no React imports, no DOM, no RN)
- `packages/ui` exports design token values and Tailwind preset (no components)
- Apps import from packages via workspace aliases (`@jellysync/shared`, `@jellysync/ui`)
- Platform-specific implementations live in app `features/` directories, not in shared packages

### Requirements to Structure Mapping

**FR1-FR3 (Authentication):**
- `packages/shared/src/jellyfin/auth.ts` — Auth logic
- `packages/shared/src/stores/auth-store.ts` — Auth state
- `apps/mobile/src/features/auth/` — Mobile login UI
- `apps/web/src/features/auth/` — Web login UI
- `apps/mobile/app/login.tsx` — Login route

**FR4-FR12 (Room Management):**
- `apps/server/src/rooms/` — Server-side room lifecycle
- `packages/shared/src/stores/room-store.ts` — Client room state
- `packages/shared/src/protocol/messages.ts` — `room:*` message types
- `apps/mobile/src/features/room/` — Room lobby UI
- `apps/mobile/app/room/[code].tsx` — Deep link route

**FR13-FR15 (Library & Movie Selection):**
- `packages/shared/src/jellyfin/library.ts` — Library API queries
- `apps/mobile/src/features/library/` — Library browser UI
- `apps/mobile/app/(tabs)/library.tsx` — Library route

**FR16-FR23 (Playback & Sync):**
- `packages/shared/src/sync/` — Sync engine logic
- `packages/shared/src/stores/sync-store.ts` — Sync state
- `apps/server/src/sync/` — Server-side sync coordination
- `apps/mobile/src/features/player/` — Mobile player UI (expo-video)
- `apps/web/src/features/player/` — Web player UI (HTML5 video)
- `apps/mobile/app/room/player.tsx` — Player route

**FR24-FR30 (Voice Chat):**
- `packages/shared/src/voice/` — WebRTC abstraction
- `packages/shared/src/stores/voice-store.ts` — Voice state
- `apps/server/src/signaling/` — WebRTC signal relay
- `apps/mobile/src/features/voice/` — Mobile voice (react-native-webrtc)
- `apps/web/src/features/voice/` — Web voice (browser WebRTC)

**FR31-FR32 (Home Screen):**
- `apps/mobile/app/index.tsx` — Home hub route
- `apps/mobile/src/shared/components/action-card.tsx` — Create/Join cards

**FR33-FR36 (Cross-Platform):**
- `packages/shared/` — All shared logic
- `packages/ui/` — Shared design tokens
- Platform differences handled in respective `apps/` directories

### Data Flow

```
User Action → App Feature Hook → Zustand Store Action → WebSocket Send
                                                              ↓
                                        Signaling Server (validate + broadcast)
                                                              ↓
                                        WebSocket Receive → handleMessage() → Store Update → UI Re-render
```

**Jellyfin Data Flow:**
```
App Feature Hook → TanStack Query Hook → Jellyfin Client (packages/shared) → Jellyfin Server
                                                              ↓
                                        Response → TanStack Cache → UI Re-render
```

**Voice Data Flow:**
```
Mic Input → WebRTC PeerConnection → Network → Remote PeerConnection → Audio Output
                                                                         ↓
                                                        Device Audio Mix (movie + voice)
```

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices verified compatible. Expo SDK 55 + react-native-webrtc works via dev builds. Fastify plugins (@fastify/websocket, @fastify/static) are first-party and tested together. Zustand 5.x, TanStack Query 5.x, and React 19 all interoperate. NativeWind v5 targets Tailwind CSS v4. No version conflicts or incompatibilities found.

**Pattern Consistency:** All patterns align with technology choices. Feature-based organization matches Expo Router's file-based routing. WebSocket `namespace:action` convention maps directly to server module structure. Zustand store naming (`use[Name]Store`) follows React hook conventions.

**Structure Alignment:** Monorepo structure directly supports the three-app + two-package architecture. Server modules mirror WebSocket protocol namespaces. Feature directories map 1:1 to functional requirement categories.

### Requirements Coverage Validation

**Functional Requirements:** All 36 FRs across 7 categories have explicit architectural support with specific files and directories mapped in the project structure.

**Non-Functional Requirements:** All performance targets (sync < 500ms, voice < 300ms, commands < 200ms, UI < 100ms) are addressed by architectural choices: WebSocket for low-latency signaling, P2P WebRTC mesh for voice, in-memory server state for fast room operations, optimistic UI via Zustand.

**Security Requirements:** Covered by platform secure storage for credentials, DTLS-SRTP for voice encryption, WSS for signaling, and ephemeral room codes.

### Implementation Readiness Validation

**Decision Completeness:** All critical and important decisions documented with verified versions. Implementation patterns include concrete TypeScript examples. Consistency rules are specific and enforceable.

**Structure Completeness:** Every file and directory is specified in the project tree. All integration points mapped. Component boundaries clearly defined between apps, shared packages, and external services.

**Pattern Completeness:** Naming, structure, format, communication, and process patterns all defined with examples and anti-patterns.

### Gap Analysis Results

**Critical Gaps:** None.

**Important Gaps (non-blocking):**
- Testing framework: Recommend Vitest for monorepo (fast, ESM-native, Vite-aligned)
- Linting/formatting: ESLint + Prettier with shared config in monorepo root

**Nice-to-Have:**
- Server health check endpoint for Docker healthchecks
- Structured log format for sync debugging

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified (Jellyfin dependency, WebRTC, solo developer)
- [x] Cross-cutting concerns mapped (6 concerns)

**Architectural Decisions**
- [x] Critical decisions documented with verified versions
- [x] Technology stack fully specified (Expo 55, Fastify 5.8, Zustand 5, TanStack Query 5, Coturn 4.9)
- [x] Integration patterns defined (WebSocket, direct Jellyfin, P2P WebRTC)
- [x] Performance considerations addressed (all NFR targets mapped to decisions)

**Implementation Patterns**
- [x] Naming conventions established (kebab-case files, PascalCase components, namespace:action messages)
- [x] Structure patterns defined (feature-based, co-located tests)
- [x] Communication patterns specified (typed WebSocket protocol, Zustand store patterns)
- [x] Process patterns documented (error handling, loading states, reconnection)

**Project Structure**
- [x] Complete directory structure defined (3 apps, 2 packages, all files listed)
- [x] Component boundaries established (client-server, client-Jellyfin, client-client, shared-apps)
- [x] Integration points mapped (WebSocket, Jellyfin API, WebRTC)
- [x] Requirements to structure mapping complete (all 36 FRs mapped to specific paths)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all requirements covered, all decisions verified, no critical gaps.

**Key Strengths:**
- Clean separation between real-time coordination (signaling server) and content delivery (Jellyfin)
- Shared TypeScript core maximizes code reuse across 3 platforms for a solo developer
- In-memory server state eliminates database complexity for inherently ephemeral rooms
- P2P voice mesh keeps latency minimal for the 2-4 person use case
- Feature-based organization with typed protocol enables independent feature development

**Areas for Future Enhancement:**
- Redis-backed state if horizontal scaling becomes needed
- SFU topology if group sizes grow beyond 6
- CI/CD pipeline when approaching production distribution
- Monitoring/observability for production debugging

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- When in doubt about a convention, check the Implementation Patterns section

**First Implementation Priority:**
1. Initialize monorepo (pnpm + Turborepo + workspace config)
2. Scaffold apps (create-expo-app, create vite, fastify setup)
3. Configure shared packages (@jellysync/shared, @jellysync/ui)
4. Set up Tailwind preset and design tokens
5. Define WebSocket protocol types in packages/shared/src/protocol/
