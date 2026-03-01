import type { Metadata } from 'next';
import SupportPageContent from '../components/SupportPageContent';

export const metadata: Metadata = {
  title: 'Support – Der Die Das Trainer',
  description:
    'Support, Datenschutz und Nutzungsbedingungen für den Der-Die-Das-Trainer. Beschreibung der App, Screenshots und Kontakt.',
  keywords: ['Support', 'Kontakt', 'Der Die Das Trainer', 'Datenschutz', 'Nutzungsbedingungen'],
  alternates: { canonical: 'https://derdiedas-trainer.de/support' },
  openGraph: {
    title: 'Support – Der Die Das Trainer',
    description: 'Support, Datenschutz und Nutzungsbedingungen. Beschreibung der App und Kontakt.',
    url: 'https://derdiedas-trainer.de/support',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://derdiedas-trainer.de' },
    { '@type': 'ListItem', position: 2, name: 'Support', item: 'https://derdiedas-trainer.de/support' },
  ],
};

export default function SupportPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SupportPageContent />
    </>
  );
}
