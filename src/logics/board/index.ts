// functions
export { openCell, openAll, igniteMines, toggleFlag, switchFlagType } from './boardActions';
export { initBoard, setMines } from './boardInitializers';
export { isAllOpened, countNormalFlags, countSuspectedFlags } from './boardQueries';

// types
export type Board = {
  meta: BoardConfig;
  data: CellData[][];
};

export type BoardConfig = {
  rows: number;
  cols: number;
  mines: number;
};

export type CellData = {
  id: number;
  content:
    | { type: 'mine'; exploded: boolean }
    | { type: 'count'; value: number }
    | { type: 'empty' };
  state: { type: 'opened' } | { type: 'unopened'; flag: 'normal' | 'suspected' | 'none' };
};
