import { describe, it, expect } from 'vitest';
import { spacing } from './spacing.js';

describe('spacing tokens', () => {
  it('defines 7 spacing tokens', () => {
    expect(Object.keys(spacing)).toHaveLength(7);
  });

  it('has correct values', () => {
    expect(spacing[1]).toBe('0.25rem');
    expect(spacing[2]).toBe('0.5rem');
    expect(spacing[3]).toBe('1rem');
    expect(spacing[4]).toBe('1.4rem');
    expect(spacing[6]).toBe('2rem');
    expect(spacing[8]).toBe('2.75rem');
    expect(spacing[12]).toBe('4rem');
  });
});
