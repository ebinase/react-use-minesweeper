# react-use-minesweeper

A deterministic Minesweeper engine with a React adapter. Version 2 is a breaking redesign.

## React

React 18.2 or later in the React 18 series is a peer dependency; the library does not install a second React. The core entry point can be used without React.

```tsx
import { useMinesweeper } from '@ebinas/react-use-minesweeper/react';

export function Minesweeper() {
  const { game, board, stats, open, cycleFlag, restart, reset } = useMinesweeper({
    preset: 'easy',
  });

  return (
    <>
      <p>
        {game.status}: {stats.remainingMines} mines remaining
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${board.config.cols}, 2rem)` }}>
        {board.cells.map((cell) => (
          <button
            key={cell.id}
            disabled={cell.state === 'revealed'}
            onClick={() => open(cell.id)}
            onContextMenu={(event) => {
              event.preventDefault();
              cycleFlag(cell.id);
            }}
          >
            {cell.state === 'hidden'
              ? { none: '', flag: '🚩', question: '?' }[cell.flag]
              : cell.value === 'mine'
              ? '💣'
              : cell.value || ''}
          </button>
        ))}
      </div>
      <button onClick={restart}>New game</button>
      <button onClick={() => reset({ preset: 'hard' })}>Hard</button>
    </>
  );
}
```

The Hook returns:

| Property            | Contract                                                                              |
| ------------------- | ------------------------------------------------------------------------------------- |
| `game`              | Readonly engine state, including `status`, `config`, `preset`, and `seed`             |
| `board`             | Display projection: flat `cells` with `id`, `row`, `col`, and a discriminated `state` |
| `stats`             | Synchronous flag/question counts and remaining mine/safe-cell counts                  |
| `open(id)`          | Open a cell or its connected empty area                                               |
| `setFlag(id, flag)` | Explicitly set `'none'`, `'flag'`, or `'question'`                                    |
| `cycleFlag(id)`     | Cycle none → flag → question → none                                                   |
| `restart()`         | Keep configuration, advance the seed, clear progress                                  |
| `reset(options?)`   | Create a new game with explicit settings; defaults to easy                            |

Action functions keep their identity across renders. Hook options apply on mount; changing an options object does not silently reset a game. Call `reset` to change settings. Omitted Hook seeds are generated on mount or reset, outside the reducer.

## Framework-independent core

```ts
import { createGame, transition, getBoard, getStats } from '@ebinas/react-use-minesweeper';

let game = createGame({ config: { rows: 10, cols: 12, mines: 20 }, seed: 42 });
game = transition(game, { type: 'setFlag', cell: 119, flag: 'flag' });
game = transition(game, { type: 'open', cell: 0 });
const board = getBoard(game);
const stats = getStats(game);

// Replay the same configuration, seed, first click, and actions for the same result.
game = transition(game, { type: 'restart', seed: 42 });
```

The core uses seed `0` when omitted. Seeds are unsigned 32-bit integers. `transition` never reads clocks or random sources and never mutates its input. `restart` without a seed advances it deterministically; an explicit seed starts a replay. The pseudo-random generator is intended for local gameplay.

## Configuration and rules

`GameOptions` accepts either `preset` or `config`, plus optional `seed` and `firstClick`:

- `PRESETS`: easy 9×9/10 mines, normal 16×16/40 mines, hard 30×16/99 mines.
- Custom dimensions must be positive integers with at most `MAX_CELLS` (10,000) cells.
- Mine counts must be non-negative integers.
- `firstClick: 'zero'` (default) reserves the clicked cell and its neighbors. Mine count must allow this at every possible click: at most `rows * cols - min(rows, 3) * min(cols, 3)`.
- `firstClick: 'safe'` reserves only the clicked cell and permits denser boards, up to `rows * cols - 1` mines.
- Invalid configuration or seeds throw immediately. `validateConfig(config, firstClick?)` exposes the same validation for forms.
- Cell IDs are zero-based row-major indices. Non-integers and out-of-range IDs are no-ops.
- Both flags and questions block direct opening and flood fill. Marks can be placed before the first click. They do not change mine placement or start the game.
- Opening an already-open cell, marking an opened cell, or acting after victory/defeat is a no-op. No-ops preserve the state object identity. Restart is always available.
- Win means every safe cell is opened. Flags are not required. Opening a mine loses; only the clicked mine is marked as exploded.
- `getBoard` reveals all cells after victory/defeat without erasing flags or changing the actual opened cells. Hidden display cells have no `value` field.
- `remainingMines` is `mines - flags` and can be negative. Questions are counted separately.

Engine state is readonly in TypeScript. It includes mine positions for deterministic local gameplay and is not a server authority boundary. Use the display projection to render hidden information, and do not mutate returned arrays or objects. Manually constructed or externally persisted state must be validated by its owner; `transition` expects a state produced by this version of the engine.

## Entry points

- `@ebinas/react-use-minesweeper`: engine, selectors, constants, and types; no React import.
- `@ebinas/react-use-minesweeper/react`: Hook and its `Minesweeper` return type.
- `@ebinas/react-use-minesweeper/core`: an alias for the default core API.

The package ships native ES Modules and TypeScript declarations. Import the core from the package root; import the optional Hook explicitly from `/react`. The default entry point works without React installed. React is an optional peer for Hook users. CommonJS builds are not provided.

## Migrating from v1

| v1                                               | v2                                                            |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `useMinesweeper('easy')`                         | `useMinesweeper({ preset: 'easy' })`                          |
| `gameState` initialized/playing/completed/failed | `game.status` ready/playing/won/lost                          |
| `gameMode`                                       | `game.preset` (`null` for custom boards)                      |
| `init(mode)`                                     | `reset({ preset: mode })`                                     |
| `board.meta`, `board.data`                       | `board.config`, `board.cells`                                 |
| Helpers such as `isOpened`, `isMine`             | Narrow `cell.state === 'revealed'`, then inspect `cell.value` |
| `toggleFlag(id)`                                 | `setFlag(id, currentFlag === 'none' ? 'flag' : 'none')`       |
| `switchFlagType(id)`                             | `setFlag(id, currentFlag === 'flag' ? 'question' : 'flag')`   |
| `flags.normal`, `flags.suspected`                | `stats.flags`, `stats.questions`                              |
| `settings.gameModeList`, `GAME_MODE_LIST`        | `Object.keys(PRESETS)`                                        |
| `GameMode`                                       | `Preset`                                                      |

## Development

```sh
npm ci
npm run typecheck
npm test
npm run test:cov
npm run build
npm run check:package
npm pack
```

Tests cover invalid inputs, deterministic replays, immutability, first-click policies, marks, flood fill, win/loss, restart, and the largest supported board. React tests cover batched actions, stable callbacks, reset behavior, and synchronous stats under StrictMode. Type fixtures check the public discriminated unions and readonly guarantees. `check:package` installs the tarball into an isolated consumer and checks React-free default/core usage, ES Module imports, public types, and React peer resolution.

Derived from [ebinase/mine-sweeper](https://github.com/ebinase/mine-sweeper).
