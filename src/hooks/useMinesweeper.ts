import { useReducer, useCallback, useState, useEffect } from 'react';
import { GameMode, GAME_MODE_LIST, GameState, resolveBoardConfig } from '../logics/game';
import {
  Board,
  countNormalFlags,
  countSuspectedFlags,
  initBoard,
  isAllOpened,
  openAll,
  openCell,
  makePlayable,
  switchFlagType,
  toggleFlag,
  PlainBoard,
  PlayableBoard,
  AllOpenedBoard,
  ExplodedBoard,
} from '../logics/board';
import { isExplodedBoard } from '../logics/board/boardQueries';

interface State {
  gameMode: GameMode;
  gameState: GameState;
  board: Board;
}

interface InitialState extends State {
  gameState: 'initialized';
  board: PlainBoard;
}

interface PlayingState extends State {
  gameState: 'playing';
  board: PlayableBoard;
}

interface CompletedState extends State {
  gameState: 'completed';
  board: AllOpenedBoard;
}

interface FailedState extends State {
  gameState: 'failed';
  board: ExplodedBoard;
}

const isInitialState = (state: State | InitialState): state is InitialState => {
  return state.gameState === 'initialized';
};

const isPlayingState = (state: State | InitialState): state is PlayingState => {
  return state.gameState === 'playing';
};

type Action =
  | { type: 'init'; gameMode: GameMode }
  | { type: 'restart' }
  | { type: 'open'; index: number }
  | { type: 'toggleFlag'; index: number }
  | { type: 'switchFlagType'; index: number };

const initialize = (gameMode: GameMode): InitialState => {
  return {
    gameMode,
    gameState: 'initialized',
    board: initBoard(resolveBoardConfig(gameMode)),
  };
};

const open = (
  state: InitialState | PlayingState,
  action: Extract<Action, { type: 'open' }>,
): PlayingState | CompletedState | FailedState => {
  // 最初のターンだけクリックした場所が空白になるように盤面を強制的に書き換える
  const board = isInitialState(state) ? makePlayable(state.board, action.index) : state.board;

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
    const invalidBoard = result.value;
    if (isExplodedBoard(invalidBoard)) {
      return {
        ...state,
        gameState: 'failed',
        board: invalidBoard,
      };
    } else {
      return { ...state, gameState: 'playing', board: invalidBoard };
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
      if (!isInitialState(state) && !isPlayingState(state)) {
        console.error(
          'Invalid state: Expected InitialState or PlayingState. Got ' + state.gameState,
        );
        return state;
      }
      return open(state, action);
    case 'toggleFlag':
      if (!isPlayingState(state)) {
        console.error('Invalid state: Expected PlayingState. Got ' + state.gameState);
        return state;
      }
      return {
        ...state,
        board: toggleFlag(state.board, action.index),
      };
    case 'switchFlagType':
      if (!isPlayingState(state)) {
        console.error('Invalid state: Expected PlayingState. Got ' + state.gameState);
        return state;
      }
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
