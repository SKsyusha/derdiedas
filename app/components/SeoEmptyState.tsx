'use client';

import { useTranslation } from 'react-i18next';

export default function SeoEmptyState() {
  const { t } = useTranslation();
  const insideItems = t('landing.insideItems', { returnObjects: true }) as string[];

  return (
    <section className="px-2 sm:px-4 py-4 sm:py-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center">
          <p className="text-xs sm:text-sm uppercase tracking-widest text-[color:var(--gray-text)]">
            {t('landing.kicker')}
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-[color:var(--foreground)]">
            {t('landing.title')}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[color:var(--gray-text)]">
            {t('landing.description')}
          </p>
          <div className="mt-4 text-sm text-[color:var(--gray-text)]">
            {t('landing.hint')}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-4 shadow-sm">
            <h3 className="text-base font-semibold text-[color:var(--foreground)]">
              {t('landing.howTitle')}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--gray-text)]">
              {t('landing.howText')}
            </p>
          </div>

          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-4 shadow-sm">
            <h3 className="text-base font-semibold text-[color:var(--foreground)]">
              {t('landing.insideTitle')}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-[color:var(--gray-text)]">
              {insideItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-4 shadow-sm">
          <h3 className="text-base font-semibold text-[color:var(--foreground)]">
            {t('landing.forTitle')}
          </h3>
          <p className="mt-2 text-sm text-[color:var(--gray-text)]">
            {t('landing.forText')}
          </p>
        </div>
      </div>
    </section>
  );
}
