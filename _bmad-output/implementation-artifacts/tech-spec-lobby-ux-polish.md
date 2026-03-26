---
title: 'Lobby UX Polish — Remove Empty Slots, Cancel Confirmation & Change Movie on Card'
slug: 'lobby-ux-polish'
created: '2026-03-26'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['react', 'react-native', 'zustand', 'tailwindcss', 'nativewind', 'expo-router', 'react-router']
files_to_modify:
  - 'apps/mobile/app/room/[code].tsx'
  - 'apps/web/src/routes/room/lobby.tsx'
  - 'apps/mobile/src/features/room/components/movie-brief-card.tsx'
  - 'apps/web/src/features/room/components/movie-brief-card.tsx'
code_patterns:
  - 'Platform-mirrored components: mobile (React Native + NativeWind) and web (React + Tailwind) have parallel implementations'
  - 'Zustand stores accessed via useStore(store, selector) — vanilla Zustand, not React hook'
  - 'Host-only controls gated by isHost from roomStore'
  - 'Tertiary buttons: no background, text-on-surface-variant, min-h-[48px]'
  - 'Destructive actions: text-error color'
  - 'Primary CTA: gradient-primary class'
test_patterns:
  - 'Existing test: packages/shared/src/protocol/room-lobby.test.ts (protocol-level)'
  - 'No component-level tests exist for lobby UI components'
---

# Tech-Spec: Lobby UX Polish — Remove Empty Slots, Cancel Confirmation & Change Movie on Card

**Created:** 2026-03-26

## Overview

### Problem Statement

The lobby screen has three UX issues: (1) empty "Slot available" placeholder chips create an unwelcoming feeling of unfilled capacity rather than openness, (2) Cancel Room triggers immediately with no confirmation, risking accidental room destruction when participants are connected, and (3) the "Change Movie" action is a standalone text button separate from the MovieBriefCard, making it visually disconnected from the movie context.

### Solution

Remove empty slot placeholders so only actual participants render, add a confirmation bottom sheet before Cancel Room executes, and move the "Change Movie" action onto the MovieBriefCard component itself.

### Scope

**In Scope:**
- Remove empty slot placeholder rendering from lobby screens (mobile + web)
- Add Cancel Room confirmation bottom sheet dialog
- Move "Change Movie" button onto MovieBriefCard component (host-only)

**Out of Scope:**
- Start Movie gating (already implemented — requires ≥2 participants + movie)
- Movie change guest notifications (already implemented — 3-second toast)
- Participant slide-in entrance animations (future polish pass)

## Context for Development

### Codebase Patterns

- **Dual-platform mirroring:** Every lobby component exists in both `apps/mobile/src/features/room/components/` (React Native + NativeWind) and `apps/web/src/features/room/components/` (React + Tailwind). Changes must be made to both.
- **Lobby screens:** `apps/mobile/app/room/[code].tsx` and `apps/web/src/routes/room/lobby.tsx` — nearly identical logic, platform-specific JSX.
- **State management:** Zustand stores (`roomStore`, `movieStore`) accessed via `useStore(store, selector)`.
- **Host gating:** `isHost` from `roomStore` controls visibility of host-only controls (Browse Library, Start Movie).
- **Navigation:** Mobile uses `expo-router` (`router.push`), Web uses `react-router` (`navigate`).
- **Button hierarchy:** Primary = `gradient-primary`, Tertiary/ghost = no background + `text-on-surface-variant`, Destructive = `text-error`.
- **MovieBriefCard:** Currently a pure display component with no interactivity. Reads from `movieStore` directly.
- **ParticipantChip:** Three variants via discriminated union — `host`, `participant`, `empty`. The `empty` variant is what we stop rendering.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `apps/mobile/app/room/[code].tsx` | Mobile lobby screen — renders layout, manages state, empty slots, buttons |
| `apps/web/src/routes/room/lobby.tsx` | Web lobby screen — parallel implementation |
| `apps/mobile/src/features/room/components/movie-brief-card.tsx` | Mobile MovieBriefCard — display only, needs `onChangeMovie` callback |
| `apps/web/src/features/room/components/movie-brief-card.tsx` | Web MovieBriefCard — parallel implementation |
| `packages/shared/src/protocol/room-lobby.test.ts` | Existing protocol-level lobby tests |

### Technical Decisions

1. **MovieBriefCard gets `onChangeMovie` prop** — Rather than the card navigating directly, it receives a callback from the lobby screen. This keeps the component reusable and the navigation logic in the screen.
2. **"Change Movie" as tertiary button inside the card** — Positioned below the metadata text, using the same `text-on-surface-variant` tertiary style. Only rendered when `onChangeMovie` is provided (host-only).
3. **Confirmation dialog as inline overlay** — No external modal library needed. A simple state-driven overlay within the lobby screen, styled as a glassmorphic bottom sheet with backdrop.
4. **ParticipantChip `empty` variant preserved in component** — The variant type stays in the component for backwards compatibility but the lobby screens simply stop rendering it. The `VISIBLE_SLOTS` constant and `emptySlots` calculation are removed from lobby screens.

## Implementation Plan

### Tasks

- [x] Task 1: Add `onChangeMovie` prop to mobile MovieBriefCard
  - File: `apps/mobile/src/features/room/components/movie-brief-card.tsx`
  - Action: Add optional `onChangeMovie?: () => void` prop. When provided and a movie is selected, render a "Change Movie" tertiary Pressable below the metadata text inside the card. Style: `text-on-surface-variant font-body text-xs font-medium mt-2`, min-h-[48px] touch target. When no movie is selected, show "Browse Library" text instead of "Change Movie". No-movie placeholder card also becomes tappable when `onChangeMovie` is provided (the whole card acts as the CTA).

- [x] Task 2: Add `onChangeMovie` prop to web MovieBriefCard
  - File: `apps/web/src/features/room/components/movie-brief-card.tsx`
  - Action: Mirror Task 1 for web. Use `<button>` instead of `Pressable`. Add `cursor-pointer hover:text-on-surface transition-colors` to the button. Same layout and text logic.

- [x] Task 3: Update mobile lobby screen — wire MovieBriefCard, remove empty slots, remove standalone Change Movie button
  - File: `apps/mobile/app/room/[code].tsx`
  - Actions:
    - Remove `const VISIBLE_SLOTS = 6` constant
    - Remove `const emptySlots = Math.max(0, VISIBLE_SLOTS - participants.length)` calculation
    - Remove the `{Array.from({ length: emptySlots }).map(...)}` block that renders empty ParticipantChips
    - Remove the standalone `{isHost && (<Pressable onPress={handleBrowseLibrary}...>` block (the "Change Movie" / "Browse Library" button)
    - Pass `onChangeMovie={isHost ? handleBrowseLibrary : undefined}` to `<MovieBriefCard />`
    - Reorder JSX so layout is: Movie card (top) → Room code → Participants → Movie notification → Start Movie → Cancel Room
    - Add `showCancelConfirm` state (`useState(false)`)
    - Change Cancel Room `onPress` to `() => setShowCancelConfirm(true)` instead of `handleLeaveRoom`
    - Add back arrow `onPress` to also show confirmation (same behavior as Cancel Room)
    - Render cancel confirmation overlay when `showCancelConfirm` is true: semi-transparent backdrop (`bg-black/50`) + bottom-aligned glassmorphic container with:
      - Title: "Cancel this room?" (`text-on-surface font-heading text-lg font-bold`)
      - Subtitle: "All participants will be disconnected" (`text-on-surface-variant font-body text-sm mt-1`)
      - "Cancel Room" destructive button (`bg-error/20 rounded-md min-h-[48px] text-error font-display text-base font-bold`) → calls `handleLeaveRoom`
      - "Keep Room" secondary button (`min-h-[48px] text-on-surface-variant font-body text-sm font-medium`) → calls `setShowCancelConfirm(false)`

- [x] Task 4: Update web lobby screen — wire MovieBriefCard, remove empty slots, remove standalone Change Movie button
  - File: `apps/web/src/routes/room/lobby.tsx`
  - Actions: Mirror Task 3 for web. Same logic changes. Use `<div>` and `<button>` instead of `<View>` and `<Pressable>`. Use `onClick` instead of `onPress`. Confirmation overlay uses `fixed inset-0` positioning with `z-50`. Back arrow button also triggers confirmation. Same glassmorphic styling with `backdrop-blur-xl bg-surface-container-high/80 border border-outline-variant/15 rounded-t-2xl`.

### Acceptance Criteria

- [ ] AC 1: Given the lobby screen is displayed, when there are fewer participants than MAX_PARTICIPANTS, then no empty "Slot available" placeholder chips are rendered — only actual participants appear.
- [ ] AC 2: Given the host is in the lobby with a movie selected, when they look at the MovieBriefCard, then a "Change Movie" tertiary button is visible inside the card below the movie metadata.
- [ ] AC 3: Given a non-host participant is in the lobby, when they view the MovieBriefCard, then no "Change Movie" button is visible inside the card.
- [ ] AC 4: Given no movie is selected and the user is the host, when they view the MovieBriefCard, then the card shows "Browse Library" text that navigates to the library when tapped.
- [ ] AC 5: Given the host taps "Change Movie" on the MovieBriefCard, when the library opens, then the `from=lobby` query param is passed so the library knows to return to the lobby.
- [ ] AC 6: Given any participant taps "Cancel Room", when the confirmation overlay appears, then it shows "Cancel this room?" title, "All participants will be disconnected" subtitle, a destructive "Cancel Room" button, and a "Keep Room" dismiss button.
- [ ] AC 7: Given the confirmation overlay is showing, when the user taps "Keep Room", then the overlay dismisses and the user remains in the lobby.
- [ ] AC 8: Given the confirmation overlay is showing, when the user taps "Cancel Room", then the room is left (WS message sent, stores cleared) and the user is navigated home.
- [ ] AC 9: Given the user taps the back arrow in the lobby header, when confirmation overlay appears, then the same Cancel Room confirmation flow is triggered.
- [ ] AC 10: Given the lobby screen on mobile, when the confirmation overlay is shown, then the overlay uses a semi-transparent backdrop and bottom-aligned glassmorphic container matching the design system.
- [ ] AC 11: Given the lobby screen on web, when the confirmation overlay is shown, then the overlay uses a fixed full-screen backdrop with centered glassmorphic container.
- [ ] AC 12: Given the lobby layout, then the visual order from top to bottom is: MovieBriefCard → RoomCodeDisplay → Participants → Movie notification (if any) → Start Movie (host only) → Cancel Room.

## Additional Context

### Dependencies

- No new external libraries required
- All changes are UI-only — no server-side or protocol changes needed
- Depends on existing `roomStore`, `movieStore`, `useWs` infrastructure (all stable, shipped in Epic 2)

### Testing Strategy

- **Manual testing (primary):** These are UI-only changes with no complex logic. Manual verification on both mobile and web:
  - Lobby with 0, 1, 2, 3+ participants — confirm no empty slots render
  - Host view vs guest view — confirm Change Movie visibility
  - Cancel Room flow — confirm dialog appears, "Keep Room" dismisses, "Cancel Room" executes leave
  - Back arrow — confirm triggers same confirmation
  - MovieBriefCard with/without movie — confirm correct text and behavior
- **No new automated tests:** The existing protocol-level tests (`room-lobby.test.ts`) cover the signaling logic. The changes here are purely presentational (removing rendered elements, adding a confirmation gate, moving a button). No component test infrastructure exists in the project for these UI components.

### Notes

- The `ParticipantChip` component's `empty` variant type is preserved but unused — it can be cleaned up in a future pass if desired
- The standalone "Change Movie" / "Browse Library" button block is fully removed from the lobby screen since the MovieBriefCard now handles this
- The confirmation overlay is intentionally simple (no animation, no external modal library) to match the project's "no over-engineering" philosophy
- The layout reorder (Movie card first, then room code) matches the updated UX design specification

## Review Notes
- Adversarial review completed
- Findings: 13 total, 10 fixed, 3 skipped (F5 focus trapping, F7 absolute positioning edge case, F9 layout shift — accepted as-is per project's no-over-engineering philosophy)
- Resolution approach: auto-fix
- Additional change: "Change Movie" button moved to right side of MovieBriefCard per user feedback
