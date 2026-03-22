import { describe, it, expect } from 'vitest';
import { fontFamilies, fontWeights, typographyRoles } from './typography.js';

describe('typography tokens', () => {
  it('defines display and body font families', () => {
    expect(fontFamilies.display[0]).toBe('Manrope');
    expect(fontFamilies.body[0]).toBe('Inter');
  });

  it('defines all 6 typography roles', () => {
    expect(Object.keys(typographyRoles)).toHaveLength(6);
  });

  it('display roles use Manrope with correct weights', () => {
    expect(typographyRoles.displayLarge.fontFamily).toBe(fontFamilies.display);
    expect(typographyRoles.displayLarge.fontWeight).toBe(fontWeights.extrabold);
    expect(typographyRoles.displayLarge.fontSize).toBe('3.5rem');

    expect(typographyRoles.headlineLarge.fontWeight).toBe(fontWeights.bold);
    expect(typographyRoles.headlineMedium.fontWeight).toBe(fontWeights.bold);
  });

  it('body/label roles use Inter', () => {
    expect(typographyRoles.bodyMedium.fontFamily).toBe(fontFamilies.body);
    expect(typographyRoles.labelMedium.fontFamily).toBe(fontFamilies.body);
    expect(typographyRoles.labelSmall.fontFamily).toBe(fontFamilies.body);
  });

  it('has correct letter spacing values', () => {
    expect(typographyRoles.displayLarge.letterSpacing).toBe('-0.02em');
    expect(typographyRoles.headlineMedium.letterSpacing).toBe('-0.025em');
    expect(typographyRoles.bodyMedium.letterSpacing).toBe('normal');
    expect(typographyRoles.labelMedium.letterSpacing).toBe('0.2em');
    expect(typographyRoles.labelSmall.letterSpacing).toBe('0.1em');
  });
});
