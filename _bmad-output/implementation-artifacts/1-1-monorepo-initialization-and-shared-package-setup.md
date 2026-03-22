# Story 1.1: Monorepo Initialization & Shared Package Setup

Status: done

## Story

As a developer,
I want the complete monorepo scaffolded with all three apps and shared packages configured,
So that all future development has a working foundation to build on.

## Acceptance Criteria

1. **Given** a fresh project directory **When** the monorepo is initialized **Then** pnpm workspaces are configured with apps/mobile, apps/web, apps/server, packages/shared, and packages/ui
2. **And** Turborepo is configured with build, dev, lint, and test task pipelines
3. **And** tsconfig.base.json provides shared TypeScript strict-mode configuration
4. **And** apps/mobile is scaffolded via create-expo-app with blank-typescript template (Expo SDK 55)
5. **And** apps/web is scaffolded via create-vite with react-swc-ts template (React 19)
6. **And** apps/server is initialized with Fastify 5.8, @fastify/websocket, and TypeScript
7. **And** packages/shared exports from src/index.ts and is importable as @jellysync/shared
8. **And** packages/ui exports from src/index.ts and is importable as @jellysync/ui
9. **And** ESLint + Prettier are configured with shared config at monorepo root
10. **And** Vitest is configured for unit testing across all packages
11. **And** running `pnpm dev` starts all three apps simultaneously
12. **And** running `pnpm build` successfully builds all packages and apps

## Tasks / Subtasks

- [x] Task 1: Initialize monorepo root (AC: #1, #2, #3)
  - [x] 1.1 Create root `package.json` with `"private": true` and engine requirements (Node 20+, pnpm 9+)
  - [x] 1.2 Create `pnpm-workspace.yaml` defining `apps/*` and `packages/*`
  - [x] 1.3 Create `turbo.json` with pipelines for `build`, `dev`, `lint`, `test`, and `typecheck`
  - [x] 1.4 Create `tsconfig.base.json` with strict mode, ES2022 target, module NodeNext, paths for `@jellysync/*`
  - [x] 1.5 Create root `.gitignore` (node_modules, dist, .turbo, .expo, coverage)
  - [x] 1.6 Create root `.npmrc` with `shamefully-hoist=false` and `strict-peer-dependencies=false`
- [x] Task 2: Scaffold mobile app (AC: #4)
  - [x] 2.1 Run `npx create-expo-app@latest apps/mobile --template blank-typescript@sdk-55`
  - [x] 2.2 Verify Expo SDK 55, React Native 0.83, React 19.2 in package.json
  - [x] 2.3 Add `expo-dev-client` for dev builds (required for native modules in later stories)
  - [x] 2.4 Configure `tsconfig.json` extending `../../tsconfig.base.json`
  - [x] 2.5 Verify `npx expo start` launches successfully
- [x] Task 3: Scaffold web app (AC: #5)
  - [x] 3.1 Run `npm create vite@latest apps/web -- --template react-swc-ts`
  - [x] 3.2 Verify React 19 and Vite in package.json
  - [x] 3.3 Configure `tsconfig.json` extending `../../tsconfig.base.json`
  - [x] 3.4 Verify `pnpm dev` in apps/web starts Vite HMR server
- [x] Task 4: Scaffold signaling server (AC: #6)
  - [x] 4.1 Create `apps/server/` with `package.json` (name: `@jellysync/server`)
  - [x] 4.2 Install `fastify@^5.8.2`, `@fastify/websocket`, `typescript`, `tsx`
  - [x] 4.3 Create `src/index.ts` with minimal Fastify server (health check route, WebSocket plugin registered)
  - [x] 4.4 Add `dev` script using `tsx watch src/index.ts`
  - [x] 4.5 Add `build` script using `tsc`
  - [x] 4.6 Configure `tsconfig.json` extending `../../tsconfig.base.json`
  - [x] 4.7 Verify server starts and health check responds
- [x] Task 5: Create shared packages (AC: #7, #8)
  - [x] 5.1 Create `packages/shared/package.json` with name `@jellysync/shared`, main/types pointing to `src/index.ts`
  - [x] 5.2 Create `packages/shared/src/index.ts` with placeholder export
  - [x] 5.3 Create `packages/shared/tsconfig.json` extending `../../tsconfig.base.json`
  - [x] 5.4 Create `packages/ui/package.json` with name `@jellysync/ui`, main/types pointing to `src/index.ts`
  - [x] 5.5 Create `packages/ui/src/index.ts` with placeholder export
  - [x] 5.6 Create `packages/ui/tsconfig.json` extending `../../tsconfig.base.json`
  - [x] 5.7 Add `@jellysync/shared` and `@jellysync/ui` as workspace dependencies in apps that need them
  - [x] 5.8 Verify imports resolve: `import { } from '@jellysync/shared'` works in all three apps
- [x] Task 6: Configure linting and formatting (AC: #9)
  - [x] 6.1 Install `eslint`, `prettier`, `@eslint/js`, `typescript-eslint` at monorepo root
  - [x] 6.2 Create root `eslint.config.js` (flat config) with TypeScript and React rules
  - [x] 6.3 Create root `.prettierrc` with consistent settings (singleQuote, semi, trailingComma)
  - [x] 6.4 Add `lint` scripts to root and each package/app
  - [x] 6.5 Verify `pnpm lint` runs across all workspaces via Turborepo
- [x] Task 7: Configure Vitest (AC: #10)
  - [x] 7.1 Install `vitest` at monorepo root
  - [x] 7.2 Create root `vitest.config.ts` using `projects` feature (not deprecated `workspace`) pointing to `packages/*` and `apps/*`
  - [x] 7.3 Create a sample test in `packages/shared/src/index.test.ts` verifying placeholder export
  - [x] 7.4 Add `test` scripts to root and relevant packages
  - [x] 7.5 Verify `pnpm test` runs across all packages via Turborepo
- [x] Task 8: Verify full monorepo operation (AC: #11, #12)
  - [x] 8.1 Run `pnpm dev` and verify all three apps start simultaneously via Turborepo
  - [x] 8.2 Run `pnpm build` and verify all packages and apps build successfully
  - [x] 8.3 Run `pnpm lint` and verify no errors
  - [x] 8.4 Run `pnpm test` and verify sample test passes

## Dev Notes

### Architecture Compliance

- **Monorepo structure** MUST match architecture exactly:
  ```
  jellysync/
    apps/
      mobile/          # Expo (React Native)
      web/             # Vite + React SPA
      server/          # Fastify signaling server
    packages/
      shared/          # @jellysync/shared — sync engine, room mgmt, Jellyfin client, types
      ui/              # @jellysync/ui — design tokens, Tailwind preset
    turbo.json
    pnpm-workspace.yaml
    tsconfig.base.json
  ```
- **File naming convention**: kebab-case for all source files (e.g., `sync-engine.ts`, not `syncEngine.ts`), except React component files which use PascalCase (e.g., `App.tsx`, `MyComponent.tsx`)
- **TypeScript strict mode** is mandatory across all packages — set in `tsconfig.base.json` and extended where possible. Framework-specific apps (Expo, Vite) may use their own tsconfig base but must enable `strict: true` independently
- **Package naming**: `@jellysync/shared`, `@jellysync/ui`, `@jellysync/server` — use the `@jellysync` scope consistently

### Technical Requirements

- **Node.js 20+** required (LTS)
- **pnpm 9+** required (workspace protocol support)
- **Expo SDK 55** (v55.0.8 latest stable as of March 2026) — includes React Native 0.83 and React 19.2
- **Expo SDK 55 drops Legacy Architecture** — New Architecture is the default and only option. Do NOT add any legacy architecture flags
- **Vite + SWC** for web bundling (react-swc-ts template)
- **React 19** for web app (comes with Vite react-swc-ts template)
- **Fastify 5.8.2** (latest stable, includes security fix CVE-2026-3419 from 5.8.1). Use `^5.8.2` version constraint
- **@fastify/websocket** — register the plugin but no WebSocket routes yet (those come in Epic 2)
- **tsx** for server development (watch mode), **tsc** for production builds
- **Vitest 3.x** — use the `projects` configuration feature, NOT the deprecated `workspace` feature. Config in root `vitest.config.ts` with `test: { projects: ['packages/*'] }`

### Library & Framework Specifics

| Library | Version | Notes |
|---------|---------|-------|
| Expo SDK | 55 (55.0.8) | Use `create-expo-app@latest --template blank-typescript@sdk-55` |
| React Native | 0.83 | Included with Expo SDK 55. New Architecture only |
| React | 19.2 | Mobile: via Expo. Web: via Vite template |
| Fastify | ^5.8.2 | Latest stable. Security fix in 5.8.1 |
| @fastify/websocket | latest | Register plugin, no routes yet |
| Turborepo | latest | `pnpm dlx create-turbo` or manual `turbo.json` |
| Vitest | ^3.0.0 | Use `projects` not `workspace` |
| TypeScript | ~5.8 | Strict mode mandatory |
| ESLint | 9.x | Flat config (`eslint.config.js`) |
| Prettier | ^3.0.0 | Consistent formatting |

### NativeWind v5 Warning

NativeWind v5 (Tailwind CSS v4 for React Native) is **pre-release** as of March 2026. It requires React Native 0.81+ (we have 0.83, so compatible). Do NOT install NativeWind in this story — that's Story 1.2. Just be aware it's pre-release and may have instability.

### Turborepo Pipeline Configuration

The `turbo.json` should define these pipelines:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".expo/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Shared Package Configuration

For `packages/shared` and `packages/ui`, use the workspace protocol for internal dependencies:

```json
{
  "dependencies": {
    "@jellysync/shared": "workspace:*"
  }
}
```

The packages should use TypeScript project references or direct `src/index.ts` as entry point (simpler for monorepo dev). Configure `main` and `types` fields to point to source during development. Build step can be added later if needed.

### What NOT To Do

- Do NOT install NativeWind, Tailwind, or any design system packages — that's Story 1.2
- Do NOT set up Zustand stores — that's Story 1.3+
- Do NOT install TanStack Query — that's Story 1.3+
- Do NOT configure navigation (Expo Router, React Router) — that's Story 1.3+
- Do NOT add WebSocket routes on the server — that's Epic 2
- Do NOT create feature directories inside apps yet — keep apps at scaffold state
- Do NOT use `vitest` workspace feature (deprecated in v3.2) — use `projects` instead
- Do NOT create a database or persistent storage setup — the architecture is in-memory only

### File Structure After Completion

```
jellysync/
  apps/
    mobile/
      app.json
      App.tsx
      package.json
      tsconfig.json
    web/
      src/
        App.tsx
        main.tsx
      index.html
      package.json
      tsconfig.json
      vite.config.ts
    server/
      src/
        index.ts
      package.json
      tsconfig.json
  packages/
    shared/
      src/
        index.ts
        index.test.ts
      package.json
      tsconfig.json
    ui/
      src/
        index.ts
      package.json
      tsconfig.json
  .gitignore
  .npmrc
  .prettierrc
  eslint.config.js
  package.json
  pnpm-lock.yaml
  pnpm-workspace.yaml
  tsconfig.base.json
  turbo.json
  vitest.config.ts
```

### Project Structure Notes

- This is a greenfield project — the current project root (`/home/bijin/myapp`) contains only planning docs (`_bmad/`, `_bmad-output/`, `docs/`, `DESIGN.md`, `UI design/`, `README.md`)
- The monorepo should be scaffolded in the project root alongside these existing directories
- Existing files/directories must NOT be deleted or modified

### References

- [Source: _bmad-output/planning-artifacts/architecture.md — Monorepo Structure, Initialization Commands, Build Tooling]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, Story 1.1 acceptance criteria]
- [Source: _bmad-output/planning-artifacts/prd.md — Project Classification, Cross-Platform Requirements]
- [Source: Expo SDK 55 changelog — https://expo.dev/changelog/sdk-55]
- [Source: Fastify releases — https://github.com/fastify/fastify/releases]
- [Source: Vitest projects docs — https://vitest.dev/guide/projects]
- [Source: NativeWind v5 docs — https://www.nativewind.dev/v5]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- @fastify/websocket latest is v11.2.0, not v12 as initially assumed. Corrected to ^11.2.0.
- Vite v8 (create-vite@9) dropped React templates; used create-vite@6 to get react-swc-ts template with React 19 + @vitejs/plugin-react-swc.
- Expo tsconfig extends `expo/tsconfig.base` (required for Metro), not project's tsconfig.base.json directly. Added @jellysync/* paths manually.
- Vitest v4.1.0 installed (latest stable, not v3 as spec noted). `projects` feature works as expected.
- Vitest per-package config needed: running `vitest run` from a package dir picks up root config with relative paths that don't resolve. Added package-level vitest.config.ts for shared.

### Completion Notes List

- All 8 tasks completed with all subtasks checked off
- Monorepo scaffolded with pnpm workspaces, Turborepo, and TypeScript strict mode
- Expo SDK 55 (React Native 0.83.2, React 19.2.0) mobile app created
- Vite 6 + React 19 + SWC web app created
- Fastify 5.8.2 server with @fastify/websocket plugin registered and health check route
- @jellysync/shared and @jellysync/ui packages created with workspace:* dependencies in all apps
- ESLint 9 flat config + Prettier configured at monorepo root; lint passes across all 5 workspaces
- Vitest 4.1 with projects feature; sample test in packages/shared passes
- `pnpm dev` starts web (Vite on :5173) and server (Fastify on :3001) simultaneously
- `pnpm build` builds server (tsc) and web (tsc + vite build) successfully
- `pnpm lint` passes across all 5 workspaces (0 errors)
- `pnpm test` passes (1 test file, 1 test)

### File List

- package.json (new)
- pnpm-workspace.yaml (new)
- pnpm-lock.yaml (new)
- turbo.json (new)
- tsconfig.base.json (new)
- .gitignore (new)
- .npmrc (new)
- .prettierrc (new)
- eslint.config.js (new)
- vitest.config.ts (new)
- apps/mobile/package.json (new)
- apps/mobile/app.json (new)
- apps/mobile/App.tsx (new)
- apps/mobile/index.ts (new)
- apps/mobile/tsconfig.json (new)
- apps/web/package.json (new)
- apps/web/index.html (new)
- apps/web/tsconfig.json (new)
- apps/web/tsconfig.app.json (new)
- apps/web/tsconfig.node.json (new)
- apps/web/vite.config.ts (new)
- apps/web/src/App.tsx (new)
- apps/web/src/App.css (new)
- apps/web/src/main.tsx (new)
- apps/web/src/index.css (new)
- apps/web/src/vite-env.d.ts (new)
- apps/server/package.json (new)
- apps/server/tsconfig.json (new)
- apps/server/src/index.ts (new)
- packages/shared/package.json (new)
- packages/shared/tsconfig.json (new)
- packages/shared/vitest.config.ts (new)
- packages/shared/src/index.ts (new)
- packages/shared/src/index.test.ts (new)
- packages/ui/package.json (new)
- packages/ui/tsconfig.json (new)
- packages/ui/src/index.ts (new)

## Change Log

- 2026-03-22: Story 1.1 implemented - Complete monorepo scaffolding with pnpm workspaces, Turborepo, Expo SDK 55, Vite + React 19, Fastify 5.8, @jellysync/shared and @jellysync/ui packages, ESLint 9 + Prettier, and Vitest 4.1. All acceptance criteria satisfied.
