import { AllOpenedBoard, Board, ExplodedBoard, PlayableBoard } from '.';
import { isMine, isOpened, isFlagged, isExplodedMine } from '../../helpers/cellHelpers';

export const isAllOpened = (board: PlayableBoard | AllOpenedBoard): board is AllOpenedBoard => {
  return board.data.flat().every((cell) => {
    return isMine(cell) || isOpened(cell); // 爆弾以外のマスが全て開いていたら勝利
  });
};

export const isExplodedBoard = (board: PlayableBoard | ExplodedBoard): board is ExplodedBoard => {
  return board.data.flat().every((cell) => {
    return isExplodedMine(cell);
  });
};

const filterFlaggedCells = (board: Board) => board.data.flat().filter(isFlagged);

export const countNormalFlags = (board: Board) =>
  filterFlaggedCells(board).filter((cell) => cell.state.flag === 'normal').length;

export const countSuspectedFlags = (board: Board) =>
  filterFlaggedCells(board).filter((cell) => cell.state.flag === 'suspected').length;
