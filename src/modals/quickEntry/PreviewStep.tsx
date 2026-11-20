import React from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {Dropdown} from '../../components/Dropdown';
import {NONE} from '../../constants';
import {QuickEntryState} from '../../hooks/useQuickEntry';
import {shared} from '../../styles/shared';
import {C} from '../../theme';
import {Tile} from '../../types';
import {fmtLong} from '../../utils/date';
import {styles} from './quickEntry.styles';

type Props = {
  q: QuickEntryState;
  tiles: Tile[];
};

// Step 2: every day with its mapped tile; fix any the AI got wrong, then add.
export function PreviewStep({q, tiles}: Props) {
  const {parsed} = q;
  if (!parsed) {
    return null;
  }

  return (
    <>
      <Text style={shared.modalTitle}>Preview · {q.monthLabel}</Text>
      <Text style={styles.qiHint}>
        Check each day. Change any the AI got wrong. Days left on "Select one"
        are skipped.
      </Text>

      <ScrollView style={shared.scroll} keyboardShouldPersistTaps="handled">
        {parsed.entries.map(e => {
          const key = `row-${e.day}`;
          return (
            <View key={e.day} style={styles.qiRow}>
              <View style={{flex: 1, paddingRight: 8}}>
                <Text style={styles.qiRowDate}>{fmtLong(e.key)}</Text>
                <Text style={styles.qiRowRead}>
                  read: {e.code ? e.code : 'unclear'}
                </Text>
              </View>
              <View style={{width: 150}}>
                <Dropdown
                  value={q.rowChoices[e.day] ?? NONE}
                  tiles={tiles}
                  placeholder="Select one"
                  noneLabel="Select one"
                  open={q.openKey === key}
                  onToggle={() => q.toggleOpen(key)}
                  onChange={v => q.chooseRow(e.day, v)}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={shared.modalActions}>
        <Pressable onPress={() => q.setStep('paste')} style={shared.modalBtn}>
          <Text style={shared.modalBtnText}>Back</Text>
        </Pressable>
        <Pressable
          disabled={q.previewCount === 0}
          onPress={q.addToCalendar}
          style={[shared.modalBtn, q.previewCount === 0 && {opacity: 0.35}]}>
          <Text style={[shared.modalBtnText, {color: C.pinkDark}]}>
            Add {q.previewCount} to calendar
          </Text>
        </Pressable>
      </View>
    </>
  );
}
