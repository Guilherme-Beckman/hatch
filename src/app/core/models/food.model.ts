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
    name: 'Semente',
    emoji: '🌾',
    description: 'Atrai pássaros pequenos dos campos',
    attractsBirds: ['bem-te-vi', 'pintassilgo', 'beija-flor', 'uirapuru'],
  },
  {
    id: 'fruta',
    name: 'Fruta',
    emoji: '🍎',
    description: 'Atrai pássaros tropicais da floresta',
    attractsBirds: ['sabia', 'tucano', 'arara-azul', 'harpia'],
  },
  {
    id: 'biscoito',
    name: 'Biscoito',
    emoji: '🍪',
    description: 'Atrai psitacídeos e aves inteligentes',
    attractsBirds: ['periquito', 'papagaio', 'cacatua', 'ararinha-azul'],
  },
];
