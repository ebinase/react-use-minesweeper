import {
  Board,
  BoardConfig,
  Cell,
  PlainBoard,
  PlainCell,
  PlayableBoard,
  UnexplodedMineCell,
} from '.';
import { isMine } from '../../helpers/cellHelpers';
import { convertToMatrix, getAroundItems, toMarixPosition } from '../../utils/matrix';
import { getRandomElements } from '../../utils/random';

export const initBoard = (config: BoardConfig): PlainBoard => {
  return makePlainBoard(config);
};

const makePlainBoard = (config: BoardConfig): PlainBoard => {
  const { rows, cols } = config;
  const plainBoardData: PlainCell[] = [...Array(rows * cols)].map((_, i) => {
    return {
      id: i,
      content: { type: 'empty' },
      state: { type: 'unopened', flag: 'none' },
    };
  });

  return {
    meta: config,
    data: convertToMatrix(plainBoardData, rows, cols),
  };
};

export const makePlayable = (
  board: PlainBoard,
  forceEmpty: Cell['id'] | undefined = undefined,
): PlayableBoard => {
  // initialBoardの中からランダムにmines個の爆弾の位置を決める
  // forceEmptyが指定されている場合はそのマスと周囲のマスを除外する
  const noMineArea =
    forceEmpty !== undefined
      ? getAroundItems(board.data, toMarixPosition(forceEmpty, board.meta.cols))
          .map((cell) => cell.id)
          .concat([forceEmpty])
      : [];
  const minePositions = getRandomElements(
    board.data
      .flat()
      .map((cell) => cell.id)
      .filter((id) => !noMineArea.includes(id)),
    board.meta.mines,
  );

  const boardWithMines: PlainBoardWithMines = {
    ...board,
    data: board.data.map((row) => {
      return row.map((cell) => {
        return minePositions.includes(cell.id)
          ? { ...cell, content: { type: 'mine', exploded: false } }
          : cell;
      });
    }),
  };

  return setMineCount(boardWithMines);
};

// mine-added plain board(without mine count)
type PlainBoardWithMines = Board<PlainCell | UnexplodedMineCell>;

// 周囲の爆弾の数を数える
const setMineCount = (board: PlainBoardWithMines): PlayableBoard => {
  // matrixの要素を一つずつ見ていく
  const newBoardData: PlayableBoard['data'] = board.data.map((row, i) => {
    return row.map((cell, j) => {
      // 爆弾だったら何もしない
      if (isMine(cell)) return cell;

      // 周囲8マスの爆弾の数を数える
      const count = getAroundItems(board.data, [i, j]).filter((item) => isMine(item)).length;
      return {
        ...cell,
        content: count === 0 ? { type: 'empty' } : { type: 'count', value: count },
      };
    });
  });

  return { ...board, data: newBoardData };
};
