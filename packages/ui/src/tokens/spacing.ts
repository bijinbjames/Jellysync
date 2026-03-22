export const spacing = {
  1: '0.25rem',
  2: '0.5rem',
  3: '1rem',
  4: '1.4rem',
  6: '2rem',
  8: '2.75rem',
  12: '4rem',
} as const;

export type SpacingToken = keyof typeof spacing;
