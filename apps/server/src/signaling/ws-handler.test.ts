import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { RoomManager } from '../rooms/index.js';
import { registerWebSocketHandler } from './ws-handler.js';
import { ROOM_MESSAGE_TYPE, SYNC_MESSAGE_TYPE, ERROR_CODE } from '@jellysync/shared';

async function createTestServer(roomManager: RoomManager) {
  const server = Fastify({ logger: false });
  await server.register(websocket);
  const handlers = registerWebSocketHandler(server, roomManager);
  return { server, ...handlers };
}

async function connectWs(address: string): Promise<WebSocket> {
  const ws = new WebSocket(`${address.replace('http', 'ws')}/ws`);
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = (e) => reject(e);
  });
  return ws;
}

function waitForMessage(ws: WebSocket): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    ws.onmessage = (event) => {
      resolve(JSON.parse(event.data as string));
    };
  });
}

function sendMessage(ws: WebSocket, type: string, payload: unknown): void {
  ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
}

describe('ws-handler', () => {
  let roomManager: RoomManager;
  let server: Awaited<ReturnType<typeof Fastify>>;
  let address: string;
  let disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    roomManager = new RoomManager();
    const result = await createTestServer(roomManager);
    server = result.server;
    disconnectTimers = result.disconnectTimers;
    address = await server.listen({ port: 0 });
  });

  afterEach(async () => {
    // Clear any pending grace timers
    for (const timer of disconnectTimers.values()) {
      clearTimeout(timer);
    }
    disconnectTimers.clear();
    vi.useRealTimers();
    await server.close();
  });

  describe('message validation', () => {
    it('rejects invalid JSON', async () => {
      const ws = await connectWs(address);
      const responsePromise = waitForMessage(ws);
      ws.send('not json');
      const response = await responsePromise;
      expect(response.type).toBe('error');
      expect((response.payload as Record<string, unknown>).code).toBe(ERROR_CODE.INVALID_MESSAGE);
      ws.close();
    });

    it('rejects messages missing required fields', async () => {
      const ws = await connectWs(address);
      const responsePromise = waitForMessage(ws);
      ws.send(JSON.stringify({ type: 'room:create' }));
      const response = await responsePromise;
      expect(response.type).toBe('error');
      expect((response.payload as Record<string, unknown>).code).toBe(ERROR_CODE.INVALID_MESSAGE);
      ws.close();
    });

    it('rejects unknown message types', async () => {
      const ws = await connectWs(address);
      const responsePromise = waitForMessage(ws);
      sendMessage(ws, 'room:invalid', {});
      const response = await responsePromise;
      expect(response.type).toBe('error');
      expect((response.payload as Record<string, unknown>).code).toBe(ERROR_CODE.UNKNOWN_MESSAGE_TYPE);
      ws.close();
    });

    it('rejects server-to-client message types sent by client', async () => {
      const ws = await connectWs(address);
      const responsePromise = waitForMessage(ws);
      sendMessage(ws, ROOM_MESSAGE_TYPE.STATE, {});
      const response = await responsePromise;
      expect(response.type).toBe('error');
      expect((response.payload as Record<string, unknown>).code).toBe(ERROR_CODE.UNKNOWN_MESSAGE_TYPE);
      ws.close();
    });
  });

  describe('room:create', () => {
    it('creates a room and responds with room:state including participantId', async () => {
      const ws = await connectWs(address);
      const responsePromise = waitForMessage(ws);
      sendMessage(ws, ROOM_MESSAGE_TYPE.CREATE, { displayName: 'Alice' });
      const response = await responsePromise;
      const payload = response.payload as Record<string, unknown>;
      expect(response.type).toBe(ROOM_MESSAGE_TYPE.STATE);
      expect(payload.roomCode).toHaveLength(6);
      expect((payload.participants as Array<Record<string, unknown>>)).toHaveLength(1);
      expect((payload.participants as Array<Record<string, unknown>>)[0].displayName).toBe('Alice');
      expect((payload.participants as Array<Record<string, unknown>>)[0].isHost).toBe(true);
      expect(payload.hostId).toBe((payload.participants as Array<Record<string, unknown>>)[0].id);
      // IG-1: participantId is included in response
      expect(payload.participantId).toBe((payload.participants as Array<Record<string, unknown>>)[0].id);
      ws.close();
    });

    it('rejects create with missing displayName', async () => {
      const ws = await connectWs(address);
      const responsePromise = waitForMessage(ws);
      sendMessage(ws, ROOM_MESSAGE_TYPE.CREATE, {});
      const response = await responsePromise;
      expect(response.type).toBe('error');
      expect((response.payload as Record<string, unknown>).code).toBe(ERROR_CODE.INVALID_PAYLOAD);
      ws.close();
    });
  });

  describe('room:join', () => {
    it('joins an existing room and broadcasts state with per-recipient participantId', async () => {
      const hostWs = await connectWs(address);
      const createResponse = waitForMessage(hostWs);
      sendMessage(hostWs, ROOM_MESSAGE_TYPE.CREATE, { displayName: 'Alice' });
      const createResult = await createResponse;
      const createPayload = createResult.payload as Record<string, unknown>;
      const roomCode = createPayload.roomCode;
      const hostParticipantId = createPayload.participantId;

      const joinWs = await connectWs(address);
      const joinResponse = waitForMessage(joinWs);
      const hostBroadcast = waitForMessage(hostWs);
      sendMessage(joinWs, ROOM_MESSAGE_TYPE.JOIN, { roomCode, displayName: 'Bob' });

      const joinResult = await joinResponse;
      const joinPayload = joinResult.payload as Record<string, unknown>;
      expect(joinResult.type).toBe(ROOM_MESSAGE_TYPE.STATE);
      expect((joinPayload.participants as unknown[]).length).toBe(2);
      // Joiner gets their own participantId
      expect(joinPayload.participantId).toBeDefined();
      expect(joinPayload.participantId).not.toBe(hostParticipantId);

      const hostResult = await hostBroadcast;
      const hostPayload = hostResult.payload as Record<string, unknown>;
      // Host gets their own participantId in the broadcast
      expect(hostPayload.participantId).toBe(hostParticipantId);

      hostWs.close();
      joinWs.close();
    });

    it('rejects join with invalid room code', async () => {
      const ws = await connectWs(address);
      const responsePromise = waitForMessage(ws);
      sendMessage(ws, ROOM_MESSAGE_TYPE.JOIN, { roomCode: 'ZZZZZZ', displayName: 'Bob' });
      const response = await responsePromise;
      expect(response.type).toBe('error');
      expect((response.payload as Record<string, unknown>).code).toBe(ERROR_CODE.ROOM_NOT_FOUND);
      ws.close();
    });
  });

  describe('room:leave', () => {
    it('removes participant and broadcasts updated state', async () => {
      const hostWs = await connectWs(address);
      const createResponse = waitForMessage(hostWs);
      sendMessage(hostWs, ROOM_MESSAGE_TYPE.CREATE, { displayName: 'Alice' });
      const createResult = await createResponse;
      const roomCode = (createResult.payload as Record<string, unknown>).roomCode;

      const joinWs = await connectWs(address);
      const joinResponse = waitForMessage(joinWs);
      const hostJoinBroadcast = waitForMessage(hostWs);
      sendMessage(joinWs, ROOM_MESSAGE_TYPE.JOIN, { roomCode, displayName: 'Bob' });
      await joinResponse;
      await hostJoinBroadcast;

      const leaveResponse = waitForMessage(hostWs);
      sendMessage(joinWs, ROOM_MESSAGE_TYPE.LEAVE, {});

      const hostResult = await leaveResponse;
      expect(hostResult.type).toBe(ROOM_MESSAGE_TYPE.STATE);
      expect(((hostResult.payload as Record<string, unknown>).participants as unknown[]).length).toBe(1);

      hostWs.close();
      joinWs.close();
    });

    it('transfers host to earliest joiner when host leaves', async () => {
      const hostWs = await connectWs(address);
      const createResponse = waitForMessage(hostWs);
      sendMessage(hostWs, ROOM_MESSAGE_TYPE.CREATE, { displayName: 'Alice' });
      const createResult = await createResponse;
      const roomCode = (createResult.payload as Record<string, unknown>).roomCode;

      const joinWs = await connectWs(address);
      const joinResponse = waitForMessage(joinWs);
      const hostJoinBroadcast = waitForMessage(hostWs);
      sendMessage(joinWs, ROOM_MESSAGE_TYPE.JOIN, { roomCode, displayName: 'Bob' });
      await joinResponse;
      await hostJoinBroadcast;

      // Host (Alice) leaves — Bob should become host
      const bobBroadcast = waitForMessage(joinWs);
      sendMessage(hostWs, ROOM_MESSAGE_TYPE.LEAVE, {});

      const bobResult = await bobBroadcast;
      expect(bobResult.type).toBe(ROOM_MESSAGE_TYPE.STATE);
      const payload = bobResult.payload as Record<string, unknown>;
      const participants = payload.participants as Array<Record<string, unknown>>;
      expect(participants).toHaveLength(1);
      expect(participants[0].displayName).toBe('Bob');
      expect(participants[0].isHost).toBe(true);
      expect(payload.hostId).toBe(participants[0].id);

      hostWs.close();
      joinWs.close();
    });

    it('sends room:close when last participant leaves (room destroyed)', async () => {
      const ws = await connectWs(address);
      const createResponse = waitForMessage(ws);
      sendMessage(ws, ROOM_MESSAGE_TYPE.CREATE, { displayName: 'Alice' });
      const createResult = await createResponse;
      const roomCode = (createResult.payload as Record<string, unknown>).roomCode as string;

      // Alice leaves — she is the only participant, room should be destroyed
      const closeResponse = waitForMessage(ws);
      sendMessage(ws, ROOM_MESSAGE_TYPE.LEAVE, {});

      const closeResult = await closeResponse;
      expect(closeResult.type).toBe(ROOM_MESSAGE_TYPE.CLOSE);
      expect((closeResult.payload as Record<string, unknown>).reason).toBe('Room ended');

      // Room should be destroyed
      expect(roomManager.getRoom(roomCode)).toBeNull();

      ws.close();
    });

    it('removes participant immediately without grace period on explicit leave', async () => {
      const hostWs = await connectWs(address);
      const createResponse = waitForMessage(hostWs);
      sendMessage(hostWs, ROOM_MESSAGE_TYPE.CREATE, { displayName: 'Alice' });
      const createResult = await createResponse;
      const roomCode = (createResult.payload as Record<string, unknown>).roomCode as string;

      const joinWs = await connectWs(address);
      const joinResponse = waitForMessage(joinWs);
      const hostJoinBroadcast = waitForMessage(hostWs);
      sendMessage(joinWs, ROOM_MESSAGE_TYPE.JOIN, { roomCode, displayName: 'Bob' });
      await joinResponse;
      await hostJoinBroadcast;

      // Bob sends explicit leave
      const hostBroadcast = waitForMessage(hostWs);
      sendMessage(joinWs, ROOM_MESSAGE_TYPE.LEAVE, {});
      await hostBroadcast;

      // Participant should be removed immediately (no grace period)
      const room = roomManager.getRoom(roomCode);
      expect(room).not.toBeNull();
      expect(room!.participants.size).toBe(1);
      expect(disconnectTimers.size).toBe(0);

      hostWs.close();
      joinWs.close();
    });
  });

  describe('connection close with grace period', () => {
    it('does not remove participant immediately on disconnect', async () => {
      const hostWs = await connectWs(address);
      const createResponse = waitForMessage(hostWs);
      sendMessage(hostWs, ROOM_MESSAGE_TYPE.CREATE, { displayName: 'Alice' });
      const createResult = await createResponse;
      const roomCode = (createResult.payload as Record<string, unknown>).roomCode as string;

      const joinWs = await connectWs(address);
      const joinResponse = waitForMessage(joinWs);
      const hostJoinBroadcast = waitForMessage(hostWs);
      sendMessage(joinWs, ROOM_MESSAGE_TYPE.JOIN, { roomCode, displayName: 'Bob' });
      await joinResponse;
      await hostJoinBroadcast;

      // Close joiner's connection — grace period starts
      joinWs.close();

      // Wait a bit to let close event propagate
      await new Promise((r) => setTimeout(r, 50));

      // Room should still have 2 participants during grace period
      const room = roomManager.getRoom(roomCode);
      expect(room).not.toBeNull();
      expect(room!.participants.size).toBe(2);

      hostWs.close();
    });

    it('removes participant after grace period expires', async () => {
      const hostWs = await connectWs(address);
      const createResponse = waitForMessage(hostWs);
      sendMessage(hostWs, ROOM_MESSAGE_TYPE.CREATE, { displayName: 'Alice' });
      const createResult = await createResponse;
      const roomCode = (createResult.payload as Record<string, unknown>).roomCode as string;

      const joinWs = await connectWs(address);
      const joinResponse = waitForMessage(joinWs);
      const hostJoinBroadcast = waitForMessage(hostWs);
      sendMessage(joinWs, ROOM_MESSAGE_TYPE.JOIN, { roomCode, displayName: 'Bob' });
      await joinResponse;
      await hostJoinBroadcast;

      // Listen for the grace period expiry broadcast
      const hostBroadcast = waitForMessage(hostWs);

      // Close joiner's connection
      joinWs.close();
      await new Promise((r) => setTimeout(r, 50));

      // Advance past grace period
      vi.advanceTimersByTime(31000);

      const hostResult = await hostBroadcast;
      expect(hostResult.type).toBe(ROOM_MESSAGE_TYPE.STATE);
      expect(((hostResult.payload as Record<string, unknown>).participants as unknown[]).length).toBe(1);

      // Room should now have 1 participant
      const room = roomManager.getRoom(roomCode);
      expect(room).not.toBeNull();
      expect(room!.participants.size).toBe(1);

      hostWs.close();
    });
  });

  describe('buffer pause cleared on participant leave', () => {
    it('broadcasts sync:play when buffering participant leaves', async () => {
      const hostWs = await connectWs(address);
      const createResponse = waitForMessage(hostWs);
      sendMessage(hostWs, ROOM_MESSAGE_TYPE.CREATE, { displayName: 'Alice' });
      const createResult = await createResponse;
      const roomCode = (createResult.payload as Record<string, unknown>).roomCode as string;

      const joinWs = await connectWs(address);
      const joinResponse = waitForMessage(joinWs);
      const hostJoinBroadcast = waitForMessage(hostWs);
      sendMessage(joinWs, ROOM_MESSAGE_TYPE.JOIN, { roomCode, displayName: 'Bob' });
      await joinResponse;
      await hostJoinBroadcast;

      // Bob starts buffering
      sendMessage(joinWs, SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'ignored', displayName: 'Bob', positionMs: 5000 });
      // Wait for buffer pause broadcast
      const pauseBroadcast = await waitForMessage(hostWs);
      expect(pauseBroadcast.type).toBe(SYNC_MESSAGE_TYPE.PAUSE);

      // Verify room has a buffering participant
      const room = roomManager.getRoom(roomCode);
      expect(room!.bufferingParticipantId).not.toBeNull();

      // Bob leaves — should trigger resume broadcast
      const resumeBroadcast = waitForMessage(hostWs);
      sendMessage(joinWs, ROOM_MESSAGE_TYPE.LEAVE, {});

      const resumeResult = await resumeBroadcast;
      expect(resumeResult.type).toBe(SYNC_MESSAGE_TYPE.PLAY);

      // Buffer pause should be cleared
      expect(room!.bufferingParticipantId).toBeNull();

      hostWs.close();
    });

    it('broadcasts sync:play when buffering participant disconnects after grace period', async () => {
      const hostWs = await connectWs(address);
      const createResponse = waitForMessage(hostWs);
      sendMessage(hostWs, ROOM_MESSAGE_TYPE.CREATE, { displayName: 'Alice' });
      const createResult = await createResponse;
      const roomCode = (createResult.payload as Record<string, unknown>).roomCode as string;

      const joinWs = await connectWs(address);
      const joinResponse = waitForMessage(joinWs);
      const hostJoinBroadcast = waitForMessage(hostWs);
      sendMessage(joinWs, ROOM_MESSAGE_TYPE.JOIN, { roomCode, displayName: 'Bob' });
      await joinResponse;
      await hostJoinBroadcast;

      // Bob starts buffering
      sendMessage(joinWs, SYNC_MESSAGE_TYPE.BUFFER_START, { participantId: 'ignored', displayName: 'Bob', positionMs: 5000 });
      const pauseBroadcast = await waitForMessage(hostWs);
      expect(pauseBroadcast.type).toBe(SYNC_MESSAGE_TYPE.PAUSE);

      // Bob disconnects (close socket)
      const playBroadcast = waitForMessage(hostWs);
      joinWs.close();
      await new Promise((r) => setTimeout(r, 50));

      // Advance past grace period
      vi.advanceTimersByTime(31000);

      // Host should receive sync:play (buffer cleared) then room:state (participant removed)
      const result = await playBroadcast;
      expect(result.type).toBe(SYNC_MESSAGE_TYPE.PLAY);

      const room = roomManager.getRoom(roomCode);
      expect(room!.bufferingParticipantId).toBeNull();

      hostWs.close();
    });
  });
});
