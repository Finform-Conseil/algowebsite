'use client';

import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

interface LineChartProps {
  data: {
    categories: string[];
    series: {
      name: string;
      values: number[];
      color?: string;
    }[];
  };
  title?: string;
  height?: string;
}

export default function LineChart({ data, title, height = '200px' }: LineChartProps) {
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
      boundaryGap: false,
      axisLabel: {
        color: 'var(--text-secondary)',
        fontSize: 10,
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
    series: data.series.map(s => ({
      name: s.name,
      type: 'line',
      data: s.values,
      smooth: true,
      lineStyle: {
        width: 2,
        color: s.color || '#00BFFF',
      },
      itemStyle: {
        color: s.color || '#00BFFF',
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: s.color || '#00BFFF' + '40' },
            { offset: 1, color: s.color || '#00BFFF' + '00' },
          ],
        },
      },
    })),
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--card-background)',
      borderColor: 'var(--border-color)',
      textStyle: {
        color: 'var(--text-color)',
      },
    },
    legend: {
      data: data.series.map(s => s.name),
      textStyle: {
        color: 'var(--text-secondary)',
        fontSize: 10,
      },
      top: 'bottom',
    },
  };

  return <ReactECharts option={option} style={{ height }} />;
}
