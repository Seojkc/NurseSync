import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FlexWidget,
  TextWidget,
  requestWidgetUpdate,
} from 'react-native-android-widget';

const STORAGE_KEY = '@shift_calendar_v1';
export const WIDGET_NAME = 'ShiftCalendar';
const offsetKey = (id: number) => `@shift_widget_offset_${id}`;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type WTile = {id: string; label: string; color: string; hours: number; leave: boolean};
type WInfo = {widgetId: number; width: number; height: number};

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));
const fmtHours = (n: number) => String(Math.round(n * 100) / 100);

export async function getOffset(widgetId: number): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(offsetKey(widgetId));
    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function setOffset(widgetId: number, value: number) {
  try {
    await AsyncStorage.setItem(offsetKey(widgetId), String(value));
  } catch {}
}

export async function clearOffset(widgetId: number) {
  try {
    await AsyncStorage.removeItem(offsetKey(widgetId));
  } catch {}
}

// Reads saved app data and builds the widget for the given size
export async function buildWidget(info: WInfo) {
  let shifts: any[] = [];
  let leaves: any[] = [];
  let assignments: Record<string, string> = {};
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      shifts = data.shifts ?? [];
      leaves = data.leaves ?? [];
      assignments = data.assignments ?? {};
    }
  } catch {}
  const offset = await getOffset(info.widgetId);

  const tileById: Record<string, WTile> = {};
  shifts.forEach(s => {
    tileById[s.id] = {
      id: s.id,
      label: String(s.label),
      color: s.color,
      hours: Number(s.hours) || 0,
      leave: false,
    };
  });
  leaves.forEach(l => {
    tileById[l.id] = {
      id: l.id,
      label: String(l.code),
      color: l.color,
      hours: 0,
      leave: true,
    };
  });

  return (
    <ShiftCalendarWidget
      width={info.width}
      height={info.height}
      offset={offset}
      assignments={assignments}
      tileById={tileById}
    />
  );
}

// Call from the app whenever data changes
export function refreshWidgets() {
  return requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: info => buildWidget(info),
    widgetNotFound: () => {},
  }).catch(() => {});
}

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
    `${fmtHours(hours)} h`,
    ...Object.keys(leaveCounts).map(
      id => `${leaveCounts[id].n} ${leaveCounts[id].label}`,
    ),
  ].join(', ');

  // sizes scale with the widget
  const outerPad = 8;
  const headerH = clamp(Math.round(height * 0.11), 30, 46);
  const weekH = 18;
  const gridH = Math.max(60, height - outerPad * 2 - headerH - weekH);
  const rowH = Math.floor(gridH / 6);
  const cellW = Math.floor((width - outerPad * 2) / 7);
  const dayFont = clamp(Math.round(rowH * 0.27), 9, 15);
  const circle = dayFont + 8;
  const tileFont = clamp(Math.round(rowH * 0.2), 7, 11);
  const tileH = clamp(Math.round(rowH * 0.32), 11, 22);
  const titleFont = clamp(Math.round(headerH * 0.5), 13, 22);

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
        backgroundColor: '#000000',
        borderRadius: 24,
        padding: outerPad,
      }}>
      {/* Header */}
      <FlexWidget
        style={{
          width: 'match_parent',
          height: headerH,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <FlexWidget
          clickAction="CHANGE_MONTH"
          clickActionData={{delta: -1}}
          style={{width: 34, height: headerH, alignItems: 'center', justifyContent: 'center'}}>
          <TextWidget text="‹" style={{fontSize: titleFont + 8, color: '#FFFFFF'}} />
        </FlexWidget>
        <FlexWidget
          clickAction="TODAY"
          style={{height: headerH, justifyContent: 'center', paddingHorizontal: 4}}>
          <TextWidget
            text={`${year} ${MONTHS[month]}`}
            style={{fontSize: titleFont, fontWeight: 'bold', color: '#FFFFFF'}}
          />
        </FlexWidget>
        <FlexWidget
          clickAction="CHANGE_MONTH"
          clickActionData={{delta: 1}}
          style={{width: 34, height: headerH, alignItems: 'center', justifyContent: 'center'}}>
          <TextWidget text="›" style={{fontSize: titleFont + 8, color: '#FFFFFF'}} />
        </FlexWidget>
        <FlexWidget style={{flex: 1, height: headerH, alignItems: 'flex-end', justifyContent: 'center'}}>
          <TextWidget
            text={summary}
            maxLines={1}
            truncate="END"
            style={{fontSize: 11, color: '#9A9A9F'}}
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
                color: i === 0 ? '#E5483B' : '#FFFFFF',
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
            const inMonth = date.getMonth() === month;
            const isToday = key === todayKey;
            const tile = tileById[assignments[key]];
            return (
              <FlexWidget key={key} style={{width: cellW, height: rowH, padding: 1}}>
                <FlexWidget
                  style={{
                    width: cellW - 2,
                    height: rowH - 2,
                    backgroundColor: inMonth ? '#151515' : '#0D0D0D',
                    borderRadius: 6,
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
                      backgroundColor: isToday ? '#4DA3FF' : '#00000000',
                    }}>
                    <TextWidget
                      text={String(date.getDate())}
                      style={{
                        fontSize: dayFont,
                        fontWeight: isToday ? 'bold' : 'normal',
                        color: isToday
                          ? '#000000'
                          : !inMonth
                          ? '#666666'
                          : date.getDay() === 0
                          ? '#E5483B'
                          : '#FFFFFF',
                      }}
                    />
                  </FlexWidget>
                  {tile ? (
                    <FlexWidget
                      style={{
                        width: cellW - 8,
                        height: tileH,
                        marginTop: 2,
                        borderRadius: 4,
                        backgroundColor: tile.color as any,
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
                  ) : null}
                </FlexWidget>
              </FlexWidget>
            );
          })}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
