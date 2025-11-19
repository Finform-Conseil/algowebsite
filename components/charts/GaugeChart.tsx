'use client';

import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

interface GaugeChartProps {
  value: number;
  title?: string;
  height?: string;
  max?: number;
  unit?: string;
}

export default function GaugeChart({ value, title, height = '180px', max = 100, unit = '%' }: GaugeChartProps) {
  const option: EChartsOption = {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max,
        splitNumber: 4,
        itemStyle: {
          color: value > 70 ? '#20C997' : value > 40 ? '#FF9F04' : '#F86C6B',
        },
        progress: {
          show: true,
          width: 12,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, 'var(--border-color)']],
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}' + unit,
          color: 'var(--text-color)',
          fontSize: 20,
          fontWeight: 'bold',
          offsetCenter: [0, '0%'],
        },
        title: {
          show: title ? true : false,
          offsetCenter: [0, '70%'],
          fontSize: 12,
          color: 'var(--text-secondary)',
        },
        data: [
          {
            value,
            name: title,
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
