'use client';

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Candle, MarketEvent } from '@/core/data/TechnicalAnalysis';

interface TechnicalChartProps {
  data: Candle[];
  events?: MarketEvent[];
  indicators?: string[];
  chartType?: 'candles' | 'line' | 'area' | 'bars';
}

export default function TechnicalChart({ data, events = [], indicators = [], chartType = 'candles' }: TechnicalChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<echarts.ECharts | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current, 'light');
    setChart(myChart);

    return () => {
      myChart.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chart || !data.length) return;

    // Préparer les données
    const dates = data.map((d) => d.date);
    const ohlc = data.map((d) => [d.open, d.close, d.low, d.high]);
    const volumes = data.map((d) => d.volume);

    // Calculer SMA pour démo
    const calculateSMA = (period: number) => {
      const sma: (number | null)[] = [];
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          sma.push(null);
        } else {
          const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
          sma.push(sum / period);
        }
      }
      return sma;
    };

    const sma20 = calculateSMA(20);
    const sma50 = calculateSMA(50);

    // Préparer les données selon le type de chart
    const closePrices = data.map((d) => d.close);
    
    // Créer la série principale selon le type
    const getMainSeries = () => {
      switch (chartType) {
        case 'line':
          return {
            name: 'Price',
            type: 'line' as const,
            data: closePrices,
            smooth: false,
            lineStyle: {
              width: 2,
              color: '#00BFFF',
            },
            showSymbol: false,
            xAxisIndex: 0,
            yAxisIndex: 0,
          };
        
        case 'area':
          return {
            name: 'Price',
            type: 'line' as const,
            data: closePrices,
            smooth: false,
            lineStyle: {
              width: 2,
              color: '#00BFFF',
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(0, 191, 255, 0.4)' },
                  { offset: 1, color: 'rgba(0, 191, 255, 0.05)' },
                ],
              },
            },
            showSymbol: false,
            xAxisIndex: 0,
            yAxisIndex: 0,
          };
        
        case 'bars':
          return {
            name: 'Price',
            type: 'bar' as const,
            data: closePrices,
            itemStyle: {
              color: (params: any) => {
                const index = params.dataIndex;
                return data[index].close >= data[index].open
                  ? '#28a745'
                  : '#dc3545';
              },
            },
            xAxisIndex: 0,
            yAxisIndex: 0,
          };
        
        case 'candles':
        default:
          return {
            name: 'Candlestick',
            type: 'candlestick' as const,
            data: ohlc,
            itemStyle: {
              color: '#28a745',
              color0: '#dc3545',
              borderColor: '#28a745',
              borderColor0: '#dc3545',
            },
            xAxisIndex: 0,
            yAxisIndex: 0,
          };
      }
    };

    // Dernier prix pour le marqueur
    const lastPrice = data[data.length - 1].close;

    const option: echarts.EChartsOption = {
      backgroundColor: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(0, 191, 255, 0.03)' },
          { offset: 0.5, color: 'rgba(0, 191, 255, 0.01)' },
          { offset: 1, color: 'rgba(255, 159, 4, 0.03)' },
        ],
      },
      animation: true,
      legend: {
        top: 10,
        left: 'center',
        textStyle: {
          color: 'var(--text-color)',
        },
        data: ['Candlestick', ...(indicators.includes('sma20') ? ['SMA 20'] : []), ...(indicators.includes('sma50') ? ['SMA 50'] : [])],
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          animation: false,
          label: {
            backgroundColor: 'var(--primary-color)',
          },
        },
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--border-color)',
        textStyle: {
          color: 'var(--text-color)',
        },
        formatter: (params: any) => {
          const param = params[0];
          const dataIndex = param.dataIndex;
          const candle = data[dataIndex];
          
          let html = `<div style="padding: 8px;">`;
          html += `<div style="font-weight: 700; margin-bottom: 8px;">${param.name}</div>`;
          html += `<div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 16px;">`;
          html += `<span>Open:</span><span style="font-weight: 600;">${candle.open.toFixed(2)}</span>`;
          html += `<span>High:</span><span style="font-weight: 600; color: var(--positive-color);">${candle.high.toFixed(2)}</span>`;
          html += `<span>Low:</span><span style="font-weight: 600; color: var(--negative-color);">${candle.low.toFixed(2)}</span>`;
          html += `<span>Close:</span><span style="font-weight: 600;">${candle.close.toFixed(2)}</span>`;
          html += `<span>Volume:</span><span style="font-weight: 600;">${(candle.volume / 1000000).toFixed(2)}M</span>`;
          
          const change = candle.close - candle.open;
          const changePercent = (change / candle.open) * 100;
          const color = change >= 0 ? 'var(--positive-color)' : 'var(--negative-color)';
          html += `<span>Change:</span><span style="font-weight: 600; color: ${color};">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)</span>`;
          
          html += `</div></div>`;
          return html;
        },
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
      },
      grid: [
        {
          left: '8%',
          right: '5%',
          top: '12%',
          height: '60%',
        },
        {
          left: '8%',
          right: '5%',
          top: '75%',
          height: '15%',
        },
      ],
      xAxis: [
        {
          type: 'category',
          data: dates,
          boundaryGap: true,
          axisLine: {
            lineStyle: {
              color: 'var(--border-color)',
            },
          },
          axisLabel: {
            color: 'var(--text-secondary)',
            formatter: (value: string) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            },
          },
          min: 'dataMin',
          max: 'dataMax',
          gridIndex: 0,
        },
        {
          type: 'category',
          data: dates,
          gridIndex: 1,
          boundaryGap: true,
          axisLine: {
            lineStyle: {
              color: 'var(--border-color)',
            },
          },
          axisLabel: {
            color: 'var(--text-secondary)',
            show: false,
          },
          splitLine: { show: false },
        },
      ],
      yAxis: [
        {
          scale: true,
          position: 'right',
          splitArea: {
            show: false,
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: 'var(--border-color)',
              opacity: 0.2,
            },
          },
          axisLabel: {
            inside: false,
            formatter: (value: number) => value.toFixed(2),
            color: 'var(--text-secondary)',
            fontSize: 11,
          },
          axisPointer: {
            label: {
              show: true,
              backgroundColor: '#00BFFF',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 'bold',
              formatter: (params: any) => {
                return `$${params.value.toFixed(2)}`;
              },
            },
          },
          gridIndex: 0,
        },
        {
          scale: true,
          splitLine: { show: false },
          axisLabel: {
            color: 'var(--text-secondary)',
            formatter: (value: number) => {
              if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
              if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
              return value.toString();
            },
          },
          gridIndex: 1,
        },
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 70,
          end: 100,
        },
      ],
      series: [
        {
          ...getMainSeries(),
          markLine: {
            symbol: ['none', 'none'],
            label: {
              show: true,
              position: 'insideEndTop',
              formatter: `$${lastPrice.toFixed(2)}`,
              color: '#FFFFFF',
              backgroundColor: lastPrice >= data[data.length - 2].close ? '#28a745' : '#dc3545',
              padding: [4, 8],
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 'bold',
            },
            lineStyle: {
              color: lastPrice >= data[data.length - 2].close ? '#28a745' : '#dc3545',
              type: 'dashed',
              width: 1,
            },
            data: [
              {
                yAxis: lastPrice,
              },
            ],
          },
        } as any,
        ...(indicators.includes('sma20')
          ? [
              {
                name: 'SMA 20',
                type: 'line' as const,
                data: sma20,
                smooth: true,
                lineStyle: {
                  width: 2,
                  color: '#00BFFF',
                },
                showSymbol: false,
                xAxisIndex: 0,
                yAxisIndex: 0,
              },
            ]
          : []),
        ...(indicators.includes('sma50')
          ? [
              {
                name: 'SMA 50',
                type: 'line' as const,
                data: sma50,
                smooth: true,
                lineStyle: {
                  width: 2,
                  color: '#FF9F04',
                },
                showSymbol: false,
                xAxisIndex: 0,
                yAxisIndex: 0,
              },
            ]
          : []),
        {
          name: 'Volume',
          type: 'bar' as const,
          data: volumes,
          itemStyle: {
            color: (params: any) => {
              const index = params.dataIndex;
              return data[index].close >= data[index].open
                ? 'rgba(40, 167, 69, 0.6)'
                : 'rgba(220, 53, 69, 0.6)';
            },
          },
          xAxisIndex: 1,
          yAxisIndex: 1,
        },
      ] as any,
    };

    chart.setOption(option as any);

    // Hover event listener for alert button - position près du label Y axis
    chart.on('mousemove', (params: any) => {
      if (params.componentType === 'yAxis' || (params.componentType === 'series' && params.seriesIndex === 0)) {
        const priceValue = params.componentType === 'yAxis' 
          ? params.value 
          : (chartType === 'candles' ? params.data[1] : params.data);
        
        if (chartRef.current && containerRef.current) {
          const chartRect = chartRef.current.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          
          // Position du prix sur l'axe Y
          const yPixel = params.event?.offsetY || 0;
          
          setHoverPrice(priceValue);
          setHoverPosition({
            x: containerRect.right - 45, // À droite du chart, près de l'axe Y
            y: chartRect.top + yPixel,
          });
        }
      }
    });

    chart.getZr().on('mouseout', () => {
      setHoverPrice(null);
      setHoverPosition(null);
    });

    // Resize handler
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chart, data, indicators, events, chartType]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      containerRef.current.classList.add('fullscreen-active');
    } else {
      document.exitFullscreen?.();
      containerRef.current.classList.remove('fullscreen-active');
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        containerRef.current?.classList.remove('fullscreen-active');
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Resize chart when container size changes
  useEffect(() => {
    if (!chart) return;

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [chart]);

  return (
    <div ref={containerRef} className="technical-chart-container">
      <div className="technical-chart-toolbar">
        <button className="chart-tool-btn" onClick={toggleFullscreen} title="Mode plein écran">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isFullscreen ? (
              <>
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </>
            ) : (
              <>
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </>
            )}
          </svg>
        </button>
      </div>
      
      {/* Chart */}
      <div ref={chartRef} className="technical-chart" style={{ width: '100%', height: '100%' }} />
      
      {/* Hover Alert Button */}
      {hoverPrice && hoverPosition && (
        <button
          className="chart-alert-btn"
          style={{
            position: 'fixed',
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            transform: 'translateY(-50%)',
          }}
          onClick={() => alert(`Créer une alerte à $${hoverPrice.toFixed(2)}`)}
          title={`Créer une alerte à $${hoverPrice.toFixed(2)}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      )}
    </div>
  );
}
