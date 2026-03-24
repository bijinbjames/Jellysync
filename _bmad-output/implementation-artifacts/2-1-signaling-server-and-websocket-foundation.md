# Story 2.1: Signaling Server & WebSocket Foundation

Status: review

## Story

As a developer,
I want a signaling server with WebSocket support and typed message protocol,
So that clients can communicate in real-time for room management and future sync/voice features.

## Acceptance Criteria

1. **Given** the Fastify signaling server is running **When** a client connects via WebSocket **Then** the connection is established over WSS (NFR18) **And** the server accepts typed JSON messages following the WsMessage format: `{ type: string, payload: T, timestamp: number }` **And** message types use the `room:*` namespace with discriminated union types (room:create, room:join, room:leave, room:close, room:state) **And** all message type definitions are in `packages/shared/src/protocol/messages.ts`, shared between client and server **And** the server validates incoming message types and returns WsError with user-friendly messages for invalid messages

2. **Given** the server has room management capability **When** a `room:create` message is received **Then** a new room is created in memory with a unique 6-character alphanumeric code **And** the room is stored in an in-memory Map (no database) **And** the creating client is registered as the host participant **And** the server responds with `room:state` containing the room code, participant list, and host ID

3. **Given** a client WebSocket connection drops unexpectedly **When** the connection is lost **Then** the client-side WebSocket hook (`useWebSocket`) automatically reconnects with exponential backoff (1s, 2s, 4s, 8s, max 30s) **And** on reconnect, the client sends `room:rejoin` with the last known room code **And** the server responds with full current room state

## Tasks / Subtasks

- [x] Task 1: Create shared protocol types in `packages/shared/src/protocol/` (AC: #1)
  - [x] 1.1 Create `packages/shared/src/protocol/messages.ts` — Define `WsMessage<T>`, `WsError`, and all `room:*` discriminated union types (`RoomCreateMessage`, `RoomJoinMessage`, `RoomLeaveMessage`, `RoomCloseMessage`, `RoomStateMessage`, `RoomRejoinMessage`)
  - [x] 1.2 Create `packages/shared/src/protocol/constants.ts` — Message namespace constants, error codes (`ROOM_NOT_FOUND`, `ROOM_FULL`, `INVALID_MESSAGE`, etc.), and room config constants (code length, max participants)
  - [x] 1.3 Create `packages/shared/src/protocol/index.ts` — Barrel exports
  - [x] 1.4 Create `packages/shared/src/protocol/messages.test.ts` — Type guard tests, message validation tests
  - [x] 1.5 Update `packages/shared/src/index.ts` — Add `export * from './protocol/index.js'`

- [x] Task 2: Implement room management on server (AC: #2)
  - [x] 2.1 Create `apps/server/src/rooms/types.ts` — `Room` interface (code, hostId, participants Map, createdAt), `Participant` interface (id, displayName, joinedAt, isHost)
  - [x] 2.2 Create `apps/server/src/rooms/room-code.ts` — 6-character alphanumeric code generator with collision detection against active rooms
  - [x] 2.3 Create `apps/server/src/rooms/room-code.test.ts` — Tests for uniqueness, format, collision avoidance
  - [x] 2.4 Create `apps/server/src/rooms/room-manager.ts` — `RoomManager` class with in-memory Map: `createRoom(hostId, displayName)`, `joinRoom(code, participantId, displayName)`, `leaveRoom(code, participantId)`, `getRoom(code)`, `getRoomByParticipant(participantId)`, `removeParticipant(participantId)`, host transfer logic (first in join order)
  - [x] 2.5 Create `apps/server/src/rooms/room-manager.test.ts` — Tests for create, join, leave, host transfer, room destruction when empty, invalid code handling
  - [x] 2.6 Create `apps/server/src/rooms/index.ts` — Barrel exports

- [x] Task 3: Implement WebSocket message handler on server (AC: #1, #2)
  - [x] 3.1 Create `apps/server/src/signaling/ws-handler.ts` — WebSocket route handler: parse incoming JSON, validate message type, dispatch to room manager, broadcast state updates to room participants
  - [x] 3.2 Create `apps/server/src/signaling/ws-handler.test.ts` — Tests for message routing, invalid message handling, broadcast behavior
  - [x] 3.3 Create `apps/server/src/signaling/index.ts` — Barrel exports
  - [x] 3.4 Update `apps/server/src/index.ts` — Register WebSocket route with ws-handler, wire up RoomManager instance

- [x] Task 4: Create client-side WebSocket hook and provider (AC: #3)
  - [x] 4.1 Create `apps/mobile/src/shared/hooks/use-websocket.ts` — `useWebSocket` hook: connect to signaling server URL (from `useAuthStore.serverUrl`), auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s), typed message send/receive, connection state tracking
  - [x] 4.2 Create `apps/mobile/src/shared/providers/websocket-provider.tsx` — React context provider wrapping `useWebSocket`, makes send/subscribe functions available to children
  - [x] 4.3 Create equivalent files for web: `apps/web/src/shared/hooks/use-websocket.ts` and `apps/web/src/shared/providers/websocket-provider.tsx`
  - [x] 4.4 Wire `WebSocketProvider` into root layouts: `apps/mobile/app/_layout.tsx` (inside AuthGate, only when authenticated) and `apps/web/src/app.tsx` (inside AuthGuard)

- [x] Task 5: Create client-side room store (AC: #2, #3)
  - [x] 5.1 Create `packages/shared/src/stores/room-store.ts` — Zustand store: `roomCode`, `participants`, `isHost`, `hostId`, `connectionState` ('disconnected' | 'connecting' | 'connected'), actions: `setRoom`, `addParticipant`, `removeParticipant`, `updateHost`, `clearRoom`
  - [x] 5.2 Create `packages/shared/src/stores/room-store.test.ts` — Tests for all state transitions
  - [x] 5.3 Update `packages/shared/src/stores/index.ts` — Export room store factory

- [x] Task 6: Set up server testing infrastructure (AC: #1, #2)
  - [x] 6.1 Add `vitest` to `apps/server/package.json` devDependencies
  - [x] 6.2 Create `apps/server/vitest.config.ts`
  - [x] 6.3 Update `apps/server/package.json` test script: `"test": "vitest run"`

- [x] Task 7: Integration verification (AC: #1-3)
  - [x] 7.1 Run `pnpm build` — all workspaces compile without errors
  - [x] 7.2 Run `pnpm test` — all new and existing tests pass
  - [x] 7.3 Run `pnpm lint` — no new lint errors (only pre-existing lint issues in mobile tailwind.config.js and shared .js build artifacts)
  - [x] 7.4 Manual verification deferred — WebSocket handler integration tests cover room:create -> room:state flow end-to-end

## Dev Notes

### Architecture Compliance

- **Server is minimal bootstrap only.** The existing `apps/server/src/index.ts` has Fastify + @fastify/websocket registered with a `/health` endpoint. Build on this — do not restructure or add unnecessary abstractions.
- **In-memory room state only.** Use a JavaScript `Map<string, Room>` for room storage. No database, no persistence. Rooms are ephemeral — lost on server restart by design. [Source: architecture.md — Server State Management]
- **Server-authoritative model.** Clients send intents, server validates and broadcasts confirmed state. Server owns all room state and timestamps. [Source: architecture.md — WebSocket Protocol Rules]
- **Shared types are the contract.** All message types in `packages/shared/src/protocol/messages.ts` are consumed by both server and client. Changes must be made in shared, never duplicated.
- **No HTTP REST endpoints.** The signaling server uses WebSocket only (plus `/health` and future static file serving). Do not add REST routes for room operations. [Source: architecture.md — Single Connection Model]
- **Pino logger.** Fastify uses Pino by default (`logger: true` already set). Use `server.log` / `request.log` for structured logging. Do not add a separate logging library. [Source: architecture.md — Logging]

### WebSocket Protocol Specification

**Message format:**
```typescript
interface WsMessage<T = unknown> {
  type: string;          // e.g., 'room:create'
  payload: T;            // typed per message type
  timestamp: number;     // Unix milliseconds
}
```

**Error format:**
```typescript
interface WsError {
  type: 'error';
  payload: {
    code: string;        // e.g., 'ROOM_NOT_FOUND'
    message: string;     // User-friendly, non-technical
    context?: string;    // The message type that caused the error
  };
}
```

**Message types for this story (room:\* namespace):**
- `room:create` — Client requests room creation. Payload: `{ displayName: string }`
- `room:join` — Client requests to join. Payload: `{ roomCode: string, displayName: string }`
- `room:rejoin` — Client reconnects to room. Payload: `{ roomCode: string, participantId: string }`
- `room:leave` — Client exits room. Payload: `{}` (server knows which room from connection tracking)
- `room:close` — Server broadcasts room closure. Payload: `{ reason: string }`
- `room:state` — Server broadcasts full room state. Payload: `{ roomCode: string, hostId: string, participants: Participant[] }`

**Naming convention:** `namespace:action` — lowercase, colon-separated. [Source: architecture.md — WebSocket Message Types]

**Timestamps:** All timestamps in protocol messages are Unix milliseconds (number). No ISO strings. [Source: architecture.md — Date/Time in Protocol]

### Room Code Generation

- 6-character alphanumeric (uppercase letters + digits, excluding ambiguous characters: 0/O, 1/I/L)
- Check against active rooms Map to avoid collisions
- Codes are ephemeral — released when room is destroyed
- Display format in UI will be "XXX-XXX" but stored/transmitted as "XXXXXX"

### Room Management Rules

- **Host transfer:** When host disconnects, first participant by join order becomes new host. Broadcast `room:state` to all remaining participants. [Source: epics.md — Story 2.5]
- **Room destruction:** When last participant leaves, remove room from Map, release room code. [Source: epics.md — Story 2.5]
- **Participant tracking:** Server tracks WebSocket connection → participant mapping. When connection closes, participant is removed from room. [Source: architecture.md — Server State]
- **No room size limit for MVP** — but include a configurable max in constants for future use.

### Client WebSocket Hook Design

```typescript
// useWebSocket hook API
interface UseWebSocket {
  connectionState: 'disconnected' | 'connecting' | 'connected';
  send: <T>(message: WsMessage<T>) => void;
  subscribe: (type: string, handler: (message: WsMessage) => void) => () => void;
  disconnect: () => void;
}
```

- **Connection URL:** Derive from `useAuthStore.serverUrl` — replace `http://` with `ws://`, `https://` with `wss://`, append `/ws` path.
- **Auto-reconnect:** Exponential backoff: 1s, 2s, 4s, 8s, max 30s. Reset backoff timer on successful connection.
- **Message dispatch:** Central `handleMessage()` function routes incoming messages to subscribed handlers and updates Zustand stores. [Source: architecture.md — Data Flow]
- **Reconnect with room rejoin:** On reconnect, if `useRoomStore.roomCode` is set, automatically send `room:rejoin`. Server responds with full current state.
- **Connect only when authenticated:** WebSocket connection should only be established when `useAuthStore.isAuthenticated` is true. Wire provider inside auth gates.

### Room Store Design

```typescript
// packages/shared/src/stores/room-store.ts
interface RoomState {
  roomCode: string | null;
  participants: Participant[];
  hostId: string | null;
  isHost: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected';
  // Actions
  setRoom: (code: string, hostId: string, participants: Participant[]) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (id: string) => void;
  updateHost: (newHostId: string) => void;
  clearRoom: () => void;
  setConnectionState: (state: 'disconnected' | 'connecting' | 'connected') => void;
}
```

- Follow the `createRoomStore(storage)` factory pattern established by `createAuthStore`. [Source: packages/shared/src/stores/auth-store.ts]
- Room store does NOT use persist middleware — room state is ephemeral. Only `roomCode` may be kept in memory for reconnection.
- `isHost` is derived: compare `hostId` against local participant ID.

### Server File Structure (target)

```
apps/server/
└── src/
    ├── index.ts                 # MODIFY: Register WS route, instantiate RoomManager
    ├── rooms/
    │   ├── types.ts             # CREATE: Room, Participant interfaces
    │   ├── room-code.ts         # CREATE: 6-char code generator
    │   ├── room-code.test.ts    # CREATE: Code generation tests
    │   ├── room-manager.ts      # CREATE: In-memory room state management
    │   ├── room-manager.test.ts # CREATE: Room lifecycle tests
    │   └── index.ts             # CREATE: Barrel exports
    ├── signaling/
    │   ├── ws-handler.ts        # CREATE: WebSocket message routing
    │   ├── ws-handler.test.ts   # CREATE: Message handling tests
    │   └── index.ts             # CREATE: Barrel exports
    └── utils/
        └── error-messages.ts    # CREATE: Error code → user-friendly message map
```

[Source: architecture.md — Server Structure]

### Shared Protocol Structure (target)

```
packages/shared/
└── src/
    ├── protocol/
    │   ├── messages.ts          # CREATE: WsMessage, WsError, room:* types
    │   ├── constants.ts         # CREATE: Namespaces, error codes, room config
    │   ├── messages.test.ts     # CREATE: Type guard and validation tests
    │   └── index.ts             # CREATE: Barrel exports
    ├── stores/
    │   ├── room-store.ts        # CREATE: Zustand room state store
    │   ├── room-store.test.ts   # CREATE: Store tests
    │   └── index.ts             # MODIFY: Add room store export
    └── index.ts                 # MODIFY: Add protocol export
```

### Client Structure (target — both mobile and web)

```
apps/[mobile|web]/src/
└── shared/
    ├── hooks/
    │   └── use-websocket.ts         # CREATE: WebSocket connection hook
    └── providers/
        └── websocket-provider.tsx   # CREATE: WebSocket React context provider
```

### Testing Requirements

- **Framework:** Vitest (already in `packages/shared`, add to `apps/server`)
- **Co-located tests:** `component.test.ts` next to `component.ts`
- **Server tests must not require a running server.** Test RoomManager and room-code as unit tests. Test ws-handler with mock WebSocket connections.
- **Minimum test coverage for this story:**
  - Room code: generation format, uniqueness, collision avoidance
  - Room manager: create, join, leave, host transfer, room destruction, invalid operations
  - Message protocol: type guards, validation, error formatting
  - Room store: all state transitions, derived isHost
  - WebSocket handler: message routing, error responses, broadcast

### What NOT To Do

- Do NOT add a database or any persistence layer — rooms are in-memory only
- Do NOT implement `sync:*`, `signal:*`, or `participant:*` message types — those are for later stories
- Do NOT implement the room lobby UI — that's Story 2.2
- Do NOT implement room code entry UI — that's Story 2.3
- Do NOT implement deep link handling — that's Story 2.4
- Do NOT implement host transfer UI or exit flows — that's Story 2.5 (but DO implement server-side host transfer logic as it's foundational)
- Do NOT add REST endpoints for room operations — WebSocket only
- Do NOT modify the auth store or auth flow — it works correctly
- Do NOT install new HTTP client libraries — use native WebSocket API on client
- Do NOT add `@fastify/static` yet — that's for deployment (Epic 6)
- Do NOT create a separate `apps/server/src/app.ts` unless needed for testability — keep the entry point simple

### Existing Dependencies to Leverage

- **@fastify/websocket 11.2.0** — Already installed in `apps/server/package.json`. Provides WebSocket upgrade handling on Fastify routes.
- **@jellysync/shared workspace:\*** — Already a dependency of `apps/server`. Protocol types will be importable immediately.
- **Zustand 5.0.12** — Already in shared package for store definitions.
- **Vitest 4.1.0** — Already in shared package. Add to server package.

### Logout Integration Note

Story 1.5 noted: "any active WebSocket connections are closed" as a future requirement for logout. When implementing the WebSocket provider, expose a `disconnect()` function. In future work (not this story), the logout flow should call disconnect before clearing auth. For now, the WebSocket provider unmounting (when auth gate redirects to login) will handle cleanup.

### Performance Targets

- Room creation (server-side): respond with `room:state` within 50ms of receiving `room:create`
- Message validation and routing: < 10ms per message
- WebSocket connection establishment: < 1 second
- Reconnect with exponential backoff: 1s, 2s, 4s, 8s, max 30s

### Project Structure Notes

- Alignment with architecture.md file structure: all new files follow the prescribed directory layout exactly
- Server uses ESM (`"type": "module"` in package.json) — use `.js` extensions in imports per the established Metro/Node convention
- Shared package exports use `.js` extensions in import paths (e.g., `'./protocol/index.js'`) per existing pattern in `packages/shared/src/index.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.1 acceptance criteria and BDD scenarios]
- [Source: _bmad-output/planning-artifacts/architecture.md — WebSocket Protocol, Server Structure, Signaling Server, Room Management, Data Flow, Zustand Store Patterns]
- [Source: _bmad-output/planning-artifacts/prd.md — FR4-FR12 (Room Management), NFR8 (room creation < 3s), NFR18 (WSS transport security)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Room Lobby flow, Join Room flow, reconnection patterns, error handling patterns]
- [Source: apps/server/src/index.ts — Existing Fastify bootstrap with WebSocket plugin]
- [Source: apps/server/package.json — @fastify/websocket 11.2.0, @jellysync/shared workspace dependency]
- [Source: packages/shared/src/stores/auth-store.ts — Store factory pattern to follow for room-store]
- [Source: _bmad-output/implementation-artifacts/1-5-user-logout.md — WebSocket disconnect extensibility note]

### Previous Story Intelligence (Story 1.5)

- GlassHeader has `onAction`/`actionLabel` props on both platforms — don't break this interface
- Auth store access pattern: `useStore(authStore, selector)` — import from `apps/[mobile|web]/src/lib/auth.ts`
- `packages/ui` holds tokens/CSS only — no React components. New shared hooks go in `apps/[mobile|web]/src/shared/hooks/`
- NativeWind className works on RN components directly
- All 32 tests passing, builds clean
- Auth gates (`AuthGate` mobile, `AuthGuard` web) handle redirect on auth state change — WebSocket provider should be placed inside these gates

### Git Intelligence

5 commits total. Most recent work (Story 1.5) has uncommitted changes in mobile files (glass-header, action-card, login-form, index.tsx). Story 1.5 is in "review" status. The codebase has been stable with incremental fixes applied after the initial feature commit.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Server tsconfig paths removed to fix rootDir build error (paths mapped to shared source files outside rootDir)
- useRef<number> annotation added to fix const literal type inference with WS_RECONNECT values
- Fastify websocket plugin must be awaited before server.listen() in tests

### Completion Notes List

- Task 1: Created full protocol type system (WsMessage<T>, WsError, 6 room:* discriminated union types, type guards, factory functions, constants with error codes/messages). 16 tests.
- Task 2: Implemented RoomManager with in-memory Map storage, room code generation (6-char excluding ambiguous chars), host transfer on disconnect (first by join order), room auto-destruction when empty. 20 tests.
- Task 3: Created ws-handler with JSON validation, message type routing, room operations (create/join/rejoin/leave), broadcast to room participants, connection close cleanup. 9 integration tests with real Fastify+WebSocket server.
- Task 4: Created useWebSocket hook for both mobile and web with exponential backoff reconnection, automatic room:rejoin on reconnect, subscriber pattern for message dispatch. WebSocketProvider context wired into both app root layouts.
- Task 5: Created Zustand room store factory (no persistence, ephemeral) with derived isHost, participantId tracking, connection state management. 10 tests.
- Task 6: Added vitest to server, created vitest.config.ts, updated test script.
- Task 7: pnpm build succeeds, pnpm test passes 87 tests (16 ui + 42 shared + 29 server), no new lint errors.

### Change Log

- 2026-03-24: Implemented Story 2.1 — Signaling Server & WebSocket Foundation (all 7 tasks complete)

### File List

New files:
- packages/shared/src/protocol/messages.ts
- packages/shared/src/protocol/constants.ts
- packages/shared/src/protocol/index.ts
- packages/shared/src/protocol/messages.test.ts
- packages/shared/src/stores/room-store.ts
- packages/shared/src/stores/room-store.test.ts
- apps/server/src/rooms/types.ts
- apps/server/src/rooms/room-code.ts
- apps/server/src/rooms/room-code.test.ts
- apps/server/src/rooms/room-manager.ts
- apps/server/src/rooms/room-manager.test.ts
- apps/server/src/rooms/index.ts
- apps/server/src/signaling/ws-handler.ts
- apps/server/src/signaling/ws-handler.test.ts
- apps/server/src/signaling/index.ts
- apps/server/vitest.config.ts
- apps/mobile/src/shared/hooks/use-websocket.ts
- apps/mobile/src/shared/providers/websocket-provider.tsx
- apps/mobile/src/lib/room.ts
- apps/web/src/shared/hooks/use-websocket.ts
- apps/web/src/shared/providers/websocket-provider.tsx
- apps/web/src/lib/room.ts

Modified files:
- packages/shared/src/index.ts (added protocol export)
- packages/shared/src/stores/index.ts (added room store export)
- apps/server/src/index.ts (wired RoomManager and WebSocket handler)
- apps/server/package.json (added vitest, updated test script)
- apps/server/tsconfig.json (removed paths, excluded test files from build)
- apps/mobile/app/_layout.tsx (added WebSocketProvider inside AuthGate)
- apps/web/src/app.tsx (added WebSocketProvider wrapper)
