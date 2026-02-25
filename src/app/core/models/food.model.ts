export type FoodType = 'semente' | 'fruta' | 'biscoito';

export interface Food {
  id: FoodType;
  name: string;
  emoji: string;
  description: string;
  /** Which bird IDs this food can attract */
  attractsBirds: string[];
}

export const FOODS: Food[] = [
  {
    id: 'semente',
    name: 'Seed',
    emoji: '🌾',
    description: 'Attracts small field birds',
    attractsBirds: ['bem-te-vi', 'pintassilgo', 'beija-flor', 'uirapuru'],
  },
  {
    id: 'fruta',
    name: 'Fruit',
    emoji: '🍎',
    description: 'Attracts tropical forest birds',
    attractsBirds: ['sabia', 'tucano', 'arara-azul', 'harpia'],
  },
  {
    id: 'biscoito',
    name: 'Biscuit',
    emoji: '🍪',
    description: 'Attracts parrots and intelligent birds',
    attractsBirds: ['periquito', 'papagaio', 'cacatua', 'ararinha-azul'],
  },
];
