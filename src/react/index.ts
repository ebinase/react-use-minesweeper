import { useCallback, useMemo, useReducer } from 'react';
import { createGame, getBoard, getStats, transition } from '../core/index.js';
import type { Action, Board, Flag, Game, GameOptions, GameStats } from '../core/index.js';

export interface Minesweeper {
  readonly game: Game;
  readonly board: Board;
  readonly stats: GameStats;
  readonly open: (cell: number) => void;
  readonly setFlag: (cell: number, flag: Flag) => void;
  readonly cycleFlag: (cell: number) => void;
  readonly restart: () => void;
  readonly reset: (options?: GameOptions) => void;
}

type HookAction = Action | { type: 'reset'; options: GameOptions };

const randomSeed = (): number => Math.floor(Math.random() * 0x100000000);
const withSeed = (options: GameOptions): GameOptions => ({
  ...options,
  seed: options.seed ?? randomSeed(),
});

function reducer(game: Game, action: HookAction): Game {
  return action.type === 'reset' ? createGame(action.options) : transition(game, action);
}

/** Options apply on mount. Call reset(options) to change configuration explicitly. */
export function useMinesweeper(options: GameOptions = {}): Minesweeper {
  const [game, dispatch] = useReducer(reducer, options, (initial) => createGame(withSeed(initial)));
  const board = useMemo(() => getBoard(game), [game]);
  const stats = useMemo(() => getStats(game), [game]);
  const open = useCallback((cell: number) => dispatch({ type: 'open', cell }), []);
  const setFlag = useCallback(
    (cell: number, flag: Flag) => dispatch({ type: 'setFlag', cell, flag }),
    [],
  );
  const cycleFlag = useCallback((cell: number) => dispatch({ type: 'cycleFlag', cell }), []);
  const restart = useCallback(() => dispatch({ type: 'restart' }), []);
  const reset = useCallback(
    (nextOptions: GameOptions = {}) => dispatch({ type: 'reset', options: withSeed(nextOptions) }),
    [],
  );

  return { game, board, stats, open, setFlag, cycleFlag, restart, reset };
}
