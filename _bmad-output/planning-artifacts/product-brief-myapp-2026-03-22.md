---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-03-22-001.md
date: 2026-03-22
author: Bijin
---

# Product Brief: myapp

## Executive Summary

JellySync is a cross-platform (Android, iOS, Web) synchronized movie-watching app purpose-built for Jellyfin. It lets you watch movies together with your partner, friends, and family — no matter where they are — with real-time voice chat and perfectly synced playback. It's not a social platform or a streaming service. It's the room you walk into when you want to watch a movie with someone who isn't next to you.

---

## Core Vision

### Problem Statement

Watching movies together remotely with people you love is either impossible or painfully janky. Existing solutions require screen sharing over Discord (degraded quality, no individual transcoding), browser extensions that don't work with Jellyfin, or the classic "okay, hit play on 3" over a phone call. None of them feel like actually being together.

### Problem Impact

The result is that remote watch parties either don't happen, or they're frustrating enough to kill the mood. The whole point is connection — and when the tech gets in the way, the togetherness disappears.

### Why Existing Solutions Fall Short

- **Teleparty/Watch Party extensions** — browser-only, no Jellyfin support, no voice chat
- **Discord screen share** — one person's quality for everyone, no individual transcoding, laggy, no proper playback sync
- **Syncplay** — technical setup, desktop-only, no voice, no mobile support
- None of these solutions are built around the feeling of being in the same room. They bolt "together" onto "watching" as an afterthought.

### Proposed Solution

JellySync is a dedicated app with one purpose: watch movies together. Two-button home screen (Create Room / Join Room), Jellyfin credentials for login, 6-character room codes, hard-synced playback where everyone pauses if anyone buffers, and always-on WebRTC voice chat with movie audio underneath. Per-user transcoding via Jellyfin means everyone gets the right quality for their connection. The screen stays sacred — no overlays, no clutter, just the movie and invisible voice presence.

### Key Differentiators

- **Togetherness-first sync** — hard pause on any buffer, because if you're not in sync, you're not together
- **The sacred screen** — zero overlays during playback; voice is invisible presence
- **Two-button app** — radical simplicity, one purpose visible on launch
- **Jellyfin-native** — built for your library, not a generic bolt-on
- **Voice as default** — mic on, always connected, like a living room

## Target Users

### Primary Users

**Bijin (Host / Server Admin)**
- Runs the Jellyfin media server and manages the library
- Initiates most watch sessions — picks the movie, creates the room, shares the code
- Comfortable with tech (Tailscale, self-hosted infrastructure)
- Wants the app to feel polished and effortless despite the complexity underneath
- Success: tapping "Create Room," sharing a code, and being watching together within seconds

**Partner (Participant)**
- Joins sessions via room code or deep link shared over text
- Logged in once with Jellyfin credentials, persistent session after that
- Doesn't need to think about servers, transcoding, or networking — it just works
- Wants it to feel like sitting on the same couch — voice on, movie playing, no friction
- Success: tap the link, hear Bijin's voice, movie starts

### Secondary Users

**Friends & Family (Occasional Participants)**
- Join less frequently, may need a one-time login walkthrough
- Jellyfin account created by Bijin ahead of time
- Simple 6-char code entry, prominent join field
- Deep links route through login if needed
- The bar: if a non-tech family member can join without help, it's right

### User Journey

1. **Discovery** — Bijin shares the app link with partner/friends directly (personal project, no marketing)
2. **Onboarding** — One-time Jellyfin login with server URL + credentials, then persistent session
3. **Core Usage** — Movie decided over text, Bijin opens JellySync, creates a room, browses the Jellyfin library, selects the movie and starts playback. Partner/others join the room via code or link — voice on by default, movie plays in sync.
4. **Success Moment** — The first time you laugh at the same scene together and it feels like the same room
5. **Long-term** — Becomes the default way to watch movies together when apart — zero-thought ritual

## Success Metrics

### The North Star

JellySync is working when you forget you're using it. The measure of success is the conversation afterward being about the movie — not about the app.

### User Success Criteria

- **The app disappears** — within 30 seconds of deciding to watch, both participants are in the room. Login was already done. The code just worked. The deep link just opened.
- **The sync is invisible** — you never notice it. Pauses, buffers, and seeks happen together. You're always on the same frame.
- **The voice feels like presence** — you hear her laugh, she hears you gasp. Nobody turned anything on. The mic was just there.
- **The movie owns the screen** — no popups, no indicators, no UI fighting for attention. Just the film and each other's voices.
- **It ends naturally** — credits roll, you keep talking, and when you're done you both tap exit. No forced closure, no timeout.

### Hard Quality Bars

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Playback sync drift | < 500ms | Beyond this, reactions don't match scenes — illusion breaks |
| Play/pause/seek propagation | < 200ms | Controls must feel instant for everyone |
| Voice latency | < 300ms | Above this, conversation feels like a delayed phone call |
| Voice quality | 48kbps Opus minimum | Clear enough to hear a whisper during a quiet scene |
| Echo/feedback | Zero tolerance | Movie audio must never loop back through mic |
| First launch to watching | < 2 minutes | Install, login, enter code, watching |
| Returning user to watching | < 15 seconds | Open, tap join, enter code, watching |
| Room creation | < 10 seconds | Open, tap create, pick movie, share code |
| Buffer resync & resume | 3-5 seconds | Long enough to recover, short enough nobody asks "what happened?" |
| Deep link sharing | One tap to share, one tap to join | Code + deep link must be frictionless to send and receive |

### Business Objectives

N/A — this is a personal project. There are no revenue, growth, or market targets. The only objective is: **does it get used on movie night?** If Bijin and his partner reach for JellySync every time instead of falling back to "3, 2, 1, play" over a phone call, the project is a success.

### Key Performance Indicators

- **Session frequency** — are watch parties happening regularly?
- **Session completion rate** — do sessions run to the end of the movie without bailout?
- **Zero-troubleshooting rate** — how often does a session start without any "can you hear me?" or "it's not syncing" moments?
- **Deep link success rate** — does tapping the shared link land you in the room every time?

## MVP Scope

### Core Features

**Authentication & Onboarding**
- Jellyfin credentials login (server URL + username/password)
- Persistent session — login once, stay logged in

**Home Screen**
- Two-button interface: Create Room / Join Room
- Room code entry field for joining

**Room System**
- 6-character alphanumeric room codes
- Deep link generation and sharing (one tap to share, one tap to join)
- Room persists until all participants exit
- Automatic host succession on disconnect
- Mid-session movie swap without killing the room
- Late joiners land at current timestamp

**Library & Playback**
- Jellyfin library browsing and movie selection
- Hard-synced playback — anyone buffers, everyone pauses
- Per-user transcoding via Jellyfin API
- Jellyfin-familiar player controls
- English subtitles toggle per person
- Buffer resync and resume within 3-5 seconds

**Playback Permissions**
- Host-configurable permission toggles (play/pause/seek)
- Stepped-away auto-pause with indicator

**Voice Chat**
- WebRTC peer-to-peer with TURN relay fallback
- Device-side audio mixing — movie constant, voice overlaid
- Per-participant volume sliders + room voice slider
- Mic on by default, one-tap toggle always accessible
- 48kbps Opus minimum, < 300ms latency, zero echo

**Platforms**
- Android (React Native)
- iOS (React Native)
- Web (React)
- Shared TypeScript core

### Out of Scope for MVP

- Reactions, emojis, or timeline annotations
- Push notifications
- Collaborative library browsing
- Online presence / speaking indicators on screen
- TV app (Apple TV, Android TV, Fire TV)
- User account management (admin creates Jellyfin accounts separately)
- Multiple audio track selection
- Non-English subtitle support

### MVP Success Criteria

- Bijin and partner can go from "let's watch" to watching together in under 30 seconds (returning user)
- A full movie session completes without sync issues, voice drops, or troubleshooting
- Deep link sharing works end-to-end: tap to share, tap to join, in the room
- All hard quality bars met (sync < 500ms, voice < 300ms, zero echo)
- The conversation after the movie is about the movie, not the app

### Future Vision

- **Friends & family expansion** — optimize the onboarding flow for less technical users
- **TV app support** — Apple TV, Android TV, Fire TV for living room viewing
- **Multiple subtitle languages** and audio track selection
- **Room history** — quick "watch again" with the same person
- **Connection quality indicators** — subtle, non-intrusive feedback when network degrades
- **Improved library experience** — search, filters, recommendations from Jellyfin
