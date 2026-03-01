'use client';

import '../i18n';
import i18n from '../i18n';

export default function I18nProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage?: string;
}) {
  if (initialLanguage && i18n.language !== initialLanguage) {
    i18n.language = initialLanguage;
  }
  return <>{children}</>;
}
