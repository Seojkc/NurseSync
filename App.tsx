import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {refreshWidgets} from './widget/ShiftCalendarWidget';

// ---------- Types & constants ----------

type Shift = {id: string; label: string; color: string; hours: number};
type Leave = {
  id: string;
  title: string;
  code: string; // short name shown on the tile, e.g. "CL"
  color: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  total: number; // allowed days in the period
};
// A tile is anything that can be put on a day: a shift or a leave type
type Tile = {
  id: string;
  label: string;
  color: string;
  hours: number;
  leave?: Leave;
};
type Assignments = Record<string, string>; // 'YYYY-MM-DD' -> tile id

const STORAGE_KEY = '@shift_calendar_v1';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTHS_SHORT = MONTHS.map(m => m.slice(0, 3));
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const COLORS = [
  '#2E9D5B', // green
  '#2F7DE1', // blue
  '#E08A1E', // orange
  '#8E54D9', // purple
  '#D64545', // red
  '#17A2B8', // teal
  '#D6498F', // pink
  '#6B7280', // gray
  '#B58900', // mustard
  '#3F51B5', // indigo
];

const PRESETS: {label: string; color: string; hours: string}[] = [
  {label: 'AM', color: COLORS[2], hours: '8'},
  {label: 'PM', color: COLORS[1], hours: '8'},
  {label: 'Night', color: COLORS[3], hours: '8'},
  {label: 'Off', color: COLORS[7], hours: '0'},
];

// ---------- Date helpers ----------

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const keyToDate = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const fmtDate = (k: string) => {
  const d = keyToDate(k);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${d.getFullYear()}`;
};
const fmtLong = (k: string) => {
  const d = keyToDate(k);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${fmtDate(k)}`;
};
// inclusive number of days between two keys
const daysBetween = (a: string, b: string) =>
  Math.round((keyToDate(b).getTime() - keyToDate(a).getTime()) / 86400000) + 1;
const fmtHours = (n: number) => String(Math.round(n * 100) / 100);
const newId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

// ---------- Month paging ----------
// Pages are months; page BASE_INDEX is the month the app was opened in.

const PAGE_COUNT = 1200; // 50 years each way
const BASE_INDEX = PAGE_COUNT / 2;
const PAGES = Array.from({length: PAGE_COUNT}, (_, i) => i);
const BASE = (() => {
  const t = new Date();
  return {y: t.getFullYear(), m: t.getMonth()};
})();
const monthOf = (index: number) =>
  new Date(BASE.y, BASE.m + (index - BASE_INDEX), 1);
const indexOf = (d: Date) =>
  clamp(
    (d.getFullYear() - BASE.y) * 12 + (d.getMonth() - BASE.m) + BASE_INDEX,
    0,
    PAGE_COUNT - 1,
  );

// ---------- App ----------

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Calendar />
    </SafeAreaProvider>
  );
}

function Calendar() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [selected, setSelected] = useState<Date>(today);
  const [pageIndex, setPageIndex] = useState(BASE_INDEX);
  const pageRef = useRef(BASE_INDEX); // always-current page, safe in callbacks
  const listRef = useRef<FlatList<number>>(null);
  const [size, setSize] = useState<{w: number; h: number} | null>(null);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [loaded, setLoaded] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [vacOpen, setVacOpen] = useState(false);

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
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({shifts, leaves, assignments}),
    )
      .then(() => {
        if (Platform.OS === 'android') {
          refreshWidgets();
        }
      })
      .catch(() => {});
  }, [shifts, leaves, assignments, loaded]);

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

  const viewMonth = useMemo(() => monthOf(pageIndex), [pageIndex]);

  // "96 hours, 2 CL" for the month being viewed
  const summary = useMemo(() => {
    const prefix = `${viewMonth.getFullYear()}-${pad(viewMonth.getMonth() + 1)}-`;
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
  }, [assignments, tileById, leaves, viewMonth]);

  // ----- navigation -----

  const scrollToPage = (idx: number, animated: boolean) => {
    listRef.current?.scrollToIndex({index: idx, animated});
  };

  // Called when the visible month changes by swipe / arrows
  const applyPage = (idx: number) => {
    if (idx === pageRef.current) {
      return;
    }
    pageRef.current = idx;
    setPageIndex(idx);
    const m = monthOf(idx);
    const isThisMonth =
      m.getFullYear() === today.getFullYear() &&
      m.getMonth() === today.getMonth();
    setSelected(isThisMonth ? today : m); // today, else the 1st
  };

  // Select a date and make sure its month is showing
  const goTo = (d: Date) => {
    setSelected(d);
    const idx = indexOf(d);
    if (idx !== pageRef.current) {
      const animated = Math.abs(idx - pageRef.current) <= 1;
      pageRef.current = idx;
      setPageIndex(idx);
      scrollToPage(idx, animated);
    }
  };

  const changeMonth = (delta: number) => {
    const idx = clamp(pageRef.current + delta, 0, PAGE_COUNT - 1);
    if (idx === pageRef.current) {
      return;
    }
    scrollToPage(idx, true);
    applyPage(idx);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!size) {
      return;
    }
    const idx = Math.round(e.nativeEvent.contentOffset.x / size.w);
    applyPage(clamp(idx, 0, PAGE_COUNT - 1));
  };

  // ----- shifts & leaves -----

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

  // Returns an error message if this leave can't be used on that date
  const leaveProblem = (leave: Leave, key: string): string | null => {
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

  const selectedKey = toKey(selected);
  const todayKey = toKey(today);

  const applyTile = (tile: Tile) => {
    if (tile.leave) {
      const problem = leaveProblem(tile.leave, selectedKey);
      if (problem) {
        Alert.alert(`${tile.label} not available`, problem);
        return;
      }
    }
    setAssignments(prev => ({...prev, [selectedKey]: tile.id}));
    goTo(addDays(selected, 1)); // auto-advance to the next day
  };

  const confirmDeleteShift = (tile: Tile) => {
    Alert.alert(
      `Delete "${tile.label}"?`,
      'Days using this shift will be cleared too.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setShifts(prev => prev.filter(s => s.id !== tile.id));
            removeAssignmentsOf(tile.id);
          },
        },
      ],
    );
  };

  const confirmDeleteLeave = (leave: Leave, after?: () => void) => {
    const used = usedByLeave[leave.id] || 0;
    Alert.alert(
      `Delete "${leave.title}"?`,
      used > 0
        ? `This also clears ${used} day${used === 1 ? '' : 's'} from the calendar.`
        : 'This vacation type will be removed.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLeaves(prev => prev.filter(l => l.id !== leave.id));
            removeAssignmentsOf(leave.id);
            after?.();
          },
        },
      ],
    );
  };

  const addShift = (label: string, color: string, hours: number) => {
    setShifts(prev => [...prev, {id: newId(), label, color, hours}]);
    setShiftModalOpen(false);
  };

  const addLeave = (leave: Leave) => setLeaves(prev => [...prev, leave]);

  const jumpToDate = (key: string) => {
    setVacOpen(false);
    goTo(keyToDate(key));
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={12}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Text style={styles.title}>
          {viewMonth.getFullYear()} {MONTHS[viewMonth.getMonth()]}
        </Text>
        <Pressable onPress={() => changeMonth(1)} hitSlop={12}>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
        <View style={{flex: 1}} />
        <Pressable
          onPress={() => setVacOpen(true)}
          style={styles.iconBtn}
          hitSlop={6}>
          <Text style={styles.iconEmoji}>🌴</Text>
        </Pressable>
        <Pressable onPress={() => goTo(today)} style={styles.iconBtn}>
          <Text style={styles.todayBtnText}>{today.getDate()}</Text>
        </Pressable>
      </View>
      <Text style={styles.summary}>{summary}</Text>

      {/* Weekday labels */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={[styles.weekday, i === 0 && styles.sunday]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Swipeable months */}
      <View
        style={styles.pager}
        onLayout={e => {
          const {width, height} = e.nativeEvent.layout;
          setSize(prev =>
            prev && prev.w === width && prev.h === height
              ? prev
              : {w: width, h: height},
          );
        }}>
        {size && (
          <FlatList
            key={`pager-${size.w}`}
            ref={listRef}
            data={PAGES}
            keyExtractor={i => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={pageRef.current}
            getItemLayout={(_, index) => ({
              length: size.w,
              offset: size.w * index,
              index,
            })}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            extraData={{selectedKey, assignments, tileById}}
            onMomentumScrollEnd={onScrollEnd}
            style={{height: size.h}}
            renderItem={({item}) => {
              const m = monthOf(item);
              return (
                <View style={{width: size.w, height: size.h}}>
                  <MonthGrid
                    year={m.getFullYear()}
                    month={m.getMonth()}
                    selectedKey={selectedKey}
                    todayKey={todayKey}
                    assignments={assignments}
                    tileById={tileById}
                    onSelect={goTo}
                  />
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomWrap}>
        <View style={styles.bottomBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tilesContent}>
            {tiles.map(t => {
              const blocked = t.leave
                ? leaveProblem(t.leave, selectedKey) !== null
                : false;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => applyTile(t)}
                  onLongPress={() =>
                    t.leave ? confirmDeleteLeave(t.leave) : confirmDeleteShift(t)
                  }
                  delayLongPress={500}
                  style={({pressed}) => [
                    styles.barTile,
                    {backgroundColor: t.color},
                    blocked && {opacity: 0.35},
                    pressed && {opacity: 0.7},
                  ]}>
                  <Text style={styles.barTileText} numberOfLines={1}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            onPress={() => setShiftModalOpen(true)}
            style={styles.plusBtn}
            hitSlop={8}>
            <Text style={styles.plusText}>+</Text>
          </Pressable>
        </View>
      </View>

      <AddShiftModal
        visible={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        onAdd={addShift}
        usedColors={[...shifts, ...leaves].map(s => s.color)}
      />

      <VacationModal
        visible={vacOpen}
        onClose={() => setVacOpen(false)}
        leaves={leaves}
        assignments={assignments}
        usedByLeave={usedByLeave}
        usedColors={[...shifts, ...leaves].map(s => s.color)}
        onAdd={addLeave}
        onDelete={confirmDeleteLeave}
        onJump={jumpToDate}
      />
    </SafeAreaView>
  );
}

// ---------- One month page ----------

function MonthGrid({
  year,
  month,
  selectedKey,
  todayKey,
  assignments,
  tileById,
  onSelect,
}: {
  year: number;
  month: number;
  selectedKey: string;
  todayKey: string;
  assignments: Assignments;
  tileById: Record<string, Tile>;
  onSelect: (d: Date) => void;
}) {
  // 6 weeks, starting on the Sunday on/before the 1st
  const rows = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = addDays(first, -first.getDay());
    const cells = Array.from({length: 42}, (_, i) => addDays(start, i));
    return Array.from({length: 6}, (_, r) => cells.slice(r * 7, r * 7 + 7));
  }, [year, month]);

  return (
    <View style={styles.grid}>
      {rows.map((row, r) => (
        <View key={r} style={styles.gridRow}>
          {row.map(date => {
            const key = toKey(date);
            const inMonth = date.getMonth() === month;
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;
            const tile = tileById[assignments[key]];
            return (
              <Pressable
                key={key}
                onPress={() => onSelect(date)}
                style={[
                  styles.cell,
                  !inMonth && styles.cellOut,
                  isSelected && styles.cellSelected,
                ]}>
                <View style={[styles.dayCircle, isToday && styles.dayToday]}>
                  <Text
                    style={[
                      styles.dayText,
                      date.getDay() === 0 && styles.sunday,
                      !inMonth && styles.dayTextOut,
                      isToday && styles.dayTextToday,
                    ]}>
                    {date.getDate()}
                  </Text>
                </View>
                {tile && (
                  <View
                    style={[
                      styles.cellTile,
                      {backgroundColor: tile.color},
                      !inMonth && {opacity: 0.45},
                    ]}>
                    <Text style={styles.cellTileText} numberOfLines={1}>
                      {tile.label}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ---------- Add shift modal ----------

function AddShiftModal({
  visible,
  onClose,
  onAdd,
  usedColors,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (label: string, color: string, hours: number) => void;
  usedColors: string[];
}) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [hours, setHours] = useState('8');

  // Reset each time it opens; default to first unused color
  useEffect(() => {
    if (visible) {
      setLabel('');
      setHours('8');
      setColor(COLORS.find(c => !usedColors.includes(c)) ?? COLORS[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const hoursNum = Number(hours.replace(',', '.'));
  const hoursOk =
    hours.trim() !== '' &&
    isFinite(hoursNum) &&
    hoursNum >= 0 &&
    hoursNum <= 24;
  const canAdd = label.trim().length > 0 && hoursOk;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add shift</Text>

          <View style={styles.presetRow}>
            {PRESETS.map(p => (
              <Pressable
                key={p.label}
                onPress={() => {
                  setLabel(p.label);
                  setColor(p.color);
                  setHours(p.hours);
                }}
                style={[styles.presetChip, {borderColor: p.color}]}>
                <Text style={[styles.presetText, {color: p.color}]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Shift name (e.g. AM)"
            placeholderTextColor="#777"
            maxLength={8}
            style={styles.input}
          />

          <Text style={styles.modalLabel}>Hours</Text>
          <TextInput
            value={hours}
            onChangeText={t => setHours(t.replace(/[^0-9.,]/g, ''))}
            placeholder="e.g. 8 (0 for off)"
            placeholderTextColor="#777"
            keyboardType="decimal-pad"
            maxLength={5}
            style={styles.input}
          />
          {!hoursOk && hours.trim() !== '' && (
            <Text style={styles.errorText}>Enter hours between 0 and 24.</Text>
          )}

          <Text style={styles.modalLabel}>Color</Text>
          <ColorRow value={color} onChange={setColor} />

          <View style={styles.previewRow}>
            <Text style={[styles.modalLabel, {marginBottom: 0}]}>Preview</Text>
            <View style={[styles.barTile, {backgroundColor: color}]}>
              <Text style={styles.barTileText}>{label.trim() || '—'}</Text>
            </View>
            <Text style={styles.previewHours}>
              {hoursOk ? `${fmtHours(hoursNum)} h` : ''}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!canAdd}
              onPress={() => onAdd(label.trim(), color, hoursNum)}
              style={[styles.modalBtn, !canAdd && {opacity: 0.35}]}>
              <Text style={[styles.modalBtnText, {color: '#4DA3FF'}]}>Add</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ColorRow({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <View style={styles.colorRow}>
      {COLORS.map(c => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          style={[
            styles.colorDot,
            {backgroundColor: c},
            value === c && styles.colorDotActive,
          ]}
        />
      ))}
    </View>
  );
}

// ---------- Vacation modal (list / detail / add) ----------

function VacationModal({
  visible,
  onClose,
  leaves,
  assignments,
  usedByLeave,
  usedColors,
  onAdd,
  onDelete,
  onJump,
}: {
  visible: boolean;
  onClose: () => void;
  leaves: Leave[];
  assignments: Assignments;
  usedByLeave: Record<string, number>;
  usedColors: string[];
  onAdd: (leave: Leave) => void;
  onDelete: (leave: Leave, after?: () => void) => void;
  onJump: (key: string) => void;
}) {
  const [screen, setScreen] = useState<'list' | 'detail' | 'add'>('list');
  const [detailId, setDetailId] = useState<string | null>(null);
  const {height} = useWindowDimensions();

  useEffect(() => {
    if (visible) {
      setScreen('list');
      setDetailId(null);
    }
  }, [visible]);

  const detail = leaves.find(l => l.id === detailId) ?? null;
  const current = screen === 'detail' && !detail ? 'list' : screen;

  const handleBack = () => {
    if (current === 'list') {
      onClose();
    } else {
      setScreen('list');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBack}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalCard, {maxHeight: height * 0.85}]}>
          {current === 'list' && (
            <>
              <View style={styles.vacHeader}>
                <Text style={styles.modalTitle}>Vacations</Text>
                <Pressable
                  onPress={() => setScreen('add')}
                  style={styles.vacPlus}
                  hitSlop={8}>
                  <Text style={styles.vacPlusText}>+</Text>
                </Pressable>
              </View>
              <ScrollView style={styles.vacScroll}>
                {leaves.length === 0 && (
                  <Text style={styles.emptyText}>
                    No vacation types yet. Tap + to add one, e.g. Casual Leave.
                  </Text>
                )}
                {leaves.map(l => (
                  <Pressable
                    key={l.id}
                    onPress={() => {
                      setDetailId(l.id);
                      setScreen('detail');
                    }}
                    style={styles.vacRow}>
                    <View style={[styles.codeChip, {backgroundColor: l.color}]}>
                      <Text style={styles.codeChipText} numberOfLines={1}>
                        {l.code}
                      </Text>
                    </View>
                    <View style={{flex: 1}}>
                      <View style={styles.vacRowTop}>
                        <Text style={styles.vacTitle} numberOfLines={1}>
                          {l.title}
                        </Text>
                        <Text style={styles.vacCount}>
                          {usedByLeave[l.id] || 0}/{l.total}
                        </Text>
                      </View>
                      <Text style={styles.vacPeriod}>
                        {fmtDate(l.start)} - {fmtDate(l.end)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.modalActions}>
                <Pressable onPress={onClose} style={styles.modalBtn}>
                  <Text style={styles.modalBtnText}>Done</Text>
                </Pressable>
              </View>
            </>
          )}

          {current === 'detail' && detail && (
            <LeaveDetail
              leave={detail}
              used={usedByLeave[detail.id] || 0}
              days={Object.keys(assignments)
                .filter(k => assignments[k] === detail.id)
                .sort()}
              onBack={() => setScreen('list')}
              onJump={onJump}
              onDelete={() => onDelete(detail, () => setScreen('list'))}
            />
          )}

          {current === 'add' && (
            <AddLeaveForm
              existingCodes={leaves.map(l => l.code.toUpperCase())}
              usedColors={usedColors}
              onCancel={() => setScreen('list')}
              onSave={leave => {
                onAdd(leave);
                setScreen('list');
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function LeaveDetail({
  leave,
  used,
  days,
  onBack,
  onJump,
  onDelete,
}: {
  leave: Leave;
  used: number;
  days: string[];
  onBack: () => void;
  onJump: (key: string) => void;
  onDelete: () => void;
}) {
  const left = Math.max(0, leave.total - used);
  return (
    <>
      <View style={styles.vacHeader}>
        <Pressable onPress={onBack} hitSlop={10}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>
      <View style={styles.detailTop}>
        <View style={[styles.codeChip, {backgroundColor: leave.color}]}>
          <Text style={styles.codeChipText} numberOfLines={1}>
            {leave.code}
          </Text>
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.vacTitle}>{leave.title}</Text>
          <Text style={styles.vacPeriod}>
            {fmtDate(leave.start)} - {fmtDate(leave.end)}
          </Text>
        </View>
      </View>
      <Text style={styles.detailSummary}>
        {used}/{leave.total} taken · {left} left
      </Text>

      <ScrollView style={styles.vacScroll}>
        {days.length === 0 && (
          <Text style={styles.emptyText}>
            No days taken yet. Select a date in the calendar and tap {leave.code}.
          </Text>
        )}
        {days.map((k, i) => (
          <Pressable key={k} onPress={() => onJump(k)} style={styles.dayRow}>
            <Text style={styles.dayRowIndex}>{i + 1}</Text>
            <Text style={styles.dayRowText}>{fmtLong(k)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.modalActions}>
        <Pressable onPress={onDelete} style={styles.modalBtn}>
          <Text style={[styles.modalBtnText, {color: '#E5483B'}]}>Delete</Text>
        </Pressable>
      </View>
    </>
  );
}

const suggestCode = (title: string) => {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '';
  }
  const code =
    words.length === 1
      ? words[0].slice(0, 2)
      : words.map(w => w[0]).join('');
  return code.toUpperCase().slice(0, 4);
};

function AddLeaveForm({
  existingCodes,
  usedColors,
  onCancel,
  onSave,
}: {
  existingCodes: string[];
  usedColors: string[];
  onCancel: () => void;
  onSave: (leave: Leave) => void;
}) {
  const year = new Date().getFullYear();
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [color, setColor] = useState(
    COLORS.find(c => !usedColors.includes(c)) ?? COLORS[0],
  );
  const [start, setStart] = useState(`${year}-01-01`);
  const [end, setEnd] = useState(`${year}-12-31`);
  const [total, setTotal] = useState('');
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);

  const totalNum = /^\d+$/.test(total.trim()) ? parseInt(total.trim(), 10) : NaN;
  const periodDays = end >= start ? daysBetween(start, end) : 0;
  const codeUp = code.trim().toUpperCase();

  let error = '';
  if (end < start) {
    error = 'End date must be on or after the start date.';
  } else if (!isNaN(totalNum) && totalNum > periodDays) {
    error = `The period only has ${periodDays} days.`;
  } else if (codeUp && existingCodes.includes(codeUp)) {
    error = `Short name "${codeUp}" is already used.`;
  }
  const valid =
    title.trim().length > 0 &&
    codeUp.length > 0 &&
    !isNaN(totalNum) &&
    totalNum >= 1 &&
    error === '';

  if (picker) {
    return (
      <DatePicker
        title={picker === 'start' ? 'Start date' : 'End date'}
        value={picker === 'start' ? start : end}
        onCancel={() => setPicker(null)}
        onPick={key => {
          if (picker === 'start') {
            setStart(key);
            if (key > end) {
              setEnd(key);
            }
          } else {
            setEnd(key);
            if (key < start) {
              setStart(key);
            }
          }
          setPicker(null);
        }}
      />
    );
  }

  return (
    <>
      <Text style={styles.modalTitle}>Add vacation</Text>
      <ScrollView
        style={styles.vacScroll}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.modalLabel}>Title</Text>
        <TextInput
          value={title}
          onChangeText={t => {
            setTitle(t);
            if (!codeTouched) {
              setCode(suggestCode(t));
            }
          }}
          placeholder="e.g. Casual Leave"
          placeholderTextColor="#777"
          maxLength={30}
          style={styles.input}
        />

        <Text style={styles.modalLabel}>Short name (shown on the tile)</Text>
        <TextInput
          value={code}
          onChangeText={t => {
            setCodeTouched(true);
            setCode(t.toUpperCase());
          }}
          placeholder="e.g. CL"
          placeholderTextColor="#777"
          autoCapitalize="characters"
          maxLength={4}
          style={styles.input}
        />

        <Text style={styles.modalLabel}>Period</Text>
        <View style={styles.dateRow}>
          <Pressable style={styles.dateBtn} onPress={() => setPicker('start')}>
            <Text style={styles.dateBtnLabel}>Start</Text>
            <Text style={styles.dateBtnText}>{fmtDate(start)}</Text>
          </Pressable>
          <Pressable style={styles.dateBtn} onPress={() => setPicker('end')}>
            <Text style={styles.dateBtnLabel}>End</Text>
            <Text style={styles.dateBtnText}>{fmtDate(end)}</Text>
          </Pressable>
        </View>

        <Text style={styles.modalLabel}>Number of days in total</Text>
        <TextInput
          value={total}
          onChangeText={t => setTotal(t.replace(/[^0-9]/g, ''))}
          placeholder="e.g. 15"
          placeholderTextColor="#777"
          keyboardType="number-pad"
          maxLength={3}
          style={styles.input}
        />

        <Text style={styles.modalLabel}>Color</Text>
        <ColorRow value={color} onChange={setColor} />

        {error !== '' && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <View style={styles.modalActions}>
        <Pressable onPress={onCancel} style={styles.modalBtn}>
          <Text style={styles.modalBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          disabled={!valid}
          onPress={() =>
            onSave({
              id: newId(),
              title: title.trim(),
              code: codeUp,
              color,
              start,
              end,
              total: totalNum,
            })
          }
          style={[styles.modalBtn, !valid && {opacity: 0.35}]}>
          <Text style={[styles.modalBtnText, {color: '#4DA3FF'}]}>Save</Text>
        </Pressable>
      </View>
    </>
  );
}

// ---------- Simple date picker (no extra dependency) ----------

function DatePicker({
  title,
  value,
  onPick,
  onCancel,
}: {
  title: string;
  value: string;
  onPick: (key: string) => void;
  onCancel: () => void;
}) {
  const init = keyToDate(value);
  const [y, setY] = useState(init.getFullYear());
  const [m, setM] = useState(init.getMonth());

  const blanks = new Date(y, m, 1).getDay();
  const dim = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({length: blanks}, () => null),
    ...Array.from({length: dim}, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return (
    <>
      <Text style={styles.modalTitle}>{title}</Text>
      <View style={styles.yearRow}>
        <Pressable onPress={() => setY(y - 1)} hitSlop={10}>
          <Text style={styles.arrow}>‹</Text>
        </Pressable>
        <Text style={styles.yearText}>{y}</Text>
        <Pressable onPress={() => setY(y + 1)} hitSlop={10}>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.monthWrap}>
        {MONTHS_SHORT.map((name, i) => (
          <Pressable
            key={name}
            onPress={() => setM(i)}
            style={[styles.monthChip, m === i && styles.monthChipActive]}>
            <Text
              style={[styles.monthChipText, m === i && {color: '#000'}]}>
              {name}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.dayWrap}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`h${i}`} style={styles.pickWeekday}>
            {d}
          </Text>
        ))}
        {cells.map((d, i) => {
          if (d === null) {
            return <View key={`b${i}`} style={styles.pickDay} />;
          }
          const key = `${y}-${pad(m + 1)}-${pad(d)}`;
          const active = key === value;
          return (
            <Pressable
              key={key}
              onPress={() => onPick(key)}
              style={styles.pickDay}>
              <View style={[styles.pickDayInner, active && styles.pickDayActive]}>
                <Text style={[styles.pickDayText, active && {color: '#000'}]}>
                  {d}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.modalActions}>
        <Pressable onPress={onCancel} style={styles.modalBtn}>
          <Text style={styles.modalBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    minHeight: 72,
    gap: 10,
  },
  title: {color: '#fff', fontSize: 22, fontWeight: '700'},
  arrow: {color: '#fff', fontSize: 30, lineHeight: 32, paddingHorizontal: 4},
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {fontSize: 18},
  todayBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  summary: {
    color: '#9a9a9f',
    fontSize: 13,
    paddingHorizontal: 18,
    paddingBottom: 8,
  },

  weekRow: {flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 6},
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sunday: {color: '#E5483B'},

  pager: {flex: 1},
  grid: {flex: 1, paddingHorizontal: 8, gap: 4},
  gridRow: {flex: 1, flexDirection: 'row', gap: 4},
  cell: {
    flex: 1,
    backgroundColor: '#151515',
    borderRadius: 8,
    alignItems: 'center',
    paddingTop: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  cellOut: {backgroundColor: '#0d0d0d'},
  cellSelected: {borderColor: '#fff'},
  dayCircle: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {backgroundColor: '#4DA3FF'},
  dayText: {color: '#fff', fontSize: 16, fontWeight: '500'},
  dayTextOut: {color: '#666'},
  dayTextToday: {color: '#000', fontWeight: '700'},
  cellTile: {
    marginTop: 4,
    alignSelf: 'stretch',
    marginHorizontal: 2,
    borderRadius: 5,
    paddingVertical: 3,
    alignItems: 'center',
  },
  cellTileText: {color: '#fff', fontSize: 11, fontWeight: '700'},

  bottomWrap: {paddingHorizontal: 16, paddingVertical: 12},
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 32,
    height: 64,
    paddingLeft: 12,
    paddingRight: 8,
  },
  tilesContent: {alignItems: 'center', gap: 8, paddingRight: 8},
  barTile: {
    minWidth: 56,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTileText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  plusBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  plusText: {color: '#fff', fontSize: 36, lineHeight: 40, fontWeight: '300'},

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20},
  modalTitle: {color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 14},
  presetRow: {flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap'},
  presetChip: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  presetText: {fontSize: 14, fontWeight: '600'},
  input: {
    backgroundColor: '#2a2a2d',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  modalLabel: {color: '#aaa', fontSize: 13, marginBottom: 8},
  errorText: {color: '#E5483B', fontSize: 13, marginBottom: 10},
  colorRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16},
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorDotActive: {borderColor: '#fff'},
  previewRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  previewHours: {color: '#ccc', fontSize: 15},
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  modalBtn: {paddingHorizontal: 16, paddingVertical: 10},
  modalBtnText: {color: '#ccc', fontSize: 16, fontWeight: '600'},

  // Vacation
  vacHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vacPlus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  vacPlusText: {color: '#fff', fontSize: 24, lineHeight: 27},
  vacScroll: {flexGrow: 0, flexShrink: 1},
  emptyText: {color: '#888', fontSize: 14, paddingVertical: 12, lineHeight: 20},
  vacRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  vacRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vacTitle: {color: '#fff', fontSize: 17, fontWeight: '600', flexShrink: 1},
  vacCount: {color: '#fff', fontSize: 17, fontWeight: '600', marginLeft: 8},
  vacPeriod: {color: '#9a9a9f', fontSize: 13, marginTop: 2},
  codeChip: {
    minWidth: 44,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeChipText: {color: '#fff', fontSize: 14, fontWeight: '700'},
  backText: {color: '#4DA3FF', fontSize: 16, marginBottom: 12},
  detailTop: {flexDirection: 'row', alignItems: 'center', gap: 12},
  detailSummary: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    gap: 12,
  },
  dayRowIndex: {color: '#777', width: 24, fontSize: 14},
  dayRowText: {color: '#fff', fontSize: 16},

  // Add vacation form
  dateRow: {flexDirection: 'row', gap: 10, marginBottom: 14},
  dateBtn: {
    flex: 1,
    backgroundColor: '#2a2a2d',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateBtnLabel: {color: '#888', fontSize: 12},
  dateBtnText: {color: '#fff', fontSize: 16, marginTop: 2},

  // Date picker
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 8,
  },
  yearText: {color: '#fff', fontSize: 20, fontWeight: '700'},
  monthWrap: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10},
  monthChip: {
    width: '16.66%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  monthChipActive: {backgroundColor: '#4DA3FF'},
  monthChipText: {color: '#ddd', fontSize: 13, fontWeight: '600'},
  dayWrap: {flexDirection: 'row', flexWrap: 'wrap'},
  pickWeekday: {
    width: '14.2857%',
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    paddingBottom: 4,
  },
  pickDay: {width: '14.2857%', height: 40, alignItems: 'center'},
  pickDayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickDayActive: {backgroundColor: '#4DA3FF'},
  pickDayText: {color: '#fff', fontSize: 15},
});