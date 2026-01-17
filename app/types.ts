export type Article = 'der' | 'die' | 'das';

export type Case = 'nominativ' | 'akkusativ' | 'dativ' | 'genitiv';

export type Level = 'A1' | 'A2';

export type TrainingMode = 'noun-only' | 'sentence';

export type ArticleType = 'definite' | 'indefinite'; // определенный / неопределенный

export type PronounType = 'none' | 'personal' | 'possessive' | 'demonstrative'; // нет / личные / притяжательные / указательные

export type Language = 'Russian' | 'English' | 'Ukrainian';

export type Topic = string;

export interface Word {
  noun: string;
  article: Article;
  translation?: string; // для обратной совместимости
  translation_ru?: string;
  translation_en?: string;
  translation_uk?: string;
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
  cases: Case[];
  usePronouns: boolean;
  enabledDictionaries: string[]; // Contains 'A1', 'A2', or user dictionary IDs
  language: Language;
  topics: Topic[];
  articleType: ArticleType;
  pronounType: PronounType;
  showTranslation: boolean;
}

export interface SessionStats {
  total: number;
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
}
