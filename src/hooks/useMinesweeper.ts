import { useReducer, useCallback, useState, useEffect } from 'react';
import { GameMode, GAME_MODE_LIST, GameState, resolveBoardConfig } from '../logics/game';
import {
  Board,
  countNormalFlags,
  countSuspectedFlags,
  igniteMines,
  initBoard,
  isAllOpened,
  openAll,
  openCell,
  setMines,
  switchFlagType,
  toggleFlag,
} from '../logics/board';

type State = {
  gameMode: GameMode;
  gameState: GameState;
  board: Board;
};

type Action =
  | { type: 'init'; gameMode: GameMode }
  | { type: 'restart' }
  | { type: 'open'; index: number }
  | { type: 'toggleFlag'; index: number }
  | { type: 'switchFlagType'; index: number };

const initialize = (gameMode: GameMode): State => {
  return {
    gameMode,
    gameState: 'initialized',
    board: initBoard(resolveBoardConfig(gameMode)),
  };
};

const open = (state: State, action: Extract<Action, { type: 'open' }>): State => {
  // ゲームが終了していたら何もしない
  if (state.gameState === 'completed' || state.gameState === 'failed') {
    return state;
  }

  // 最初のターンだけクリックした場所が空白になるように盤面を強制的に書き換える
  const board =
    state.gameState === 'initialized' ? setMines(state.board, action.index) : state.board;

  const result = openCell(board, action.index);

  if (result.kind === 'Right') {
    const updatedBoard = result.value;
    if (isAllOpened(updatedBoard)) {
      return {
        ...state,
        gameState: 'completed',
        board: openAll(updatedBoard),
      };
    }
    return { ...state, gameState: 'playing', board: updatedBoard };
  } else {
    switch (result.value) {
      case 'Mine Exploded':
        return {
          ...state,
          gameState: 'failed',
          board: igniteMines(openAll(state.board)),
        };
      default:
        return state;
    }
  }
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    // 初期化
    case 'init':
      return initialize(action.gameMode);
    // 同じゲームモードで初期化
    case 'restart':
      return initialize(state.gameMode);
    // マスを開く
    case 'open':
      return open(state, action);
    case 'toggleFlag':
      return {
        ...state,
        board: toggleFlag(state.board, action.index),
      };
    case 'switchFlagType':
      return {
        ...state,
        board: switchFlagType(state.board, action.index),
      };
    default:
      return state;
  }
};

export const useMinesweeper = (defaultGameMode: GameMode = 'easy') => {
  // reducer
  const [state, dispatch] = useReducer(reducer, initialize(defaultGameMode));

  // action
  const init = useCallback(
    (gameMode: GameMode) => dispatch({ type: 'init', gameMode }),
    [dispatch],
  );
  const restart = useCallback(() => dispatch({ type: 'restart' }), [dispatch]);
  const openAction = useCallback((index: number) => dispatch({ type: 'open', index }), [dispatch]);
  const toggleFlag = useCallback(
    (index: number) => dispatch({ type: 'toggleFlag', index }),
    [dispatch],
  );
  const switchFlagType = useCallback(
    (index: number) => dispatch({ type: 'switchFlagType', index }),
    [dispatch],
  );

  // middleware
  const [normalFlags, setNormalFlags] = useState(0);
  const [suspectedFlags, setSuspectedFlags] = useState(0);
  useEffect(() => {
    // クリアor失敗した場合にフラグの数が0になるが、終了時点でのフラグ数をキープしておくために終了時は更新しない
    if (state.gameState === 'completed' || state.gameState === 'failed') return;

    setNormalFlags(countNormalFlags(state.board));
    setSuspectedFlags(countSuspectedFlags(state.board));
  }, [state]);

  return {
    ...state,
    init,
    restart,
    open: openAction,
    toggleFlag,
    switchFlagType,
    flags: { normal: normalFlags, suspected: suspectedFlags },
    settings: { gameModeList: GAME_MODE_LIST },
  };
};

export type Minesweeper = ReturnType<typeof useMinesweeper>;
