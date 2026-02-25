import { FoodType } from './food.model';
import { Rarity } from './bird.model';

export interface FocusSession {
  id: string;
  userId: string;
  durationMinutes: number;
  foodUsed: FoodType;
  startedAt: Date;
  completedAt: Date | null;
  completed: boolean;
  eggsGenerated: number;
}

/** How many eggs a session generates based on duration */
export function eggsFromSession(minutes: number): number {
  if (minutes < 15) return 0;
  if (minutes <= 30) return 1;
  if (minutes <= 60) return 2;
  return 3;
}

/** Rarity probability table with time bonuses */
export function rollRarity(minutes: number): Rarity {
  let comum = 60;
  let incomum = 25;
  let raro = 12;
  let lendario = 3;

  if (minutes > 30) { incomum += 10; raro += 5; lendario += 2; }
  if (minutes > 60) { raro += 10; lendario += 5; }
  if (minutes > 90) { lendario += 10; }

  const total = comum + incomum + raro + lendario;
  const roll = Math.random() * total;

  if (roll < lendario) return 'lendario';
  if (roll < lendario + raro) return 'raro';
  if (roll < lendario + raro + incomum) return 'incomum';
  return 'comum';
}

/** Pick a random bird of the given rarity that matches the food */
export function pickBird(rarity: Rarity, food: FoodType, birds: { id: string; rarity: Rarity; foodAffinity: string }[]): string {
  const candidates = birds.filter(b => b.rarity === rarity && b.foodAffinity === food);
  if (candidates.length === 0) {
    const fallback = birds.filter(b => b.rarity === rarity);
    return fallback[Math.floor(Math.random() * fallback.length)].id;
  }
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}
