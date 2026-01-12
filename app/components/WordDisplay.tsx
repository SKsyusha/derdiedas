'use client';

import { Word, Case } from '../types';

interface WordDisplayProps {
  word: Word;
  mode: 'sentence' | 'noun-only';
  sentence?: string;
  correctAnswer: string;
  feedback: 'correct' | 'incorrect' | null;
  showTranslation: boolean;
  translation?: string;
}

export default function WordDisplay({
  word,
  mode,
  sentence,
  correctAnswer,
  feedback,
  showTranslation,
  translation,
}: WordDisplayProps) {
  if (mode === 'sentence' && sentence) {
    return (
      <div className="text-lg sm:text-2xl mb-4 sm:mb-6 text-gray-900 px-4 sm:px-2">
        {feedback === 'correct' ? (
          <div className="text-green-700">
            {sentence.replace('___', correctAnswer)}
          </div>
        ) : feedback === 'incorrect' ? (
          <div className="text-red-700">
            {sentence.replace('___', correctAnswer)}
          </div>
        ) : (
          sentence.split('___').map((part, idx, arr) => (
            <span key={idx}>
              {part}
              {idx < arr.length - 1 && (
                <span className="inline-block w-16 sm:w-24 border-b-2 border-purple-500 mx-1 sm:mx-2" />
              )}
            </span>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="text-xl sm:text-3xl mb-4 sm:mb-6 text-gray-900 px-4 sm:px-2">
      {feedback === 'correct' ? (
        <div className="text-green-700">
          {correctAnswer} {word.noun}
          {showTranslation && translation && (
            <span className="text-gray-500 text-base sm:text-2xl ml-1 sm:ml-2 block sm:inline">
              <span className="sm:hidden">{translation}</span>
              <span className="hidden sm:inline">({translation})</span>
            </span>
          )}
        </div>
      ) : feedback === 'incorrect' ? (
        <div className="text-red-700">
          {correctAnswer} {word.noun}
          {showTranslation && translation && (
            <span className="text-gray-500 text-base sm:text-2xl ml-1 sm:ml-2 block sm:inline">
              <span className="sm:hidden">{translation}</span>
              <span className="hidden sm:inline">({translation})</span>
            </span>
          )}
        </div>
      ) : (
        <>
          <span className="inline-block w-16 sm:w-24 border-b-2 border-purple-500 mx-1 sm:mx-2" />
          {word.noun}
          {showTranslation && translation && (
            <span className="text-gray-500 text-base sm:text-2xl ml-1 sm:ml-2 block sm:inline">
              <span className="sm:hidden">{translation}</span>
              <span className="hidden sm:inline">({translation})</span>
            </span>
          )}
        </>
      )}
    </div>
  );
}
