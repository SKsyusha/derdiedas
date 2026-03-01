'use client';

import Image from 'next/image';

const SCREENSHOTS = [
  { src: '/screenshots/screenshot-1.png', alt: 'A1–B1 Wortliste' },
  { src: '/screenshots/screenshot-2.png', alt: 'Übung Kleidung' },
  { src: '/screenshots/screenshot-3.png', alt: 'Eigene Wörter importieren' },
  { src: '/screenshots/screenshot-4.png', alt: 'Fortschritt im Überblick' },
  { src: '/screenshots/screenshot-5.png', alt: 'Thematische Wortlisten' },
  { src: '/screenshots/screenshot-6.png', alt: 'Aktives Training' },
  { src: '/screenshots/screenshot-7.png', alt: 'Artikel eingeben' },
  { src: '/screenshots/screenshot-8.png', alt: 'Einstellungen' },
];

export default function ScreenshotCarousel() {
  return (
    <section className="overflow-hidden" aria-label="App-Screenshots">
      <div className="overflow-x-auto scroll-smooth py-6 px-2 sm:py-10 sm:px-4">
        <ul className="flex gap-6 sm:gap-8 list-none p-0 m-0 w-max min-w-full">
          {SCREENSHOTS.map(({ src, alt }, i) => (
            <li key={i} className="flex-shrink-0 w-[240px] sm:w-[280px]">
              <Image
                src={src}
                alt={alt}
                width={300}
                height={600}
                className="w-full h-auto block rounded-lg"
                sizes="(max-width: 640px) 240px, 280px"
                priority={i < 4}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
