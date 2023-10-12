import type {
  Cell,
  EmptyContent,
  ExplodedMineCell,
  FlaggedState,
  MineCountContent,
  OpenedState,
  UnexplodedMineCell,
  UnopenedState,
} from '../logics/board';

export function isMine(cell: Cell): cell is UnexplodedMineCell | ExplodedMineCell {
  return cell.content.type === 'mine';
}

export function isExplodedMine(cell: Cell): cell is ExplodedMineCell {
  return isMine(cell) && cell.content.exploded;
}

export function isMineCount(cell: Cell): cell is Cell & { content: MineCountContent } {
  return cell.content.type === 'count';
}

export function isEmpty(cell: Cell): cell is Cell & { content: EmptyContent } {
  return cell.content.type === 'empty';
}

export function isOpened(cell: Cell): cell is Cell & { state: OpenedState } {
  return cell.state.type === 'opened';
}

export function isUnopened(cell: Cell): cell is Cell & { state: UnopenedState } {
  return cell.state.type === 'unopened';
}

export function isFlagged(cell: Cell): cell is Cell & { state: FlaggedState } {
  return isUnopened(cell) && cell.state.flag !== 'none';
}
