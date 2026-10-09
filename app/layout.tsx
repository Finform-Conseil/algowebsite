import type { Metadata } from 'next';
// [TENOR 2026] Bootstrap CSS importé AVANT globals.scss.
// L'ordre est CRITIQUE : cela permet au reset SCSS global du projet d'écraser le Reboot
// de Bootstrap (protégeant ainsi le site), tout en rendant les classes Bootstrap disponibles.
import '../styles/vendor/google-fonts.css';
import '../styles/generated/technical-analysis-bootstrap.generated.css';
import '../styles/vendor/bootstrap-icons.min.css';
import '../styles/globals.scss';

export const metadata: Metadata = {
  title: 'AfriMarket - African Financial Intelligence Platform',
  description: 'Real-time data, advanced analytics and AI - connecting 6 major African stock exchanges',
};

import { AppProviders } from '@/core/presenter/components/providers/AppProvider.wrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      </head>
      <body suppressHydrationWarning>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
