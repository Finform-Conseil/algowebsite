'use client';

import TickerBar from '@/components/navigation/TickerBar';

export default function EquityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Equity-specific Ticker Bar */}
      <TickerBar type="equity" />
      {children}
    </>
  );
}
