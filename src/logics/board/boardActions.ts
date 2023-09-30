import { Board, CellData } from '.';
import { isOpened, isEmpty, isMine, isUnopened } from '../../helpers/cellHelpers';

import { Either } from '../../types/either';
import { getAroundItems, toMarixPosition, isInside } from '../../utils/matrix';

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
