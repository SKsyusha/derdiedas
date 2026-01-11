export type Article = 'der' | 'die' | 'das';

export type Case = 'nominativ' | 'akkusativ' | 'dativ' | 'genitiv';

export type Level = 'A1' | 'A2' | 'B1';

export type TrainingMode = 'noun-only' | 'sentence';

export interface Word {
  noun: string;
  article: Article;
  translation?: string;
  exampleSentence?: string;
  level?: Level;
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
}

export interface SessionStats {
  total: number;
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
}
