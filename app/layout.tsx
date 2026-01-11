import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider, theme } from "antd";
import "antd/dist/reset.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DerDieDas Trainer - Тренажёр артиклей немецкого языка",
  description: "Интерактивный тренажёр для автоматизации правильного выбора артиклей der / die / das в немецком языке",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
