'use client';

import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

interface BarChartProps {
  data: {
    categories: string[];
    values: number[];
  };
  title?: string;
  height?: string;
  color?: string;
}

export default function BarChart({ data, title, height = '200px', color }: BarChartProps) {
  const option: EChartsOption = {
    backgroundColor: 'transparent',
    title: title ? {
      text: title,
      textStyle: {
        color: 'var(--text-color)',
        fontSize: 14,
        fontWeight: 600,
      },
      left: 'center',
    } : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: title ? '15%' : '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLabel: {
        color: 'var(--text-secondary)',
        fontSize: 10,
        rotate: 45,
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
      },
      splitLine: {
        lineStyle: {
          color: 'var(--border-color)',
          opacity: 0.3,
        },
      },
    },
    series: [
      {
        type: 'bar',
        data: data.values,
        itemStyle: {
          color: color || '#00BFFF',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: color || '#00BFFF',
            opacity: 0.8,
          },
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--card-background)',
      borderColor: 'var(--border-color)',
      textStyle: {
        color: 'var(--text-color)',
      },
    },
  };

  return <ReactECharts option={option} style={{ height }} />;
}
