import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {WEEKDAYS} from '../constants';
import {C} from '../theme';

// S M T W T F S (gap matches the grid so columns line up)
export function WeekdayRow() {
  return (
    <View style={styles.weekRow}>
      {WEEKDAYS.map((d, i) => (
        <Text key={i} style={[styles.weekday, i === 0 && styles.sunday]}>
          {d}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
