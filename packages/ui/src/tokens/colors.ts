export const colors = {
  primary: '#6ee9e0',
  primary_container: '#4ecdc4',
  secondary: '#c8bfff',
  secondary_container: '#442bb5',
  surface: '#131313',
  surface_container_lowest: '#0e0e0e',
  surface_container_low: '#1c1b1b',
  surface_container: '#201f1f',
  surface_container_high: '#2a2a2a',
  surface_container_highest: '#353534',
  on_surface: '#e5e2e1',
  on_surface_variant: '#bcc9c7',
  outline: '#869391',
  outline_variant: '#3d4948',
  error: '#ffb4ab',
  tertiary: '#ffcbac',
} as const;

export type ColorToken = keyof typeof colors;
