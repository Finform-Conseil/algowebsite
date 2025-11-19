import type { Metadata } from 'next';
import '../styles/globals.scss';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export const metadata: Metadata = {
  title: 'Quantum Ledger - Gestion de Portefeuille',
  description: 'Application de gestion de portefeuille d\'investissement moderne et élégante',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <ThemeSwitcher />
        {children}
      </body>
    </html>
  );
}
