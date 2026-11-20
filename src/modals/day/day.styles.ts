import {StyleSheet} from 'react-native';
import {C} from '../../theme';

export const styles = StyleSheet.create({
  section: {marginBottom: 16},
  sectionHead: {
    color: C.textSoft,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  empty: {color: C.textSoft, fontSize: 14, fontStyle: 'italic'},

  // current shift
  currentRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  currentTile: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentText: {fontSize: 22, fontWeight: '800'},
  currentSub: {fontSize: 12, fontWeight: '700', marginTop: -2},
  removeBtn: {
    height: 54,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {color: C.danger, fontSize: 15, fontWeight: '800'},

  // pick a shift
  pickWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  pickTile: {height: 42, minWidth: 56, paddingHorizontal: 14},
  pickActive: {borderWidth: 3, borderColor: C.text},

  // notes
  noteInputRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  noteInput: {
    flex: 1,
    backgroundColor: C.inputBg,
    color: C.text,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.pinkSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 96,
  },
  addNoteBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: C.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNoteText: {color: '#fff', fontSize: 15, fontWeight: '800'},
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.inputBg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: C.pink,
    paddingLeft: 12,
    marginTop: 8,
  },
  noteText: {flex: 1, color: C.text, fontSize: 15, paddingVertical: 10},
  noteDel: {paddingHorizontal: 14, paddingVertical: 10},
  noteDelText: {color: C.danger, fontSize: 16, fontWeight: '800'},
});
