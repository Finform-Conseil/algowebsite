'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface HeatmapData {
  stocks: string[];
  metrics: string[];
  values: number[][];
}

interface HeatmapChartProps {
  data: HeatmapData;
  title?: string;
  height?: string;
}

export default function HeatmapChart({ data, title = 'Heatmap', height = '300px' }: HeatmapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Transformer les données pour ECharts
    const heatmapData = data.values.flatMap((row, i) =>
      row.map((value, j) => [j, i, value])
    );

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
        position: 'top',
        formatter: (params: any) => {
          const stock = data.stocks[params.data[1]];
          const metric = data.metrics[params.data[0]];
          const value = params.data[2];
          return `<strong>${stock}</strong><br/>${metric}: <strong>${value.toFixed(1)}</strong>`;
        },
        backgroundColor: 'rgba(16, 42, 67, 0.95)',
        borderColor: '#00BFFF',
        borderWidth: 1,
        textStyle: {
          color: '#FFFFFF',
        },
      },
      grid: {
        left: 100,
        right: 20,
        top: 50,
        bottom: 60,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: data.metrics,
        splitArea: {
          show: true,
        },
        axisLabel: {
          color: '#FFFFFF',
          fontSize: 10,
          rotate: 45,
        },
      },
      yAxis: {
        type: 'category',
        data: data.stocks,
        splitArea: {
          show: true,
        },
        axisLabel: {
          color: '#FFFFFF',
          fontSize: 10,
        },
      },
      visualMap: {
        min: Math.min(...data.values.flat()),
        max: Math.max(...data.values.flat()),
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 10,
        textStyle: {
          color: '#FFFFFF',
          fontSize: 10,
        },
        inRange: {
          color: ['#f87171', '#fbbf24', '#4ade80'],
        },
      },
      series: [
        {
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: true,
            fontSize: 9,
            color: '#000000',
            formatter: (params: any) => params.data[2].toFixed(0),
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
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
  }, [data, title]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
}
