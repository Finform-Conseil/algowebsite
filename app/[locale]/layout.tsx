import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getMessages } from 'next-intl/server';
import Navbar from '@/components/navigation/Navbar';
import SessionProviderWrapper from '@/core/infra/auth/sessionProvider';
import CurrencyInitializer from '@/components/currency/CurrencyInitializer';

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
    <SessionProviderWrapper>
      <NextIntlClientProvider messages={messages}>
        <CurrencyInitializer />
        <Navbar />
        {children}
      </NextIntlClientProvider>
    </SessionProviderWrapper>
  );
}
