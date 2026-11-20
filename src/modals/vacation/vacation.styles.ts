import {StyleSheet} from 'react-native';
import {C} from '../../theme';

export const styles = StyleSheet.create({
  vacHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vacPlus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.pinkSoft,
    borderBottomWidth: 3,
    borderBottomColor: C.cardEdge,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  vacPlusText: {color: C.pinkDark, fontSize: 24, lineHeight: 27, fontWeight: '700'},
  emptyText: {color: C.textSoft, fontSize: 14, paddingVertical: 12, lineHeight: 20},
  vacRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.pinkSoft,
  },
  vacRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vacTitle: {color: C.text, fontSize: 17, fontWeight: '700', flexShrink: 1},
  vacCount: {color: C.pinkDark, fontSize: 17, fontWeight: '700', marginLeft: 8},
  vacPeriod: {color: C.textSoft, fontSize: 13, marginTop: 2},
  codeChip: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeChipText: {color: '#fff', fontSize: 14, fontWeight: '800'},

  // detail
  backText: {color: C.pinkDark, fontSize: 16, marginBottom: 12, fontWeight: '700'},
  detailTop: {flexDirection: 'row', alignItems: 'center', gap: 12},
  detailSummary: {
    color: C.textSoft,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.pinkSoft,
    gap: 12,
  },
  dayRowIndex: {color: C.textSoft, width: 24, fontSize: 14},
  dayRowText: {color: C.text, fontSize: 16},

  // add form
  dateRow: {flexDirection: 'row', gap: 10, marginBottom: 14},
  dateBtn: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.pinkSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateBtnLabel: {color: C.textSoft, fontSize: 12},
  dateBtnText: {color: C.text, fontSize: 16, marginTop: 2},
});
