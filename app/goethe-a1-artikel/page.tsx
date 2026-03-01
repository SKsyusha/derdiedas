import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Goethe A1 Artikel – Der Die Das üben für die Prüfung',
  description:
    'Goethe A1 Artikel trainieren: Übungen zu der, die, das mit dem offiziellen A1-Wortschatz. Kostenlos, sofortige Korrektur, ideal zur Goethe-Zertifikat A1 Vorbereitung.',
  keywords: [
    'Goethe A1 Artikel',
    'Goethe A1 der die das',
    'Goethe Zertifikat A1 Artikel',
    'A1 Wortschatz Artikel üben',
    'Goethe A1 Grammatik Artikel',
  ],
  alternates: { canonical: 'https://derdiedas-trainer.de/goethe-a1-artikel' },
  openGraph: {
    title: 'Goethe A1 Artikel – Der Die Das üben',
    description:
      'Trainiere die Artikel fürs Goethe-Zertifikat A1 mit dem offiziellen Wortschatz. Kostenlos und mit sofortiger Korrektur.',
    url: 'https://derdiedas-trainer.de/goethe-a1-artikel',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://derdiedas-trainer.de' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Goethe A1 Artikel',
      item: 'https://derdiedas-trainer.de/goethe-a1-artikel',
    },
  ],
};

export default function GoetheA1ArtikelPage() {
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
            <span>Goethe A1 Artikel</span>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
            Goethe A1 Artikel
          </h1>
          <p className="mt-4 text-lg" style={{ color: 'var(--gray-text)' }}>
            Für das <strong>Goethe-Zertifikat A1</strong> musst du unter anderem die richtigen Artikel (der, die, das)
            zu Nomen kennen. Unser Trainer nutzt den offiziellen Goethe-A1-Wortschatz und eignet sich gut zur
            gezielten Vorbereitung auf die Prüfung.
          </p>

          <section className="mt-8 space-y-4" style={{ color: 'var(--foreground)' }}>
            <h2 className="text-xl font-semibold">Warum Artikel für A1 wichtig sind</h2>
            <p style={{ color: 'var(--gray-text)' }}>
              Im A1-Niveau lernst du grundlegende Nomen mit ihrem Artikel. In Lesen, Hören und Schreiben hilft es,
              wenn du der, die und das sicher zuordnen kannst. Regelmäßige Übungen mit dem offiziellen Wortschatz
              festigen das und bereiten dich auf typische A1-Aufgaben vor.
            </p>
          </section>

          <section className="mt-8 space-y-4" style={{ color: 'var(--foreground)' }}>
            <h2 className="text-xl font-semibold">Was du im Trainer findest</h2>
            <ul className="list-disc list-inside space-y-2" style={{ color: 'var(--gray-text)' }}>
              <li>Goethe A1-Wortschatz mit Artikeln</li>
              <li>Optional: A2 und B1 für den Aufbau</li>
              <li>Sofortige Korrektur und Aussprache (Audio)</li>
              <li>Fortschritt und Wiederholung schwieriger Wörter</li>
            </ul>
          </section>

          <section className="mt-8">
            <p className="mb-4" style={{ color: 'var(--gray-text)' }}>
              Der Trainer ist kostenlos und ohne Anmeldung nutzbar. Du kannst A1 allein oder zusammen mit A2
              auswählen und so gezielt für deine Prüfung üben.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg font-medium text-white"
              style={{ backgroundColor: 'var(--purple-primary)' }}
            >
              Goethe A1 Artikel üben →
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
