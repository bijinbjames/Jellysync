import { randomInt } from 'node:crypto';
import { ROOM_CONFIG } from '@jellysync/shared';

export function generateRoomCode(existingCodes: Set<string>): string {
  const { CODE_LENGTH, CODE_CHARS } = ROOM_CONFIG;
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARS[randomInt(CODE_CHARS.length)];
    }
    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique room code after maximum attempts');
    }
  } while (existingCodes.has(code));

  return code;
}
