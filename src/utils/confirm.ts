import {Alert} from 'react-native';
import {Leave, Tile} from '../types';

export const confirmDeleteShift = (tile: Tile, onConfirm: () => void) => {
  Alert.alert(
    `Delete "${tile.label}"?`,
    'Days using this shift will be cleared too.',
    [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: onConfirm},
    ],
  );
};

export const confirmDeleteLeave = (
  leave: Leave,
  usedDays: number,
  onConfirm: () => void,
) => {
  Alert.alert(
    `Delete "${leave.title}"?`,
    usedDays > 0
      ? `This also clears ${usedDays} day${usedDays === 1 ? '' : 's'} from the calendar.`
      : 'This vacation type will be removed.',
    [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: onConfirm},
    ],
  );
};
