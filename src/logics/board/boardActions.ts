import { Cell, CompletedBoard, EmptyContent, FailedBoard, MineCountContent, PlayableBoard, PlayableCell, SafeCell, UnopenedState } from '.';
import { isOpened, isEmpty, isMine, isUnopened } from '../../helpers/cellHelpers';

import { Either } from '../../types/either';
import { getAroundItems, toMarixPosition, isInside } from '../../utils/matrix';

const open = (board: PlayableBoard, targetCell: SafeCell & {state: UnopenedState}): PlayableBoard | CompletedBoard => {
  // 指定されたboardのマスを開く
  return {
    ...board,
    data: board.data.map((row) => {
      return row.map((cell) => {
        if (cell.id !== targetCell.id) {
          return { ...targetCell, state: { type: 'opened' } };
        }
        return cell;
      });
    }),
  };
};

// 何もないマスを一括開放する
const openEmptyArea = (
  board: PlayableBoard,
  targetCell: Cell & { content: EmptyContent; state: UnopenedState },
): PlayableBoard | CompletedBoard => {
  // flood fill
  // はじめはキューで実装していたが、Array.shift()がO(n)なので遅いためスタックで実装
  let stack = [toMarixPosition(targetCell.id, board.meta.cols)];
  // 同じマスを何度も開かないようにするためにSetを使う
  let checkList = new Set<Cell['id']>();

  let newBoard: PlayableBoard | CompletedBoard = board;

  // TODO: 効率化
  while (stack.length > 0) {
    const target = stack.pop() as [number, number];

    newBoard = open(
      newBoard as PlayableBoard,
      newBoard.data[target[0]][target[1]] as SafeCell & { state: UnopenedState },
    );

    if (!isEmpty(newBoard.data[target[0]][target[1]])) continue;

    // 何もないマスだったら周囲のマスをキューに追加
    getAroundItems(newBoard.data as PlayableCell[][], target)
      .filter((cell) => !isOpened(cell) && !isMine(cell))
      .filter((cell) => !checkList.has(cell.id))
      .forEach((cell) => {
        stack.push(toMarixPosition(cell.id, newBoard.meta.cols));
        checkList.add(cell.id);
      });
  }

  return newBoard;
};

export const openCell = (
  board: PlayableBoard,
  cellId: number,
): Either<PlayableBoard | FailedBoard, PlayableBoard | CompletedBoard> => {
  const position = toMarixPosition(cellId, board.meta.cols);

  const targetCell = board.data[position[0]][position[1]];

  if (!isInside(position, board.data) || isOpened(targetCell)) {
    return { kind: 'Left', value: board };
  }

  if (isMine(targetCell)) {
    return { kind: 'Left', value: igniteMines(board) };
  }

  // result of checks above, targetCell is unopened and not mine
  // targetCellがSafeCell & { state: UnopenedState }であることをTypeScriptに伝える
  const updatedBoard = isEmpty(targetCell)
    ? openEmptyArea(board, targetCell as typeof targetCell & { state: UnopenedState })
    : open(board, targetCell as typeof targetCell & { state: UnopenedState });

  return { kind: 'Right', value: updatedBoard };
};

export const openAll = (board: PlayableBoard): CompletedBoard => {
  return {
    ...board,
    data: board.data.map((row) => {
      return row.map((cell) => {
        return { ...cell, state: { type: 'opened' } };
      });
    }),
  };
};

export const igniteMines = (board: PlayableBoard): FailedBoard => {
  const openedBoard = openAll(board);
  return {
    ...openedBoard,
    data: openedBoard.data.map((row) => {
      return row.map((cell) => {
        return isMine(cell) ? { ...cell, content: { ...cell.content, exploded: true } } : cell;
      });
    }),
  };
};

export const toggleFlag = (board: PlayableBoard, cellId: number): PlayableBoard => {
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

export const switchFlagType = (board: PlayableBoard, cellId: number): PlayableBoard => {
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
