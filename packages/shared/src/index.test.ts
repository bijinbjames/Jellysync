import { describe, it, expect } from 'vitest';
import { SHARED_VERSION } from './index.js';

describe('@jellysync/shared', () => {
  it('exports SHARED_VERSION', () => {
    expect(SHARED_VERSION).toBe('0.0.0');
  });
});
