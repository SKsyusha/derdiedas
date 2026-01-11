export type Article = 'der' | 'die' | 'das';

export type Case = 'nominativ' | 'akkusativ' | 'dativ' | 'genitiv';

export type Level = 'A1' | 'A2';

export type TrainingMode = 'noun-only' | 'sentence';

export type ArticleType = 'definite' | 'indefinite'; // определенный / неопределенный

export type PronounType = 'none' | 'personal' | 'possessive' | 'demonstrative'; // нет / личные / притяжательные / указательные

export type Language = 'Russian' | 'English';

export type Topic = 
  | 'Food'
  | 'Drinks'
  | 'Tableware / Cutlery'
  | 'Kitchen'
  | 'Furniture'
  | 'Rooms'
  | 'Clothes'
  | 'Family'
  | 'People & Professions'
  | 'Animals'
  | 'Nature'
  | 'City'
  | 'Transport'
  | 'School'
  | 'Work'
  | 'Countries & Languages'
  | 'Numbers & Letters'
  | 'Months and Days of the Week'
  | 'Time'
  | 'Home'
  | 'Communication'
  | 'Health';

export interface Word {
  noun: string;
  article: Article;
  translation?: string; // для обратной совместимости
  translation_ru?: string;
  translation_en?: string;
  exampleSentence?: string;
  level?: Level;
  topic?: Topic;
}

export interface Dictionary {
  id: string;
  name: string;
  words: Word[];
  enabled: boolean;
}

export type DictionaryType = 'default' | 'user'; // дефолтный или свой словарь

export interface TrainingSettings {
  mode: TrainingMode;
  level: Level[];
  cases: Case[];
  usePronouns: boolean;
  enabledDictionaries: string[];
  language: Language;
  topics: Topic[];
  articleType: ArticleType;
  pronounType: PronounType;
  showTranslation: boolean;
  dictionaryType: DictionaryType;
}

export interface SessionStats {
  total: number;
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
}
