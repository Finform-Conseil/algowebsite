import type { Metadata } from 'next';
import '../styles/globals.scss';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import Navbar from '@/components/navigation/Navbar';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'AfriMarket - African Financial Intelligence Platform',
  description: 'Real-time data, advanced analytics and AI - connecting 6 major African stock exchanges',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Fraunces:ital,wght@0,300;0,700;1,300&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navbar />
        {/* <ThemeSwitcher /> */}
        {children}
      </body>
    </html>
  );
}
