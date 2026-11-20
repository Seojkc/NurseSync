import {StyleSheet} from 'react-native';
import {C, CUTE_FONT} from '../theme';

// Styles used by every modal / form in the app.
export const shared = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(91,42,68,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: C.card,
    borderRadius: 28,
    padding: 20,
    borderWidth: 2,
    borderColor: C.pinkSoft,
    borderBottomWidth: 6,
    borderBottomColor: C.cardEdge,
  },
  modalTitle: {
    color: C.pinkDark,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: CUTE_FONT,
    marginBottom: 14,
  },
  modalLabel: {
    color: C.textSoft,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  modalLabelInline: {color: C.textSoft, fontSize: 13, fontWeight: '600'},
  input: {
    backgroundColor: C.inputBg,
    color: C.text,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.pinkSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  errorText: {color: C.danger, fontSize: 13, marginBottom: 10},
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  modalBtn: {paddingHorizontal: 16, paddingVertical: 10},
  modalBtnText: {color: C.textSoft, fontSize: 16, fontWeight: '700'},
  scroll: {flexGrow: 0, flexShrink: 1},
});
