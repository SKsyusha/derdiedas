'use client';

import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { SettingOutlined, BookOutlined, GlobalOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Language } from '../types';
import Logo from './Logo';
import { useTheme } from './ThemeProvider';

interface TrainerHeaderProps {
  isMobile: boolean;
  onSettingsClick: () => void;
  onDictionaryClick: () => void;
  onLanguageChange: (language: Language) => void;
}

export default function TrainerHeader({
  isMobile,
  onSettingsClick,
  onDictionaryClick,
  onLanguageChange,
}: TrainerHeaderProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mb-4 sm:mb-6 flex flex-row sm:flex-row justify-between items-center gap-3 sm:gap-0">
      <Logo size="large" className="hidden sm:flex" />
      <Logo size="medium" className="sm:hidden" hideTrainer />
      <div className="flex flex-wrap gap-2 justify-end">
        {/* Theme toggle */}
        <Button
          icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          style={isMobile ? { width: 40, height: 40, padding: 0 } : undefined}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="hidden sm:inline">
            {theme === 'dark' ? t('trainer.lightMode') : t('trainer.darkMode')}
          </span>
        </Button>
        {/* Language selector - Dropdown with text on desktop, icon on mobile */}
        <Dropdown
          menu={{
            items: [
              { key: 'ru', label: t('trainer.russian') },
              { key: 'en', label: t('trainer.english') },
              { key: 'uk', label: t('trainer.ukrainian') },
              { key: 'de', label: t('trainer.german') },
            ] as MenuProps['items'],
            onClick: ({ key }) => {
              i18n.changeLanguage(key);
              const translationLanguage: Language =
                key === 'ru' ? 'Russian' : key === 'uk' ? 'Ukrainian' : key === 'de' ? 'German' : 'English';
              onLanguageChange(translationLanguage);
            },
            selectedKeys: [i18n.language],
          }}
          trigger={['click']}
        >
          <Button
            icon={<GlobalOutlined />}
            style={isMobile ? { width: 40, height: 40, padding: 0 } : undefined}
          >
            <span className="hidden sm:inline">
              {i18n.language === 'ru' ? t('trainer.russian') : i18n.language === 'uk' ? t('trainer.ukrainian') : i18n.language === 'de' ? t('trainer.german') : t('trainer.english')}
            </span>
          </Button>
        </Dropdown>
        <Button
          icon={<BookOutlined />}
          onClick={onDictionaryClick}
          style={isMobile ? { width: 40, height: 40, padding: 0 } : undefined}
        >
          <span className="hidden sm:inline">{t('trainer.myDictionary')}</span>
        </Button>
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={onSettingsClick}
          style={isMobile ? { width: 40, height: 40, padding: 0 } : undefined}
        >
          <span className="hidden sm:inline">{t('trainer.settings')}</span>
        </Button>
      </div>
    </div>
  );
}
