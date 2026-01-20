'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Word, TrainingSettings, SessionStats, Language } from '../types';
import { getDeterminerByCase, DEFAULT_DICTIONARY_ID } from '../dictionaries';
import { getEnabledWords as getEnabledWordsFromDataset, getWordsInTopics } from '../utils/dataset';
import SettingsDrawer from './SettingsDrawer';
import UserDictionaryDrawer from './UserDictionaryDrawer';
import TrainerHeader from './TrainerHeader';
import WordDisplay from './WordDisplay';
import InputSection from './InputSection';
import StatsCard from './StatsCard';
import ProgressBar from './ProgressBar';
import { useWordTraining } from '../hooks/useWordTraining';
import { getCookie, setCookie } from '../utils/cookies';

const SETTINGS_COOKIE_NAME = 'training_settings';

const defaultSettings: TrainingSettings = {
  mode: 'noun-only',
  cases: ['nominativ'],
  enabledDictionaries: [DEFAULT_DICTIONARY_ID],
  language: 'Russian',
  topics: [],
  articleType: 'definite',
  pronounType: 'none',
  showTranslation: true,
};

function getInitialSettings(): TrainingSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  
  const savedSettings = getCookie(SETTINGS_COOKIE_NAME);
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings) as Omit<Partial<TrainingSettings>, 'pronounType'> & {
        pronounType?: unknown;
      };

      // If pronounType is missing/invalid (including legacy values), fall back to default
      const safePronounType: TrainingSettings['pronounType'] =
        parsed.pronounType === 'none' ||
        parsed.pronounType === 'possessive' ||
        parsed.pronounType === 'demonstrative'
          ? parsed.pronounType
          : defaultSettings.pronounType;

      return {
        ...defaultSettings,
        ...parsed,
        // Ensure arrays are properly set
        cases: parsed.cases || defaultSettings.cases,
        topics: parsed.topics || defaultSettings.topics,
        enabledDictionaries: parsed.enabledDictionaries || defaultSettings.enabledDictionaries,
        pronounType: safePronounType,
      };
    } catch (error) {
      console.error('Failed to parse settings from cookie:', error);
      return defaultSettings;
    }
  }
  
  return defaultSettings;
}

export default function Trainer() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<TrainingSettings>(getInitialSettings);

  const [userDictionaries, setUserDictionaries] = useState<Array<{ id: string; name: string; words: Word[]; enabled: boolean }>>([]);
  const [stats, setStats] = useState<SessionStats>({
    total: 0,
    correct: 0,
    incorrect: 0,
    streak: 0,
    bestStreak: 0,
  });
  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showUserDict, setShowUserDict] = useState(false);
  const [drawerSize] = useState(400);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasInitializedRef = useRef<boolean>(false);
  const getNextWordRef = useRef<(() => void) | undefined>(undefined);
  const prevFiltersRef = useRef<string>('');
  const settingsLoadedFromCookieRef = useRef<boolean>(false);

  const selectCustomDictionaryAfterImport = useCallback(
    (nextUserDictionaries: Array<{ id: string; name: string; words: Word[]; enabled: boolean }>) => {
      const userDictIds = nextUserDictionaries.map((d) => d.id);
      if (userDictIds.length === 0) return;
      setSettings((prev) => ({
        ...prev,
        enabledDictionaries: userDictIds,
        // Imported words currently have no topics, so topic filtering would hide them.
        topics: prev.topics.length > 0 ? [] : prev.topics,
      }));
    },
    []
  );

  // Get all enabled words with deduplication using Set
  const getEnabledWords = useCallback((): Word[] => {
    return getEnabledWordsFromDataset({
      enabledDictionaries: settings.enabledDictionaries,
      topics: settings.topics,
      userDictionaries,
    });
  }, [settings, userDictionaries]);

  // Use word training hook
  const {
    currentWord,
    currentSentence,
    currentCase,
    userInput,
    feedback,
    isLoading,
    inputRef,
    getNextWord,
    handleInput,
    checkAnswer: checkAnswerBase,
  } = useWordTraining({ settings, getEnabledWords, isMobile });

  // Keep ref updated with latest getNextWord
  useEffect(() => {
    getNextWordRef.current = getNextWord;
  }, [getNextWord]);

  // Получение всех слов из выбранных топиков с дедупликацией
  const getAllWordsInTopics = useCallback((): Word[] => {
    return getWordsInTopics({
      enabledDictionaries: settings.enabledDictionaries,
      topics: settings.topics,
      userDictionaries,
    });
  }, [settings.topics, settings.enabledDictionaries, userDictionaries]);

  // Расчет прогресса по топикам или всем словам
  const topicProgress = useMemo(() => {
    let wordsToCheck: Word[];
    
    if (settings.topics.length === 0) {
      wordsToCheck = getEnabledWords();
    } else {
      wordsToCheck = getAllWordsInTopics();
    }
    
    const totalWords = wordsToCheck.length;
    if (totalWords === 0) return null;

    const learnedCount = wordsToCheck.filter(w => 
      learnedWords.has(`${w.topic || 'all'}-${w.noun}`)
    ).length;

    const percentage = Math.round((learnedCount / totalWords) * 100);
    
    return {
      learned: learnedCount,
      total: totalWords,
      percentage,
    };
  }, [settings.topics, learnedWords, getAllWordsInTopics, getEnabledWords]);

  // Load user dictionaries from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedDictionaries = localStorage.getItem('userDictionaries');
      if (savedDictionaries) {
        const parsed = JSON.parse(savedDictionaries);
        setUserDictionaries(parsed);
      }
    } catch (error) {
      console.error('Failed to load user dictionaries from localStorage:', error);
    }
    
    setIsMounted(true);
    settingsLoadedFromCookieRef.current = true; // Settings already loaded in getInitialSettings
  }, []);

  // Detect mobile device
  useEffect(() => {
    if (!isMounted) return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMounted]);

  // Sync translation language with UI language on mount
  useEffect(() => {
    if (!isMounted) return;
    const translationLanguage: Language = i18n.language === 'ru' ? 'Russian' : 'English';
    setSettings((prev) => {
      if (prev.language !== translationLanguage) {
        return { ...prev, language: translationLanguage };
      }
      return prev;
    });
  }, [isMounted]);

  // Save settings to cookies whenever they change (but not on initial load)
  useEffect(() => {
    if (!isMounted || !settingsLoadedFromCookieRef.current) return;
    setCookie(SETTINGS_COOKIE_NAME, JSON.stringify(settings));
  }, [settings, isMounted]);

  // Save user dictionaries to localStorage whenever they change
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem('userDictionaries', JSON.stringify(userDictionaries));
    } catch (error) {
      console.error('Failed to save user dictionaries to localStorage:', error);
    }
  }, [userDictionaries, isMounted]);

  // Create a stable string representation of all settings except language
  const currentFiltersString = useMemo(() => {
    return JSON.stringify({
      mode: settings.mode,
      cases: settings.cases,
      enabledDictionaries: settings.enabledDictionaries,
      topics: settings.topics,
      articleType: settings.articleType,
      pronounType: settings.pronounType,
    });
  }, [settings.mode, settings.cases, settings.enabledDictionaries, settings.topics, settings.articleType, settings.pronounType]);

  // Initialize first word and handle filter changes (but not when only language changes)
  useEffect(() => {
    if (!isMounted) return;
    
    // Initialize on first mount
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevFiltersRef.current = currentFiltersString;
      if (getNextWordRef.current) {
        getNextWordRef.current();
      }
      return;
    }
    
    // If filters changed (not just language), update the current word
    if (prevFiltersRef.current !== currentFiltersString) {
      if (getNextWordRef.current) {
        getNextWordRef.current();
      }
    }
    
    // Update the ref with current filters
    prevFiltersRef.current = currentFiltersString;
  }, [isMounted, currentFiltersString]);

  // Check answer with stats tracking
  const checkAnswer = (source?: 'enter' | 'click') => {
    const isCorrect = checkAnswerBase(source);
    if (isCorrect === undefined) return;

    setStats((prev) => {
      const newStats = {
        total: prev.total + 1,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1,
        streak: isCorrect ? prev.streak + 1 : 0,
        bestStreak: isCorrect ? Math.max(prev.bestStreak, prev.streak + 1) : prev.bestStreak,
      };
      return newStats;
    });

    // Отслеживаем изученные слова для прогресс-бара
    if (isCorrect && currentWord) {
      const key = currentWord.topic 
        ? `${currentWord.topic}-${currentWord.noun}` 
        : `all-${currentWord.noun}`;
      setLearnedWords((prev) => new Set([...prev, key]));
    }
  };

  // Получаем правильный перевод в зависимости от выбранного языка
  const getTranslation = (word: Word): string | undefined => {
    if (settings.language === 'English') {
      return word.translation_en || word.translation;
    } else if (settings.language === 'Ukrainian') {
      return word.translation_uk || word.translation;
    } else {
      return word.translation_ru || word.translation;
    }
  };

  const correctAnswer = useMemo(() => {
    if (!currentWord) return '';
    
    return getDeterminerByCase(
      currentWord.article,
      currentCase,
      settings.articleType,
      settings.pronounType
    );
  }, [currentWord, settings.articleType, settings.pronounType, currentCase]);

  const currentTranslation = currentWord ? getTranslation(currentWord) : undefined;

  // Don't render content until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  if (!currentWord && !isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>{t('trainer.noWordsAvailable')}</h2>
            <p className="text-sm sm:text-base mb-4" style={{ color: 'var(--gray-text)' }}>{t('trainer.enableDictionary')}</p>
            <Button
              type="primary"
              size="large"
              onClick={() => setShowSettings(true)}
              className="w-full sm:w-auto"
              style={{ 
                backgroundColor: '#8b5cf6', 
                borderColor: '#8b5cf6',
                color: '#ffffff'
              }}
            >
              {t('trainer.openSettings')}
            </Button>
          </div>
        </div>
        <SettingsDrawer
          open={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          setSettings={setSettings}
          drawerSize={drawerSize}
          userDictionaries={userDictionaries}
          setUserDictionaries={setUserDictionaries}
        />
        <UserDictionaryDrawer
          open={showUserDict}
          onClose={() => setShowUserDict(false)}
          userDictionaries={userDictionaries}
          setUserDictionaries={setUserDictionaries}
          onAfterImport={selectCustomDictionaryAfterImport}
          onDictionaryCreated={(dictId) => {
            if (!settings.enabledDictionaries.includes(dictId)) {
              setSettings({
                ...settings,
                enabledDictionaries: [...settings.enabledDictionaries, dictId],
              });
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen px-4 py-2 sm:px-6 sm:py-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto">
        <TrainerHeader
          isMobile={isMobile}
          onSettingsClick={() => setShowSettings(!showSettings)}
          onDictionaryClick={() => setShowUserDict(true)}
          onLanguageChange={(language) => setSettings((prev) => ({ ...prev, language }))}
        />

        <div>
          <div className="max-w-4xl mx-auto">
            {topicProgress && (
              <ProgressBar
                learned={topicProgress.learned}
                total={topicProgress.total}
                percentage={topicProgress.percentage}
                hasTopics={settings.topics.length > 0}
              />
            )}

            {/* Training Area */}
            <div 
              className="training-block sm:shadow-md sm:rounded-2xl sm:border"
              style={{ 
                marginTop: showUserDict ? '16px' : '0', 
                marginBottom: '16px',
                padding: '0',
                borderColor: 'var(--card-border)',
                background: 'var(--card-bg)'
              }}
            >
              <div className="sm:p-6 training-block-inner">
                {isLoading ? (
                  <div className="text-center py-8 sm:py-12">
                    <Spin size="large" />
                    <p className="mt-4 text-sm sm:text-base" style={{ color: 'var(--gray-text)' }}>{t('trainer.loading')}</p>
                  </div>
                ) : currentWord ? (
                  <div className="text-center mb-6 sm:mb-8">
                    <WordDisplay
                      word={currentWord}
                      mode={settings.mode}
                      sentence={currentSentence}
                      correctAnswer={correctAnswer}
                      userAnswer={userInput}
                      feedback={feedback === 'invalid' ? null : feedback}
                      showTranslation={settings.showTranslation}
                      translation={currentTranslation}
                    />

                    <InputSection
                      inputRef={inputRef}
                      userInput={userInput}
                      onInputChange={handleInput}
                      onCheck={checkAnswer}
                      onNextWord={getNextWord}
                      feedback={feedback}
                      isMobile={isMobile}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <StatsCard stats={stats} />
          </div>
        </div>
      </div>

      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        setSettings={setSettings}
        drawerSize={drawerSize}
        userDictionaries={userDictionaries}
        setUserDictionaries={setUserDictionaries}
      />

      <UserDictionaryDrawer
        open={showUserDict}
        onClose={() => setShowUserDict(false)}
        userDictionaries={userDictionaries}
        setUserDictionaries={setUserDictionaries}
        onAfterImport={selectCustomDictionaryAfterImport}
        onDictionaryCreated={(dictId) => {
          if (!settings.enabledDictionaries.includes(dictId)) {
            setSettings({
              ...settings,
              enabledDictionaries: [...settings.enabledDictionaries, dictId],
            });
          }
        }}
      />
    </div>
  );
}
