import { BoardConfig } from '../board';
import { GameMode } from './types';

export const GAME_MODE_LIST: GameMode[] = ['easy', 'normal', 'hard'] as const;

export const GAME_MODE_CONFIG_MAP: Record<GameMode, BoardConfig> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  normal: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 30, cols: 16, mines: 99 },
} as const;
