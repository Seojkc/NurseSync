import React, {useEffect, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {ModalShell} from '../../components/ModalShell';
import {Tile3D} from '../../components/Tile3D';
import {shared} from '../../styles/shared';
import {C, PH} from '../../theme';
import {Note, Tile} from '../../types';
import {shade, tileTextColor} from '../../utils/color';
import {fmtLong} from '../../utils/date';
import {styles} from './day.styles';

type Props = {
  visible: boolean;
  dateKey: string;
  tile: Tile | undefined; // what is on this day right now
  tiles: Tile[]; // everything that can be put on a day
  notes: Note[];
  isBlocked: (tile: Tile) => boolean; // leave not usable on this date
  onClose: () => void;
  onPickTile: (tile: Tile) => void;
  onRemoveTile: () => void;
  onAddNote: (text: string) => void;
  onDeleteNote: (id: string) => void;
};

// The card that pops up when a date is tapped: its shift, add/remove, and notes.
export function DayModal({
  visible,
  dateKey,
  tile,
  tiles,
  notes,
  isBlocked,
  onClose,
  onPickTile,
  onRemoveTile,
  onAddNote,
  onDeleteNote,
}: Props) {
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (visible) {
      setDraft('');
    }
  }, [visible, dateKey]);

  const canAdd = draft.trim().length > 0;
  const submitNote = () => {
    if (canAdd) {
      onAddNote(draft.trim());
      setDraft('');
    }
  };

  const confirmDeleteNote = (n: Note) =>
    Alert.alert('Delete note?', n.text.length > 80 ? `${n.text.slice(0, 80)}…` : n.text, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => onDeleteNote(n.id)},
    ]);

  const txt = tile ? tileTextColor(tile.color) : '#fff';

  return (
    <ModalShell visible={visible} onClose={onClose} maxHeightRatio={0.85}>
      <Text style={shared.modalTitle}>{dateKey ? fmtLong(dateKey) : ''}</Text>

      <ScrollView
        style={shared.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* current shift */}
        <View style={styles.section}>
          <Text style={styles.sectionHead}>Shift</Text>
          {tile ? (
            <View style={styles.currentRow}>
              <View
                style={[
                  styles.currentTile,
                  {
                    backgroundColor: tile.color,
                    borderBottomColor: shade(tile.color, -0.28),
                  },
                ]}>
                <Text style={[styles.currentText, {color: txt}]}>
                  {tile.label}
                </Text>
                {!tile.leave && tile.hours > 0 && (
                  <Text style={[styles.currentSub, {color: txt}]}>
                    {tile.hours} h
                  </Text>
                )}
              </View>
              <Pressable onPress={onRemoveTile} style={styles.removeBtn}>
                <Text style={styles.removeText}>✕ Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.empty}>Nothing on this day yet.</Text>
          )}
        </View>

        {/* add / change shift */}
        <View style={styles.section}>
          <Text style={styles.sectionHead}>
            {tile ? 'Change shift' : 'Add shift'}
          </Text>
          {tiles.length === 0 ? (
            <Text style={styles.empty}>Create a shift with + first.</Text>
          ) : (
            <View style={styles.pickWrap}>
              {tiles.map(t => (
                <Tile3D
                  key={t.id}
                  color={t.color}
                  label={t.id === tile?.id ? `✓ ${t.label}` : t.label}
                  onPress={() => onPickTile(t)}
                  style={[
                    styles.pickTile,
                    t.id === tile?.id && styles.pickActive,
                    isBlocked(t) ? {opacity: 0.35} : undefined,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* notes */}
        <View style={styles.section}>
          <Text style={styles.sectionHead}>
            Notes{notes.length ? ` (${notes.length})` : ''}
          </Text>
          <View style={styles.noteInputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a note…"
              placeholderTextColor={PH}
              multiline
              maxLength={300}
              style={styles.noteInput}
            />
            <Pressable
              disabled={!canAdd}
              onPress={submitNote}
              style={[styles.addNoteBtn, !canAdd && {opacity: 0.35}]}>
              <Text style={styles.addNoteText}>Add</Text>
            </Pressable>
          </View>

          {notes.length === 0 ? (
            <Text style={[styles.empty, {marginTop: 10}]}>No notes yet.</Text>
          ) : (
            notes.map(n => (
              <View key={n.id} style={styles.noteRow}>
                <Text style={styles.noteText}>{n.text}</Text>
                <Pressable
                  onPress={() => confirmDeleteNote(n)}
                  hitSlop={6}
                  style={styles.noteDel}>
                  <Text style={styles.noteDelText}>✕</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={shared.modalActions}>
        <Pressable onPress={onClose} style={shared.modalBtn}>
          <Text style={[shared.modalBtnText, {color: C.pinkDark}]}>Done</Text>
        </Pressable>
      </View>
    </ModalShell>
  );
}
