import { Cell, CompletedBoard, FailedBoard, FlaggedState, PlainBoard, PlayableBoard } from '.';
import { isMine, isOpened, isFlagged, isExplodedMine } from '../../helpers/cellHelpers';

export const isOnlyMinesLeft = (board: PlayableBoard): boolean => {
  return board.data.flat().every((cell) => {
    return (isMine(cell) && !isOpened(cell)) || isOpened(cell); // 爆弾以外のマスが全て開いていたら勝利
  });
};

export const isCompletedBoard = (
  board: PlayableBoard | CompletedBoard,
): board is CompletedBoard => {
  return board.data.flat().every((cell) => {
    return !isExplodedMine(cell) && isOpened(cell);
  });
};

export const isExplodedBoard = (board: PlayableBoard | FailedBoard): board is FailedBoard => {
  return board.data.flat().some((cell) => {
    return isExplodedMine(cell);
  });
};

const filterFlaggedCells = (board: PlainBoard | PlayableBoard) =>
  board.data.flat().filter(isFlagged) as (Cell & { state: FlaggedState })[];

export const countNormalFlags = (board: PlainBoard | PlayableBoard) =>
  filterFlaggedCells(board).filter((cell) => cell.state.flag === 'normal').length;

export const countSuspectedFlags = (board: PlainBoard | PlayableBoard) =>
  filterFlaggedCells(board).filter((cell) => cell.state.flag === 'suspected').length;
