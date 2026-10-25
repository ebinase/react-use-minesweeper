import {
  createGame,
  getBoard,
  getStats,
  transition,
  validateConfig,
  MAX_CELLS,
} from '../src/core/index.js';
import type { Game, GameOptions } from '../src/core/index.js';

const tiny = (seed = 1): Game =>
  createGame({ config: { rows: 3, cols: 3, mines: 2 }, firstClick: 'safe', seed });
const open = (game: Game, cell: number): Game => transition(game, { type: 'open', cell });

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test('configuration is copied; public presets and input objects cannot be changed by the game', () => {
  const config = { rows: 4, cols: 4, mines: 3 };
  const game = createGame({ config });
  config.rows = 99;
  expect(game.config.rows).toBe(4);
  expect(game.status).toBe('ready');
  expect(getBoard(game).cells.every((cell) => cell.state === 'hidden' && !('value' in cell))).toBe(
    true,
  );
});

test.each([-1, 9, 0.5, NaN, Infinity, -Infinity])(
  'invalid cell %s is a no-op in every active phase',
  (cell) => {
    const ready = tiny();
    const playing = open(ready, 0);
    for (const game of [ready, playing]) {
      expect(open(game, cell)).toBe(game);
      expect(transition(game, { type: 'setFlag', cell, flag: 'flag' })).toBe(game);
      expect(transition(game, { type: 'cycleFlag', cell })).toBe(game);
    }
  },
);

test.each([
  { rows: 0, cols: 3, mines: 0 },
  { rows: 2.5, cols: 3, mines: 0 },
  { rows: NaN, cols: 3, mines: 0 },
  { rows: Infinity, cols: 3, mines: 0 },
  { rows: MAX_CELLS + 1, cols: 1, mines: 0 },
  { rows: 3, cols: 3, mines: -1 },
  { rows: 3, cols: 3, mines: 0.5 },
  { rows: 3, cols: 3, mines: NaN },
  { rows: 2, cols: 2, mines: 1 },
])('invalid configuration %j fails early', (config) => {
  expect(() => createGame({ config })).toThrow(RangeError);
});

test('dense boards must explicitly choose safe rather than zero first click', () => {
  const config = { rows: 2, cols: 2, mines: 3 };
  expect(() => validateConfig(config)).toThrow(RangeError);
  const game = open(createGame({ config, firstClick: 'safe' }), 3);
  expect(game.status).toBe('won');
  expect(game.mines).not.toContain(3);
});

test.each([-1, 0.1, NaN, Infinity, 0x100000000])('invalid seed %s fails early', (seed) => {
  expect(() => createGame({ seed })).toThrow(RangeError);
  expect(() => transition(tiny(), { type: 'restart', seed })).toThrow(RangeError);
});

test('JavaScript callers also receive configuration errors', () => {
  expect(() => createGame({ preset: 'missing' } as unknown as GameOptions)).toThrow(RangeError);
  expect(() => createGame({ firstClick: 'missing' } as unknown as GameOptions)).toThrow(RangeError);
  expect(() =>
    createGame({
      preset: 'easy',
      config: { rows: 4, cols: 4, mines: 1 },
    } as unknown as GameOptions),
  ).toThrow(TypeError);
});

test('seeded transitions are deterministic and never mutate their input', () => {
  const initial = freeze(tiny(0));
  const result = open(initial, 0);
  expect(open(initial, 0)).toEqual(result);
  expect(open(tiny(0), 0)).toEqual(result);
  expect(initial.mines).toBeNull();
  expect(initial.opened.some(Boolean)).toBe(false);
  const mine = result.mines![0];
  expect(open(freeze(result), mine).status).toBe('lost');
});

test('flags can be set before the first opening and both marks block direct opening', () => {
  let game = tiny();
  for (const flag of ['flag', 'question'] as const) {
    game = transition(game, { type: 'setFlag', cell: 0, flag });
    expect(open(game, 0)).toBe(game);
    expect(game.status).toBe('ready');
  }
  game = transition(game, { type: 'setFlag', cell: 0, flag: 'none' });
  expect(open(game, 0).status).not.toBe('ready');
});

test('flood fill preserves marks; removing the last mark permits a win', () => {
  let game = createGame({ config: { rows: 3, cols: 3, mines: 0 } });
  game = transition(game, { type: 'setFlag', cell: 4, flag: 'flag' });
  game = transition(game, { type: 'setFlag', cell: 8, flag: 'question' });
  game = open(game, 0);
  expect(game.status).toBe('playing');
  expect(game.opened.filter(Boolean)).toHaveLength(7);
  expect(game.opened[4]).toBe(false);
  expect(game.opened[8]).toBe(false);
  expect(getStats(game)).toMatchObject({ flags: 1, questions: 1, remainingSafeCells: 2 });
  game = transition(game, { type: 'setFlag', cell: 4, flag: 'none' });
  game = transition(game, { type: 'setFlag', cell: 8, flag: 'none' });
  expect(open(game, 4).status).toBe('won');
});

test('mark cycle, explicit marking, and already-open cells have predictable no-ops', () => {
  let game = tiny();
  for (const expected of ['flag', 'question', 'none']) {
    game = transition(game, { type: 'cycleFlag', cell: 1 });
    expect(game.flags[1]).toBe(expected);
  }
  expect(transition(game, { type: 'setFlag', cell: 1, flag: 'none' })).toBe(game);
  game = open(game, 0);
  expect(open(game, 0)).toBe(game);
  expect(transition(game, { type: 'cycleFlag', cell: 0 })).toBe(game);
});

test('loss reveals every cell, preserves flags, and only identifies the hit mine as exploded', () => {
  let game = open(tiny(), 0);
  const mines = game.mines!;
  game = transition(game, { type: 'setFlag', cell: mines[1], flag: 'flag' });
  const before = getStats(game);
  game = open(game, mines[0]);
  expect(game.status).toBe('lost');
  expect(getStats(game)).toEqual(before);
  const cells = getBoard(game).cells;
  expect(cells.every((cell) => cell.state === 'revealed')).toBe(true);
  expect(
    cells.filter((cell) => cell.state === 'revealed' && cell.exploded).map((cell) => cell.id),
  ).toEqual([mines[0]]);
  expect(cells[mines[1]].flag).toBe('flag');
  expect(open(game, 1)).toBe(game);
  expect(transition(game, { type: 'cycleFlag', cell: 1 })).toBe(game);
});

test('win preserves the actual opened cells and flags while revealing mines for display', () => {
  let game = open(tiny(), 0);
  const mines = game.mines!;
  game = transition(game, { type: 'setFlag', cell: mines[0], flag: 'flag' });
  for (let cell = 0; cell < 9; cell++) {
    if (!mines.includes(cell)) game = open(game, cell);
  }
  expect(game.status).toBe('won');
  expect(game.opened.filter(Boolean)).toHaveLength(7);
  expect(getStats(game)).toMatchObject({ flags: 1, remainingSafeCells: 0 });
  expect(getBoard(game).cells.every((cell) => cell.state === 'revealed' && !cell.exploded)).toBe(
    true,
  );
  expect(open(game, mines[0])).toBe(game);
});

test('restart preserves settings, clears progress, and deterministically advances the seed', () => {
  const initial = tiny(42);
  const playing = open(initial, 0);
  const restarted = transition(playing, { type: 'restart' });
  expect(restarted.config).toEqual(initial.config);
  expect(restarted.firstClick).toBe(initial.firstClick);
  expect(restarted.seed).not.toBe(initial.seed);
  expect(restarted.status).toBe('ready');
  expect(restarted.mines).toBeNull();
  expect(transition(playing, { type: 'restart' })).toEqual(restarted);
  expect(transition(playing, { type: 'restart', seed: 42 })).toEqual(initial);
  expect(transition(createGame({ preset: 'normal' }), { type: 'restart' }).preset).toBe('normal');
});

test('a one-cell game is supported', () => {
  expect(open(createGame({ config: { rows: 1, cols: 1, mines: 0 } }), 0).status).toBe('won');
});

test('largest supported empty board can be opened without recursion overflow', () => {
  const game = open(createGame({ config: { rows: 100, cols: 100, mines: 0 } }), 0);
  expect(game.status).toBe('won');
  expect(getStats(game).openedSafeCells).toBe(MAX_CELLS);
});

test('mine placement and displayed neighbor counts remain correct across seeds and edges', () => {
  for (let seed = 0; seed < 30; seed++) {
    for (const cell of [0, 2, 9, 19]) {
      const game = open(createGame({ config: { rows: 4, cols: 5, mines: 4 }, seed }), cell);
      const mines = game.mines!;
      expect(new Set(mines).size).toBe(4);
      for (const mine of mines) {
        expect(mine).toBeGreaterThanOrEqual(0);
        expect(mine).toBeLessThan(20);
        const dr = Math.abs(Math.floor(mine / 5) - Math.floor(cell / 5));
        const dc = Math.abs((mine % 5) - (cell % 5));
        expect(dr > 1 || dc > 1).toBe(true);
      }
      for (const visible of getBoard(game).cells) {
        if (visible.state !== 'revealed') continue;
        const expectedCount = mines.filter(
          (mine) =>
            Math.abs(Math.floor(mine / 5) - visible.row) <= 1 &&
            Math.abs((mine % 5) - visible.col) <= 1,
        ).length;
        expect(visible.value).toBe(expectedCount);
      }
    }
  }
});
