import React, {useMemo} from 'react';
import {Pressable, Text, View} from 'react-native';
import {Assignments, Tile} from '../types';
import {shade} from '../utils/color';
import {addDays, toKey} from '../utils/date';
import {styles} from './MonthGrid.styles';

type Props = {
  year: number;
  month: number;
  selectedKey: string;
  todayKey: string;
  assignments: Assignments;
  tileById: Record<string, Tile>;
  onSelect: (d: Date) => void;
};

// One month page: 6 weeks starting on the Sunday on/before the 1st.
export function MonthGrid({
  year,
  month,
  selectedKey,
  todayKey,
  assignments,
  tileById,
  onSelect,
}: Props) {
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
