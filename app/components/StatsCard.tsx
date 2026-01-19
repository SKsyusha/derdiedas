'use client';

import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { SessionStats } from '../types';

const { Title } = Typography;

interface StatsCardProps {
  stats: SessionStats;
}

export default function StatsCard({ stats }: StatsCardProps) {
  const { t } = useTranslation();

  return (
    <div 
      className="stats-block sm:shadow-md sm:rounded-2xl sm:border mb-4 sm:mb-6"
      style={{ 
        marginTop: '16px', 
        padding: '0',
        borderColor: 'var(--card-border)',
        background: 'var(--card-bg)'
      }}
    >
      <div className="sm:p-6 stats-block-inner">
        <Title level={4} className="mb-3 sm:mb-4 text-base sm:text-lg" style={{ color: 'var(--foreground)' }}>
          {t('trainer.sessionStats')}
        </Title>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{stats.total}</div>
            <div className="text-xs sm:text-sm" style={{ color: 'var(--gray-text)' }}>{t('trainer.total')}</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--success)' }}>{stats.correct}</div>
            <div className="text-xs sm:text-sm" style={{ color: 'var(--gray-text)' }}>{t('trainer.correct')}</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--error)' }}>{stats.incorrect}</div>
            <div className="text-xs sm:text-sm" style={{ color: 'var(--gray-text)' }}>{t('trainer.incorrect')}</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
              {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
            </div>
            <div className="text-xs sm:text-sm" style={{ color: 'var(--gray-text)' }}>{t('trainer.accuracy')}</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--purple-primary)' }}>{stats.streak}</div>
            <div className="text-xs sm:text-sm" style={{ color: 'var(--gray-text)' }}>
              {t('trainer.streak')} ({t('trainer.bestStreak')}: {stats.bestStreak})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
