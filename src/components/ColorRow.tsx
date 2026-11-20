import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {COLORS} from '../constants';
import {C} from '../theme';

type Props = {
  value: string;
  onChange: (c: string) => void;
};

export function ColorRow({value, onChange}: Props) {
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

const styles = StyleSheet.create({
  colorRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16},
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorDotActive: {borderColor: C.text},
});
