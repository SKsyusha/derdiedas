'use client';

import { Button, Progress, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface ProgressBarProps {
  learned: number;
  total: number;
  percentage: number;
  hasTopics: boolean;
  onReset?: () => void;
}

export default function ProgressBar({ learned, total, percentage, hasTopics, onReset }: ProgressBarProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-2 sm:mt-4" style={{ marginBottom: '16px' }}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <Text strong className="text-xs sm:text-sm" style={{ color: 'var(--foreground)' }}>
          {hasTopics
            ? t('trainer.topicProgress', { learned, total })
            : t('trainer.allWordsProgress', { learned, total })
          }
        </Text>
        <Button
          type="link"
          size="small"
          onClick={onReset}
          className="p-0 h-auto"
          style={{ color: 'var(--purple-primary)' }}
        >
          {t('trainer.resetProgress')}
        </Button>
      </div>
      <Progress 
        percent={percentage} 
        strokeColor={{
          '0%': '#8b5cf6',
          '100%': '#6366f1',
        }}
        railColor="var(--gray-border)"
        showInfo={true}
      />
    </div>
  );
}
