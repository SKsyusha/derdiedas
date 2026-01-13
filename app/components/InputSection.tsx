'use client';

import { Input, Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface InputSectionProps {
  inputRef: React.RefObject<any>;
  userInput: string;
  onInputChange: (value: string) => void;
  onCheck: () => void;
  onNextWord: () => void;
  feedback: 'correct' | 'incorrect' | null;
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
              : feedback === 'incorrect'
              ? 'border-red-500'
              : ''
          }`}
          style={{
            fontSize: '1.125rem',
            height: '52px',
            textAlign: 'center',
          }}
        />
      </div>

      <div className="sm:px-2">
        <div className="flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-2 w-full">
          <Button
            type="primary"
            htmlType="button"
            onClick={() => {
              onCheck();
              // На мобильных возвращаем фокус на input после клика
              if (isMobile) {
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
