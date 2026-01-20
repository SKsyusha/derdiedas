import { useState, useCallback, useRef, useEffect } from 'react';
import { Word, TrainingSettings, Case } from '../types';
import { generateSentence, getArticleByCase } from '../dictionaries';

// Valid articles list - все артикли во всех падежах
// Определенные артикли (der/die/das): der, die, das, den, dem, des
// Неопределенные артикли (ein/eine): ein, eine, einen, einem, einer, eines
const VALID_ARTICLES = [
  'der', 'die', 'das',  // Nominativ определенные
  'den', 'dem', 'des',  // Akkusativ/Dativ/Genitiv определенные (der)
  'ein', 'eine',        // Nominativ неопределенные
  'einen', 'einem', 'einer', 'eines', // Akkusativ/Dativ/Genitiv неопределенные
];

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
  
  const inputRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedWordRef = useRef<boolean>(false);
  const isFirstLoadRef = useRef<boolean>(true); // Track first load to skip auto-focus
  
  // Храним перемешанный список слов и текущий индекс
  const shuffledWordsRef = useRef<Word[]>([]);
  const currentIndexRef = useRef<number>(0);
  const lastWordsHashRef = useRef<string>('');

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
      shuffledWordsRef.current = [];
      currentIndexRef.current = 0;
      lastWordsHashRef.current = '';
      return;
    }

    // Создаём хеш для проверки изменения списка слов
    const wordsHash = words.map(w => w.noun).sort().join('|');
    
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

    // Set the case based on settings (for both modes)
    const selectedCase = settings.cases.length > 0 
      ? settings.cases[Math.floor(Math.random() * settings.cases.length)]
      : 'nominativ';
    setCurrentCase(selectedCase);

    if (settings.mode === 'sentence') {
      const sentence = generateSentence(nextWord, selectedCase, settings.usePronouns);
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
    } else {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [settings, getEnabledWords]);

  const handleInput = useCallback((value: string) => {
    const trimmedValue = value.toLowerCase().trim();
    setUserInput(trimmedValue);
  }, []);

  const checkAnswer = useCallback(() => {
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

    // Проверяем, является ли введенное значение валидным артиклем
    const trimmedInput = userInput.trim().toLowerCase();
    const isValidArticle = VALID_ARTICLES.includes(trimmedInput);

    if (!isValidArticle) {
      // Если введено не артикль - показываем ошибку и вибрируем на мобильных
      setFeedback('invalid');
      isProcessingRef.current = false;
      
      // Вибрация на мобильных устройствах
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(200); // Вибрация 200ms
      }
      
      // Сбрасываем ошибку через 1.5 секунды
      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
        timeoutRef.current = null;
      }, 1500);
      
      // Сохраняем фокус
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      return false;
    }

    // Get correct answer based on article, case, and article type
    const correctAnswer = getArticleByCase(currentWord.article, currentCase, settings.articleType);

    const isCorrect = trimmedInput === correctAnswer;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      // Автоматически переходим к следующему слову с задержкой
      const delay = 1500;
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
      }, delay);
    } else {
      // При ошибке добавляем слово обратно в очередь для повторения
      shuffledWordsRef.current.push(currentWord);
      
      // Не очищаем поле ввода сразу - оставляем пользовательский ввод до переключения на новое слово
      // Сбрасываем флаг обработки
      isProcessingRef.current = false;
      // Сохраняем фокус
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      // Автоматически переключаем на следующее слово после ошибки
      // На мобильных устройствах используем большую задержку для лучшей видимости
      const delay = isMobile ? 2000 : 1500;
      timeoutRef.current = setTimeout(() => {
        setUserInput('');
        setFeedback(null);
        getNextWord();
        isProcessingRef.current = false;
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }, delay);
    }

    return isCorrect;
  }, [currentWord, currentCase, userInput, settings, getNextWord, isMobile]);

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
