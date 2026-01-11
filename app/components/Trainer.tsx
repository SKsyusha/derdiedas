'use client';

import { useState, useEffect, useCallback } from 'react';
import { Word, TrainingSettings, SessionStats, Case, Level, Article } from '../types';
import { builtInDictionaries, generateSentence, getArticleByCase } from '../dictionaries';

export default function Trainer() {
  const [settings, setSettings] = useState<TrainingSettings>({
    mode: 'noun-only',
    level: ['A1'],
    cases: ['nominativ'],
    usePronouns: false,
    enabledDictionaries: ['A1'],
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
        const filteredWords = levelWords.filter((w) => 
          !settings.level.length || settings.level.includes(w.level || 'A1')
        );
        words.push(...filteredWords);
      }
    });

    // Add user dictionary words
    userDictionaries.forEach((dict) => {
      if (settings.enabledDictionaries.includes(dict.id)) {
        words.push(...dict.words);
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
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">DerDieDas Trainer</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUserDict(!showUserDict)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Мой словарь
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Настройки
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Настройки</h2>
          
          <div className="mb-4">
            <label className="block mb-2 font-semibold">Режим тренировки:</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={settings.mode === 'noun-only'}
                  onChange={() => setSettings({ ...settings, mode: 'noun-only' })}
                />
                Только существительное
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={settings.mode === 'sentence'}
                  onChange={() => setSettings({ ...settings, mode: 'sentence' })}
                />
                В предложении
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-semibold">Уровень:</label>
            <div className="flex gap-4">
              {(['A1', 'A2', 'B1'] as Level[]).map((level) => (
                <label key={level} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.level.includes(level)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({
                          ...settings,
                          level: [...settings.level, level],
                          enabledDictionaries: [...new Set([...settings.enabledDictionaries, level])],
                        });
                      } else {
                        setSettings({
                          ...settings,
                          level: settings.level.filter((l) => l !== level),
                          enabledDictionaries: settings.enabledDictionaries.filter((d) => d !== level),
                        });
                      }
                    }}
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>

          {settings.mode === 'sentence' && (
            <>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Падежи:</label>
                <div className="flex gap-4 flex-wrap">
                  {(['nominativ', 'akkusativ', 'dativ', 'genitiv'] as Case[]).map((case_) => (
                    <label key={case_} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.cases.includes(case_)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings({ ...settings, cases: [...settings.cases, case_] });
                          } else {
                            setSettings({
                              ...settings,
                              cases: settings.cases.filter((c) => c !== case_),
                            });
                          }
                        }}
                      />
                      {case_.charAt(0).toUpperCase() + case_.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.usePronouns}
                    onChange={(e) => setSettings({ ...settings, usePronouns: e.target.checked })}
                  />
                  Использовать местоимения
                </label>
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block mb-2 font-semibold">Словари:</label>
            <div className="flex gap-4 flex-wrap">
              {(['A1', 'A2', 'B1'] as Level[]).map((level) => (
                <label key={level} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.enabledDictionaries.includes(level)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({
                          ...settings,
                          enabledDictionaries: [...settings.enabledDictionaries, level],
                        });
                      } else {
                        setSettings({
                          ...settings,
                          enabledDictionaries: settings.enabledDictionaries.filter((d) => d !== level),
                        });
                      }
                    }}
                  />
                  Встроенный {level}
                </label>
              ))}
              {userDictionaries.map((dict) => (
                <label key={dict.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={dict.enabled && settings.enabledDictionaries.includes(dict.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({
                          ...settings,
                          enabledDictionaries: [...settings.enabledDictionaries, dict.id],
                        });
                        setUserDictionaries((prev) =>
                          prev.map((d) => (d.id === dict.id ? { ...d, enabled: true } : d))
                        );
                      } else {
                        setSettings({
                          ...settings,
                          enabledDictionaries: settings.enabledDictionaries.filter((d) => d !== dict.id),
                        });
                        setUserDictionaries((prev) =>
                          prev.map((d) => (d.id === dict.id ? { ...d, enabled: false } : d))
                        );
                      }
                    }}
                  />
                  {dict.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

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
  );
}
