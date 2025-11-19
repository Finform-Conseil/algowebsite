'use client';

import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

interface PieChartProps {
  data: {
    name: string;
    value: number;
  }[];
  title?: string;
  height?: string;
  colors?: string[];
}

export default function PieChart({ data, title, height = '250px', colors }: PieChartProps) {
  const defaultColors = ['#00BFFF', '#FF9F04', '#20C997', '#F86C6B', '#8A2BE2', '#FFA000'];

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
    tooltip: {
      trigger: 'item',
      backgroundColor: 'var(--card-background)',
      borderColor: 'var(--border-color)',
      textStyle: {
        color: 'var(--text-color)',
      },
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: 'var(--text-secondary)',
        fontSize: 10,
      },
      top: title ? '20%' : '10%',
    },
    series: [
      {
        name: 'Distribution',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: 'var(--card-background)',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{d}%',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#fff',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fff',
            formatter: '{b}\n{d}%',
          },
        },
        labelLine: {
          show: false,
        },
        data: data.map((item, index) => ({
          ...item,
          itemStyle: {
            color: (colors && colors[index]) || defaultColors[index % defaultColors.length],
          },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
