import { neighbors } from './engine.js';
import type { Board, Cell, CellValue, Game, GameStats } from './types.js';

/** Reveals the board after game over without changing opened cells or flags. */
export function getBoard(game: Game): Board {
  const mines = new Set(game.mines ?? []);
  const revealAll = game.status === 'won' || game.status === 'lost';
  const cells: Cell[] = game.opened.map((opened, id) => {
    const position = { id, row: Math.floor(id / game.config.cols), col: id % game.config.cols };
    const flag = game.flags[id];
    if (!opened && !revealAll) return { ...position, state: 'hidden', flag };
    const value: CellValue = mines.has(id)
      ? 'mine'
      : (neighbors(game.config, id).filter((neighbor) => mines.has(neighbor)).length as CellValue);
    return {
      ...position,
      state: 'revealed',
      flag,
      value,
      exploded: game.explodedCell === id,
    };
  });
  return { config: game.config, cells };
}

export function getStats(game: Game): GameStats {
  const flags = game.flags.filter((flag) => flag === 'flag').length;
  const questions = game.flags.filter((flag) => flag === 'question').length;
  const openedSafeCells = game.opened.filter(Boolean).length;
  return {
    flags,
    questions,
    remainingMines: game.config.mines - flags,
    openedSafeCells,
    remainingSafeCells: game.opened.length - game.config.mines - openedSafeCells,
  };
}
