'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface RadarDataItem {
  name: string;
  values: number[];
  color?: string;
}

interface RadarChartProps {
  indicators: string[];
  data: RadarDataItem[];
  title?: string;
  height?: string;
}

export default function RadarChart({ indicators, data, title = 'Radar Chart', height = '300px' }: RadarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option = {
      title: {
        text: title,
        left: 'center',
        top: 10,
        textStyle: {
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(16, 42, 67, 0.95)',
        borderColor: '#00BFFF',
        borderWidth: 1,
        textStyle: {
          color: '#FFFFFF',
        },
      },
      legend: {
        orient: 'horizontal',
        bottom: 10,
        left: 'center',
        textStyle: {
          color: '#FFFFFF',
          fontSize: 11,
        },
        data: data.map((d) => d.name),
      },
      radar: {
        indicator: indicators.map((name) => ({
          name,
          max: 100,
        })),
        radius: '60%',
        center: ['50%', '50%'],
        splitNumber: 4,
        shape: 'polygon',
        name: {
          textStyle: {
            color: '#FFFFFF',
            fontSize: 11,
          },
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(0, 191, 255, 0.05)', 'rgba(0, 191, 255, 0.1)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)',
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: data.map((item) => ({
            name: item.name,
            value: item.values,
            itemStyle: {
              color: item.color || '#00BFFF',
            },
            areaStyle: {
              opacity: 0.2,
            },
            lineStyle: {
              width: 2,
            },
          })),
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
  }, [indicators, data, title]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}
