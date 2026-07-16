import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getMessages } from 'next-intl/server';
import Navbar from '@/components/navigation/Navbar';
import SessionProviderWrapper from '@/core/infra/auth/sessionProvider';
import StoreProvider from '@/core/infra/store/StoreProvider';
import CurrencyInitializer from '@/components/currency/CurrencyInitializer';
import { GlobalNotificationProvider } from '@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext';
import { TickerSelectorProvider } from '@/components/design-system/commons/TickerSelectorModal';

export const metadata: Metadata = {
  title: 'AfriMarket - African Financial Intelligence Platform',
  description: 'Real-time data, advanced analytics and AI - connecting 6 major African stock exchanges',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Fraunces:ital,wght@0,300;0,700;1,300&display=swap" rel="stylesheet" />
      </head>
      <body>
        <StoreProvider>
          <SessionProviderWrapper>
            <TickerSelectorProvider>
            <GlobalNotificationProvider>
            <NextIntlClientProvider messages={messages}>
              <CurrencyInitializer />
              <Navbar />
              {children}
            </NextIntlClientProvider>
            </GlobalNotificationProvider>
            </TickerSelectorProvider>
          </SessionProviderWrapper>
        </StoreProvider>
      </body>
    </html>
  );
}
