import type { Metadata } from 'next';
import '../styles/globals.scss';
import Navbar from '@/components/navigation/Navbar';

export const metadata: Metadata = {
  title: 'AfriMarket - African Financial Intelligence Platform',
  description: 'Real-time data, advanced analytics and AI - connecting 6 major African stock exchanges',
};

import { AppProviders } from '@/core/presentation/components/providers/AppProvider.wrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
      {/* Google Fonts — Site Global */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Fraunces:ital,wght@0,300;0,700;1,300&family=Roboto:wght@300;400;500;700&family=DM+Sans:wght@400;500;600;700&family=Mulish:wght@400;600;700&family=Lilita+One&display=swap"
        rel="stylesheet"
      />
      {/* Bootstrap Icons — requis par les composants Technical Analysis */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
      />
      </head>
      <body suppressHydrationWarning>
        <AppProviders>
          <Navbar />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
