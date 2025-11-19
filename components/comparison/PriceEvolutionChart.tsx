'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ComparisonStock } from '@/core/data/StockComparison';

interface PriceEvolutionChartProps {
  stocks: ComparisonStock[];
  height?: string;
}

const COLORS = ['#00BFFF', '#FF9F04', '#4ade80', '#f87171', '#a78bfa', '#fb923c'];

export default function PriceEvolutionChart({ stocks, height = '350px' }: PriceEvolutionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || stocks.length === 0) return;

    const chart = echarts.init(chartRef.current);

    const xAxisData = stocks[0].priceHistory.map((_, index) => `M${index + 1}`);

    const series = stocks.map((stock, index) => ({
      name: stock.ticker,
      type: 'line' as const,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: stock.priceHistory,
      lineStyle: {
        width: 2.5,
        color: COLORS[index % COLORS.length],
      },
      itemStyle: {
        color: COLORS[index % COLORS.length],
      },
      emphasis: {
        focus: 'series' as const,
        lineStyle: {
          width: 3.5,
        },
      },
    }));

    const option: echarts.EChartsOption = {
      title: {
        text: 'Évolution des Prix',
        left: 'center',
        textStyle: {
          color: 'var(--text-color)',
          fontSize: 16,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--border-color)',
        textStyle: {
          color: 'var(--text-color)',
        },
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: 'var(--primary-color)',
          },
        },
        formatter: (params: any) => {
          let result = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach((param: any) => {
            const stock = stocks.find((s) => s.ticker === param.seriesName);
            result += `${param.marker} ${param.seriesName}: ${param.value.toFixed(2)} ${stock?.currency || ''}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: stocks.map((s) => s.ticker),
        bottom: 10,
        textStyle: {
          color: 'var(--text-color)',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
        axisLabel: {
          color: 'var(--text-secondary)',
        },
        axisLine: {
          lineStyle: {
            color: 'var(--border-color)',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: 'Prix',
        nameTextStyle: {
          color: 'var(--text-secondary)',
        },
        axisLabel: {
          color: 'var(--text-secondary)',
          formatter: (value: number) => value.toFixed(0),
        },
        axisLine: {
          lineStyle: {
            color: 'var(--border-color)',
          },
        },
        splitLine: {
          lineStyle: {
            color: 'var(--border-color)',
            type: 'dashed',
          },
        },
      },
      series,
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [stocks]);

  if (stocks.length === 0) {
    return (
      <div className="price-evolution-empty" style={{ height }}>
        <p>Sélectionnez des actions pour voir l'évolution des prix</p>
      </div>
    );
  }

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}
