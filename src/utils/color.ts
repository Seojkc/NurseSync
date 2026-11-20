import {clamp} from './math';

// Darken (amt < 0) or lighten (amt > 0) a #RRGGBB color - used for 3D edges
export const shade = (hex: string, amt: number) => {
  const h = hex.replace('#', '');
  if (h.length !== 6) {
    return hex;
  }
  const n = parseInt(h, 16);
  const f = (v: number) =>
    Math.round(clamp(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt, 0, 255));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
};

// WCAG relative luminance of a #RRGGBB color (0 = black, 1 = white)
const luminance = (hex: string) => {
  const h = hex.replace('#', '');
  if (h.length !== 6) {
    return 0.5;
  }
  const n = parseInt(h, 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * lin((n >> 16) & 255) +
    0.7152 * lin((n >> 8) & 255) +
    0.0722 * lin(n & 255)
  );
};

export const DARK_TEXT = '#3B1D2E';

// Text color that stays readable on a tile: white on strong colors,
// deep plum on light pastels (peach, mint, butter...) where white would wash out.
export const tileTextColor = (bg: string) =>
  1.05 / (luminance(bg) + 0.05) >= 2.4 ? '#FFFFFF' : DARK_TEXT;
