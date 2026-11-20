import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  presetRow: {flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap'},
  presetChip: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  presetText: {fontSize: 14, fontWeight: '700'},

  hourPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  hourLabel: {fontSize: 16, fontWeight: '600', color: '#64748B'},
  numberPicker: {flexDirection: 'row', alignItems: 'center', gap: 18},
  pickerButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E5EAF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerArrow: {fontSize: 22, fontWeight: '600', color: '#334155'},
  hourValue: {
    fontSize: 25,
    fontWeight: '700',
    color: '#1E293B',
    minWidth: 30,
    textAlign: 'center',
  },
});
