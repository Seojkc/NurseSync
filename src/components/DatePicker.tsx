import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {MONTHS_SHORT, WEEKDAYS} from '../constants';
import {shared} from '../styles/shared';
import {keyToDate, pad} from '../utils/date';
import {styles} from './DatePicker.styles';

type Props = {
  title: string;
  value: string; // YYYY-MM-DD
  onPick: (key: string) => void;
  onCancel: () => void;
};

// Simple date picker (no extra dependency).
export function DatePicker({title, value, onPick, onCancel}: Props) {
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
      <Text style={shared.modalTitle}>{title}</Text>
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
            <Text style={[styles.monthChipText, m === i && {color: '#fff'}]}>
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

      <View style={shared.modalActions}>
        <Pressable onPress={onCancel} style={shared.modalBtn}>
          <Text style={shared.modalBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </>
  );
}
