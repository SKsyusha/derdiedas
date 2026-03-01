import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Der Die Das Übungen – Kostenlose Artikel-Übungen online',
  description:
    'Der, die, das Übungen mit sofortiger Korrektur. Übe deutsche Artikel mit über 1000 Wörtern aus dem Goethe A1/A2-Wortschatz. Ideal für Anfänger und A1/A2-Vorbereitung.',
  keywords: [
    'der die das Übungen',
    'Artikel Übungen',
    'der die das üben',
    'deutsche Artikel Übungen',
    'der die das online üben',
    'Goethe A1 A2 Artikel',
  ],
  alternates: { canonical: 'https://derdiedas-trainer.de/uebungen' },
  openGraph: {
    title: 'Der Die Das Übungen – Kostenlose Artikel-Übungen',
    description:
      'Übe der, die, das mit über 1000 Wörtern aus Goethe A1/A2. Sofortige Korrektur, Fortschrittsanzeige, kostenlos.',
    url: 'https://derdiedas-trainer.de/uebungen',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://derdiedas-trainer.de' },
    { '@type': 'ListItem', position: 2, name: 'Der Die Das Übungen', item: 'https://derdiedas-trainer.de/uebungen' },
  ],
};

export default function UebungenPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="min-h-screen px-4 py-8 sm:px-6" style={{ background: 'var(--background)' }}>
        <div className="max-w-3xl mx-auto">
          <nav className="text-sm mb-6" style={{ color: 'var(--gray-text)' }}>
            <Link href="/" className="underline hover:opacity-80">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Der Die Das Übungen</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
            Der Die Das Übungen
          </h1>
          <p className="mt-4 text-lg" style={{ color: 'var(--gray-text)' }}>
            Mit unseren <strong>der-die-das-Übungen</strong> trainierst du die deutschen Artikel gezielt und mit
            sofortiger Rückmeldung. Der Wortschatz basiert auf dem offiziellen Goethe A1- und A2-Wortschatz – ideal
            für die Prüfungsvorbereitung und den Alltag.
          </p>

          <section className="mt-8 space-y-4" style={{ color: 'var(--foreground)' }}>
            <h2 className="text-xl font-semibold">Was du übst</h2>
            <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--gray-text)' }}>
              <li>Bestimmte Artikel (der, die, das) zu Nomen zuordnen</li>
              <li>Optional: unbestimmte Artikel (ein, eine) und andere Begleiter</li>
              <li>Übung im Satz oder nur zum Nomen</li>
              <li>Fortschritt und Statistik pro Session</li>
            </ul>
          </section>

          <section className="mt-8">
            <p className="mb-4" style={{ color: 'var(--gray-text)' }}>
              Die Übungen sind kostenlos, ohne Anmeldung und im Browser nutzbar. Du kannst zusätzlich eigene
              Wörterlisten anlegen oder importieren.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg font-medium text-white"
              style={{ backgroundColor: 'var(--purple-primary)' }}
            >
              Jetzt üben →
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
