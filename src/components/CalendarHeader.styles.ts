import {StyleSheet} from 'react-native';
import {C, CUTE_FONT} from '../theme';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    minHeight: 72,
    gap: 8,
  },
  titleBlock: {
    alignItems: 'center',
    flexShrink: 1,
    paddingHorizontal: 2,
  },
  titleYear: {
    color: C.pink,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: C.pinkDark,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    fontFamily: CUTE_FONT,
    textShadowColor: '#FFB3D1',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 0,
  },
  arrowBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnText: {
    color: C.pink,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700',
    includeFontPadding: false,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {fontSize: 18},
  todayBtnText: {color: C.pinkDark, fontSize: 16, fontWeight: '800'},
  summary: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: 10,
    color: C.pinkDark,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});
