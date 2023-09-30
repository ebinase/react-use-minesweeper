import { Board } from '.';
import { isMine, isOpened, isFlagged } from '../../helpers/cellHelpers';

export const isAllOpened = (board: Board): boolean => {
  return board.data.flat().every((cell) => {
    return isMine(cell) || isOpened(cell); // 爆弾以外のマスが全て開いていたら勝利
  });
};

const filterFlaggedCells = (board: Board) => board.data.flat().filter(isFlagged);

export const countNormalFlags = (board: Board) =>
  filterFlaggedCells(board).filter((cell) => cell.state.flag === 'normal').length;

export const countSuspectedFlags = (board: Board) =>
  filterFlaggedCells(board).filter((cell) => cell.state.flag === 'suspected').length;
