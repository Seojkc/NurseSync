import React from 'react';
import {Pressable, StyleProp, Text, View, ViewStyle} from 'react-native';
import {shade} from '../utils/color';
import {styles} from './Tile3D.styles';

type Props = {
  color: string;
  label: string;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

// The chunky candy-style button used for shift / leave tiles in the bottom bar.
export function Tile3D({color, label, onPress, onLongPress, style}: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      style={({pressed}) => [
        styles.tile3d,
        {backgroundColor: color, borderBottomColor: shade(color, -0.28)},
        pressed && styles.tile3dPressed,
        style,
      ]}>
      <View pointerEvents="none" style={styles.tileGloss} />
      <Text style={styles.barTileText} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
