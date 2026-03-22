export const fontFamilies = {
  display: ['Manrope', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const typographyRoles = {
  displayLarge: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.extrabold,
    fontSize: '3.5rem',
    letterSpacing: '-0.02em',
  },
  headlineLarge: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.bold,
    fontSize: '2rem',
    letterSpacing: '-0.02em',
  },
  headlineMedium: {
    fontFamily: fontFamilies.display,
    fontWeight: fontWeights.bold,
    fontSize: '1.5rem',
    letterSpacing: '-0.025em',
  },
  bodyMedium: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.regular,
    fontSize: '1rem',
    letterSpacing: 'normal',
  },
  labelMedium: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.semibold,
    fontSize: '0.75rem',
    letterSpacing: '0.2em',
  },
  labelSmall: {
    fontFamily: fontFamilies.body,
    fontWeight: fontWeights.medium,
    fontSize: '0.625rem',
    letterSpacing: '0.1em',
  },
} as const;

export type TypographyRole = keyof typeof typographyRoles;
