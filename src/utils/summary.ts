import {Assignments, Leave, Tile} from '../types';
import {fmtHours} from './math';

// "96 hours, 2 CL" for the month being viewed
export const monthSummary = (
  monthKey: string,
  assignments: Assignments,
  tileById: Record<string, Tile>,
  leaves: Leave[],
) => {
  const prefix = `${monthKey}-`;
  let hours = 0;
  const counts: Record<string, number> = {};

  Object.keys(assignments).forEach(k => {
    if (!k.startsWith(prefix)) {
      return;
    }
    const t = tileById[assignments[k]];
    if (!t) {
      return;
    }
    if (t.leave) {
      counts[t.id] = (counts[t.id] || 0) + 1;
    } else {
      hours += t.hours;
    }
  });

  const parts = [`${fmtHours(hours)} ${hours === 1 ? 'hour' : 'hours'}`];
  leaves.forEach(l => {
    if (counts[l.id]) {
      parts.push(`${counts[l.id]} ${l.code}`);
    }
  });
  return parts.join(', ');
};
