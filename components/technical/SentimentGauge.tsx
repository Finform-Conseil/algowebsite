'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface SentimentGaugeProps {
  buyPercent: number;
  holdPercent: number;
  sellPercent: number;
}

export default function SentimentGauge({ buyPercent, holdPercent, sellPercent }: SentimentGaugeProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Calculer le score global (0-100, où 100 = 100% Buy)
    const score = buyPercent - sellPercent;

    const option: echarts.EChartsOption = {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: -100,
          max: 100,
          center: ['50%', '75%'],
          radius: '120%',
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.3, '#dc3545'],
                [0.5, '#FF9F04'],
                [1, '#28a745'],
              ],
            },
          },
          pointer: {
            icon: 'path://M2090.36389,615.30999 L2090.36389,615.30999 C2091.48372,615.30999 2092.40383,616.194028 2092.44859,617.312956 L2096.90698,728.755929 C2097.05155,732.369577 2094.2393,735.416212 2090.62566,735.56078 C2090.53845,735.564269 2090.45117,735.566014 2090.36389,735.566014 L2090.36389,735.566014 C2086.74736,735.566014 2083.81557,732.63423 2083.81557,729.017692 C2083.81557,728.930412 2083.81732,728.84314 2083.82081,728.755929 L2088.2792,617.312956 C2088.32396,616.194028 2089.24407,615.30999 2090.36389,615.30999 Z',
            length: '70%',
            width: 8,
            offsetCenter: [0, '-5%'],
            itemStyle: {
              color: 'auto',
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            distance: -20,
            length: 12,
            lineStyle: {
              color: 'var(--border-color)',
              width: 2,
            },
          },
          axisLabel: {
            distance: 15,
            color: 'var(--text-secondary)',
            fontSize: 10,
            formatter: (value: number) => {
              if (value === -100) return 'Sell';
              if (value === 0) return 'Hold';
              if (value === 100) return 'Buy';
              return '';
            },
          },
          detail: {
            valueAnimation: true,
            formatter: (value: number) => {
              if (value > 30) return 'Bullish';
              if (value < -30) return 'Bearish';
              return 'Neutral';
            },
            color: 'auto',
            fontSize: 16,
            fontWeight: 700,
            offsetCenter: [0, '10%'],
          },
          data: [
            {
              value: score,
            },
          ],
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [buyPercent, holdPercent, sellPercent]);

  return (
    <div className="sentiment-gauge">
      <div ref={chartRef} style={{ width: '100%', height: '180px' }} />
      <div className="sentiment-gauge__stats">
        <div className="sentiment-stat sentiment-stat--buy">
          <span className="sentiment-stat__label">Buy</span>
          <span className="sentiment-stat__value">{buyPercent}%</span>
        </div>
        <div className="sentiment-stat sentiment-stat--hold">
          <span className="sentiment-stat__label">Hold</span>
          <span className="sentiment-stat__value">{holdPercent}%</span>
        </div>
        <div className="sentiment-stat sentiment-stat--sell">
          <span className="sentiment-stat__label">Sell</span>
          <span className="sentiment-stat__value">{sellPercent}%</span>
        </div>
      </div>
    </div>
  );
}
