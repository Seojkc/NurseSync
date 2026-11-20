import {MONTHS, MONTHS_SHORT, WEEKDAYS_SHORT} from '../constants';

export const pad = (n: number) => String(n).padStart(2, '0');

export const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const keyToDate = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const fmtDate = (k: string) => {
  const d = keyToDate(k);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${d.getFullYear()}`;
};

export const fmtLong = (k: string) => {
  const d = keyToDate(k);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${fmtDate(k)}`;
};

// "2026-11" -> "November 2026"
export const fmtMonthKey = (monthKey: string) => {
  const [y, m] = monthKey.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

// inclusive number of days between two keys
export const daysBetween = (a: string, b: string) =>
  Math.round((keyToDate(b).getTime() - keyToDate(a).getTime()) / 86400000) + 1;
