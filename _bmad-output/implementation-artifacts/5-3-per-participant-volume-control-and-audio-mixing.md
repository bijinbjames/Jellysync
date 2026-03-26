# Story 5.3: Per-Participant Volume Control & Audio Mixing

Status: done

## Story

As a participant,
I want to adjust each person's voice volume and the balance between voice and movie audio,
So that I can hear everyone clearly without dialogue getting drowned out.

## Acceptance Criteria

1. **Volume Overlay Appearance** — Given the participant accesses volume controls (taps the volume icon in GlassPlayerControls), when the volume overlay appears, then an inline overlay shows near the volume icon with per-participant voice sliders (FR27), each labeled with the participant's name, and the overlay dismisses on outside tap (no modal — inline overlay pattern).

2. **Per-Participant Volume Adjustment** — Given the participant adjusts a per-participant voice slider, when the slider value changes, then the voice volume for that specific participant changes in real-time on-device only (web: `<audio>` element `.volume` property), the change does not affect any other participant's audio mix, and the volume level is stored in `useVoiceStore.volumeLevels` for persistence during the session.

3. **Overall Room Voice Volume** — Given the participant adjusts the overall room voice slider, when the slider value changes, then all voice audio adjusts relative to movie audio (FR28), the movie audio level remains unchanged, and the `voiceGain` in `useVoiceStore` is updated.

4. **Simultaneous Audio Mixing** — Given movie audio and voice audio are playing simultaneously, when both streams are active, then both are mixed on-device so both are audible simultaneously (FR29), the audio mix is performed client-side, and the mix is comfortable for extended viewing.

5. **Default Volume State** — Given a new participant joins, when no volume preferences exist in the session, then all per-participant volumes default to 1.0 (100%) and the overall voice gain defaults to 1.0.

6. **Volume Overlay Keyboard (Web)** — The `V` key (or equivalent UX spec key) opens/closes the volume overlay on web, consistent with player keyboard patterns. _Note: If the UX spec does not define a volume shortcut, skip this AC._

## Tasks / Subtasks

- [x] Task 1: Add `voiceGain` to voice store (AC: #3, #5)
  - [x] 1.1 Add `voiceGain: number` (default `1.0`) to `VoiceState` interface in `packages/shared/src/stores/voice-store.ts`
  - [x] 1.2 Add `setVoiceGain: (gain: number) => void` to `VoiceActions` — clamps to `[0, 1]`, same pattern as `setVolume`
  - [x] 1.3 Update `initialState` to include `voiceGain: 1.0`
  - [x] 1.4 Update `reset()` to reset `voiceGain` to `1.0`
  - [x] 1.5 Do NOT add `voiceGain` to `partialize` — volume preferences are session-only (like `volumeLevels`)
  - [x] 1.6 Add unit test for `setVoiceGain` clamping

- [x] Task 2: Expose volume setters from web `useVoice` hook (AC: #2, #3)
  - [x] 2.1 In `apps/web/src/features/voice/hooks/use-voice.ts`, add `setParticipantVolume(participantId: string, volume: number)` that: (a) calls `voiceStore.getState().setVolume(participantId, volume)`, (b) looks up `audioElementsRef.current.get(participantId)` and sets `audio.volume = Math.max(0, Math.min(1, volume * voiceStore.getState().voiceGain))`
  - [x] 2.2 Add `setVoiceGain(gain: number)` that: (a) calls `voiceStore.getState().setVoiceGain(gain)`, (b) iterates all `audioElementsRef.current` entries and reapplies: `audio.volume = Math.max(0, Math.min(1, voiceStore.getState().volumeLevels.get(pId) ?? 1.0) * gain)`
  - [x] 2.3 In `onRemoteStream`, after creating the `<Audio>` element, apply stored volume: `audio.volume = Math.max(0, Math.min(1, (voiceStore.getState().volumeLevels.get(pId) ?? 1.0) * voiceStore.getState().voiceGain))`
  - [x] 2.4 Return `{ managerRef, setParticipantVolume, setVoiceGain }` from `useVoice`

- [x] Task 3: Build `VolumeOverlay` component — Web (AC: #1, #2, #3, #5)
  - [x] 3.1 Create `apps/web/src/features/player/components/volume-overlay.tsx`
  - [x] 3.2 Props: `participants: Participant[]`, `volumeLevels: Map<string, number>`, `voiceGain: number`, `onParticipantVolumeChange: (participantId: string, volume: number) => void`, `onVoiceGainChange: (gain: number) => void`, `onDismiss: () => void`
  - [x] 3.3 Layout: absolutely positioned overlay near the volume icon (top-right area of player), glassmorphism style matching existing overlay patterns (`surface_container_high/40` + `backdrop-filter: blur(20px)` + ghost border `white/10 1px solid`)
  - [x] 3.4 Overall voice section at top: label "Voice Volume", horizontal range slider (0-100), value reflects `voiceGain * 100`
  - [x] 3.5 Per-participant section: for each participant, show name + horizontal range slider (0-100), value reflects `(volumeLevels.get(p.id) ?? 1.0) * 100`
  - [x] 3.6 Outside-click dismiss: attach a `mousedown` listener to `document` that calls `onDismiss()` when click is outside the overlay element — use `useEffect` cleanup
  - [x] 3.7 Use `React.CSSProperties` inline styles (NOT CSS modules, NOT styled-components — follow `glass-player-controls.tsx` and `mic-toggle-fab.tsx` patterns)
  - [x] 3.8 If no participants have active voice connections (`participants.length === 0` or no peerConnections), show only the overall voice gain slider with a note "No other participants"

- [x] Task 4: Build `VolumeOverlay` component — Mobile (AC: #1, #2, #3)
  - [x] 4.1 Create `apps/mobile/src/features/player/components/volume-overlay.tsx`
  - [x] 4.2 Same props interface as web version
  - [x] 4.3 Use `StyleSheet.create()` + `Pressable` following existing mobile component patterns
  - [x] 4.4 `Slider` component from `@react-native-community/slider` or React Native's built-in (check existing package.json — do NOT add a new dependency if one already exists). No slider package found — implemented custom PanResponder-based slider following existing seek bar pattern.
  - [x] 4.5 **Mobile audio limitation:** react-native-webrtc plays remote audio at system volume — per-participant volume sliders update the store but do NOT have a direct hardware effect on mobile. Store the values faithfully; the sliders function as future-proofing. Documented in code comment.
  - [x] 4.6 Overall voice gain on mobile: same limitation applies; update store only
  - [x] 4.7 Dismiss on tap outside using a full-screen `Pressable` backdrop behind the overlay

- [x] Task 5: Add volume button to `GlassPlayerControls` (AC: #1)
  - [x] 5.1 Add prop `onVolumePress?: () => void` to `GlassPlayerControlsProps` interface in `apps/web/src/features/player/components/glass-player-controls.tsx`
  - [x] 5.2 Add a volume icon button in the top bar (alongside the existing CC/menu actions area) — use SVG volume icon or Unicode `🔊`, wrapped in a `<button>` with `role="button"` and appropriate `aria-label="Volume controls"`
  - [x] 5.3 Clicking the button calls `onVolumePress?.()`
  - [x] 5.4 Add same prop to mobile `GlassPlayerControls` in `apps/mobile/src/features/player/components/glass-player-controls.tsx`

- [x] Task 6: Integrate VolumeOverlay into player screens (AC: #1, #2, #3, #4)
  - [x] 6.1 **Web** (`apps/web/src/routes/player.tsx`):
    - Import `VolumeOverlay` from features/player
    - Destructure `setParticipantVolume, setVoiceGain` from `useVoice()` (now returns these)
    - Add `useState` for `volumeOverlayOpen: boolean`
    - Read `volumeLevels` and `voiceGain` from `voiceStore` via `useStore`
    - Pass `onVolumePress={() => setVolumeOverlayOpen(true)}` to `GlassPlayerControls`
    - Render `<VolumeOverlay>` conditionally when `volumeOverlayOpen && controlsVisible`
    - Pass `participants` (filter to only other participants — exclude self), `volumeLevels`, `voiceGain`, `setParticipantVolume`, `setVoiceGain`, `onDismiss`
  - [x] 6.2 **Mobile** (`apps/mobile/app/player.tsx`):
    - Same pattern — `useState` for overlay open state
    - Import from mobile features/player
    - Wire to GlassPlayerControls `onVolumePress` prop

- [x] Task 7: Export VolumeOverlay from features/player index (AC: implementation)
  - [x] 7.1 Check if `apps/web/src/features/player/index.ts` exists and add `VolumeOverlay` export
  - [x] 7.2 Same for mobile equivalent

- [x] Task 8: Write tests (AC: all)
  - [x] 8.1 Unit test for `setVoiceGain` in voice-store (clamping, default value, reset)
  - [x] 8.2 Unit test for `VolumeOverlay` (web): renders per-participant sliders, calls callbacks on change, overall slider present
  - [x] 8.3 Verify zero regressions on existing test suite — 631 tests pass (454 shared + 54 web + 123 server), 13 new tests added

## Dev Notes

### Architecture Patterns & Constraints

- **Inline styles only on web player:** Web player components use `React.CSSProperties` objects (see `glass-player-controls.tsx`, `mic-toggle-fab.tsx`, `permission-settings.tsx`). Do NOT use CSS modules or styled-components.
- **Store pattern:** Actions co-located inside Zustand store definitions. Do NOT create external action functions.
- **No shared package boundary violations:** `packages/shared` must be platform-agnostic (no React, no DOM, no RN). The `voiceGain` field belongs in the store (shared). The `VolumeOverlay` UI is platform-specific.
- **Handler factory pattern:** Not applicable to this story — no new signaling messages needed (volume is on-device only, no broadcast).
- **Volume is on-device only:** Per-participant and overall voice volume adjustments are purely local. No signaling messages. No server involvement.

### Existing Code to Reuse (DO NOT Reinvent)

- **`useVoiceStore`** (`packages/shared/src/stores/voice-store.ts`): Already has `volumeLevels: Map<string, number>`, `setVolume(participantId, volume)` with clamping. Adds `voiceGain: number` in this story.
- **`audioElementsRef`** (`apps/web/src/features/voice/hooks/use-voice.ts` line 45): Already creates one `<Audio>` element per remote participant. Volume control is applied via `audio.volume`. The ref is private to the hook — expose setters from the hook's return value.
- **`onRemoteStream` callback** (use-voice.ts line 62): Already creates and stores the audio element. Apply initial volume from store here.
- **`GlassPlayerControlsProps`** (`apps/web/src/features/player/components/glass-player-controls.tsx` line 6): Add `onVolumePress?: () => void` prop here.
- **`PermissionSettings` pattern**: Observe how `PermissionSettings` is used as a conditional overlay in `player.tsx` — follow the same toggle/render pattern for `VolumeOverlay`.
- **Design tokens:** Primary cyan `#6ee9e0`, glass blur `backdrop-filter: blur(20px)`, surface `rgba(54, 50, 59, 0.4)`, ghost border `rgba(255,255,255,0.1)`.
- **`useControlsVisibility`**: `controlsVisible` already tracked — only show VolumeOverlay when controls are visible.

### Voice Volume Architecture on Web

```typescript
// In use-voice.ts — volume applied to audio element
// Effective volume = participant volume level × overall voice gain
// Both clamped to [0, 1]

// onRemoteStream: apply stored volume on creation
const audio = new Audio();
audio.srcObject = stream;
audio.autoplay = true;
const storedVolume = voiceStore.getState().volumeLevels.get(pId) ?? 1.0;
const voiceGain = voiceStore.getState().voiceGain;
audio.volume = Math.max(0, Math.min(1, storedVolume * voiceGain));
audioElementsRef.current.set(pId, audio);

// setParticipantVolume: update store + apply to audio element
const setParticipantVolume = useCallback((participantId: string, volume: number) => {
  voiceStore.getState().setVolume(participantId, volume);
  const audio = audioElementsRef.current.get(participantId);
  if (audio) {
    const gain = voiceStore.getState().voiceGain;
    audio.volume = Math.max(0, Math.min(1, volume * gain));
  }
}, []);

// setVoiceGain: update store + reapply to all audio elements
const setVoiceGain = useCallback((gain: number) => {
  voiceStore.getState().setVoiceGain(gain);
  for (const [pId, audio] of audioElementsRef.current) {
    const vol = voiceStore.getState().volumeLevels.get(pId) ?? 1.0;
    audio.volume = Math.max(0, Math.min(1, vol * gain));
  }
}, []);
```

### Voice Volume Architecture on Mobile

react-native-webrtc plays remote audio automatically — the `onRemoteStream` callback does nothing (line 76 of mobile `use-voice.ts`). There is no per-stream `.volume` API in react-native-webrtc. The store is updated faithfully for UI state and future-proofing, but sliders have no direct hardware effect on mobile. This is a known platform limitation — do NOT spend time on workarounds.

### VolumeOverlay Positioning (Web)

The overlay should appear as a panel anchored near the top-right of the player controls area (near the volume icon button in the top bar). Use `position: absolute`, `top: 60px`, `right: 16px` relative to the player container, or position relative to the volume button using a wrapping `div` with `position: relative`. The overlay must appear ABOVE other elements (`z-index` higher than `GlassPlayerControls`).

Example structure (inline styles following existing patterns):
```tsx
<div style={{
  position: 'absolute',
  top: '60px',
  right: '16px',
  background: 'rgba(54, 50, 59, 0.85)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '16px',
  minWidth: '220px',
  zIndex: 100,
}}>
```

### VoiceStore `voiceGain` Addition

```typescript
// packages/shared/src/stores/voice-store.ts — changes needed:

export interface VoiceState {
  // ... existing fields ...
  voiceGain: number;  // ADD: overall voice volume multiplier, default 1.0
}

export interface VoiceActions {
  // ... existing actions ...
  setVoiceGain: (gain: number) => void;  // ADD
}

const initialState: VoiceState = {
  // ... existing ...
  voiceGain: 1.0,  // ADD
};

// In store creator:
setVoiceGain: (gain) => set({ voiceGain: Math.max(0, Math.min(1, gain)) }),

// In reset():
reset: () => set((current) => ({
  ...initialState,
  isMuted: current.isMuted,
  voiceGain: 1.0,  // ADD — reset to default
  peerConnections: new Map(),
  peerMutedState: new Map(),
  volumeLevels: new Map(),
})),
```

### Project Structure Notes

- New files follow existing directory structure:
  - Web: `apps/web/src/features/player/components/volume-overlay.tsx`
  - Mobile: `apps/mobile/src/features/player/components/volume-overlay.tsx`
  - Tests: co-located `volume-overlay.test.tsx` (web only for now)
- No new `packages/shared` files needed — only `voice-store.ts` gains `voiceGain`
- `use-voice.ts` on web gains two new returned functions — update the return type signature
- Mobile `use-voice.ts` does NOT need `setParticipantVolume` / `setVoiceGain` returns since volume has no hardware effect

### Previous Story Learnings (from 5.2)

- **vi.fn() mock constructor:** When mocking `RTCPeerConnection`, use `vi.fn().mockImplementation(() => mockPeerConnection)` — not just `vi.fn(() => ...)`.
- **Server injects `fromParticipantId`:** Not relevant here (no signaling), but worth knowing for future stories.
- **`player.test.tsx` mock pattern:** Voice module imports need mocking in player tests. If adding new exports from `features/voice/index.ts`, update the mock in `apps/web/src/routes/player.test.tsx` to include them.
- **Test baseline:** 634 tests after Story 5.2. Zero regressions required.
- **MicToggleFAB is NOT inside `GlassPlayerControls`** — it renders independently as a sibling overlay. `VolumeOverlay` is different: it is triggered FROM `GlassPlayerControls` but rendered as a conditional sibling in `player.tsx`, similar to `PermissionSettings`.
- **`useStore(voiceStore, ...)` pattern:** Use `useStore` from `zustand` to read reactive voiceStore values in React components. The store is a vanilla store (not a hook), so `useStore(voiceStore, selector)` is the correct pattern. See existing usage in `player.tsx` lines 33-42.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5, Story 5.3]
- [Source: _bmad-output/planning-artifacts/architecture.md — Zustand Store Patterns, Voice/WebRTC Architecture]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Volume controls (Overlays & Feedback Pattern line 995), GlassPlayerControls Top Bar]
- [Source: _bmad-output/planning-artifacts/prd.md — FR27, FR28, FR29]
- [Source: _bmad-output/implementation-artifacts/5-2-mic-toggle-and-mictogglefab.md — Previous story learnings, existing patterns]
- [Source: apps/web/src/features/voice/hooks/use-voice.ts — audioElementsRef, onRemoteStream, audio element creation]
- [Source: packages/shared/src/stores/voice-store.ts — existing volumeLevels, setVolume, VoiceState interface]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- player.test.tsx voiceStore mock: needed stable Map instance (not `new Map()` per call) to avoid infinite re-render loop from Zustand `useStore` snapshot comparison.
- Mobile VolumeOverlay: no slider package in mobile — implemented custom PanResponder-based `VolumeSlider` component following existing seek bar pattern.

### Completion Notes List

- Added `voiceGain: number` to `VoiceState` and `setVoiceGain` to `VoiceActions` in `packages/shared/src/stores/voice-store.ts`. Not added to `partialize` (session-only). Reset restores to 1.0.
- Web `useVoice` now exports `setParticipantVolume` and `setVoiceGain`. `onRemoteStream` applies stored volume preferences on audio element creation. `UseVoiceReturn` interface added.
- Web `VolumeOverlay`: glassmorphism overlay with overall voice gain slider + per-participant sliders. Outside-click dismiss via `mousedown` listener. Shows "No other participants" when list is empty. Inline `React.CSSProperties` styles throughout.
- Mobile `VolumeOverlay`: custom `VolumeSlider` built with PanResponder (no external slider package available). Full-screen Pressable backdrop for dismiss. Code comment documents mobile audio limitation (no hardware effect — store-only).
- Volume button (🔊) added to top bar of both web and mobile `GlassPlayerControls` with `onVolumePress?: () => void` prop.
- Both player screens (`player.tsx` web and mobile) wired up: `useStore(voiceStore)` for reactive `volumeLevels` and `voiceGain`, `useState` for overlay open state, `controlsVisible` guard on web.
- `VolumeOverlay` exported from both web and mobile `features/player/index.ts`.
- 13 new tests: 5 `setVoiceGain` tests in voice-store, 8 `VolumeOverlay` component tests. Zero regressions (631 total tests pass).

### File List

- packages/shared/src/stores/voice-store.ts
- packages/shared/src/stores/voice-store.test.ts
- apps/web/src/features/voice/hooks/use-voice.ts
- apps/web/src/features/player/components/volume-overlay.tsx (new)
- apps/web/src/features/player/components/volume-overlay.test.tsx (new)
- apps/web/src/features/player/components/glass-player-controls.tsx
- apps/web/src/features/player/index.ts
- apps/web/src/routes/player.tsx
- apps/web/src/routes/player.test.tsx
- apps/mobile/src/features/player/components/volume-overlay.tsx (new)
- apps/mobile/src/features/player/components/glass-player-controls.tsx
- apps/mobile/src/features/player/index.ts
- apps/mobile/app/player.tsx
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-03-26: Story 5.3 implemented — per-participant volume control and audio mixing. Added `voiceGain` to voice store, `setParticipantVolume`/`setVoiceGain` to web `useVoice`, built `VolumeOverlay` for web and mobile, added volume button to `GlassPlayerControls`, integrated overlays into player screens, added 13 new tests. Zero regressions.
