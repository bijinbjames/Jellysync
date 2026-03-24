import { describe, it, expect } from 'vitest';
import { generateRoomCode } from './room-code.js';
import { ROOM_CONFIG } from '@jellysync/shared';

describe('generateRoomCode', () => {
  it('generates a code of correct length', () => {
    const code = generateRoomCode(new Set());
    expect(code).toHaveLength(ROOM_CONFIG.CODE_LENGTH);
  });

  it('generates codes using only valid characters', () => {
    const validChars = new Set(ROOM_CONFIG.CODE_CHARS.split(''));
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode(new Set());
      for (const char of code) {
        expect(validChars.has(char)).toBe(true);
      }
    }
  });

  it('excludes ambiguous characters (0, O, 1, I, L)', () => {
    const ambiguous = ['0', 'O', '1', 'I', 'L'];
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode(new Set());
      for (const char of ambiguous) {
        expect(code).not.toContain(char);
      }
    }
  });

  it('avoids collision with existing codes', () => {
    const existingCodes = new Set(['ABCDEF']);
    const code = generateRoomCode(existingCodes);
    expect(code).not.toBe('ABCDEF');
  });

  it('generates unique codes across multiple calls', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode(codes);
      expect(codes.has(code)).toBe(false);
      codes.add(code);
    }
    expect(codes.size).toBe(100);
  });
});
