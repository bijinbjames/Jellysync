---
stepsCompleted: [step-01-requirements-extraction, step-02-epic-design, step-03-story-generation, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# JellySync - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for JellySync, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can log in with Jellyfin server URL, username, and password
FR2: User can remain logged in across app restarts (persistent session)
FR3: User can log out of the app
FR4: Host can create a new watch room
FR5: Host can view a generated 6-character alphanumeric room code upon room creation
FR6: Host can share the room code and deep link via the device's native share sheet
FR7: Participant can join a room by entering a 6-character room code
FR8: Participant can join a room by tapping a deep link
FR9: Room persists until all participants have exited
FR10: Host role automatically transfers to another participant if the host disconnects
FR11: Participant can exit a room at any time
FR12: Late-joining participant lands at the current playback timestamp
FR13: Host can browse the Jellyfin media library from within the app
FR14: Host can select a movie from the library to start playback in the room
FR15: Host can swap the current movie for a different one mid-session without destroying the room
FR16: All participants see synchronized playback of the selected movie
FR17: Playback pauses for all participants when any participant's stream buffers
FR18: Playback automatically resumes for all participants when buffering resolves
FR19: Each participant receives an individually transcoded stream from Jellyfin appropriate for their connection
FR20: Host can play, pause, and seek the shared playback
FR21: Host can configure which playback controls (play/pause/seek) other participants are allowed to use
FR22: Participant can toggle English subtitles on or off independently without affecting other participants
FR23: Participant can indicate "stepped away" status, which triggers auto-pause for all participants
FR24: All participants in a room are connected via voice chat automatically upon joining
FR25: Participant can mute/unmute their microphone with a single tap
FR26: Microphone is on by default when joining a room
FR27: Participant can adjust the voice volume of each other participant independently
FR28: Participant can adjust the overall room voice volume relative to movie audio
FR29: Movie audio and voice audio are mixed on-device so both are audible simultaneously
FR30: Voice chat continues functioning when the mobile app is backgrounded or the screen locks
FR31: User sees two primary actions on the home screen: Create Room and Join Room
FR32: User can enter a room code directly from the home screen
FR33: All capabilities are available on Android, iOS, and Web
FR34: Android is supported via React Native
FR35: iOS is supported via React Native
FR36: Web is supported via React (Chrome, Firefox, Safari)

### NonFunctional Requirements

NFR1: Playback sync drift between participants < 500ms
NFR2: Play/pause/seek command propagation to all participants < 200ms
NFR3: Voice chat latency (mouth to ear) < 300ms
NFR4: Voice audio quality 48kbps Opus minimum
NFR5: Echo and audio feedback — zero tolerance
NFR6: Buffer detection to pause propagation < 1 second
NFR7: Buffer resync and resume 3-5 seconds
NFR8: Room creation (tap to code visible) < 3 seconds
NFR9: Deep link to in-room (returning user) < 5 seconds
NFR10: Library browsing response (page load) < 2 seconds
NFR11: App launch to home screen < 2 seconds
NFR12: UI interactions (taps, toggles, navigation) < 100ms feedback
NFR13: Jellyfin credentials stored in platform secure storage (Keychain on iOS, Keystore on Android, encrypted storage on web)
NFR14: Auth tokens used for Jellyfin API communication, not raw credentials after initial login
NFR15: Room codes are ephemeral — expire when room closes, no persistent room state
NFR16: WebRTC voice connections use DTLS-SRTP encryption (WebRTC standard)
NFR17: No analytics, tracking, or telemetry — no data leaves the system beyond Jellyfin API calls and WebRTC peer connections
NFR18: Transport security — WSS for signaling server, HTTPS for Jellyfin API calls

### Additional Requirements

- Monorepo setup with pnpm workspaces + Turborepo orchestration (prerequisite for all development)
- Expo SDK 55 + React Native 0.83 for mobile app (with dev builds for native modules)
- Vite + React 19 + SWC for web app
- Fastify 5.8 signaling server with @fastify/websocket for real-time communication
- Shared TypeScript packages: @jellysync/shared (sync engine, room management, Jellyfin client, stores, protocol types) and @jellysync/ui (design tokens, Tailwind preset)
- WebSocket protocol with typed JSON messages using discriminated unions (room:*, sync:*, signal:*, participant:* namespaces)
- Server-authoritative room state and playback timestamps (in-memory, no database)
- Jellyfin API client as shared package — direct client-to-Jellyfin communication, signaling server has no Jellyfin knowledge
- TanStack Query v5.x for all Jellyfin API data fetching with caching and loading state management
- Zustand 5.x stores in shared package: useAuthStore, useRoomStore, useSyncStore, useVoiceStore
- WebRTC P2P mesh topology for voice — signaling server relays offers/answers/ICE only
- Self-hosted Coturn 4.9.x in Docker for STUN/TURN NAT traversal
- expo-video for mobile video playback, HTML5 video + MediaSource Extensions for web
- Expo Router v7 for mobile navigation (file-based routing, deep link handling)
- React Router for web navigation
- NativeWind v5 (Tailwind CSS v4 for React Native) on mobile, Tailwind CSS v4 on web, shared design tokens via unified Tailwind config
- Docker Compose deployment: jellysync-server (Fastify + static web SPA) + Coturn
- Feature-based code organization within each app (auth/, room/, player/, library/, voice/)
- Platform secure storage abstraction: expo-secure-store (mobile), encrypted localStorage wrapper (web)
- Auto-reconnect WebSocket with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Error message mapping from error codes to user-friendly strings (never expose technical details)
- Testing framework: Vitest (recommended gap from architecture validation)
- Linting/formatting: ESLint + Prettier with shared config

### UX Design Requirements

UX-DR1: Implement "Private Screening" design system — glassmorphism surfaces (surface_variant at 60% opacity + backdrop-filter: blur(20px)) for all floating elements (modals, player controls, navigation bars)
UX-DR2: Implement full color token system — 16 core tokens (primary #6ee9e0, secondary #c8bfff, surface hierarchy #0e0e0e through #353534, on_surface #e5e2e1, error #ffb4ab, tertiary #ffcbac, outline variants) with strict rules: no pure #FFFFFF, 90% surface range, no 1px solid borders
UX-DR3: Implement typography system — Manrope (headlines/display, weights 700-800, tight letter-spacing) + Inter (body/labels, weights 400-600) font pairing with 6 defined roles (Display Large through Label Small)
UX-DR4: Implement spacing scale and layout foundation — 7-token spacing scale (0.25rem to 4rem), mobile-first single-column layout, generous breathing room, content bleeds behind glassmorphic headers, No Divider Mandate (spacing.4 gaps instead of horizontal rules)
UX-DR5: Implement corner radius system — rounded-lg (2rem) for posters/containers, rounded-md (1.5rem) for buttons/chips, rounded-full for avatars/pills
UX-DR6: Build GlassHeader component — persistent glassmorphic top navigation with 3 variants (Home with personalized greeting, Navigation with back arrow, Branded with JellySync wordmark)
UX-DR7: Build ActionCard component — large tappable CTA cards for Home Hub with 2 variants (Primary/Create Room with gradient + glow, Secondary/Join Room with surface + ghost border), full-card tap area, scale animations
UX-DR8: Build PosterGrid component — 3-column grid for Jellyfin library with poster images (aspect-2/3, rounded-lg), rim lighting effect (1px white at 5% opacity top edge), title + year metadata, shimmer loading state
UX-DR9: Build RoomCodeDisplay component — hero glassmorphic container with oversized monospace code text (6xl-7xl, primary color, 0.2em letter-spacing), animated pulse dot, copy confirmation state
UX-DR10: Build CodeInput component — OTP-style 6-character input with individual boxes (w-12 h-14), auto-advance, backspace navigation, paste support, focused/filled/error states with shake animation
UX-DR11: Build ParticipantChip component — horizontal chip with avatar, name, mic status icon in 4 variants (Host, Participant, Empty Slot with dashed border, Avatar Stack with overlap)
UX-DR12: Build GlassPlayerControls component — full playback control overlay with glassmorphic top bar (title, quality label, actions), center Jewel play/pause button (ambient glow), skip controls, glass-panel seek bar (gradient fill, buffer indicator, playhead), participant avatars + sync chip. Sacred screen pattern: hidden by default, tap to reveal, auto-hide after 5 seconds
UX-DR13: Build MicToggleFAB component — persistent floating mic indicator (bottom-right corner during playback), pill-shaped with glassmorphism, 2 states: Muted (error dot, higher opacity) and Live (primary dot, low opacity). Only persistent UI during sacred screen
UX-DR14: Build SyncStatusChip component — pill chip with animated dot and status label in 3 variants: Synchronized (secondary), Buffering/Waiting for [Name] (tertiary), Paused (surface)
UX-DR15: Build MovieBriefCard component — horizontal card for Room Lobby with poster thumbnail (64x96px), title (Manrope bold xl), metadata (secondary label, year + runtime)
UX-DR16: Implement signature Glow CTAs — primary buttons use primary-to-primary_container gradient at 135 degrees with ambient shadow, scale-98 default to scale-95 on press
UX-DR17: Implement ghost border system — outline_variant at 15% opacity for accessibility boundaries, rim lighting (1px white at 5% inner glow on poster top edges)
UX-DR18: Implement three-tier button hierarchy — Primary (gradient, one per screen), Secondary (surface + ghost border), Tertiary/Ghost (no container, primary text). All buttons use active:scale-95
UX-DR19: Implement feedback patterns — no toasts for expected outcomes (destination IS feedback), clipboard copy with brief checkmark, inline-only errors (never modal), non-technical error language, silent auto-recovery for network issues (surface after 3+ seconds)
UX-DR20: Implement three navigation contexts — Task-focused (no nav bar: Home Hub, Login, Join Room), Browse (glassmorphic bottom nav: Library), Immersive (no persistent nav: Player, Room Lobby). Transitions < 300ms, player entry uses crossfade
UX-DR21: Implement responsive breakpoints — mobile-first with Tailwind prefixes: default (<640px), sm (640px+), md (768px+ with 4-column grid), lg (1024px+ with side nav option), xl (1280px+ centered max-width). Player always full-viewport
UX-DR22: Implement WCAG 2.1 Level AA accessibility — focus indicators (primary ring), keyboard shortcuts for player (Space, arrows, M, F, Escape), ARIA labels on icon-only buttons, live regions for sync state, prefers-reduced-motion support, semantic HTML, skip-to-content link, focus trapping in overlays
UX-DR23: Implement loading and empty state patterns — shimmer placeholders for poster grid (matching dimensions, animate-pulse), no loading screens (destination appears immediately with progressive content), empty lobby slots with dashed borders
UX-DR24: Implement form patterns — Login form (stacked fields in GlassCard, secondary uppercase labels, icon-prefixed inputs, on-submit validation only) and Room Code Entry (OTP-style, auto-advance, shake animation on error)

### FR Coverage Map

FR1: Epic 1 - User can log in with Jellyfin server URL, username, and password
FR2: Epic 1 - Persistent session across app restarts
FR3: Epic 1 - User can log out
FR4: Epic 2 - Host can create a new watch room
FR5: Epic 2 - 6-character room code generation
FR6: Epic 2 - Share room code and deep link via native share sheet
FR7: Epic 2 - Join room by entering code
FR8: Epic 2 - Join room by tapping deep link
FR9: Epic 2 - Room persists until all participants exit
FR10: Epic 2 - Host role auto-transfers on disconnect
FR11: Epic 2 - Participant can exit room at any time
FR12: Epic 2 - Late joiner lands at current timestamp
FR13: Epic 3 - Browse Jellyfin media library
FR14: Epic 3 - Select movie to start playback in room
FR15: Epic 3 - Swap movie mid-session without destroying room
FR16: Epic 4 - Synchronized playback for all participants
FR17: Epic 4 - Playback pauses when any participant buffers
FR18: Epic 4 - Auto-resume when buffering resolves
FR19: Epic 4 - Per-user individually transcoded streams
FR20: Epic 4 - Host play/pause/seek controls
FR21: Epic 4 - Host configurable playback permissions
FR22: Epic 4 - Independent subtitle toggle per participant
FR23: Epic 4 - Stepped-away auto-pause
FR24: Epic 5 - Voice chat auto-connects on room join
FR25: Epic 5 - Single-tap mic mute/unmute
FR26: Epic 5 - Microphone on by default
FR27: Epic 5 - Per-participant voice volume control
FR28: Epic 5 - Room voice volume relative to movie audio
FR29: Epic 5 - On-device movie + voice audio mixing
FR30: Epic 5 - Voice continues when mobile app is backgrounded
FR31: Epic 1 - Two-button home screen (Create Room / Join Room)
FR32: Epic 1 - Room code entry from home screen
FR33: Epic 6 - All capabilities on Android, iOS, and Web
FR34: Epic 6 - Android via React Native
FR35: Epic 6 - iOS via React Native
FR36: Epic 6 - Web via React (Chrome, Firefox, Safari)

## Epic List

### Epic 1: Project Foundation & Authentication
Users can install/open JellySync, log in to their Jellyfin server, and land on the home screen with Create Room and Join Room actions ready. Persistent sessions mean they only log in once per device. This epic includes monorepo setup, shared packages scaffolding, design token implementation, and the home hub screen.
**FRs covered:** FR1, FR2, FR3, FR31, FR32

### Epic 2: Room Creation & Joining
A host can create a room, receive a shareable 6-character code and deep link, and participants can join via code entry or deep link tap. Room lifecycle is fully managed — rooms persist until empty, host role transfers on disconnect, and late joiners land at the current timestamp.
**FRs covered:** FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12

### Epic 3: Library Browsing & Movie Selection
The host can browse their Jellyfin media library with a familiar poster grid, select a movie to start playback in the room, and swap movies mid-session without destroying the room or voice connection.
**FRs covered:** FR13, FR14, FR15

### Epic 4: Synchronized Playback
All participants watch the same movie in perfect sync with hard-synced playback. Buffering pauses everyone and auto-resumes. Each user gets their own transcoded stream. The host controls playback with configurable permissions. Users can toggle subtitles independently and trigger auto-pause when stepping away. The sacred screen player UI is implemented here.
**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23

### Epic 5: Voice Chat & Audio
Participants hear each other automatically when joining a room — mic on by default, zero configuration. Voice volume is independently adjustable per participant, mixable with movie audio on-device, and continues working when the mobile app is backgrounded. The "same couch" feeling is complete.
**FRs covered:** FR24, FR25, FR26, FR27, FR28, FR29, FR30

### Epic 6: Cross-Platform Polish & Deployment
The full JellySync experience works identically across Android, iOS, and Web with the premium "Private Screening" aesthetic. Cross-platform parity is verified, responsive breakpoints are tuned for web, keyboard shortcuts are implemented, Docker Compose deployment is configured, and the app is production-ready for movie night.
**FRs covered:** FR33, FR34, FR35, FR36

## Epic 1: Project Foundation & Authentication

Users can install/open JellySync, log in to their Jellyfin server, and land on the home screen with Create Room and Join Room actions ready. Persistent sessions mean they only log in once per device. This epic includes monorepo setup, shared packages scaffolding, design token implementation, and the home hub screen.

### Story 1.1: Monorepo Initialization & Shared Package Setup

As a developer,
I want the complete monorepo scaffolded with all three apps and shared packages configured,
So that all future development has a working foundation to build on.

**Acceptance Criteria:**

**Given** a fresh project directory
**When** the monorepo is initialized
**Then** pnpm workspaces are configured with apps/mobile, apps/web, apps/server, packages/shared, and packages/ui
**And** Turborepo is configured with build, dev, lint, and test task pipelines
**And** tsconfig.base.json provides shared TypeScript strict-mode configuration
**And** apps/mobile is scaffolded via create-expo-app with blank-typescript template (Expo SDK 55)
**And** apps/web is scaffolded via create-vite with react-swc-ts template (React 19)
**And** apps/server is initialized with Fastify 5.8, @fastify/websocket, and TypeScript
**And** packages/shared exports from src/index.ts and is importable as @jellysync/shared
**And** packages/ui exports from src/index.ts and is importable as @jellysync/ui
**And** ESLint + Prettier are configured with shared config at monorepo root
**And** Vitest is configured for unit testing across all packages
**And** running `pnpm dev` starts all three apps simultaneously
**And** running `pnpm build` successfully builds all packages and apps

### Story 1.2: Design System Token Implementation

As a developer,
I want the complete "Private Screening" design system tokens implemented in the shared UI package,
So that all screens across mobile and web render with consistent visual identity.

**Acceptance Criteria:**

**Given** the @jellysync/ui package exists
**When** the design tokens are implemented
**Then** all 16 color tokens are defined (primary #6ee9e0, secondary #c8bfff, surface hierarchy #0e0e0e through #353534, on_surface #e5e2e1, error #ffb4ab, tertiary #ffcbac, outline variants)
**And** typography tokens define Manrope (headlines/display, weights 700-800) and Inter (body/labels, weights 400-600) with 6 roles (Display Large through Label Small)
**And** spacing scale defines 7 tokens (0.25rem through 4rem)
**And** corner radius tokens define rounded-lg (2rem), rounded-md (1.5rem), and rounded-full
**And** a shared Tailwind preset (tailwind-preset.ts) exports all tokens for consumption by both apps
**And** apps/mobile tailwind.config.ts consumes the preset via NativeWind v5
**And** apps/web tailwind.config.ts consumes the preset via Tailwind CSS v4
**And** glassmorphism utility classes are available (surface at 60% opacity + backdrop-blur-xl)
**And** Manrope and Inter fonts are loaded in both mobile (expo-font) and web (CSS @font-face)
**And** no pure #FFFFFF is used anywhere — on_surface (#e5e2e1) is the lightest text color

### Story 1.3: Jellyfin Authentication Flow

As a user,
I want to log in with my Jellyfin server URL, username, and password,
So that I can access my media server and start using JellySync.

**Acceptance Criteria:**

**Given** the user is not logged in
**When** the user opens JellySync
**Then** the Login screen is displayed with a GlassCard containing Server URL, Username, and Password fields with secondary uppercase labels, icon prefixes (dns, person, lock), and a gradient "Connect" primary button

**Given** the user enters valid Jellyfin credentials
**When** the user taps Connect
**Then** the app authenticates with the Jellyfin server API and receives an auth token
**And** the auth token is stored in platform secure storage (expo-secure-store on mobile, encrypted localStorage on web)
**And** raw credentials are not stored after successful login
**And** useAuthStore is populated with session data (server URL, user info, token)
**And** the user is navigated to the Home Hub screen

**Given** the user enters invalid credentials
**When** the user taps Connect
**Then** an inline error message appears below the failed field in error color (#ffb4ab)
**And** the error message uses non-technical language (e.g., "Can't connect to server — check the URL" or "Username or password incorrect")
**And** no modal or toast is shown

**Given** the user has previously logged in successfully
**When** the user reopens the app after closing it
**Then** the stored session is restored from secure storage
**And** the user lands directly on the Home Hub without seeing the Login screen
**And** app launch to home screen completes in < 2 seconds (NFR11)

### Story 1.4: Home Hub Screen

As a user,
I want to see a simple home screen with Create Room and Join Room actions,
So that I can quickly start or join a watch session.

**Acceptance Criteria:**

**Given** the user is logged in
**When** the Home Hub screen loads
**Then** a GlassHeader (Home variant) displays a personalized greeting ("Hey, {username}") with server connection subtitle in secondary/70
**And** an editorial headline reads "Ready for a Private Screening?"
**And** two ActionCard components are displayed: Primary variant "Create Room" (gradient background with glow shadow) and Secondary variant "Join Room" (surface_container_high with ghost border)
**And** the Join Room card includes a room code entry field
**And** no bottom navigation bar is shown (task-focused navigation context)
**And** all interactive elements have 48px minimum touch targets
**And** ActionCards respond to press with scale-98 to scale-95 animation
**And** UI interactions respond within < 100ms (NFR12)

**Given** the user taps the Create Room action card
**When** the tap is registered
**Then** the user is navigated forward to the library browser (to be implemented in Epic 3; for now navigates to a placeholder)

**Given** the user enters a 6-character room code in the Join Room field
**When** the user taps Join
**Then** the app attempts to join the room (to be implemented in Epic 2; for now shows a placeholder response)

### Story 1.5: User Logout

As a user,
I want to log out of JellySync,
So that I can switch accounts or secure my session on a shared device.

**Acceptance Criteria:**

**Given** the user is logged in and on any screen
**When** the user triggers the logout action
**Then** the auth token is removed from platform secure storage
**And** useAuthStore is cleared (server URL, user info, token)
**And** any active WebSocket connections are closed
**And** the user is navigated to the Login screen
**And** subsequent app restarts show the Login screen instead of Home Hub

## Epic 2: Room Creation & Joining

A host can create a room, receive a shareable 6-character code and deep link, and participants can join via code entry or deep link tap. Room lifecycle is fully managed — rooms persist until empty, host role transfers on disconnect, and late joiners land at the current timestamp.

### Story 2.1: Signaling Server & WebSocket Foundation

As a developer,
I want a signaling server with WebSocket support and typed message protocol,
So that clients can communicate in real-time for room management and future sync/voice features.

**Acceptance Criteria:**

**Given** the Fastify signaling server is running
**When** a client connects via WebSocket
**Then** the connection is established over WSS (NFR18)
**And** the server accepts typed JSON messages following the WsMessage format: `{ type: string, payload: T, timestamp: number }`
**And** message types use the `room:*` namespace with discriminated union types (room:create, room:join, room:leave, room:close, room:state)
**And** all message type definitions are in packages/shared/src/protocol/messages.ts, shared between client and server
**And** the server validates incoming message types and returns WsError with user-friendly messages for invalid messages

**Given** the server has room management capability
**When** a room:create message is received
**Then** a new room is created in memory with a unique 6-character alphanumeric code
**And** the room is stored in an in-memory Map (no database)
**And** the creating client is registered as the host participant
**And** the server responds with room:state containing the room code, participant list, and host ID

**Given** a client WebSocket connection drops unexpectedly
**When** the connection is lost
**Then** the client-side WebSocket hook (useWebSocket) automatically reconnects with exponential backoff (1s, 2s, 4s, 8s, max 30s)
**And** on reconnect, the client sends room:rejoin with the last known room code
**And** the server responds with full current room state

### Story 2.2: Room Creation & Lobby Screen

As a host,
I want to create a room and see a lobby with a shareable room code,
So that I can invite others to join my watch session.

**Acceptance Criteria:**

**Given** the user taps Create Room on the Home Hub
**When** the room creation flow begins
**Then** a room:create message is sent to the signaling server
**And** a room is created and the user lands on the Room Lobby screen within < 3 seconds (NFR8)

**Given** the Room Lobby screen is displayed
**When** the room is active
**Then** a RoomCodeDisplay component shows the 6-character code in oversized monospace text (headline 6xl-7xl, primary color, 0.2em letter-spacing) inside a glassmorphic container with animated pulse dot
**And** a "Share Link" gradient primary button triggers the native share sheet with the deep link URL and room code
**And** a "Copy Code" tertiary text action copies the code to clipboard with a brief checkmark confirmation (icon swap for 2 seconds)
**And** a ParticipantChip shows the host with "(Host)" suffix and mic icon in primary color
**And** empty ParticipantChip slots with dashed borders (outline_variant/30) and "Slot available" text are shown
**And** a MovieBriefCard placeholder indicates no movie selected yet (to be replaced by library selection in Epic 3)
**And** the screen uses immersive navigation context (no persistent navigation bars)
**And** room codes are ephemeral and expire when the room closes (NFR15)

### Story 2.3: Join Room via Code Entry

As a participant,
I want to enter a room code and join an active room,
So that I can join a watch session my host has created.

**Acceptance Criteria:**

**Given** the user is on the Join Room screen
**When** the screen loads
**Then** a GlassHeader (Navigation variant) shows a back arrow and "Join Room" title
**And** a centered group icon and instructional header text are displayed
**And** a CodeInput component renders 6 individual OTP-style input boxes (w-12 h-14, surface_container_high background, rounded-md)
**And** a gradient "Join Room" primary button is displayed below the input
**And** an "or" divider with deep link alternative text is shown

**Given** the user begins typing a room code
**When** a character is entered in a box
**Then** the box shows the character in primary color (2xl monospace bold)
**And** focus auto-advances to the next empty box
**And** backspace moves focus to the previous box and clears it
**And** pasting a 6-character string fills all boxes at once
**And** focused box shows 2px primary border with primary/10 background tint

**Given** the user enters a valid 6-character code and taps Join Room
**When** a room:join message is sent to the server
**Then** the server validates the room exists and is active
**And** the participant is added to the room's participant list
**And** the user lands on the Room Lobby screen seeing the host and other participants
**And** the host's lobby updates to show the new participant's ParticipantChip

**Given** the user enters an invalid room code
**When** the join attempt fails
**Then** all input boxes show error border color (#ffb4ab) with a brief shake animation
**And** an inline error message appears below: "This code doesn't match an active room — check with your host"
**And** no modal or toast is shown

### Story 2.4: Deep Link Join

As a participant,
I want to tap a shared deep link and land directly in a room,
So that joining a watch session takes under 10 seconds with zero effort.

**Acceptance Criteria:**

**Given** the user taps a JellySync deep link (e.g., jellysync://room/ABC123 or https://jellysync.example/room/ABC123)
**When** the app is installed and the user is logged in
**Then** the app opens and routes directly to the room using the code from the link
**And** the user joins the room automatically without entering a code
**And** the total time from link tap to in-room is < 5 seconds (NFR9)

**Given** the user taps a deep link but is not logged in
**When** the app opens
**Then** the user is redirected to the Login screen
**And** the deep link intent is preserved
**And** after successful authentication, the user is automatically joined to the room from the original link

**Given** the user taps a deep link for a room that no longer exists
**When** the join attempt fails
**Then** a friendly message is shown: "This room is no longer active"
**And** a "Back to Home" button navigates to the Home Hub
**And** no technical error details are exposed

**Given** deep link handling is configured
**When** links are received on different platforms
**Then** Expo Router handles deep links on mobile via Android intents and iOS universal links
**And** React Router handles URL-based routing on web (e.g., /room/:code)

### Story 2.5: Room Lifecycle & Host Transfer

As a participant,
I want rooms to persist while people are in them and the host role to transfer seamlessly,
So that the watch session is resilient to disconnections and exits.

**Acceptance Criteria:**

**Given** a room has multiple participants
**When** a participant taps exit
**Then** the participant is removed from the room
**And** remaining participants see the ParticipantChip removed from the lobby
**And** no confirmation dialog is shown — exit is immediate

**Given** the host disconnects or exits the room
**When** other participants remain
**Then** the host role automatically transfers to another participant (first in join order)
**And** the new host's ParticipantChip updates to show "(Host)" suffix
**And** all participants receive a room:state update reflecting the new host

**Given** a room has active participants
**When** the last participant exits
**Then** the room is destroyed on the server
**And** the ephemeral room code is released and can no longer be used to join

**Given** a participant joins a room that is already active
**When** the late joiner enters
**Then** the server sends full current room state (participant list, host ID, current playback timestamp if playing)
**And** the late joiner's lobby reflects the accurate current state
**And** existing participants see the late joiner's ParticipantChip appear (FR12)

## Epic 3: Library Browsing & Movie Selection

The host can browse their Jellyfin media library with a familiar poster grid, select a movie to start playback in the room, and swap movies mid-session without destroying the room or voice connection.

### Story 3.1: Jellyfin Library API Client & Data Layer

As a developer,
I want a shared Jellyfin API client with TanStack Query hooks for library browsing,
So that both mobile and web apps can fetch and cache library data efficiently.

**Acceptance Criteria:**

**Given** the @jellysync/shared package
**When** the Jellyfin library module is implemented
**Then** packages/shared/src/jellyfin/library.ts provides typed API methods for fetching movie lists, categories/genres, and movie details from a Jellyfin server
**And** packages/shared/src/jellyfin/streaming.ts provides stream URL generation for per-user transcoded playback
**And** packages/shared/src/jellyfin/types.ts defines TypeScript types for all Jellyfin API responses (movie metadata, library items, stream info)
**And** TanStack Query v5.x hooks are created: useMovieList, useMovieDetails, useLibraryCategories
**And** all API calls use the auth token from useAuthStore (never raw credentials — NFR14)
**And** TanStack Query provides automatic caching, background refetching, and loading/error states
**And** API errors throw typed errors that map to user-friendly messages via error-messages.ts
**And** library page responses complete within < 2 seconds (NFR10)

### Story 3.2: Library Browser Screen

As a host,
I want to browse my Jellyfin movie library with a visual poster grid,
So that I can find and pick a movie for our watch session.

**Acceptance Criteria:**

**Given** the host navigates to the Library Browser
**When** the screen loads
**Then** a GlassHeader (Navigation variant) displays with back arrow and "Library" title
**And** a horizontal category chip scroller shows available genres/categories (FilterChip components with surface_container_high, rounded-full, secondary text for active state)
**And** a 3-column PosterGrid displays movie posters with aspect-2/3 ratio, rounded-lg corners, rim lighting effect (1px white at 5% opacity top edge inner glow), movie title (Manrope bold, truncated), and year (label-small, uppercase)
**And** a glassmorphic bottom navigation bar is shown (browse navigation context with Discover tab active)

**Given** the library is loading
**When** data is being fetched
**Then** shimmer placeholder cards are shown matching exact poster dimensions (aspect-2/3, rounded-lg, surface_container_high, animate-pulse), 3 per row
**And** no blank screen or spinner is shown — structural layout appears immediately

**Given** a category chip is tapped
**When** the selection changes
**Then** the PosterGrid filters to show only movies in the selected category
**And** the active chip uses secondary text with primary/20 tinted container

**Given** a movie poster is hovered (web) or pressed (mobile)
**When** the interaction occurs
**Then** the poster scales to 1.02 and title transitions to primary color (hover)
**And** the poster responds to press with tactile feedback

### Story 3.3: Movie Selection & Room Integration

As a host,
I want to select a movie and have it linked to my room,
So that participants can see what we're about to watch.

**Acceptance Criteria:**

**Given** the host is browsing the library after tapping Create Room
**When** the host taps a movie poster
**Then** a room is created (room:create sent to signaling server) with the selected movie attached
**And** the host lands on the Room Lobby screen
**And** the MovieBriefCard displays the selected movie's poster thumbnail (64x96px, rounded-md, ghost border), title (Manrope bold xl), and metadata (secondary label — year + runtime)
**And** the room code and share functionality are immediately available

**Given** the host is already in a Room Lobby without a movie selected
**When** the host navigates to the library and selects a movie
**Then** the Room Lobby updates with the selected movie's MovieBriefCard
**And** the room code remains the same

**Given** participants are in the Room Lobby
**When** the host has selected a movie and at least one participant has joined
**Then** the "Start Movie" gradient primary button becomes enabled
**And** tapping "Start Movie" initiates playback for all participants (playback implementation in Epic 4; for now transitions to a placeholder player screen)

### Story 3.4: Mid-Session Movie Swap

As a host,
I want to change the movie during a session without destroying the room,
So that we can switch if the current movie isn't working out.

**Acceptance Criteria:**

**Given** the host is in an active session (Room Lobby or Player screen)
**When** the host accesses the change movie action (via player controls menu or lobby option)
**Then** the Library Browser opens as an overlay or push navigation
**And** the host can browse and select a new movie

**Given** the host selects a new movie from the library
**When** the selection is made
**Then** a lightweight bottom sheet confirmation appears: "Change to [Movie Name]?" with a primary "Change Movie" button and a "Cancel" tertiary action
**And** the confirmation follows the modal/overlay pattern (obviously dismissible, no backdrop dimming beyond existing)

**Given** the host confirms the movie swap
**When** the swap is processed
**Then** the server broadcasts the movie change to all participants
**And** the Room Lobby's MovieBriefCard updates to the new movie
**And** if playback was active, current playback stops for all participants and new movie begins from the start
**And** the room code remains the same — no resharing needed
**And** voice chat connections persist uninterrupted throughout the swap (FR15)
**And** participants see a brief indication that the movie is changing

## Epic 4: Synchronized Playback

All participants watch the same movie in perfect sync with hard-synced playback. Buffering pauses everyone and auto-resumes. Each user gets their own transcoded stream. The host controls playback with configurable permissions. Users can toggle subtitles independently and trigger auto-pause when stepping away. The sacred screen player UI is implemented here.

### Story 4.1: Video Player Foundation

As a participant,
I want to watch a movie streamed from Jellyfin on any platform,
So that I can view content with quality optimized for my device and connection.

**Acceptance Criteria:**

**Given** a movie has been selected and playback is initiated
**When** the player screen loads on mobile
**Then** expo-video renders the movie in a full-screen VideoView with a separate VideoPlayer instance
**And** the video fills the entire viewport (sacred screen — surface_container_lowest #0e0e0e background)
**And** gradient overlays are applied at top and bottom edges for future control overlay readability
**And** the stream URL is generated via the Jellyfin streaming API with per-user transcoding parameters appropriate for the participant's connection (FR19)

**Given** a movie has been selected and playback is initiated
**When** the player screen loads on web
**Then** an HTML5 `<video>` element with MediaSource Extensions renders the movie full-viewport
**And** the stream is individually transcoded via Jellyfin for the web participant
**And** the same gradient overlay and sacred screen layout is applied

**Given** the video player is active
**When** playback events occur
**Then** the player exposes a shared interface (play, pause, seek, getPosition, getBufferState) consumable by the sync engine
**And** useSyncStore is updated with current playback position and buffer status
**And** the player supports background audio on mobile — audio continues when the app is backgrounded or screen locks

### Story 4.2: Sync Engine & Playback Coordination

As a participant,
I want all participants to see the same frame at the same time,
So that we're truly watching together and can react to the same moments.

**Acceptance Criteria:**

**Given** the sync engine is implemented in packages/shared/src/sync/
**When** the host starts playback
**Then** a sync:play message is sent to the signaling server with the server-authoritative timestamp
**And** the server broadcasts sync:play to all participants
**And** all participants begin playback at the same position
**And** playback sync drift between any two participants stays < 500ms (NFR1)

**Given** the host pauses playback
**When** a sync:pause message is sent
**Then** all participants pause within < 200ms of the command (NFR2)
**And** all participants see the same paused frame

**Given** the host seeks to a new position
**When** a sync:seek message is sent with the target timestamp
**Then** all participants seek to the target position within < 200ms (NFR2)
**And** playback resumes in sync from the new position

**Given** a late joiner enters an active session
**When** the participant joins
**Then** the server sends the current playback position in the room:state message
**And** the late joiner's player starts at the current timestamp (FR12)
**And** sync drift from existing participants is < 500ms within 3 seconds of joining

**Given** the sync engine detects drift exceeding 500ms
**When** a participant falls behind or ahead
**Then** the sync engine performs a micro-correction (seek adjustment) to bring the participant back in sync
**And** the correction is invisible to the user — no pause or stutter

### Story 4.3: Buffer Detection & Communal Pause

As a participant,
I want playback to pause for everyone when anyone buffers,
So that we stay on the same moment and no one misses anything.

**Acceptance Criteria:**

**Given** any participant's stream begins buffering
**When** the buffer state is detected
**Then** the participant's client sends sync:buffer-start to the signaling server within < 1 second (NFR6)
**And** the server broadcasts sync:pause to all participants with the buffering participant's name
**And** all participants see playback pause simultaneously

**Given** the buffering participant's stream recovers
**When** sufficient buffer is available to resume
**Then** the participant's client sends sync:buffer-end to the server
**And** the server broadcasts sync:play to all participants
**And** all participants resume from the same position within 3-5 seconds of buffer start (NFR7)

**Given** playback is paused due to buffering
**When** the SyncStatusChip is visible
**Then** it displays "WAITING FOR [Name]..." in tertiary color with a pulsing tertiary dot (tertiary_container/20 background)
**And** when sync resumes, it transitions to "SYNCHRONIZED" with secondary color and pulsing secondary dot

**Given** playback is manually paused by the host
**When** the SyncStatusChip is visible
**Then** it displays "PAUSED" with a static dot on surface_container_high background

### Story 4.4: Player Controls & Host Permissions

As a host,
I want full playback controls and the ability to manage what other participants can control,
So that I can lead the watch session while keeping the screen sacred.

**Acceptance Criteria:**

**Given** the player is in sacred screen mode (default during playback)
**When** no interaction occurs
**Then** no UI elements are visible except the MicToggleFAB (to be implemented in Epic 5; placeholder position reserved)
**And** the movie owns every pixel of the screen

**Given** the user taps anywhere on the video
**When** controls are not visible
**Then** the GlassPlayerControls overlay appears with:
- Top bar: glassmorphic header with back button, movie title (Manrope extrabold), quality label (secondary uppercase), CC/volume/menu action icons
- Center: skip-back-10 button, Jewel play/pause button (large circle, surface_container_highest/40 + blur + glow aura, primary icon, active:scale-95), skip-forward-10 button
- Bottom: timestamp labels (tabular-nums), seek bar (gradient fill primary/80 to primary, buffer line white/20, playhead dot), participant avatars + SyncStatusChip
**And** controls auto-hide after 5 seconds of inactivity
**And** a subsequent tap hides the controls immediately

**Given** the seek bar is interactive
**When** the user drags the playhead
**Then** the playhead enlarges and timestamp updates in real-time
**And** on release, a sync:seek command is sent if the user has seek permission

**Given** the host accesses the permission settings
**When** the host configures playback permissions (FR21)
**Then** the host can toggle which controls (play/pause, seek) other participants are allowed to use
**And** participants without permission see disabled controls (surface_container_highest background, on_surface_variant text, cursor-not-allowed)
**And** permission changes are broadcast to all participants via participant:permission-update

**Given** keyboard interaction on web
**When** the player is focused
**Then** Space toggles play/pause, Left/Right arrows seek +/-10s, M toggles mute, F toggles fullscreen, Escape dismisses controls (UX-DR22)

### Story 4.5: Subtitles & Stepped-Away

As a participant,
I want to toggle subtitles for myself and indicate when I step away,
So that I can personalize my viewing experience and the group pauses when someone leaves.

**Acceptance Criteria:**

**Given** the player controls are visible
**When** the participant taps the CC (closed captions) icon
**Then** English subtitles toggle on or off for that participant only (FR22)
**And** no other participant's subtitle state is affected
**And** the CC icon shows active state (primary color) when subtitles are on
**And** subtitles are retrieved from the Jellyfin API for the selected movie

**Given** a participant steps away (e.g., app backgrounded on mobile, or explicit "step away" action)
**When** the stepped-away state is detected
**Then** a participant:stepped-away message is sent to the server
**And** the server triggers sync:pause for all participants
**And** the stepped-away participant's ParticipantChip dims (reduced opacity) with a stepped-away indicator
**And** other participants see a brief subtitle text: "[Name] stepped away"

**Given** the stepped-away participant returns
**When** the app is foregrounded or the participant resumes
**Then** a participant:returned message is sent to the server
**And** the server triggers sync:play to resume playback for all participants
**And** the participant's ParticipantChip returns to normal opacity
**And** resume is automatic — no manual action required from any participant (FR23)

## Epic 5: Voice Chat & Audio

Participants hear each other automatically when joining a room — mic on by default, zero configuration. Voice volume is independently adjustable per participant, mixable with movie audio on-device, and continues working when the mobile app is backgrounded. The "same couch" feeling is complete.

### Story 5.1: WebRTC Voice Connection & Signaling

As a participant,
I want voice chat to connect automatically when I join a room,
So that I can hear and talk to others without any setup.

**Acceptance Criteria:**

**Given** a participant joins a room
**When** the room entry completes
**Then** the client initiates WebRTC peer connections with all existing participants via P2P mesh topology
**And** WebRTC signaling (offers, answers, ICE candidates) is relayed through the signaling server via signal:offer, signal:answer, and signal:ice-candidate messages
**And** the signaling server never touches media streams — only relays negotiation messages
**And** voice audio is audible within 2 seconds of room join — hearing the other person IS the feedback (no "connected" toast or visual indicator)

**Given** WebRTC connections are established
**When** voice is flowing
**Then** voice latency (mouth to ear) is < 300ms (NFR3)
**And** audio quality is 48kbps Opus minimum (NFR4)
**And** all voice connections use DTLS-SRTP encryption (NFR16)
**And** echo cancellation leverages platform AEC built into WebRTC — zero echo tolerance (NFR5)

**Given** the platform-agnostic WebRTC abstraction exists
**When** voice is initialized on different platforms
**Then** packages/shared/src/voice/webrtc-manager.ts provides the abstraction layer
**And** mobile uses react-native-webrtc via Expo dev builds
**And** web uses the native browser WebRTC API
**And** useVoiceStore tracks WebRTC connection states, mute state, and volume levels

**Given** STUN/TURN infrastructure is configured
**When** participants are behind NAT
**Then** STUN handles standard NAT traversal
**And** Coturn 4.9.x TURN relay serves as fallback for symmetric NAT scenarios
**And** Coturn configuration is provided in coturn/turnserver.conf

**Given** the microphone permission is needed
**When** the user joins a room for the first time
**Then** the OS-native microphone permission prompt is shown (no pre-explanation modal)
**And** if granted, mic is on by default (FR26)
**And** if denied, voice playback still works (user can hear others) but cannot transmit

**Given** a WebRTC connection fails
**When** voice drops for a participant
**Then** the system attempts renegotiation automatically
**And** playback continues unaffected — voice is degraded, not broken
**And** no error is surfaced unless voice remains disconnected for > 3 seconds

### Story 5.2: Mic Toggle & MicToggleFAB

As a participant,
I want to mute and unmute my microphone with a single tap,
So that I can control when others hear me without disrupting the movie.

**Acceptance Criteria:**

**Given** the participant is in a room with voice connected
**When** the MicToggleFAB is displayed during playback
**Then** it is a pill-shaped floating button anchored to the bottom-right corner (surface_container_high/40 + blur + ghost border)
**And** it is the only persistent UI element during sacred screen playback

**Given** the microphone is on (default state — FR26)
**When** the MicToggleFAB shows live state
**Then** it displays a primary color dot, outlined mic icon, and reduced opacity (fades into background — mic on is the unremarkable default state)

**Given** the participant taps the MicToggleFAB
**When** the mic is currently on
**Then** the mic mutes immediately with a single tap (FR25)
**And** the FAB transitions to muted state: error color dot (pulsing glow), filled mic_off icon, "MIC MUTED" label, 60% opacity (more visible to remind user they're muted)
**And** the participant's ParticipantChip in the lobby/player updates to show mic_off icon for all participants

**Given** the participant taps the MicToggleFAB again
**When** the mic is currently muted
**Then** the mic unmutes immediately
**And** the FAB transitions back to live state
**And** the ParticipantChip updates accordingly

**Given** the MicToggleFAB accessibility
**When** the toggle is activated
**Then** it announces "Microphone muted" or "Microphone on" for screen readers
**And** no "you're on mute" interruption is ever shown — the anti-Zoom principle

### Story 5.3: Per-Participant Volume Control & Audio Mixing

As a participant,
I want to adjust each person's voice volume and the balance between voice and movie audio,
So that I can hear everyone clearly without dialogue getting drowned out.

**Acceptance Criteria:**

**Given** the participant accesses volume controls (via player controls or room lobby)
**When** the volume controls appear
**Then** an inline overlay shows near the volume icon with per-participant volume sliders (FR27)
**And** each slider is labeled with the participant's name
**And** the overlay dismisses on outside tap (no modal — inline overlay pattern)

**Given** the participant adjusts a per-participant voice slider
**When** the slider value changes
**Then** the voice volume for that specific participant changes in real-time on-device only
**And** the change does not affect any other participant's audio mix
**And** the volume level is stored in useVoiceStore for persistence during the session

**Given** the participant adjusts overall room voice volume
**When** the room voice slider changes
**Then** all voice audio adjusts relative to movie audio (FR28)
**And** the movie audio level remains unchanged — only voice volume shifts

**Given** movie audio and voice audio are playing simultaneously
**When** both streams are active
**Then** both are mixed on-device so both are audible simultaneously (FR29)
**And** the audio mix is performed client-side — the server never touches audio streams
**And** the mix is comfortable for extended viewing (voice doesn't overpower dialogue, dialogue doesn't drown voice)

### Story 5.4: Background Audio on Mobile

As a mobile participant,
I want voice chat and movie audio to continue when I background the app or lock my screen,
So that I stay connected to the watch session even when multitasking briefly.

**Acceptance Criteria:**

**Given** the participant is in an active session on mobile
**When** the app is backgrounded (home button, app switcher) or the screen locks
**Then** movie audio continues playing (FR30)
**And** voice chat continues functioning — both sending and receiving (FR30)
**And** WebRTC peer connections are maintained

**Given** the participant returns to the app from background
**When** the app is foregrounded
**Then** video playback resumes visually from the correct synced position
**And** voice chat is still active with no interruption
**And** no reconnection or resync is needed

**Given** background audio requires native module integration
**When** configured on mobile platforms
**Then** expo-video background audio mode is enabled for movie audio
**And** react-native-webrtc audio session is configured for background voice
**And** iOS audio session category is set appropriately for simultaneous playback and recording
**And** Android audio focus is managed to prevent other apps from interrupting

## Epic 6: Cross-Platform Polish & Deployment

The full JellySync experience works identically across Android, iOS, and Web with the premium "Private Screening" aesthetic. Cross-platform parity is verified, responsive breakpoints are tuned for web, keyboard shortcuts are implemented, Docker Compose deployment is configured, and the app is production-ready for movie night.

### Story 6.1: Web Responsive Adaptation

As a web user,
I want the JellySync web app to adapt gracefully to wider screens,
So that the experience feels native and polished on desktop and tablet browsers.

**Acceptance Criteria:**

**Given** the web app is viewed on a tablet or desktop browser
**When** the viewport reaches md breakpoint (768px+)
**Then** the PosterGrid expands to 4 columns with wider content padding (px-12)
**And** the RoomCodeDisplay scales up (text-6xl to text-7xl)

**Given** the web app is viewed on a desktop browser
**When** the viewport reaches lg breakpoint (1024px+)
**Then** the PosterGrid expands to 5-6 columns
**And** bottom navigation is hidden and replaced by side navigation or top navigation
**And** the library browser takes advantage of wider layout

**Given** the web app is viewed on a large desktop
**When** the viewport reaches xl breakpoint (1280px+)
**Then** content is centered in a max-width container (max-w-screen-xl mx-auto) with generous margins
**And** the layout does not stretch to ultra-wide proportions

**Given** the player screen on any viewport
**When** a movie is playing
**Then** the player is always full-viewport regardless of breakpoint — the sacred screen has no responsive compromise

**Given** the Home Hub on any viewport
**When** displayed on web
**Then** ActionCards remain stacked vertically at all sizes — the two-button simplicity is preserved

**Given** web-specific interactions
**When** the user interacts with mouse and keyboard
**Then** hover states are visible on PosterGrid items (scale 1.02, title to primary), buttons, and interactive elements
**And** cursor changes to pointer on interactive elements
**And** all Tailwind responsive prefixes (sm:, md:, lg:, xl:) are used — never custom media queries

### Story 6.2: Accessibility Audit & Compliance

As a user with accessibility needs,
I want JellySync to meet WCAG 2.1 Level AA standards,
So that I can use the app comfortably regardless of ability.

**Acceptance Criteria:**

**Given** all screens across the application
**When** audited for accessibility
**Then** all text/interactive color combinations meet WCAG AA contrast ratios (4.5:1 normal text, 3:1 large text)
**And** all interactive elements have 48px minimum touch targets
**And** no text is smaller than label-small (0.625rem / 10px)

**Given** keyboard navigation on web
**When** a user navigates via keyboard
**Then** tab order follows visual layout (left-to-right, top-to-bottom)
**And** focus indicators show a primary color ring on focused elements
**And** a skip-to-content link is available for screen reader users
**And** Escape key dismisses overlays and revealed player controls
**And** focus is trapped within overlays (player controls, volume slider) when open — Tab cycles within

**Given** screen reader usage
**When** assistive technology is active
**Then** all icon-only buttons have ARIA labels
**And** semantic HTML elements are used throughout (nav, main, section, button, input)
**And** sync state changes are announced via role="status" with aria-live="polite" ("Synchronized", "Waiting for [Name]")
**And** room code is announced character-by-character
**And** player state changes (play/pause, seek position) are announced

**Given** motion sensitivity preferences
**When** prefers-reduced-motion is enabled
**Then** pulse animations are disabled
**And** scale transitions become instant
**And** shimmer loading states are replaced with static placeholders
**And** no essential information is conveyed through animation alone

**Given** mobile screen reader testing
**When** VoiceOver (iOS) and TalkBack (Android) are activated
**Then** all screens are navigable and all interactive elements are operable
**And** form inputs are linked to labels
**And** color is never the sole indicator of state — always paired with text, icon, or shape change

### Story 6.3: Cross-Platform Parity Testing & Fixes

As a user,
I want all JellySync features to work identically on Android, iOS, and Web,
So that I have the same experience regardless of which device I'm using.

**Acceptance Criteria:**

**Given** all 36 functional requirements
**When** tested on Android (React Native via Expo), iOS (React Native via Expo), and Web (React via Vite)
**Then** every FR passes on all three platforms (FR33, FR34, FR35, FR36)

**Given** deep link handling
**When** tested per platform
**Then** Android intents correctly route JellySync deep links to the room
**And** iOS universal links correctly route to the room
**And** Web URL routing (/room/:code) correctly loads the room

**Given** NFR performance targets
**When** measured across platforms
**Then** sync drift < 500ms on all platforms (NFR1)
**And** voice latency < 300ms on all platforms (NFR3)
**And** room creation < 3 seconds on all platforms (NFR8)
**And** deep link to in-room < 5 seconds on all platforms (NFR9)
**And** UI interactions < 100ms on all platforms (NFR12)

**Given** platform-specific components (video player, WebRTC, secure storage, share sheet)
**When** tested on each platform
**Then** expo-video works correctly on Android and iOS
**And** HTML5 video with MediaSource Extensions works on Chrome, Firefox, and Safari (FR36)
**And** react-native-webrtc functions on both mobile platforms
**And** browser WebRTC API functions on all supported browsers
**And** platform secure storage (Keychain/Keystore/encrypted web) correctly persists and retrieves credentials

**Given** no telemetry requirement
**When** network traffic is inspected
**Then** no analytics, tracking, or telemetry data leaves the system beyond Jellyfin API calls and WebRTC peer connections (NFR17)

### Story 6.4: Docker Compose Deployment

As a self-hoster,
I want to deploy JellySync with a single Docker Compose command alongside my Jellyfin server,
So that the signaling server, web app, and TURN server are production-ready for movie night.

**Acceptance Criteria:**

**Given** the Docker Compose configuration
**When** `docker compose up` is run
**Then** the jellysync-server container starts with the Fastify signaling server
**And** the server handles WebSocket connections over WSS (NFR18)
**And** the Vite-built web SPA is served as static files via @fastify/static from the same container
**And** the coturn container starts with STUN/TURN services configured via coturn/turnserver.conf

**Given** the server Dockerfile
**When** the server container is built
**Then** Dockerfile.server produces a minimal production image
**And** the build compiles TypeScript to JavaScript via esbuild/tsc
**And** only production dependencies are included in the final image

**Given** environment configuration
**When** deploying to production
**Then** .env.example documents all required environment variables (signaling server URL, Coturn credentials, allowed origins)
**And** .env files configure per-environment settings
**And** the server validates required environment variables on startup via config.ts

**Given** mobile app distribution
**When** building for production
**Then** EAS Build configuration (eas.json) is set up for Android APK and iOS TestFlight/ad-hoc builds
**And** the mobile app is configured to connect to the production signaling server URL
**And** Expo dev builds support development with native modules (WebRTC, background audio)

**Given** the deployment is running
**When** all services are healthy
**Then** the web app is accessible via HTTPS on the configured domain
**And** WebSocket connections establish successfully from all platforms
**And** STUN/TURN services are reachable for NAT traversal
**And** the system runs alongside an existing Jellyfin server without conflicts
