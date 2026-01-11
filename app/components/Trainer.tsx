'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, Input, Space, Select, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { Word, TrainingSettings, SessionStats, Case, Level, Article } from '../types';
import { builtInDictionaries, generateSentence, getArticleByCase } from '../dictionaries';
import SettingsDrawer from './SettingsDrawer';

const { Title, Text } = Typography;

export default function Trainer() {
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
  const inputRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get all enabled words
  const getEnabledWords = useCallback((): Word[] => {
    const words: Word[] = [];
    
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

    // Add user dictionary words
    userDictionaries.forEach((dict) => {
      if (settings.enabledDictionaries.includes(dict.id)) {
        const filteredWords = dict.words.filter((w) => {
          const topicMatch = !settings.topics.length || (w.topic && settings.topics.includes(w.topic));
          return topicMatch;
        });
        words.push(...filteredWords);
      }
    });

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
      return;
    }

    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);

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
  const handleInput = (value: string) => {
    setUserInput(value.toLowerCase().trim());
  };

  // Check answer
  const checkAnswer = () => {
    if (!currentWord) return;

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
      correctAnswer = getArticleByCase(currentWord.article, currentCase);
    } else {
      correctAnswer = currentWord.article;
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


  // Add user word
  const addUserWord = () => {
    if (!newWord.noun || !newWord.article) return;

    const word: Word = {
      noun: newWord.noun,
      article: newWord.article,
      translation: newWord.translation || undefined,
    };

    // Add to first user dictionary or create one
    if (userDictionaries.length === 0) {
      setUserDictionaries([{
        id: 'user-1',
        name: 'Мой словарь',
        words: [word],
        enabled: true,
      }]);
    } else {
      setUserDictionaries((prev) => {
        const updated = [...prev];
        updated[0].words.push(word);
        return updated;
      });
    }

    setNewWord({ noun: '', article: 'der', translation: '' });
  };

  if (!currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Нет доступных слов</h2>
          <p className="text-gray-600 mb-4">Включите хотя бы один словарь в настройках</p>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Открыть настройки
          </button>
        </div>
      </div>
    );
  }

  const correctAnswer = settings.mode === 'sentence' && currentSentence
    ? getArticleByCase(currentWord.article, currentCase)
    : currentWord.article;

  // Получаем правильный перевод в зависимости от выбранного языка
  const getTranslation = (word: Word): string | undefined => {
    if (settings.language === 'English') {
      return word.translation_en || word.translation;
    } else {
      return word.translation_ru || word.translation;
    }
  };

  const currentTranslation = getTranslation(currentWord);

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">DerDieDas Trainer</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowUserDict(!showUserDict)}
            >
              Мой словарь
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
              Настройки
            </Button>
          </div>
        </div>

        <div>
          {/* Main Content Area */}
          <div className="max-w-4xl mx-auto">

            {/* User Dictionary Panel */}
            {showUserDict && (
              <Card className="mb-6">
                <Title level={4} className="mb-4">Мой словарь</Title>
                
                <Space.Compact style={{ width: '100%', marginBottom: '16px' }}>
                  <Input
                    placeholder="Существительное"
                    value={newWord.noun}
                    onChange={(e) => setNewWord({ ...newWord, noun: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <Select
                    value={newWord.article}
                    onChange={(value) => setNewWord({ ...newWord, article: value as Article })}
                    style={{ width: 100 }}
                    options={[
                      { label: 'der', value: 'der' },
                      { label: 'die', value: 'die' },
                      { label: 'das', value: 'das' },
                    ]}
                  />
                  <Input
                    placeholder="Перевод (опционально)"
                    value={newWord.translation}
                    onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    onClick={addUserWord}
                    style={{ 
                      backgroundColor: '#8b5cf6', 
                      borderColor: '#8b5cf6',
                      color: '#ffffff'
                    }}
                  >
                    Добавить
                  </Button>
                </Space.Compact>

                {userDictionaries.map((dict) => (
                  <div key={dict.id} className="mb-4">
                    <Text strong className="block mb-2">{dict.name}</Text>
                    <div className="space-y-1">
                      {dict.words.map((word, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg mb-2">
                          <span className="text-gray-900">
                            <strong>{word.article}</strong> {word.noun}
                            {word.translation && ` - ${word.translation}`}
                          </span>
                          <Button
                            type="text"
                            danger
                            size="small"
                            onClick={() => {
                              setUserDictionaries((prev) =>
                                prev.map((d) =>
                                  d.id === dict.id
                                    ? { ...d, words: d.words.filter((_, i) => i !== idx) }
                                    : d
                                )
                              );
                            }}
                          >
                            Удалить
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {/* Training Area */}
            <Card className="shadow-md" style={{ marginBottom: '24px' }}>
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
                    placeholder="Введите артикль..."
                    className={`text-2xl text-center ${
                      feedback === 'correct'
                        ? 'border-green-500'
                        : feedback === 'incorrect'
                        ? 'border-red-500'
                        : ''
                    }`}
                    style={{
                      fontSize: '1.5rem',
                      height: '60px',
                    }}
                    autoFocus
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
                    Проверить
                  </Button>

                  {feedback === 'incorrect' && (
                    <Button
                      size="large"
                      onClick={getNextWord}
                      style={{ height: '48px' }}
                    >
                      Следующее слово
                    </Button>
                  )}
                </Space>
              </div>

            </Card>

            {/* Stats */}
            <Card style={{ marginTop: '32px' }} className="mb-6">
              <Title level={4} className="mb-4">Статистика сессии</Title>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Всего</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
                  <div className="text-sm text-gray-600">Правильно</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.incorrect}</div>
                  <div className="text-sm text-gray-600">Неправильно</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Точность</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.streak}</div>
                  <div className="text-sm text-gray-600">
                    Серия (лучшая: {stats.bestStreak})
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
    </div>
  );
}
