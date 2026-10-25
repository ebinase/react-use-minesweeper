export type Preset = 'easy' | 'normal' | 'hard';
export type Flag = 'none' | 'flag' | 'question';
export type FirstClick = 'safe' | 'zero';
export type Status = 'ready' | 'playing' | 'won' | 'lost';

export type BoardConfig = Readonly<{ rows: number; cols: number; mines: number }>;

export type GameOptions = (
  | { preset?: Preset; config?: never }
  | { config: BoardConfig; preset?: never }
) & { seed?: number; firstClick?: FirstClick };

type BaseGame = Readonly<{
  config: BoardConfig;
  preset: Preset | null;
  firstClick: FirstClick;
  seed: number;
  opened: readonly boolean[];
  flags: readonly Flag[];
}>;

export type Game = BaseGame &
  (
    | Readonly<{ status: 'ready'; mines: null; explodedCell: null }>
    | Readonly<{
        status: 'playing' | 'won';
        mines: readonly number[];
        explodedCell: null;
      }>
    | Readonly<{
        status: 'lost';
        mines: readonly number[];
        explodedCell: number;
      }>
  );

export type Action =
  | Readonly<{ type: 'open'; cell: number }>
  | Readonly<{ type: 'setFlag'; cell: number; flag: Flag }>
  | Readonly<{ type: 'cycleFlag'; cell: number }>
  | Readonly<{ type: 'restart'; seed?: number }>;

export type CellValue = 'mine' | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type CellPosition = Readonly<{ id: number; row: number; col: number }>;

/** Hidden cells deliberately have no value; visible cells preserve their original flag. */
export type Cell = CellPosition &
  (
    | Readonly<{ state: 'hidden'; flag: Flag }>
    | Readonly<{
        state: 'revealed';
        flag: Flag;
        value: CellValue;
        exploded: boolean;
      }>
  );

export type Board = Readonly<{
  config: BoardConfig;
  cells: readonly Cell[];
}>;

export type GameStats = Readonly<{
  flags: number;
  questions: number;
  remainingMines: number;
  openedSafeCells: number;
  remainingSafeCells: number;
}>;
