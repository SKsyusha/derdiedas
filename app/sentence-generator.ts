// Types for sentence generator

export interface NounData {
  word: string;
  gender: 'm' | 'f' | 'n';
  plural: string;
  genitive_sg?: string;
  translations: {
    ru: string[];
    en: string[];
  };
}

export interface DeterminerRules {
  [key: string]: {
    NOM: { m: string; f: string; n: string; pl: string };
    AKK: { m: string; f: string; n: string; pl: string };
    DAT: { m: string; f: string; n: string; pl: string };
    GEN: { m: string; f: string; n: string; pl: string };
  };
}

export interface SentenceTemplate {
  id: string;
  case: 'NOM' | 'AKK' | 'DAT' | 'GEN';
  template: string;
  translations: {
    ru: string;
    en: string;
  };
}

export interface GeneratedSentence {
  templateId: string;
  case: 'NOM' | 'AKK' | 'DAT' | 'GEN';
  determinerKey: string;
  sentence: string;
  translations: {
    ru: string;
    en: string;
  };
}

/**
 * Generates all valid German sentences with different cases and determiners
 * @param noun - Noun data (word, gender, plural, genitive_sg, translations)
 * @param determinerRules - Rules for determiner forms by case and gender
 * @param templates - Sentence templates with translations
 * @returns Array of generated sentences with German text and translations
 */
export function generateSentences(
  noun: NounData,
  determinerRules: DeterminerRules,
  templates: SentenceTemplate[]
): GeneratedSentence[] {
  const results: GeneratedSentence[] = [];

  // Iterate through all templates
  for (const template of templates) {
    const case_ = template.case;

    // Iterate through all determiners
    for (const [determinerKey, determinerRule] of Object.entries(determinerRules)) {
      // Check if determiner has form for this case
      if (!determinerRule[case_]) {
        continue;
      }

      // Get determiner form based on case and gender
      const determinerForm = determinerRule[case_][noun.gender];
      
      // Skip if determiner form doesn't exist for this gender
      if (!determinerForm) {
        continue;
      }

      // Determine noun form
      let nounForm: string;
      if (case_ === 'GEN' && noun.genitive_sg) {
        // Use genitive singular form if available
        nounForm = noun.genitive_sg;
      } else {
        // Use base word form
        nounForm = noun.word;
      }

      // Replace placeholders in template
      let sentence = template.template
        .replace('{DET}', determinerForm)
        .replace('{WORD}', nounForm);

      // Add to results
      results.push({
        templateId: template.id,
        case: case_,
        determinerKey,
        sentence,
        translations: {
          ru: template.translations.ru,
          en: template.translations.en,
        },
      });
    }
  }

  return results;
}

/**
 * Example usage function
 */
export function exampleUsage() {
  const noun: NounData = {
    word: 'Hund',
    gender: 'm',
    plural: 'Hunde',
    genitive_sg: 'Hundes',
    translations: {
      ru: ['собака', 'пёс'],
      en: ['dog'],
    },
  };

  const determinerRules: DeterminerRules = {
    def: {
      NOM: { m: 'der', f: 'die', n: 'das', pl: 'die' },
      AKK: { m: 'den', f: 'die', n: 'das', pl: 'die' },
      DAT: { m: 'dem', f: 'der', n: 'dem', pl: 'den' },
      GEN: { m: 'des', f: 'der', n: 'des', pl: 'der' },
    },
    mein: {
      NOM: { m: 'mein', f: 'meine', n: 'mein', pl: 'meine' },
      AKK: { m: 'meinen', f: 'meine', n: 'mein', pl: 'meine' },
      DAT: { m: 'meinem', f: 'meiner', n: 'meinem', pl: 'meinen' },
      GEN: { m: 'meines', f: 'meiner', n: 'meines', pl: 'meiner' },
    },
  };

  const templates: SentenceTemplate[] = [
    {
      id: 'nom',
      case: 'NOM',
      template: '{DET} {WORD} ist groß.',
      translations: {
        ru: 'Пёс большой.',
        en: 'The dog is big.',
      },
    },
    {
      id: 'akk',
      case: 'AKK',
      template: 'Ich sehe {DET} {WORD}.',
      translations: {
        ru: 'Я вижу пса.',
        en: 'I see the dog.',
      },
    },
    {
      id: 'dat',
      case: 'DAT',
      template: 'Ich helfe {DET} {WORD}.',
      translations: {
        ru: 'Я помогаю псу.',
        en: 'I help the dog.',
      },
    },
    {
      id: 'gen',
      case: 'GEN',
      template: 'Wegen {DET} {WORD} bleibe ich zu Hause.',
      translations: {
        ru: 'Из-за пса я остаюсь дома.',
        en: 'Because of the dog, I stay at home.',
      },
    },
  ];

  return generateSentences(noun, determinerRules, templates);
}
