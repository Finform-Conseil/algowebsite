'use client';

import TickerBar from '@/components/navigation/TickerBar';

export default function UcitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="ucits-layout">
      <TickerBar type="opcvm" />
      <div className="ucits-content">
        {children}
      </div>
    </div>
  );
}
