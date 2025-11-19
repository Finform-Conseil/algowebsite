'use client';

import { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ComparisonStock, Indicator } from '@/core/data/StockComparison';

interface IndicatorChartPopupProps {
  indicator: Indicator;
  stocks: ComparisonStock[];
  children: React.ReactNode;
}

const COLORS = ['#00BFFF', '#FF9F04', '#4ade80', '#f87171', '#a78bfa', '#fb923c'];

export default function IndicatorChartPopup({ indicator, stocks, children }: IndicatorChartPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Calculer la position avec contraintes viewport
    const popupWidth = 380;
    const popupHeight = 350;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 10;
    
    // Ajuster X si le popup dépasse à droite
    if (x + popupWidth / 2 > viewportWidth) {
      x = viewportWidth - popupWidth / 2 - 20;
    }
    // Ajuster X si le popup dépasse à gauche
    if (x - popupWidth / 2 < 0) {
      x = popupWidth / 2 + 20;
    }
    
    // Ajuster Y si le popup dépasse en bas
    if (y + popupHeight > viewportHeight) {
      y = rect.top - popupHeight - 10;
    }
    
    setPosition({ x, y });
    setIsVisible(!isVisible);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Fermer au clic à l'extérieur
  useEffect(() => {
    if (!isVisible) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.indicator-chart-popup') && !target.closest('.indicator-chart-popup-trigger')) {
        setIsVisible(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Bar Chart only
    const data = stocks.map((stock, index) => ({
      name: stock.ticker,
      value: stock[indicator.field] as number,
      itemStyle: {
        color: COLORS[index % COLORS.length],
      },
    }));

    const option: echarts.EChartsOption = {
      title: {
        text: indicator.name,
        left: 'center',
        textStyle: {
          color: 'var(--text-color)',
          fontSize: 14,
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
          type: 'shadow',
        },
        formatter: (params: any) => {
          const param = params[0];
          return `${param.marker} ${param.name}: ${param.value}${indicator.unit}`;
        },
      },
      grid: {
        left: '15%',
        right: '5%',
        bottom: '10%',
        top: '20%',
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLabel: {
          color: 'var(--text-secondary)',
          fontSize: 11,
        },
        axisLine: {
          lineStyle: {
            color: 'var(--border-color)',
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: 'var(--text-secondary)',
          fontSize: 10,
          formatter: (value: number) => `${value}${indicator.unit}`,
        },
        splitLine: {
          lineStyle: {
            color: 'var(--border-color)',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          type: 'bar',
          data,
          barWidth: '60%',
          label: {
            show: true,
            position: 'top',
            color: 'var(--text-color)',
            fontSize: 10,
            formatter: (params: any) => `${params.value}${indicator.unit}`,
          },
        },
      ],
    };

    chart.setOption(option);

    return () => {
      chart.dispose();
    };
  }, [isVisible, indicator, stocks]);

  return (
    <span
      className="indicator-chart-popup-trigger"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {children}

      {isVisible && (
        <div
          className="indicator-chart-popup"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          <div className="indicator-chart-popup__header">
            <button className="chart-close-btn" onClick={handleClose} title="Fermer">
              ✕
            </button>
            <span className="chart-title">{indicator.name}</span>
          </div>

          <div className="indicator-chart-popup__body">
            <div ref={chartRef} style={{ width: '100%', height: '250px' }} />
          </div>
        </div>
      )}
    </span>
  );
}
