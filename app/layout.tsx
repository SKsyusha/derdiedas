import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "antd/dist/reset.css";
import "./globals.css";
import I18nProvider from "./components/I18nProvider";
import BuyMeACoffee from "./components/BuyMeACoffee";
import { ThemeProvider } from "./components/ThemeProvider";
import AntConfigProvider from "./components/AntConfigProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://derdiedas-trainer.de"),
  title: "DerDieDas Trainer - German Article Trainer (der/die/das)",
  description: "Practice German articles der/die/das with an interactive trainer. 1000+ words from Goethe A1/A2, instant feedback, progress tracking, and custom word lists.",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  keywords: [
    "German articles",
    "der die das",
    "learn German",
    "German grammar",
    "Goethe A1",
    "Goethe A2",
    "German vocabulary",
    "German trainer",
    "German practice",
    "Deutsche Artikel",
    "Deutsch lernen",
    "German gender",
    "noun gender German",
  ],
  authors: [{ name: "DerDieDas Trainer" }],
  creator: "DerDieDas Trainer",
  publisher: "DerDieDas Trainer",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://derdiedas-trainer.de",
    title: "DerDieDas Trainer - German Article Trainer (der/die/das)",
    description: "Interactive German article trainer with 1000+ Goethe A1/A2 words, instant feedback, and progress tracking.",
    siteName: "DerDieDas Trainer",
    images: [
      {
        url: "https://derdiedas-trainer.de/og.png",
        width: 1200,
        height: 630,
        alt: "DerDieDas Trainer",
      },
      {
        url: "https://derdiedas-trainer.de/og.svg",
        width: 1200,
        height: 630,
        alt: "DerDieDas Trainer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DerDieDas Trainer - German Article Trainer",
    description: "Practice der/die/das with 1000+ Goethe A1/A2 words, instant feedback, and progress tracking.",
    images: ["https://derdiedas-trainer.de/og.png"],
  },
  alternates: {
    canonical: "https://derdiedas-trainer.de",
  },
  category: "Education",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/android/mipmap-xxxhdpi/ic_launcher.png", sizes: "192x192", type: "image/png" },
      { url: "/Assets.xcassets/AppIcon.appiconset/1024.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico?v=2" }],
    apple: [
      { url: "/Assets.xcassets/AppIcon.appiconset/180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DerDieDas Trainer",
  },
};

// JSON-LD structured data for SEO and AI assistants
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DerDieDas Trainer",
  description: "Free interactive trainer to master German articles der, die, das. Practice with 1000+ words from official Goethe A1/A2 vocabulary.",
  url: "https://derdiedas-trainer.de",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Practice German articles (der, die, das)",
    "1000+ words from Goethe A1/A2 vocabulary",
    "Multiple training modes",
    "Progress tracking",
    "Support for Russian, English, Ukrainian translations",
    "Custom vocabulary lists",
  ],
  inLanguage: ["en", "de", "ru", "uk"],
  isAccessibleForFree: true,
  educationalLevel: "Beginner to Intermediate",
  learningResourceType: "Interactive exercise",
  teaches: "German grammar - noun genders and articles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DerDieDas Trainer" />
        <link rel="apple-touch-icon" href="/Assets.xcassets/AppIcon.appiconset/180.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/Assets.xcassets/AppIcon.appiconset/180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/Assets.xcassets/AppIcon.appiconset/152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/Assets.xcassets/AppIcon.appiconset/120.png" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#ffffff" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = document.cookie.match(/theme=([^;]+)/)?.[1];
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                  // Set iOS status bar color based on theme
                  var metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
                  if (metaStatusBar) {
                    metaStatusBar.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default');
                  }
                  
                  // Update theme-color meta tag for PWA
                  var themeColorMeta = document.querySelector('meta[name="theme-color"]');
                  if (themeColorMeta) {
                    themeColorMeta.setAttribute('content', theme === 'dark' ? '#0f0f0f' : '#ffffff');
                  } else {
                    var meta = document.createElement('meta');
                    meta.name = 'theme-color';
                    meta.content = theme === 'dark' ? '#0f0f0f' : '#ffffff';
                    document.getElementsByTagName('head')[0].appendChild(meta);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AntConfigProvider>
            <I18nProvider>
              {children}
            </I18nProvider>
          </AntConfigProvider>
        </ThemeProvider>
        <BuyMeACoffee />
        <Analytics />
      </body>
    </html>
  );
}
