import {Assignments, ImportRow, Leave, Tile} from '../types';
import {fmtDate} from './date';

// Short tile name suggested from a vacation title, e.g. "Casual Leave" -> "CL"
export const suggestCode = (title: string) => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  const code =
    words.length === 1 ? words[0].slice(0, 2) : words.map(w => w[0]).join('');
  return code.toUpperCase().slice(0, 4);
};

// Returns an error message if this leave can't be used on that date
export const leaveProblem = (
  leave: Leave,
  key: string,
  assignments: Assignments,
  usedByLeave: Record<string, number>,
): string | null => {
  if (key < leave.start || key > leave.end) {
    return `${leave.title} can only be used from ${fmtDate(
      leave.start,
    )} to ${fmtDate(leave.end)}.`;
  }
  const alreadyHere = assignments[key] === leave.id;
  if (!alreadyHere && (usedByLeave[leave.id] || 0) >= leave.total) {
    return `All ${leave.total} ${leave.title} days are already used.`;
  }
  return null;
};

// Apply imported rows on top of the current assignments (pure).
// Leave rows outside their period, or over their total, are skipped.
export const buildImport = (
  assignments: Assignments,
  tileById: Record<string, Tile>,
  rows: ImportRow[],
): {next: Assignments; skipped: number} => {
  const next: Assignments = {...assignments};
  let skipped = 0;
  const countOf = (id: string, except: string) =>
    Object.keys(next).filter(k => k !== except && next[k] === id).length;

  rows.forEach(r => {
    const t = tileById[r.tileId];
    if (!t) {
      skipped++;
      return;
    }
    if (t.leave) {
      const outOfRange = r.key < t.leave.start || r.key > t.leave.end;
      if (outOfRange || countOf(t.id, r.key) >= t.leave.total) {
        skipped++;
        return;
      }
    }
    next[r.key] = t.id;
  });

  return {next, skipped};
};
