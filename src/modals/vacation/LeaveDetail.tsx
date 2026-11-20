import React from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {shared} from '../../styles/shared';
import {C} from '../../theme';
import {Leave} from '../../types';
import {shade} from '../../utils/color';
import {fmtDate, fmtLong} from '../../utils/date';
import {styles} from './vacation.styles';

type Props = {
  leave: Leave;
  used: number;
  days: string[];
  onBack: () => void;
  onJump: (key: string) => void;
  onDelete: () => void;
};

// One vacation type: how many days are used and which dates (tap one to jump to it).
export function LeaveDetail({leave, used, days, onBack, onJump, onDelete}: Props) {
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

      <ScrollView style={shared.scroll}>
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

      <View style={shared.modalActions}>
        <Pressable onPress={onDelete} style={shared.modalBtn}>
          <Text style={[shared.modalBtnText, {color: C.danger}]}>Delete</Text>
        </Pressable>
      </View>
    </>
  );
}
