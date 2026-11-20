import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  tile3d: {
    minWidth: 58,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile3dPressed: {
    transform: [{translateY: 4}],
    borderBottomWidth: 2,
    elevation: 0,
  },
  tileGloss: {},
  barTileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 1,
  },
});
