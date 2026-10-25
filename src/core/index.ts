export { createGame, transition, validateConfig, PRESETS, MAX_CELLS } from './engine.js';
export { getBoard, getStats } from './selectors.js';
export type {
  Action,
  Board,
  BoardConfig,
  Cell,
  CellValue,
  FirstClick,
  Flag,
  Game,
  GameOptions,
  GameStats,
  Preset,
  Status,
} from './types.js';
