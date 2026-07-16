'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

interface SentimentGaugeProps {
  buyPercent: number;
  holdPercent: number;
  sellPercent: number;
}

export interface SentimentGaugeParts {
  buyPercent: number;
  holdPercent: number;
  sellPercent: number;
}

export function toSentimentGaugeParts(score: number): SentimentGaugeParts {
  const normalizedScore = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 50;
  const directionalScore = Math.round(normalizedScore * 2 - 100);
  const holdPercent = Math.max(0, Math.round(100 - Math.abs(directionalScore)));

  if (directionalScore >= 0) {
    return { buyPercent: directionalScore, holdPercent, sellPercent: 0 };
  }

  return { buyPercent: 0, holdPercent, sellPercent: Math.abs(directionalScore) };
}

let modulesRegistered = false;
function ensureModulesRegistered() {
  if (modulesRegistered) return;
  modulesRegistered = true;
  echarts.use([CanvasRenderer, GaugeChart, TooltipComponent]);
}

export default function SentimentGauge({ buyPercent, holdPercent, sellPercent }: SentimentGaugeProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureModulesRegistered();
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Global score from -100 to 100, where 100 means full buy pressure.
    const score = buyPercent - sellPercent;

    const option: EChartsOption = {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: -100,
          max: 100,
          center: ['50%', '76%'],
          radius: '112%',
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
              color: 'inherit',
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            distance: -20,
            length: 12,
            lineStyle: {
              color: '#363a45',
              width: 2,
            },
          },
          axisLabel: {
            distance: 6,
            color: '#e2e8f0',
            fontSize: 11,
            fontWeight: 700,
            backgroundColor: 'rgba(8, 20, 38, 0.78)',
            borderColor: 'rgba(148, 163, 184, 0.28)',
            borderRadius: 4,
            borderWidth: 1,
            padding: [2, 5],
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
            color: 'inherit',
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
