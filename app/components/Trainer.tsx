'use client';

import { useState, useEffect, useCallback } from 'react';
import { Drawer, Button, Radio, Checkbox, Select, Space, Divider, Typography, Card, Input, Tag } from 'antd';
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

const allLanguages: Language[] = ['Russian', 'English'];

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
  const [drawerSize, setDrawerSize] = useState(400);
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

        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">

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
            <Card className="mb-6 shadow-md">
              <div className="text-center mb-8">
                {settings.mode === 'sentence' && currentSentence ? (
                  <div className="text-2xl mb-6 text-gray-900">
                    {currentSentence.split('___').map((part, idx, arr) => (
                      <span key={idx}>
                        {part}
                        {idx < arr.length - 1 && (
                          <span className="inline-block w-24 border-b-2 border-purple-500 mx-2" />
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-3xl mb-6 text-gray-900">
                    <span className="inline-block w-24 border-b-2 border-purple-500 mx-2" />
                    {currentWord.noun}
                  </div>
                )}

                <div className="mb-4">
                  <Input
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

                {feedback === 'incorrect' && (
                  <div className="text-red-600 mb-2">
                    Неправильно! Правильный ответ: <strong>{correctAnswer}</strong>
                  </div>
                )}

                {feedback === 'correct' && (
                  <div className="text-green-600 mb-2">
                    Правильно! ✓
                  </div>
                )}

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

              {currentWord.translation && (
                <div className="text-center text-gray-600 text-sm">
                  Перевод: {currentWord.translation}
                </div>
              )}
            </Card>

            {/* Stats */}
            <Card className="mb-6">
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

          {/* Right Sidebar - Additional Settings */}
          <div className="w-48 flex-shrink-0">
            <Card className="shadow-md" styles={{ body: { padding: '16px' } }}>
              <Title level={5} className="mb-3" style={{ fontSize: '14px', fontWeight: 600 }}>
                ADD TO THE LESSON
              </Title>
              
              {/* Language Dropdown */}
              <div className="mb-4">
                <Text strong className="block mb-1.5" style={{ fontSize: '12px' }}>Language</Text>
                <Select
                  value={settings.language}
                  onChange={(value) => setSettings({ ...settings, language: value as Language })}
                  style={{ width: '100%' }}
                  size="small"
                  options={allLanguages.map((lang) => ({ label: lang, value: lang }))}
                />
              </div>

              {/* Topics Dropdown */}
              <div className="mb-4">
                <Text strong className="block mb-1.5" style={{ fontSize: '12px' }}>Topic</Text>
                <Select
                  placeholder="Select a topic..."
                  style={{ width: '100%' }}
                  size="small"
                  onChange={(value) => {
                    const topic = value as Topic;
                    if (topic && !settings.topics.includes(topic)) {
                      setSettings({ ...settings, topics: [...settings.topics, topic] });
                    }
                  }}
                  options={allTopics.map((topic) => ({ label: topic, value: topic }))}
                />
                
                {/* Selected Topics */}
                {settings.topics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {settings.topics.map((topic) => (
                      <Tag
                        key={topic}
                        closable
                        onClose={() => {
                          setSettings({
                            ...settings,
                            topics: settings.topics.filter((t) => t !== topic),
                          });
                        }}
                        color="purple"
                        style={{ 
                          margin: 0,
                          fontSize: '11px',
                          padding: '2px 6px',
                          lineHeight: '1.4'
                        }}
                      >
                        {topic}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Settings Drawer */}
      <Drawer
        title="Настройки"
        placement="right"
        onClose={() => setShowSettings(false)}
        open={showSettings}
        size={drawerSize}
        resizable={{
          onResize: (newSize: number) => {
            setDrawerSize(newSize);
          },
        }}
      >
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5}>Режим тренировки</Title>
            <Radio.Group
              value={settings.mode}
              onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
              style={{ width: '100%' }}
            >
              <Space orientation="vertical">
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
              <Space orientation="vertical">
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
                  <Space orientation="vertical">
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
              <Space orientation="vertical">
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
