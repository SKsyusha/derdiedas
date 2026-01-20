'use client';

import { Word } from '../types';

interface WordDisplayProps {
  word: Word;
  mode: 'sentence' | 'noun-only';
  sentence?: string;
  correctAnswer: string;
  userAnswer?: string;
  feedback: 'correct' | 'incorrect' | null;
  showTranslation: boolean;
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
  translation,
}: WordDisplayProps) {
  const displayAnswer =
    feedback === 'correct' && userAnswer ? userAnswer : correctAnswer;

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
        <div style={{ color: 'var(--success)' }}>
          {displayAnswer} {word.noun}
          {showTranslation && translation && (
            <span className="text-base sm:text-2xl ml-1 sm:ml-2 block sm:inline" style={{ color: 'var(--gray-text)' }}>
              <span className="sm:hidden">{translation}</span>
              <span className="hidden sm:inline">({translation})</span>
            </span>
          )}
        </div>
      ) : feedback === 'incorrect' ? (
        <div style={{ color: 'var(--error)' }}>
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
