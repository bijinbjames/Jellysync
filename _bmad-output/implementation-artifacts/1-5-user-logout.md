# Story 1.5: User Logout

Status: review

## Story

As a user,
I want to log out of JellySync,
So that I can switch accounts or secure my session on a shared device.

## Acceptance Criteria

1. **Given** the user is logged in and on the Home Hub screen **When** the user taps the logout icon in the GlassHeader **Then** a confirmation is NOT shown (per UX-DR19: no modals for expected outcomes) **And** the auth token is removed from platform secure storage **And** useAuthStore is cleared (serverUrl, token, userId, username all null, isAuthenticated false) **And** the user is navigated to the Login screen **And** subsequent app restarts show the Login screen instead of Home Hub

2. **Given** the user triggers logout **When** the auth store is cleared **Then** any active WebSocket connections are closed (currently none exist — but the logout action must be extensible for Epic 2 when WebSocket connections are added)

3. **Given** the user has logged out **When** they reopen the app **Then** the Login screen is displayed (Zustand persist middleware has removed stored auth from secure storage) **And** no cached user data remains accessible

## Tasks / Subtasks

- [x] Task 1: Add logout action to GlassHeader on both platforms (AC: #1)
  - [x] 1.1 Update `apps/mobile/src/shared/components/glass-header.tsx` — add optional `onAction` prop and `actionIcon` prop. For `home` variant, render a logout icon button (e.g., `log-out` icon or `exit-to-app` style icon) in the right side of the header's flex-row. Use `Pressable` with `accessibilityLabel="Log out"`, 48px touch target, `text-on-surface-variant` color.
  - [x] 1.2 Update `apps/web/src/shared/components/glass-header.tsx` — same approach: add optional `onAction`/`actionIcon` props. Render a logout `<button>` in the right side of the flex container. Use `aria-label="Log out"`, focus ring (`focus:ring-primary`), `text-on-surface-variant` hover to `text-on-surface`.

- [x] Task 2: Wire logout into Home Hub screen (mobile) (AC: #1, #2)
  - [x] 2.1 In `apps/mobile/app/index.tsx`, import `authStore` and get the `logout` action via `useStore(authStore, (s) => s.logout)`.
  - [x] 2.2 Pass `onAction={logout}` and `actionIcon="logout"` to the GlassHeader component.
  - [x] 2.3 Verify that calling `logout()` triggers the auth gate in `_layout.tsx` to redirect to `/login` automatically (no explicit navigation needed — the AuthGate already redirects when `isAuthenticated` becomes false).

- [x] Task 3: Wire logout into Home Hub screen (web) (AC: #1, #2)
  - [x] 3.1 In `apps/web/src/routes/index.tsx`, import `authStore` and get the `logout` action.
  - [x] 3.2 Pass `onAction={logout}` to the GlassHeader component.
  - [x] 3.3 Verify that calling `logout()` triggers `AuthGuard` in `app.tsx` to redirect to `/login` automatically via React Router `<Navigate>`.

- [x] Task 4: Verify storage cleanup (AC: #1, #3)
  - [x] 4.1 Confirm that calling `authStore.logout()` triggers Zustand persist middleware to call `storage.removeItem('jellysync-auth')` — clearing expo-secure-store on mobile and localStorage on web. No additional storage cleanup code should be needed.
  - [x] 4.2 Manually test: log in, close app, reopen (should go to Home Hub). Log out, close app, reopen (should go to Login).

- [x] Task 5: Verify and test (AC: #1-3)
  - [x] 5.1 Run `pnpm build` — no errors across all workspaces
  - [x] 5.2 Run `pnpm test` — all existing tests pass
  - [x] 5.3 Run `pnpm lint` — no new lint errors
  - [x] 5.4 Visual verification mobile: Home Hub shows logout icon in GlassHeader, tapping it navigates to Login
  - [x] 5.5 Visual verification web: same behavior, logout button visible in GlassHeader, redirects to Login
  - [x] 5.6 Verify re-login works correctly after logout (login -> Home Hub with correct username)
  - [x] 5.7 Verify app restart after logout shows Login screen (persistent storage cleared)

## Dev Notes

### Architecture Compliance

- **Logout action already exists:** `packages/shared/src/stores/auth-store.ts` line 78-90 has a complete `logout()` action that clears all auth state. Do NOT reimplement or modify this — just call it from the UI.
- **Auth gate handles navigation:** Both platforms have auth gates (`AuthGate` in mobile `_layout.tsx`, `AuthGuard` in web `app.tsx`) that automatically redirect to `/login` when `isAuthenticated` becomes `false`. No explicit navigation code needed on logout — just call `logout()` on the store.
- **Storage cleanup is automatic:** Zustand's `persist` middleware with `partialize` will detect state change and update secure storage. When all persisted fields become null/false, the stored entry is effectively cleared. No manual `deleteItemAsync` or `removeItem` calls needed.
- **No WebSocket connections exist yet:** The acceptance criteria mention closing WebSocket connections, but no WebSocket/real-time connections are implemented yet (that's Epic 2). The current implementation only needs to clear auth state. When WebSocket is added in Epic 2, the logout flow should be extended to close connections before clearing auth.
- **No confirmation dialog:** Per UX-DR19 (no toasts/modals for expected outcomes — "destination IS feedback"), logout should happen immediately. The Login screen appearing IS the confirmation.
- **Shared components location:** GlassHeader lives in `apps/[mobile|web]/src/shared/components/` — NOT in `packages/ui`.

### Design Token Reference

| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| On Surface Variant | `text-on-surface-variant` | Logout icon default color (#bcc9c7) |
| On Surface | `text-on-surface` | Logout icon hover/pressed (#e5e2e1) |
| Primary | `ring-primary` | Focus indicator ring (#6ee9e0) |

### GlassHeader Modification Specification

Add right-side action support to the existing GlassHeader component:

**Mobile (`glass-header.tsx`):**
```
<View className="flex-row items-center justify-between">
  <View className="flex-1">
    {/* existing title + subtitle */}
  </View>
  {onAction && (
    <Pressable onPress={onAction} accessibilityLabel={actionLabel} ...>
      {/* icon */}
    </Pressable>
  )}
</View>
```

**Web (`glass-header.tsx`):**
```
<div className="flex items-center justify-between ...">
  <div>{/* existing title + subtitle */}</div>
  {onAction && (
    <button onClick={onAction} aria-label={actionLabel} ...>
      {/* icon */}
    </button>
  )}
</div>
```

**Icon approach:** Use a simple SVG logout icon inline (no new icon library dependency needed). A door-with-arrow or power icon. Keep it minimal — a single SVG path component.

### What NOT To Do

- Do NOT add a confirmation dialog/modal/alert before logout — UX-DR19 says no modals for expected outcomes
- Do NOT create a separate Settings screen — that's a future feature (Epic 6 UX mentions Settings tab in browse context)
- Do NOT install an icon library just for one icon — use an inline SVG
- Do NOT implement WebSocket disconnection logic — no connections exist yet (Epic 2)
- Do NOT modify the auth store's `logout()` action — it already works correctly
- Do NOT add manual storage cleanup code — Zustand persist handles it automatically
- Do NOT add a toast/snackbar confirming logout — destination IS feedback (UX-DR19)
- Do NOT add explicit navigation calls (router.push/navigate) — auth gate handles redirect automatically
- Do NOT put new components in `packages/ui` — it only holds tokens/CSS
- Do NOT use pure `#FFFFFF` for any text or icons

### File Naming & Code Conventions

- All source files: `kebab-case.ts` / `kebab-case.tsx`
- React components: PascalCase exports
- Test files: co-located (`component.test.tsx` next to `component.tsx`)

### Project Structure Notes

Files to modify:

```
apps/mobile/
  src/
    shared/
      components/
        glass-header.tsx   # MODIFY: Add onAction/actionIcon props, render logout button
  app/
    index.tsx              # MODIFY: Pass logout handler to GlassHeader

apps/web/
  src/
    shared/
      components/
        glass-header.tsx   # MODIFY: Add onAction/actionIcon props, render logout button
    routes/
      index.tsx            # MODIFY: Pass logout handler to GlassHeader
```

No new files needed — this story only modifies existing files.

### References

- [Source: _bmad-output/planning-artifacts/epics.md -- Epic 1, Story 1.5 acceptance criteria]
- [Source: _bmad-output/planning-artifacts/architecture.md -- Zustand store patterns, secure storage, auth gate navigation, code structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md -- UX-DR6 (GlassHeader with action icons), UX-DR19 (no modals/toasts for expected outcomes), UX-DR20 (task-focused navigation)]
- [Source: _bmad-output/planning-artifacts/prd.md -- FR3 (user can log out), NFR13 (platform secure storage), NFR14 (auth tokens not raw credentials)]
- [Source: packages/shared/src/stores/auth-store.ts -- logout() action already implemented at lines 78-90]

### Previous Story Intelligence (Story 1.4)

**Key learnings from Story 1.4:**
- GlassHeader component exists at `apps/[mobile|web]/src/shared/components/glass-header.tsx` with `variant`, `title`, `subtitle` props. Right side of flex layout is currently empty — ready for action buttons.
- Auth store access pattern: `useStore(authStore, selector)` — import `authStore` from `apps/[mobile|web]/src/lib/auth.ts`.
- Home Hub is at `apps/mobile/app/index.tsx` (mobile) and `apps/web/src/routes/index.tsx` (web).
- NativeWind v5 className prop works on RN components directly. Tailwind CSS v4 on web.
- All 30 tests passing, builds clean, lint clean (except pre-existing tailwind.config.js ESM issue).
- Press animations: `Animated.spring` on mobile, CSS `active:scale-95` on web.
- Accessibility: all interactive elements need `accessibilityLabel`/`aria-label`, 48px min touch targets.

**What Story 1.4 established that this story builds on:**
- The GlassHeader component structure with empty right-side slot
- The Home Hub screens that need the logout trigger added
- The auth store integration pattern already in use on both platforms

### Git Intelligence

Recent commits show Stories 1-2, 1-3, 1-4 were implemented in a single commit (`a61ed8c`), followed by two build fixes. The codebase is stable with all builds and tests passing.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No blocking issues encountered during implementation.

### Completion Notes List

- Added `onAction` and `actionLabel` optional props to GlassHeader on both mobile and web platforms.
- Mobile: Uses `Pressable` with 48px touch target, `accessibilityLabel="Log out"`, `active:opacity-70` press feedback, unicode power icon with `text-on-surface-variant` color.
- Web: Uses `<button>` with inline SVG logout icon (door-with-arrow), `aria-label="Log out"`, `focus:ring-2 focus:ring-primary` focus indicator, `text-on-surface-variant` default / `hover:text-on-surface` hover color transition.
- No icon library installed — mobile uses unicode symbol, web uses inline SVG (no react-native-svg available in project).
- Wired `logout` from auth store into both Home Hub screens via `useStore(authStore, (s) => s.logout)` and passed as `onAction` prop.
- No explicit navigation code added — auth gates handle redirect automatically when `isAuthenticated` becomes false.
- No confirmation dialog added per UX-DR19.
- Added 2 new tests to auth-store.test.ts: persist storage update on logout, and pending login invalidation on logout.
- Existing `logout` test expanded to verify all state fields are cleared (userId, username, error, errorField).
- All 32 tests pass (16 ui + 16 shared). Build succeeds. No new lint errors (mobile tailwind.config.js errors are pre-existing).

### Change Log

- 2026-03-22: Implemented Story 1.5 — User Logout. Added logout button to GlassHeader on both platforms, wired into Home Hub screens. Added 2 new auth store tests.

### File List

- apps/mobile/src/shared/components/glass-header.tsx (MODIFIED)
- apps/mobile/app/index.tsx (MODIFIED)
- apps/web/src/shared/components/glass-header.tsx (MODIFIED)
- apps/web/src/routes/index.tsx (MODIFIED)
- packages/shared/src/stores/auth-store.test.ts (MODIFIED)
