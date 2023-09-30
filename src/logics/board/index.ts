// types
export type * from './types';

// functions
export { openCell, openAll, igniteMines, toggleFlag, switchFlagType } from './boardActions';
export { initBoard, setMines } from './boardInitializers';
export { isAllOpened, countNormalFlags, countSuspectedFlags } from './boardQueries';
