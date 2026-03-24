import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { RoomManager } from './rooms/index.js';
import { registerWebSocketHandler } from './signaling/index.js';

const main = async () => {
  const server = Fastify({ logger: true });

  await server.register(websocket);

  const roomManager = new RoomManager();
  registerWebSocketHandler(server, roomManager);

  server.get('/health', async () => {
    return { status: 'ok' };
  });

  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

main();
