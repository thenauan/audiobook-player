import { describe, it, expect } from 'vitest';
import {
  hexToHsl,
  hslToHex,
  isColorLight,
  getGenericCoverColor,
  getBookHighlightTheme,
  getCoverTones,
  GENERIC_COVER_COLORS,
} from '../audioUtils';

describe('Color Conversions & Cover Highlight Themes', () => {
  describe('hexToHsl and hslToHex conversions', () => {
    it('converts pure primary red (#ff0000) accurately', () => {
      const hsl = hexToHsl('#ff0000');
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);

      const hex = hslToHex(hsl.h, hsl.s, hsl.l);
      expect(hex.toLowerCase()).toBe('#ff0000');
    });

    it('converts pure primary green (#00ff00) accurately', () => {
      const hsl = hexToHsl('#00ff00');
      expect(hsl.h).toBe(120);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);

      const hex = hslToHex(hsl.h, hsl.s, hsl.l);
      expect(hex.toLowerCase()).toBe('#00ff00');
    });

    it('converts pure primary blue (#0000ff) accurately', () => {
      const hsl = hexToHsl('#0000ff');
      expect(hsl.h).toBe(240);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);

      const hex = hslToHex(hsl.h, hsl.s, hsl.l);
      expect(hex.toLowerCase()).toBe('#0000ff');
    });

    it('handles black (#000000) and white (#ffffff)', () => {
      const blackHsl = hexToHsl('#000000');
      expect(blackHsl.l).toBe(0);
      expect(hslToHex(0, 0, 0)).toBe('#000000');

      const whiteHsl = hexToHsl('#ffffff');
      expect(whiteHsl.l).toBe(100);
      expect(hslToHex(0, 0, 100)).toBe('#ffffff');
    });

    it('handles mid-gray (#808080) with zero saturation', () => {
      const grayHsl = hexToHsl('#808080');
      expect(grayHsl.s).toBe(0);
      expect(grayHsl.l).toBe(50);
      expect(hslToHex(0, 0, 50)).toBe('#808080');
    });

    it('performs roundtrip conversions for UI brand colors', () => {
      const brandColors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];
      for (const original of brandColors) {
        const hsl = hexToHsl(original);
        const reconstructed = hslToHex(hsl.h, hsl.s, hsl.l);
        // Compare HSL of reconstructed to verify perceptual match within rounding tolerance
        const roundtripHsl = hexToHsl(reconstructed);
        expect(Math.abs(roundtripHsl.h - hsl.h)).toBeLessThanOrEqual(2);
        expect(Math.abs(roundtripHsl.s - hsl.s)).toBeLessThanOrEqual(2);
        expect(Math.abs(roundtripHsl.l - hsl.l)).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('isColorLight', () => {
    it('returns true for bright and light colors', () => {
      expect(isColorLight('#ffffff')).toBe(true);
      expect(isColorLight('#fef08a')).toBe(true); // Light yellow
      expect(isColorLight('#e0e7ff')).toBe(true); // Light indigo
      expect(isColorLight('#f3f4f6')).toBe(true); // Light gray
    });

    it('returns false for deep, dark, or saturated dark colors', () => {
      expect(isColorLight('#000000')).toBe(false);
      expect(isColorLight('#0f172a')).toBe(false); // Deep slate
      expect(isColorLight('#1e1b4b')).toBe(false); // Dark indigo
      expect(isColorLight('#450a0a')).toBe(false); // Dark red
      expect(isColorLight('#064e3b')).toBe(false); // Dark emerald
    });
  });

  describe('getGenericCoverColor', () => {
    it('extracts data-color attribute from encoded SVG string', () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" data-color="#3b82f6"><rect fill="#3b82f6"/></svg>`;
      const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      expect(getGenericCoverColor(dataUri)).toBe('#3b82f6');
    });

    it('extracts fill attribute from SVG when data-color is omitted', () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#10b981"/></svg>`;
      const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      expect(getGenericCoverColor(dataUri)).toBe('#10b981');
    });

    it('hashes title and author consistently into palette colors', () => {
      const color1 = getGenericCoverColor(undefined, 'O Alienista', 'Machado de Assis');
      const color2 = getGenericCoverColor(undefined, 'O Alienista', 'Machado de Assis');
      expect(color1).toBe(color2);
      expect(GENERIC_COVER_COLORS.some(c => c.hex.toLowerCase() === color1.toLowerCase())).toBe(true);
    });

    it('falls back to default first color when inputs are empty', () => {
      expect(getGenericCoverColor(undefined, '', '')).toBe(GENERIC_COVER_COLORS[0].hex);
    });
  });

  describe('getBookHighlightTheme (Dynamic Contrast Adjustment)', () => {
    it('boosts lightness in dark mode when raw color is too dark for readability', () => {
      const darkNavy = '#0a192f'; // Very dark blue (l < 20%)
      const theme = getBookHighlightTheme(darkNavy, true); // isDark = true

      const adjustedHsl = hexToHsl(theme.hex);
      expect(adjustedHsl.l).toBeGreaterThanOrEqual(56);
      expect(adjustedHsl.l).toBeLessThanOrEqual(68);
      expect(theme.rgb).toBeDefined();
      expect(theme.rgb.split(',').length).toBe(3);
    });

    it('reduces lightness in light mode when raw color is too bright for light backgrounds', () => {
      const paleYellow = '#fef08a'; // Very bright yellow (l > 75%)
      const theme = getBookHighlightTheme(paleYellow, false); // isDark = false

      const adjustedHsl = hexToHsl(theme.hex);
      expect(adjustedHsl.l).toBeLessThanOrEqual(42);
      expect(adjustedHsl.l).toBeGreaterThanOrEqual(32);
      expect(theme.rgb).toBeDefined();
    });

    it('preserves comfortable mid-range colors without extreme distortions', () => {
      const midBlue = '#3b82f6';
      const darkTheme = getBookHighlightTheme(midBlue, true);
      const lightTheme = getBookHighlightTheme(midBlue, false);

      expect(darkTheme.hex).toBeDefined();
      expect(lightTheme.hex).toBeDefined();
    });

    it('falls back gracefully on malformed or empty hex strings', () => {
      const fallback = getBookHighlightTheme('invalid-color', true);
      expect(fallback.hex.startsWith('#')).toBe(true);
      expect(fallback.rgb).toBeDefined();
    });
  });

  describe('getCoverTones', () => {
    it('computes rich harmonic palette from hex color', () => {
      const tones = getCoverTones('#6366f1');
      expect(tones.gradMid).toBe('#6366f1');
      expect(tones.gradStart.startsWith('#')).toBe(true);
      expect(tones.gradEnd.startsWith('#')).toBe(true);
      expect(tones.textColor.startsWith('#')).toBe(true);
      expect(tones.iconHex.startsWith('#')).toBe(true);
      expect(typeof tones.isLight).toBe('boolean');
    });
  });
});

