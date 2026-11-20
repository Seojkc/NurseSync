import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {MONTHS} from '../constants';
import {styles} from './CalendarHeader.styles';

type Props = {
  viewMonth: Date;
  todayDate: number; // day-of-month shown on the "today" button
  summary: string;
  onPrev: () => void;
  onNext: () => void;
  onQuickEntry: () => void;
  onVacations: () => void;
  onToday: () => void;
};

// Month title + arrows + the ⚡ / 🌴 / today buttons, and the monthly summary line.
export function CalendarHeader({
  viewMonth,
  todayDate,
  summary,
  onPrev,
  onNext,
  onQuickEntry,
  onVacations,
  onToday,
}: Props) {
  const year = viewMonth.getFullYear();
  return (
    <>
      <View style={styles.header}>
        <Pressable onPress={onPrev} hitSlop={10} style={styles.arrowBtn}>
          <Text style={styles.arrowBtnText}>‹</Text>
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={styles.titleYear}>
            {year !== new Date().getFullYear() ? year : ''}
          </Text>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            {MONTHS[viewMonth.getMonth()]}
          </Text>
        </View>

        <Pressable onPress={onNext} hitSlop={10} style={styles.arrowBtn}>
          <Text style={styles.arrowBtnText}>›</Text>
        </Pressable>

        <View style={{flex: 1}} />

        <Pressable onPress={onQuickEntry} style={styles.iconBtn} hitSlop={6}>
          <Text style={styles.iconEmoji}>⚡</Text>
        </Pressable>
        <Pressable onPress={onVacations} style={styles.iconBtn} hitSlop={6}>
          <Text style={styles.iconEmoji}>🌴</Text>
        </Pressable>
        <Pressable onPress={onToday} style={styles.iconBtn}>
          <Text style={styles.todayBtnText}>{todayDate}</Text>
        </Pressable>
      </View>
      <Text style={styles.summary}>{summary}</Text>
    </>
  );
}
