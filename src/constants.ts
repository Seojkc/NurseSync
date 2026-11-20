export const STORAGE_KEY = '@shift_calendar_v1';
export const CODE_MAP_KEY = '@shift_code_map_v1';
export const NONE = '__none__'; // "Unlist" / nothing on that day

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
export const MONTHS_SHORT = MONTHS.map(m => m.slice(0, 3));
export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Cute pastel-candy tile colors (white text stays readable on all of them)
export const COLORS = [
  '#4FD1A5', // mint
  '#7C9CFF', // periwinkle
  '#FFACAE', // peach orange
  '#B388FF', // lavender
  '#FF7B8B', // coral
  '#4FC3E8', // sky
  '#FF7BB8', // bubblegum
  '#A8B0C0', // cloud gray
  '#F2C14E', // butter
  '#8E8CFF', // indigo
  '#FF922B', // tangerine
  '#94D82D', // lime
  '#22B8CF', // teal
  '#C28E5C', // caramel
  '#63E6BE', // seafoam
  '#9C36B5', // plum
];

export const PRESETS: {label: string; color: string; hours: string}[] = [
  {label: 'AM', color: COLORS[2], hours: '8'},
  {label: 'PM', color: COLORS[1], hours: '8'},
  {label: 'Night', color: COLORS[3], hours: '8'},
  {label: 'Off', color: COLORS[7], hours: '0'},
];
