import { describe, it, expect } from 'vitest';
import { radius } from './radius.js';

describe('radius tokens', () => {
  it('defines 3 radius tokens', () => {
    expect(Object.keys(radius)).toHaveLength(3);
  });

  it('has correct values', () => {
    expect(radius['rounded-lg']).toBe('2rem');
    expect(radius['rounded-md']).toBe('1.5rem');
    expect(radius['rounded-full']).toBe('9999px');
  });
});
