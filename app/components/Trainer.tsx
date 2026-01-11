'use client';

import { useState, useEffect, useCallback } from 'react';
import { Drawer, Button, Radio, Checkbox, Select, Space, Divider, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { Word, TrainingSettings, SessionStats, Case, Level, Article, Language, Topic } from '../types';
import { builtInDictionaries, generateSentence, getArticleByCase } from '../dictionaries';

const { Title, Text } = Typography;

const allTopics: Topic[] = [
  'Food',
  'Drinks',
  'Tableware / Cutlery',
  'Kitchen',
  'Furniture',
  'Rooms',
  'Clothes',
  'Family',
  'People & Professions',
  'Animals',
  'Nature',
  'City',
  'Transport',
  'School',
  'Work',
  'Countries & Languages',
  'Numbers & Letters',
  'Months and Days of the Week',
  'Time & Dates',
  'Holidays',
];

const allLanguages: Language[] = ['Russian', 'English', 'German', 'French', 'Spanish'];

export default function Trainer() {
  const [settings, setSettings] = useState<TrainingSettings>({
    mode: 'noun-only',
    level: ['A1'],
    cases: ['nominativ'],
    usePronouns: false,
    enabledDictionaries: ['A1'],
    language: 'Russian',
    topics: [],
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
  const [newWord, setNewWord] = useState({ noun: '', article: 'der' as Article, translation: '' });

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
  }, [settings, getEnabledWords]);

  // Initialize first word
  useEffect(() => {
    getNextWord();
  }, [getNextWord]);

  // Handle input
  const handleInput = (value: string) => {
    setUserInput(value.toLowerCase().trim());
  };

  // Check answer
  const checkAnswer = () => {
    if (!currentWord || !userInput) return;

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
      setTimeout(() => {
        getNextWord();
      }, 1000);
    }
  };

  // Handle key press
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && userInput) {
        checkAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [userInput, currentWord, currentSentence, settings]);

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

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">DerDieDas Trainer</h1>
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
            >
              Настройки
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">

            {/* User Dictionary Panel */}
            {showUserDict && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Мой словарь</h2>
          
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Существительное"
              value={newWord.noun}
              onChange={(e) => setNewWord({ ...newWord, noun: e.target.value })}
              className="px-3 py-2 border rounded flex-1"
            />
            <select
              value={newWord.article}
              onChange={(e) => setNewWord({ ...newWord, article: e.target.value as Article })}
              className="px-3 py-2 border rounded"
            >
              <option value="der">der</option>
              <option value="die">die</option>
              <option value="das">das</option>
            </select>
            <input
              type="text"
              placeholder="Перевод (опционально)"
              value={newWord.translation}
              onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
              className="px-3 py-2 border rounded flex-1"
            />
            <button
              onClick={addUserWord}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Добавить
            </button>
          </div>

          {userDictionaries.map((dict) => (
            <div key={dict.id} className="mb-4">
              <h3 className="font-semibold mb-2">{dict.name}</h3>
              <div className="space-y-1">
                {dict.words.map((word, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded">
                    <span>
                      <strong>{word.article}</strong> {word.noun}
                      {word.translation && ` - ${word.translation}`}
                    </span>
                    <button
                      onClick={() => {
                        setUserDictionaries((prev) =>
                          prev.map((d) =>
                            d.id === dict.id
                              ? { ...d, words: d.words.filter((_, i) => i !== idx) }
                              : d
                          )
                        );
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            </div>
            ))}
          </div>
        )}

            {/* Training Area */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
        <div className="text-center mb-8">
          {settings.mode === 'sentence' && currentSentence ? (
            <div className="text-2xl mb-6">
              {currentSentence.split('___').map((part, idx, arr) => (
                <span key={idx}>
                  {part}
                  {idx < arr.length - 1 && (
                    <span className="inline-block w-24 border-b-2 border-blue-500 mx-2" />
                  )}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-3xl mb-6">
              <span className="inline-block w-24 border-b-2 border-blue-500 mx-2" />
              {currentWord.noun}
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              value={userInput}
              onChange={(e) => handleInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
              placeholder="Введите артикль..."
              className={`text-2xl text-center px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                feedback === 'correct'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900'
                  : feedback === 'incorrect'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              autoFocus
            />
          </div>

          {feedback === 'incorrect' && (
            <div className="text-red-600 dark:text-red-400 mb-2">
              Неправильно! Правильный ответ: <strong>{correctAnswer}</strong>
            </div>
          )}

          {feedback === 'correct' && (
            <div className="text-green-600 dark:text-green-400 mb-2">
              Правильно! ✓
            </div>
          )}

          <button
            onClick={checkAnswer}
            disabled={!userInput}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Проверить
          </button>

          {feedback === 'incorrect' && (
            <button
              onClick={getNextWord}
              className="ml-4 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Следующее слово
            </button>
          )}
        </div>

        {currentWord.translation && (
          <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
            Перевод: {currentWord.translation}
          </div>
        )}
            </div>

            {/* Stats */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Статистика сессии</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Всего</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Правильно</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{stats.incorrect}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Неправильно</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Точность</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.streak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Серия (лучшая: {stats.bestStreak})
            </div>
          </div>
        </div>
            </div>
          </div>

          {/* Right Sidebar - Additional Settings */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4">ADD TO THE LESSON</h2>
              
              {/* Language Dropdown */}
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-sm">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value as Language })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {allLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topics Dropdown */}
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-sm">Topic</label>
                <select
                  value=""
                  onChange={(e) => {
                    const topic = e.target.value as Topic;
                    if (topic && !settings.topics.includes(topic)) {
                      setSettings({ ...settings, topics: [...settings.topics, topic] });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a topic...</option>
                  {allTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
                
                {/* Selected Topics */}
                {settings.topics.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {settings.topics.map((topic) => (
                      <div
                        key={topic}
                        className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
                      >
                        <span className="text-sm">{topic}</span>
                        <button
                          onClick={() => {
                            setSettings({
                              ...settings,
                              topics: settings.topics.filter((t) => t !== topic),
                            });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Drawer */}
      <Drawer
        title="Настройки"
        placement="right"
        onClose={() => setShowSettings(false)}
        open={showSettings}
        width={400}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>Режим тренировки</Title>
            <Radio.Group
              value={settings.mode}
              onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
              style={{ width: '100%' }}
            >
              <Space direction="vertical">
                <Radio value="noun-only">Только существительное</Radio>
                <Radio value="sentence">В предложении</Radio>
              </Space>
            </Radio.Group>
          </div>

          <Divider />

          <div>
            <Title level={5}>Уровень</Title>
            <Checkbox.Group
              value={settings.level}
              onChange={(checkedValues) => {
                const levels = checkedValues as Level[];
                setSettings({
                  ...settings,
                  level: levels,
                  enabledDictionaries: [
                    ...settings.enabledDictionaries.filter((d) => !['A1', 'A2', 'B1'].includes(d)),
                    ...levels,
                  ],
                });
              }}
            >
              <Space direction="vertical">
                {(['A1', 'A2', 'B1'] as Level[]).map((level) => (
                  <Checkbox key={level} value={level}>
                    {level}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </div>

          {settings.mode === 'sentence' && (
            <>
              <Divider />
              <div>
                <Title level={5}>Падежи</Title>
                <Checkbox.Group
                  value={settings.cases}
                  onChange={(checkedValues) => {
                    setSettings({
                      ...settings,
                      cases: checkedValues as Case[],
                    });
                  }}
                >
                  <Space direction="vertical">
                    {(['nominativ', 'akkusativ', 'dativ', 'genitiv'] as Case[]).map((case_) => (
                      <Checkbox key={case_} value={case_}>
                        {case_.charAt(0).toUpperCase() + case_.slice(1)}
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              </div>

              <div>
                <Checkbox
                  checked={settings.usePronouns}
                  onChange={(e) => setSettings({ ...settings, usePronouns: e.target.checked })}
                >
                  Использовать местоимения
                </Checkbox>
              </div>
            </>
          )}

          <Divider />

          <div>
            <Title level={5}>Словари</Title>
            <Checkbox.Group
              value={settings.enabledDictionaries}
              onChange={(checkedValues) => {
                setSettings({
                  ...settings,
                  enabledDictionaries: checkedValues as string[],
                });
                // Update user dictionaries enabled state
                const enabledIds = checkedValues as string[];
                setUserDictionaries((prev) =>
                  prev.map((d) => ({ ...d, enabled: enabledIds.includes(d.id) }))
                );
              }}
            >
              <Space direction="vertical">
                {(['A1', 'A2', 'B1'] as Level[]).map((level) => (
                  <Checkbox key={level} value={level}>
                    Встроенный {level}
                  </Checkbox>
                ))}
                {userDictionaries.map((dict) => (
                  <Checkbox key={dict.id} value={dict.id}>
                    {dict.name}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </div>
        </Space>
      </Drawer>
    </div>
  );
}
