# Story 1.3: Jellyfin Authentication Flow

Status: done

## Story

As a user,
I want to log in with my Jellyfin server URL, username, and password,
So that I can access my media server and start using JellySync.

## Acceptance Criteria

1. **Given** the user is not logged in **When** the user opens JellySync **Then** the Login screen is displayed with a GlassCard containing Server URL, Username, and Password fields with secondary uppercase labels, icon prefixes (dns, person, lock), and a gradient "Connect" primary button

2. **Given** the user enters valid Jellyfin credentials **When** the user taps Connect **Then** the app authenticates with the Jellyfin server API and receives an auth token **And** the auth token is stored in platform secure storage (expo-secure-store on mobile, encrypted localStorage on web) **And** raw credentials are not stored after successful login **And** useAuthStore is populated with session data (server URL, user info, token) **And** the user is navigated to the Home Hub screen

3. **Given** the user enters invalid credentials **When** the user taps Connect **Then** an inline error message appears below the failed field in error color (#ffb4ab) **And** the error message uses non-technical language (e.g., "Can't connect to server — check the URL" or "Username or password incorrect") **And** no modal or toast is shown

4. **Given** the user has previously logged in successfully **When** the user reopens the app after closing it **Then** the stored session is restored from secure storage **And** the user lands directly on the Home Hub without seeing the Login screen **And** app launch to home screen completes in < 2 seconds (NFR)

## Tasks / Subtasks

- [x] Task 1: Install navigation and state management dependencies (AC: #1, #2, #4)
  - [x] 1.1 Install Expo Router v7 in apps/mobile: `npx expo install expo-router expo-linking expo-constants expo-status-bar` — configure app.json with `scheme` and `expo-router` plugin, convert entry point to use Expo Router
  - [x] 1.2 Install React Router v7 in apps/web: `pnpm add react-router` — configure BrowserRouter in main.tsx
  - [x] 1.3 Install Zustand 5.x in packages/shared: `pnpm add zustand`
  - [x] 1.4 Install expo-secure-store in apps/mobile: `npx expo install expo-secure-store`
  - [x] 1.5 Install TanStack Query v5 if needed for future Jellyfin API calls (optional — can defer to Story 1.4 if auth logic uses plain fetch)

- [x] Task 2: Create Jellyfin auth client in packages/shared (AC: #2, #3)
  - [x] 2.1 Create `packages/shared/src/jellyfin/types.ts` — define `JellyfinAuthResponse`, `JellyfinUserInfo`, `AuthCredentials` types. Jellyfin auth endpoint: `POST {serverUrl}/Users/AuthenticateByName` with body `{ Username, Pw }` and header `X-Emby-Authorization`
  - [x] 2.2 Create `packages/shared/src/jellyfin/auth.ts` — export `authenticateWithJellyfin(serverUrl, username, password)` function. Must construct the `X-Emby-Authorization` header with client name, device info, version. Returns `{ token, userId, serverUrl, userInfo }` on success. Throws typed errors for network failure vs auth failure vs invalid server
  - [x] 2.3 Create `packages/shared/src/jellyfin/client.ts` — export a base Jellyfin API client with `makeRequest(serverUrl, path, token, options)` for authenticated requests (used by auth and future stories)
  - [x] 2.4 Create `packages/shared/src/jellyfin/index.ts` — barrel export
  - [x] 2.5 Write unit tests for auth.ts (mock fetch): test success response parsing, test auth failure handling, test network error handling, test malformed server URL handling

- [x] Task 3: Create useAuthStore in packages/shared (AC: #2, #4)
  - [x] 3.1 Create `packages/shared/src/stores/auth-store.ts` — Zustand 5.x store with persist middleware. State: `serverUrl`, `token`, `userId`, `username`, `isAuthenticated`, `isLoading`, `isHydrated`. Actions: `login(credentials)`, `restoreSession(storedData)`, `logout()`, `setHydrated()`
  - [x] 3.2 The store must use Zustand's `persist` middleware with a platform-agnostic storage interface — apps provide the storage adapter (secure store on mobile, encrypted localStorage on web)
  - [x] 3.3 Create `packages/shared/src/stores/index.ts` — barrel export
  - [x] 3.4 Update `packages/shared/src/index.ts` to export jellyfin client and stores
  - [x] 3.5 Write unit tests for auth-store (test login sets state, test logout clears state, test hydration flag)

- [x] Task 4: Create platform storage adapters (AC: #2, #4)
  - [x] 4.1 Create `apps/mobile/src/lib/secure-storage.ts` — implements Zustand storage interface using expo-secure-store (`getItemAsync`, `setItemAsync`, `deleteItemAsync`)
  - [x] 4.2 Create `apps/web/src/lib/secure-storage.ts` — implements Zustand storage interface using localStorage with a `jellysync_` prefix (encrypted localStorage is acceptable per architecture doc for web)
  - [x] 4.3 Each adapter must match the `StateStorage` interface from `zustand/middleware`

- [x] Task 5: Set up Expo Router and auth-gated navigation (mobile) (AC: #1, #4)
  - [x] 5.1 Create `apps/mobile/app/_layout.tsx` — root layout wrapping app with providers, imports global.css, initializes auth hydration
  - [x] 5.2 Create `apps/mobile/app/login.tsx` — login screen route
  - [x] 5.3 Create `apps/mobile/app/index.tsx` — home hub placeholder (just show "Home Hub — Welcome, {username}" text for now; full implementation in Story 1.4)
  - [x] 5.4 Implement auth gate in `_layout.tsx` or via a redirect pattern: if `isHydrated && !isAuthenticated` → redirect to `/login`; if `isHydrated && isAuthenticated` → show home; if `!isHydrated` → show nothing (splash screen still visible)
  - [x] 5.5 Update `apps/mobile/app.json` to configure expo-router plugin and scheme

- [x] Task 6: Set up React Router and auth-gated navigation (web) (AC: #1, #4)
  - [x] 6.1 Set up React Router in `apps/web/src/main.tsx` with BrowserRouter
  - [x] 6.2 Create `apps/web/src/routes/login.tsx` — login route
  - [x] 6.3 Create `apps/web/src/routes/index.tsx` — home hub placeholder
  - [x] 6.4 Create auth gate component or route guard: redirect to `/login` if not authenticated, redirect to `/` if authenticated and on login page
  - [x] 6.5 Create `apps/web/src/app.tsx` — route definitions with auth protection

- [x] Task 7: Build login screen UI (mobile) (AC: #1, #3)
  - [x] 7.1 Create `apps/mobile/src/features/auth/components/login-form.tsx` — GlassCard containing 3 stacked input fields and Connect button
  - [x] 7.2 Create `apps/mobile/src/features/auth/components/server-url-input.tsx` — text input with dns icon prefix, secondary uppercase label
  - [x] 7.3 Style inputs: `surface_container_lowest` background, no border, icon prefix, `primary` focus ring, error state with `error` color (#ffb4ab) text below field
  - [x] 7.4 Style Connect button: full-width gradient primary button (135deg gradient from primary to primary_container)
  - [x] 7.5 Overall screen: centered GlassCard on mesh gradient background, JellySync logo/title above
  - [x] 7.6 All interactive elements must be 48px minimum touch target
  - [x] 7.7 Create `apps/mobile/src/features/auth/index.ts` — barrel export

- [x] Task 8: Build login screen UI (web) (AC: #1, #3)
  - [x] 8.1 Create `apps/web/src/features/auth/components/login-form.tsx` — same layout/design as mobile using Tailwind classes
  - [x] 8.2 Create `apps/web/src/features/auth/components/server-url-input.tsx`
  - [x] 8.3 Apply same styling tokens — glass card, surface_container_lowest inputs, gradient button, inline errors
  - [x] 8.4 Create `apps/web/src/features/auth/index.ts` — barrel export

- [x] Task 9: Wire auth logic to UI (AC: #2, #3)
  - [x] 9.1 Connect login form submit to `authenticateWithJellyfin` → on success, call `useAuthStore.login()` which stores to secure storage via persist middleware → navigate to home
  - [x] 9.2 Handle error states: map Jellyfin API errors to user-friendly inline messages — "Can't connect to server — check the URL" for network/DNS errors, "Username or password incorrect" for 401 responses
  - [x] 9.3 Show loading state on Connect button during auth request (disable button, show indicator)
  - [x] 9.4 Validate server URL format before making request (must be a valid URL, add `https://` if no protocol specified)

- [x] Task 10: Verify and test end-to-end (AC: #1-4)
  - [x] 10.1 Run `pnpm build` — no errors across all workspaces
  - [x] 10.2 Run `pnpm test` — all tests pass (existing + new)
  - [x] 10.3 Run `pnpm lint` — no lint errors
  - [x] 10.4 Verify mobile app: cold launch → login screen shown → enter credentials → connect → navigate to home hub placeholder
  - [x] 10.5 Verify web app: cold launch → login screen shown → enter credentials → connect → navigate to home hub placeholder
  - [x] 10.6 Verify session persistence: close and reopen app → lands on home hub without login screen

## Dev Notes

### Architecture Compliance

- **Authentication is delegated entirely to Jellyfin.** No custom auth system, no JWT, no session management. Clients authenticate directly with the Jellyfin server using server URL + username/password. Jellyfin returns an auth token for subsequent API calls.
- **Token storage:** Platform secure storage — expo-secure-store (mobile), localStorage (web). Raw credentials NEVER stored after initial login.
- **No custom auth system, no JWT, no session management.** Jellyfin handles all identity concerns.
- **Zustand 5.x** stores defined in `packages/shared`, consumed by both apps. Use `persist` middleware with platform-specific storage adapters.
- **Expo Router v7** for mobile navigation (file-based routing, included in Expo SDK 55). Three navigation contexts: stack (login, join), tabs (library), modal (player).
- **React Router v7** for web navigation.
- **packages/shared exports platform-agnostic TypeScript** — no React imports, no DOM, no RN. Apps import via `@jellysync/shared`.

### Jellyfin Authentication API

The Jellyfin auth endpoint is:

```
POST {serverUrl}/Users/AuthenticateByName
Content-Type: application/json
X-Emby-Authorization: MediaBrowser Client="JellySync", Device="{deviceName}", DeviceId="{deviceId}", Version="1.0.0"

Body: { "Username": "...", "Pw": "..." }
```

**Success response (200):**
```json
{
  "User": {
    "Name": "username",
    "Id": "user-guid",
    "ServerId": "server-guid",
    ...
  },
  "AccessToken": "hex-token-string",
  "ServerId": "server-guid"
}
```

**Failure response (401):** Empty body or error message.

After authentication, all subsequent API calls include the token:
```
X-Emby-Authorization: MediaBrowser Client="JellySync", Device="{deviceName}", DeviceId="{deviceId}", Version="1.0.0", Token="{accessToken}"
```

### useAuthStore Shape

```typescript
interface AuthState {
  serverUrl: string | null;
  token: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  // Actions
  login: (serverUrl: string, username: string, password: string) => Promise<void>;
  restoreSession: () => void; // handled by persist middleware hydration
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
}
```

The store uses Zustand's `persist` middleware. The `createJSONStorage` factory accepts a platform-specific `StateStorage` adapter. Only persist `serverUrl`, `token`, `userId`, `username` — not loading/hydrated flags.

### Error Handling

- **Inline errors only** — never modal. Error text appears below the affected field in `error` color (#ffb4ab).
- **Error language** — always human, never technical:
  - Network/DNS failure → "Can't connect to server — check the URL"
  - 401 Unauthorized → "Username or password incorrect"
  - Timeout → "Server took too long to respond — try again"
  - Generic → "Something went wrong — try again"
- **Error recovery** — every error message implies a clear action. Retry is always one tap.
- **Validation on submit only** — no real-time validation noise.

### Login Screen UX Specification

- **Layout:** Centered GlassCard on mesh gradient background. JellySync logo/title with signature glow above.
- **Fields:** Stacked (Server URL, Username, Password) inside GlassCard.
- **Labels:** `secondary` (#c8bfff) uppercase label-small above each field.
- **Inputs:** `surface_container_lowest` (#0e0e0e) background, no border, icon prefix (dns/person/lock icons), `primary` (#6ee9e0) focus ring.
- **Submit:** Full-width gradient primary button ("Connect") — 135deg gradient from `primary` to `primary_container`.
- **Touch targets:** All interactive elements 48px minimum.
- **This form is seen once per device** — persistent session means returning users skip it entirely.
- **Password field:** Use `secureTextEntry` (mobile) / `type="password"` (web).
- **Server URL field:** Keyboard type `url`, auto-correct off, auto-capitalize none.

### Navigation Architecture

**Mobile (Expo Router v7):**
```
app/
  _layout.tsx    → Root layout: providers + auth gate
  login.tsx      → Login screen (stack)
  index.tsx      → Home hub (placeholder for now)
```

Auth gate pattern: Check `isHydrated` + `isAuthenticated` in root layout. If not hydrated, keep splash screen visible. If not authenticated, redirect to `/login`. If authenticated, show home.

**Web (React Router v7):**
```
src/
  routes/
    login.tsx    → Login route
    index.tsx    → Home hub (placeholder)
  app.tsx        → Route definitions + auth guard
```

**Critical UX rule:** If a user taps a deep link but needs to log in first, the room join should happen automatically after auth. Never lose the user's intent. (Full deep link handling is Story 2.4, but design the auth redirect to support storing intended destination.)

### File Naming & Code Conventions

- All source files: `kebab-case.ts` / `kebab-case.tsx`
- React components: PascalCase exports (e.g., `login-form.tsx` exports `LoginForm`)
- Zustand stores: `use[Name]Store` pattern (e.g., `useAuthStore`)
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: PascalCase (e.g., `AuthState`, `JellyfinAuthResponse`)
- Test files: co-located with source (`auth.test.ts` next to `auth.ts`)

### Project Structure Notes

Files to create/modify:
```
packages/shared/
  src/
    jellyfin/
      auth.ts              # NEW: Auth logic (authenticateWithJellyfin)
      auth.test.ts         # NEW: Auth tests
      client.ts            # NEW: Base API client (makeRequest)
      types.ts             # NEW: Jellyfin API types
      index.ts             # NEW: Barrel export
    stores/
      auth-store.ts        # NEW: useAuthStore (Zustand + persist)
      auth-store.test.ts   # NEW: Store tests
      index.ts             # NEW: Barrel export
    index.ts               # MODIFIED: Export jellyfin + stores
  package.json             # MODIFIED: +zustand

apps/mobile/
  app/
    _layout.tsx            # NEW: Root layout with providers + auth gate
    login.tsx              # NEW: Login screen
    index.tsx              # NEW: Home hub placeholder
  src/
    features/
      auth/
        components/
          login-form.tsx       # NEW: Login form component
          server-url-input.tsx # NEW: Server URL input
        index.ts               # NEW: Barrel export
    lib/
      secure-storage.ts    # NEW: expo-secure-store adapter
  app.json                 # MODIFIED: expo-router config
  package.json             # MODIFIED: +expo-router, +expo-secure-store, +zustand peer

apps/web/
  src/
    routes/
      login.tsx            # NEW: Login route
      index.tsx            # NEW: Home hub placeholder
    features/
      auth/
        components/
          login-form.tsx       # NEW: Login form component
          server-url-input.tsx # NEW: Server URL input
        index.ts               # NEW: Barrel export
    lib/
      secure-storage.ts    # NEW: localStorage adapter
    app.tsx                # MODIFIED: Route definitions
    main.tsx               # MODIFIED: BrowserRouter setup
  package.json             # MODIFIED: +react-router
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.3 acceptance criteria]
- [Source: _bmad-output/planning-artifacts/architecture.md — Authentication & Security, Data Architecture, Navigation, Zustand Store Patterns, Code Structure, FR1-FR3 file mapping]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Login Screen, Auth Gate, Error Handling, First-Time Onboarding Journey, Navigation Contexts]
- [Source: _bmad-output/planning-artifacts/prd.md — FR1-FR3 (Authentication & Session), Security requirements, Performance targets]
- [Source: Jellyfin API docs — https://jellyfin.org/docs/]

### Previous Story Intelligence (Story 1.2)

**Key learnings from Story 1.2:**
- Expo SDK 55 uses React Native 0.83.2, React 19.2.0 — New Architecture only
- NativeWind v5 (`5.0.0-preview.3`) is installed and working — use Tailwind classes directly on RN components via `className` prop
- Vite v6 for web, Tailwind CSS v4.2 for web styling
- TypeScript ~5.8 with strict mode
- Vitest v4.1 for testing across all packages
- Design tokens available via Tailwind classes: `bg-surface`, `text-on-surface`, `text-primary`, `text-secondary`, `bg-surface-container-lowest`, `text-error`, etc.
- Glass utility class available: `.glass` (glassmorphism effect)
- Gradient utility: `.gradient-primary` (135deg primary → primary_container)
- `packages/ui` currently has NO components — only tokens and CSS. Login form components must be created in the app-level `features/auth/` directories
- `packages/shared` currently exports only `SHARED_VERSION = '0.0.0'` — all stores and API clients are new
- Mobile entry point is `apps/mobile/App.tsx` (will change when switching to Expo Router's `app/` directory)
- Font loading is already configured (Manrope + Inter) in mobile App.tsx — must preserve this when migrating to Expo Router layout

**What NOT to do:**
- Do NOT install NativeWind — already installed and configured
- Do NOT modify Tailwind/NativeWind configuration — already set up in Story 1.2
- Do NOT modify `packages/ui/src/tokens/` — design tokens are complete
- Do NOT create the full Home Hub UI — that's Story 1.4. Just create a placeholder screen
- Do NOT implement logout — that's Story 1.5
- Do NOT set up WebSocket connections — that's Epic 2
- Do NOT use pure #FFFFFF — lightest text is `on_surface` (#e5e2e1)
- Do NOT use 1px solid borders — use tonal shifts and ghost borders (outline_variant at 15% opacity)
- Do NOT use modals or toasts for errors — inline only

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Resolved App.tsx vs app.tsx casing conflict in web build by removing old App.tsx

### Completion Notes List

- Installed Expo Router v7, React Router v7, Zustand 5.x, expo-secure-store
- Created Jellyfin auth client with typed errors (network/unauthorized/timeout/unknown)
- Created Zustand auth store with persist middleware and platform-agnostic storage interface
- Created mobile (expo-secure-store) and web (localStorage) storage adapters
- Set up Expo Router file-based routing with auth gate (redirect pattern)
- Set up React Router with AuthGuard/GuestGuard route protection
- Built login screen UI for both platforms: GlassCard, gradient button, inline errors, 48px touch targets
- Auth logic wired: login form -> authenticateWithJellyfin -> store update -> navigation
- Server URL normalization (auto-adds https://) and error mapping to user-friendly messages
- 14 unit tests added (7 for auth client, 6 for auth store, 1 existing)
- All builds pass, all 30 tests pass, all lint checks pass
- TanStack Query deferred to Story 1.4 (plain fetch sufficient for auth)

### Change Log

- 2026-03-22: Implemented Story 1.3 — Jellyfin Authentication Flow (all 10 tasks)

### File List

**New files:**
- packages/shared/src/jellyfin/types.ts
- packages/shared/src/jellyfin/auth.ts
- packages/shared/src/jellyfin/auth.test.ts
- packages/shared/src/jellyfin/client.ts
- packages/shared/src/jellyfin/index.ts
- packages/shared/src/stores/auth-store.ts
- packages/shared/src/stores/auth-store.test.ts
- packages/shared/src/stores/index.ts
- apps/mobile/src/lib/secure-storage.ts
- apps/mobile/src/lib/auth.ts
- apps/mobile/src/features/auth/components/login-form.tsx
- apps/mobile/src/features/auth/components/server-url-input.tsx
- apps/mobile/src/features/auth/index.ts
- apps/mobile/app/_layout.tsx
- apps/mobile/app/login.tsx
- apps/mobile/app/index.tsx
- apps/web/src/lib/secure-storage.ts
- apps/web/src/lib/auth.ts
- apps/web/src/features/auth/components/login-form.tsx
- apps/web/src/features/auth/components/server-url-input.tsx
- apps/web/src/features/auth/index.ts
- apps/web/src/routes/login.tsx
- apps/web/src/routes/index.tsx
- apps/web/src/app.tsx

**Modified files:**
- packages/shared/src/index.ts (added jellyfin and stores exports)
- packages/shared/package.json (added zustand dependency)
- apps/mobile/package.json (added expo-router, expo-secure-store, zustand, changed main to expo-router/entry)
- apps/mobile/app.json (added scheme, expo-router and expo-secure-store plugins)
- apps/web/package.json (added react-router, zustand)
- apps/web/src/main.tsx (updated to import new app.tsx)
- pnpm-lock.yaml

**Deleted files:**
- apps/web/src/App.tsx (replaced by apps/web/src/app.tsx)
- apps/web/src/App.css (no longer needed)
