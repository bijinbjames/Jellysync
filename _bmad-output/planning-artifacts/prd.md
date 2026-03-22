---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-myapp-2026-03-22.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: cross-platform (mobile + web)
  domain: general/entertainment
  complexity: medium
  projectContext: greenfield
workflowType: 'prd'
---

# Product Requirements Document - JellySync

**Author:** Bijin
**Date:** 2026-03-22

## Executive Summary

JellySync is a cross-platform synchronized movie-watching app built for Jellyfin. It lets you watch movies with your partner, friends, and family in real-time — with synced playback and always-on voice chat — across Android, iOS, and Web. This is a personal tool, not a product: it exists to make remote movie nights feel like sharing a couch.

The problem is simple. Watching a movie together when you're apart is either impossible or broken. Discord screen-sharing degrades quality and kills individual transcoding. Browser extensions don't support Jellyfin. Syncplay is desktop-only and technical. The fallback is counting down "3, 2, 1, play" over a phone call. None of these feel like being together — they feel like workarounds.

JellySync replaces all of that with a two-button app: Create Room or Join Room. One person picks the movie from their Jellyfin library, shares a 6-character code, and everyone is watching together within seconds. Playback is hard-synced — if anyone buffers, everyone pauses. Voice chat is on by default via WebRTC, mixed underneath the movie audio. The screen stays sacred: no overlays, no indicators, no UI fighting for attention. Just the movie and each other's voices.

### What Makes This Special

Existing tools treat "watching together" as a feature bolted onto something else. JellySync treats togetherness as the entire product. Every design decision flows backward from one question: are we in the same moment?

- **Hard sync over smooth playback** — everyone pauses when anyone buffers, because being on different frames means you're not together
- **Voice as invisible presence** — mic on by default, no push-to-talk, no indicators; it's the ambient sound of being in the same room
- **The sacred screen** — zero UI during playback; the movie owns every pixel
- **Radical simplicity** — two buttons on launch, 6-character codes, deep links; the app disappears within seconds of opening it
- **Jellyfin-native** — built for one media server, not a generic bolt-on; per-user transcoding, library browsing, and subtitle support come from tight integration

## Project Classification

- **Project Type:** Cross-platform application (React Native for Android/iOS, React for Web, shared TypeScript core)
- **Domain:** Personal entertainment / media streaming
- **Complexity:** Medium — technically non-trivial (real-time sync, WebRTC, cross-platform), but no regulatory or compliance requirements
- **Project Context:** Greenfield — new product, no existing codebase

## Success Criteria

### User Success

- **The app disappears** — within 30 seconds of deciding to watch, both participants are in the room
- **The sync is invisible** — pauses, buffers, and seeks happen together; you never notice the sync
- **The voice feels like presence** — mic is just there; nobody turned anything on
- **The movie owns the screen** — no popups, no indicators, no UI fighting for attention
- **It ends naturally** — credits roll, you keep talking, exit when done; no forced closure

### Business Success

Not applicable — personal project. The only metric: **does it get used on movie night?**

### Technical Success

All performance targets defined in the Non-Functional Requirements section. Design principles: reuse the Jellyfin API wherever possible, keep the app thoughtfully designed and lightweight, avoid unnecessary complexity.

### Measurable Outcomes

- **Session frequency** — watch parties happening regularly (weekly or more)
- **Session completion rate** — sessions run to the end of the movie without bailout
- **Zero-troubleshooting rate** — 95% of sessions start without "can you hear me?" or "it's not syncing" moments
- **Deep link success rate** — tapping the shared link lands you in the room every time

## Product Scope & Phased Development

### MVP Strategy

**Approach:** Experience MVP — the minimum that delivers the "same couch" feeling. Every feature in scope serves one question: can two people watch a movie together and forget they're using an app?

**Resource:** Solo developer (Bijin). All platforms ship simultaneously, Android is the primary development and testing target.

**Technology:** React Native (Android + iOS), React (Web), shared TypeScript core.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Host creates room, picks movie, shares code (Journey 1)
- Partner joins via deep link or code (Journey 3)
- Family member onboards and joins (Journey 5)
- Mid-session movie swap (Journey 2)
- Buffer sync recovery (Journey 4)

**Must-Have Capabilities:**
- Jellyfin auth with persistent session
- Two-button home screen (Create Room / Join Room)
- 6-character room codes + deep link sharing
- Jellyfin library browsing and movie selection
- Hard-synced playback (buffer = everyone pauses)
- Per-user transcoding via Jellyfin API
- WebRTC voice chat (mic on by default, one-tap toggle)
- Device-side audio mixing (movie + voice)
- Per-participant volume sliders
- English subtitles toggle (per user)
- Host playback permission controls
- Stepped-away auto-pause
- Mid-session movie swap
- Late joiner timestamp sync
- Background audio on mobile
- Android, iOS, and Web

### Phase 2 (Growth)

- Friends & family onboarding optimization
- Room history / "watch again" quick-start
- Connection quality indicators (subtle, non-intrusive)
- Multiple subtitle languages
- Multiple audio track selection

### Phase 3 (Expansion)

- TV app support (Apple TV, Android TV, Fire TV)
- Improved library experience (search, filters, recommendations)
- Push notifications for room invites
- Collaborative library browsing

### Out of Scope

- Reactions, emojis, or timeline annotations
- Online presence / speaking indicators on screen
- User account management (admin creates Jellyfin accounts separately)

### Risk Mitigation

**Technical Risks:**
- *WebRTC + background audio on React Native* — highest risk. Prototype voice layer early. Fallback: native module bridge or alternative libraries.
- *Hard sync across platforms* — build sync engine as shared TypeScript module with comprehensive timestamp logging from day one.
- *Echo cancellation* — leverage platform AEC built into WebRTC, test on real devices early and often.

**Resource Risks:**
- Solo developer, three platforms. Maximize shared TypeScript core. Platform-specific code limited to video player and native module bridges.
- Contingency: ship Android + Web first, defer iOS to Phase 1.5.

## User Journeys

### Journey 1: Bijin — Movie Night Host (Happy Path)

It's Friday evening. Bijin and his partner have been texting about watching a movie tonight. They've already decided on one earlier in the day.

Bijin opens JellySync on his phone. Two buttons: **Create Room** and **Join Room**. He taps Create Room. The app drops him into his Jellyfin library — familiar layout, same movies he knows are there. He scrolls to the movie, taps it, and a room spins up. A 6-character code appears with a share button. He taps share, sends it over text. Done — took maybe 8 seconds.

He hears his partner's voice come through almost immediately. "Hey, I'm in." No "can you hear me?" No fiddling. The movie starts, and within moments they're both watching the same frame. He laughs at a scene, she laughs a beat later — but it's close enough that it feels simultaneous. The screen is just the movie. No overlay telling him she's connected. He knows because he can hear her.

Halfway through, she gets up to grab water. The movie pauses for both of them — a small indicator shows she stepped away. She comes back, it resumes. Neither of them had to touch anything.

Credits roll. They keep talking about the ending. When they're done, they both tap exit. That's it.

### Journey 2: Bijin — Mid-Session Movie Swap

They're 15 minutes into the movie and it's not clicking. "This isn't it," she says. Bijin doesn't need to kill the room. He opens the library browser from within the room, picks a different movie, and the playback swaps. Same room, same voice connection, new movie. No codes to reshare, no rejoining. They settle into the second pick and this one lands.

### Journey 3: Partner — Joining a Room (Returning User)

She gets a text from Bijin: a deep link. She taps it. JellySync opens — she's still logged in from last time. The app drops her straight into the room. Bijin's voice is already there. The movie starts. Total time from tapping the link to watching: under 10 seconds.

She wants subtitles on — she toggles English subtitles from the player controls. His screen isn't affected. During a quiet scene, she adjusts Bijin's voice volume down slightly so the dialogue comes through clearer. The movie plays to the end. She never thought about the app once.

### Journey 4: Partner — Buffering During Playback

Twenty minutes in, her connection dips. The movie pauses for both of them. She doesn't have to say anything — Bijin sees it paused and knows. A few seconds later, it resumes automatically. They're still on the same frame. The moment passed without anyone asking "wait, are you still there?"

### Journey 5: Family Member — First Time Joining

Bijin's sister is visiting their parents remotely and he wants to watch a movie together. He's already created a Jellyfin account for her. He sends her two things: a link to install JellySync and a room code.

She installs the app. It asks for a Jellyfin server URL, username, and password — Bijin texted those too. She enters them, logs in. The app shows two buttons. She sees the **Join Room** field, types in the 6-character code. She's in. Bijin's voice greets her. The movie starts.

She doesn't know what Jellyfin is. She doesn't know what transcoding means. She doesn't need to. The whole onboarding took under 2 minutes, and most of that was typing the server URL.

### Journey 6: Family Member — Joining via Deep Link (Second Time)

Next week, Bijin sends his sister a deep link. She taps it, JellySync opens, she's still logged in. She's in the room in seconds. This time there was nothing to figure out.

### Journey Requirements Summary

- **Room lifecycle** — create, join (code + deep link), persist, swap movie, exit cleanly
- **Jellyfin integration** — library browsing, per-user transcoding, subtitle toggle per user, persistent auth
- **Sync engine** — hard-sync playback, buffer detection with auto-pause/resume, late joiner timestamp sync
- **Voice system** — always-on WebRTC, per-participant volume control, zero-config connection, no echo
- **Sharing** — one-tap deep link generation, one-tap join from link, room code entry as fallback
- **Player controls** — play/pause/seek with host permission model, stepped-away auto-pause
- **Onboarding** — minimal first-time flow (server URL + credentials), persistent session eliminates repeat login
- **Cross-platform parity** — all journeys must work identically on Android, iOS, and Web

## Cross-Platform Requirements

### Platform Strategy

- React Native for Android and iOS — single codebase for both mobile platforms
- React for Web — shared TypeScript core with mobile
- Shared TypeScript core — sync engine, room management, Jellyfin API client, state management

### Device Permissions

- Microphone — WebRTC voice chat (requested on first room join)
- No other device permissions needed

### Browser Support (Web)

- Chrome (primary), Firefox, Safari

### Mobile (React Native)

- Background audio required — voice chat and movie audio continue when backgrounded or screen locks
- No offline mode — online-only by nature
- Sideloaded distribution (APK for Android, TestFlight or ad-hoc for iOS)

### Web (React)

- SPA architecture
- No SEO, PWA, or offline requirements
- WebRTC and MediaSource API support required

### Implementation Considerations

- Jellyfin API client as shared TypeScript module consumed by all platforms
- WebRTC layer abstracts platform differences (browser WebRTC vs React Native WebRTC)
- Player component differs per platform (native on mobile, HTML5 on web) but sync logic is shared
- Deep link handling: Android intents, iOS universal links, web URL routing

## Functional Requirements

### Authentication & Session

- FR1: User can log in with Jellyfin server URL, username, and password
- FR2: User can remain logged in across app restarts (persistent session)
- FR3: User can log out of the app

### Room Management

- FR4: Host can create a new watch room
- FR5: Host can view a generated 6-character alphanumeric room code upon room creation
- FR6: Host can share the room code and deep link via the device's native share sheet
- FR7: Participant can join a room by entering a 6-character room code
- FR8: Participant can join a room by tapping a deep link
- FR9: Room persists until all participants have exited
- FR10: Host role automatically transfers to another participant if the host disconnects
- FR11: Participant can exit a room at any time
- FR12: Late-joining participant lands at the current playback timestamp

### Library & Movie Selection

- FR13: Host can browse the Jellyfin media library from within the app
- FR14: Host can select a movie from the library to start playback in the room
- FR15: Host can swap the current movie for a different one mid-session without destroying the room

### Playback & Sync

- FR16: All participants see synchronized playback of the selected movie
- FR17: Playback pauses for all participants when any participant's stream buffers
- FR18: Playback automatically resumes for all participants when buffering resolves
- FR19: Each participant receives an individually transcoded stream from Jellyfin appropriate for their connection
- FR20: Host can play, pause, and seek the shared playback
- FR21: Host can configure which playback controls (play/pause/seek) other participants are allowed to use
- FR22: Participant can toggle English subtitles on or off independently without affecting other participants
- FR23: Participant can indicate "stepped away" status, which triggers auto-pause for all participants

### Voice Chat

- FR24: All participants in a room are connected via voice chat automatically upon joining
- FR25: Participant can mute/unmute their microphone with a single tap
- FR26: Microphone is on by default when joining a room
- FR27: Participant can adjust the voice volume of each other participant independently
- FR28: Participant can adjust the overall room voice volume relative to movie audio
- FR29: Movie audio and voice audio are mixed on-device so both are audible simultaneously
- FR30: Voice chat continues functioning when the mobile app is backgrounded or the screen locks

### Home Screen

- FR31: User sees two primary actions on the home screen: Create Room and Join Room
- FR32: User can enter a room code directly from the home screen

### Cross-Platform

- FR33: All capabilities are available on Android, iOS, and Web
- FR34: Android is supported via React Native
- FR35: iOS is supported via React Native
- FR36: Web is supported via React (Chrome, Firefox, Safari)

## Non-Functional Requirements

### Performance

| Requirement | Target |
|-------------|--------|
| Playback sync drift between participants | < 500ms |
| Play/pause/seek command propagation to all participants | < 200ms |
| Voice chat latency (mouth to ear) | < 300ms |
| Voice audio quality | 48kbps Opus minimum |
| Echo and audio feedback | Zero tolerance |
| Buffer detection to pause propagation | < 1 second |
| Buffer resync and resume | 3-5 seconds |
| Room creation (tap to code visible) | < 3 seconds |
| Deep link to in-room (returning user) | < 5 seconds |
| Library browsing response (page load) | < 2 seconds |
| App launch to home screen | < 2 seconds |
| UI interactions (taps, toggles, navigation) | < 100ms feedback |

### Security

- Jellyfin credentials stored in platform secure storage (Keychain on iOS, Keystore on Android, encrypted storage on web)
- Auth tokens used for Jellyfin API communication, not raw credentials after initial login
- Room codes are ephemeral — expire when room closes, no persistent room state
- WebRTC voice connections use DTLS-SRTP encryption (WebRTC standard)
- No analytics, tracking, or telemetry — no data leaves the system beyond Jellyfin API calls and WebRTC peer connections

### Integration

- **Jellyfin API** — authentication, library browsing, movie metadata, stream URLs, transcoding configuration, subtitle retrieval. The app is fully dependent on a running Jellyfin server. Reference: https://jellyfin.org/docs/
- **WebRTC (STUN/TURN)** — peer-to-peer voice chat. STUN for NAT traversal, TURN relay as fallback for symmetric NAT. Reference: https://webrtc.org/getting-started/overview
- **Signaling server** — coordinates WebRTC peer connections and room state sync. Manages room lifecycle, relays sync commands, facilitates WebRTC signaling.
