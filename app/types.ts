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
  | 'Time & Dates'
  | 'Holidays';

export interface Word {
  noun: string;
  article: Article;
  translation?: string;
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
}

export interface SessionStats {
  total: number;
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
}
