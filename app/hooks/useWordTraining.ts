import { useState, useCallback, useRef, useEffect } from 'react';
import { Word, TrainingSettings, Case } from '../types';
import { generateSentence, getArticleByCase } from '../dictionaries';

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
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedWordRef = useRef<boolean>(false);

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
      // Очищаем поле ввода при неправильном ответе, чтобы можно было ввести новый ответ
      setUserInput('');
      // Сбрасываем флаг обработки
      isProcessingRef.current = false;
      // Сохраняем фокус
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }

    return isCorrect;
  }, [currentWord, currentSentence, currentCase, userInput, settings, getNextWord]);

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
