export type Article = 'der' | 'die' | 'das';

export type Case = 'nominativ' | 'akkusativ' | 'dativ' | 'genitiv';

export type Level = 'A1' | 'A2' | 'B1';

export type TrainingMode = 'noun-only' | 'sentence';

export type Language = 'Russian' | 'English' | 'German' | 'French' | 'Spanish';

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
}

export interface SessionStats {
  total: number;
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
}
