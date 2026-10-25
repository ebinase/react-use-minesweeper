import { createGame, getBoard } from '../src/index.js';
import type { GameOptions } from '../src/index.js';
import type { Minesweeper } from '../src/react/index.js';

const game = createGame();
// @ts-expect-error configuration is readonly
game.config.rows = 3;
// @ts-expect-error progress arrays are readonly
game.opened.push(true);
if (game.status === 'ready') {
  const noMines: null = game.mines;
  void noMines;
} else if (game.status === 'lost') {
  const hit: number = game.explodedCell;
  void hit;
}
for (const cell of getBoard(game).cells) {
  if (cell.state === 'hidden') {
    // @ts-expect-error hidden cells do not expose content
    const value = cell.value;
    void value;
  } else {
    const value: number | 'mine' = cell.value;
    void value;
  }
}
// @ts-expect-error preset and config are mutually exclusive
const invalid: GameOptions = { preset: 'easy', config: { rows: 1, cols: 1, mines: 0 } };
void invalid;
declare const hook: Minesweeper;
// @ts-expect-error Hook board cells are typed, not any
hook.board.cells[0].nonexistent;
// @ts-expect-error only defined flag values are accepted
hook.setFlag(0, 'normal');
