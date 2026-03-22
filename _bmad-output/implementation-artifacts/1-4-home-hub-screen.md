# Story 1.4: Home Hub Screen

Status: done

## Story

As a user,
I want to see a simple home screen with Create Room and Join Room actions,
So that I can quickly start or join a watch session.

## Acceptance Criteria

1. **Given** the user is logged in **When** the Home Hub screen loads **Then** a GlassHeader (Home variant) displays a personalized greeting ("Hey, {username}") with server connection subtitle in secondary/70 **And** an editorial headline reads "Ready for a Private Screening?" **And** two ActionCard components are displayed: Primary variant "Create Room" (gradient background with glow shadow) and Secondary variant "Join Room" (surface_container_high with ghost border) **And** the Join Room card includes a room code entry field **And** no bottom navigation bar is shown (task-focused navigation context) **And** all interactive elements have 48px minimum touch targets **And** ActionCards respond to press with scale-98 to scale-95 animation **And** UI interactions respond within < 100ms (NFR12)

2. **Given** the user taps the Create Room action card **When** the tap is registered **Then** the user is navigated forward to a placeholder screen (library browser to be implemented in Epic 3)

3. **Given** the user enters a 6-character room code in the Join Room field **When** the user taps Join **Then** the app shows a placeholder response (room joining to be implemented in Epic 2)

## Tasks / Subtasks

- [x] Task 1: Create GlassHeader component for both platforms (AC: #1)
  - [x] 1.1 Create `apps/mobile/src/shared/components/glass-header.tsx` — glassmorphic bar using the existing `glass` utility class (surface/60% opacity + backdrop-blur-xl). Contains left-aligned title/subtitle and optional right-aligned action icons. Home variant: title = "Hey, {username}" (headline-lg, Manrope 700), subtitle = server connection info (label-md, secondary/70 color). Fixed position at top of screen.
  - [x] 1.2 Create `apps/web/src/shared/components/glass-header.tsx` — same component adapted for web using Tailwind classes. Uses the `glass` utility from packages/ui.
  - [x] 1.3 GlassHeader must accept a `variant` prop with at least `home` variant (future: `navigation`, `branded`). Home variant shows personalized greeting and server subtitle.
  - [x] 1.4 Accessibility: title announces current screen context via accessible role. Action buttons have accessible labels.

- [x] Task 2: Create ActionCard component for both platforms (AC: #1, #2, #3)
  - [x] 2.1 Create `apps/mobile/src/shared/components/action-card.tsx` — large tappable container (full-width, `h-64`). Props: `variant` ("primary" | "secondary"), `headline`, `description`, `icon`, `onPress`, `children` (for embedded inputs). Full-card tap area as a single pressable/button element.
  - [x] 2.2 Primary variant (Create Room): `gradient-primary` background (135deg primary -> primary_container), glow shadow (`0 20px 40px rgba(110,233,224,0.15)`), `on_primary` text (use dark text on teal gradient — verify contrast).
  - [x] 2.3 Secondary variant (Join Room): `surface_container_high` (#2a2a2a) background, ghost border (`outline_variant` at 15% opacity via `border border-outline-variant/15`), `on_surface` text.
  - [x] 2.4 States: default (scale-100), hover (icon scales to 110%), pressed (scale-95 via `active:scale-95`), focus ring (`ring-primary`). Use `Pressable` on mobile, `button` on web.
  - [x] 2.5 Create `apps/web/src/shared/components/action-card.tsx` — same design adapted for web.
  - [x] 2.6 Accessibility: card is a single button element with descriptive `accessibilityLabel`/`aria-label` combining headline + description. 48px minimum touch target (card itself exceeds this).

- [x] Task 3: Create CodeInput component for room code entry (AC: #3)
  - [x] 3.1 Create `apps/mobile/src/shared/components/code-input.tsx` — 6-character room code input field. `surface_container_lowest` (#0e0e0e) background, no border, `on_surface` text, monospace or headline font for the code, uppercase auto-transform. Max length 6, `autoCapitalize="characters"`. Include a small "Join" button or submit action when 6 chars entered.
  - [x] 3.2 Create `apps/web/src/shared/components/code-input.tsx` — same for web with `maxLength={6}`, `style={{ textTransform: 'uppercase' }}`.
  - [x] 3.3 The CodeInput must stop event propagation so tapping the input doesn't trigger the parent ActionCard's onPress.
  - [x] 3.4 Placeholder text: "Enter code" in `on_surface_variant` color.

- [x] Task 4: Build Home Hub screen (mobile) (AC: #1, #2, #3)
  - [x] 4.1 Replace the placeholder in `apps/mobile/app/index.tsx` with the full Home Hub layout: mesh gradient or `surface` background, GlassHeader (Home variant) at top, editorial headline "Ready for a Private Screening?" (Manrope 700, headline-lg, `on_surface`), two stacked ActionCards below with `spacing-4` (1.4rem) gap between them.
  - [x] 4.2 Create Room ActionCard: primary variant, headline "Create Room", description text, appropriate icon (e.g., play or add icon). `onPress` navigates to a placeholder screen.
  - [x] 4.3 Join Room ActionCard: secondary variant, headline "Join Room", description text, embeds CodeInput component as children. Join action shows placeholder alert/response for now.
  - [x] 4.4 Layout: ScrollView or safe area view wrapping content. Generous padding (`spacing-6` / 2rem sides, `spacing-8` / 2.75rem between sections). No bottom navigation bar.
  - [x] 4.5 Get `username` and `serverUrl` from auth store (`useStore(authStore, ...)` pattern already established in Story 1.3).

- [x] Task 5: Build Home Hub screen (web) (AC: #1, #2, #3)
  - [x] 5.1 Replace the placeholder in `apps/web/src/routes/index.tsx` with the full Home Hub layout matching mobile design. Use `min-h-screen bg-surface` container.
  - [x] 5.2 Same component structure: GlassHeader, editorial headline, two stacked ActionCards.
  - [x] 5.3 Responsive: ActionCards remain stacked vertically at all sizes. Content container uses `max-w-screen-xl mx-auto` on desktop to prevent ultra-wide stretching. Wider padding on `md+` (`px-12`).
  - [x] 5.4 Create Room `onPress` navigates to placeholder route. Join Room shows placeholder response.
  - [x] 5.5 Get auth state from `authStore` using same pattern as mobile.

- [x] Task 6: Create placeholder screens for navigation targets (AC: #2, #3)
  - [x] 6.1 Create `apps/mobile/app/create-room.tsx` — simple placeholder screen: "Create Room — Coming in Epic 2" with back navigation.
  - [x] 6.2 Create `apps/web/src/routes/create-room.tsx` — same placeholder for web.
  - [x] 6.3 Add routes to existing navigation setup (Expo Router auto-discovers from file, React Router needs route added to `app.tsx`).

- [x] Task 7: Verify and test (AC: #1-3)
  - [x] 7.1 Run `pnpm build` — no errors across all workspaces
  - [x] 7.2 Run `pnpm test` — all tests pass (existing + any new)
  - [x] 7.3 Run `pnpm lint` — no lint errors
  - [x] 7.4 Visual verification mobile: login -> home hub shows GlassHeader with greeting, editorial headline, Create Room card (gradient), Join Room card (with code input), no bottom nav
  - [x] 7.5 Visual verification web: same layout, responsive behavior, cards stacked at all sizes
  - [x] 7.6 Verify Create Room tap navigates to placeholder
  - [x] 7.7 Verify code input accepts 6 chars and shows placeholder response
  - [x] 7.8 Verify ActionCard press animations (scale-95 on press)
  - [x] 7.9 Verify all interactive elements meet 48px touch target minimum

## Dev Notes

### Architecture Compliance

- **Navigation context:** Home Hub uses task-focused navigation — NO bottom navigation bar. This is shared with Login and Join Room screens.
- **Auth gate:** Home Hub is only accessible to authenticated users. Auth gate already implemented in Story 1.3 (root layout redirects unauthenticated users to /login).
- **State access:** Use `useStore(authStore, selector)` pattern from Story 1.3. The `authStore` is imported from `apps/[mobile|web]/src/lib/auth.ts` (platform-specific store instances wrapping the shared `createAuthStore`).
- **Shared components location:** New shared components (GlassHeader, ActionCard, CodeInput) go in `apps/[mobile|web]/src/shared/components/` — NOT in `packages/ui` (which only holds tokens and CSS utilities, no React components).
- **No TanStack Query needed** for this story — no Jellyfin API calls on the Home Hub. Auth store data is sufficient.
- **Placeholder navigation only** — Create Room leads to placeholder (Epic 2/3), Join Room code entry shows placeholder response (Epic 2). Do NOT implement actual room creation or joining logic.

### Design Token Reference

All tokens are defined in `packages/ui/src/theme.css` and available as Tailwind classes:

| Token | CSS Variable | Tailwind Class | Value |
|-------|-------------|----------------|-------|
| Primary | `--color-primary` | `text-primary`, `bg-primary` | #6ee9e0 |
| Primary Container | `--color-primary-container` | `bg-primary-container` | #4ecdc4 |
| Secondary | `--color-secondary` | `text-secondary` | #c8bfff |
| Surface | `--color-surface` | `bg-surface` | #131313 |
| Surface Container High | `--color-surface-container-high` | `bg-surface-container-high` | #2a2a2a |
| Surface Container Lowest | `--color-surface-container-lowest` | `bg-surface-container-lowest` | #0e0e0e |
| On Surface | `--color-on-surface` | `text-on-surface` | #e5e2e1 |
| On Surface Variant | `--color-on-surface-variant` | `text-on-surface-variant` | #bcc9c7 |
| Outline Variant | `--color-outline-variant` | `border-outline-variant` | #3d4948 |
| Error | `--color-error` | `text-error` | #ffb4ab |

**Utility classes (packages/ui/src/utilities.css):**
- `.glass` — `background: rgba(32,31,31,0.6); backdrop-filter: blur(20px); border: 1px solid rgba(61,73,72,0.15);`
- `.gradient-primary` — `background: linear-gradient(135deg, #6ee9e0, #4ecdc4);`

**Typography:**
- Display font: `font-display` (Manrope)
- Body font: `font-body` (Inter)
- Headlines: Manrope 700-800, tight negative letter-spacing (-0.02em)
- Labels: Inter 500-600, uppercase, wide tracking (0.2em)

**Spacing:**
- `spacing-1` = 0.25rem, `spacing-2` = 0.5rem, `spacing-3` = 1rem
- `spacing-4` = 1.4rem (standard gutter), `spacing-6` = 2rem, `spacing-8` = 2.75rem, `spacing-12` = 4rem

**Corner Radius:**
- `rounded-lg` = 2rem, `rounded-md` = 1.5rem, `rounded-full` = 9999px

### GlassHeader Component Specification

- **Styling:** Apply the `glass` utility class for glassmorphism effect (surface at 60% opacity + backdrop-blur)
- **Home variant layout:**
  - Left side: "Hey, {username}" as title (Manrope 700, `text-on-surface`, headline size)
  - Below title: Server URL or "Connected to {serverUrl}" as subtitle (`text-secondary` at 70% opacity — use `text-secondary/70` or `opacity-70`)
  - Right side: Reserved for future action icons (leave empty for now)
- **Position:** Fixed/sticky at top. Content scrolls behind with blur effect visible.
- **Height:** Enough to contain title + subtitle with comfortable padding

### ActionCard Component Specification

- **Size:** Full-width, `h-64` (16rem) height
- **Primary variant (Create Room):**
  - Background: Apply `gradient-primary` utility (135deg from #6ee9e0 to #4ecdc4)
  - Text: Dark text on gradient (ensure WCAG AA contrast — use `text-surface` or `text-surface-container-lowest` for dark text on teal)
  - Glow shadow: `shadow-[0_20px_40px_rgba(110,233,224,0.15)]` (ambient teal glow)
  - Optional: Large decorative background icon at low opacity (120px, opacity ~10%)
- **Secondary variant (Join Room):**
  - Background: `bg-surface-container-high` (#2a2a2a)
  - Border: `border border-outline-variant/15` (ghost border)
  - Text: `text-on-surface` (#e5e2e1)
- **Press interaction:**
  - Mobile: Use `Pressable` with `onPressIn` scale to 0.95, `onPressOut` scale back to 1.0 via `Animated.Value` or `useAnimatedStyle` (react-native-reanimated if available, or RN Animated API)
  - Web: CSS `active:scale-95 transition-transform duration-150`
- **Content layout:** Icon badge + headline + description, vertically arranged with generous internal padding

### Responsive Design Rules

- ActionCards remain **stacked vertically at ALL breakpoints** — do NOT make them side-by-side
- Default (mobile): full-width cards, `px-6` padding
- `md+` (768px+): wider content padding `px-12`
- `lg+` (1024px+): `max-w-screen-xl mx-auto` content container
- `xl+` (1280px+): centered max-width layout with generous margins

### What NOT To Do

- Do NOT create a bottom navigation bar — Home Hub is task-focused context
- Do NOT implement actual room creation or WebSocket connections — placeholder only (Epic 2)
- Do NOT implement library browsing — placeholder only (Epic 3)
- Do NOT implement logout UI — that's Story 1.5
- Do NOT put components in `packages/ui` — it only holds tokens/CSS, not React components
- Do NOT use pure `#FFFFFF` for text — lightest text is `on_surface` (#e5e2e1)
- Do NOT use `1px solid` borders — use ghost borders (`outline_variant` at 15% opacity) or tonal shifts
- Do NOT use modals, toasts, or alert dialogs — inline feedback only
- Do NOT add a loading spinner/screen for navigation — show destination immediately
- Do NOT modify existing auth flow, Zustand store, or Jellyfin client code from Story 1.3
- Do NOT install new dependencies unless absolutely necessary — NativeWind, Tailwind, Zustand, Expo Router, React Router are all already installed

### File Naming & Code Conventions

- All source files: `kebab-case.ts` / `kebab-case.tsx`
- React components: PascalCase exports (e.g., `glass-header.tsx` exports `GlassHeader`)
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: PascalCase
- Test files: co-located (`component.test.tsx` next to `component.tsx`)

### Project Structure Notes

Files to create/modify:

```
apps/mobile/
  app/
    index.tsx              # MODIFY: Replace placeholder with full Home Hub
    create-room.tsx        # NEW: Placeholder screen for Create Room navigation
  src/
    shared/
      components/
        glass-header.tsx   # NEW: GlassHeader component (Home variant)
        action-card.tsx    # NEW: ActionCard component (Primary/Secondary variants)
        code-input.tsx     # NEW: 6-char room code input

apps/web/
  src/
    routes/
      index.tsx            # MODIFY: Replace placeholder with full Home Hub
      create-room.tsx      # NEW: Placeholder screen for Create Room navigation
    shared/
      components/
        glass-header.tsx   # NEW: GlassHeader component (Home variant)
        action-card.tsx    # NEW: ActionCard component (Primary/Secondary variants)
        code-input.tsx     # NEW: 6-char room code input
    app.tsx                # MODIFY: Add create-room route
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md -- Epic 1, Story 1.4 acceptance criteria]
- [Source: _bmad-output/planning-artifacts/architecture.md -- Navigation contexts, Zustand store patterns, Code structure, FR31-FR32 file mapping, shared component locations]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md -- Home Hub screen, GlassHeader component (UX-DR6), ActionCard component (UX-DR7), task-focused navigation (UX-DR20), responsive breakpoints (UX-DR21), accessibility (UX-DR22), button hierarchy, design tokens]
- [Source: _bmad-output/planning-artifacts/prd.md -- FR31 (two primary actions on home), FR32 (room code entry from home), NFR11 (launch to home < 2s), NFR12 (UI interactions < 100ms)]

### Previous Story Intelligence (Story 1.3)

**Key learnings from Story 1.3:**
- Auth store pattern: `createAuthStore(storage)` in packages/shared, platform-specific instances in `apps/[mobile|web]/src/lib/auth.ts` exported as `authStore`. Access with `useStore(authStore, selector)`.
- Auth store exposes: `serverUrl`, `token`, `userId`, `username`, `isAuthenticated`, `isLoading`, `isHydrated`
- Navigation already works: Expo Router file-based routing (mobile), React Router with `app.tsx` route definitions (web)
- Auth gate in root layout: redirects to `/login` if not authenticated, shows home if authenticated
- `apps/mobile/app/index.tsx` and `apps/web/src/routes/index.tsx` currently have placeholder "Home Hub — Welcome, {username}" text — these are the files to modify
- Web routes are defined in `apps/web/src/app.tsx` — new routes (create-room) must be added there
- Mobile routes auto-discovered by Expo Router from `apps/mobile/app/` directory — just create the file
- NativeWind v5 is configured — use `className` prop on RN components directly
- Tailwind CSS v4 on web — standard `className` usage
- Design tokens available as Tailwind classes: `bg-surface`, `text-on-surface`, `text-primary`, `text-secondary`, `bg-surface-container-high`, etc.
- Glass utility: `className="glass"` for glassmorphism effect
- Gradient utility: `className="gradient-primary"` for primary gradient
- Fonts loaded: Manrope (`font-display`), Inter (`font-body`)
- 14 unit tests + existing tests all passing (30 total)
- All builds (`pnpm build`), tests (`pnpm test`), and lint (`pnpm lint`) pass

**What Story 1.3 established that this story builds on:**
- The home hub placeholder screens that need to be replaced
- The auth store integration pattern for accessing user data
- The navigation architecture for both platforms
- The design system infrastructure (tokens, utilities, fonts)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed TS6133 unused variant parameter in GlassHeader by using props object destructuring pattern
- Fixed unused View import in mobile CodeInput component
- Pre-existing lint errors in tailwind.config.js (module/require in ESM context) not addressed — not part of this story

### Completion Notes List

- Created GlassHeader component (mobile + web) with glassmorphism effect, personalized greeting, server connection subtitle, variant prop for future extensibility
- Created ActionCard component (mobile + web) with primary (gradient) and secondary (surface) variants, press animations (Animated.spring on mobile, CSS active:scale-95 on web), glow shadow on primary variant, accessibility labels
- Created CodeInput component (mobile + web) with 6-char uppercase room code entry, event propagation stopping, inline Join button that enables at 6 chars
- Built Home Hub screen (mobile) replacing placeholder — GlassHeader, editorial headline, two stacked ActionCards, ScrollView layout, auth store integration
- Built Home Hub screen (web) replacing placeholder — same structure adapted for web, responsive max-width container, sticky glass header
- Created placeholder Create Room screen for both platforms with back navigation
- Added /create-room route to web app.tsx with AuthGuard
- All builds pass (`pnpm build`), all 30 tests pass (`pnpm test`), web lint clean, mobile lint only has pre-existing tailwind.config.js issues

### Change Log

- 2026-03-22: Implemented Home Hub Screen (Story 1.4) — GlassHeader, ActionCard, CodeInput components for both platforms, Home Hub screens, placeholder navigation screens

### File List

New files:
- apps/mobile/src/shared/components/glass-header.tsx
- apps/mobile/src/shared/components/action-card.tsx
- apps/mobile/src/shared/components/code-input.tsx
- apps/mobile/app/create-room.tsx
- apps/web/src/shared/components/glass-header.tsx
- apps/web/src/shared/components/action-card.tsx
- apps/web/src/shared/components/code-input.tsx
- apps/web/src/routes/create-room.tsx

Modified files:
- apps/mobile/app/index.tsx
- apps/web/src/routes/index.tsx
- apps/web/src/app.tsx
- _bmad-output/implementation-artifacts/sprint-status.yaml
