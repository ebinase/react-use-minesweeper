import { BoardConfig } from '../board';

export type GameState = 'initialized' | 'playing' | 'completed' | 'failed';

export type GameMode = 'easy' | 'normal' | 'hard';

export const gameModeToOptions = (gameMode: GameMode): BoardConfig => {
  switch (gameMode) {
    case 'easy':
      return { rows: 9, cols: 9, mines: 10 };
    case 'normal':
      return { rows: 16, cols: 16, mines: 40 };
    case 'hard':
      return { rows: 30, cols: 16, mines: 99 };
  }
};

export const GAME_MODE_LIST: GameMode[] = ['easy', 'normal', 'hard'];
