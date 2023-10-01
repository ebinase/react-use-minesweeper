import { BoardConfig, Board, CellData } from '.';
import { isMine } from '../../helpers/cellHelpers';
import { convertToMatrix, getAroundItems, toMarixPosition } from '../../utils/matrix';
import { getRandomElements } from '../../utils/random';

// NOTE: PlainBoard型を作ってもいいかも
export const initBoard = (config: BoardConfig): Board => {
  return makePlainBoard(config);
};

const makePlainBoard = (config: BoardConfig): Board => {
  const { rows, cols } = config;
  const plainBoardData: CellData[] = [...Array(rows * cols)].map((_, i) => {
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

export const setMines = (
  board: Board,
  forceEmpty: CellData['id'] | undefined = undefined,
): Board => {
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

  const boardWithMines: Board = {
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

// 周囲の爆弾の数を数える
const setMineCount = (board: Board): Board => {
  // matrixの要素を一つずつ見ていく
  const newBoardData: CellData[][] = board.data.map((row, i) => {
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
