'use client';

import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface YieldDataPoint {
  maturity: number;
  yield: number;
}

interface CountryYieldCurve {
  country: string;
  countryCode: string;
  color: string;
  data: YieldDataPoint[];
}

interface YieldCurveSnapshot {
  date: string;
  curves: CountryYieldCurve[];
}

interface YieldCurveDisplayProps {
  selectedCountries: string[];
  currentSnapshot: YieldCurveSnapshot;
  height?: string;
}

export default function YieldCurveDisplay({ 
  selectedCountries,
  currentSnapshot,
  height = '400px' 
}: YieldCurveDisplayProps) {
  const maturities = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20];
  const filteredCurves = currentSnapshot.curves.filter(c => selectedCountries.includes(c.countryCode));

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--card-background)',
      borderColor: 'var(--border-color)',
      borderWidth: 1,
      textStyle: { color: 'var(--text-color)' },
      formatter: (params: any) => {
        const maturity = params[0].axisValue;
        let tooltip = `<strong>${maturity < 1 ? `${maturity * 12}M` : `${maturity}Y`}</strong><br/>`;
        params.forEach((param: any) => {
          tooltip += `<div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
            <span style="width: 8px; height: 8px; background: ${param.color}; border-radius: 50%;"></span>
            <span style="font-size: 0.8125rem;">${param.seriesName}: <strong>${param.value}%</strong></span>
          </div>`;
        });
        return tooltip;
      },
    },
    legend: {
      show: false,
    },
    grid: {
      left: '8%',
      right: '4%',
      bottom: '12%',
      top: '8%',
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: maturities,
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
      axisLabel: {
        color: 'var(--text-secondary)',
        fontSize: 11,
        formatter: (value: any) => value < 1 ? `${value * 12}M` : `${value}Y`,
      },
      splitLine: {
        show: true,
        lineStyle: { color: 'var(--border-color)', type: 'dashed', opacity: 0.2 },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
      axisLabel: {
        color: 'var(--text-secondary)',
        fontSize: 11,
        formatter: '{value}%',
      },
      splitLine: {
        lineStyle: { color: 'var(--border-color)', type: 'dashed', opacity: 0.2 },
      },
    },
    series: filteredCurves.map((curve) => ({
      name: curve.country,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2.5, color: curve.color },
      itemStyle: { color: curve.color },
      data: curve.data.map(d => d.yield),
      animationDuration: 800,
      animationEasing: 'cubicInOut',
    })) as any,
  };

  return (
    <ReactECharts option={option} style={{ height, width: '100%' }} />
  );
}
