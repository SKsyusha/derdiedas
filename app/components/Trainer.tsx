'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Spin, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Word, TrainingSettings, SessionStats, Article, Language } from '../types';
import { builtInDictionaries, getArticleByCase } from '../dictionaries';
import SettingsDrawer from './SettingsDrawer';
import UserDictionaryDrawer from './UserDictionaryDrawer';
import TrainerHeader from './TrainerHeader';
import WordDisplay from './WordDisplay';
import InputSection from './InputSection';
import StatsCard from './StatsCard';
import ProgressBar from './ProgressBar';
import { useWordTraining } from '../hooks/useWordTraining';
import { getCookie, setCookie } from '../utils/cookies';

const { Text } = Typography;

const SETTINGS_COOKIE_NAME = 'training_settings';

const defaultSettings: TrainingSettings = {
  mode: 'noun-only',
  level: ['A1'],
  cases: ['nominativ'],
  usePronouns: false,
  enabledDictionaries: ['A1'],
  language: 'Russian',
  topics: [],
  articleType: 'definite',
  pronounType: 'none',
  showTranslation: true,
  dictionaryType: 'default',
};

function getInitialSettings(): TrainingSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }
  
  const savedSettings = getCookie(SETTINGS_COOKIE_NAME);
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings) as Partial<TrainingSettings>;
      return {
        ...defaultSettings,
        ...parsed,
        // Ensure arrays are properly set
        level: parsed.level || defaultSettings.level,
        cases: parsed.cases || defaultSettings.cases,
        topics: parsed.topics || defaultSettings.topics,
        enabledDictionaries: parsed.enabledDictionaries || defaultSettings.enabledDictionaries,
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
  const [newWord, setNewWord] = useState({ noun: '', article: 'der' as Article, translation: '' });
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasInitializedRef = useRef<boolean>(false);
  const getNextWordRef = useRef<(() => void) | undefined>(undefined);
  const prevFiltersRef = useRef<string>('');
  const settingsLoadedFromCookieRef = useRef<boolean>(false);

  // Get all enabled words
  const getEnabledWords = useCallback((): Word[] => {
    const words: Word[] = [];
    
    if (settings.dictionaryType === 'default') {
      settings.enabledDictionaries.forEach((dictId) => {
        if (dictId === 'A1' && builtInDictionaries.A1) {
          const levelWords = builtInDictionaries.A1;
          const filteredWords = levelWords.filter((w: Word) => {
            const levelMatch = !settings.level.length || settings.level.includes(w.level || 'A1');
            const topicMatch = !settings.topics.length || (w.topic && settings.topics.includes(w.topic));
            return levelMatch && topicMatch;
          });
          words.push(...filteredWords);
        }
      });
    } else {
      const enabledDictIds = settings.enabledDictionaries.length > 0 
        ? settings.enabledDictionaries 
        : userDictionaries.map(d => d.id);
      
      userDictionaries.forEach((dict) => {
        if (enabledDictIds.includes(dict.id)) {
          const filteredWords = dict.words.filter((w) => {
            const topicMatch = !settings.topics.length || (w.topic && settings.topics.includes(w.topic));
            return topicMatch;
          });
          words.push(...filteredWords);
        }
      });
    }

    return words;
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

  // Получение всех слов из выбранных топиков (без фильтрации по level)
  const getAllWordsInTopics = useCallback((): Word[] => {
    const words: Word[] = [];
    
    if (settings.dictionaryType === 'default') {
      settings.enabledDictionaries.forEach((dictId) => {
        if (dictId === 'A1' && builtInDictionaries.A1) {
          const levelWords = builtInDictionaries.A1;
          const topicWords = levelWords.filter((w: Word) => 
            w.topic && settings.topics.includes(w.topic)
          );
          words.push(...topicWords);
        }
      });
    } else {
      const enabledDictIds = settings.enabledDictionaries.length > 0 
        ? settings.enabledDictionaries 
        : userDictionaries.map(d => d.id);
      
      userDictionaries.forEach((dict) => {
        if (enabledDictIds.includes(dict.id)) {
          const topicWords = dict.words.filter((w) => 
            w.topic && settings.topics.includes(w.topic)
          );
          words.push(...topicWords);
        }
      });
    }
    
    return words;
  }, [settings.topics, settings.dictionaryType, settings.enabledDictionaries, userDictionaries]);

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

  // Mark component as mounted (client-side only)
  useEffect(() => {
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

  // Create a stable string representation of all settings except language
  const currentFiltersString = useMemo(() => {
    return JSON.stringify({
      mode: settings.mode,
      level: settings.level,
      cases: settings.cases,
      usePronouns: settings.usePronouns,
      enabledDictionaries: settings.enabledDictionaries,
      topics: settings.topics,
      articleType: settings.articleType,
      pronounType: settings.pronounType,
      showTranslation: settings.showTranslation,
      dictionaryType: settings.dictionaryType,
    });
  }, [settings.mode, settings.level, settings.cases, settings.usePronouns, settings.enabledDictionaries, settings.topics, settings.articleType, settings.pronounType, settings.showTranslation, settings.dictionaryType]);

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
  const checkAnswer = () => {
    const isCorrect = checkAnswerBase();
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
    } else {
      return word.translation_ru || word.translation;
    }
  };

  const correctAnswer = useMemo(() => {
    if (!currentWord) return '';
    
    if (settings.mode === 'sentence' && currentSentence) {
      return getArticleByCase(currentWord.article, currentCase, settings.articleType);
    }
    
    if (settings.articleType === 'indefinite') {
      return currentWord.article === 'der' ? 'ein' : currentWord.article === 'die' ? 'eine' : 'ein';
    }
    
    return currentWord.article;
  }, [currentWord, settings.mode, settings.articleType, currentSentence, currentCase]);

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
            <h2 className="text-xl sm:text-2xl font-bold mb-4">{t('trainer.noWordsAvailable')}</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4">{t('trainer.enableDictionary')}</p>
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
          newWord={newWord}
          setNewWord={setNewWord}
          onDictionaryCreated={(dictId) => {
            if (settings.dictionaryType === 'user' && !settings.enabledDictionaries.includes(dictId)) {
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
    <div className="min-h-screen bg-white px-4 py-2 sm:px-6 sm:py-4">
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
              className="training-block sm:shadow-md sm:rounded-2xl sm:border sm:border-gray-200 sm:bg-white"
              style={{ 
                marginTop: showUserDict ? '16px' : '0', 
                marginBottom: '16px',
                padding: '0'
              }}
            >
              <div className="sm:p-6 training-block-inner">
                {isLoading ? (
                  <div className="text-center py-8 sm:py-12">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600 text-sm sm:text-base">{t('trainer.loading')}</p>
                  </div>
                ) : currentWord ? (
                  <div className="text-center mb-6 sm:mb-8">
                    <WordDisplay
                      word={currentWord}
                      mode={settings.mode}
                      sentence={currentSentence}
                      correctAnswer={correctAnswer}
                      feedback={feedback}
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
                      disabled={!userInput}
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
        newWord={newWord}
        setNewWord={setNewWord}
        onDictionaryCreated={(dictId) => {
          if (settings.dictionaryType === 'user' && !settings.enabledDictionaries.includes(dictId)) {
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
