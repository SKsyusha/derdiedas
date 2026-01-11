'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, Input, Space, Select, Typography, Spin } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Word, TrainingSettings, SessionStats, Case, Level, Article } from '../types';
import { builtInDictionaries, generateSentence, getArticleByCase } from '../dictionaries';
import SettingsDrawer from './SettingsDrawer';
import UserDictionaryDrawer from './UserDictionaryDrawer';

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
  const [showSettings, setShowSettings] = useState(false);
  const [showUserDict, setShowUserDict] = useState(false);
  const [drawerSize] = useState(400);
  const [newWord, setNewWord] = useState({ noun: '', article: 'der' as Article, translation: '' });
  const [isLoading, setIsLoading] = useState(false);
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
        if (builtInDictionaries[dictId as Level]) {
          const levelWords = builtInDictionaries[dictId as Level];
          const filteredWords = levelWords.filter((w) => {
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

  // Initialize first word
  useEffect(() => {
    getNextWord();
  }, [getNextWord]);

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
    // Если есть feedback и пользователь начинает вводить, переключаем на новое слово
    if (feedback && value.length > 0) {
      getNextWord();
      // После переключения оставляем только последний введенный символ
      setTimeout(() => {
        const lastChar = value[value.length - 1].toLowerCase();
        setUserInput(lastChar);
      }, 0);
      return;
    }
    const trimmedValue = value.toLowerCase().trim();
    setUserInput(trimmedValue);
  }, [feedback, getNextWord]);

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



  if (!currentWord && !isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{t('trainer.noWordsAvailable')}</h2>
            <p className="text-gray-600 mb-4">{t('trainer.enableDictionary')}</p>
            <Button
              type="primary"
              size="large"
              onClick={() => setShowSettings(true)}
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
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{t('trainer.title')}</h1>
          <div className="flex gap-2">
            <Select
              value={i18n.language}
              onChange={(value) => i18n.changeLanguage(value)}
              style={{ width: 120 }}
              size="large"
              options={[
                { label: t('trainer.russian'), value: 'ru' },
                { label: t('trainer.english'), value: 'en' },
              ]}
            />
            <Button
              onClick={() => setShowUserDict(true)}
            >
              {t('trainer.myDictionary')}
            </Button>
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => setShowSettings(!showSettings)}
              style={{ 
                backgroundColor: '#8b5cf6', 
                borderColor: '#8b5cf6',
                color: '#ffffff'
              }}
            >
              {t('trainer.settings')}
            </Button>
          </div>
        </div>

        <div>
          {/* Main Content Area */}
          <div className="max-w-4xl mx-auto">

            {/* Training Area */}
            <Card className="shadow-md" style={{ marginTop: showUserDict ? '32px' : '0', marginBottom: '24px' }}>
              {isLoading ? (
                <div className="text-center py-12">
                  <Spin size="large" />
                  <p className="mt-4 text-gray-600">{t('trainer.loading')}</p>
                </div>
              ) : currentWord ? (
              <div className="text-center mb-8">
                {settings.mode === 'sentence' && currentSentence ? (
                  <div className="text-2xl mb-6 text-gray-900">
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
                            <span className="inline-block w-24 border-b-2 border-purple-500 mx-2" />
                          )}
                        </span>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="text-3xl mb-6 text-gray-900">
                    {feedback === 'correct' ? (
                      <div className="text-green-700">
                        {correctAnswer} {currentWord.noun}
                        {settings.showTranslation && currentTranslation && (
                          <span className="text-gray-500 text-2xl ml-2">
                            ({currentTranslation})
                          </span>
                        )}
                      </div>
                    ) : feedback === 'incorrect' ? (
                      <div className="text-red-700">
                        {correctAnswer} {currentWord.noun}
                        {settings.showTranslation && currentTranslation && (
                          <span className="text-gray-500 text-2xl ml-2">
                            ({currentTranslation})
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <span className="inline-block w-24 border-b-2 border-purple-500 mx-2" />
                        {currentWord.noun}
                        {settings.showTranslation && currentTranslation && (
                          <span className="text-gray-500 text-2xl ml-2">
                            ({currentTranslation})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="mb-4">
                  <Input
                    ref={inputRef}
                    size="large"
                    value={userInput}
                    onChange={(e) => handleInput(e.target.value)}
                    onPressEnter={checkAnswer}
                    placeholder={t('trainer.enterArticle')}
                    className={`text-2xl ${
                      feedback === 'correct'
                        ? 'border-green-500'
                        : feedback === 'incorrect'
                        ? 'border-red-500'
                        : ''
                    }`}
                    style={{
                      fontSize: '1.5rem',
                      height: '60px',
                      textAlign: 'center',
                    }}
                  />
                </div>



                <Space>
                  <Button
                    type="primary"
                    size="large"
                    onClick={checkAnswer}
                    disabled={!userInput}
                    style={{
                      backgroundColor: '#8b5cf6',
                      borderColor: '#8b5cf6',
                      color: '#ffffff',
                      height: '48px',
                      paddingLeft: '32px',
                      paddingRight: '32px',
                    }}
                  >
                    {t('trainer.check')}
                  </Button>

                  {feedback === 'incorrect' && (
                    <Button
                      size="large"
                      onClick={getNextWord}
                      style={{ height: '48px' }}
                    >
                      {t('trainer.nextWord')}
                    </Button>
                  )}
                </Space>
              </div>
              ) : null}
            </Card>

            {/* Stats */}
            <Card style={{ marginTop: '32px' }} className="mb-6">
              <Title level={4} className="mb-4">{t('trainer.sessionStats')}</Title>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">{t('trainer.total')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
                  <div className="text-sm text-gray-600">{t('trainer.correct')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.incorrect}</div>
                  <div className="text-sm text-gray-600">{t('trainer.incorrect')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">{t('trainer.accuracy')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.streak}</div>
                  <div className="text-sm text-gray-600">
                    {t('trainer.streak')} ({t('trainer.bestStreak')}: {stats.bestStreak})
                  </div>
                </div>
              </div>
            </Card>
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
