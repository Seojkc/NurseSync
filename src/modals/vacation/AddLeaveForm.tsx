import React, {useState} from 'react';
import {Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {ColorRow} from '../../components/ColorRow';
import {DatePicker} from '../../components/DatePicker';
import {COLORS} from '../../constants';
import {shared} from '../../styles/shared';
import {C, PH} from '../../theme';
import {Leave} from '../../types';
import {daysBetween, fmtDate} from '../../utils/date';
import {suggestCode} from '../../utils/leave';
import {newId} from '../../utils/math';
import {styles} from './vacation.styles';

type Props = {
  existingCodes: string[];
  usedColors: string[];
  onCancel: () => void;
  onSave: (leave: Leave) => void;
};

export function AddLeaveForm({existingCodes, usedColors, onCancel, onSave}: Props) {
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
      <Text style={shared.modalTitle}>Add vacation 🌸</Text>
      <ScrollView style={shared.scroll} keyboardShouldPersistTaps="handled">
        <Text style={shared.modalLabel}>Title</Text>
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
          style={shared.input}
        />

        <Text style={shared.modalLabel}>Short name (shown on the tile)</Text>
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
          style={shared.input}
        />

        <Text style={shared.modalLabel}>Period</Text>
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

        <Text style={shared.modalLabel}>Number of days in total</Text>
        <TextInput
          value={total}
          onChangeText={t => setTotal(t.replace(/[^0-9]/g, ''))}
          placeholder="e.g. 15"
          placeholderTextColor={PH}
          keyboardType="number-pad"
          maxLength={3}
          style={shared.input}
        />

        <Text style={shared.modalLabel}>Color</Text>
        <ColorRow value={color} onChange={setColor} />

        {error !== '' && <Text style={shared.errorText}>{error}</Text>}
      </ScrollView>

      <View style={shared.modalActions}>
        <Pressable onPress={onCancel} style={shared.modalBtn}>
          <Text style={shared.modalBtnText}>Cancel</Text>
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
          style={[shared.modalBtn, !valid && {opacity: 0.35}]}>
          <Text style={[shared.modalBtnText, {color: C.pinkDark}]}>Save</Text>
        </Pressable>
      </View>
    </>
  );
}
