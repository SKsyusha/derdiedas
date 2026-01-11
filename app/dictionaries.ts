import { Word, Level } from './types';
import A1Words from './data/dictionaries/A1.json';
import A2Words from './data/dictionaries/A2.json';

export const builtInDictionaries: Record<Level, Word[]> = {
  A1: A1Words as Word[],
  A2: A2Words as Word[],
};

// Helper function to get article declension based on case
export function getArticleByCase(article: string, case_: string): string {
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
