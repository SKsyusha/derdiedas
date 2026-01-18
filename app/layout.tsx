import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider } from "antd";
import { Analytics } from "@vercel/analytics/next";
import "antd/dist/reset.css";
import "./globals.css";
import I18nProvider from "./components/I18nProvider";
import BuyMeACoffee from "./components/BuyMeACoffee";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DerDieDas Trainer - Learn German Articles der/die/das",
  description: "Free interactive trainer to master German articles der, die, das. Practice with 1000+ words from official Goethe A1/A2 vocabulary. Track your progress and learn faster!",
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
    title: "DerDieDas Trainer - Learn German Articles der/die/das",
    description: "Free interactive trainer to master German articles. Practice with 1000+ words from Goethe A1/A2 vocabulary.",
    siteName: "DerDieDas Trainer",
  },
  twitter: {
    card: "summary_large_image",
    title: "DerDieDas Trainer - Learn German Articles",
    description: "Master German articles der/die/das with our free interactive trainer. 1000+ words from Goethe vocabulary.",
  },
  alternates: {
    canonical: "https://derdiedas-trainer.de",
  },
  category: "Education",
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
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#8b5cf6', // Purple/violet primary color
              colorBgContainer: '#ffffff',
              colorBgElevated: '#ffffff',
              borderRadius: 12,
              colorBorder: '#e5e7eb',
              colorText: '#171717',
            },
            components: {
              Button: {
                borderRadius: 8,
                controlHeight: 40,
                primaryColor: '#ffffff',
              },
              Card: {
                borderRadius: 16,
                paddingLG: 24,
              },
              Drawer: {
                colorBgElevated: '#ffffff',
              },
              Input: {
                borderRadius: 8,
                controlHeight: 40,
                colorBorder: '#e5e7eb',
              },
              Select: {
                borderRadius: 8,
                controlHeight: 40,
              },
            },
          }}
        >
          <I18nProvider>
            {children}
          </I18nProvider>
        </ConfigProvider>
        <BuyMeACoffee />
        <Analytics />
      </body>
    </html>
  );
}
