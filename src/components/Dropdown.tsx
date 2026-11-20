import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {NONE} from '../constants';
import {C, PH} from '../theme';
import {Tile} from '../types';
import {styles} from './Dropdown.styles';

type Props = {
  value: string | undefined; // tile id, NONE, or undefined (not chosen yet)
  tiles: Tile[];
  placeholder: string;
  noneLabel: string; // label of the "no tile" option
  open: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
};

// A small vertical dropdown that lists your tiles plus a "no tile" option.
export function Dropdown({
  value,
  tiles,
  placeholder,
  noneLabel,
  open,
  onToggle,
  onChange,
}: Props) {
  const current =
    value && value !== NONE ? tiles.find(t => t.id === value) : undefined;
  const display = value === NONE ? noneLabel : placeholder;

  return (
    <View style={{alignSelf: 'stretch'}}>
      <Pressable
        onPress={onToggle}
        style={[styles.ddBtn, open && {borderColor: C.pink}]}>
        {current ? (
          <View style={styles.ddValueRow}>
            <View style={[styles.ddDot, {backgroundColor: current.color}]} />
            <Text style={styles.ddText} numberOfLines={1}>
              {current.label}
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.ddText, {color: value === NONE ? C.textSoft : PH}]}
            numberOfLines={1}>
            {display}
          </Text>
        )}
        <Text style={styles.ddCaret}>{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open && (
        <View style={styles.ddList}>
          {tiles.map(t => (
            <Pressable
              key={t.id}
              onPress={() => onChange(t.id)}
              style={[styles.ddOption, value === t.id && styles.ddOptionActive]}>
              <View style={[styles.ddDot, {backgroundColor: t.color}]} />
              <Text style={styles.ddText} numberOfLines={1}>
                {t.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => onChange(NONE)}
            style={[
              styles.ddOption,
              value === NONE && styles.ddOptionActive,
              {borderBottomWidth: 0},
            ]}>
            <View style={[styles.ddDot, {backgroundColor: '#E6D3DD'}]} />
            <Text style={[styles.ddText, {color: C.textSoft}]} numberOfLines={1}>
              {noneLabel}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
