import { Word, Level, Case, Article, ArticleType, DeterminerType } from './types';
import A1Words from './data/dictionaries/A1.json';
import A2Words from './data/dictionaries/A2.json';

// =====================================================
// BUILT-IN DICTIONARIES CONFIGURATION
// To add a new dictionary:
// 1. Add JSON file to app/data/dictionaries/
// 2. Import it here
// 3. Add to BUILT_IN_DICTIONARIES array below
// 4. Add Level type in types.ts
// 5. Add translation key in locales (settings.{id}Goethe)
// =====================================================

export interface BuiltInDictionaryConfig {
  id: Level;
  words: Word[];
  translationKey: string; // key for i18n (e.g., 'settings.a1Goethe')
}

/**
 * Configuration for all built-in dictionaries.
 * Add new dictionaries here - they will automatically appear in settings.
 */
export const BUILT_IN_DICTIONARIES: BuiltInDictionaryConfig[] = [
  { id: 'A1', words: A1Words as Word[], translationKey: 'settings.a1Goethe' },
  { id: 'A2', words: A2Words as Word[], translationKey: 'settings.a2Goethe' },
  // To add B1: { id: 'B1', words: B1Words as Word[], translationKey: 'settings.b1Goethe' },
];

/**
 * Array of all built-in dictionary IDs (e.g., ['A1', 'A2'])
 */
export const BUILT_IN_DICTIONARY_IDS: Level[] = BUILT_IN_DICTIONARIES.map(d => d.id);

/**
 * Default dictionary ID (used when no dictionary is selected)
 */
export const DEFAULT_DICTIONARY_ID: Level = 'A1';

/**
 * Check if an ID is a built-in dictionary
 */
export function isBuiltInDictionary(id: string): id is Level {
  return BUILT_IN_DICTIONARY_IDS.includes(id as Level);
}

/**
 * Check if an ID is a custom (user) dictionary
 */
export function isCustomDictionary(id: string): boolean {
  return !isBuiltInDictionary(id);
}

/**
 * Legacy: Record of built-in dictionaries for backward compatibility
 */
export const builtInDictionaries: Record<Level, Word[]> = Object.fromEntries(
  BUILT_IN_DICTIONARIES.map(d => [d.id, d.words])
) as Record<Level, Word[]>;

// Helper function to get article declension based on case and article type
export function getArticleByCase(
  article: Article,
  case_: Case,
  articleType: ArticleType = 'definite'
): string {
  if (articleType === 'indefinite') {
    // Indefinite articles (ein/eine)
    const indefiniteDeclensions: Record<string, Record<string, string>> = {
      der: { // masculine -> ein
        nominativ: 'ein',
        akkusativ: 'einen',
        dativ: 'einem',
        genitiv: 'eines',
      },
      die: { // feminine -> eine
        nominativ: 'eine',
        akkusativ: 'eine',
        dativ: 'einer',
        genitiv: 'einer',
      },
      das: { // neuter -> ein
        nominativ: 'ein',
        akkusativ: 'ein',
        dativ: 'einem',
        genitiv: 'eines',
      },
    };
    return indefiniteDeclensions[article]?.[case_] || (article === 'der' ? 'ein' : article === 'die' ? 'eine' : 'ein');
  } else {
    // Definite articles (der/die/das)
    const declensions: Record<string, Record<string, string>> = {
      der: {
        nominativ: 'der',
        akkusativ: 'den',
        dativ: 'dem',
        genitiv: 'des',
      },
      die: {
        nominativ: 'die',
        akkusativ: 'die',
        dativ: 'der',
        genitiv: 'der',
      },
      das: {
        nominativ: 'das',
        akkusativ: 'das',
        dativ: 'dem',
        genitiv: 'des',
      },
    };
    return declensions[article]?.[case_] || article;
  }
}

function getPossessiveMeinByCase(article: Article, case_: Case): string {
  return getPossessiveByCase('mein', article, case_);
}

const POSSESSIVE_STEMS = ['mein', 'dein', 'sein'] as const;
type PossessiveStem = (typeof POSSESSIVE_STEMS)[number];

// Possessive determiners decline like "ein-" words: stem + ending
const POSSESSIVE_ENDINGS: Record<Article, Record<Case, '' | 'e' | 'en' | 'em' | 'er' | 'es'>> = {
  der: { nominativ: '', akkusativ: 'en', dativ: 'em', genitiv: 'es' },
  die: { nominativ: 'e', akkusativ: 'e', dativ: 'er', genitiv: 'er' },
  das: { nominativ: '', akkusativ: '', dativ: 'em', genitiv: 'es' },
};

function getPossessiveByCase(stem: PossessiveStem, article: Article, case_: Case): string {
  return `${stem}${POSSESSIVE_ENDINGS[article][case_]}`;
}

const DEMONSTRATIVE_STEMS = ['dies', 'jen'] as const; // dieser / jener
type DemonstrativeStem = (typeof DEMONSTRATIVE_STEMS)[number];

const DEMONSTRATIVE_ENDINGS: Record<Article, Record<Case, 'er' | 'e' | 'es' | 'en' | 'em'>> = {
  der: { nominativ: 'er', akkusativ: 'en', dativ: 'em', genitiv: 'es' },
  die: { nominativ: 'e', akkusativ: 'e', dativ: 'er', genitiv: 'er' },
  das: { nominativ: 'es', akkusativ: 'es', dativ: 'em', genitiv: 'es' },
};

function getDemonstrativeByCase(stem: DemonstrativeStem, article: Article, case_: Case): string {
  return `${stem}${DEMONSTRATIVE_ENDINGS[article][case_]}`;
}

export function getAcceptedDeterminersByCase(
  article: Article,
  case_: Case,
  determinerType: DeterminerType
): string[] {
  if (determinerType === 'possessive') {
    // We train endings, so accept multiple stems (mein/dein/sein)
    return POSSESSIVE_STEMS.map((stem) => getPossessiveByCase(stem, article, case_));
  }

  if (determinerType === 'demonstrative') {
    return DEMONSTRATIVE_STEMS.map((stem) => getDemonstrativeByCase(stem, article, case_));
  }

  return [getArticleByCase(article, case_, determinerType as ArticleType)];
}

export function getDeterminerByCase(
  article: Article,
  case_: Case,
  determinerType: DeterminerType
): string {
  if (determinerType === 'possessive') {
    return getPossessiveMeinByCase(article, case_);
  }

  if (determinerType === 'demonstrative') {
    // canonical answer for display
    return getDemonstrativeByCase('dies', article, case_);
  }

  return getArticleByCase(article, case_, determinerType as ArticleType);
}

// Generate sentence templates
export function generateSentence(
  word: Word,
  case_: Case
): string {
  const templates: Record<Case, string[]> = {
    nominativ: [
      '___ {noun} ist hier.',
      '___ {noun} ist schön.',
      'Hier steht ___ {noun}.',
      '___ {noun} kommt heute.',
    ],
    akkusativ: [
      'Ich sehe ___ {noun}.',
      'Ich kaufe ___ {noun}.',
      'Ich finde ___ {noun}.',
      'Ich mag ___ {noun}.',
    ],
    dativ: [
      'Ich helfe ___ {noun}.',
      'Ich danke ___ {noun}.',
      'Ich folge ___ {noun}.',
      'Ich antworte ___ {noun}.',
    ],
    genitiv: [
      'Das ist das Buch ___ {noun}.',
      'Die Farbe ___ {noun} ist schön.',
      'Der Freund ___ {noun} kommt.',
      'Das Auto ___ {noun} ist neu.',
    ],
  };

  const sentenceTemplates = templates[case_];
  const template = sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)];
  return template.replace('{noun}', word.noun);
}
