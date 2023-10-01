import { BoardConfig } from '../board';
import { GAME_MODE_CONFIG_MAP } from './constants';
import { GameMode } from './types';

// types
export type * from './types';

// constants
export { GAME_MODE_LIST } from './constants';

// functions
export const resolveBoardConfig = (gameMode: GameMode): BoardConfig => {
  return GAME_MODE_CONFIG_MAP[gameMode];
};
