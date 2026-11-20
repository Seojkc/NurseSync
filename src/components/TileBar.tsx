import React from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {Tile} from '../types';
import {Tile3D} from './Tile3D';
import {styles} from './TileBar.styles';

type Props = {
  tiles: Tile[];
  isBlocked: (tile: Tile) => boolean; // greyed out (e.g. leave not usable on this date)
  onApply: (tile: Tile) => void;
  onLongPress: (tile: Tile) => void;
  onAdd: () => void;
};

// The bottom bar: every tile you can stamp on a day, plus the + button.
export function TileBar({tiles, isBlocked, onApply, onLongPress, onAdd}: Props) {
  return (
    <View style={styles.bottomWrap}>
      <View style={styles.bottomBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tilesContent}>
          {tiles.map(t => (
            <Tile3D
              key={t.id}
              color={t.color}
              label={t.label}
              onPress={() => onApply(t)}
              onLongPress={() => onLongPress(t)}
              style={isBlocked(t) ? {opacity: 0.35} : undefined}
            />
          ))}
        </ScrollView>
        <Pressable
          onPress={onAdd}
          style={({pressed}) => [
            styles.plusBtn,
            pressed && styles.plusBtnPressed,
          ]}
          hitSlop={8}>
          <Text style={styles.plusText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
