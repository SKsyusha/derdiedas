'use client';

import { Progress, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface ProgressBarProps {
  learned: number;
  total: number;
  percentage: number;
  hasTopics: boolean;
}

export default function ProgressBar({ learned, total, percentage, hasTopics }: ProgressBarProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-2 sm:mt-4" style={{ marginBottom: '16px' }}>
      <div className="mb-2">
        <Text strong className="text-xs sm:text-sm">
          {hasTopics
            ? t('trainer.topicProgress', { learned, total })
            : t('trainer.allWordsProgress', { learned, total })
          }
        </Text>
      </div>
      <Progress 
        percent={percentage} 
        strokeColor={{
          '0%': '#8b5cf6',
          '100%': '#6366f1',
        }}
        showInfo={true}
      />
    </div>
  );
}
