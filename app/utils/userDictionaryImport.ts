import { Article, Word } from '../types';

export type UserDictionaryState = {
  id: string;
  name: string;
  words: Word[];
  enabled: boolean;
};

const IMPORT_ARTICLES: Article[] = ['der', 'die', 'das'];
const IMPORT_SEPARATOR_REGEX = /(?:\s+[-–—]\s+|->|:|=)/;
/** Strip leading bullet (e.g. "- ", "• ", "* ") so "article + noun — translation" can be parsed. */
const LEADING_BULLET_REGEX = /^[-*•·]\s+/;

/**
 * Parses multi-line import text into Word[].
 *
 * Supported line formats:
 * - "der Hund собака"
 * - "der Hund - собака" / "der Hund — собака" / "der Hund: собака" / "der Hund -> собака"
 * - Bullet list: "- die Banane — банан", "• der Apfel — яблоко"
 */
export function parseUserDictionaryImportText(text: string): Word[] {
  const lines = text.split(/\r?\n/);
  const result: Word[] = [];

  for (const raw of lines) {
    let line = raw.replace(/\t+/g, ' ').trim();
    if (!line) continue;
    line = line.replace(LEADING_BULLET_REGEX, '');
    if (!line) continue;

    const [left, ...right] = line.split(IMPORT_SEPARATOR_REGEX);
    const hasExplicitSeparator = right.length > 0;
    const translationRaw = right.join(' ').trim();
    let translation = translationRaw ? translationRaw : undefined;

    const leftNormalized = left.replace(/\s+/g, ' ').trim();
    const tokens = leftNormalized.split(' ');
    if (tokens.length < 2) continue;

    const articleCandidate = tokens[0].toLowerCase();
    if (!IMPORT_ARTICLES.includes(articleCandidate as Article)) continue;

    const noun = (() => {
      if (hasExplicitSeparator) return tokens.slice(1).join(' ').trim();
      if (tokens.length === 2) return tokens[1].trim();
      translation = translation ?? (tokens.slice(2).join(' ').trim() || undefined);
      return tokens[1].trim();
    })();

    if (!noun) continue;

    result.push({
      article: articleCandidate as Article,
      noun,
      translation,
    });
  }

  return result;
}

export function dedupeWordsByNoun(words: Word[]): Word[] {
  const seen = new Set<string>();
  const unique: Word[] = [];
  for (const w of words) {
    if (seen.has(w.noun)) continue;
    seen.add(w.noun);
    unique.push(w);
  }
  return unique;
}

/**
 * Pure state update helper: merge imported words into the first user dictionary,
 * or create the default one when none exist.
 */
export function mergeImportedWordsIntoUserDictionaries(
  current: UserDictionaryState[],
  imported: Word[],
  defaultDictionaryName: string,
  defaultDictionaryId: string = 'user-1'
): { next: UserDictionaryState[]; createdDictionaryId?: string } {
  const wordsToAdd = dedupeWordsByNoun(imported);
  if (wordsToAdd.length === 0) return { next: current };

  if (current.length === 0) {
    return {
      next: [
        {
          id: defaultDictionaryId,
          name: defaultDictionaryName,
          words: wordsToAdd,
          enabled: true,
        },
      ],
      createdDictionaryId: defaultDictionaryId,
    };
  }

  const [first, ...rest] = current;
  const existing = new Set(first.words.map((w) => w.noun));
  const uniqueNew = wordsToAdd.filter((w) => !existing.has(w.noun));

  if (uniqueNew.length === 0) return { next: current };

  return {
    next: [{ ...first, words: [...first.words, ...uniqueNew] }, ...rest],
  };
}

