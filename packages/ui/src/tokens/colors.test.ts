import { describe, it, expect } from 'vitest';
import { colors } from './colors.js';

describe('color tokens', () => {
  it('defines all 16 color tokens', () => {
    expect(Object.keys(colors)).toHaveLength(16);
  });

  it('has correct primary colors', () => {
    expect(colors.primary).toBe('#6ee9e0');
    expect(colors.primary_container).toBe('#4ecdc4');
  });

  it('has correct secondary colors', () => {
    expect(colors.secondary).toBe('#c8bfff');
    expect(colors.secondary_container).toBe('#442bb5');
  });

  it('has correct surface hierarchy', () => {
    expect(colors.surface).toBe('#131313');
    expect(colors.surface_container_lowest).toBe('#0e0e0e');
    expect(colors.surface_container_low).toBe('#1c1b1b');
    expect(colors.surface_container).toBe('#201f1f');
    expect(colors.surface_container_high).toBe('#2a2a2a');
    expect(colors.surface_container_highest).toBe('#353534');
  });

  it('has correct text and outline colors', () => {
    expect(colors.on_surface).toBe('#e5e2e1');
    expect(colors.on_surface_variant).toBe('#bcc9c7');
    expect(colors.outline).toBe('#869391');
    expect(colors.outline_variant).toBe('#3d4948');
  });

  it('has correct accent colors', () => {
    expect(colors.error).toBe('#ffb4ab');
    expect(colors.tertiary).toBe('#ffcbac');
  });

  it('does not contain pure white (#FFFFFF)', () => {
    const values = Object.values(colors);
    values.forEach((value) => {
      expect(value.toUpperCase()).not.toBe('#FFFFFF');
    });
  });
});
