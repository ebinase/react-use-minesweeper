// main entry point of the library

// hooks
export { useMinesweeper } from './hooks/useMinesweeper';

// constants
export { GAME_MODE_LIST } from './logics/game';

// helpers
export {
  isMine,
  isExplodedMine,
  isMineCount,
  isEmpty,
  isOpened,
  isUnopened,
  isFlagged,
} from './helpers/cellHelpers';

// types
export type { Minesweeper } from './hooks/useMinesweeper';
export type { GameMode } from './logics/game';
export type { Board, BoardConfig, Cell } from './logics/board';
