import {StyleSheet} from 'react-native';
import {C} from '../theme';

export const styles = StyleSheet.create({
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 8,
  },
  yearText: {color: C.text, fontSize: 20, fontWeight: '800'},
  arrow: {
    color: C.pinkDark,
    fontSize: 28,
    lineHeight: 30,
    paddingHorizontal: 4,
  },
  monthWrap: {flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10},
  monthChip: {
    width: '16.66%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  monthChipActive: {backgroundColor: C.pink},
  monthChipText: {color: C.text, fontSize: 13, fontWeight: '700'},
  dayWrap: {flexDirection: 'row', flexWrap: 'wrap'},
  pickWeekday: {
    width: '14.2857%',
    textAlign: 'center',
    color: C.textSoft,
    fontSize: 12,
    paddingBottom: 4,
  },
  pickDay: {width: '14.2857%', height: 40, alignItems: 'center'},
  pickDayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickDayActive: {backgroundColor: C.pink},
  pickDayText: {color: C.text, fontSize: 15},
});
