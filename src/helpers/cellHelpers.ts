import { CellData } from '../logics/board';

export function isMine(
  cell: CellData,
): cell is CellData & { content: { type: 'mine'; exploded: boolean } } {
  return cell.content.type === 'mine';
}

export function isCount(
  cell: CellData,
): cell is CellData & { content: { type: 'count'; value: number } } {
  return cell.content.type === 'count';
}

export function isEmpty(cell: CellData): cell is CellData & { content: { type: 'empty' } } {
  return cell.content.type === 'empty';
}

export function isOpened(cell: CellData): cell is CellData & { state: { type: 'opened' } } {
  return cell.state.type === 'opened';
}

export function isUnopened(cell: CellData): cell is CellData & { state: { type: 'unopened' } } {
  return cell.state.type === 'unopened';
}

export function isFlagged(cell: CellData): cell is CellData & {
  state: { type: 'unopened'; flag: 'normal' | 'suspected' };
} {
  return isUnopened(cell) && cell.state.flag !== 'none';
}
