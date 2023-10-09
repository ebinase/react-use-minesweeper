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
