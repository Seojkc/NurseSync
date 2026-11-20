import {useEffect, useMemo, useState} from 'react';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {refreshWidgets} from '../../widget/ShiftCalendarWidget';
import {STORAGE_KEY} from '../constants';
import {Assignments, ImportRow, Leave, Notes, Shift, Tile} from '../types';
import {buildImport} from '../utils/leave';
import {newId} from '../utils/math';

// Owns the persisted data (shifts, leaves, assigned days) and everything derived from it.
export function useCalendarData() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [notes, setNotes] = useState<Notes>({});
  const [loaded, setLoaded] = useState(false);

  // Load saved data
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setShifts(
            (data.shifts ?? []).map((s: any) => ({
              ...s,
              hours: Number(s.hours) || 0,
            })),
          );
          setLeaves(data.leaves ?? []);
          setAssignments(data.assignments ?? {});
          setNotes(data.notes ?? {});
        }
      } catch (e) {
        // ignore - start empty
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Save on change (and refresh the home-screen widget)
  useEffect(() => {
    if (!loaded) {
      return;
    }
    const payload = {shifts, leaves, assignments, notes};
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      .catch(() => {})
      .finally(() => {
        if (Platform.OS === 'android') {
          refreshWidgets(payload);
        }
      });
  }, [shifts, leaves, assignments, notes, loaded]);

  // Every tile that can appear on a day (shifts first, then leaves)
  const tiles = useMemo<Tile[]>(
    () => [
      ...shifts.map(s => ({
        id: s.id,
        label: s.label,
        color: s.color,
        hours: s.hours,
      })),
      ...leaves.map(l => ({
        id: l.id,
        label: l.code,
        color: l.color,
        hours: 0,
        leave: l,
      })),
    ],
    [shifts, leaves],
  );

  const tileById = useMemo(() => {
    const m: Record<string, Tile> = {};
    tiles.forEach(t => (m[t.id] = t));
    return m;
  }, [tiles]);

  // How many days of each leave have been taken
  const usedByLeave = useMemo(() => {
    const m: Record<string, number> = {};
    Object.keys(assignments).forEach(k => {
      const t = tileById[assignments[k]];
      if (t && t.leave) {
        m[t.id] = (m[t.id] || 0) + 1;
      }
    });
    return m;
  }, [assignments, tileById]);

  const usedColors = useMemo(
    () => [...shifts, ...leaves].map(s => s.color),
    [shifts, leaves],
  );

  // ----- mutations -----

  const removeAssignmentsOf = (id: string) =>
    setAssignments(prev => {
      const next: Assignments = {};
      Object.keys(prev).forEach(k => {
        if (prev[k] !== id) {
          next[k] = prev[k];
        }
      });
      return next;
    });

  const setDay = (key: string, tileId: string) =>
    setAssignments(prev => ({...prev, [key]: tileId}));

  const clearDay = (key: string) =>
    setAssignments(prev => {
      const next = {...prev};
      delete next[key];
      return next;
    });

  const addNote = (key: string, text: string) =>
    setNotes(prev => ({
      ...prev,
      [key]: [...(prev[key] ?? []), {id: newId(), text}],
    }));

  const deleteNote = (key: string, id: string) =>
    setNotes(prev => {
      const left = (prev[key] ?? []).filter(n => n.id !== id);
      const next = {...prev};
      if (left.length) {
        next[key] = left;
      } else {
        delete next[key];
      }
      return next;
    });

  const addShift = (label: string, color: string, hours: number) =>
    setShifts(prev => [...prev, {id: newId(), label, color, hours}]);

  const deleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
    removeAssignmentsOf(id);
  };

  const addLeave = (leave: Leave) => setLeaves(prev => [...prev, leave]);

  const deleteLeave = (id: string) => {
    setLeaves(prev => prev.filter(l => l.id !== id));
    removeAssignmentsOf(id);
  };

  // Quick entry: write the rows into the calendar. Returns how many were skipped.
  const importRows = (rows: ImportRow[]): number => {
    const {next, skipped} = buildImport(assignments, tileById, rows);
    setAssignments(next);
    return skipped;
  };

  return {
    leaves,
    assignments,
    notes,
    tiles,
    tileById,
    usedByLeave,
    usedColors,
    setDay,
    clearDay,
    addNote,
    deleteNote,
    addShift,
    deleteShift,
    addLeave,
    deleteLeave,
    importRows,
  };
}
