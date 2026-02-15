'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Word } from '../types';

interface WordDisplayProps {
  word: Word;
  mode: 'sentence' | 'noun-only';
  sentence?: string;
  correctAnswer: string;
  userAnswer?: string;
  feedback: 'correct' | 'incorrect' | null;
  showTranslation: boolean;
  playSound: boolean;
  translation?: string;
}

export default function WordDisplay({
  word,
  mode,
  sentence,
  correctAnswer,
  userAnswer,
  feedback,
  showTranslation,
  playSound,
  translation,
}: WordDisplayProps) {
  const displayAnswer =
    feedback === 'correct' && userAnswer ? userAnswer : correctAnswer;

  const hadFeedbackRef = useRef(false);
  useEffect(() => {
    if (!playSound) return;
    if (feedback === 'correct' || feedback === 'incorrect') {
      if (word.audio_url && !hadFeedbackRef.current) {
        const audio = new Audio(word.audio_url);
        audio.play().catch(() => {});
      }
      hadFeedbackRef.current = true;
    } else {
      hadFeedbackRef.current = false;
    }
  }, [playSound, feedback, word.audio_url]);

  const playAudio = useCallback(() => {
    if (word.audio_url) {
      const audio = new Audio(word.audio_url);
      audio.play().catch(() => {});
    }
  }, [word.audio_url]);

  const soundButton = playSound && word.audio_url ? (
    <button
      type="button"
      onClick={playAudio}
      className="inline-flex items-center justify-center align-middle ml-1.5 sm:ml-2 p-1 rounded hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--purple-primary)]"
      style={{ color: 'var(--gray-text)' }}
      aria-label="Play pronunciation"
    >
      <img src="/sound.svg" alt="" width={24} height={24} className="opacity-90" />
    </button>
  ) : null;

  if (mode === 'sentence' && sentence) {
    return (
      <div className="text-lg sm:text-2xl mb-4 sm:mb-6 px-4 sm:px-2" style={{ color: 'var(--foreground)' }}>
        {feedback === 'correct' ? (
          <div style={{ color: 'var(--success)' }}>
            {sentence.replace('___', displayAnswer)}
          </div>
        ) : feedback === 'incorrect' ? (
          <div style={{ color: 'var(--error)' }}>
            {sentence.replace('___', correctAnswer)}
          </div>
        ) : (
          sentence.split('___').map((part, idx, arr) => (
            <span key={idx}>
              {part}
              {idx < arr.length - 1 && (
                <span className="inline-block w-16 sm:w-24 border-b-2 mx-1 sm:mx-2" style={{ borderColor: 'var(--purple-primary)' }} />
              )}
            </span>
          ))
        )}

        {showTranslation && translation && (
          <div className="text-base sm:text-xl mt-2" style={{ color: 'var(--gray-text)' }}>
            {translation}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-xl sm:text-3xl mb-4 sm:mb-6 px-4 sm:px-2" style={{ color: 'var(--foreground)' }}>
      {feedback === 'correct' ? (
        <div style={{ color: 'var(--success)' }} className="inline-flex flex-wrap items-baseline gap-0">
          {displayAnswer} {word.noun}
          {showTranslation && translation && (
            <span className="text-base sm:text-2xl ml-1 sm:ml-2 block sm:inline" style={{ color: 'var(--gray-text)' }}>
              <span className="sm:hidden">{translation}</span>
              <span className="hidden sm:inline">({translation})</span>
            </span>
          )}
        </div>
      ) : feedback === 'incorrect' ? (
        <div style={{ color: 'var(--error)' }} className="inline-flex flex-wrap items-baseline gap-0">
          {correctAnswer} {word.noun}
          {showTranslation && translation && (
            <span className="text-base sm:text-2xl ml-1 sm:ml-2 block sm:inline" style={{ color: 'var(--gray-text)' }}>
              <span className="sm:hidden">{translation}</span>
              <span className="hidden sm:inline">({translation})</span>
            </span>
          )}
        </div>
      ) : (
        <>
          <span className="inline-block w-16 sm:w-24 border-b-2 mx-1 sm:mx-2" style={{ borderColor: 'var(--purple-primary)' }} />
          {word.noun}
          {showTranslation && translation && (
            <span className="text-base sm:text-2xl ml-1 sm:ml-2 block sm:inline" style={{ color: 'var(--gray-text)' }}>
              <span className="sm:hidden">{translation}</span>
              <span className="hidden sm:inline">({translation})</span>
            </span>
          )}
        </>
      )}
    </div>
  );
}
