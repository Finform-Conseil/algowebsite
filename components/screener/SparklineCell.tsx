'use client';

import { ShortCoursEntity } from '@/core/domain/entities/cours.entity';

interface SparklineCellProps {
  data?: ShortCoursEntity[];
  width?: number;
  height?: number;
}

export default function SparklineCell({
  data,
  width = 80,
  height = 30,
}: SparklineCellProps) {
  if (!data || data.length < 2) {
    return <span className="sparkline-empty">—</span>;
  }

  const closes = data.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const points = closes
    .map((value, index) => {
      const x = (index / (closes.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const firstValue = closes[0];
  const lastValue = closes[closes.length - 1];
  const isPositive = lastValue >= firstValue;
  const color = isPositive ? 'var(--positive-color, #10b981)' : 'var(--negative-color, #ef4444)';

  return (
    <svg
      width={width}
      height={height}
      className="sparkline-cell"
      role="img"
      aria-label="Price trend"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
