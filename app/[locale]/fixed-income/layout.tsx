'use client';

import TickerBar from '@/components/navigation/TickerBar';

export default function FixedIncomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Fixed Income-specific Ticker Bar */}
      <TickerBar type="fixed-income" />
      {children}
    </>
  );
}
