import React from 'react';
import {Pressable, ScrollView, Text, TextInput, View} from 'react-native';
import {Dropdown} from '../../components/Dropdown';
import {QuickEntryState} from '../../hooks/useQuickEntry';
import {shared} from '../../styles/shared';
import {C, PH} from '../../theme';
import {Tile} from '../../types';
import {styles} from './quickEntry.styles';

type Props = {
  q: QuickEntryState;
  tiles: Tile[];
  onClose: () => void;
};

// Step 1: paste the JSON, read it, then map each distinct code to one of your tiles.
export function PasteStep({q, tiles, onClose}: Props) {
  const {text, parsed, error, codes} = q;
  const empty = text.trim().length === 0;

  return (
    <>
      <Text style={shared.modalTitle}>Quick entry ⚡</Text>

      <ScrollView style={shared.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.qiLabelRow}>
          <Text style={shared.modalLabelInline}>Paste the JSON here</Text>
          <View style={styles.qiLabelActions}>
            {text.length > 0 && (
              <Pressable onPress={q.clearAll} hitSlop={8}>
                <Text style={styles.qiClear}>Clear</Text>
              </Pressable>
            )}
            <Pressable
              onPress={q.pasteFromClipboard}
              style={styles.qiPasteBtn}
              hitSlop={6}>
              <Text style={styles.qiPasteText}>📋 Paste</Text>
            </Pressable>
          </View>
        </View>

        <TextInput
          value={text}
          onChangeText={q.changeText}
          placeholder='{"month":"2026-11","days":{"1":"A", ...}}'
          placeholderTextColor={PH}
          multiline
          autoCorrect={false}
          autoCapitalize="none"
          textAlignVertical="top"
          style={[shared.input, styles.qiBox]}
        />

        <Pressable
          onPress={q.readData}
          disabled={empty}
          style={({pressed}) => [
            styles.qiBigBtn,
            empty && {opacity: 0.35},
            pressed && {transform: [{translateY: 2}]},
          ]}>
          <Text style={styles.qiBigBtnText}>Upload & read data</Text>
        </Pressable>

        {error !== '' && <Text style={shared.errorText}>{error}</Text>}

        {parsed && (
          <View style={{marginTop: 14}}>
            <Text style={styles.qiFound}>
              {q.monthLabel} · {codes.length} code{codes.length === 1 ? '' : 's'}{' '}
              found
            </Text>
            <Text style={styles.qiHint}>
              Match each code to one of your tiles. Not in the list? Close this
              card, tap + in the bottom bar to add the tile, then come back (your
              data stays). Use "Unlist" for a code that makes no sense.
            </Text>
            {q.unclearCount > 0 && (
              <Text style={styles.qiHint}>
                {q.unclearCount} unclear day{q.unclearCount === 1 ? '' : 's'} will
                be left blank unless you pick one in the preview.
              </Text>
            )}

            {codes.map(c => {
              const key = `code-${c.code}`;
              return (
                <View key={c.code} style={styles.qiCodeBlock}>
                  <View style={styles.qiCodeTop}>
                    <View style={styles.qiCodeChip}>
                      <Text style={styles.qiCodeChipText}>{c.code}</Text>
                    </View>
                    <Text style={styles.qiCodeCount}>
                      {c.count} day{c.count === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <Dropdown
                    value={q.resolve(c.code)}
                    tiles={tiles}
                    placeholder="Select a tile…"
                    noneLabel="Unlist"
                    open={q.openKey === key}
                    onToggle={() => q.toggleOpen(key)}
                    onChange={v => q.chooseCode(c.code, v)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={shared.modalActions}>
        <Pressable onPress={onClose} style={shared.modalBtn}>
          <Text style={shared.modalBtnText}>Close</Text>
        </Pressable>
        {parsed && (
          <Pressable
            disabled={!q.allMapped}
            onPress={q.goNext}
            style={[shared.modalBtn, !q.allMapped && {opacity: 0.35}]}>
            <Text style={[shared.modalBtnText, {color: C.pinkDark}]}>Next</Text>
          </Pressable>
        )}
      </View>
    </>
  );
}
