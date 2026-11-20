import React, {useEffect, useState} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import {ColorRow} from '../components/ColorRow';
import {ModalShell} from '../components/ModalShell';
import {COLORS, PRESETS} from '../constants';
import {shared} from '../styles/shared';
import {C, PH} from '../theme';
import {shade} from '../utils/color';
import {styles} from './AddShiftModal.styles';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (label: string, color: string, hours: number) => void;
  usedColors: string[];
};

export function AddShiftModal({visible, onClose, onAdd, usedColors}: Props) {
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
    hours.trim() !== '' && isFinite(hoursNum) && hoursNum >= 0 && hoursNum <= 24;
  const canAdd = label.trim().length > 0 && hoursOk;

  return (
    <ModalShell visible={visible} onClose={onClose}>
      <Text style={shared.modalTitle}>Add shift ✨</Text>

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
        style={shared.input}
      />

      <View style={styles.hourPicker}>
        <Text style={styles.hourLabel}>Hours</Text>
        <View style={styles.numberPicker}>
          <Pressable
            onPress={() => setHours(String(Math.max(0, Number(hours || 0) - 1)))}
            style={styles.pickerButton}>
            <Text style={styles.pickerArrow}>−</Text>
          </Pressable>

          <Text style={styles.hourValue}>{hours || '8'}</Text>

          <Pressable
            onPress={() => setHours(String(Math.min(24, Number(hours || 0) + 1)))}
            style={styles.pickerButton}>
            <Text style={styles.pickerArrow}>+</Text>
          </Pressable>
        </View>
      </View>

      {!hoursOk && (
        <Text style={shared.errorText}>Enter hours between 0 and 24.</Text>
      )}

      <ColorRow value={color} onChange={setColor} />

      <View style={shared.modalActions}>
        <Pressable onPress={onClose} style={shared.modalBtn}>
          <Text style={shared.modalBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          disabled={!canAdd}
          onPress={() => onAdd(label.trim(), color, hoursNum)}
          style={[shared.modalBtn, !canAdd && {opacity: 0.35}]}>
          <Text style={[shared.modalBtnText, {color: C.pinkDark}]}>Add</Text>
        </Pressable>
      </View>
    </ModalShell>
  );
}
