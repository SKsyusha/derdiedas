import { Word, Level } from './types';
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
export function getArticleByCase(article: string, case_: string, articleType: 'definite' | 'indefinite' = 'definite'): string {
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

// Generate sentence templates
export function generateSentence(
  word: Word,
  case_: string,
  usePronouns: boolean
): string {
  const templates: Record<string, string[]> = {
    nominativ: usePronouns
      ? ['Ich sehe ___ {noun}.', 'Du siehst ___ {noun}.', 'Er sieht ___ {noun}.', 'Sie sieht ___ {noun}.', 'Wir sehen ___ {noun}.', 'Ihr seht ___ {noun}.']
      : ['Das ist ___ {noun}.', 'Hier ist ___ {noun}.', 'Das ___ {noun} ist schön.'],
    akkusativ: usePronouns
      ? ['Ich sehe ___ {noun}.', 'Du siehst ___ {noun}.', 'Er sieht ___ {noun}.', 'Sie sieht ___ {noun}.', 'Wir sehen ___ {noun}.', 'Ihr seht ___ {noun}.']
      : ['Ich sehe ___ {noun}.', 'Ich kaufe ___ {noun}.', 'Ich finde ___ {noun}.', 'Ich mag ___ {noun}.'],
    dativ: usePronouns
      ? ['Ich gebe ___ {noun} ein Buch.', 'Du gibst ___ {noun} ein Buch.', 'Er gibt ___ {noun} ein Buch.', 'Sie gibt ___ {noun} ein Buch.', 'Wir geben ___ {noun} ein Buch.', 'Ihr gebt ___ {noun} ein Buch.']
      : ['Ich helfe ___ {noun}.', 'Ich folge ___ {noun}.', 'Ich danke ___ {noun}.', 'Ich antworte ___ {noun}.'],
    genitiv: usePronouns
      ? ['Das ist das Buch ___ {noun}.', 'Das ist die Farbe ___ {noun}.', 'Das ist der Freund ___ {noun}.']
      : ['Das ist das Buch ___ {noun}.', 'Die Farbe ___ {noun} ist schön.', 'Der Freund ___ {noun} kommt.', 'Das Auto ___ {noun} ist neu.'],
  };

  const sentenceTemplates = templates[case_] || templates.nominativ;
  const template = sentenceTemplates[Math.floor(Math.random() * sentenceTemplates.length)];
  return template.replace('{noun}', word.noun);
}
