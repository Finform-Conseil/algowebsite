'use client';

import TickerBar from '@/components/navigation/TickerBar';

export default function MacroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Macro-specific Ticker Bar */}
      <TickerBar type="macro" />
      {children}
    </>
  );
}
