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
import { getCookie, setCookie, removeCookie } from '../utils/cookies';
import { getDictionary } from '../services/userDictionaryService';
import SeoEmptyState from './SeoEmptyState';

const SETTINGS_COOKIE_NAME = 'training_settings';

const defaultSettings: TrainingSettings = {
  mode: 'noun-only',
  cases: ['nominativ'],
  enabledDictionaries: [DEFAULT_DICTIONARY_ID],
  language: 'Russian',
  topics: [],
  determinerType: 'definite',
  showTranslation: true,
};

function getInitialSettings(): TrainingSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  
  const savedSettings = getCookie(SETTINGS_COOKIE_NAME);
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings) as Omit<Partial<TrainingSettings>, 'determinerType'> & {
        determinerType?: unknown;
        // legacy fields (before merge)
        articleType?: unknown;
        pronounType?: unknown;
      };

      const safeDeterminerType: TrainingSettings['determinerType'] = (() => {
        const raw = parsed.determinerType;
        if (raw === 'definite' || raw === 'indefinite' || raw === 'possessive' || raw === 'demonstrative') return raw;
        // legacy: pronounType had priority over articleType
        if (parsed.pronounType === 'possessive' || parsed.pronounType === 'demonstrative') return parsed.pronounType;
        if (parsed.articleType === 'definite' || parsed.articleType === 'indefinite') return parsed.articleType;
        return defaultSettings.determinerType;
      })();

      return {
        ...defaultSettings,
        ...parsed,
        // Ensure arrays are properly set
        cases: parsed.cases || defaultSettings.cases,
        topics: parsed.topics || defaultSettings.topics,
        enabledDictionaries: parsed.enabledDictionaries || defaultSettings.enabledDictionaries,
        determinerType: safeDeterminerType,
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

  const progressKey = useMemo(() => {
    return `training_progress_${JSON.stringify({
      enabledDictionaries: settings.enabledDictionaries,
      topics: settings.topics,
    })}`;
  }, [settings.enabledDictionaries, settings.topics]);

  const statsKey = useMemo(() => {
    return `training_stats_${JSON.stringify({
      mode: settings.mode,
      cases: settings.cases,
      enabledDictionaries: settings.enabledDictionaries,
      topics: settings.topics,
      determinerType: settings.determinerType,
    })}`;
  }, [settings.mode, settings.cases, settings.enabledDictionaries, settings.topics, settings.determinerType]);

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
    resetWordOrder,
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

  const handleResetProgress = useCallback(() => {
    setLearnedWords(new Set());
    setStats({ total: 0, correct: 0, incorrect: 0, streak: 0, bestStreak: 0 });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(progressKey);
        localStorage.removeItem(statsKey);
      } catch (error) {
        console.error('Failed to reset training progress:', error);
      }
    }
    resetWordOrder();
  }, [progressKey, statsKey, resetWordOrder]);

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

  // Load user dictionaries: from DB if we have id in cookie, else from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dbId = getCookie('userDictionaryId');
    if (dbId) {
      getDictionary(dbId)
        .then((data) => {
          setUserDictionaries([
            { id: data.id, name: data.name, words: data.words, enabled: true },
          ]);
        })
        .catch(() => {
          removeCookie('userDictionaryId'); // stale id — dictionary not in DB
          try {
            const saved = localStorage.getItem('userDictionaries');
            if (saved) setUserDictionaries(JSON.parse(saved));
          } catch {}
        })
        .finally(() => setIsMounted(true));
    } else {
      queueMicrotask(() => {
        try {
          const savedDictionaries = localStorage.getItem('userDictionaries');
          if (savedDictionaries) {
            setUserDictionaries(JSON.parse(savedDictionaries));
          }
        } catch (error) {
          console.error('Failed to load user dictionaries from localStorage:', error);
        }
        setIsMounted(true);
      });
    }
    settingsLoadedFromCookieRef.current = true;
  }, []);

  // Load learned progress when filters change or on mount
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(progressKey);
        if (saved) {
          const parsed = JSON.parse(saved) as string[];
          setLearnedWords(new Set(parsed));
        } else {
          setLearnedWords(new Set());
        }
      } catch (error) {
        console.error('Failed to load training progress:', error);
        setLearnedWords(new Set());
      }
    });
  }, [isMounted, progressKey]);

  // Load session stats when filters change or on mount
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(statsKey);
        if (saved) {
          const parsed = JSON.parse(saved) as SessionStats;
          setStats(parsed);
        } else {
          setStats({ total: 0, correct: 0, incorrect: 0, streak: 0, bestStreak: 0 });
        }
      } catch (error) {
        console.error('Failed to load session stats:', error);
        setStats({ total: 0, correct: 0, incorrect: 0, streak: 0, bestStreak: 0 });
      }
    });
  }, [isMounted, statsKey]);

  // Detect mobile device
  useEffect(() => {
    if (!isMounted) return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    queueMicrotask(checkMobile);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMounted]);

  // Sync translation language with UI language on mount
  useEffect(() => {
    if (!isMounted) return;
    const translationLanguage: Language = i18n.language === 'ru' ? 'Russian' : 'English';
    queueMicrotask(() => {
      setSettings((prev) => {
        if (prev.language !== translationLanguage) {
          return { ...prev, language: translationLanguage };
        }
        return prev;
      });
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

  // Save learned progress to localStorage
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    try {
      localStorage.setItem(progressKey, JSON.stringify(Array.from(learnedWords)));
    } catch (error) {
      console.error('Failed to save training progress:', error);
    }
  }, [learnedWords, isMounted, progressKey]);

  // Save session stats to localStorage
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    try {
      localStorage.setItem(statsKey, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save session stats:', error);
    }
  }, [stats, isMounted, statsKey]);

  // Create a stable string representation of all settings except language
  const currentFiltersString = useMemo(() => {
    return JSON.stringify({
      mode: settings.mode,
      cases: settings.cases,
      enabledDictionaries: settings.enabledDictionaries,
      topics: settings.topics,
      determinerType: settings.determinerType,
    });
  }, [settings.mode, settings.cases, settings.enabledDictionaries, settings.topics, settings.determinerType]);

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
      settings.determinerType
    );
  }, [currentWord, settings.determinerType, currentCase]);

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
      <h1 className="sr-only">Der Die Das Trainer - Learn German Articles der, die, das</h1>
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
                onReset={handleResetProgress}
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
                  <div className="py-4 sm:py-6">
                    <SeoEmptyState />
                    <div className="text-center mt-6">
                      <Spin size="large" />
                      <p className="mt-4 text-sm sm:text-base" style={{ color: 'var(--gray-text)' }}>
                        {t('trainer.loading')}
                      </p>
                    </div>
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
