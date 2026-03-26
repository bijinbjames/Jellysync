# Story 5.1: WebRTC Voice Connection & Signaling

Status: done

## Story

As a participant,
I want voice chat to connect automatically when I join a room,
So that I can hear and talk to others without any setup.

## Acceptance Criteria

1. **Given** a participant joins a room **When** room entry completes **Then** the client initiates WebRTC peer connections with all existing participants via P2P mesh topology, signaling (offers, answers, ICE candidates) relayed through the signaling server via `signal:offer`, `signal:answer`, and `signal:ice-candidate` messages. The signaling server never touches media streams. Voice audio is audible within 2 seconds of room join — hearing the other person IS the feedback (no "connected" toast).

2. **Given** WebRTC connections are established **When** voice is flowing **Then** voice latency (mouth to ear) < 300ms (NFR3), audio quality 48kbps Opus minimum (NFR4), all connections use DTLS-SRTP encryption (NFR16), echo cancellation leverages platform AEC — zero echo tolerance (NFR5).

3. **Given** the platform-agnostic WebRTC abstraction exists **When** voice is initialized **Then** `packages/shared/src/voice/webrtc-manager.ts` provides the abstraction layer; mobile uses `react-native-webrtc` via Expo dev builds; web uses native browser WebRTC API; `useVoiceStore` tracks WebRTC connection states, mute state, and volume levels.

4. **Given** STUN/TURN infrastructure is configured **When** participants are behind NAT **Then** STUN handles standard NAT traversal and Coturn 4.9.x TURN relay serves as fallback for symmetric NAT scenarios. Coturn configuration is provided in `coturn/turnserver.conf`.

5. **Given** the microphone permission is needed **When** the user joins a room for the first time **Then** the OS-native microphone permission prompt is shown (no pre-explanation modal). If granted, mic is on by default (FR26). If denied, voice playback still works (user can hear others) but cannot transmit.

6. **Given** a WebRTC connection fails **When** voice drops for a participant **Then** the system attempts renegotiation automatically. Playback continues unaffected — voice is degraded, not broken. No error is surfaced unless voice remains disconnected for > 3 seconds.

## Tasks / Subtasks

### 1. Protocol Layer — Signal Message Types (AC: 1, 2)
- [x] Add `SIGNAL_MESSAGE_TYPE` constants to `packages/shared/src/protocol/constants.ts`: `signal:offer`, `signal:answer`, `signal:ice-candidate`
- [x] Add `isClientSignalMessageType()` type guard to constants
- [x] Define payload interfaces in `packages/shared/src/protocol/messages.ts`:
  - `SignalOfferPayload { targetParticipantId: string; offer: { type: 'offer'; sdp: string } }`
  - `SignalAnswerPayload { targetParticipantId: string; answer: { type: 'answer'; sdp: string } }`
  - `SignalIceCandidatePayload { targetParticipantId: string; candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null } }`
- [x] Define message interfaces: `SignalOfferMessage`, `SignalAnswerMessage`, `SignalIceCandidateMessage`
- [x] Add to discriminated union types (client → server and server → client variants)
- [x] Add `isValidSignalOfferPayload()`, `isValidSignalAnswerPayload()`, `isValidSignalIceCandidatePayload()` type guards
- [x] Export all new types from `packages/shared/src/protocol/index.ts`
- [x] Write tests in `packages/shared/src/protocol/` for all new message types and type guards

### 2. Server — Signaling Relay Handler (AC: 1)
- [x] Create `apps/server/src/signaling/signaling-handler.ts` following the handler factory pattern:
  ```typescript
  export function createSignalingHandler({ roomManager, getParticipantId, sendTo, broadcastToRoom }) { ... }
  ```
- [x] Implement `handleSignalOffer(socket, msg)`: validate participant is in a room, validate `targetParticipantId` is in the same room, relay offer to target with `fromParticipantId` injected
- [x] Implement `handleSignalAnswer(socket, msg)`: same validation, relay answer to target
- [x] Implement `handleSignalIceCandidate(socket, msg)`: same validation, relay ICE candidate to target
- [x] Server MUST inject `fromParticipantId` into outgoing messages (don't trust client-provided sender ID)
- [x] Create `apps/server/src/signaling/signaling-handler.test.ts` with tests for:
  - Successful relay of offer/answer/ICE to correct target
  - Rejection when sender not in a room
  - Rejection when target not in the same room
  - Rejection when target is sender themselves
  - Proper `fromParticipantId` injection

### 3. Server — Wire Signal Handler into WS Router (AC: 1)
- [x] In `apps/server/src/signaling/ws-handler.ts`:
  - Import and instantiate `createSignalingHandler()` with same dependencies as other handlers
  - Add routing for `signal:offer`, `signal:answer`, `signal:ice-candidate` message types
  - Follow same pattern as `participant:*` routing (if/else chain within `isClientSignalMessageType()` check)
- [x] Add integration tests in `ws-handler.test.ts` for signal message routing

### 4. Shared — Voice Types (AC: 3)
- [x] Create `packages/shared/src/voice/types.ts`:
  - `PeerConnectionState`: `'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed'`
  - `PeerConnection { participantId: string; state: PeerConnectionState; }`
  - `VoiceConfig { iceServers: RTCIceServer[]; }`
  - `WebRTCManagerCallbacks { onLocalStream, onRemoteStream, onConnectionStateChange, sendSignalingMessage }`
- [x] Export from `packages/shared/src/voice/index.ts` (create barrel)

### 5. Shared — Voice Store (AC: 3)
- [x] Create `packages/shared/src/stores/voice-store.ts` following `sync-store.ts` pattern:
  ```typescript
  interface VoiceState {
    isVoiceEnabled: boolean;
    isMuted: boolean;
    peerConnections: Map<string, PeerConnectionState>;  // participantId → state
    localStreamActive: boolean;
    volumeLevels: Map<string, number>;  // participantId → 0.0-1.0
  }
  interface VoiceActions {
    setVoiceEnabled: (enabled: boolean) => void;
    setMuted: (muted: boolean) => void;
    setPeerConnectionState: (participantId: string, state: PeerConnectionState) => void;
    removePeerConnection: (participantId: string) => void;
    setLocalStreamActive: (active: boolean) => void;
    setVolume: (participantId: string, volume: number) => void;
    reset: () => void;
  }
  ```
- [x] Use `createStore` with optional `persist` middleware (persist `isMuted` preference only)
- [x] Export `createVoiceStore` factory function
- [x] Export from `packages/shared/src/stores/index.ts`
- [x] Write tests in `packages/shared/src/stores/voice-store.test.ts`

### 6. Shared — WebRTC Manager Abstraction (AC: 3, 4, 6)
- [x] Create `packages/shared/src/voice/webrtc-manager.ts`:
  - Platform-agnostic class managing P2P mesh peer connections
  - Constructor takes `VoiceConfig` (ICE servers) and `WebRTCManagerCallbacks`
  - `createPeerConnection(participantId)` — creates RTCPeerConnection with ICE servers, Opus codec preference
  - `createOffer(participantId)` → returns offer SDP to send via signaling
  - `handleOffer(fromParticipantId, offer)` → creates answer SDP
  - `handleAnswer(fromParticipantId, answer)` → sets remote description
  - `handleIceCandidate(fromParticipantId, candidate)` → adds ICE candidate
  - `addLocalStream(stream: MediaStream)` — attaches local mic stream to all connections
  - `removePeer(participantId)` — closes and cleans up a peer connection
  - `dispose()` — tears down all connections
  - Automatic renegotiation on `iceconnectionstatechange` → "failed"
  - Trickle ICE: candidates sent as discovered via callback
- [x] This file must NOT import platform-specific WebRTC — it receives `RTCPeerConnection` constructor via dependency injection or uses globalThis
- [x] Write tests in `packages/shared/src/voice/webrtc-manager.test.ts` with mocked RTCPeerConnection

### 7. Web — Voice Hook (AC: 1, 3, 5, 6)
- [x] Create `apps/web/src/features/voice/hooks/use-voice.ts`:
  - On room join: request mic via `navigator.mediaDevices.getUserMedia({ audio: true })`
  - Instantiate `WebRTCManager` from shared package with browser-native `RTCPeerConnection`
  - ICE servers from env config (STUN/TURN URLs + credentials)
  - On `room:state` message (when joining): initiate offers to all existing participants
  - On new participant join: wait for their offer (they initiate as the joiner)
  - On participant leave: call `removePeer()`
  - On `signal:offer/answer/ice-candidate` received: delegate to WebRTCManager
  - Send `signal:offer/answer/ice-candidate` via existing WebSocket connection
  - Handle mic permission denial gracefully (listen-only mode)
  - Cleanup on room leave / component unmount
- [x] Create `apps/web/src/features/voice/index.ts` barrel export
- [x] Wire `useVoice()` into player route (`apps/web/src/routes/player.tsx`) or room layout

### 8. Mobile — Voice Hook (AC: 1, 3, 5, 6)
- [x] Add `react-native-webrtc` and `@config-plugins/react-native-webrtc` to `apps/mobile/package.json`
- [x] Create `apps/mobile/src/features/voice/hooks/use-voice.ts`:
  - Same logic as web hook but using `react-native-webrtc` APIs (`RTCPeerConnection`, `mediaDevices`)
  - Platform permission handling via `react-native-webrtc`'s `mediaDevices.getUserMedia()`
  - Instantiate `WebRTCManager` with RN-WebRTC's `RTCPeerConnection`
  - Same signaling flow as web (offers/answers/ICE via existing WebSocket)
- [x] Create `apps/mobile/src/features/voice/index.ts` barrel export
- [x] Wire `useVoice()` into player route or room layout

### 9. STUN/TURN Configuration (AC: 4)
- [x] Create `coturn/turnserver.conf` with Coturn 4.9.x configuration
- [x] Add Coturn service to `docker-compose.yml`
- [x] Add ICE server configuration to environment variables (`.env.example`)
- [x] Both web and mobile read ICE server config from environment/config

## Dev Notes

### Architecture Patterns to Follow

**Handler Factory Pattern** (established in stories 4-3 through 4-5):
```typescript
// apps/server/src/signaling/signaling-handler.ts
export function createSignalingHandler(deps: {
  roomManager: RoomManager;
  getParticipantId: (socket: WebSocket) => string | undefined;
  sendTo: (socket: WebSocket, message: WsMessage) => void;
  broadcastToRoom: (room: Room, message: WsMessage, excludeId?: string) => void;
}) { ... }
```

**Message Creation** — use `createWsMessage(type, payload)` from `packages/shared/src/protocol/messages.ts`

**Broadcast Pattern** — signal messages are point-to-point (use `sendTo` targeting specific participant's socket), NOT broadcast to entire room

**Validation Pattern** — every incoming signal message must:
1. Verify sender is in a room (`getParticipantId` + `getRoomByParticipant`)
2. Verify `targetParticipantId` is in the same room
3. Validate payload with `isValid*Payload()` type guard
4. Inject `fromParticipantId` server-side (never trust client)

**WebRTC Negotiation Flow:**
```
Joiner                    Server                    Existing Peer
  |--- signal:offer ------->|--- signal:offer -------->|
  |<-- signal:answer --------|<-- signal:answer --------|
  |--- signal:ice-candidate->|--- signal:ice-candidate->|
  |<-- signal:ice-candidate--|<-- signal:ice-candidate--|
  |<========== P2P Media Stream (voice) =============>|
```

**Joiner initiates**: When a new participant joins, THEY create offers to all existing participants. Existing participants respond with answers. This prevents race conditions.

### Critical Constraints

- **Server is relay-only for signaling** — NEVER inspect, transform, or store SDP/ICE payloads beyond validation and adding `fromParticipantId`
- **Use existing WebSocket connection** — do NOT create a separate signaling channel
- **P2P mesh topology** — optimized for 2-4 participants; no SFU needed
- **Opus codec** — WebRTC defaults to Opus; ensure 48kbps minimum by setting `maxaveragebitrate` in SDP munging if needed
- **DTLS-SRTP** — automatic with WebRTC, no custom encryption needed
- **Platform AEC** — browser and react-native-webrtc both provide built-in echo cancellation; do NOT implement custom AEC
- **Trickle ICE** — send ICE candidates as they are gathered, don't wait for complete gathering

### Existing Code to Reuse

| What | Where | How to use |
|------|-------|------------|
| WebSocket message routing | `apps/server/src/signaling/ws-handler.ts` | Add signal:* routing alongside existing namespaces |
| Handler factory pattern | `apps/server/src/rooms/stepped-away.ts` | Copy pattern for signaling-handler.ts |
| Message type definitions | `packages/shared/src/protocol/messages.ts` | Extend with signal:* types |
| Type guard pattern | `packages/shared/src/protocol/messages.ts` | Follow `isValidSteppedAwayPayload()` pattern |
| Constants pattern | `packages/shared/src/protocol/constants.ts` | Add `SIGNAL_MESSAGE_TYPE` object |
| Store factory pattern | `packages/shared/src/stores/sync-store.ts` | Follow `createSyncStore()` for `createVoiceStore()` |
| `broadcastToRoom()` / `sendTo()` | `ws-handler.ts` | Use `sendTo()` for point-to-point signal relay |
| `createWsMessage()` | `packages/shared/src/protocol/messages.ts` | Create all signal messages |
| `getParticipantId()` | `ws-handler.ts` | Validate sender identity |
| `getRoomByParticipant()` | `room-manager.ts` | Find sender's room for validation |

### Anti-Patterns to Avoid

- **DO NOT** broadcast signal messages to entire room — they are peer-to-peer, use `sendTo()` for the target only
- **DO NOT** store SDP or ICE candidates on the server — relay only
- **DO NOT** create a new WebSocket connection for signaling
- **DO NOT** implement custom echo cancellation — use platform AEC
- **DO NOT** implement a custom STUN/TURN server — use Coturn
- **DO NOT** use `any` types — fully type all WebRTC interfaces
- **DO NOT** hardcode ICE server URLs — read from environment config
- **DO NOT** add visual "voice connected" indicators — voice arriving IS the feedback (UX requirement)
- **DO NOT** show "you're on mute" notifications — anti-Zoom principle
- **DO NOT** block room join if mic permission is denied — listen-only mode is valid

### Testing Standards

- **Framework**: Vitest (already configured)
- **Co-located**: `*.test.ts` next to source files
- **Current baseline**: 456 tests (360 shared + 96 server) — zero regressions allowed
- **Expected new tests**: ~65 (protocol ~15, server handler ~20, WebRTC manager ~15, voice store ~15)
- **Mock RTCPeerConnection** for unit tests — don't require real WebRTC in CI
- **Test edge cases**: late joiner, participant disconnect during negotiation, ICE failure + renegotiation, mic permission denied, simultaneous offers

### Project Structure Notes

New files follow established feature-based organization:
```
packages/shared/src/voice/          # NEW directory
  types.ts                          # Voice/WebRTC type definitions
  webrtc-manager.ts                 # Platform-agnostic WebRTC abstraction
  webrtc-manager.test.ts
  index.ts                          # Barrel export

packages/shared/src/stores/
  voice-store.ts                    # NEW — useVoiceStore
  voice-store.test.ts               # NEW

packages/shared/src/protocol/
  constants.ts                      # MODIFY — add SIGNAL_MESSAGE_TYPE
  messages.ts                       # MODIFY — add signal payload/message types
  index.ts                          # MODIFY — export new types

apps/server/src/signaling/
  signaling-handler.ts              # NEW — signal relay handler
  signaling-handler.test.ts         # NEW
  ws-handler.ts                     # MODIFY — route signal:* messages

apps/web/src/features/voice/        # NEW directory
  hooks/use-voice.ts                # Web voice hook (browser WebRTC)
  index.ts                          # Barrel export

apps/mobile/src/features/voice/     # NEW directory
  hooks/use-voice.ts                # Mobile voice hook (react-native-webrtc)
  index.ts                          # Barrel export

coturn/
  turnserver.conf                   # NEW — Coturn configuration

docker-compose.yml                  # MODIFY — add Coturn service
.env.example                        # MODIFY — add ICE server config vars
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5, Story 5.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — WebRTC Architecture, Signaling Server, Voice sections]
- [Source: _bmad-output/planning-artifacts/prd.md — FR24-FR30, NFR3-NFR5, NFR16]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Voice Connection Pattern, MicToggleFAB, Sacred Screen]
- [Source: _bmad-output/implementation-artifacts/4-5-subtitles-and-stepped-away.md — Handler factory pattern, message routing pattern]

### Previous Story Intelligence (Epic 4-5)

- Handler factory pattern with dependency injection works well — follow `createSteppedAwayHandler()` exactly
- `broadcastToRoom()` with `excludeId` param available for targeted sends, but for signaling prefer `sendTo()` directly
- Type guards (`isValid*Payload()`) prevent runtime crashes — mandatory for all new payloads
- `createWsMessage()` ensures consistent message format — always use it
- Zustand store pattern with optional persist middleware proven stable
- Co-located tests with comprehensive edge cases prevent regressions
- Single commit spanning server + shared + web + mobile is the established pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Fixed vi.fn() mock constructor issue in webrtc-manager.test.ts — needed `mockImplementation(function() {...})` syntax
- Fixed ws-handler integration test race condition — used message queue pattern instead of single `waitForMessage` to prevent lost messages

### Completion Notes List

- **Task 1 (Protocol Layer)**: Added `SIGNAL_MESSAGE_TYPE` constants, 3 payload interfaces, 3 message interfaces, `SignalMessage` discriminated union, type guards (`isSignalMessage`, `isClientSignalMessageType`, `isValidSignal*Payload`), barrel exports. 45 tests.
- **Task 2 (Signaling Handler)**: Created `createSignalingHandler()` factory with `handleSignalOffer/Answer/IceCandidate`. Validates sender is in room, target is in same room, rejects self-signaling, injects `fromParticipantId` server-side. Point-to-point relay via `sendTo()`. 18 tests.
- **Task 3 (WS Router)**: Wired `createSignalingHandler` into `ws-handler.ts` with `isClientSignalMessageType()` routing check. 4 integration tests with message queue pattern.
- **Task 4 (Voice Types)**: Created `PeerConnectionState`, `PeerConnection`, `VoiceConfig`, `WebRTCManagerCallbacks` types with barrel export.
- **Task 5 (Voice Store)**: Created `createVoiceStore()` following `createSyncStore()` pattern. Zustand with optional persist (persists `isMuted` only). Map-based peer connections and volume levels with clamping. 23 tests.
- **Task 6 (WebRTC Manager)**: Platform-agnostic `WebRTCManager` class using `globalThis.RTCPeerConnection`. P2P mesh topology, trickle ICE, auto-renegotiation on failure, proper cleanup. 24 tests with mocked RTCPeerConnection.
- **Task 7 (Web Voice Hook)**: `useVoice()` hook using browser-native WebRTC. Requests mic via `getUserMedia`, creates offers to existing participants on room join, handles incoming signals, graceful listen-only on mic denial, full cleanup on unmount.
- **Task 8 (Mobile Voice Hook)**: `useVoice()` hook using `react-native-webrtc`. Polyfills globalThis WebRTC APIs, same signaling flow as web. Added `react-native-webrtc` and `@config-plugins/react-native-webrtc` dependencies.
- **Task 9 (STUN/TURN)**: Created Coturn 4.9.x configuration, docker-compose.yml with Coturn service, .env.example with ICE server vars.

### File List

New files:
- `packages/shared/src/protocol/signal-messages.test.ts`
- `packages/shared/src/voice/types.ts`
- `packages/shared/src/voice/webrtc-manager.ts`
- `packages/shared/src/voice/webrtc-manager.test.ts`
- `packages/shared/src/voice/index.ts`
- `packages/shared/src/stores/voice-store.ts`
- `packages/shared/src/stores/voice-store.test.ts`
- `apps/server/src/signaling/signaling-handler.ts`
- `apps/server/src/signaling/signaling-handler.test.ts`
- `apps/web/src/features/voice/hooks/use-voice.ts`
- `apps/web/src/features/voice/index.ts`
- `apps/web/src/lib/voice.ts`
- `apps/mobile/src/features/voice/hooks/use-voice.ts`
- `apps/mobile/src/features/voice/index.ts`
- `apps/mobile/src/lib/voice.ts`
- `coturn/turnserver.conf`
- `docker-compose.yml`
- `.env.example`

Modified files:
- `packages/shared/src/protocol/constants.ts`
- `packages/shared/src/protocol/messages.ts`
- `packages/shared/src/protocol/index.ts`
- `packages/shared/src/stores/index.ts`
- `packages/shared/src/index.ts`
- `apps/server/src/signaling/ws-handler.ts`
- `apps/server/src/signaling/ws-handler.test.ts`
- `apps/web/src/routes/player.tsx`
- `apps/mobile/app/player.tsx`
- `apps/mobile/package.json`

### Change Log

- Implemented WebRTC voice connection and signaling for Story 5.1 (Date: 2026-03-26)
  - Added signal:offer/answer/ice-candidate protocol messages with full type safety
  - Created server-side signaling relay handler (point-to-point, no media inspection)
  - Built platform-agnostic WebRTCManager with P2P mesh, trickle ICE, auto-renegotiation
  - Created voice store (Zustand) for peer connection and mute state management
  - Integrated voice hooks into web (browser WebRTC) and mobile (react-native-webrtc)
  - Added Coturn TURN server configuration for NAT traversal
  - 114 new tests, 570 total tests passing, zero regressions
