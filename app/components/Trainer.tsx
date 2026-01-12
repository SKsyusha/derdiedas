'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button, Input, Typography, Spin, Progress, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { SettingOutlined, BookOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Word, TrainingSettings, SessionStats, Case, Article, Language } from '../types';
import { builtInDictionaries, generateSentence, getArticleByCase } from '../dictionaries';
import SettingsDrawer from './SettingsDrawer';
import UserDictionaryDrawer from './UserDictionaryDrawer';
import Logo from './Logo';

const { Title, Text } = Typography;

export default function Trainer() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<TrainingSettings>({
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
  });

  const [userDictionaries, setUserDictionaries] = useState<Array<{ id: string; name: string; words: Word[]; enabled: boolean }>>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentSentence, setCurrentSentence] = useState<string>('');
  const [currentCase, setCurrentCase] = useState<Case>('nominativ');
  const [userInput, setUserInput] = useState<string>('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
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
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedWordRef = useRef<boolean>(false);

  // Get all enabled words
  const getEnabledWords = useCallback((): Word[] => {
    const words: Word[] = [];
    
    if (settings.dictionaryType === 'default') {
      // Add built-in dictionary words
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
      // Add user dictionary words
      // Если нет enabledDictionaries для user, используем все доступные user dictionaries
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

  // Get next word
  const getNextWord = useCallback(() => {
    // Очищаем таймер и сбрасываем флаг обработки при переходе к новому слову
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isProcessingRef.current = false;

    const words = getEnabledWords();
    if (words.length === 0) {
      setCurrentWord(null);
      setCurrentSentence('');
      setIsLoading(false);
      hasLoadedWordRef.current = false;
      return;
    }

    // Загружаем слово сразу без задержки и без показа спиннера
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);
    hasLoadedWordRef.current = true;

    if (settings.mode === 'sentence' && settings.cases.length > 0) {
      const randomCase = settings.cases[Math.floor(Math.random() * settings.cases.length)];
      setCurrentCase(randomCase);
      const sentence = generateSentence(randomWord, randomCase, settings.usePronouns);
      setCurrentSentence(sentence);
    } else {
      setCurrentSentence('');
      setCurrentCase('nominativ');
    }

    setUserInput('');
    setFeedback(null);
    setIsLoading(false);
    
    // Сохраняем фокус после загрузки нового слова
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [settings, getEnabledWords]);

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
      // Если топики не выбраны, показываем прогресс по всем словам
      wordsToCheck = getEnabledWords();
    } else {
      // Если топики выбраны, показываем прогресс по выбранным топикам
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
  }, [isMounted]); // Only run after mount

  // Initialize first word only after component has mounted (client-side)
  useEffect(() => {
    if (!isMounted) return;
    getNextWord();
  }, [getNextWord, isMounted]);

  // Очистка таймера при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle input
  const handleInput = useCallback((value: string) => {
    const trimmedValue = value.toLowerCase().trim();
    setUserInput(trimmedValue);
  }, []);

  // Check answer
  const checkAnswer = () => {
    if (!currentWord) return;

    // Если есть активный таймер (ожидание после правильного ответа), сразу переходим к следующему слову
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setUserInput('');
      setFeedback(null);
      getNextWord();
      isProcessingRef.current = false;
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return;
    }

    // Если поле пустое, просто переключаем на следующее слово
    if (!userInput || userInput.trim() === '') {
      if (!isProcessingRef.current) {
        getNextWord();
      }
      return;
    }

    // Блокируем повторные вызовы во время обработки
    if (isProcessingRef.current) return;

    // Устанавливаем флаг обработки
    isProcessingRef.current = true;

    // Очищаем предыдущий таймер, если он существует
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    let correctAnswer: string;
    if (settings.mode === 'sentence' && currentSentence) {
      correctAnswer = getArticleByCase(currentWord.article, currentCase, settings.articleType);
    } else {
      // For noun-only mode, return ein/eine based on articleType
      if (settings.articleType === 'indefinite') {
        correctAnswer = currentWord.article === 'der' ? 'ein' : currentWord.article === 'die' ? 'eine' : 'ein';
      } else {
        correctAnswer = currentWord.article;
      }
    }

    const isCorrect = userInput === correctAnswer;
    
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
    if (isCorrect) {
      const key = currentWord.topic 
        ? `${currentWord.topic}-${currentWord.noun}` 
        : `all-${currentWord.noun}`;
      setLearnedWords((prev) => new Set([...prev, key]));
    }

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      // Автоматически переходим к следующему слову с задержкой
      timeoutRef.current = setTimeout(() => {
        setUserInput('');
        setFeedback(null);
        getNextWord();
        // Сбрасываем флаг обработки после перехода к следующему слову
        isProcessingRef.current = false;
        // Сохраняем фокус после перехода к следующему слову
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }, 1500);
    } else {
      // Очищаем поле ввода при неправильном ответе, чтобы можно было ввести новый ответ
      setUserInput('');
      // Сбрасываем флаг обработки
      isProcessingRef.current = false;
      // Сохраняем фокус
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };



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
        {/* Settings Drawer - должен рендериться всегда */}
        <SettingsDrawer
          open={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          setSettings={setSettings}
          drawerSize={drawerSize}
          userDictionaries={userDictionaries}
          setUserDictionaries={setUserDictionaries}
        />
        {/* User Dictionary Drawer */}
        <UserDictionaryDrawer
          open={showUserDict}
          onClose={() => setShowUserDict(false)}
          userDictionaries={userDictionaries}
          setUserDictionaries={setUserDictionaries}
          newWord={newWord}
          setNewWord={setNewWord}
          onDictionaryCreated={(dictId) => {
            // Автоматически добавляем созданный словарь в enabledDictionaries если выбран тип "user"
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

  // Получаем правильный перевод в зависимости от выбранного языка
  const getTranslation = (word: Word): string | undefined => {
    if (settings.language === 'English') {
      return word.translation_en || word.translation;
    } else {
      return word.translation_ru || word.translation;
    }
  };

  const correctAnswer = currentWord
    ? (settings.mode === 'sentence' && currentSentence
      ? getArticleByCase(currentWord.article, currentCase, settings.articleType)
      : settings.articleType === 'indefinite'
      ? (currentWord.article === 'der' ? 'ein' : currentWord.article === 'die' ? 'eine' : 'ein')
      : currentWord.article)
    : '';

  const currentTranslation = currentWord ? getTranslation(currentWord) : undefined;

  return (
    <div className="min-h-screen bg-white px-4 py-2 sm:px-6 sm:py-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6 flex flex-row sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <Logo size="large" className="hidden sm:flex" />
          <Logo size="medium" className="sm:hidden" hideTrainer />
          <div className="flex flex-wrap gap-2 justify-end">
            {/* Language selector - Dropdown with text on desktop, icon on mobile */}
            <Dropdown
              menu={{
                items: [
                  { key: 'ru', label: t('trainer.russian') },
                  { key: 'en', label: t('trainer.english') },
                ] as MenuProps['items'],
                onClick: ({ key }) => {
                  i18n.changeLanguage(key);
                  const translationLanguage: Language = key === 'ru' ? 'Russian' : 'English';
                  setSettings((prev) => ({ ...prev, language: translationLanguage }));
                },
                selectedKeys: [i18n.language],
              }}
              trigger={['click']}
            >
              <Button
                icon={<GlobalOutlined />}
                style={isMobile ? { width: 40, height: 40, padding: 0 } : undefined}
              >
                <span className="hidden sm:inline">
                  {i18n.language === 'ru' ? t('trainer.russian') : t('trainer.english')}
                </span>
              </Button>
            </Dropdown>
            <Button
              icon={<BookOutlined />}
              onClick={() => setShowUserDict(true)}
              style={isMobile ? { width: 40, height: 40, padding: 0 } : undefined}
            >
              <span className="hidden sm:inline">{t('trainer.myDictionary')}</span>
            </Button>
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => setShowSettings(!showSettings)}
              style={isMobile ? { width: 40, height: 40, padding: 0 } : undefined}
            >
              <span className="hidden sm:inline">{t('trainer.settings')}</span>
            </Button>
          </div>
        </div>

        <div>
          {/* Main Content Area */}
          <div className="max-w-4xl mx-auto">
            {topicProgress && (
              <div className="mt-2 sm:mt-4" style={{ marginBottom: '16px' }}>
                <div className="mb-2">
                  <Text strong className="text-xs sm:text-sm">
                    {settings.topics.length === 0
                      ? t('trainer.allWordsProgress', { 
                          learned: topicProgress.learned, 
                          total: topicProgress.total 
                        })
                      : t('trainer.topicProgress', { 
                          learned: topicProgress.learned, 
                          total: topicProgress.total 
                        })
                    }
                  </Text>
                </div>
                <Progress 
                  percent={topicProgress.percentage} 
                  strokeColor={{
                    '0%': '#8b5cf6',
                    '100%': '#6366f1',
                  }}
                  showInfo={true}
                />
              </div>
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
                {settings.mode === 'sentence' && currentSentence ? (
                  <div className="text-lg sm:text-2xl mb-4 sm:mb-6 text-gray-900 px-4 sm:px-2">
                    {feedback === 'correct' ? (
                      <div className="text-green-700">
                        {currentSentence.replace('___', correctAnswer)}
                      </div>
                    ) : feedback === 'incorrect' ? (
                      <div className="text-red-700">
                        {currentSentence.replace('___', correctAnswer)}
                      </div>
                    ) : (
                      currentSentence.split('___').map((part, idx, arr) => (
                        <span key={idx}>
                          {part}
                          {idx < arr.length - 1 && (
                            <span className="inline-block w-16 sm:w-24 border-b-2 border-purple-500 mx-1 sm:mx-2" />
                          )}
                        </span>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="text-xl sm:text-3xl mb-4 sm:mb-6 text-gray-900 px-4 sm:px-2">
                    {feedback === 'correct' ? (
                      <div className="text-green-700">
                        {correctAnswer} {currentWord.noun}
                        {settings.showTranslation && currentTranslation && (
                          <span className="text-gray-500 text-base sm:text-2xl ml-1 sm:ml-2 block sm:inline">
                            ({currentTranslation})
                          </span>
                        )}
                      </div>
                    ) : feedback === 'incorrect' ? (
                      <div className="text-red-700">
                        {correctAnswer} {currentWord.noun}
                        {settings.showTranslation && currentTranslation && (
                          <span className="text-gray-500 text-base sm:text-2xl ml-1 sm:ml-2 block sm:inline">
                            ({currentTranslation})
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <span className="inline-block w-16 sm:w-24 border-b-2 border-purple-500 mx-1 sm:mx-2" />
                        {currentWord.noun}
                        {settings.showTranslation && currentTranslation && (
                          <span className="text-gray-500 text-base sm:text-2xl ml-1 sm:ml-2 block sm:inline">
                            ({currentTranslation})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="mb-4 sm:px-2">
                  <Input
                    ref={inputRef}
                    size="large"
                    value={userInput}
                    onChange={(e) => handleInput(e.target.value)}
                    onPressEnter={checkAnswer}
                    placeholder={t('trainer.enterArticle')}
                    className={`w-full text-lg sm:text-2xl ${
                      feedback === 'correct'
                        ? 'border-green-500'
                        : feedback === 'incorrect'
                        ? 'border-red-500'
                        : ''
                    }`}
                    style={{
                      fontSize: '1.125rem',
                      height: '52px',
                      textAlign: 'center',
                    }}
                  />
                </div>



                <div className="sm:px-2">
                  <div className="flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-2 w-full">
                    <Button
                      type="primary"
                      onClick={checkAnswer}
                      disabled={!userInput}
                      className="w-full sm:w-auto"
                      style={{
                        backgroundColor: '#8b5cf6',
                        borderColor: '#8b5cf6',
                        color: '#ffffff',
                        paddingLeft: '32px',
                        paddingRight: '32px',
                      }}
                    >
                      {t('trainer.check')}
                    </Button>

                    {/* Кнопка "Следующее слово" для мобильных - всегда видна */}
                    {isMobile && (
                      <Button
                        onClick={getNextWord}
                        className="w-full"
                      >
                        {t('trainer.nextWord')}
                      </Button>
                    )}

                    {/* Кнопка "Следующее слово" для десктопа - только при неправильном ответе */}
                    {!isMobile && feedback === 'incorrect' && (
                      <Button
                        onClick={getNextWord}
                      >
                        {t('trainer.nextWord')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              ) : null}
              </div>
            </div>

            {/* Stats */}
            <div 
              className="stats-block sm:shadow-md sm:rounded-2xl sm:border sm:border-gray-200 sm:bg-white mb-4 sm:mb-6"
              style={{ 
                marginTop: '16px', 
                padding: '0'
              }}
            >
              <div className="sm:p-6 stats-block-inner">
              <Title level={4} className="mb-3 sm:mb-4 text-base sm:text-lg">{t('trainer.sessionStats')}</Title>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{t('trainer.total')}</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.correct}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{t('trainer.correct')}</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.incorrect}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{t('trainer.incorrect')}</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">{t('trainer.accuracy')}</div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.streak}</div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {t('trainer.streak')} ({t('trainer.bestStreak')}: {stats.bestStreak})
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        setSettings={setSettings}
        drawerSize={drawerSize}
        userDictionaries={userDictionaries}
        setUserDictionaries={setUserDictionaries}
      />

      {/* User Dictionary Drawer */}
      <UserDictionaryDrawer
        open={showUserDict}
        onClose={() => setShowUserDict(false)}
        userDictionaries={userDictionaries}
        setUserDictionaries={setUserDictionaries}
        newWord={newWord}
        setNewWord={setNewWord}
        onDictionaryCreated={(dictId) => {
          // Автоматически добавляем созданный словарь в enabledDictionaries если выбран тип "user"
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
