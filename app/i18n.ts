'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ruTranslations from './locales/ru.json';
import enTranslations from './locales/en.json';
import ukTranslations from './locales/uk.json';
import deTranslations from './locales/de.json';

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        ru: {
          translation: ruTranslations,
        },
        en: {
          translation: enTranslations,
        },
        uk: {
          translation: ukTranslations,
        },
        de: {
          translation: deTranslations,
        },
      },
      fallbackLng: 'ru',
      debug: false,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });
}

export default i18n;
