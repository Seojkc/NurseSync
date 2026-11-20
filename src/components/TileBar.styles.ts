import {StyleSheet} from 'react-native';
import {C} from '../theme';

export const styles = StyleSheet.create({
  bottomWrap: {paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12},
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 34,
    height: 76,
    paddingLeft: 12,
    paddingRight: 8,
    borderWidth: 2,
    borderColor: C.pinkSoft,
    borderBottomWidth: 6,
    borderBottomColor: C.cardEdge,
  },
  tilesContent: {
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
    paddingBottom: 2,
  },
  plusBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.pink,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  plusBtnPressed: {
    transform: [{translateY: 3}],
    borderBottomWidth: 2,
    elevation: 0,
  },
  plusText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '600',
    includeFontPadding: false,
  },
});
