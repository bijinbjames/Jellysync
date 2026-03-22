export const radius = {
  'rounded-lg': '2rem',
  'rounded-md': '1.5rem',
  'rounded-full': '9999px',
} as const;

export type RadiusToken = keyof typeof radius;
