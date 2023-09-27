import { getRandomElements } from '@/functions/random';
import type { Either } from '@/types/Either';
import { convertToMatrix, getAroundItems, isInside, toMarixPosition } from './matrix';

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

export function isOpened(
  cell: CellData,
): cell is { id: number; content: CellData['content']; state: { type: 'opened' } } {
  return cell.state.type === 'opened';
}

export function isUnopened(cell: CellData): cell is {
  id: number;
  content: CellData['content'];
  state: { type: 'unopened'; flag: 'normal' | 'suspected' | 'none' };
} {
  return cell.state.type === 'unopened';
}

export function isFlagged(cell: CellData): cell is {
  id: number;
  content: CellData['content'];
  state: { type: 'unopened'; flag: 'normal' | 'suspected' };
} {
  return isUnopened(cell) && cell.state.flag !== 'none';
}

export type Board = {
  meta: BoardConfig;
  data: CellData[][];
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

const open = (board: Board, selected: [number, number]): Board => {
  // 指定されたboardのマスを開く
  return {
    ...board,
    data: board.data.map((row, i) => {
      return row.map((cell, j) => {
        if (i === selected[0] && j === selected[1]) {
          return { ...cell, state: { type: 'opened' } };
        }
        return cell;
      });
    }),
  };
};

// 何もないマスを一括開放する
const openEmptyArea = (board: Board, selected: [number, number]): Board => {
  const selectedCell = board.data[selected[0]][selected[1]];
  if (isOpened(selectedCell) || !isEmpty(selectedCell)) return board;

  // flood fill
  // はじめはキューで実装していたが、Array.shift()がO(n)なので遅いためスタックで実装
  let stack = [selected];
  // 同じマスを何度も開かないようにするためにSetを使う
  let checkList = new Set<CellData['id']>();

  let newBoard = board;

  // TODO: 効率化
  while (stack.length > 0) {
    const target = stack.pop() as [number, number];

    newBoard = open(newBoard, target);

    if (!isEmpty(newBoard.data[target[0]][target[1]])) continue;

    // 何もないマスだったら周囲のマスをキューに追加
    getAroundItems(newBoard.data, target)
      .filter((cell) => !isOpened(cell) && !isMine(cell))
      .filter((cell) => !checkList.has(cell.id))
      .forEach((cell) => {
        stack.push(toMarixPosition(cell.id, newBoard.meta.cols));
        checkList.add(cell.id);
      });
  }

  return newBoard;
};

// NOTE: PlainBoard型を作ってもいいかも
export const initBoard = (options: BoardConfig): Board => {
  return makePlainBoard(options);
};

export const openCell = (board: Board, cellId: number): Either<string, Board> => {
  const position = toMarixPosition(cellId, board.meta.cols);

  const targetCell = board.data[position[0]][position[1]];

  if (!isInside(position, board.data)) {
    return { kind: 'Left', value: 'Invalid position' };
  }

  if (isOpened(targetCell)) {
    return { kind: 'Left', value: 'Cell already opened' };
  }

  if (isMine(targetCell)) {
    return { kind: 'Left', value: 'Mine Exploded' };
  }

  const updatedBoard = isEmpty(targetCell) ? openEmptyArea(board, position) : open(board, position);

  return { kind: 'Right', value: updatedBoard };
};

export const openAll = (board: Board): Board => {
  return {
    ...board,
    data: board.data.map((row) => {
      return row.map((cell) => {
        return { ...cell, state: { type: 'opened' } };
      });
    }),
  };
};

export const igniteMines = (board: Board): Board => {
  return {
    ...board,
    data: board.data.map((row) => {
      return row.map((cell) => {
        return isMine(cell) ? { ...cell, content: { ...cell.content, exploded: true } } : cell;
      });
    }),
  };
};

export const toggleFlag = (board: Board, cellId: number): Board => {
  return {
    ...board,
    data: board.data.map((row) => {
      return row.map((cell) => {
        if (cell.id !== cellId || !isUnopened(cell)) return cell;
        return {
          ...cell,
          state: {
            ...cell.state,
            flag: cell.state.flag === 'none' ? 'normal' : 'none', // フラグの初期値はハテナではなく旗
          },
        };
      });
    }),
  };
};

export const switchFlagType = (board: Board, cellId: number): Board => {
  return {
    ...board,
    data: board.data.map((row) => {
      return row.map((cell) => {
        if (cell.id !== cellId || !isUnopened(cell)) return cell;
        return {
          ...cell,
          state: {
            ...cell.state,
            flag: cell.state.flag === 'normal' ? 'suspected' : 'normal',
          },
        };
      });
    }),
  };
};

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
