'use client';

import { useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import * as echarts from 'echarts';

export interface TreemapNode {
  name: string;
  value: number[];
  children?: TreemapNode[];
}

interface TreemapChartProps {
  data: TreemapNode[];
  title?: string;
  subtitle?: string;
  height?: string;
  visualMin?: number;
  visualMax?: number;
  visualMinBound?: number;
  visualMaxBound?: number;
  positiveColor?: string;
  negativeColor?: string;
  neutralColor?: string;
  tooltipFormatter?: (info: any) => string;
}

export default function TreemapChart({
  data,
  title,
  subtitle,
  height = '400px',
  visualMin = -100,
  visualMax = 100,
  visualMinBound = -40,
  visualMaxBound = 40,
  positiveColor = '#10b981',
  negativeColor = '#ef4444',
  neutralColor = '#6b7280',
  tooltipFormatter,
}: TreemapChartProps) {
  
  // Process data to add visual dimension
  const processedData = useMemo(() => {
    const dataCopy = JSON.parse(JSON.stringify(data));

    function convertData(originList: TreemapNode[]) {
      let min = Infinity;
      let max = -Infinity;

      // Find min and max values
      for (let i = 0; i < originList.length; i++) {
        let node = originList[i];
        if (node) {
          let value = node.value;
          if (value[2] != null && value[2] < min) min = value[2];
          if (value[2] != null && value[2] > max) max = value[2];
        }
      }

      // Scale values for visual effect
      for (let i = 0; i < originList.length; i++) {
        let node = originList[i];
        if (node) {
          let value = node.value;

          // Scale value for visual effect
          if (value[2] != null && value[2] > 0) {
            value[3] = echarts.number.linearMap(
              value[2],
              [0, max],
              [visualMaxBound, visualMax],
              true
            );
          } else if (value[2] != null && value[2] < 0) {
            value[3] = echarts.number.linearMap(
              value[2],
              [min, 0],
              [visualMin, visualMinBound],
              true
            );
          } else {
            value[3] = 0;
          }

          if (!isFinite(value[3])) {
            value[3] = 0;
          }

          if (node.children) {
            convertData(node.children);
          }
        }
      }
    }

    convertData(dataCopy);
    return dataCopy;
  }, [data, visualMin, visualMax, visualMinBound, visualMaxBound]);

  const isValidNumber = (num: number) => {
    return num != null && isFinite(num);
  };

  const defaultTooltipFormatter = (info: any) => {
    const value = info.value;
    const amount = isValidNumber(value[0])
      ? echarts.format.addCommas(value[0])
      : '-';
    const change = isValidNumber(value[2]) ? value[2].toFixed(2) + '%' : '-';

    return [
      '<div style="font-weight: 600; margin-bottom: 4px;">' +
        echarts.format.encodeHTML(info.name) +
        '</div>',
      'Value: &nbsp;&nbsp;' + amount + '<br>',
      'Change: &nbsp;&nbsp;' + change,
    ].join('');
  };

  const option: EChartsOption = {
    backgroundColor: '#102A43',
    tooltip: {
      backgroundColor: 'var(--card-background)',
      borderColor: 'var(--border-color)',
      borderWidth: 1,
      textStyle: {
        color: 'var(--text-color)',
        fontSize: 12,
      },
      formatter: tooltipFormatter || defaultTooltipFormatter,
    },
    series: [
      {
        type: 'treemap',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        roam: false,
        breadcrumb: {
          show: false,
        },
        label: {
          show: true,
          formatter: '{b}',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
        },
        upperLabel: {
          show: true,
          height: 18,
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          backgroundColor: '#102A43',
        },
        itemStyle: {
          borderColor: '#102A43',
          borderWidth: 1,
          gapWidth: 1,
        },
        emphasis: {
          label: {
            fontSize: 12,
            fontWeight: 700,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
        visualMin: visualMin,
        visualMax: visualMax,
        visualDimension: 3,
        levels: [
          {
            itemStyle: {
              borderWidth: 3,
              borderColor: 'var(--border-color)',
              gapWidth: 3,
            },
            upperLabel: {
              show: true,
              height: 0,
              backgroundColor: '#102A43',
            },
          },
          {
            color: [negativeColor, neutralColor, positiveColor],
            colorMappingBy: 'value',
            itemStyle: {
              gapWidth: 1,
            },
          },
        ],
        data: processedData,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
}
