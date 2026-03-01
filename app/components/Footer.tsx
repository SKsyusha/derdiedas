'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const linkClass =
  'underline hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--purple-primary)] rounded';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto py-4 px-4 text-center text-sm" style={{ color: 'var(--gray-text)' }}>
      <nav aria-label={t('footer.contactAndLegal')}>
        <Link href="/support" className={linkClass}>
          {t('footer.support')}
        </Link>
        <span className="mx-2" aria-hidden>·</span>
        <Link href="/privacy-policy" className={linkClass}>
          {t('footer.privacyPolicy')}
        </Link>
        <span className="mx-2" aria-hidden>·</span>
        <Link href="/terms-of-use" className={linkClass}>
          {t('footer.termsOfUse')}
        </Link>
      </nav>
    </footer>
  );
}
