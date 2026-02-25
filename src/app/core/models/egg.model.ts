import { Rarity } from './bird.model';
import { FoodType } from './food.model';

export interface Egg {
  id: string;
  userId: string;
  birdId: string;
  rarity: Rarity;
  foodUsed: FoodType;
  hatchAt: Date;
  createdAt: Date;
  hatched: boolean;
  sessionId: string;
}

/** Hatch duration in milliseconds */
export const HATCH_DURATION_MS: Record<Rarity, number> = {
  comum: 30 * 60 * 1000,       // 30 min
  incomum: 2 * 60 * 60 * 1000, // 2 h
  raro: 6 * 60 * 60 * 1000,    // 6 h
  lendario: 12 * 60 * 60 * 1000, // 12 h
};

/** How many ad views are needed to instantly hatch */
export const ADS_TO_HATCH: Record<Rarity, number> = {
  comum: 1,
  incomum: 1,
  raro: 2,
  lendario: 3,
};
