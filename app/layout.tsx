import type { Metadata } from 'next';
// [TENOR 2026] Bootstrap CSS importé AVANT globals.scss.
// L'ordre est CRITIQUE : cela permet au reset SCSS global du projet d'écraser le Reboot
// de Bootstrap (protégeant ainsi le site), tout en rendant les classes Bootstrap disponibles.
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/vendor/bootstrap-icons.min.css';
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
      <body suppressHydrationWarning>
        <AppProviders>
          <Navbar />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
