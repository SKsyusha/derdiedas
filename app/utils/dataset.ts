import { Word, Level, Topic } from '../types';
import { builtInDictionaries } from '../dictionaries';

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

/**
 * Get all enabled words with deduplication using Set (by noun)
 */
export function getEnabledWords(options: DatasetOptions): Word[] {
  const { enabledDictionaries, topics = [], userDictionaries = [] } = options;
  const wordsMap = new Map<string, Word>();

  // Add words from built-in dictionaries (A1, A2)
  (['A1', 'A2'] as Level[]).forEach((level) => {
    if (enabledDictionaries.includes(level) && builtInDictionaries[level]) {
      builtInDictionaries[level].forEach((w: Word) => {
        const topicMatch = !topics.length || (w.topic && topics.includes(w.topic));
        if (topicMatch && !wordsMap.has(w.noun)) {
          wordsMap.set(w.noun, w);
        }
      });
    }
  });

  // Add words from user dictionaries
  userDictionaries.forEach((dict) => {
    if (enabledDictionaries.includes(dict.id)) {
      dict.words.forEach((w) => {
        const topicMatch = !topics.length || (w.topic && topics.includes(w.topic));
        if (topicMatch && !wordsMap.has(w.noun)) {
          wordsMap.set(w.noun, w);
        }
      });
    }
  });

  return Array.from(wordsMap.values());
}

/**
 * Get words from specific topics with deduplication
 */
export function getWordsInTopics(options: DatasetOptions): Word[] {
  const { enabledDictionaries, topics = [], userDictionaries = [] } = options;
  const wordsMap = new Map<string, Word>();

  // Add words from built-in dictionaries (A1, A2)
  (['A1', 'A2'] as Level[]).forEach((level) => {
    if (enabledDictionaries.includes(level) && builtInDictionaries[level]) {
      builtInDictionaries[level].forEach((w: Word) => {
        if (w.topic && topics.includes(w.topic) && !wordsMap.has(w.noun)) {
          wordsMap.set(w.noun, w);
        }
      });
    }
  });

  // Add words from user dictionaries
  userDictionaries.forEach((dict) => {
    if (enabledDictionaries.includes(dict.id)) {
      dict.words.forEach((w) => {
        if (w.topic && topics.includes(w.topic) && !wordsMap.has(w.noun)) {
          wordsMap.set(w.noun, w);
        }
      });
    }
  });

  return Array.from(wordsMap.values());
}

/**
 * Get word count for a specific topic with deduplication
 */
export function getTopicWordCount(
  topic: Topic,
  enabledDictionaries: string[],
  userDictionaries: UserDictionary[] = []
): number {
  const seenNouns = new Set<string>();

  // Count from built-in dictionaries
  (['A1', 'A2'] as Level[]).forEach((level) => {
    if (enabledDictionaries.includes(level) && builtInDictionaries[level]) {
      builtInDictionaries[level].forEach((w: Word) => {
        if (w.topic === topic && !seenNouns.has(w.noun)) {
          seenNouns.add(w.noun);
        }
      });
    }
  });

  // Count from user dictionaries
  userDictionaries.forEach((dict) => {
    if (enabledDictionaries.includes(dict.id)) {
      dict.words.forEach((w) => {
        if (w.topic === topic && !seenNouns.has(w.noun)) {
          seenNouns.add(w.noun);
        }
      });
    }
  });

  return seenNouns.size;
}

/**
 * Extract unique topics from all available dictionaries
 */
export function getAllTopics(userDictionaries: UserDictionary[] = []): Topic[] {
  const topicsSet = new Set<Topic>();

  // Extract from built-in dictionaries (A1, A2)
  (['A1', 'A2'] as Level[]).forEach((level) => {
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
  return enabledDictionaries.some(id => id !== 'A1' && id !== 'A2');
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
    for (const level of ['A1', 'A2'] as Level[]) {
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
