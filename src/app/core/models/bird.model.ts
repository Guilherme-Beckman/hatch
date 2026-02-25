export type Rarity = 'comum' | 'incomum' | 'raro' | 'lendario';
export type BirdStage = 'filhote' | 'jovem' | 'adulto';

export interface Bird {
  id: string;
  name: string;
  species: string;
  rarity: Rarity;
  foodAffinity: string; // FoodType
  description: string;
  habitat: string;
  stages: {
    filhote: string;
    jovem: string;
    adulto: string;
  };
}

export interface UserBird {
  id: string;
  userId: string;
  birdId: string;
  stage: BirdStage;
  sessionsWithBird: number;
  collectedAt: Date;
  name?: string; // custom nickname
}

export const RARITY_CONFIG: Record<Rarity, { label: string; color: string; gradient: string; sessionsToJovem: number; sessionsToAdulto: number }> = {
  comum: {
    label: 'Common',
    color: '#8B9467',
    gradient: 'linear-gradient(135deg, #8B9467, #A8B87A)',
    sessionsToJovem: 5,
    sessionsToAdulto: 15,
  },
  incomum: {
    label: 'Uncommon',
    color: '#4A90A4',
    gradient: 'linear-gradient(135deg, #4A90A4, #5BB8D4)',
    sessionsToJovem: 5,
    sessionsToAdulto: 15,
  },
  raro: {
    label: 'Rare',
    color: '#9B59B6',
    gradient: 'linear-gradient(135deg, #9B59B6, #C39BD3)',
    sessionsToJovem: 5,
    sessionsToAdulto: 15,
  },
  lendario: {
    label: 'Legendary',
    color: '#E67E22',
    gradient: 'linear-gradient(135deg, #E67E22, #F4D03F)',
    sessionsToJovem: 5,
    sessionsToAdulto: 15,
  },
};

export const BIRDS: Bird[] = [
  // Semente birds
  {
    id: 'bem-te-vi',
    name: 'Bem-te-vi',
    species: 'Pitangus sulphuratus',
    rarity: 'comum',
    foodAffinity: 'semente',
    description: 'The most recognizable bird in Brazil, famous for its distinctive call.',
    habitat: 'Fields and gardens',
    stages: { filhote: 'assets/birds/bem-te-vi/filhote.svg', jovem: 'assets/birds/bem-te-vi/jovem.svg', adulto: 'assets/birds/bem-te-vi/adulto.svg' },
  },
  {
    id: 'pintassilgo',
    name: 'Pintassilgo',
    species: 'Spinus magellanicus',
    rarity: 'incomum',
    foodAffinity: 'semente',
    description: 'A small, colorful bird with a melodious song.',
    habitat: 'Forest edges',
    stages: { filhote: 'assets/birds/pintassilgo/filhote.svg', jovem: 'assets/birds/pintassilgo/jovem.svg', adulto: 'assets/birds/pintassilgo/adulto.svg' },
  },
  {
    id: 'beija-flor',
    name: 'Beija-flor',
    species: 'Trochilidae',
    rarity: 'raro',
    foodAffinity: 'semente',
    description: 'Tiny and incredibly fast, a symbol of lightness and joy.',
    habitat: 'Forests and flower gardens',
    stages: { filhote: 'assets/birds/beija-flor/filhote.svg', jovem: 'assets/birds/beija-flor/jovem.svg', adulto: 'assets/birds/beija-flor/adulto.svg' },
  },
  {
    id: 'uirapuru',
    name: 'Uirapuru',
    species: 'Cyphorhinus arada',
    rarity: 'lendario',
    foodAffinity: 'semente',
    description: 'The legendary bird whose song is said to bring luck and love to those who hear it.',
    habitat: 'Amazon Rainforest',
    stages: { filhote: 'assets/birds/uirapuru/filhote.svg', jovem: 'assets/birds/uirapuru/jovem.svg', adulto: 'assets/birds/uirapuru/adulto.svg' },
  },
  // Fruta birds
  {
    id: 'sabia',
    name: 'Sabiá-laranjeira',
    species: 'Turdus rufiventris',
    rarity: 'comum',
    foodAffinity: 'fruta',
    description: "Brazil's national bird, its song announces the morning in cities.",
    habitat: 'Woods and urban gardens',
    stages: { filhote: 'assets/birds/sabia/filhote.svg', jovem: 'assets/birds/sabia/jovem.svg', adulto: 'assets/birds/sabia/adulto.svg' },
  },
  {
    id: 'tucano',
    name: 'Tucano',
    species: 'Ramphastos toco',
    rarity: 'incomum',
    foodAffinity: 'fruta',
    description: 'Icon of the Atlantic Forest, with its enormous colorful bill.',
    habitat: 'Atlantic Forest',
    stages: { filhote: 'assets/birds/tucano/filhote.svg', jovem: 'assets/birds/tucano/jovem.svg', adulto: 'assets/birds/tucano/adulto.svg' },
  },
  {
    id: 'arara-azul',
    name: 'Arara-azul',
    species: 'Anodorhynchus hyacinthinus',
    rarity: 'raro',
    foodAffinity: 'fruta',
    description: 'The largest macaw in the world, in a stunning blue, threatened with extinction.',
    habitat: 'Pantanal and Cerrado',
    stages: { filhote: 'assets/birds/arara-azul/filhote.svg', jovem: 'assets/birds/arara-azul/jovem.svg', adulto: 'assets/birds/arara-azul/adulto.svg' },
  },
  {
    id: 'harpia',
    name: 'Harpia',
    species: 'Harpia harpyja',
    rarity: 'lendario',
    foodAffinity: 'fruta',
    description: 'The most powerful eagle of the Americas, a symbol of strength and majesty.',
    habitat: 'Amazon Rainforest',
    stages: { filhote: 'assets/birds/harpia/filhote.svg', jovem: 'assets/birds/harpia/jovem.svg', adulto: 'assets/birds/harpia/adulto.svg' },
  },
  // Biscoito birds
  {
    id: 'periquito',
    name: 'Periquito',
    species: 'Brotogeris chiriri',
    rarity: 'comum',
    foodAffinity: 'biscoito',
    description: 'Small and lively, lives in noisy flocks in cities.',
    habitat: 'Urban areas and cerrado',
    stages: { filhote: 'assets/birds/periquito/filhote.svg', jovem: 'assets/birds/periquito/jovem.svg', adulto: 'assets/birds/periquito/adulto.svg' },
  },
  {
    id: 'papagaio',
    name: 'Papagaio-verdadeiro',
    species: 'Amazona amazonica',
    rarity: 'incomum',
    foodAffinity: 'biscoito',
    description: 'Famous for its ability to mimic sounds and human voices.',
    habitat: 'Tropical forests',
    stages: { filhote: 'assets/birds/papagaio/filhote.svg', jovem: 'assets/birds/papagaio/jovem.svg', adulto: 'assets/birds/papagaio/adulto.svg' },
  },
  {
    id: 'cacatua',
    name: 'Cacatua',
    species: 'Cacatua galerita',
    rarity: 'raro',
    foodAffinity: 'biscoito',
    description: 'An exotic bird with an impressive crest, extremely intelligent.',
    habitat: 'Tropical regions',
    stages: { filhote: 'assets/birds/cacatua/filhote.svg', jovem: 'assets/birds/cacatua/jovem.svg', adulto: 'assets/birds/cacatua/adulto.svg' },
  },
  {
    id: 'ararinha-azul',
    name: 'Ararinha-azul',
    species: 'Cyanopsitta spixii',
    rarity: 'lendario',
    foodAffinity: 'biscoito',
    description: 'Extinct in the wild and a symbol of Brazilian conservation. Finding one is a miracle.',
    habitat: 'Caatinga (extinct in the wild)',
    stages: { filhote: 'assets/birds/ararinha-azul/filhote.svg', jovem: 'assets/birds/ararinha-azul/jovem.svg', adulto: 'assets/birds/ararinha-azul/adulto.svg' },
  },
];
