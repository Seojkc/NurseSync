export type Shift = {id: string; label: string; color: string; hours: number};

export type Leave = {
  id: string;
  title: string;
  code: string; // short name shown on the tile, e.g. "CL"
  color: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  total: number; // allowed days in the period
};

// A tile is anything that can be put on a day: a shift or a leave type
export type Tile = {
  id: string;
  label: string;
  color: string;
  hours: number;
  leave?: Leave;
};

export type Assignments = Record<string, string>; // 'YYYY-MM-DD' -> tile id

// ----- quick entry -----

export type ImportEntry = {day: number; key: string; code: string}; // code '' = unclear
export type ParsedImport = {month: string; entries: ImportEntry[]};
export type ImportRow = {key: string; tileId: string};

export type Size = {w: number; h: number};
