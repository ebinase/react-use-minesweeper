import { createElement, StrictMode } from 'react';
import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { getStats } from '../src/core/index.js';
import type { GameOptions } from '../src/core/index.js';
import { useMinesweeper } from '../src/react/index.js';
import type { Minesweeper } from '../src/react/index.js';

const options: GameOptions = {
  config: { rows: 3, cols: 3, mines: 2 },
  firstClick: 'safe',
  seed: 1,
};
const renderers: ReactTestRenderer[] = [];

function mount(initial: GameOptions = options) {
  let current: Minesweeper;
  const snapshots: Minesweeper[] = [];
  function Harness({ settings }: { settings: GameOptions }) {
    current = useMinesweeper(settings);
    snapshots.push(current);
    return null;
  }
  const element = (settings: GameOptions) =>
    createElement(StrictMode, null, createElement(Harness, { settings }));
  let renderer: ReactTestRenderer;
  act(() => {
    renderer = create(element(initial));
  });
  renderers.push(renderer!);
  return {
    get current() {
      return current!;
    },
    snapshots,
    update(settings: GameOptions) {
      act(() => renderer.update(element(settings)));
    },
  };
}

afterEach(() => {
  act(() => renderers.splice(0).forEach((renderer) => renderer.unmount()));
  jest.restoreAllMocks();
});

test('Hook actions stay stable and changing mount options does not reset a game', () => {
  const hook = mount();
  const first = hook.current;
  act(() => first.open(0));
  expect(hook.current.game.status).toBe('playing');
  const playing = hook.current.game;
  hook.update({ preset: 'hard', seed: 99 });
  expect(hook.current.game).toBe(playing);
  for (const name of ['open', 'setFlag', 'cycleFlag', 'restart', 'reset'] as const) {
    expect(hook.current[name]).toBe(first[name]);
  }
  act(() => hook.current.reset({ preset: 'normal', seed: 99 }));
  expect(hook.current.game).toMatchObject({ status: 'ready', preset: 'normal', seed: 99 });
  expect(hook.current.board.cells).toHaveLength(256);
});

test('stats always match the same render, including loss and restart', () => {
  const hook = mount();
  act(() => hook.current.setFlag(8, 'question'));
  expect(hook.current.stats.questions).toBe(1);
  act(() => hook.current.open(0));
  const mine = hook.current.game.mines!.find((cell) => cell !== 8)!;
  act(() => hook.current.open(mine));
  expect(hook.current.game.status).toBe('lost');
  expect(hook.current.stats.questions).toBe(1);
  expect(hook.current.board.cells.every((cell) => cell.state === 'revealed')).toBe(true);
  act(() => hook.current.restart());
  expect(hook.current.game).toMatchObject({ status: 'ready', config: options.config });
  expect(hook.current.stats.questions).toBe(0);
  for (const snapshot of hook.snapshots) {
    expect(snapshot.stats).toEqual(getStats(snapshot.game));
  }
});

test('batched actions read reducer state rather than a captured snapshot', () => {
  const hook = mount();
  act(() => {
    hook.current.cycleFlag(8);
    hook.current.cycleFlag(8);
    hook.current.open(8);
  });
  expect(hook.current.game.status).toBe('ready');
  expect(hook.current.game.flags[8]).toBe('question');
  act(() => {
    hook.current.setFlag(8, 'none');
    hook.current.open(8);
  });
  expect(hook.current.game.status).not.toBe('ready');
});

test('random seeds are chosen only on mount/reset, never inside game actions or re-renders', () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.25);
  const hook = mount({ preset: 'easy' });
  expect(hook.current.game.seed).toBe(0x40000000);
  const mountedCalls = random.mock.calls.length;
  hook.update({ preset: 'hard' });
  act(() => {
    hook.current.open(0);
    hook.current.restart();
  });
  expect(random.mock.calls).toHaveLength(mountedCalls);
  act(() => hook.current.reset());
  expect(random.mock.calls).toHaveLength(mountedCalls + 1);
  expect(hook.current.game).toMatchObject({ preset: 'easy', seed: 0x40000000, status: 'ready' });
  act(() => hook.current.reset({ seed: 5 }));
  expect(random.mock.calls).toHaveLength(mountedCalls + 1);
  expect(hook.current.game.seed).toBe(5);
});
