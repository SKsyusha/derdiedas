export type Article = 'der' | 'die' | 'das';

export type Case = 'nominativ' | 'akkusativ' | 'dativ' | 'genitiv';

// Built-in dictionary levels
// To add a new level (e.g., B1):
// 1. Add it here: 'A1' | 'A2' | 'B1'
// 2. Add JSON file to app/data/dictionaries/B1.json
// 3. Import and add to BUILT_IN_DICTIONARIES in app/dictionaries.ts
// 4. Add translation key in locales (settings.b1Goethe)
export type Level = 'A1' | 'A2';

export type TrainingMode = 'noun-only' | 'sentence';

export type ArticleType = 'definite' | 'indefinite'; // определенный / неопределенный

export type PronounType = 'none' | 'possessive' | 'demonstrative'; // нет / притяжательные / указательные

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
