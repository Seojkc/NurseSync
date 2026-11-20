import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FlexWidget,
  TextWidget,
  requestWidgetUpdate,
} from 'react-native-android-widget';

const STORAGE_KEY = '@shift_calendar_v1';
const OFFSETS_KEY = '@shift_widget_offsets';
export const WIDGET_NAME = 'ShiftCalendarProvider';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Hex = `#${string}`;
type WTile = {id: string; label: string; color: string; hours: number; leave: boolean};
type WInfo = {widgetId: number; width: number; height: number};
export type WData = {
  shifts: any[];
  leaves: any[];
  assignments: Record<string, string>;
};
type Offsets = Record<string, number>;

// Same palette as the app. Widget background is pink at 75% opacity
// (last two hex digits "BF" = 75%; use "80" for 50%, "E6" for 90%).
const C = {
  bg: '#FFE9F2BF',
  card: '#FFFFFF',
  cardEdge: '#FFC4DB',
  cardOut: '#FFF5F9',
  cardOutEdge: '#FFE1EE',
  pink: '#FF6FA5',
  pinkDark: '#D93F7F',
  text: '#5B2A44',
  textOut: '#E3BFD0',
  sunday: '#F0436E',
} as const;

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));
const fmtHours = (n: number) => String(Math.round(n * 100) / 100);

// Darken (amt < 0) or lighten (amt > 0) a #RRGGBB color for 3D edges
const shade = (hex: string, amt: number): Hex => {
  const h = hex.replace('#', '');
  if (h.length !== 6) {
    return hex as Hex;
  }
  const n = parseInt(h, 16);
  const f = (v: number) =>
    Math.round(clamp(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt, 0, 255));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
};

// ---------- Per-widget month offset (all stored in one key) ----------

async function readOffsets(): Promise<Offsets> {
  try {
    const raw = await AsyncStorage.getItem(OFFSETS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function getOffset(widgetId: number): Promise<number> {
  const m = await readOffsets();
  return Number(m[String(widgetId)]) || 0;
}

export async function setOffset(widgetId: number, value: number) {
  try {
    const m = await readOffsets();
    m[String(widgetId)] = value;
    await AsyncStorage.setItem(OFFSETS_KEY, JSON.stringify(m));
  } catch {}
}

export async function clearOffset(widgetId: number) {
  try {
    const m = await readOffsets();
    delete m[String(widgetId)];
    await AsyncStorage.setItem(OFFSETS_KEY, JSON.stringify(m));
  } catch {}
}

// ---------- Data ----------

async function loadData(): Promise<WData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        shifts: data.shifts ?? [],
        leaves: data.leaves ?? [],
        assignments: data.assignments ?? {},
      };
    }
  } catch {}
  return {shifts: [], leaves: [], assignments: {}};
}

function makeTiles(data: WData): Record<string, WTile> {
  const tileById: Record<string, WTile> = {};
  data.shifts.forEach(s => {
    tileById[s.id] = {
      id: s.id,
      label: String(s.label),
      color: s.color,
      hours: Number(s.hours) || 0,
      leave: false,
    };
  });
  data.leaves.forEach(l => {
    tileById[l.id] = {
      id: l.id,
      label: String(l.code),
      color: l.color,
      hours: 0,
      leave: true,
    };
  });
  return tileById;
}

// Fully synchronous: everything it needs is passed in
function renderSync(info: WInfo, data: WData, offsets: Offsets) {
  return (
    <ShiftCalendarWidget
      width={info.width}
      height={info.height}
      offset={Number(offsets[String(info.widgetId)]) || 0}
      assignments={data.assignments}
      tileById={makeTiles(data)}
    />
  );
}

// Used by the widget task handler (add / resize / click / periodic update)
export async function buildWidget(info: WInfo) {
  const data = await loadData();
  const offsets = await readOffsets();
  return renderSync(info, data, offsets);
}

// Call from the app whenever data changes. Pass the live data so the
// widget never reads stale storage.
export async function refreshWidgets(data?: WData) {
  try {
    const d = data ?? (await loadData());
    const offsets = await readOffsets();
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: info => renderSync(info, d, offsets),
      widgetNotFound: () => {},
    });
  } catch (e) {
    console.warn('Widget refresh failed', e);
  }
}

// ---------- Small pieces ----------

// Round white arrow button with a pink "3D" bottom edge
function Arrow3D({label, delta, size}: {label: string; delta: number; size: number}) {
  return (
    <FlexWidget
      clickAction="CHANGE_MONTH"
      clickActionData={{delta}}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.cardEdge,
      }}>
      <FlexWidget
        style={{
          width: size,
          height: size - 3,
          borderRadius: size / 2,
          backgroundColor: C.card,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <TextWidget
          text={label}
          style={{fontSize: Math.round(size * 0.6), fontWeight: 'bold', color: C.pink}}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

// One day card: white rounded card with a thicker pink bottom edge
function DayCell({
  date,
  inMonth,
  isToday,
  tile,
  cellW,
  rowH,
  dayFont,
  circle,
  tileFont,
  tileH,
}: {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  tile?: WTile;
  cellW: number;
  rowH: number;
  dayFont: number;
  circle: number;
  tileFont: number;
  tileH: number;
}) {
  const w = cellW - 2;
  const edge = 3;
  const tileW = Math.max(10, cellW - 8);
  const tileColor = tile ? (inMonth ? tile.color : shade(tile.color, 0.55)) : '#000000';

  return (
    <FlexWidget style={{width: cellW, height: rowH, padding: 1}}>
      <FlexWidget
        style={{
          width: w,
          height: rowH - 2,
          borderRadius: 9,
          backgroundColor: inMonth ? C.cardEdge : C.cardOutEdge,
        }}>
        <FlexWidget
          style={{
            width: w,
            height: rowH - 2 - edge,
            borderRadius: 9,
            backgroundColor: inMonth ? C.card : C.cardOut,
            alignItems: 'center',
            paddingTop: 2,
          }}>
          <FlexWidget
            style={{
              width: circle,
              height: circle,
              borderRadius: circle / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isToday ? C.pink : '#00000000',
            }}>
            <TextWidget
              text={String(date.getDate())}
              style={{
                fontSize: dayFont,
                fontWeight: isToday ? 'bold' : 'normal',
                color: isToday
                  ? '#FFFFFF'
                  : !inMonth
                  ? C.textOut
                  : date.getDay() === 0
                  ? C.sunday
                  : C.text,
              }}
            />
          </FlexWidget>
          {tile ? (
            <FlexWidget
              style={{
                width: tileW,
                height: tileH + 2,
                marginTop: 2,
                borderRadius: 6,
                backgroundColor: shade(tileColor, -0.25),
              }}>
              <FlexWidget
                style={{
                  width: tileW,
                  height: tileH,
                  borderRadius: 6,
                  backgroundColor: tileColor as any,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <TextWidget
                  text={tile.label}
                  maxLines={1}
                  truncate="END"
                  style={{fontSize: tileFont, fontWeight: 'bold', color: '#FFFFFF'}}
                />
              </FlexWidget>
            </FlexWidget>
          ) : null}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

// ---------- Widget UI ----------

function ShiftCalendarWidget({
  width,
  height,
  offset,
  assignments,
  tileById,
}: {
  width: number;
  height: number;
  offset: number;
  assignments: Record<string, string>;
  tileById: Record<string, WTile>;
}) {
  const now = new Date();
  const todayKey = toKey(now);
  const view = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();

  // month summary: hours + leave counts
  const prefix = `${year}-${pad(month + 1)}-`;
  let hours = 0;
  const leaveCounts: Record<string, {label: string; n: number}> = {};
  Object.keys(assignments).forEach(k => {
    if (!k.startsWith(prefix)) {
      return;
    }
    const t = tileById[assignments[k]];
    if (!t) {
      return;
    }
    if (t.leave) {
      leaveCounts[t.id] = {label: t.label, n: (leaveCounts[t.id]?.n || 0) + 1};
    } else {
      hours += t.hours;
    }
  });
  const summary = [
    `${fmtHours(hours)} ${hours === 1 ? 'hour' : 'hours'}`,
    ...Object.keys(leaveCounts).map(
      id => `${leaveCounts[id].n} ${leaveCounts[id].label}`,
    ),
  ].join(', ');

  // sizes scale with the widget
  const outerPad = 8;
  const headerH = clamp(Math.round(height * 0.12), 38, 52);
  const summaryH = 24;
  const weekH = 18;
  const gridH = Math.max(
    60,
    height - outerPad * 2 - headerH - summaryH - weekH,
  );
  const rowH = Math.floor(gridH / 6);
  const cellW = Math.floor((width - outerPad * 2) / 7);
  const dayFont = clamp(Math.round(rowH * 0.27), 9, 15);
  const circle = dayFont + 6;
  const tileFont = clamp(Math.round(rowH * 0.2), 7, 11);
  const tileH = clamp(Math.round(rowH * 0.28), 10, 20);
  const titleFont = clamp(Math.round(headerH * 0.46), 15, 22);
  const arrowSize = clamp(Math.round(headerH * 0.72), 26, 34);

  const first = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - first.getDay());
  const rows = Array.from({length: 6}, (_, r) =>
    Array.from(
      {length: 7},
      (_, c) =>
        new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate() + r * 7 + c,
        ),
    ),
  );

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'column',
        backgroundColor: C.bg,
        borderRadius: 28,
        padding: outerPad,
      }}>
      {/* Header: round arrows + cute month title */}
      <FlexWidget
        style={{
          width: 'match_parent',
          height: headerH,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Arrow3D label="‹" delta={-1} size={arrowSize} />
        <FlexWidget
          clickAction="TODAY"
          style={{
            height: headerH,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 10,
          }}>
          {year !== new Date().getFullYear() && (
            <TextWidget
              text={`${year}`}
              style={{fontSize: 10, fontWeight: 'bold', color: C.pink}}
            />
          )}
         
          <TextWidget
            text={MONTHS[month]}
            maxLines={1}
            style={{fontSize: titleFont, fontWeight: 'bold', color: C.pinkDark}}
          />
        </FlexWidget>
        <Arrow3D label="›" delta={1} size={arrowSize} />
      </FlexWidget>

      {/* Summary pill */}
      <FlexWidget
        style={{
          width: 'match_parent',
          height: summaryH,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 2,
        }}>
        <FlexWidget
          style={{
            height: 19,
            paddingHorizontal: 9,
            justifyContent: 'center',
          }}>
          <TextWidget
            text={` ${summary}`}
            maxLines={1}
            truncate="END"
            style={{fontSize: 12, fontWeight: 'bold', color: C.pinkDark}}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Weekday labels */}
      <FlexWidget style={{width: 'match_parent', height: weekH, flexDirection: 'row'}}>
        {WEEKDAYS.map((d, i) => (
          <FlexWidget
            key={i}
            style={{width: cellW, height: weekH, alignItems: 'center', justifyContent: 'center'}}>
            <TextWidget
              text={d}
              style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: i === 0 ? C.sunday : C.pinkDark,
              }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>

      {/* Month grid */}
      {rows.map((row, r) => (
        <FlexWidget key={r} style={{width: 'match_parent', height: rowH, flexDirection: 'row'}}>
          {row.map(date => {
            const key = toKey(date);
            return (
              <DayCell
                key={key}
                date={date}
                inMonth={date.getMonth() === month}
                isToday={key === todayKey}
                tile={tileById[assignments[key]]}
                cellW={cellW}
                rowH={rowH}
                dayFont={dayFont}
                circle={circle}
                tileFont={tileFont}
                tileH={tileH}
              />
            );
          })}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}