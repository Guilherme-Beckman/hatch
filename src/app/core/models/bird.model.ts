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
    label: 'Comum',
    color: '#8B9467',
    gradient: 'linear-gradient(135deg, #8B9467, #A8B87A)',
    sessionsToJovem: 5,
    sessionsToAdulto: 15,
  },
  incomum: {
    label: 'Incomum',
    color: '#4A90A4',
    gradient: 'linear-gradient(135deg, #4A90A4, #5BB8D4)',
    sessionsToJovem: 5,
    sessionsToAdulto: 15,
  },
  raro: {
    label: 'Raro',
    color: '#9B59B6',
    gradient: 'linear-gradient(135deg, #9B59B6, #C39BD3)',
    sessionsToJovem: 5,
    sessionsToAdulto: 15,
  },
  lendario: {
    label: 'Lendário',
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
    description: 'O pássaro mais reconhecível do Brasil, famoso pelo seu canto característico.',
    habitat: 'Campos e jardins',
    stages: { filhote: 'assets/birds/bem-te-vi/filhote.svg', jovem: 'assets/birds/bem-te-vi/jovem.svg', adulto: 'assets/birds/bem-te-vi/adulto.svg' },
  },
  {
    id: 'pintassilgo',
    name: 'Pintassilgo',
    species: 'Spinus magellanicus',
    rarity: 'incomum',
    foodAffinity: 'semente',
    description: 'Pequeno pássaro colorido com canto melodioso.',
    habitat: 'Bordas de mata',
    stages: { filhote: 'assets/birds/pintassilgo/filhote.svg', jovem: 'assets/birds/pintassilgo/jovem.svg', adulto: 'assets/birds/pintassilgo/adulto.svg' },
  },
  {
    id: 'beija-flor',
    name: 'Beija-flor',
    species: 'Trochilidae',
    rarity: 'raro',
    foodAffinity: 'semente',
    description: 'Minúsculo e incrivelmente rápido, símbolo de leveza e alegria.',
    habitat: 'Florestas e jardins floridos',
    stages: { filhote: 'assets/birds/beija-flor/filhote.svg', jovem: 'assets/birds/beija-flor/jovem.svg', adulto: 'assets/birds/beija-flor/adulto.svg' },
  },
  {
    id: 'uirapuru',
    name: 'Uirapuru',
    species: 'Cyphorhinus arada',
    rarity: 'lendario',
    foodAffinity: 'semente',
    description: 'O pássaro da lenda, cujo canto traz sorte e amor a quem o escuta.',
    habitat: 'Floresta Amazônica',
    stages: { filhote: 'assets/birds/uirapuru/filhote.svg', jovem: 'assets/birds/uirapuru/jovem.svg', adulto: 'assets/birds/uirapuru/adulto.svg' },
  },
  // Fruta birds
  {
    id: 'sabia',
    name: 'Sabiá-laranjeira',
    species: 'Turdus rufiventris',
    rarity: 'comum',
    foodAffinity: 'fruta',
    description: 'Ave nacional do Brasil, seu canto anuncia a manhã nas cidades.',
    habitat: 'Matas e jardins urbanos',
    stages: { filhote: 'assets/birds/sabia/filhote.svg', jovem: 'assets/birds/sabia/jovem.svg', adulto: 'assets/birds/sabia/adulto.svg' },
  },
  {
    id: 'tucano',
    name: 'Tucano',
    species: 'Ramphastos toco',
    rarity: 'incomum',
    foodAffinity: 'fruta',
    description: 'Ícone da Mata Atlântica, com seu bico colorido e enorme.',
    habitat: 'Mata Atlântica',
    stages: { filhote: 'assets/birds/tucano/filhote.svg', jovem: 'assets/birds/tucano/jovem.svg', adulto: 'assets/birds/tucano/adulto.svg' },
  },
  {
    id: 'arara-azul',
    name: 'Arara-azul',
    species: 'Anodorhynchus hyacinthinus',
    rarity: 'raro',
    foodAffinity: 'fruta',
    description: 'A maior arara do mundo, de azul deslumbrante, ameaçada de extinção.',
    habitat: 'Pantanal e Cerrado',
    stages: { filhote: 'assets/birds/arara-azul/filhote.svg', jovem: 'assets/birds/arara-azul/jovem.svg', adulto: 'assets/birds/arara-azul/adulto.svg' },
  },
  {
    id: 'harpia',
    name: 'Harpia',
    species: 'Harpia harpyja',
    rarity: 'lendario',
    foodAffinity: 'fruta',
    description: 'A águia mais poderosa das Américas, símbolo de força e altivez.',
    habitat: 'Floresta Amazônica',
    stages: { filhote: 'assets/birds/harpia/filhote.svg', jovem: 'assets/birds/harpia/jovem.svg', adulto: 'assets/birds/harpia/adulto.svg' },
  },
  // Biscoito birds
  {
    id: 'periquito',
    name: 'Periquito',
    species: 'Brotogeris chiriri',
    rarity: 'comum',
    foodAffinity: 'biscoito',
    description: 'Pequeno e agitado, vive em bandos barulhentos nas cidades.',
    habitat: 'Áreas urbanas e cerrado',
    stages: { filhote: 'assets/birds/periquito/filhote.svg', jovem: 'assets/birds/periquito/jovem.svg', adulto: 'assets/birds/periquito/adulto.svg' },
  },
  {
    id: 'papagaio',
    name: 'Papagaio-verdadeiro',
    species: 'Amazona amazonica',
    rarity: 'incomum',
    foodAffinity: 'biscoito',
    description: 'Famoso pela capacidade de imitar sons e vozes humanas.',
    habitat: 'Florestas tropicais',
    stages: { filhote: 'assets/birds/papagaio/filhote.svg', jovem: 'assets/birds/papagaio/jovem.svg', adulto: 'assets/birds/papagaio/adulto.svg' },
  },
  {
    id: 'cacatua',
    name: 'Cacatua',
    species: 'Cacatua galerita',
    rarity: 'raro',
    foodAffinity: 'biscoito',
    description: 'Ave exótica de crista impressionante, extremamente inteligente.',
    habitat: 'Regiões tropicais',
    stages: { filhote: 'assets/birds/cacatua/filhote.svg', jovem: 'assets/birds/cacatua/jovem.svg', adulto: 'assets/birds/cacatua/adulto.svg' },
  },
  {
    id: 'ararinha-azul',
    name: 'Ararinha-azul',
    species: 'Cyanopsitta spixii',
    rarity: 'lendario',
    foodAffinity: 'biscoito',
    description: 'Extinta na natureza e símbolo da conservação brasileira. Encontrá-la é um milagre.',
    habitat: 'Caatinga (extinta na natureza)',
    stages: { filhote: 'assets/birds/ararinha-azul/filhote.svg', jovem: 'assets/birds/ararinha-azul/jovem.svg', adulto: 'assets/birds/ararinha-azul/adulto.svg' },
  },
];
