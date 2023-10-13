// types
export type * from './types';

// functions
export { openCell, openAll, igniteMines, toggleFlag, switchFlagType } from './boardActions';
export { initBoard, makePlayable } from './boardInitializers';
export {
  isOnlyMinesLeft,
  isCompletedBoard,
  isExplodedBoard,
  countNormalFlags,
  countSuspectedFlags,
} from './boardQueries';
