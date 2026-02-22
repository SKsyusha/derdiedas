import { Word, Topic } from '../types';
import { builtInDictionaries, BUILT_IN_DICTIONARY_IDS, isBuiltInDictionary } from '../dictionaries';

export interface UserDictionary {
  id: string;
  name: string;
  words: Word[];
  enabled: boolean;
}

export interface DatasetOptions {
  enabledDictionaries: string[];
  topics?: Topic[];
  userDictionaries?: UserDictionary[];
}

/** Unique key per dictionary entry (noun + article + topic) so same noun in different topics or articles counts once each */
function entryKey(w: Word): string {
  return `${w.noun}\t${w.article}\t${w.topic ?? ''}`;
}

/**
 * Get all enabled words. Deduplication by entry (noun+article+topic) so total matches dictionary size.
 */
export function getEnabledWords(options: DatasetOptions): Word[] {
  const { enabledDictionaries, topics = [], userDictionaries = [] } = options;
  const wordsMap = new Map<string, Word>();

  // Add words from built-in dictionaries
  BUILT_IN_DICTIONARY_IDS.forEach((level) => {
    if (enabledDictionaries.includes(level) && builtInDictionaries[level]) {
      builtInDictionaries[level].forEach((w: Word) => {
        const topicMatch = !topics.length || (w.topic && topics.includes(w.topic));
        if (topicMatch) {
          const key = entryKey(w);
          if (!wordsMap.has(key)) wordsMap.set(key, w);
        }
      });
    }
  });

  // Add words from user dictionaries
  userDictionaries.forEach((dict) => {
    if (enabledDictionaries.includes(dict.id)) {
      dict.words.forEach((w) => {
        const topicMatch = !topics.length || (w.topic && topics.includes(w.topic));
        if (topicMatch) {
          const key = entryKey(w);
          if (!wordsMap.has(key)) wordsMap.set(key, w);
        }
      });
    }
  });

  return Array.from(wordsMap.values());
}

/**
 * Get words from specific topics. Deduplication by entry (noun+article+topic).
 */
export function getWordsInTopics(options: DatasetOptions): Word[] {
  const { enabledDictionaries, topics = [], userDictionaries = [] } = options;
  const wordsMap = new Map<string, Word>();

  // Add words from built-in dictionaries
  BUILT_IN_DICTIONARY_IDS.forEach((level) => {
    if (enabledDictionaries.includes(level) && builtInDictionaries[level]) {
      builtInDictionaries[level].forEach((w: Word) => {
        if (w.topic && topics.includes(w.topic)) {
          const key = entryKey(w);
          if (!wordsMap.has(key)) wordsMap.set(key, w);
        }
      });
    }
  });

  // Add words from user dictionaries
  userDictionaries.forEach((dict) => {
    if (enabledDictionaries.includes(dict.id)) {
      dict.words.forEach((w) => {
        if (w.topic && topics.includes(w.topic)) {
          const key = entryKey(w);
          if (!wordsMap.has(key)) wordsMap.set(key, w);
        }
      });
    }
  });

  return Array.from(wordsMap.values());
}

/**
 * Get word count for a specific topic (by entry: noun+article+topic)
 */
export function getTopicWordCount(
  topic: Topic,
  enabledDictionaries: string[],
  userDictionaries: UserDictionary[] = []
): number {
  const seen = new Set<string>();

  BUILT_IN_DICTIONARY_IDS.forEach((level) => {
    if (enabledDictionaries.includes(level) && builtInDictionaries[level]) {
      builtInDictionaries[level].forEach((w: Word) => {
        if (w.topic === topic) seen.add(entryKey(w));
      });
    }
  });

  userDictionaries.forEach((dict) => {
    if (enabledDictionaries.includes(dict.id)) {
      dict.words.forEach((w) => {
        if (w.topic === topic) seen.add(entryKey(w));
      });
    }
  });

  return seen.size;
}

/**
 * Extract unique topics from all available dictionaries
 */
export function getAllTopics(userDictionaries: UserDictionary[] = []): Topic[] {
  const topicsSet = new Set<Topic>();

  // Extract from built-in dictionaries
  BUILT_IN_DICTIONARY_IDS.forEach((level) => {
    if (builtInDictionaries[level]) {
      builtInDictionaries[level].forEach((word: Word) => {
        if (word.topic) {
          topicsSet.add(word.topic);
        }
      });
    }
  });

  // Extract from user dictionaries
  userDictionaries.forEach((dict) => {
    dict.words.forEach((word) => {
      if (word.topic) {
        topicsSet.add(word.topic);
      }
    });
  });

  return Array.from(topicsSet).sort();
}

/**
 * Check if any custom dictionary is enabled
 */
export function hasCustomDictionaryEnabled(enabledDictionaries: string[]): boolean {
  return enabledDictionaries.some(id => !isBuiltInDictionary(id));
}

/**
 * Filter topics to only include those that have words in selected dictionaries
 */
export function filterTopicsWithWords(
  topics: Topic[],
  enabledDictionaries: string[],
  userDictionaries: UserDictionary[] = []
): Topic[] {
  return topics.filter((topic) => {
    // Check built-in dictionaries
    for (const level of BUILT_IN_DICTIONARY_IDS) {
      if (enabledDictionaries.includes(level) && builtInDictionaries[level]) {
        if (builtInDictionaries[level].some((w: Word) => w.topic === topic)) {
          return true;
        }
      }
    }
    // Check user dictionaries
    for (const dict of userDictionaries) {
      if (enabledDictionaries.includes(dict.id)) {
        if (dict.words.some((w) => w.topic === topic)) {
          return true;
        }
      }
    }
    return false;
  });
}
