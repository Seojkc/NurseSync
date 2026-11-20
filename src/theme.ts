import {Platform} from 'react-native';

// Theme palette
export const C = {
  bg: '#FFE9F2',
  card: '#FFFFFF',
  cardOut: '#FFF5F9',
  cardBorder: '#FFDDEB',
  cardEdge: '#FFC4DB',
  pink: '#FF6FA5',
  pinkDark: '#D93F7F',
  pinkSoft: '#FFD3E4',
  text: '#5B2A44',
  textSoft: '#B07C97',
  sunday: '#F0436E',
  danger: '#E0245E',
  inputBg: '#FFF3F8',
};

export const PH = '#C9A0B5'; // placeholder color

export const CUTE_FONT = Platform.select({
  android: 'casual',
  ios: 'Marker Felt',
  default: undefined,
});
