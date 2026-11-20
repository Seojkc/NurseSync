import {StyleSheet} from 'react-native';
import {C} from '../theme';

export const styles = StyleSheet.create({
  ddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.pinkSoft,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  ddValueRow: {flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1},
  ddDot: {width: 14, height: 14, borderRadius: 7},
  ddText: {color: C.text, fontSize: 14, fontWeight: '700', flexShrink: 1},
  ddCaret: {color: C.pinkDark, fontSize: 12, marginLeft: 6},
  ddList: {
    marginTop: 4,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.pinkSoft,
    overflow: 'hidden',
  },
  ddOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.pinkSoft,
  },
  ddOptionActive: {backgroundColor: C.inputBg},
});
