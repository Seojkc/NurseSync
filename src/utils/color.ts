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
