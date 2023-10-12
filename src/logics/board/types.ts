export type BoardConfig = {
  rows: number;
  cols: number;
  mines: number;
};

export type Board<T> = {
  meta: BoardConfig;
  data: T[][];
};

export type CellState =
  | { type: 'opened' }
  | { type: 'unopened'; flag: 'normal' | 'suspected' | 'none' };

export type CellContent =
  | { type: 'mine'; exploded: boolean }
  | { type: 'count'; value: number }
  | { type: 'empty' };

export type Cell = {
  id: number;
  content: CellContent;
  state: CellState;
};

// Specific Cell Content Types
export type EmptyContent = { type: 'empty' };
export type UnexplodedMineContent = { type: 'mine'; exploded: false };
export type ExplodedMineContent = { type: 'mine'; exploded: true };
export type MineCountContent = { type: 'count'; value: number };

// Specific Cell State Types
export type UnopenedState = { type: 'unopened'; flag: 'normal' | 'suspected' | 'none' };
export type FlaggedState = Exclude<UnopenedState, { flag: 'none' }>;
export type OpenedState = { type: 'opened' };

// Specific Cell Types

export type PlainCell = Cell & {
  content: EmptyContent;
  state: UnopenedState;
};
// mine must be unopened while playing
export type UnexplodedMineCell = Cell & {
  content: UnexplodedMineContent;
  state: UnopenedState;
};
// contents which can be opened
type SafeCell = Cell & {
  content: Exclude<CellContent, { type: 'mine' }>;
  state: UnopenedState | OpenedState;
};
// Varieties of cells which appear on the board while playing
export type PlayableCell = UnexplodedMineCell | SafeCell;

export type ExplodedMineCell = Cell & {
  content: ExplodedMineContent;
};

// All cells are opened and mines are not exploded
export type CompletedCell = Cell & {
  content: Exclude<CellContent, ExplodedMineContent>;
  state: OpenedState;
};

// All cells are opened and mines are exploded
export type FailedCell = Cell & {
  content: Exclude<CellContent, UnexplodedMineContent>;
  state: OpenedState;
};

// Board Types
export type PlainBoard = Board<PlainCell>;
export type PlayableBoard = Board<PlayableCell>;
export type CompletedBoard = Board<CompletedCell>;
export type FailedBoard = Board<FailedCell>;
