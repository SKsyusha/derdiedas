// Test file for sentence generator
import { generateSentences, exampleUsage } from './sentence-generator';

// Run example
const results = exampleUsage();

console.log('Generated sentences:');
console.log(JSON.stringify(results, null, 2));

// Test with different noun
import type { NounData, DeterminerRules, SentenceTemplate } from './sentence-generator';

const testNoun: NounData = {
  word: 'Frau',
  gender: 'f',
  plural: 'Frauen',
  genitive_sg: 'Frau',
  translations: {
    ru: ['женщина'],
    en: ['woman'],
  },
};

const testDeterminerRules: DeterminerRules = {
  def: {
    NOM: { m: 'der', f: 'die', n: 'das', pl: 'die' },
    AKK: { m: 'den', f: 'die', n: 'das', pl: 'die' },
    DAT: { m: 'dem', f: 'der', n: 'dem', pl: 'den' },
    GEN: { m: 'des', f: 'der', n: 'des', pl: 'der' },
  },
};

const testTemplates: SentenceTemplate[] = [
  {
    id: 'nom',
    case: 'NOM',
    template: '{DET} {WORD} ist schön.',
    translations: {
      ru: 'Женщина красивая.',
      en: 'The woman is beautiful.',
    },
  },
  {
    id: 'akk',
    case: 'AKK',
    template: 'Ich sehe {DET} {WORD}.',
    translations: {
      ru: 'Я вижу женщину.',
      en: 'I see the woman.',
    },
  },
];

const testResults = generateSentences(testNoun, testDeterminerRules, testTemplates);
console.log('\nTest with Frau:');
console.log(JSON.stringify(testResults, null, 2));
