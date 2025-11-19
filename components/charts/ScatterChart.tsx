'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ScatterChartProps {
  data: { name: string; x: number; y: number }[];
  xLabel: string;
  yLabel: string;
  title?: string;
  height?: string;
}

export default function ScatterChart({ data, xLabel, yLabel, title, height = '350px' }: ScatterChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      title: title ? {
        text: title,
        left: 'center',
        textStyle: {
          color: 'var(--text-color)',
          fontSize: 16,
          fontWeight: 600,
        },
      } : undefined,
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const dataPoint = params.data;
          return `
            <strong>${dataPoint[2]}</strong><br/>
            ${xLabel}: ${dataPoint[0].toFixed(2)}<br/>
            ${yLabel}: ${dataPoint[1].toFixed(2)}
          `;
        },
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--border-color)',
        textStyle: {
          color: 'var(--text-color)',
        },
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '10%',
        top: title ? '15%' : '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: xLabel,
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          color: 'var(--text-secondary)',
          fontSize: 12,
        },
        axisLabel: {
          color: 'var(--text-secondary)',
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
      yAxis: {
        type: 'value',
        name: yLabel,
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          color: 'var(--text-secondary)',
          fontSize: 12,
        },
        axisLabel: {
          color: 'var(--text-secondary)',
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
      series: [
        {
          type: 'scatter',
          symbolSize: 20,
          data: data.map((d) => [d.x, d.y, d.name]),
          itemStyle: {
            color: '#00BFFF',
            borderColor: '#FFFFFF',
            borderWidth: 2,
          },
          emphasis: {
            itemStyle: {
              color: '#FF9F04',
              borderColor: '#FFFFFF',
              borderWidth: 3,
            },
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => params.data[2],
            color: 'var(--text-color)',
            fontSize: 11,
          },
        },
      ],
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
  }, [data, xLabel, yLabel, title]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}
