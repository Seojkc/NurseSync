export const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

export const fmtHours = (n: number) => String(Math.round(n * 100) / 100);

export const newId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
