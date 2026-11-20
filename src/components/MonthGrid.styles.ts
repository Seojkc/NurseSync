import {StyleSheet} from 'react-native';
import {C} from '../theme';

export const styles = StyleSheet.create({
  grid: {flex: 1, paddingHorizontal: 8, gap: 5},
  gridRow: {flex: 1, flexDirection: 'row', gap: 4},
  cell: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 11,
    alignItems: 'center',
    paddingTop: 5,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderBottomWidth: 2,
    borderBottomColor: C.cardEdge,
    overflow: 'hidden',
  },
  cellOut: {
    backgroundColor: C.cardOut,
    borderColor: '#FFEDF4',
    borderBottomColor: '#FFE1EE',
  },
  cellSelected: {
    backgroundColor: '#FFF0F7',
    borderColor: C.pink,
    borderBottomColor: C.pinkDark,
    borderWidth: 2,
  },
  dayCircle: {
    minWidth: 26,
    height: 26,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {},
  dayText: {color: C.text, fontSize: 15, fontWeight: '600'},
  sunday: {color: C.sunday},
  dayTextOut: {color: '#E3BFD0'},
  dayTextToday: {},
  cellTile: {
    marginTop: 4,
    alignSelf: 'stretch',
    marginHorizontal: 3,
    borderRadius: 7,
    paddingVertical: 4,
    alignItems: 'center',
  },
  cellTileText: {color: '#fff', fontSize: 11, fontWeight: '800'},
});
