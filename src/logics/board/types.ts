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
