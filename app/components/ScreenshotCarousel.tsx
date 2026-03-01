'use client';

import { useState } from 'react';
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

const VISIBLE = 4;
const PHONE_FRAME = '#374151';

export default function ScreenshotCarousel() {
  const [start, setStart] = useState(0);
  const maxStart = Math.max(0, SCREENSHOTS.length - VISIBLE);
  const visibleItems = SCREENSHOTS.slice(start, start + VISIBLE);

  return (
    <section
      className="rounded-2xl py-6 sm:py-8 px-4"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      aria-label="App-Screenshots"
    >
      <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => setStart((s) => Math.max(0, s - 1))}
          disabled={start === 0}
          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--purple-primary)]"
          style={{ borderColor: 'var(--card-border)', background: 'var(--background)' }}
          aria-label="Previous"
        >
          <span className="text-lg" aria-hidden>←</span>
        </button>

        <ul className="flex-1 flex gap-4 sm:gap-6 justify-center list-none p-0 m-0 min-w-0">
          {visibleItems.map(({ src, alt }, i) => (
            <li
              key={start + i}
              className="flex-shrink-0 w-[140px] sm:w-[160px] flex justify-center"
              style={{ transform: `rotate(${(start + i) % 2 === 0 ? -2 : 2}deg)` }}
            >
              <div
                className="relative w-full rounded-[1.5rem] overflow-hidden border-[6px] sm:border-[8px] shadow-md"
                style={{
                  borderColor: PHONE_FRAME,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <Image
                  src={src}
                  alt={alt}
                  width={160}
                  height={320}
                  className="w-full h-auto block"
                  sizes="160px"
                  priority={start + i < 4}
                />
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setStart((s) => Math.min(maxStart, s + 1))}
          disabled={start >= maxStart}
          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--purple-primary)]"
          style={{ borderColor: 'var(--card-border)', background: 'var(--background)' }}
          aria-label="Next"
        >
          <span className="text-lg" aria-hidden>→</span>
        </button>
      </div>
    </section>
  );
}
