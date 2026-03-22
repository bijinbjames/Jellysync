# Story 1.2: Design System Token Implementation

Status: done

## Story

As a developer,
I want the complete "Private Screening" design system tokens implemented in the shared UI package,
So that all screens across mobile and web render with consistent visual identity.

## Acceptance Criteria

1. **Given** the @jellysync/ui package exists **When** the design tokens are implemented **Then** all 16 color tokens are defined (primary #6ee9e0, secondary #c8bfff, surface hierarchy #0e0e0e through #353534, on_surface #e5e2e1, error #ffb4ab, tertiary #ffcbac, outline variants)
2. **And** typography tokens define Manrope (headlines/display, weights 700-800) and Inter (body/labels, weights 400-600) with 6 roles (Display Large through Label Small)
3. **And** spacing scale defines 7 tokens (0.25rem through 4rem)
4. **And** corner radius tokens define rounded-lg (2rem), rounded-md (1.5rem), and rounded-full
5. **And** a shared Tailwind preset (`tailwind-preset.ts`) exports all tokens for consumption by both apps
6. **And** apps/mobile `tailwind.config.ts` consumes the preset via NativeWind v5
7. **And** apps/web `tailwind.config.ts` consumes the preset via Tailwind CSS v4
8. **And** glassmorphism utility classes are available (surface at 60% opacity + backdrop-blur-xl)
9. **And** Manrope and Inter fonts are loaded in both mobile (expo-font) and web (CSS @font-face)
10. **And** no pure #FFFFFF is used anywhere — on_surface (#e5e2e1) is the lightest text color

## Tasks / Subtasks

- [x] Task 1: Define design tokens in packages/ui (AC: #1, #2, #3, #4)
  - [x] 1.1 Create `packages/ui/src/tokens/colors.ts` — export all 16 color tokens as a typed object
  - [x] 1.2 Create `packages/ui/src/tokens/typography.ts` — export font families, weights, sizes, letter-spacing for all 6 roles
  - [x] 1.3 Create `packages/ui/src/tokens/spacing.ts` — export 7-token spacing scale
  - [x] 1.4 Create `packages/ui/src/tokens/radius.ts` — export corner radius tokens
  - [x] 1.5 Create `packages/ui/src/tokens/index.ts` — barrel export all token modules
  - [x] 1.6 Update `packages/ui/src/index.ts` to re-export tokens

- [x] Task 2: Create shared Tailwind CSS theme and preset (AC: #5, #8)
  - [x] 2.1 Create `packages/ui/src/theme.css` — Tailwind v4 `@theme` block defining all design tokens as CSS custom properties (colors, font families, spacing, border-radius)
  - [x] 2.2 Create `packages/ui/src/utilities.css` — custom utility classes: `.glass` (glassmorphism: `rgba(surface_container, 0.6)` + `backdrop-filter: blur(20px)` + ghost border), `.gradient-primary` (135deg gradient from primary to primary_container)
  - [x] 2.3 Update `packages/ui/src/index.ts` to re-export token TypeScript modules (for programmatic access)
  - [x] 2.4 Update `packages/ui/package.json` exports to include CSS files (theme.css, utilities.css) and TS token modules

- [x] Task 3: Configure NativeWind v5 for mobile app (AC: #6)
  - [x] 3.1 Install NativeWind v5 preview + peers: `npx expo install nativewind@preview react-native-css react-native-reanimated react-native-safe-area-context` and dev deps `tailwindcss @tailwindcss/postcss postcss`
  - [x] 3.2 Create `apps/mobile/global.css` with individual Tailwind imports (theme.css, preflight.css, utilities.css), `nativewind/theme`, then `@import` the shared theme.css from @jellysync/ui
  - [x] 3.3 Create `apps/mobile/postcss.config.mjs` with `@tailwindcss/postcss` plugin
  - [x] 3.4 Create `apps/mobile/metro.config.js` using `withNativeWind(config, { input: "./global.css" })`
  - [x] 3.5 Import `"./global.css"` in the root App component
  - [x] 3.6 Verify a test component renders with token-based Tailwind classes (e.g., `bg-surface text-on-surface`)

- [x] Task 4: Configure Tailwind CSS v4 for web app (AC: #7)
  - [x] 4.1 Install `tailwindcss` and `@tailwindcss/vite` in apps/web
  - [x] 4.2 Add `@tailwindcss/vite` plugin to `apps/web/vite.config.ts`
  - [x] 4.3 Update `apps/web/src/index.css` with `@import "tailwindcss"`, then `@import` the shared theme.css and utilities.css from @jellysync/ui
  - [x] 4.4 Add `@source` directive pointing to `../../packages/ui/src/**/*.{ts,tsx}` for class scanning
  - [x] 4.5 Verify a test component renders with token-based Tailwind classes

- [x] Task 5: Load custom fonts on both platforms (AC: #9)
  - [x] 5.1 Install `expo-font`, `expo-splash-screen`, `@expo-google-fonts/manrope`, and `@expo-google-fonts/inter` in apps/mobile
  - [x] 5.2 Create font loading in apps/mobile root component using `useFonts` hook with `SplashScreen.preventAutoHideAsync()` to hold splash until fonts load, then `SplashScreen.hideAsync()`. Load: Manrope_700Bold, Manrope_800ExtraBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold
  - [x] 5.3 Download Manrope and Inter woff2 font files for web into `apps/web/public/fonts/` (or use Google Fonts CDN)
  - [x] 5.4 Add @font-face declarations in `apps/web/src/index.css` for Manrope (700, 800) and Inter (400, 500, 600) with `font-display: swap`
  - [x] 5.5 Configure `@theme` font families — on native, ensure registered font names match expo-font names (e.g., `Manrope_700Bold`)

- [x] Task 6: Verify complete design system integration (AC: #1-10)
  - [x] 6.1 Create a token showcase component in apps/web showing all colors, typography roles, spacing, and radius
  - [x] 6.2 Verify glassmorphism utility renders correctly on web (backdrop-filter support)
  - [x] 6.3 Verify no #FFFFFF exists in any token definition — on_surface (#e5e2e1) is the max brightness
  - [x] 6.4 Run `pnpm build` and `pnpm lint` — ensure no errors across all workspaces
  - [x] 6.5 Run `pnpm test` — ensure existing tests still pass (no regressions)

## Dev Notes

### Architecture Compliance

- **All design tokens live in `packages/ui/`** — this is the shared design token package consumed by both mobile and web apps via workspace dependency `@jellysync/ui`
- **File naming**: kebab-case for all source files (e.g., `tailwind-preset.ts`, `colors.ts`)
- **Package exports**: Update `packages/ui/package.json` exports field to include the tailwind preset path so apps can import it directly
- **Do NOT create components in this story** — only tokens, preset, and configuration. Components (GlassHeader, ActionCard, etc.) come in Stories 1.3+

### Technical Requirements

#### Color Token Definitions (exact values required)

```typescript
export const colors = {
  primary: '#6ee9e0',
  primary_container: '#4ecdc4',
  secondary: '#c8bfff',
  secondary_container: '#442bb5',
  surface: '#131313',
  surface_container_lowest: '#0e0e0e',
  surface_container_low: '#1c1b1b',
  surface_container: '#201f1f',
  surface_container_high: '#2a2a2a',
  surface_container_highest: '#353534',
  on_surface: '#e5e2e1',
  on_surface_variant: '#bcc9c7',
  outline: '#869391',
  outline_variant: '#3d4948',
  error: '#ffb4ab',
  tertiary: '#ffcbac',
} as const;
```

#### Typography Token Definitions (exact values required)

| Role | Font | Weight | Size | Letter Spacing |
|------|------|--------|------|---------------|
| Display Large | Manrope | 800 | 3.5rem | -0.02em |
| Headline Large | Manrope | 700 | 2rem | -0.02em |
| Headline Medium | Manrope | 700 | 1.5rem | tight (-0.025em) |
| Body Medium | Inter | 400 | 1rem | normal |
| Label Medium | Inter | 500-600 | 0.75rem | 0.2em (uppercase) |
| Label Small | Inter | 500 | 0.625rem | widest (0.1em, uppercase) |

Font families for Tailwind config:
- `fontFamily.display`: `['Manrope', 'sans-serif']`
- `fontFamily.body`: `['Inter', 'sans-serif']`

#### Spacing Scale (exact values required)

| Token | Value |
|-------|-------|
| spacing.1 | 0.25rem |
| spacing.2 | 0.5rem |
| spacing.3 | 1rem |
| spacing.4 | 1.4rem |
| spacing.6 | 2rem |
| spacing.8 | 2.75rem |
| spacing.12 | 4rem |

#### Corner Radius (exact values required)

| Token | Value |
|-------|-------|
| rounded-lg | 2rem |
| rounded-md | 1.5rem |
| rounded-full | 9999px |

### Glassmorphism Implementation

The glassmorphism system is a signature visual element. The `glass` utility class must produce:

```css
.glass {
  background: rgba(32, 31, 31, 0.6); /* surface_container at 60% opacity */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px); /* Safari support */
  border: 1px solid rgba(61, 73, 72, 0.15); /* outline_variant at 15% opacity */
}
```

**Important:** NativeWind/React Native does NOT support `backdrop-filter`. On mobile, the glass effect should fall back to a solid semi-transparent background without blur. Define the glass utility conditionally or document this platform limitation for future component work.

### NativeWind v5 Configuration

**NativeWind v5 is pre-release** — latest is `5.0.0-preview.3` (released March 15, 2026). It requires:
- React Native 0.81+ (we have 0.83 — compatible)
- Tailwind CSS v4.1+ as a peer dependency
- React Native Reanimated v4+
- `react-native-css` (new peer dependency in v5)
- Metro bundler configuration via `withNativeWind()` wrapper

Key installation:
```bash
cd apps/mobile
npx expo install nativewind@preview react-native-css react-native-reanimated react-native-safe-area-context
npx expo install --dev tailwindcss @tailwindcss/postcss postcss
```

**postcss.config.mjs** (required):
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**metro.config.js:**
```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativewind(config, { input: "./global.css" });
```

**global.css** — CRITICAL: use individual imports, NOT `@import "tailwindcss"`:
```css
@import "tailwindcss/theme.css";
@import "tailwindcss/preflight.css";
@import "tailwindcss/utilities.css";
@import "nativewind/theme";
```

Then import `"../global.css"` in the root layout/App component.

**Known bugs and caveats:**
- `@import` statements in global.css can cause deserialization errors on iOS/Android — pin `lightningcss` version to mitigate
- React Native `<Modal>` component may break after adding `withNativeWind` to metro config
- `backdrop-filter` is NOT supported in React Native — glass effects need platform-specific handling
- Test on a real device/emulator, not just Expo Go (NativeWind v5 requires dev builds)
- Migration from v4 to v5 can be challenging — since this is a fresh install, follow v5 docs directly

### Tailwind CSS v4 Configuration (Web)

Tailwind CSS v4.1 (stable) uses a **CSS-first configuration** approach:
- Design tokens defined via `@theme` blocks in CSS (replaces `tailwind.config.js`)
- JS-based presets still supported but CSS `@theme` is the recommended path
- Vite integration via `@tailwindcss/vite` plugin

```bash
cd apps/web
pnpm add tailwindcss @tailwindcss/vite
```

**Shared Token Strategy:** The recommended approach for sharing tokens between web (Tailwind v4) and mobile (NativeWind v5) is a **shared CSS preset file** using `@theme` directives. Both platforms consume the same CSS file:

```css
/* packages/ui/src/theme.css — shared design tokens */
@theme {
  --color-primary: #6ee9e0;
  --color-primary-container: #4ecdc4;
  --color-secondary: #c8bfff;
  /* ... all tokens ... */
  --font-display: "Manrope", sans-serif;
  --font-body: "Inter", sans-serif;
}
```

Web app imports it: `@import "../../packages/ui/src/theme.css";`
Mobile app imports it in global.css after the NativeWind imports.

For monorepos, add `@source` directives to tell Tailwind where to scan for class usage:
```css
@source "../../packages/ui/src/**/*.{ts,tsx}";
```

**Important decision:** The token TypeScript files (`packages/ui/src/tokens/*.ts`) remain the source of truth for programmatic access. The CSS `@theme` file and the TS token files must stay in sync. Consider generating one from the other or maintaining both carefully.

### Previous Story Intelligence (Story 1.1)

**Key learnings from Story 1.1:**
- Expo SDK 55 uses React Native 0.83.2, React 19.2.0 — New Architecture only, no legacy flags
- Vite v6 is in use (not v8 — v8 dropped React templates)
- `@fastify/websocket` is v11.2.0
- Vitest v4.1.0 is installed (not v3 as originally spec'd) — uses `projects` feature
- Monorepo uses pnpm workspaces with `workspace:*` protocol
- `packages/ui` currently has only a placeholder `UI_VERSION` export
- Package entry points use `src/index.ts` directly (no build step needed for dev)
- TypeScript ~5.8 with strict mode enabled via tsconfig.base.json
- Expo's tsconfig extends `expo/tsconfig.base` (not the project's tsconfig.base.json directly)

**File structure established:**
```
packages/ui/
  src/index.ts          # Currently: export const UI_VERSION = '0.0.0'
  package.json          # @jellysync/ui, main: src/index.ts
  tsconfig.json
```

**Debug notes from 1.1:** The dev cautioned that NativeWind v5 is pre-release. This story IS the NativeWind installation — proceed carefully, check latest docs, and be prepared for API changes.

### What NOT To Do

- Do NOT create UI components (GlassHeader, ActionCard, PosterGrid, etc.) — those come in Stories 1.3-1.4
- Do NOT install Zustand, TanStack Query, Expo Router, or React Router — those come in Story 1.3
- Do NOT set up navigation — that's Story 1.3
- Do NOT create feature directories (auth/, room/, etc.) inside apps — keep apps at scaffold state
- Do NOT use pure #FFFFFF anywhere — the lightest text color is on_surface (#e5e2e1)
- Do NOT use 1px solid borders — the design system uses tonal shifts and ghost borders (outline_variant at 15% opacity)
- Do NOT modify the Fastify server or packages/shared — this story is UI-only

### File Structure After Completion

```
packages/ui/
  src/
    tokens/
      colors.ts           # 16 color token definitions (TypeScript, programmatic access)
      typography.ts        # Font families, weights, sizes, roles
      spacing.ts           # 7-token spacing scale
      radius.ts            # Corner radius tokens
      index.ts             # Barrel export
    theme.css              # Shared @theme block — CSS custom properties for Tailwind v4/NativeWind v5
    utilities.css          # Custom utility classes (glass, gradient-primary)
    index.ts               # Updated: re-exports tokens
  package.json             # Updated: exports field for CSS + TS

apps/mobile/
  global.css               # NEW: NativeWind v5 imports + shared theme.css
  metro.config.js          # NEW: withNativeWind wrapper
  postcss.config.mjs       # NEW: @tailwindcss/postcss plugin
  App.tsx                  # MODIFIED: Font loading + global.css import
  package.json             # MODIFIED: +nativewind@preview, +react-native-css, +react-native-reanimated, +expo-font, +@expo-google-fonts/*

apps/web/
  vite.config.ts           # MODIFIED: +@tailwindcss/vite plugin
  src/
    index.css              # MODIFIED: @import "tailwindcss" + shared theme.css + @font-face
  public/fonts/            # NEW: Manrope + Inter woff2 files (if self-hosting)
  package.json             # MODIFIED: +tailwindcss, +@tailwindcss/vite
```

### Project Structure Notes

- All token definitions go in `packages/ui/src/tokens/` — this keeps the UI package organized for future component additions
- The Tailwind preset is the bridge between raw tokens and both apps' Tailwind configurations
- Font loading is platform-specific by nature: `expo-font` on mobile, `@font-face` on web
- The `packages/ui/package.json` exports field should include both the main entry and the preset path

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Color System, Typography System, Spacing & Layout Foundation, Corner Radius, Glassmorphism]
- [Source: _bmad-output/planning-artifacts/architecture.md — NativeWind v5, Tailwind CSS v4, Shared Design Tokens, packages/ui structure]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1 Story 1.2 acceptance criteria, UX-DR1 through UX-DR5]
- [Source: _bmad-output/planning-artifacts/prd.md — Cross-Platform Requirements, Platform Strategy]
- [Source: _bmad-output/implementation-artifacts/1-1-monorepo-initialization-and-shared-package-setup.md — Previous story learnings, established patterns]
- [Source: NativeWind v5 docs — https://www.nativewind.dev/v5]
- [Source: Tailwind CSS v4 docs — https://tailwindcss.com/docs]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1: Created all 4 token modules (colors, typography, spacing, radius) with barrel exports. Added vitest config and 16 passing tests. All token values match spec exactly.
- Task 2: Created theme.css with @theme block (all 16 colors, font families, spacing, radius as CSS custom properties). Created utilities.css with glass and gradient-primary utility classes. Updated package.json exports.
- Task 3: Installed NativeWind v5 preview + peers (nativewind@5.0.0-preview.3, react-native-css, react-native-reanimated@4.2.1, react-native-safe-area-context, tailwindcss@4.2.2, @tailwindcss/postcss, postcss). Created global.css, postcss.config.mjs, updated metro.config.js with withNativeWind. Updated App.tsx to use token-based className props.
- Task 4: Installed tailwindcss@4.2.2 and @tailwindcss/vite for web. Added @tailwindcss/vite plugin to vite.config.ts. Updated index.css with Tailwind imports, shared theme/utilities via package exports, and @source directive. Vite build succeeds.
- Task 5: Installed expo-font, expo-splash-screen, @expo-google-fonts/manrope, @expo-google-fonts/inter. Updated App.tsx with useFonts hook and SplashScreen integration. Downloaded Manrope (700, 800) and Inter (400, 500, 600) woff2 files to apps/web/public/fonts/. Added @font-face declarations with font-display: swap.
- Task 6: Created TokenShowcase component showing all colors, typography, spacing, radius, glassmorphism, and gradient-primary. Verified no #FFFFFF in tokens. pnpm build, pnpm lint, pnpm test all pass with 0 errors. 17 total tests (16 new UI + 1 existing shared).

### Change Log

- 2026-03-22: Implemented complete design system tokens — all 16 colors, 6 typography roles, 7 spacing tokens, 3 radius tokens. Created shared CSS theme (theme.css) and utilities (utilities.css) for Tailwind v4/NativeWind v5 consumption. Configured NativeWind v5 for mobile with expo-font loading. Configured Tailwind CSS v4 for web with @font-face declarations. Built token showcase component for visual verification.
- 2026-03-22: Code review fixes — Fixed invalid Tailwind spacing class names in TokenShowcase (p-spacing-6 → p-6 etc.), registered fonts under base family names (Manrope/Inter) for NativeWind resolution, replaced onLayout splash hide with useEffect + fontError handling to prevent splash freeze, changed splash backgroundColor from #ffffff to #131313, changed userInterfaceStyle from light to dark.

### File List

- packages/ui/src/tokens/colors.ts (new)
- packages/ui/src/tokens/typography.ts (new)
- packages/ui/src/tokens/spacing.ts (new)
- packages/ui/src/tokens/radius.ts (new)
- packages/ui/src/tokens/index.ts (new)
- packages/ui/src/tokens/colors.test.ts (new)
- packages/ui/src/tokens/typography.test.ts (new)
- packages/ui/src/tokens/spacing.test.ts (new)
- packages/ui/src/tokens/radius.test.ts (new)
- packages/ui/src/index.ts (modified)
- packages/ui/package.json (modified)
- packages/ui/vitest.config.ts (new)
- packages/ui/src/theme.css (new)
- packages/ui/src/utilities.css (new)
- apps/mobile/global.css (new)
- apps/mobile/postcss.config.mjs (new)
- apps/mobile/metro.config.js (modified)
- apps/mobile/App.tsx (modified)
- apps/mobile/package.json (modified)
- apps/web/vite.config.ts (modified)
- apps/web/src/index.css (modified)
- apps/web/package.json (modified)
- apps/web/public/fonts/Manrope-Bold.woff2 (new)
- apps/web/public/fonts/Manrope-ExtraBold.woff2 (new)
- apps/web/public/fonts/Inter-Regular.woff2 (new)
- apps/web/public/fonts/Inter-Medium.woff2 (new)
- apps/web/public/fonts/Inter-SemiBold.woff2 (new)
- apps/web/src/App.tsx (modified)
- apps/web/src/App.css (unchanged, no longer imported)
- apps/web/src/TokenShowcase.tsx (new)
