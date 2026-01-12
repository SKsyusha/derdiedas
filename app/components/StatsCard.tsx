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
      className="stats-block sm:shadow-md sm:rounded-2xl sm:border sm:border-gray-200 sm:bg-white mb-4 sm:mb-6"
      style={{ 
        marginTop: '16px', 
        padding: '0'
      }}
    >
      <div className="sm:p-6 stats-block-inner">
        <Title level={4} className="mb-3 sm:mb-4 text-base sm:text-lg">
          {t('trainer.sessionStats')}
        </Title>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs sm:text-sm text-gray-600">{t('trainer.total')}</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.correct}</div>
            <div className="text-xs sm:text-sm text-gray-600">{t('trainer.correct')}</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.incorrect}</div>
            <div className="text-xs sm:text-sm text-gray-600">{t('trainer.incorrect')}</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
            </div>
            <div className="text-xs sm:text-sm text-gray-600">{t('trainer.accuracy')}</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.streak}</div>
            <div className="text-xs sm:text-sm text-gray-600">
              {t('trainer.streak')} ({t('trainer.bestStreak')}: {stats.bestStreak})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
