// main entry point of the library

// TODO: Separate the main logic, helper functions, and type definitions from each files

// hooks
export { useMinesweeper } from './useMinesweeper';

// constants
export { GAME_MODE_LIST } from './useMinesweeper';

// helpers
export { isMine, isCount, isEmpty, isOpened, isUnopened, isFlagged } from './functions/board';

// types
export type { Minesweeper, GameMode } from './useMinesweeper';
export type { Board, BoardConfig, CellData } from './functions/board';
