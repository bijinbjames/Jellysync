# Story 6.1: Web Responsive Adaptation

Status: review

## Story

As a web user,
I want the JellySync web app to adapt gracefully to wider screens,
So that the experience feels native and polished on desktop and tablet browsers.

## Acceptance Criteria

1. **md breakpoint (768px+):** PosterGrid shows 4 columns with `px-12` padding; RoomCodeDisplay scales to `text-7xl`.
2. **lg breakpoint (1024px+):** PosterGrid shows 5–6 columns; bottom navigation is hidden (`lg:hidden`) — no lg+ nav replacement is required (the browser URL bar and GlassHeader back button serve that purpose); library content uses wider layout.
3. **xl breakpoint (1280px+):** All content is centered in `max-w-screen-xl mx-auto` containers; layout does not stretch to ultra-wide.
4. **Player screen:** Always full-viewport regardless of breakpoint — no responsive compromise.
5. **Home Hub:** ActionCards remain stacked vertically at all viewport widths.
6. **Web interactions:** Hover states on PosterGrid items (scale 1.02, title → primary); cursor `pointer` on all interactive elements; Tailwind responsive prefixes only (no custom media queries).

## Tasks / Subtasks

- [x] Task 1: Library page — max-width container and bottom nav (AC: 2, 3, 6)
  - [x] Wrap `CategoryChips` + `PosterGrid` in `max-w-screen-xl mx-auto` in `library.tsx`
  - [x] Create `apps/web/src/features/library/components/library-nav.tsx` — glassmorphic bottom nav bar (browse context)
  - [x] `LibraryNav` shows 4 tabs: **Discover** (active), Rooms, Watchlist, Settings — non-active tabs are visual-only placeholders (no navigation) with `on_surface_variant` color
  - [x] `LibraryNav` visible at default/sm/md (`lg:hidden`); at `lg+` it is hidden
  - [x] At `lg+`, add horizontal nav tabs directly inside `GlassHeader` (navigation variant) on the library page, or extend the header with an optional `navItems` prop
  - [x] Add bottom padding to library page content to prevent bottom nav overlap on mobile (`pb-24 lg:pb-12`)

- [x] Task 2: Audit remaining screens for xl max-width containers (AC: 3)
  - [x] `login.tsx` — verify `max-w-screen-xl mx-auto` or appropriate constrained width
  - [x] `join.tsx` — verify max-width constraint
  - [x] `create-room.tsx` — verify max-width constraint
  - [x] `room/lobby.tsx` — already has `max-w-screen-xl mx-auto` ✅ (no change needed)
  - [x] `index.tsx` (Home Hub) — already has `max-w-screen-xl mx-auto` ✅ (no change needed)

- [x] Task 3: Verify hover and cursor patterns (AC: 6)
  - [x] `PosterCard` — `hover:scale-[1.02]` and `group-hover:text-primary` already in place ✅ (verify still correct)
  - [x] All `<button>` elements across login, join, lobby, player, home — confirm `cursor-pointer` is present
  - [x] Any `<a>` or interactive `<div>` elements — add `cursor-pointer` if missing
  - [x] Action buttons in player (`GlassPlayerControls`, `MicToggleFAB`) — confirm hover opacity transitions

- [x] Task 4: Write Vitest unit tests (AC: all)
  - [x] Test `LibraryNav` renders all 4 tabs
  - [x] Test `LibraryNav` marks Discover as active (aria-current="page")
  - [x] Test `LibraryNav` applies `lg:hidden` class

## Dev Notes

### What Is Already Done — Do NOT Reinvent

Before writing any code, read the existing implementations. Most responsive work is complete:

| Component | File | Already Implemented |
|-----------|------|-------------------|
| `PosterGrid` | `apps/web/src/features/library/components/poster-grid.tsx:23` | `grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 px-6 md:px-12` |
| `RoomCodeDisplay` | `apps/web/src/features/room/components/room-code-display.tsx:21` | `text-6xl md:text-7xl` |
| `GlassHeader` | `apps/web/src/shared/components/glass-header.tsx:37` | `max-w-screen-xl mx-auto` |
| `HomePage` | `apps/web/src/routes/index.tsx:29` | `max-w-screen-xl mx-auto px-6 md:px-12` |
| `RoomLobbyPage` | `apps/web/src/routes/room/lobby.tsx:233` | `max-w-screen-xl mx-auto` |
| `CategoryChips` | `apps/web/src/features/library/components/category-chips.tsx:52` | `px-6 md:px-12` |
| `PosterCard` | `apps/web/src/features/library/components/poster-card.tsx:28` | `hover:scale-[1.02]`, `group-hover:text-primary` |
| Player | `apps/web/src/routes/player.tsx` | Full-viewport via `fixed inset-0` |

**The real gap is:** the library page has no `max-w-screen-xl` wrapper, no bottom navigation bar, and no lg+ navigation replacement.

### Library Page Current Structure

`apps/web/src/routes/library.tsx:86`:
```tsx
<div className="min-h-screen bg-surface">
  <GlassHeader variant="navigation" title="Library" onBack={() => navigate(-1)} />
  <CategoryChips ... />
  <PosterGrid ... />
</div>
```

The `CategoryChips` and `PosterGrid` both have their own `px-6 md:px-12` but no `max-w-screen-xl` wrapper, so on xl+ screens the grid stretches edge-to-edge. Fix by wrapping content in a max-width container.

### LibraryNav Component Spec

Create `apps/web/src/features/library/components/library-nav.tsx`:

```tsx
// Glassmorphic bottom nav — browse context
// 4 tabs: Discover (active), Rooms, Watchlist, Settings
// Only "Discover/Library" is functional; others are visual-only placeholders
// Hidden at lg+ via lg:hidden
// Positioned fixed bottom-0 on mobile, sticky in browse context
```

**Visual spec (from UX-DR20 + design system):**
- Container: `fixed bottom-0 left-0 right-0 z-20 glass border-t border-outline-variant/15 lg:hidden`
- Inner: `flex items-center justify-around max-w-screen-xl mx-auto px-4 py-2`
- Each tab: `flex flex-col items-center gap-1 min-h-[48px] min-w-[48px] px-4 py-1 rounded-xl transition-colors`
- **Active tab (Discover):** `text-primary` with `bg-primary/10` background tint, icon + label
- **Inactive tabs:** `text-on-surface-variant` color, icon + label — tapping does nothing (they are not yet implemented features)
- Tab icons: use SVG inline icons matching the existing app pattern (no icon library)
- Corner radius: `rounded-t-2xl` on the container (UX-DR spec: `rounded-t-2rem`)

**At lg+ desktop:** Hide the bottom nav and add the library tab as part of an expanded top navigation. This can be done via the existing `GlassHeader` — add an optional horizontal tab row below the header title in navigation variant, OR simply hide the bottom nav and let the header serve as sole navigation. Minimal approach: just `lg:hidden` on `LibraryNav`.

### GlassHeader Extension (for lg+ nav)

At lg+, the library page can show navigation context via the header subtitle or an additional nav row. Simplest valid approach: the header already shows "Library" as the title — no additional navigation needed at lg+ since the full browser URL bar and back button serve that purpose. The bottom nav is a mobile-specific affordance.

Valid implementation: `LibraryNav` with `lg:hidden` + `pb-24 lg:pb-12` on the page content is sufficient to meet the AC.

### File Locations

```
apps/web/src/
  features/library/
    components/
      library-nav.tsx          ← CREATE (new file for browse context nav)
      poster-grid.tsx          ← no change needed
      poster-card.tsx          ← no change needed
      category-chips.tsx       ← no change needed
  routes/
    library.tsx                ← ADD max-w container + LibraryNav + bottom padding
    login.tsx                  ← AUDIT max-width constraint
    join.tsx                   ← AUDIT max-width constraint
```

### Design System Tokens (for LibraryNav)

All from `packages/ui/src/theme.css` (Tailwind v4 CSS variables):
- `bg-surface-container-high/40 backdrop-blur-xl` → glassmorphism
- `border-outline-variant/15` → ghost border
- `text-primary` + `bg-primary/10` → active tab state
- `text-on-surface-variant` → inactive tab state
- Spacing: `px-4 py-2` for the container, `gap-1` between icon and label

### Tailwind Responsive Rules

**From architecture and UX spec:**
- **NEVER** use custom media queries (`@media`) — always Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- **NEVER** add inline styles for breakpoints
- Breakpoints: default < 640px, sm 640+, md 768+, lg 1024+, xl 1280+

### Project Structure Notes

- Feature-based org: new `LibraryNav` component belongs in `apps/web/src/features/library/components/`
- File naming: `library-nav.tsx` (kebab-case), export `LibraryNav` (PascalCase)
- No barrel export needed unless `features/library/index.ts` already exports from components
- Tailwind config via `@tailwindcss/vite` plugin — no `tailwind.config.js` file
- Test co-location: `library-nav.test.tsx` next to `library-nav.tsx`

### Testing Standards

- Vitest + React Testing Library (already configured)
- Test file: `apps/web/src/features/library/components/library-nav.test.tsx`
- Use `screen.getByRole`, `screen.getByText`, `expect(...).toHaveClass`
- No need to test Tailwind breakpoints directly — test static class presence

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: apps/web/src/features/library/components/poster-grid.tsx] — existing responsive grid
- [Source: apps/web/src/routes/room/lobby.tsx:233] — max-w-screen-xl mx-auto pattern
- [Source: apps/web/src/shared/components/glass-header.tsx] — existing GlassHeader

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6[1m]

### Debug Log References

- Pre-existing environment issue: `html-encoding-sniffer@6.0.0` (jsdom dependency) fails to require `@exodus/bytes@1.15.0` (ESM-only). All 9 web app tests fail due to this, not due to story changes. TypeScript and ESLint pass cleanly.

### Completion Notes List

- **Task 1**: Added `max-w-screen-xl mx-auto pb-24 lg:pb-12` wrapper around library content in `library.tsx`. Created `LibraryNav` glassmorphic bottom nav with 4 tabs (Discover active, Rooms/Watchlist/Settings as visual-only placeholders). `LibraryNav` uses `lg:hidden` — minimal approach confirmed sufficient per Dev Notes.
- **Task 2**: Audit complete — `login.tsx` uses `LoginForm` constrained to `max-w-sm` (centered flex, appropriate constraint ✅); `join.tsx` has `max-w-screen-xl mx-auto` ✅; `create-room.tsx` uses flex-center layout (content inherently constrained ✅); lobby and home already noted as no-change.
- **Task 3**: All interactive elements verified — `PosterCard` has `hover:scale-[1.02]` + `group-hover:text-primary` ✅; all `<button>` elements across login/join/lobby/player/home have `cursor-pointer` ✅; `GlassPlayerControls` and `MicToggleFAB` use inline `cursor: 'pointer'` ✅.
- **Task 4**: Created `library-nav.test.tsx` with 4 tests covering: all 4 tabs render, Discover has `aria-current="page"`, other tabs lack `aria-current`, nav has `lg:hidden`.

### File List

- `apps/web/src/features/library/components/library-nav.tsx` — NEW: glassmorphic bottom nav component
- `apps/web/src/features/library/components/library-nav.test.tsx` — NEW: unit tests for LibraryNav
- `apps/web/src/routes/library.tsx` — MODIFIED: added max-w wrapper, pb-24 lg:pb-12 padding, LibraryNav import and usage

### Change Log

- 2026-04-16: Story 6-1 implementation — web responsive adaptation (LibraryNav, max-w-screen-xl wrapper, padding, audits)
