'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import i18n from '../i18n';
import { getCookie, setCookie } from '../utils/cookies';
import ScreenshotCarousel from './ScreenshotCarousel';
import Logo from './Logo';

const SETTINGS_COOKIE_NAME = 'training_settings';

const linkClass =
  'underline hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--purple-primary)] rounded';

const cardBase =
  'rounded-2xl border p-5 sm:p-6 flex flex-col min-h-[160px] transition-colors hover:border-[color:var(--purple-primary)]/50 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[var(--purple-primary)]';

function syncLanguageToCookie(lang: string) {
  try {
    const raw = getCookie(SETTINGS_COOKIE_NAME);
    const settings = raw ? JSON.parse(raw) : {};
    const language =
      lang === 'ru' ? 'Russian' : lang === 'uk' ? 'Ukrainian' : lang === 'de' ? 'German' : 'English';
    setCookie(SETTINGS_COOKIE_NAME, JSON.stringify({ ...settings, language }));
  } catch {
    // ignore
  }
}

export default function SupportPageContent() {
  const { t } = useTranslation();

  const languageMenuItems: MenuProps['items'] = [
    { key: 'en', label: t('trainer.english') },
    { key: 'ru', label: t('trainer.russian') },
    { key: 'uk', label: t('trainer.ukrainian') },
    { key: 'de', label: t('trainer.german') },
  ];

  const currentLanguageLabel =
    i18n.language === 'ru'
      ? t('trainer.russian')
      : i18n.language === 'uk'
        ? t('trainer.ukrainian')
        : i18n.language === 'de'
          ? t('trainer.german')
          : t('trainer.english');

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Section 1: Logo, language, app description */}
      <section>
        <header className="sticky top-0 z-10" style={{ background: 'var(--background)' }}>
          <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4 flex justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center min-w-0">
              <Logo size="large" className="hidden sm:flex" />
              <Logo size="medium" className="sm:hidden" hideTrainer />
            </div>
            <nav className="text-sm flex-1 flex items-center justify-center min-w-0" style={{ color: 'var(--gray-text)' }} aria-label="Breadcrumb">
              <Link href="/" className={linkClass} style={{ color: 'var(--purple-primary)' }}>
                {t('support.breadcrumbHome')}
              </Link>
              <span className="mx-1.5" aria-hidden>/</span>
              <span style={{ color: 'var(--foreground)' }}>{t('support.title')}</span>
            </nav>
            <Dropdown
              menu={{
                items: languageMenuItems,
                onClick: ({ key }) => {
                  i18n.changeLanguage(key);
                  syncLanguageToCookie(key);
                },
                selectedKeys: [i18n.language],
              }}
              trigger={['click']}
            >
              <Button icon={<GlobalOutlined />}>
                <span className="hidden sm:inline">{currentLanguageLabel}</span>
              </Button>
            </Dropdown>
          </div>
        </header>
        <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-8 sm:py-12 text-center">
          <p className="text-base sm:text-lg leading-relaxed max-w-5xl mx-auto" style={{ color: 'var(--gray-text)' }}>
            {t('support.appDescription')}
          </p>
        </div>
      </section>

      {/* Section 2: Screenshots */}
      <section className="w-full max-w-6xl mx-auto px-3 sm:px-4 pt-12 sm:pt-16 pb-6 sm:pb-8">
        <h2 id="support-screenshots-heading" className="text-center text-lg font-semibold mb-6 sm:mb-8" style={{ color: 'var(--foreground)' }}>
          {t('support.screenshotsTitle')}
        </h2>
        <ScreenshotCarousel />
      </section>

      {/* Section 3: Kontakt & Rechtliches */}
      <section className="pt-6 sm:pt-8 pb-14">
        <div className="max-w-4xl mx-auto w-full px-3 sm:px-4">
          <h2 className="text-center text-lg font-semibold mb-6" style={{ color: 'var(--foreground)' }}>
            {t('footer.contactAndLegal')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className={cardBase} style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <h3 className="font-semibold text-[15px]" style={{ color: 'var(--foreground)' }}>
              {t('footer.support')}
            </h3>
            <p className="mt-2 text-sm flex-1" style={{ color: 'var(--gray-text)' }}>
              {t('footer.supportDesc')}
            </p>
            <a
              href="mailto:mobileapp.assist@gmail.com"
              className={linkClass + ' mt-3 text-[15px] font-medium inline-block'}
              style={{ color: 'var(--purple-primary)' }}
            >
              mobileapp.assist@gmail.com
            </a>
          </div>

          <Link
            href="/privacy-policy"
            className={cardBase + ' no-underline'}
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'inherit' }}
          >
            <h3 className="font-semibold text-[15px]" style={{ color: 'var(--foreground)' }}>
              {t('footer.privacyPolicy')}
            </h3>
            <p className="mt-2 text-sm flex-1" style={{ color: 'var(--gray-text)' }}>
              {t('footer.privacyDesc')}
            </p>
            <span className={linkClass + ' mt-3 text-[15px] font-medium inline-block'} style={{ color: 'var(--purple-primary)' }}>
              {t('footer.privacyPolicy')} →
            </span>
          </Link>

          <Link
            href="/terms-of-use"
            className={cardBase + ' no-underline'}
            style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'inherit' }}
          >
            <h3 className="font-semibold text-[15px]" style={{ color: 'var(--foreground)' }}>
              {t('footer.termsOfUse')}
            </h3>
            <p className="mt-2 text-sm flex-1" style={{ color: 'var(--gray-text)' }}>
              {t('footer.termsDesc')}
            </p>
            <span className={linkClass + ' mt-3 text-[15px] font-medium inline-block'} style={{ color: 'var(--purple-primary)' }}>
              {t('footer.termsOfUse')} →
            </span>
          </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
