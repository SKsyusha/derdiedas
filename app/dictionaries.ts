import { Word, Level } from './types';

export const builtInDictionaries: Record<Level, Word[]> = {
  A1: [
    { noun: 'Haus', article: 'das', translation: 'дом', level: 'A1' },
    { noun: 'Tisch', article: 'der', translation: 'стол', level: 'A1' },
    { noun: 'Frau', article: 'die', translation: 'женщина', level: 'A1' },
    { noun: 'Mann', article: 'der', translation: 'мужчина', level: 'A1' },
    { noun: 'Kind', article: 'das', translation: 'ребенок', level: 'A1' },
    { noun: 'Buch', article: 'das', translation: 'книга', level: 'A1' },
    { noun: 'Stuhl', article: 'der', translation: 'стул', level: 'A1' },
    { noun: 'Tür', article: 'die', translation: 'дверь', level: 'A1' },
    { noun: 'Fenster', article: 'das', translation: 'окно', level: 'A1' },
    { noun: 'Auto', article: 'das', translation: 'машина', level: 'A1' },
    { noun: 'Katze', article: 'die', translation: 'кошка', level: 'A1' },
    { noun: 'Hund', article: 'der', translation: 'собака', level: 'A1' },
    { noun: 'Wasser', article: 'das', translation: 'вода', level: 'A1' },
    { noun: 'Brot', article: 'das', translation: 'хлеб', level: 'A1' },
    { noun: 'Milch', article: 'die', translation: 'молоко', level: 'A1' },
    { noun: 'Apfel', article: 'der', translation: 'яблоко', level: 'A1' },
    { noun: 'Schule', article: 'die', translation: 'школа', level: 'A1' },
    { noun: 'Stadt', article: 'die', translation: 'город', level: 'A1' },
    { noun: 'Land', article: 'das', translation: 'страна', level: 'A1' },
    { noun: 'Hand', article: 'die', translation: 'рука', level: 'A1' },
  ],
  A2: [
    { noun: 'Gebäude', article: 'das', translation: 'здание', level: 'A2' },
    { noun: 'Universität', article: 'die', translation: 'университет', level: 'A2' },
    { noun: 'Professor', article: 'der', translation: 'профессор', level: 'A2' },
    { noun: 'Student', article: 'der', translation: 'студент', level: 'A2' },
    { noun: 'Bibliothek', article: 'die', translation: 'библиотека', level: 'A2' },
    { noun: 'Restaurant', article: 'das', translation: 'ресторан', level: 'A2' },
    { noun: 'Kaffee', article: 'der', translation: 'кофе', level: 'A2' },
    { noun: 'Zeitung', article: 'die', translation: 'газета', level: 'A2' },
    { noun: 'Computer', article: 'der', translation: 'компьютер', level: 'A2' },
    { noun: 'Telefon', article: 'das', translation: 'телефон', level: 'A2' },
    { noun: 'Problem', article: 'das', translation: 'проблема', level: 'A2' },
    { noun: 'Lösung', article: 'die', translation: 'решение', level: 'A2' },
    { noun: 'Frage', article: 'die', translation: 'вопрос', level: 'A2' },
    { noun: 'Antwort', article: 'die', translation: 'ответ', level: 'A2' },
    { noun: 'Woche', article: 'die', translation: 'неделя', level: 'A2' },
    { noun: 'Monat', article: 'der', translation: 'месяц', level: 'A2' },
    { noun: 'Jahr', article: 'das', translation: 'год', level: 'A2' },
    { noun: 'Freund', article: 'der', translation: 'друг', level: 'A2' },
    { noun: 'Freundin', article: 'die', translation: 'подруга', level: 'A2' },
    { noun: 'Geschenk', article: 'das', translation: 'подарок', level: 'A2' },
  ],
  B1: [
    { noun: 'Verwaltung', article: 'die', translation: 'администрация', level: 'B1' },
    { noun: 'Entscheidung', article: 'die', translation: 'решение', level: 'B1' },
    { noun: 'Verantwortung', article: 'die', translation: 'ответственность', level: 'B1' },
    { noun: 'Vereinbarung', article: 'die', translation: 'соглашение', level: 'B1' },
    { noun: 'Verhältnis', article: 'das', translation: 'отношение', level: 'B1' },
    { noun: 'Verständnis', article: 'das', translation: 'понимание', level: 'B1' },
    { noun: 'Vorschlag', article: 'der', translation: 'предложение', level: 'B1' },
    { noun: 'Vorteil', article: 'der', translation: 'преимущество', level: 'B1' },
    { noun: 'Nachteil', article: 'der', translation: 'недостаток', level: 'B1' },
    { noun: 'Zusammenhang', article: 'der', translation: 'связь', level: 'B1' },
    { noun: 'Zustand', article: 'der', translation: 'состояние', level: 'B1' },
    { noun: 'Zeugnis', article: 'das', translation: 'свидетельство', level: 'B1' },
    { noun: 'Zeitpunkt', article: 'der', translation: 'момент времени', level: 'B1' },
    { noun: 'Zeitraum', article: 'der', translation: 'период', level: 'B1' },
    { noun: 'Zweck', article: 'der', translation: 'цель', level: 'B1' },
  ],
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
