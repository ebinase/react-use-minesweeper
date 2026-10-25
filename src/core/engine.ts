import type { Action, BoardConfig, FirstClick, Flag, Game, GameOptions, Preset } from './types.js';

export const PRESETS: Readonly<Record<Preset, BoardConfig>> = Object.freeze({
  easy: Object.freeze({ rows: 9, cols: 9, mines: 10 }),
  normal: Object.freeze({ rows: 16, cols: 16, mines: 40 }),
  hard: Object.freeze({ rows: 30, cols: 16, mines: 99 }),
});
export const MAX_CELLS = 10_000;

const validSeed = (seed: number): boolean =>
  Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff;

export function validateConfig(config: BoardConfig, firstClick: FirstClick = 'zero'): void {
  if (firstClick !== 'zero' && firstClick !== 'safe') {
    throw new RangeError('firstClick must be "safe" or "zero"');
  }
  const { rows, cols, mines } = config;
  if (
    !Number.isInteger(rows) ||
    !Number.isInteger(cols) ||
    rows < 1 ||
    cols < 1 ||
    rows * cols > MAX_CELLS
  ) {
    throw new RangeError(
      `Board dimensions must be positive integers with at most ${MAX_CELLS} cells`,
    );
  }
  const reserved = firstClick === 'zero' ? Math.min(rows, 3) * Math.min(cols, 3) : 1;
  if (!Number.isInteger(mines) || mines < 0 || mines > rows * cols - reserved) {
    throw new RangeError('Mine count cannot satisfy the first-click policy for every cell');
  }
}

/** The core defaults to seed 0. Supply a seed to select another reproducible game. */
export function createGame(options: GameOptions = {}): Game {
  const { preset = 'easy', config: customConfig, seed = 0, firstClick = 'zero' } = options;
  if (customConfig !== undefined && options.preset !== undefined) {
    throw new TypeError('Specify either preset or config');
  }
  const config = customConfig ?? PRESETS[preset];
  if (!config) throw new RangeError('Unknown preset');
  validateConfig(config, firstClick);
  if (!validSeed(seed)) throw new RangeError('seed must be an unsigned 32-bit integer');
  return {
    config: { ...config },
    preset: customConfig === undefined ? preset : null,
    firstClick,
    seed,
    status: 'ready',
    mines: null,
    explodedCell: null,
    opened: Array(config.rows * config.cols).fill(false),
    flags: Array(config.rows * config.cols).fill('none'),
  };
}

// A fixed 32-bit PRNG makes transitions deterministic, including seed 0.
const nextSeed = (seed: number): number => (Math.imul(seed, 1664525) + 1013904223) >>> 0;

export function neighbors(config: BoardConfig, cell: number): number[] {
  const row = Math.floor(cell / config.cols);
  const col = cell % config.cols;
  const result: number[] = [];
  for (let r = Math.max(0, row - 1); r <= Math.min(config.rows - 1, row + 1); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(config.cols - 1, col + 1); c++) {
      const id = r * config.cols + c;
      if (id !== cell) result.push(id);
    }
  }
  return result;
}

function placeMines(game: Game, firstCell: number): number[] {
  const excluded = new Set(
    game.firstClick === 'zero' ? [firstCell, ...neighbors(game.config, firstCell)] : [firstCell],
  );
  const candidates = game.opened.map((_, id) => id).filter((id) => !excluded.has(id));
  let seed = game.seed;
  // Partial Fisher-Yates; no recursive sampling or full-board copy per mine.
  for (let i = 0; i < game.config.mines; i++) {
    seed = nextSeed(seed);
    const j = i + Math.floor((seed / 0x100000000) * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, game.config.mines);
}

const validCell = (game: Game, cell: number): boolean =>
  Number.isInteger(cell) && cell >= 0 && cell < game.opened.length;
const validFlag = (flag: Flag): boolean => ['none', 'flag', 'question'].includes(flag);

function setFlag(game: Game, cell: number, flag: Flag): Game {
  if (!validFlag(flag) || game.opened[cell] || game.flags[cell] === flag) return game;
  const flags = game.flags.slice();
  flags[cell] = flag;
  return { ...game, flags };
}

function openCell(game: Game, cell: number): Game {
  // Both kinds of marks block direct opening and flood fill.
  if (game.opened[cell] || game.flags[cell] !== 'none') return game;
  const mines = game.mines ?? placeMines(game, cell);
  const mineSet = new Set(mines);
  if (mineSet.has(cell)) return { ...game, status: 'lost', mines, explodedCell: cell };

  const opened = game.opened.slice();
  const stack = [cell];
  opened[cell] = true;
  while (stack.length > 0) {
    const current = stack.pop()!;
    const around = neighbors(game.config, current);
    if (around.some((id) => mineSet.has(id))) continue;
    for (const id of around) {
      if (opened[id] || game.flags[id] !== 'none' || mineSet.has(id)) continue;
      opened[id] = true;
      stack.push(id);
    }
  }
  const won = opened.filter(Boolean).length === opened.length - mines.length;
  return { ...game, status: won ? 'won' : 'playing', mines, opened, explodedCell: null };
}

/** Invalid cell operations and actions after game over return the same object. */
export function transition(game: Game, action: Action): Game {
  if (action.type === 'restart') {
    const seed = action.seed ?? nextSeed(game.seed);
    return createGame({
      ...(game.preset === null ? { config: game.config } : { preset: game.preset }),
      firstClick: game.firstClick,
      seed,
    });
  }
  if (game.status === 'won' || game.status === 'lost' || !validCell(game, action.cell)) return game;
  switch (action.type) {
    case 'open':
      return openCell(game, action.cell);
    case 'setFlag':
      return setFlag(game, action.cell, action.flag);
    case 'cycleFlag': {
      const next: Record<Flag, Flag> = { none: 'flag', flag: 'question', question: 'none' };
      return setFlag(game, action.cell, next[game.flags[action.cell]]);
    }
    default:
      return game;
  }
}
