import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Word, TrainingSettings, Case, DeterminerType } from '../types';
import { generateSentence, getAcceptedDeterminersByCase, getDeterminerByCase } from '../dictionaries';

// Valid determiners list (for input validation) — артикли + (опционально) местоимения-детерминативы
const BASE_VALID_DETERMINERS = [
  'der', 'die', 'das',  // Nominativ определенные
  'den', 'dem', 'des',  // Akkusativ/Dativ/Genitiv определенные (der)
  'ein', 'eine',        // Nominativ неопределенные
  'einen', 'einem', 'einer', 'eines', // Akkusativ/Dativ/Genitiv неопределенные
];

function getValidDeterminers(determinerType: DeterminerType): string[] {
  const set = new Set<string>(BASE_VALID_DETERMINERS);

  if (determinerType === 'possessive') {
    // ein-words style declension (we accept common stems)
    const possessives = [
      // mein-
      'mein', 'meine', 'meinen', 'meinem', 'meiner', 'meines',
      // dein-
      'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines',
      // sein-
      'sein', 'seine', 'seinen', 'seinem', 'seiner', 'seines',
      // ihr-
      'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'ihres',
      // unser-
      'unser', 'unsere', 'unseren', 'unserem', 'unserer', 'unseres',
      // euer- (contracted forms)
      'euer', 'eure', 'euren', 'eurem', 'eurer', 'eures',
    ];
    for (const w of possessives) set.add(w);
  }

  if (determinerType === 'demonstrative') {
    const demonstratives = [
      // dieser-
      'dieser', 'diese', 'dieses', 'diesen', 'diesem',
      // jener-
      'jener', 'jene', 'jenes', 'jenen', 'jenem',
    ];
    for (const w of demonstratives) set.add(w);
  }

  return Array.from(set);
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface UseWordTrainingProps {
  settings: TrainingSettings;
  getEnabledWords: () => Word[];
  isMobile?: boolean;
}

export function useWordTraining({ settings, getEnabledWords, isMobile = false }: UseWordTrainingProps) {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [currentSentence, setCurrentSentence] = useState<string>('');
  const [currentCase, setCurrentCase] = useState<Case>('nominativ');
  const [userInput, setUserInput] = useState<string>('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'invalid' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validDeterminers = useMemo(() => {
    return getValidDeterminers(settings.determinerType);
  }, [settings.determinerType]);

  const cacheKey = useMemo(() => {
    return `training_cache_${JSON.stringify({
      mode: settings.mode,
      cases: settings.cases,
      enabledDictionaries: settings.enabledDictionaries,
      topics: settings.topics,
      determinerType: settings.determinerType,
    })}`;
  }, [settings.mode, settings.cases, settings.enabledDictionaries, settings.topics, settings.determinerType]);
  
  const inputRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutPurposeRef = useRef<'afterCorrect' | 'afterIncorrect' | 'clearFeedback' | null>(null);
  const lastIncorrectValidInputRef = useRef<string | null>(null);
  const hasLoadedWordRef = useRef<boolean>(false);
  const isFirstLoadRef = useRef<boolean>(true); // Track first load to skip auto-focus
  
  // Храним перемешанный список слов и текущий индекс
  const shuffledWordsRef = useRef<Word[]>([]);
  const currentIndexRef = useRef<number>(0);
  const lastWordsHashRef = useRef<string>('');

  const getWordKey = useCallback((word: Word) => `${word.article}:${word.noun}`, []);

  const getNextWord = useCallback(() => {
    // Важно: не переводим фокус в input, если он не был в фокусе до клика (например, при нажатии NextWord)
    const shouldRestoreFocus = (() => {
      if (typeof document === 'undefined') return false;
      const activeEl = document.activeElement;
      const inputEl =
        inputRef.current?.input ??
        inputRef.current?.resizableTextArea?.textArea ??
        null;
      return Boolean(activeEl && inputEl && activeEl === inputEl);
    })();

    // Очищаем таймер и сбрасываем флаг обработки при переходе к новому слову
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      timeoutPurposeRef.current = null;
    }
    isProcessingRef.current = false;

    const words = getEnabledWords();
    if (words.length === 0) {
      setCurrentWord(null);
      setCurrentSentence('');
      setIsLoading(false);
      hasLoadedWordRef.current = false;
      shuffledWordsRef.current = [];
      currentIndexRef.current = 0;
      lastWordsHashRef.current = '';
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(cacheKey);
        } catch (error) {
          console.error('Failed to clear training cache:', error);
        }
      }
      return;
    }

    // Создаём хеш для проверки изменения списка слов
    const wordsHash = words.map(w => `${w.article}:${w.noun}`).sort().join('|');

    // Try to restore cached word on first load (only if word list matches)
    if (!hasLoadedWordRef.current && typeof window !== 'undefined') {
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as { wordKey: string; case_: Case; wordsHash?: string };
          if (!cached.wordsHash || cached.wordsHash === wordsHash) {
            const wordMap = new Map(words.map((word) => [getWordKey(word), word]));
            const cachedWord = wordMap.get(cached.wordKey);
            if (cachedWord) {
              // Prepare shuffled list with cached word first
              const shuffled = shuffleArray(words);
              const cachedIndex = shuffled.findIndex((w) => getWordKey(w) === cached.wordKey);
              if (cachedIndex > 0) {
                [shuffled[0], shuffled[cachedIndex]] = [shuffled[cachedIndex], shuffled[0]];
              }
              shuffledWordsRef.current = shuffled;
              currentIndexRef.current = 1;
              lastWordsHashRef.current = wordsHash;

              setCurrentWord(cachedWord);
              setCurrentCase(cached.case_ || 'nominativ');
              hasLoadedWordRef.current = true;
              lastIncorrectValidInputRef.current = null;

              if (settings.mode === 'sentence') {
                const sentence = generateSentence(cachedWord, cached.case_ || 'nominativ');
                setCurrentSentence(sentence);
              } else {
                setCurrentSentence('');
              }

              setUserInput('');
              setFeedback(null);
              setIsLoading(false);

              if (isFirstLoadRef.current) {
                isFirstLoadRef.current = false;
              } else if (shouldRestoreFocus) {
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 50);
              }
              return;
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore training cache:', error);
      }
    }
    
    // Если список слов изменился - перемешиваем заново
    if (wordsHash !== lastWordsHashRef.current) {
      shuffledWordsRef.current = shuffleArray(words);
      currentIndexRef.current = 0;
      lastWordsHashRef.current = wordsHash;
    }
    
    // Если прошли все слова - перемешиваем заново
    if (currentIndexRef.current >= shuffledWordsRef.current.length) {
      shuffledWordsRef.current = shuffleArray(words);
      currentIndexRef.current = 0;
    }

    // Берём следующее слово из перемешанного списка
    const nextWord = shuffledWordsRef.current[currentIndexRef.current];
    currentIndexRef.current++;
    
    setCurrentWord(nextWord);
    hasLoadedWordRef.current = true;
    lastIncorrectValidInputRef.current = null;

    // Set the case based on settings (for both modes)
    const selectedCase = settings.cases.length > 0 
      ? settings.cases[Math.floor(Math.random() * settings.cases.length)]
      : 'nominativ';
    setCurrentCase(selectedCase);

    if (settings.mode === 'sentence') {
      const sentence = generateSentence(nextWord, selectedCase);
      setCurrentSentence(sentence);
    } else {
      setCurrentSentence('');
    }

    setUserInput('');
    setFeedback(null);
    setIsLoading(false);
    
    // Сохраняем фокус после загрузки нового слова
    // Но не при первой загрузке (чтобы клавиатура не открывалась автоматически на мобильных и не было автофокуса на десктопе)
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
    } else if (shouldRestoreFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [settings, getEnabledWords, cacheKey, getWordKey]);

  useEffect(() => {
    if (!currentWord || typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          wordKey: getWordKey(currentWord),
          case_: currentCase,
          wordsHash: lastWordsHashRef.current,
        })
      );
    } catch (error) {
      console.error('Failed to save training cache:', error);
    }
  }, [currentWord, currentCase, cacheKey, getWordKey]);

  const handleInput = useCallback((value: string) => {
    const trimmedValue = value.toLowerCase().trim();
    setUserInput(trimmedValue);
    
    // Если была показана ошибка "invalid" (тряска/красная рамка) — при вводе отменяем таймер очистки
    // и даём пользователю сразу проверить исправленный вариант.
    if (feedback === 'invalid') {
      if (timeoutRef.current && timeoutPurposeRef.current === 'clearFeedback') {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        timeoutPurposeRef.current = null;
      }
      setFeedback(null);
    }
  }, [feedback]);

  const checkAnswer = useCallback((source?: 'enter' | 'click') => {
    if (!currentWord) return;

    // Не "воруем" фокус: возвращаем его в input только если input был в фокусе до нажатия "Проверить"
    const shouldRestoreFocus = (() => {
      if (typeof document === 'undefined') return false;
      const activeEl = document.activeElement;
      const inputEl =
        inputRef.current?.input ??
        inputRef.current?.resizableTextArea?.textArea ??
        null;
      return Boolean(activeEl && inputEl && activeEl === inputEl);
    })();

    // Если есть активный таймер (ожидание после правильного ответа), сразу переходим к следующему слову
    if (timeoutRef.current && timeoutPurposeRef.current === 'afterCorrect') {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      timeoutPurposeRef.current = null;
      lastIncorrectValidInputRef.current = null;
      setUserInput('');
      setFeedback(null);
      getNextWord();
      isProcessingRef.current = false;
      if (shouldRestoreFocus) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
      return;
    }
    // Если есть активный таймер после неправильного (но валидного) ответа: по Enter можно сразу перейти к следующему слову
    if (timeoutRef.current && timeoutPurposeRef.current === 'afterIncorrect') {
      const trimmedInputNow = userInput.trim().toLowerCase();
      const isValidNow = validDeterminers.includes(trimmedInputNow);
      const isSameAsLastIncorrect =
        Boolean(lastIncorrectValidInputRef.current) &&
        trimmedInputNow === lastIncorrectValidInputRef.current;

      if (
        source === 'enter' &&
        trimmedInputNow &&
        isValidNow &&
        isSameAsLastIncorrect
      ) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        timeoutPurposeRef.current = null;
        lastIncorrectValidInputRef.current = null;

        setUserInput('');
        setFeedback(null);
        getNextWord();
        isProcessingRef.current = false;

        if (shouldRestoreFocus) {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
        return;
      }

      // Если пользователь просто много раз нажимает "Проверить" с тем же неправильным вводом —
      // НЕ сбрасываем таймер (иначе слово переключится только когда он перестанет нажимать).
      if (isSameAsLastIncorrect) {
        return;
      }

      // Пользователь меняет ввод (пытается исправить) — отменяем авто-переключение и продолжаем обычную проверку
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      timeoutPurposeRef.current = null;
    }

    // Если активен таймер очистки ошибок (после invalid) — не блокируем исправление:
    // отменяем таймер и продолжаем обычную проверку.
    if (timeoutRef.current && timeoutPurposeRef.current === 'clearFeedback') {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      timeoutPurposeRef.current = null;
    }
    // Если по какой-то причине есть таймер без цели — не делаем ничего
    if (timeoutRef.current) {
      return;
    }

    // Если поле пустое и пользователь нажал "Проверить" — показываем ошибку (как при невалидном вводе)
    if (!userInput || userInput.trim() === '') {
      lastIncorrectValidInputRef.current = null;
      setFeedback('invalid');
      isProcessingRef.current = false;

      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(200);
      }

      timeoutPurposeRef.current = 'clearFeedback';
      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
        timeoutRef.current = null;
        timeoutPurposeRef.current = null;
      }, 1500);

      if (shouldRestoreFocus) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
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

    // Проверяем, является ли введенное значение валидным артиклем
    const trimmedInput = userInput.trim().toLowerCase();
    const isValidDeterminer = validDeterminers.includes(trimmedInput);

    if (!isValidDeterminer) {
      lastIncorrectValidInputRef.current = null;
      // Если введено не артикль - показываем ошибку и вибрируем на мобильных
      setFeedback('invalid');
      isProcessingRef.current = false;
      
      // Вибрация на мобильных устройствах
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(200); // Вибрация 200ms
      }
      
      // Сбрасываем ошибку через 1.5 секунды
      timeoutPurposeRef.current = 'clearFeedback';
      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
        timeoutRef.current = null;
        timeoutPurposeRef.current = null;
      }, 1500);
      
      // Сохраняем фокус
      if (shouldRestoreFocus) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
      
      // Не считаем это ошибкой в статистике (возвращаем undefined)
      return;
    }

    const correctAnswer = getDeterminerByCase(
      currentWord.article,
      currentCase,
      settings.determinerType
    );

    const acceptedAnswers = getAcceptedDeterminersByCase(
      currentWord.article,
      currentCase,
      settings.determinerType
    );

    const isCorrect = acceptedAnswers.includes(trimmedInput);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      lastIncorrectValidInputRef.current = null;
      // Автоматически переходим к следующему слову с задержкой
      const delay = 1500;
      timeoutPurposeRef.current = 'afterCorrect';
      timeoutRef.current = setTimeout(() => {
        setUserInput('');
        setFeedback(null);
        getNextWord();
        // Сбрасываем флаг обработки после перехода к следующему слову
        isProcessingRef.current = false;
        // Сохраняем фокус после перехода к следующему слову
        if (shouldRestoreFocus) {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
        timeoutRef.current = null;
        timeoutPurposeRef.current = null;
      }, delay);
    } else {
      lastIncorrectValidInputRef.current = trimmedInput;
      // При ошибке добавляем слово обратно в очередь для повторения
      shuffledWordsRef.current.push(currentWord);
      
      // Не очищаем поле ввода сразу - оставляем пользовательский ввод до переключения на новое слово
      // Сбрасываем флаг обработки
      isProcessingRef.current = false;
      // Сохраняем фокус
      if (shouldRestoreFocus) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
      
      // Автоматически переключаем на следующее слово после ошибки
      // На мобильных устройствах используем большую задержку для лучшей видимости
      const delay = isMobile ? 2000 : 1500;
      timeoutPurposeRef.current = 'afterIncorrect';
      timeoutRef.current = setTimeout(() => {
        setUserInput('');
        setFeedback(null);
        getNextWord();
        isProcessingRef.current = false;
        if (shouldRestoreFocus) {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
        timeoutRef.current = null;
        timeoutPurposeRef.current = null;
        lastIncorrectValidInputRef.current = null;
      }, delay);
    }

    return isCorrect;
  }, [currentWord, currentCase, userInput, settings, getNextWord, isMobile, validDeterminers]);

  // Очистка таймера при размонтировании компонента
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    currentWord,
    currentSentence,
    currentCase,
    userInput,
    feedback,
    isLoading,
    inputRef,
    getNextWord,
    handleInput,
    checkAnswer,
  };
}
