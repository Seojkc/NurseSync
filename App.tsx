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
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  ViewStyle,
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

// Cute pastel-candy tile colors (white text stays readable on all of them)
const COLORS = [
 '#4FD1A5', // mint
  '#7C9CFF', // periwinkle
  '#FFACAE', // peach orange
  '#B388FF', // lavender
  '#FF7B8B', // coral
  '#4FC3E8', // sky
  '#FF7BB8', // bubblegum
  '#A8B0C0', // cloud gray
  '#F2C14E', // butter
  '#8E8CFF', // indigo
  '#FF922B', // tangerine (replaces the missing true orange)
  '#94D82D', // lime (distinct yellow-green)
  '#22B8CF', // teal (deep cyan-blue, distinct from mint & sky)
  '#C28E5C', // caramel (warm earthy brown/tan)
  '#63E6BE', // seafoam (bright aqua-green, or #748FFC if cooler) -> let's use '#E03131' or '#F06595'? Wait—let's make the 6th completely distinct: '#51CF66' (leaf green) or '#845EF7' -> let's use '#66A80F' (olive) or '#C92A2A' -> stick to the same brightness: '#74C0FC' is too close to sky. Let's use '#A9E34B' (chartreuse) or '#9C36B5' (plum) or '#D6336C' (berry). '#9C36B5' (plum) is very distinct!

];

// Theme palette
const C = {
  bg: '#FFE9F2',
  card: '#FFFFFF',
  cardOut: '#FFF5F9',
  cardBorder: '#FFDDEB',
  cardEdge: '#FFC4DB',
  pink: '#FF6FA5',
  pinkDark: '#D93F7F',
  pinkSoft: '#FFD3E4',
  text: '#5B2A44',
  textSoft: '#B07C97',
  sunday: '#F0436E',
  danger: '#E0245E',
  inputBg: '#FFF3F8',
};
const PH = '#C9A0B5'; // placeholder color
const CUTE_FONT = Platform.select({
  android: 'casual',
  ios: 'Marker Felt',
  default: undefined,
});

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

// Darken (amt < 0) or lighten (amt > 0) a #RRGGBB color - used for 3D edges
const shade = (hex: string, amt: number) => {
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

// ---------- 3D tile button ----------

function Tile3D({
  color,
  label,
  onPress,
  onLongPress,
  style,
}: {
  color: string;
  label: string;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      style={({pressed}) => [
        styles.tile3d,
        {backgroundColor: color, borderBottomColor: shade(color, -0.28)},
        pressed && styles.tile3dPressed,
        style,
      ]}>
      <View pointerEvents="none" style={styles.tileGloss} />
      <Text style={styles.barTileText} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------- App ----------

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
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
      .catch(() => {})
      .finally(() => {
        if (Platform.OS === 'android') {
          refreshWidgets({shifts, leaves, assignments});
        }
      });
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
        <Pressable
          onPress={() => changeMonth(-1)}
          hitSlop={10}
          style={styles.arrowBtn}>
          <Text style={styles.arrowBtnText}>‹</Text>
        </Pressable>

        <View style={styles.titleBlock}>
        <Text style={styles.titleYear}>
  {viewMonth.getFullYear() !== new Date().getFullYear() &&
    viewMonth.getFullYear()}
</Text>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            {MONTHS[viewMonth.getMonth()]}
          </Text>
        </View>

        <Pressable
          onPress={() => changeMonth(1)}
          hitSlop={10}
          style={styles.arrowBtn}>
          <Text style={styles.arrowBtnText}>›</Text>
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
                <Tile3D
                  key={t.id}
                  color={t.color}
                  label={t.label}
                  onPress={() => applyTile(t)}
                  onLongPress={() =>
                    t.leave ? confirmDeleteLeave(t.leave) : confirmDeleteShift(t)
                  }
                  style={blocked ? {opacity: 0.35} : undefined}
                />
              );
            })}
          </ScrollView>
          <Pressable
            onPress={() => setShiftModalOpen(true)}
            style={({pressed}) => [
              styles.plusBtn,
              pressed && styles.plusBtnPressed,
            ]}
            hitSlop={8}>
            <Text style={styles.plusText}>+</Text>
          </Pressable>
        </View>
      </View>

      <View>
        <Text style={styles.developedBy}>Developed By SeoVision</Text>
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
                      {
                        backgroundColor: tile.color,
                        borderBottomColor: shade(tile.color, -0.25),
                      },
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
          <Text style={styles.modalTitle}>Add shift ✨</Text>

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
                <Text style={[styles.presetText, {color: shade(p.color, -0.2)}]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Shift name (e.g. AM)"
            placeholderTextColor={PH}
            maxLength={8}
            style={styles.input}
          />


<View style={styles.hourPicker}>
  <Text style={styles.hourLabel}>Hours</Text>

  <View style={styles.numberPicker}>
    <Pressable
      onPress={() => setHours(String(Math.max(0, Number(hours || 0) - 1)))}
      style={styles.pickerButton}
    >
      <Text style={styles.pickerArrow}>−</Text>
    </Pressable>

    <Text style={styles.hourValue}>{hours || '8'}</Text>

    <Pressable
      onPress={() => setHours(String(Math.min(24, Number(hours || 0) + 1)))}
      style={styles.pickerButton}
    >
      <Text style={styles.pickerArrow}>+</Text>
    </Pressable>
  </View>
</View>

{!hoursOk && (
  <Text style={styles.errorText}>
    Enter hours between 0 and 24.
  </Text>
)}

          <ColorRow value={color} onChange={setColor} />

          

          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalBtn}>
              <Text style={styles.modalBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!canAdd}
              onPress={() => onAdd(label.trim(), color, hoursNum)}
              style={[styles.modalBtn, !canAdd && {opacity: 0.35}]}>
              <Text style={[styles.modalBtnText, {color: C.pinkDark}]}>Add</Text>
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
                <Text style={styles.modalTitle}>Vacations 🌴</Text>
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
                    <View
                      style={[
                        styles.codeChip,
                        {
                          backgroundColor: l.color,
                          borderBottomColor: shade(l.color, -0.28),
                        },
                      ]}>
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
        <View
          style={[
            styles.codeChip,
            {
              backgroundColor: leave.color,
              borderBottomColor: shade(leave.color, -0.28),
            },
          ]}>
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
          <Text style={[styles.modalBtnText, {color: C.danger}]}>Delete</Text>
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
      <Text style={styles.modalTitle}>Add vacation 🌸</Text>
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
          placeholderTextColor={PH}
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
          placeholderTextColor={PH}
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
          placeholderTextColor={PH}
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
          <Text style={[styles.modalBtnText, {color: C.pinkDark}]}>Save</Text>
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
              style={[styles.monthChipText, m === i && {color: '#fff'}]}>
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
                <Text style={[styles.pickDayText, active && {color: '#fff'}]}>
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
  root: {flex: 1, backgroundColor: C.bg},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    minHeight: 72,
    gap: 8,
  },
  titleBlock: {
    alignItems: 'center',
    flexShrink: 1,
    paddingHorizontal: 2,
  },
  titleYear: {
    color: C.pink,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: C.pinkDark,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    fontFamily: CUTE_FONT,
    textShadowColor: '#FFB3D1',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 0,
  },
  arrow: {
    color: C.pinkDark,
    fontSize: 28,
    lineHeight: 30,
    paddingHorizontal: 4,
  },
  arrowBtn: {
    width: 34,
    height: 34,
    
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnText: {
    color: C.pink,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700',
    includeFontPadding: false,
  },
  iconBtn: {
    width: 40,
    height: 40,
    
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {fontSize: 18},
  todayBtnText: {color: C.pinkDark, fontSize: 16, fontWeight: '800'},
  summary: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 10,
    color: C.pinkDark,
    fontSize: 13,
    fontWeight: '600',

    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },

  // Weekday labels (gap matches the grid so columns line up)
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 6,
    gap: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: C.pinkDark,
    fontSize: 15,
    fontWeight: '800',
  },
  sunday: {color: C.sunday},

  // Calendar grid
  pager: {flex: 1},
  grid: {flex: 1, paddingHorizontal: 8, gap: 5},
  gridRow: {flex: 1, flexDirection: 'row', gap: 4},
  cell: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 11,
    alignItems: 'center',
    paddingTop: 5,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderBottomWidth: 2,
    borderBottomColor: C.cardEdge,
    overflow: 'hidden',
  },
  cellOut: {
    backgroundColor: C.cardOut,
    borderColor: '#FFEDF4',
    borderBottomColor: '#FFE1EE',
  },
  cellSelected: {
    backgroundColor: '#FFF0F7',
    borderColor: C.pink,
    borderBottomColor: C.pinkDark,
    borderWidth: 2,
  },
  dayCircle: {
    minWidth: 26,
    height: 26,
    borderRadius:33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {},
  dayText: {color: C.text, fontSize: 15, fontWeight: '600'},
  dayTextOut: {color: '#E3BFD0'},
  dayTextToday: {},
  cellTile: {
    marginTop: 4,
    alignSelf: 'stretch',
    marginHorizontal: 3,
    borderRadius: 7,
    paddingVertical: 4,
    alignItems: 'center',
  },
  cellTileText: {color: '#fff', fontSize: 11, fontWeight: '800'},

  // Bottom bar
  bottomWrap: {paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12},
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 34,
    height: 76,
    paddingLeft: 12,
    paddingRight: 8,
    borderWidth: 2,
    borderColor: C.pinkSoft,
    borderBottomWidth: 6,
    borderBottomColor: C.cardEdge,
  },
  tilesContent: {alignItems: 'center', gap: 10, paddingRight: 8, paddingBottom: 2},

  // 3D tiles
  tile3d: {
    minWidth: 58,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  tile3dPressed: {
    transform: [{translateY: 4}],
    borderBottomWidth: 2,
    elevation: 0,
  },
  tileGloss: {
    
  },
  barTileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 1,
  },
  plusBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.pink,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    
 
  },
  plusBtnPressed: {
    transform: [{translateY: 3}],
    borderBottomWidth: 2,
    elevation: 0,
  },
  plusText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '600',
    includeFontPadding: false,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(91,42,68,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: C.card,
    borderRadius: 28,
    padding: 20,
    borderWidth: 2,
    borderColor: C.pinkSoft,
    borderBottomWidth: 6,
    borderBottomColor: C.cardEdge,
  },
  modalTitle: {
    color: C.pinkDark,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: CUTE_FONT,
    marginBottom: 14,
  },
  presetRow: {flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap'},
  presetChip: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.card,
  },
  presetText: {fontSize: 14, fontWeight: '700'},
  input: {
    backgroundColor: C.inputBg,
    color: C.text,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.pinkSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  modalLabel: {color: C.textSoft, fontSize: 13, marginBottom: 8, fontWeight: '600'},
  errorText: {color: C.danger, fontSize: 13, marginBottom: 10},
  colorRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16},
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorDotActive: {borderColor: C.text},
  previewRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  previewHours: {color: C.textSoft, fontSize: 15},
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  modalBtn: {paddingHorizontal: 16, paddingVertical: 10},
  modalBtnText: {color: C.textSoft, fontSize: 16, fontWeight: '700'},

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
    backgroundColor: C.pinkSoft,
    borderBottomWidth: 3,
    borderBottomColor: C.cardEdge,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  vacPlusText: {color: C.pinkDark, fontSize: 24, lineHeight: 27, fontWeight: '700'},
  vacScroll: {flexGrow: 0, flexShrink: 1},
  emptyText: {color: C.textSoft, fontSize: 14, paddingVertical: 12, lineHeight: 20},
  vacRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.pinkSoft,
  },
  vacRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vacTitle: {color: C.text, fontSize: 17, fontWeight: '700', flexShrink: 1},
  vacCount: {color: C.pinkDark, fontSize: 17, fontWeight: '700', marginLeft: 8},
  vacPeriod: {color: C.textSoft, fontSize: 13, marginTop: 2},
  codeChip: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeChipText: {color: '#fff', fontSize: 14, fontWeight: '800'},
  backText: {color: C.pinkDark, fontSize: 16, marginBottom: 12, fontWeight: '700'},
  detailTop: {flexDirection: 'row', alignItems: 'center', gap: 12},
  detailSummary: {
    color: C.textSoft,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.pinkSoft,
    gap: 12,
  },
  dayRowIndex: {color: C.textSoft, width: 24, fontSize: 14},
  dayRowText: {color: C.text, fontSize: 16},

  // Add vacation form
  dateRow: {flexDirection: 'row', gap: 10, marginBottom: 14},
  dateBtn: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.pinkSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateBtnLabel: {color: C.textSoft, fontSize: 12},
  dateBtnText: {color: C.text, fontSize: 16, marginTop: 2},

  // Date picker
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 8,
  },
  yearText: {color: C.text, fontSize: 20, fontWeight: '800'},
  monthWrap: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10},
  monthChip: {
    width: '16.66%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  monthChipActive: {backgroundColor: C.pink},
  monthChipText: {color: C.text, fontSize: 13, fontWeight: '700'},
  dayWrap: {flexDirection: 'row', flexWrap: 'wrap'},
  pickWeekday: {
    width: '14.2857%',
    textAlign: 'center',
    color: C.textSoft,
    fontSize: 12,
    paddingBottom: 4,
  },
  developedBy: {color: C.textSoft, fontSize: 12, textAlign: 'center'},
  pickDay: {width: '14.2857%', height: 40, alignItems: 'center'},
  pickDayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickDayActive: {backgroundColor: C.pink},
  pickDayText: {color: C.text, fontSize: 15},



  hourPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  
  hourLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  
  numberPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  
  pickerButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E5EAF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  pickerArrow: {
    fontSize: 22,
    fontWeight: '600',
    color: '#334155',
  },
  
  hourValue: {
    fontSize: 25,
    fontWeight: '700',
    color: '#1E293B',
    minWidth: 30,
    textAlign: 'center',
  },



});