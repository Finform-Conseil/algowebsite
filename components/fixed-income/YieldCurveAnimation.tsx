'use client';

import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface YieldDataPoint {
  maturity: number; // in years
  yield: number; // in percentage
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

interface YieldCurveAnimationProps {
  height?: string;
}

export default function YieldCurveAnimation({ height = '100%' }: YieldCurveAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1500); // milliseconds per frame

  // Mock data: Yield curves for different countries over time
  const yieldCurveData: YieldCurveSnapshot[] = useMemo(() => {
    const countries = [
      { country: 'Benin', countryCode: 'BJ', color: '#4A90E2' },
      { country: 'Senegal', countryCode: 'SN', color: '#7EC8FF' },
      { country: 'Côte d\'Ivoire', countryCode: 'CI', color: '#F59E0B' },
      { country: 'Togo', countryCode: 'TG', color: '#10B981' },
      { country: 'Nigeria', countryCode: 'NG', color: '#8B5CF6' },
    ];

    const maturities = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20]; // years
    const dates = [
      '2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01', 
      '2024-05-01', '2024-06-01', '2024-07-01', '2024-08-01',
      '2024-09-01', '2024-10-01', '2024-11-01', '2024-12-01'
    ];

    return dates.map((date, dateIndex) => {
      const curves = countries.map((country, countryIndex) => {
        // Generate realistic yield curve with time variation
        const baseRate = 5 + countryIndex * 1.5;
        const timeVariation = Math.sin((dateIndex / dates.length) * Math.PI * 2) * 2;
        const countryVariation = Math.cos((countryIndex / countries.length) * Math.PI * 2) * 1.5;
        
        const data = maturities.map((maturity) => {
          // Typical upward sloping yield curve with some variation
          const termPremium = Math.log(1 + maturity) * 2;
          const randomNoise = (Math.sin(maturity * dateIndex * countryIndex) * 0.5);
          const yield_ = baseRate + termPremium + timeVariation + countryVariation + randomNoise;
          
          return {
            maturity,
            yield: Math.max(0.5, parseFloat(yield_.toFixed(2)))
          };
        });

        return {
          country: country.country,
          countryCode: country.countryCode,
          color: country.color,
          data
        };
      });

      return { date, curves };
    });
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % yieldCurveData.length);
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, yieldCurveData.length]);

  const currentSnapshot = yieldCurveData[currentIndex];

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'African Sovereign Yield Curves Evolution',
      subtext: `Date: ${new Date(currentSnapshot.date).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })}`,
      left: 'center',
      textStyle: {
        color: 'var(--text-color)',
        fontSize: 18,
        fontWeight: 700,
      },
      subtextStyle: {
        color: 'var(--text-secondary)',
        fontSize: 14,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--card-background)',
      borderColor: 'var(--border-color)',
      borderWidth: 1,
      textStyle: {
        color: 'var(--text-color)',
      },
      formatter: (params: any) => {
        const maturity = params[0].axisValue;
        let tooltip = `<strong>Maturity: ${maturity} years</strong><br/>`;
        params.forEach((param: any) => {
          tooltip += `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; background: ${param.color}; border-radius: 50%;"></span>
              <span>${param.seriesName}: <strong>${param.value}%</strong></span>
            </div>
          `;
        });
        return tooltip;
      },
    },
    legend: {
      data: currentSnapshot.curves.map(c => c.country),
      top: 50,
      textStyle: {
        color: 'var(--text-color)',
      },
      itemGap: 20,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '20%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      name: 'Maturity (Years)',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        color: 'var(--text-color)',
        fontSize: 12,
        fontWeight: 600,
      },
      data: currentSnapshot.curves[0].data.map(d => d.maturity),
      axisLine: {
        lineStyle: {
          color: 'var(--border-color)',
        },
      },
      axisLabel: {
        color: 'var(--text-secondary)',
        formatter: (value: string) => {
          const numValue = parseFloat(value);
          if (numValue < 1) return `${numValue * 12}M`;
          return `${numValue}Y`;
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'var(--border-color)',
          type: 'dashed',
          opacity: 0.3,
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Yield (%)',
      nameLocation: 'middle',
      nameGap: 50,
      nameTextStyle: {
        color: 'var(--text-color)',
        fontSize: 12,
        fontWeight: 600,
      },
      axisLine: {
        lineStyle: {
          color: 'var(--border-color)',
        },
      },
      axisLabel: {
        color: 'var(--text-secondary)',
        formatter: '{value}%',
      },
      splitLine: {
        lineStyle: {
          color: 'var(--border-color)',
          type: 'dashed',
          opacity: 0.3,
        },
      },
    },
    series: currentSnapshot.curves.map((curve) => ({
      name: curve.country,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3,
        color: curve.color,
      },
      itemStyle: {
        color: curve.color,
        borderWidth: 2,
        borderColor: '#fff',
      },
      emphasis: {
        focus: 'series',
        lineStyle: {
          width: 4,
        },
        symbolSize: 12,
      },
      data: curve.data.map(d => d.yield),
      animationDuration: speed * 0.8,
      animationEasing: 'cubicInOut',
    })),
  };

  return (
    <div style={{ height, width: '100%', display: 'flex', flexDirection: 'column' }}>
      <ReactECharts 
        option={option} 
        style={{ height: 'calc(100% - 80px)', width: '100%' }} 
        opts={{ renderer: 'canvas' }}
      />
      
      {/* Controls */}
      <div style={{
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        padding: '1rem',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--card-background)',
      }}>
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            padding: '0.625rem 1.25rem',
            background: isPlaying ? 'var(--accent-gold)' : 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
            transition: 'all 0.2s',
          }}
        >
          {isPlaying ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              Pause
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </span>
          )}
        </button>

        {/* Timeline Slider */}
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <input
            type="range"
            min="0"
            max={yieldCurveData.length - 1}
            value={currentIndex}
            onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
            style={{
              width: '100%',
              cursor: 'pointer',
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}>
            <span>{new Date(yieldCurveData[0].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            <span>{new Date(yieldCurveData[yieldCurveData.length - 1].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Speed Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Speed:
          </label>
          <select
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            style={{
              padding: '0.5rem',
              background: 'var(--background-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-color)',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <option value="2500">Slow</option>
            <option value="1500">Normal</option>
            <option value="800">Fast</option>
          </select>
        </div>
      </div>
    </div>
  );
}
