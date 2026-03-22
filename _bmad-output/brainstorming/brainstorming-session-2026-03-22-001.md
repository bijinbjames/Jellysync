---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Cross-platform synced movie-watching app with Jellyfin integration and voice chat'
session_goals: 'App naming, feature ideation, UX concepts, technical architecture for a polished watch-party experience'
selected_approach: 'ai-recommended'
techniques_used: ['Role Playing', 'What If Scenarios', 'Morphological Analysis']
ideas_generated: [33]
context_file: ''
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitator:** Bijin
**Date:** 2026-03-22
**App Name:** JellySync

## Session Overview

**Topic:** Cross-platform (Android + iOS + Web) synchronized movie-watching app integrated with Jellyfin, featuring real-time voice chat for watch parties with partner, friends, and family.

**Goals:** App naming, feature design, UX concepts, and technical architecture for a polished, production-quality "watch together" experience.

**Core Principle:** This is a personal connection tool — the soul is togetherness, not streaming tech. Purpose-built for Jellyfin library, exists only for the "watch together" moment. Solo watching uses Jellyfin directly.

### Session Setup

- **Existing Infrastructure:** Jellyfin media server at home, Tailscale for remote access
- **Target Platforms:** Android + iOS + Web
- **Target Users:** Partner, friends, family — social watch-party use case
- **Key Features:** Synced playback, individual transcoding, voice chat with movie audio overlay
- **Quality Bar:** High-intensity, polished side project

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Personal connection tool for synchronized movie watching with focus on togetherness

**Techniques Used:**

- **Role Playing:** Explored three personas — partner on a weeknight, first-time friend, non-tech family member — to ground features in real emotional moments
- **What If Scenarios:** Challenged assumptions about core experience, connection, rough edges, and app structure
- **Morphological Analysis:** Systematically mapped 8 dimensions with locked design decisions

**AI Rationale:** Led with empathy (Role Playing), expanded with imagination (What If), converged with structure (Morphological Analysis).

## Technique Execution Results

### Role Playing — Personas Explored

**Persona 1: You and your partner on a weeknight**
- Movie decision happens over text before opening the app
- Login with existing Jellyfin credentials, persistent session
- Select movie, generate room code, share via text
- Voice on by default — living room feel
- Movie audio constant, voice overlaid

**Persona 2: Friend who's never used the app**
- Jellyfin account creation is the admin's (Bijin's) responsibility
- App only handles auth, not user management

**Persona 3: Non-tech family member**
- One-time login walkthrough, persistent session after that
- Deep link routes through login if needed
- Simple 6-char code, prominent entry field

### What If Scenarios — Key Decisions

- No online presence indicators — unnecessary
- No "watch again with" shortcuts — unnecessary
- No adaptive voice quality — per-participant volume sliders are sufficient
- Hard sync on buffer — pause everyone, nobody left behind
- English subtitles only, toggle per person
- Late joiners land at current timestamp
- Two-button home screen: Create Room / Join Room
- Auto host succession on disconnect
- Mid-session movie swap without killing room
- Participants list in options menu only — no on-screen overlays
- Jellyfin-familiar player controls — zero learning curve

### Morphological Analysis — Locked Decisions

| Dimension | Decision |
|-----------|----------|
| Identity & Auth | Jellyfin credentials + server URL, persistent login |
| Room Creation | 6-char alphanumeric code + deep link |
| Playback Sync | Hard sync — pause all on any buffer |
| Voice Chat | WebRTC peer-to-peer with TURN relay fallback |
| Audio Mixing | Device-side mixing, per-participant + room voice sliders |
| Control Permissions | Host-configurable permission toggles (play/pause/seek) |
| Room Lifecycle | Persistent room, auto-succession, mid-session movie swap |
| App Scope | Android + iOS + Web (React Native + React, shared TypeScript) |

## Idea Organization and Prioritization

### Theme 1: Identity & Branding
- **JellySync** — clean, Jellyfin-native name
- **Jellyfin dark theme** — visual extension of Jellyfin, not a separate product
- **Simple error messages** — "Server unreachable." No fluff.

### Theme 2: Authentication & Onboarding
- **Jellyfin credentials only** — no separate accounts
- **Persistent login** — enter once, stay logged in forever
- **Account creation is the admin's job** — app doesn't touch user management

### Theme 3: Room System
- **Two-button home screen** — "Create Room" and "Join Room"
- **6-char alphanumeric code** — simple, no dashes
- **Deep link + code** — link auto-routes through login if needed
- **Room lives until all exit** — no auto-timeout
- **Automatic host succession** — next person takes over on disconnect
- **Mid-session movie swap** — switch films, keep the room
- **Late joiners at current timestamp** — no catch-up mode
- **No waiting room** — host starts, participants join at current position

### Theme 4: Playback & Sync
- **Hard sync** — anyone buffers, everyone pauses
- **Per-user transcoding via Jellyfin** — right quality per connection
- **Jellyfin-familiar player controls** — same gestures and layout
- **English subtitles only** — on/off per person

### Theme 5: Playback Control & Permissions
- **Host-configurable permissions** — toggle play/pause/seek per participant
- **Democratic pause** — anyone can pause (when permitted)
- **Seek permissions** — configurable by host
- **Stepped away auto-pause** — app backgrounds, movie pauses, indicator shown
- **Control handoff** — remaining participants take over from absent person

### Theme 6: Voice & Audio
- **WebRTC P2P with TURN fallback** — direct when possible, relay when needed
- **Device-side audio mixing** — movie constant, voice overlaid
- **Per-participant volume sliders** — individual mix control
- **Room voice slider** — overall voice volume in player UI
- **Mic toggle always accessible** — one-tap, always visible
- **Mic on by default** — always connected

### Theme 7: Deliberate Scope Boundaries
- No reactions, no timeline annotations, no TV app
- No push notifications
- No collaborative browsing
- No online presence indicators
- No speaking indicators on screen

### Theme 8: Technical Architecture
- **React Native** (Android/iOS) + **React** (Web) — shared TypeScript core
- **Jellyfin API** for library, transcoding, and auth
- **Tailscale-friendly networking**
- 3 platforms, 1 language, shared business logic

### Breakthrough Concepts

- **Togetherness-first sync** — pausing everyone on any buffer. If we're not in sync, we're not together.
- **The sacred screen** — zero overlays during playback. Voice is invisible presence.
- **Two-button app** — radical simplicity. One purpose, visible on launch.

## Session Summary and Insights

**Key Achievements:**
- 33 well-defined ideas covering every dimension of JellySync
- Complete architectural decision matrix locked in
- Clear product vision: togetherness through simplicity
- Deliberate scope boundaries preventing feature creep

**Design Philosophy Emerged:**
Every decision reinforces one principle — togetherness through simplicity. The app doesn't try to be a social platform, a browsing tool, or a notification engine. It's the room you walk into when you want to watch a movie with someone who isn't next to you.

**Next Steps:**
1. Use this brainstorming output as input for product brief or PRD creation
2. Consider running `bmad-bmm-create-product-brief` or `bmad-bmm-create-prd` to formalize the vision
3. Architecture decisions are ready for `bmad-bmm-create-architecture` when the time comes
