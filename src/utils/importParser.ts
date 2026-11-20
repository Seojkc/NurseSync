import {ImportEntry, ParsedImport} from '../types';
import {pad} from './date';

// Accepts the AI's reply even if it has code fences or extra words around it.
// Expected shape: {"month":"2026-11","days":{"1":"D2","2":"","7":"OFF"}}
export function parseImport(text: string, fallbackMonth: string): ParsedImport {
  const s = text.trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a === -1 || b <= a) {
    throw new Error('No JSON found. Paste the full text the AI gave you.');
  }

  let data: any;
  try {
    data = JSON.parse(s.slice(a, b + 1));
  } catch (e) {
    throw new Error(
      'Could not read that JSON. Ask the AI to return only the JSON again.',
    );
  }

  const rawDays = data && typeof data.days === 'object' ? data.days : null;
  if (!rawDays) {
    throw new Error('The JSON has no "days" section.');
  }

  let month = fallbackMonth;
  if (
    typeof data.month === 'string' &&
    /^\d{4}-\d{1,2}$/.test(data.month.trim())
  ) {
    const [yy, mm] = data.month.trim().split('-').map(Number);
    if (mm >= 1 && mm <= 12) {
      month = `${yy}-${pad(mm)}`;
    }
  }
  const [y, m] = month.split('-').map(Number);
  const dim = new Date(y, m, 0).getDate();

  const entries: ImportEntry[] = [];
  Object.keys(rawDays).forEach(k => {
    const day = Number(k);
    if (!Number.isInteger(day) || day < 1 || day > dim) {
      return;
    }
    const v = rawDays[k];
    let code = v == null ? '' : String(v).trim().toUpperCase();
    if (code === '?' || code === 'NULL' || code === 'UNCLEAR') {
      code = '';
    }
    entries.push({day, key: `${month}-${pad(day)}`, code});
  });

  entries.sort((p, q) => p.day - q.day);
  if (entries.length === 0) {
    throw new Error('No valid days were found in that JSON.');
  }
  return {month, entries};
}
