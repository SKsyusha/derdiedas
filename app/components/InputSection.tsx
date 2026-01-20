'use client';

import { Input, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface InputSectionProps {
  inputRef: React.RefObject<any>;
  userInput: string;
  onInputChange: (value: string) => void;
  onCheck: () => void;
  onNextWord: () => void;
  feedback: 'correct' | 'incorrect' | 'invalid' | null;
  isMobile: boolean;
  disabled?: boolean;
}

export default function InputSection({
  inputRef,
  userInput,
  onInputChange,
  onCheck,
  onNextWord,
  feedback,
  isMobile,
  disabled = false,
}: InputSectionProps) {
  const { t } = useTranslation();
  const [shouldShake, setShouldShake] = useState(false);

  // Trigger shake animation when invalid input
  useEffect(() => {
    if (feedback === 'invalid') {
      setShouldShake(true);
      const timer = setTimeout(() => {
        setShouldShake(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  return (
    <>
      <div className="mb-4 sm:px-2">
        <Input
          ref={inputRef}
          size="large"
          value={userInput}
          onChange={(e) => onInputChange(e.target.value)}
          onPressEnter={onCheck}
          placeholder={t('trainer.enterArticle')}
          className={`w-full text-lg sm:text-2xl ${
            feedback === 'correct'
              ? 'border-green-500'
              : feedback === 'incorrect' || feedback === 'invalid'
              ? 'border-red-500'
              : ''
          } ${shouldShake ? 'shake' : ''}`}
          status={feedback === 'invalid' ? 'error' : undefined}
          style={{
            fontSize: '1.125rem',
            height: '52px',
            textAlign: 'center',
          }}
        />
      </div>

      <div className="sm:px-2">
        <div className="flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-2 w-full">
          {/* Кнопка "Следующее слово" для десктопа (слева от Check) */}
          {!isMobile && (
            <Button
              onMouseDown={(e) => {
                // Предотвращаем потерю фокуса с input (чтобы не "воровать" фокус)
                e.preventDefault();
              }}
              onClick={() => {
                onNextWord();
              }}
              className="w-full sm:w-auto"
              style={{
                paddingLeft: '32px',
                paddingRight: '32px',
              }}
            >
              {t('trainer.nextWord')}
            </Button>
          )}

          <Button
            type="primary"
            htmlType="button"
            onMouseDown={(e) => {
              // Предотвращаем потерю фокуса с input (чтобы клавиатура не закрывалась)
              e.preventDefault();
            }}
            onClick={() => {
              const shouldRestoreFocus = (() => {
                if (typeof document === 'undefined') return false;
                const activeEl = document.activeElement;
                const inputEl =
                  inputRef.current?.input ??
                  inputRef.current?.resizableTextArea?.textArea ??
                  null;
                return Boolean(activeEl && inputEl && activeEl === inputEl);
              })();

              onCheck();
              // На мобильных возвращаем фокус на input после клика
              if (isMobile && shouldRestoreFocus) {
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 50);
              }
            }}
            disabled={disabled}
            className="w-full sm:w-auto"
            style={{
              backgroundColor: '#8b5cf6',
              borderColor: '#8b5cf6',
              color: '#ffffff',
              paddingLeft: '32px',
              paddingRight: '32px',
            }}
          >
            {t('trainer.check')}
          </Button>

          {/* Кнопка "Следующее слово" для мобильных - всегда видна */}
          {isMobile && (
            <Button 
              onMouseDown={(e) => {
                // Предотвращаем потерю фокуса с input
                e.preventDefault();
              }}
              onClick={() => {
                onNextWord();
              }}
              tabIndex={-1}
              className="w-full"
            >
              {t('trainer.nextWord')}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
