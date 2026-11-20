import {useEffect, useMemo, useState} from 'react';
import {Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CODE_MAP_KEY, NONE} from '../constants';
import {ImportRow, ParsedImport, Tile} from '../types';
import {clipboardAvailable, readClipboard} from '../utils/clipboard';
import {fmtMonthKey} from '../utils/date';
import {parseImport} from '../utils/importParser';

type Params = {
  visible: boolean;
  tiles: Tile[];
  viewMonthKey: string;
  onImport: (rows: ImportRow[]) => void;
  onClose: () => void;
};

// All the state + logic of the quick-entry flow:
// paste JSON -> map each code to a tile -> preview/fix per day -> import.
export function useQuickEntry({
  visible,
  tiles,
  viewMonthKey,
  onImport,
  onClose,
}: Params) {
  const [step, setStep] = useState<'paste' | 'preview'>('paste');
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [error, setError] = useState('');
  const [choices, setChoices] = useState<Record<string, string>>({}); // this session
  const [saved, setSaved] = useState<Record<string, string>>({}); // remembered
  const [rowChoices, setRowChoices] = useState<Record<number, string>>({});
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Remembered code -> tile choices
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CODE_MAP_KEY);
        if (raw) {
          setSaved(JSON.parse(raw));
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Collapse any open dropdown whenever the card is shown/hidden or the step changes.
  // (Pasted text and decoded data are kept so you can go add a tile and come back.)
  useEffect(() => {
    setOpenKey(null);
  }, [visible, step]);

  const tileIdSet = useMemo(() => new Set(tiles.map(t => t.id)), [tiles]);

  // What each code currently maps to: this-session choice > remembered > same-name tile
  const resolve = (code: string): string | undefined => {
    const c = choices[code] ?? saved[code];
    if (c === NONE) {
      return NONE;
    }
    if (c && tileIdSet.has(c)) {
      return c;
    }
    const auto = tiles.find(t => t.label.trim().toUpperCase() === code);
    return auto ? auto.id : undefined;
  };

  const codes = useMemo(() => {
    if (!parsed) {
      return [] as {code: string; count: number}[];
    }
    const counts: Record<string, number> = {};
    parsed.entries.forEach(e => {
      if (e.code) {
        counts[e.code] = (counts[e.code] || 0) + 1;
      }
    });
    return Object.keys(counts)
      .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}))
      .map(code => ({code, count: counts[code]}));
  }, [parsed]);

  const unclearCount = parsed ? parsed.entries.filter(e => !e.code).length : 0;
  const allMapped =
    codes.length > 0 && codes.every(c => resolve(c.code) !== undefined);
  const monthLabel = parsed ? fmtMonthKey(parsed.month) : '';

  const previewCount = parsed
    ? parsed.entries.filter(e => {
        const c = rowChoices[e.day];
        return c && c !== NONE && tileIdSet.has(c);
      }).length
    : 0;

  // ----- actions -----

  const changeText = (t: string) => {
    setText(t);
    setParsed(null);
    setError('');
  };

  const pasteFromClipboard = async () => {
    if (!clipboardAvailable()) {
      Alert.alert(
        'Paste button not ready',
        'Install @react-native-clipboard/clipboard and rebuild the app. Until then, long-press the box and choose Paste.',
      );
      return;
    }
    try {
      const t = await readClipboard();
      if (!t || !t.trim()) {
        Alert.alert(
          'Clipboard is empty',
          'Copy the AI reply first, then tap Paste.',
        );
        return;
      }
      changeText(t);
    } catch (e) {
      Alert.alert('Could not read the clipboard');
    }
  };

  const clearAll = () => {
    setText('');
    setParsed(null);
    setError('');
    setChoices({});
    setRowChoices({});
    setStep('paste');
  };

  const readData = () => {
    try {
      const p = parseImport(text, viewMonthKey);
      setParsed(p);
      setError('');
      setChoices({});
      setOpenKey(null);
    } catch (e: any) {
      setParsed(null);
      setError(e?.message ?? 'Could not read the data.');
    }
  };

  const chooseCode = (code: string, value: string) => {
    setChoices(prev => ({...prev, [code]: value}));
    setOpenKey(null);
  };

  const chooseRow = (day: number, value: string) => {
    setRowChoices(prev => ({...prev, [day]: value}));
    setOpenKey(null);
  };

  const toggleOpen = (key: string) =>
    setOpenKey(prev => (prev === key ? null : key));

  const goNext = () => {
    if (!parsed || !allMapped) {
      return;
    }
    // remember the mapping for next time
    const merged: Record<string, string> = {...saved};
    codes.forEach(c => {
      const r = resolve(c.code);
      if (r) {
        merged[c.code] = r;
      }
    });
    setSaved(merged);
    AsyncStorage.setItem(CODE_MAP_KEY, JSON.stringify(merged)).catch(() => {});

    const rows: Record<number, string> = {};
    parsed.entries.forEach(e => {
      rows[e.day] = e.code ? resolve(e.code) ?? NONE : NONE;
    });
    setRowChoices(rows);
    setStep('preview');
  };

  const addToCalendar = () => {
    if (!parsed) {
      return;
    }
    const out: ImportRow[] = [];
    parsed.entries.forEach(e => {
      const c = rowChoices[e.day];
      if (c && c !== NONE && tileIdSet.has(c)) {
        out.push({key: e.key, tileId: c});
      }
    });
    if (out.length === 0) {
      Alert.alert('Nothing to add', 'Choose a tile for at least one day.');
      return;
    }
    onImport(out);
    clearAll();
    onClose();
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('paste');
    } else {
      onClose();
    }
  };

  return {
    step,
    setStep,
    text,
    parsed,
    error,
    codes,
    unclearCount,
    allMapped,
    monthLabel,
    previewCount,
    openKey,
    rowChoices,
    resolve,
    changeText,
    pasteFromClipboard,
    clearAll,
    readData,
    chooseCode,
    chooseRow,
    toggleOpen,
    goNext,
    addToCalendar,
    handleBack,
  };
}

export type QuickEntryState = ReturnType<typeof useQuickEntry>;
