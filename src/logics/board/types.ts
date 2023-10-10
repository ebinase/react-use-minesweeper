export interface Board {
  meta: BoardConfig;
  data: CellData[][];
}

export interface PlainBoard extends Board {
  data: PlainCellData[][];
}

export interface PlayableBoard extends Board {
  data: PlayableCellData[][];
}

export interface AllOpenedBoard extends Board {
  data: AllOpenedCellData[][];
}

export interface ExplodedBoard extends Board {
  data: (ExplodedCellData | AllOpenedCellData)[][];
}

export type BoardConfig = {
  rows: number;
  cols: number;
  mines: number;
};

export interface CellData {
  id: number;
  content:
    | { type: 'mine'; exploded: boolean }
    | { type: 'count'; value: number }
    | { type: 'empty' };
  state: { type: 'opened' } | { type: 'unopened'; flag: 'normal' | 'suspected' | 'none' };
}

export interface PlainCellData extends CellData {
  content: { type: 'empty' };
  state: { type: 'unopened'; flag: 'none' };
}

export interface PlayableCellData extends Omit<CellData, 'content'> {
  content:
    | { type: 'mine'; exploded: false } // [changed] exploded: boolean -> exploded: false
    | Exclude<CellData['content'], { type: 'mine'; exploded: boolean }>;
}

// all cells are opened and mines are not exploded
export interface AllOpenedCellData extends PlayableCellData {
  state: { type: 'opened' };
}

// all cells are opened and mines are exploded
export interface ExplodedCellData extends Omit<CellData, 'content'> {
  content:
    | { type: 'mine'; exploded: true } // [changed] exploded: boolean -> exploded: true
    | Exclude<CellData['content'], { type: 'mine'; exploded: boolean }>;
  state: { type: 'opened' };
}
