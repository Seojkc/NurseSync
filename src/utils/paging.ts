import {clamp} from './math';

// Pages are months; page BASE_INDEX is the month the app was opened in.
export const PAGE_COUNT = 1200; // 50 years each way
export const BASE_INDEX = PAGE_COUNT / 2;
export const PAGES = Array.from({length: PAGE_COUNT}, (_, i) => i);

const BASE = (() => {
  const t = new Date();
  return {y: t.getFullYear(), m: t.getMonth()};
})();

export const monthOf = (index: number) =>
  new Date(BASE.y, BASE.m + (index - BASE_INDEX), 1);

export const indexOf = (d: Date) =>
  clamp(
    (d.getFullYear() - BASE.y) * 12 + (d.getMonth() - BASE.m) + BASE_INDEX,
    0,
    PAGE_COUNT - 1,
  );
