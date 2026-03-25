# Story 3.1: Jellyfin Library API Client & Data Layer

Status: done

## Story

As a developer,
I want a shared Jellyfin API client with TanStack Query hooks for library browsing,
so that both mobile and web apps can fetch and cache library data efficiently.

## Acceptance Criteria

1. **Library API Methods**: Given the @jellysync/shared package, when the Jellyfin library module is implemented, then `packages/shared/src/jellyfin/library.ts` provides typed API methods for fetching movie lists, categories/genres, and movie details from a Jellyfin server.

2. **Stream URL Generation**: `packages/shared/src/jellyfin/streaming.ts` provides stream URL generation for per-user transcoded playback (FR19).

3. **Type Definitions**: `packages/shared/src/jellyfin/types.ts` defines TypeScript types for all Jellyfin API responses (movie metadata, library items, stream info).

4. **TanStack Query Hooks**: TanStack Query v5.x hooks are created: `useMovieList`, `useMovieDetails`, `useLibraryCategories` — providing automatic caching, background refetching, and loading/error states.

5. **Auth Token Usage**: All API calls use the auth token from `useAuthStore` (never raw credentials — NFR14).

6. **Error Handling**: API errors throw typed errors that map to user-friendly messages via the existing error pattern in the codebase.

7. **Performance**: Library page responses complete within < 2 seconds (NFR10).

## Tasks / Subtasks

- [x] Task 1: Install TanStack Query v5.x (AC: #4)
  - [x]1.1 Add `@tanstack/react-query` to `packages/shared/package.json` dependencies
  - [x]1.2 Add `react` as a peer dependency to `packages/shared/package.json` (required by TanStack Query hooks)
  - [x]1.3 Add `@tanstack/react-query` to `apps/mobile/package.json` and `apps/web/package.json`
  - [x]1.4 Run `pnpm install` to resolve dependencies

- [x] Task 2: Extend Jellyfin type definitions (AC: #3)
  - [x]2.1 Add library item types to `packages/shared/src/jellyfin/types.ts`:
    - `JellyfinLibraryItem` — id, name, year, runtime (ticks), overview, imageTag (for poster URL), type
    - `JellyfinLibraryResponse` — Items array + TotalRecordCount for pagination
    - `JellyfinGenre` — id, name
    - `JellyfinGenresResponse` — Items array
    - `JellyfinMovieDetails` — extended metadata: id, name, year, runtime, overview, genres, imageTag, mediaSources (for stream info), communityRating
    - `JellyfinStreamInfo` — mediaSourceId, container, codec info, transcodingUrl
  - [x]2.2 Add library-specific error type extending the existing `AuthError` pattern (e.g., `LibraryError` with types: `'network'`, `'unauthorized'`, `'not-found'`, `'unknown'`)
  - [x]2.3 Export all new types from `packages/shared/src/jellyfin/index.ts`

- [x] Task 3: Implement library API methods (AC: #1, #5)
  - [x]3.1 Create `packages/shared/src/jellyfin/library.ts` with:
    - `fetchMovieList(serverUrl, token, options?)` — GET `/Users/{userId}/Items` with IncludeItemTypes=Movie, pagination params (StartIndex, Limit), SortBy, optional GenreIds filter
    - `fetchMovieDetails(serverUrl, token, movieId)` — GET `/Users/{userId}/Items/{movieId}`
    - `fetchLibraryCategories(serverUrl, token)` — GET `/Genres` with IncludeItemTypes=Movie
  - [x]3.2 Reuse existing `makeRequest<T>()` and `buildAuthHeader()` from `client.ts` for all HTTP calls
  - [x]3.3 Use Jellyfin image URL pattern for poster images: `{serverUrl}/Items/{itemId}/Images/Primary?tag={imageTag}&quality=90&fillWidth=300`
  - [x]3.4 Add `getImageUrl(serverUrl, itemId, imageTag, options?)` helper for building poster image URLs with configurable width/quality
  - [x]3.5 Ensure all methods accept userId parameter (from useAuthStore)

- [x] Task 4: Implement stream URL generation (AC: #2)
  - [x]4.1 Create `packages/shared/src/jellyfin/streaming.ts` with:
    - `buildStreamUrl(serverUrl, token, itemId, options?)` — generates HLS/DASH stream URL with per-user transcoding parameters
    - Options: maxBitrate, audioCodec, videoCodec, container
  - [x]4.2 Use Jellyfin's video streaming endpoint pattern: `{serverUrl}/Videos/{itemId}/stream` or `{serverUrl}/Videos/{itemId}/master.m3u8` for HLS
  - [x]4.3 Include auth token in stream URL query params (required by Jellyfin for stream auth)

- [x] Task 5: Create TanStack Query hooks (AC: #4, #6, #7)
  - [x]5.1 Create `packages/shared/src/jellyfin/hooks.ts` with:
    - `useMovieList(serverUrl, token, userId, options?)` — wraps `fetchMovieList` with `useQuery`, staleTime 5min, cacheTime 30min
    - `useMovieDetails(serverUrl, token, userId, movieId)` — wraps `fetchMovieDetails` with `useQuery`, enabled only when movieId is truthy
    - `useLibraryCategories(serverUrl, token, userId)` — wraps `fetchLibraryCategories` with `useQuery`, staleTime 10min (genres rarely change)
  - [x]5.2 Use query key conventions: `['jellyfin', 'movies', { genreId, startIndex, limit }]`, `['jellyfin', 'movie', movieId]`, `['jellyfin', 'genres']`
  - [x]5.3 Map API errors to user-friendly messages in the `onError` / error transformation
  - [x]5.4 Expose `isLoading`, `isPending`, `error`, `data` from hooks for consumer components

- [x] Task 6: Set up QueryClientProvider in apps (AC: #4)
  - [x]6.1 Create `QueryClient` instance in `apps/mobile/src/lib/query-client.ts` with default options (retry: 3, staleTime: 5min)
  - [x]6.2 Wrap app root in `QueryClientProvider` in `apps/mobile/app/_layout.tsx`
  - [x]6.3 Create `QueryClient` instance in `apps/web/src/lib/query-client.ts` with same defaults
  - [x]6.4 Wrap app root in `QueryClientProvider` in `apps/web/src/app.tsx`

- [x] Task 7: Update barrel exports (AC: #1, #2, #3, #4)
  - [x]7.1 Export library functions from `packages/shared/src/jellyfin/index.ts`: `fetchMovieList`, `fetchMovieDetails`, `fetchLibraryCategories`, `getImageUrl`, `buildStreamUrl`
  - [x]7.2 Export hooks from `packages/shared/src/jellyfin/index.ts`: `useMovieList`, `useMovieDetails`, `useLibraryCategories`
  - [x]7.3 Export all new types
  - [x]7.4 Update `packages/shared/src/index.ts` if needed

- [x] Task 8: Write tests (AC: #1, #2, #3, #6)
  - [x]8.1 Unit tests for `library.ts`: mock `makeRequest`, verify correct Jellyfin API URLs, query params, auth header usage, error mapping
  - [x]8.2 Unit tests for `streaming.ts`: verify stream URL generation with various options, auth token inclusion
  - [x]8.3 Unit tests for `getImageUrl`: verify URL construction with various width/quality params
  - [x]8.4 Unit tests for error handling: verify typed errors with user-friendly messages for network failures, 401s, 404s
  - [x]8.5 Co-locate all tests: `library.test.ts`, `streaming.test.ts` next to source files

## Dev Notes

### What Already Exists (DO NOT recreate)

- `packages/shared/src/jellyfin/client.ts` — `makeRequest<T>()` generic HTTP client with auth headers, timeout, abort controller. **Reuse this for all Jellyfin API calls.**
- `packages/shared/src/jellyfin/client.ts` — `buildAuthHeader()` constructs `X-Emby-Authorization` MediaBrowser header. **Reuse for all requests.**
- `packages/shared/src/jellyfin/types.ts` — `AuthError` class with typed error categorization (`'network'`, `'unauthorized'`, `'timeout'`, `'unknown'`). **Extend this pattern for library errors.**
- `packages/shared/src/jellyfin/auth.ts` — `authenticateWithJellyfin()` — demonstrates the established API call pattern.
- `packages/shared/src/stores/auth-store.ts` — `createAuthStore()` with `serverUrl`, `token`, `userId`, `username`. **Read auth state from here for API calls.**
- `packages/shared/src/protocol/constants.ts` — `ERROR_MESSAGE` map for user-friendly error strings. **Follow this pattern for library errors.**
- `packages/shared/src/jellyfin/index.ts` — Current barrel exports. **Add new exports here.**

### Key Implementation Patterns (MUST follow)

**HTTP request pattern (reuse existing client):**
```typescript
import { makeRequest, buildAuthHeader } from './client.js';

export async function fetchMovieList(
  serverUrl: string,
  token: string,
  userId: string,
  options?: { genreId?: string; startIndex?: number; limit?: number; sortBy?: string }
): Promise<JellyfinLibraryResponse> {
  const params = new URLSearchParams({
    IncludeItemTypes: 'Movie',
    Recursive: 'true',
    Fields: 'Overview,Genres,MediaSources',
    SortBy: options?.sortBy ?? 'SortName',
    SortOrder: 'Ascending',
    StartIndex: String(options?.startIndex ?? 0),
    Limit: String(options?.limit ?? 50),
    ImageTypeLimit: '1',
    EnableImageTypes: 'Primary',
  });
  if (options?.genreId) params.set('GenreIds', options.genreId);

  return makeRequest<JellyfinLibraryResponse>(
    `${serverUrl}/Users/${userId}/Items?${params}`,
    { headers: buildAuthHeader(serverUrl, token) }
  );
}
```

**Zustand store access pattern (vanilla — NOT a React hook):**
```typescript
import { useStore } from 'zustand';
import { authStore } from '../../lib/auth';

// In a component:
const serverUrl = useStore(authStore, (s) => s.serverUrl);
const token = useStore(authStore, (s) => s.token);
const userId = useStore(authStore, (s) => s.userId);
```

**Import convention (ESM — use .js extension):**
```typescript
import { makeRequest, buildAuthHeader } from './client.js';
import type { JellyfinLibraryItem } from './types.js';
```

**File naming:** kebab-case `.ts` / `.tsx`

**Error handling pattern:**
```typescript
export class LibraryError extends Error {
  constructor(
    public type: 'network' | 'unauthorized' | 'not-found' | 'unknown',
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'LibraryError';
  }
}
```

### Jellyfin API Reference

**Endpoints needed:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/Users/{userId}/Items` | GET | Fetch library items with filters |
| `/Users/{userId}/Items/{itemId}` | GET | Fetch single item details |
| `/Genres` | GET | Fetch available genres |
| `/Items/{itemId}/Images/Primary` | GET | Poster image (not an API call — direct image URL) |
| `/Videos/{itemId}/stream` | GET | Video stream URL |

**Key query parameters for `/Users/{userId}/Items`:**
- `IncludeItemTypes=Movie` — filter to movies only
- `Recursive=true` — search all libraries
- `Fields=Overview,Genres,MediaSources` — include extended metadata
- `SortBy=SortName` — alphabetical (default), also: `DateCreated`, `PremiereDate`, `CommunityRating`
- `SortOrder=Ascending` or `Descending`
- `StartIndex=0` — pagination offset
- `Limit=50` — page size
- `GenreIds={id}` — filter by genre
- `ImageTypeLimit=1` — limit to primary image only
- `EnableImageTypes=Primary` — request only primary poster

**Poster image URL pattern:**
```
{serverUrl}/Items/{itemId}/Images/Primary?tag={imageTag}&quality=90&fillWidth=300
```
- `tag` prevents cache busting — use the `ImageTags.Primary` value from item response
- `fillWidth` controls resolution (300 for grid thumbnails, 600 for detail views)
- `quality` 90 is optimal for posters

**Stream URL pattern:**
```
{serverUrl}/Videos/{itemId}/stream?static=true&api_key={token}
```
Or for HLS transcoding:
```
{serverUrl}/Videos/{itemId}/master.m3u8?api_key={token}&MediaSourceId={sourceId}
```

### Architecture Compliance

- **TanStack Query v5.x** is the mandated solution for all Jellyfin API data fetching — do NOT use raw fetch or manual state for API data
- **Zustand** continues to manage client state (auth, room, sync) — TanStack Query manages server/API state
- **Shared package** (`packages/shared`) is where API methods and hooks live — both apps import from `@jellysync/shared`
- **No database** — all media data lives in Jellyfin; JellySync caches via TanStack Query only
- **Direct client-to-Jellyfin** — signaling server has zero knowledge of Jellyfin (architectural boundary)
- **HTTPS only** for Jellyfin API calls (NFR18)

### TanStack Query Configuration Notes

- **Default staleTime:** 5 minutes (movies don't change frequently during a session)
- **Genres staleTime:** 10 minutes (genres are essentially static)
- **gcTime (formerly cacheTime):** 30 minutes
- **retry:** 3 (TanStack Query default)
- **refetchOnWindowFocus:** true (default — keeps data fresh)
- **QueryClientProvider** must wrap the app root above any component that uses hooks
- **React is a peer dependency** — shared package must declare `react` as peerDep since TanStack Query hooks use React

### Project Structure Notes

Files to create:
```
packages/shared/src/jellyfin/library.ts      # API methods for movie list, details, categories
packages/shared/src/jellyfin/library.test.ts  # Tests for library API methods
packages/shared/src/jellyfin/streaming.ts     # Stream URL generation
packages/shared/src/jellyfin/streaming.test.ts # Tests for streaming
packages/shared/src/jellyfin/hooks.ts         # TanStack Query hooks (useMovieList, etc.)
apps/mobile/src/lib/query-client.ts           # Mobile QueryClient instance
apps/web/src/lib/query-client.ts              # Web QueryClient instance
```

Files to modify:
```
packages/shared/package.json                  # Add @tanstack/react-query, react peer dep
packages/shared/src/jellyfin/types.ts         # Add library item types
packages/shared/src/jellyfin/index.ts         # Export new modules
packages/shared/src/index.ts                  # Update barrel if needed
apps/mobile/package.json                      # Add @tanstack/react-query
apps/mobile/app/_layout.tsx                   # Add QueryClientProvider
apps/web/package.json                         # Add @tanstack/react-query
apps/web/src/app.tsx                          # Add QueryClientProvider
```

### Previous Story Intelligence

**From Story 2-5 (Room Lifecycle & Host Transfer):**
- Server is authoritative — clients send intents, server validates and broadcasts
- WebSocket hook auto-handles state updates to Zustand stores
- Error display is inline-only (no modals, toasts, or Alerts)
- ParticipantChip has three variants: host, participant, empty slot
- Vanilla Zustand pattern: `useStore(storeName, selector)` — NOT `useXxxStore()` hook

**From Epic 2 patterns generally:**
- `.js` extensions in imports (ESM convention) — DO NOT use `.ts` extensions
- Co-located tests: `filename.test.ts` next to `filename.ts`
- All 141 tests pass with zero regressions
- `makeRequest<T>()` is the established HTTP client — reuse, don't create new fetch wrappers
- Error types follow categorized pattern (`AuthError` with `type` discriminator)

**From Story 1-3 (Jellyfin Auth):**
- `buildAuthHeader()` constructs proper MediaBrowser auth headers with device ID
- Device ID is cached in localStorage via `getDeviceId()`
- Auth token is stored in platform secure storage, accessed via `useAuthStore`
- `makeRequest` uses AbortController with 15s default timeout

### Anti-Patterns to Avoid

- DO NOT use raw `fetch()` — use `makeRequest<T>()` from `client.ts`
- DO NOT store library data in Zustand — TanStack Query manages API/server state
- DO NOT create custom caching logic — TanStack Query handles it
- DO NOT use `.ts` extensions in imports — use `.js` per existing ESM pattern
- DO NOT put business logic in components — extract to hooks or shared functions
- DO NOT create grab-bag utility files — be specific (e.g., `library.ts`, not `utils.ts`)
- DO NOT duplicate types from `@jellysync/shared` — import from shared package
- DO NOT add React as a direct dependency to shared — add as peerDependency
- DO NOT expose raw Jellyfin API response shapes to UI — wrap in typed interfaces
- DO NOT expose technical error details to users — map to friendly messages

### Testing Standards

- Framework: Vitest
- Co-locate tests with source: `library.test.ts` next to `library.ts`
- Mock `makeRequest` for unit tests — don't make real HTTP calls
- Test error mapping: verify each error type produces correct user-friendly message
- Test query parameter construction: verify correct Jellyfin API URLs
- Test image URL generation: verify proper tag, quality, width params
- Run full test suite after implementation to verify zero regressions

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — Jellyfin API Client, TanStack Query, State Management, Shared Package Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — PosterGrid, Loading States, Library Browser]
- [Source: _bmad-output/implementation-artifacts/2-5-room-lifecycle-and-host-transfer.md — Previous Story Learnings]
- [Jellyfin API: /Users/{userId}/Items endpoint for library queries]
- [Jellyfin API: /Items/{itemId}/Images/Primary for poster images]
- [Jellyfin API: /Videos/{itemId}/stream for video streaming]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- All 113 tests pass (10 test files, zero regressions)
- Pre-existing typecheck warning in deep-link-join.test.ts (TS2872) — not introduced by this story
- No new typecheck errors from story implementation

### Completion Notes List

- Installed TanStack Query v5.x across shared, mobile, and web packages; added React as peer dependency to shared
- Extended types.ts with JellyfinLibraryItem, JellyfinLibraryResponse, JellyfinGenre, JellyfinGenresResponse, JellyfinMovieDetails, JellyfinMediaSource, JellyfinStreamInfo, and LibraryError class
- Implemented library.ts with fetchMovieList, fetchMovieDetails, fetchLibraryCategories, getImageUrl — all reuse makeRequest/buildAuthHeader from client.ts
- Implemented streaming.ts with buildStreamUrl supporting both direct stream and HLS transcoding with per-user auth
- Created TanStack Query hooks (useMovieList, useMovieDetails, useLibraryCategories) with proper staleTime, gcTime, query keys, and enabled guards
- Set up QueryClientProvider wrapping app root in both mobile (_layout.tsx) and web (app.tsx)
- Updated barrel exports in jellyfin/index.ts for all new functions, hooks, and types
- Wrote 22 new unit tests across library.test.ts and streaming.test.ts covering: API URL construction, query params, auth header usage, error mapping (401/404/500/network/timeout), image URL generation, and stream URL generation

### Change Log

- 2026-03-25: Implemented Story 3.1 — Jellyfin Library API Client & Data Layer (all 8 tasks completed)

### File List

New files:
- packages/shared/src/jellyfin/library.ts
- packages/shared/src/jellyfin/library.test.ts
- packages/shared/src/jellyfin/streaming.ts
- packages/shared/src/jellyfin/streaming.test.ts
- packages/shared/src/jellyfin/hooks.ts
- apps/mobile/src/lib/query-client.ts
- apps/web/src/lib/query-client.ts

Modified files:
- packages/shared/package.json
- packages/shared/src/jellyfin/types.ts
- packages/shared/src/jellyfin/index.ts
- apps/mobile/package.json
- apps/mobile/app/_layout.tsx
- apps/web/package.json
- apps/web/src/app.tsx
- pnpm-lock.yaml
