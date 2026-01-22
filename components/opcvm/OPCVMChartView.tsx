'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import DrawingToolsV2 from '@/components/technical/DrawingToolsV2';
import IndicatorsModal from '@/components/technical/IndicatorsModal';
import IndicatorConfigModal from '@/components/technical/IndicatorConfigModal';
import { ActiveIndicator, IndicatorConfig, INDICATOR_CONFIGS } from '@/types/indicators';
import { Drawing, DrawingPoint, MagnetMode, DrawingMode } from '@/types/drawingTools';
import { TOOL_SPECS, getToolSpec } from '@/config/drawingToolsRegistry';
import { pixelToPoint, applyMagnet } from '@/utils/drawingUtils';

interface OPCVMChartViewProps {
  fundName: string;
  fundTicker: string;
}

interface NAVDataPoint {
  date: string;
  value: number;
}

const TIMEFRAMES = [
  { value: '1W', label: '1 Semaine' },
  { value: '1M', label: '1 Mois' },
  { value: '3M', label: '3 Mois' },
  { value: '6M', label: '6 Mois' },
  { value: '1Y', label: '1 An' },
  { value: '3Y', label: '3 Ans' },
  { value: '5Y', label: '5 Ans' },
  { value: 'MAX', label: 'Max' },
];

function generateMockNAVData(days: number): NAVDataPoint[] {
  const data: NAVDataPoint[] = [];
  const today = new Date();
  let baseValue = 10000 + Math.random() * 5000;

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.48) * 100;
    baseValue = Math.max(5000, baseValue + change);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: baseValue,
    });
  }

  return data;
}

export default function OPCVMChartView({ fundName, fundTicker }: OPCVMChartViewProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1Y');
  const [selectedTool, setSelectedTool] = useState<string>('cursor');
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicator[]>([]);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showIndicatorConfig, setShowIndicatorConfig] = useState(false);
  const [selectedIndicatorConfig, setSelectedIndicatorConfig] = useState<IndicatorConfig | null>(null);
  const [editingIndicator, setEditingIndicator] = useState<ActiveIndicator | null>(null);

  // États pour le dessin (nouvelle architecture)
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('idle');
  const [draftPoints, setDraftPoints] = useState<DrawingPoint[]>([]);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  
  // États globaux de drawing
  const [magnetMode, setMagnetMode] = useState<MagnetMode>('off');
  const [stayInDrawingMode, setStayInDrawingMode] = useState(false);
  const [drawingsLocked, setDrawingsLocked] = useState(false);
  const [drawingsVisible, setDrawingsVisible] = useState(true);

  const chartRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<echarts.ECharts | null>(null);

  const navData = useMemo(() => {
    const timeframeMap: Record<string, number> = {
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '3Y': 1095,
      '5Y': 1825,
      'MAX': 3650,
    };
    return generateMockNAVData(timeframeMap[selectedTimeframe] || 365);
  }, [selectedTimeframe]);

  const subscriptionRateYTD = 65;
  const redemptionRateYTD = 35;

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current, 'light');
    setChart(myChart);

    return () => {
      myChart.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chart || !navData.length) return;

    const dates = navData.map((d) => d.date);
    const values = navData.map((d) => d.value);

    const calculateSMA = (period: number) => {
      const sma: (number | null)[] = [];
      for (let i = 0; i < navData.length; i++) {
        if (i < period - 1) {
          sma.push(null);
        } else {
          const sum = navData.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.value, 0);
          sma.push(sum / period);
        }
      }
      return sma;
    };

    const series: any[] = [
      {
        name: 'Valeur Liquidative',
        type: 'line',
        data: values,
        smooth: false,
        lineStyle: {
          width: 2,
          color: '#00BFFF',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 191, 255, 0.3)' },
              { offset: 1, color: 'rgba(0, 191, 255, 0.05)' },
            ],
          },
        },
        showSymbol: false,
      },
    ];

    activeIndicators.forEach((indicator) => {
      if (indicator.id === 'sma') {
        const period = indicator.parameters.period || 20;
        const smaData = calculateSMA(period);
        series.push({
          name: `SMA ${period}`,
          type: 'line',
          data: smaData,
          smooth: true,
          lineStyle: {
            width: 2,
            color: indicator.parameters.color || '#FF9F04',
          },
          showSymbol: false,
        });
      }
    });

    const lastValue = values[values.length - 1];
    const previousValue = values[values.length - 2];

    const option: echarts.EChartsOption = {
      backgroundColor: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(0, 191, 255, 0.03)' },
          { offset: 0.5, color: 'rgba(0, 191, 255, 0.01)' },
          { offset: 1, color: 'rgba(255, 159, 4, 0.03)' },
        ],
      },
      animation: true,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          animation: false,
          label: {
            backgroundColor: 'var(--primary-color)',
          },
        },
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--border-color)',
        textStyle: {
          color: 'var(--text-color)',
        },
        formatter: (params: any) => {
          const param = params[0];
          const dataIndex = param.dataIndex;
          const navPoint = navData[dataIndex];
          
          let html = `<div style="padding: 8px;">`;
          html += `<div style="font-weight: 700; margin-bottom: 8px;">${param.name}</div>`;
          html += `<div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 16px;">`;
          html += `<span>VL:</span><span style="font-weight: 600;">${navPoint.value.toFixed(2)} FCFA</span>`;
          
          if (dataIndex > 0) {
            const prevValue = navData[dataIndex - 1].value;
            const change = navPoint.value - prevValue;
            const changePercent = (change / prevValue) * 100;
            const color = change >= 0 ? 'var(--positive-color)' : 'var(--negative-color)';
            html += `<span>Variation:</span><span style="font-weight: 600; color: ${color};">${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)</span>`;
          }
          
          html += `</div></div>`;
          return html;
        },
      },
      grid: {
        left: '3%',
        right: '5%',
        top: '10%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: 'var(--border-color)',
          },
        },
        axisLabel: {
          color: 'var(--text-secondary)',
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
          },
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        position: 'right',
        splitLine: {
          show: true,
          lineStyle: {
            color: 'var(--border-color)',
            opacity: 0.2,
          },
        },
        axisLabel: {
          color: 'var(--text-secondary)',
          formatter: (value: number) => `${value.toFixed(0)}`,
        },
        axisPointer: {
          label: {
            show: true,
            backgroundColor: '#00BFFF',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 'bold',
            formatter: (params: any) => {
              return `${params.value.toFixed(2)} FCFA`;
            },
          },
        },
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
      ],
      series: [
        ...series,
        {
          name: 'Dernier Prix',
          type: 'line',
          markLine: {
            symbol: ['none', 'none'],
            label: {
              show: true,
              position: 'insideEndTop',
              formatter: `${lastValue.toFixed(2)} FCFA`,
              color: '#FFFFFF',
              backgroundColor: lastValue >= previousValue ? '#28a745' : '#dc3545',
              padding: [4, 8],
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 'bold',
            },
            lineStyle: {
              color: lastValue >= previousValue ? '#28a745' : '#dc3545',
              type: 'dashed',
              width: 1,
            },
            data: [
              {
                yAxis: lastValue,
              },
            ],
          },
        },
      ],
    };

    // Construire les éléments graphiques pour les dessins
    const graphicElements: any[] = [];

    // Dessins permanents
    drawings.forEach((drawing) => {
      if (drawing.type === 'horizontal' || drawing.type === 'support' || drawing.type === 'resistance') {
        // Ligne horizontale complète - ancrée à la valeur Y (toujours visible)
        const yPixel = chart.convertToPixel({ yAxisIndex: 0 }, drawing.points[0].yAxis);
        if (yPixel !== null && !isNaN(yPixel)) {
          graphicElements.push({
            type: 'line',
            shape: {
              x1: 0,
              y1: yPixel,
              x2: chart.getWidth(),
              y2: yPixel,
            },
            style: {
              stroke: drawing.style.color,
              lineWidth: drawing.style.lineWidth,
              lineDash: drawing.style.lineDash,
            },
            z: 100,
          });
        }
      } else if (drawing.type === 'vertical') {
        // Ligne verticale - vérifier si la date existe dans le dataset actuel
        const dateIndex = dates.indexOf(drawing.points[0].xAxis);
        if (dateIndex !== -1) {
          const xPixel = chart.convertToPixel({ xAxisIndex: 0 }, drawing.points[0].xAxis);
          if (xPixel !== null && !isNaN(xPixel)) {
            graphicElements.push({
              type: 'line',
              shape: {
                x1: xPixel,
                y1: 0,
                x2: xPixel,
                y2: chart.getHeight(),
              },
              style: {
                stroke: drawing.style.color,
                lineWidth: drawing.style.lineWidth,
              },
              z: 100,
            });
          }
        }
      } else if (drawing.type === 'trendLine' && drawing.points.length >= 2) {
        // Ligne de tendance - vérifier si les deux dates existent
        const date1Index = dates.indexOf(drawing.points[0].xAxis);
        const date2Index = dates.indexOf(drawing.points[1].xAxis);
        
        if (date1Index !== -1 && date2Index !== -1) {
          const point1Pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
            drawing.points[0].xAxis,
            drawing.points[0].yAxis,
          ]);
          const point2Pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
            drawing.points[1].xAxis,
            drawing.points[1].yAxis,
          ]);
          
          if (point1Pixel && point2Pixel && !isNaN(point1Pixel[0]) && !isNaN(point2Pixel[0])) {
            graphicElements.push({
              type: 'line',
              shape: {
                x1: point1Pixel[0],
                y1: point1Pixel[1],
                x2: point2Pixel[0],
                y2: point2Pixel[1],
              },
              style: {
                stroke: drawing.style.color,
                lineWidth: drawing.style.lineWidth,
              },
              z: 100,
            });
          }
        }
      } else if (drawing.type === 'ray' && drawing.points.length >= 2) {
        // Rayon - ligne qui s'étend vers la droite
        const date1Index = dates.indexOf(drawing.points[0].xAxis);
        const date2Index = dates.indexOf(drawing.points[1].xAxis);
        
        if (date1Index !== -1 && date2Index !== -1) {
          const point1Pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
            drawing.points[0].xAxis,
            drawing.points[0].yAxis,
          ]);
          const point2Pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
            drawing.points[1].xAxis,
            drawing.points[1].yAxis,
          ]);
          
          if (point1Pixel && point2Pixel && !isNaN(point1Pixel[0]) && !isNaN(point2Pixel[0])) {
            // Calculer la pente et étendre jusqu'au bord droit
            const dx = point2Pixel[0] - point1Pixel[0];
            const dy = point2Pixel[1] - point1Pixel[1];
            const chartWidth = chart.getWidth();
            
            // Étendre jusqu'au bord droit du graphique
            const extendFactor = dx !== 0 ? (chartWidth - point1Pixel[0]) / dx : 1;
            const extendedX = chartWidth;
            const extendedY = point1Pixel[1] + dy * extendFactor;
            
            graphicElements.push({
              type: 'line',
              shape: {
                x1: point1Pixel[0],
                y1: point1Pixel[1],
                x2: extendedX,
                y2: extendedY,
              },
              style: {
                stroke: drawing.style.color,
                lineWidth: drawing.style.lineWidth,
              },
              z: 100,
            });
          }
        }
      } else if (drawing.type === 'rectangle' && drawing.points.length >= 2) {
        // Rectangle
        const date1Index = dates.indexOf(drawing.points[0].xAxis);
        const date2Index = dates.indexOf(drawing.points[1].xAxis);
        
        if (date1Index !== -1 && date2Index !== -1) {
          const point1Pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
            drawing.points[0].xAxis,
            drawing.points[0].yAxis,
          ]);
          const point2Pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
            drawing.points[1].xAxis,
            drawing.points[1].yAxis,
          ]);
          
          if (point1Pixel && point2Pixel) {
            const x = Math.min(point1Pixel[0], point2Pixel[0]);
            const y = Math.min(point1Pixel[1], point2Pixel[1]);
            const width = Math.abs(point2Pixel[0] - point1Pixel[0]);
            const height = Math.abs(point2Pixel[1] - point1Pixel[1]);
            
            graphicElements.push({
              type: 'rect',
              shape: { x, y, width, height },
              style: {
                stroke: drawing.style.color,
                lineWidth: drawing.style.lineWidth,
                fill: drawing.style.fill || 'transparent',
                opacity: drawing.style.fillOpacity || 1,
              },
              z: 100,
            });
          }
        }
      } else if ((drawing.type === 'circle' || drawing.type === 'ellipse') && drawing.points.length >= 2) {
        // Cercle/Ellipse
        const date1Index = dates.indexOf(drawing.points[0].xAxis);
        const date2Index = dates.indexOf(drawing.points[1].xAxis);
        
        if (date1Index !== -1 && date2Index !== -1) {
          const point1Pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
            drawing.points[0].xAxis,
            drawing.points[0].yAxis,
          ]);
          const point2Pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
            drawing.points[1].xAxis,
            drawing.points[1].yAxis,
          ]);
          
          if (point1Pixel && point2Pixel) {
            const cx = (point1Pixel[0] + point2Pixel[0]) / 2;
            const cy = (point1Pixel[1] + point2Pixel[1]) / 2;
            const rx = Math.abs(point2Pixel[0] - point1Pixel[0]) / 2;
            const ry = Math.abs(point2Pixel[1] - point1Pixel[1]) / 2;
            
            graphicElements.push({
              type: 'ellipse',
              shape: { cx, cy, rx, ry },
              style: {
                stroke: drawing.style.color,
                lineWidth: drawing.style.lineWidth,
                fill: drawing.style.fill || 'transparent',
                opacity: drawing.style.fillOpacity || 1,
              },
              z: 100,
            });
          }
        }
      } else if (drawing.type === 'text' && drawing.points.length >= 1) {
        // Texte
        const dateIndex = dates.indexOf(drawing.points[0].xAxis);
        
        if (dateIndex !== -1) {
          const pointPixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
            drawing.points[0].xAxis,
            drawing.points[0].yAxis,
          ]);
          
          if (pointPixel) {
            graphicElements.push({
              type: 'text',
              x: pointPixel[0],
              y: pointPixel[1],
              style: {
                text: drawing.meta?.text || 'Text',
                fill: drawing.style.color,
                fontSize: 14,
                fontWeight: 'bold',
              },
              z: 100,
            });
          }
        }
      } else if (drawing.type === 'crossLine' && drawing.points.length >= 1) {
        // CrossLine = horizontal + vertical au même point
        const yPixel = chart.convertToPixel({ yAxisIndex: 0 }, drawing.points[0].yAxis);
        const dateIndex = dates.indexOf(drawing.points[0].xAxis);
        
        if (yPixel !== null && !isNaN(yPixel)) {
          graphicElements.push({
            type: 'line',
            shape: {
              x1: 0,
              y1: yPixel,
              x2: chart.getWidth(),
              y2: yPixel,
            },
            style: {
              stroke: drawing.style.color,
              lineWidth: drawing.style.lineWidth,
            },
            z: 100,
          });
        }
        
        if (dateIndex !== -1) {
          const xPixel = chart.convertToPixel({ xAxisIndex: 0 }, drawing.points[0].xAxis);
          if (xPixel !== null && !isNaN(xPixel)) {
            graphicElements.push({
              type: 'line',
              shape: {
                x1: xPixel,
                y1: 0,
                x2: xPixel,
                y2: chart.getHeight(),
              },
              style: {
                stroke: drawing.style.color,
                lineWidth: drawing.style.lineWidth,
              },
              z: 100,
            });
          }
        }
      }
    });

    // Ligne de prévisualisation pendant le dessin
    if (drawingMode === 'placing' && draftPoints.length > 0 && mousePosition) {
      const point1Pixel = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [
        draftPoints[0].xAxis,
        draftPoints[0].yAxis,
      ]);
      
      if (point1Pixel) {
        graphicElements.push({
          type: 'line',
          shape: {
            x1: point1Pixel[0],
            y1: point1Pixel[1],
            x2: mousePosition.x,
            y2: mousePosition.y,
          },
          style: {
            stroke: '#FFD700',
            lineWidth: 2,
            lineDash: [5, 5],
            opacity: 0.7,
          },
          z: 100,
        });
      }
    }

    // Ajouter les éléments graphiques à l'option
    const finalOption = {
      ...option,
      graphic: {
        elements: graphicElements,
      },
    };

    chart.setOption(finalOption as any);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chart, navData, activeIndicators, drawings, drawingMode, draftPoints, mousePosition]);

  useEffect(() => {
    if (!chart) return;

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [chart]);

  // Gestion des événements de dessin (nouvelle architecture registry-based)
  useEffect(() => {
    if (!chart || drawingsLocked) return;

    const handleChartClick = (params: any) => {
      const clickX = params.event?.offsetX;
      const clickY = params.event?.offsetY;
      
      if (clickX === undefined || clickY === undefined) return;

      // Convertir pixel → data avec validation
      const result = pixelToPoint(chart, navData, clickX, clickY);
      if (!result) return;

      let { point } = result;
      const { xIndex } = result;

      // Appliquer le magnet si activé
      point = applyMagnet(chart, navData, xIndex, point, magnetMode);

      // Récupérer le tool spec
      const toolSpec = getToolSpec(selectedTool);
      if (!toolSpec || toolSpec.pointsNeeded === 0) return;

      // Gestion selon le nombre de points requis
      if (toolSpec.pointsNeeded === 1) {
        // Outil à 1 clic : créer immédiatement
        const newDrawing = toolSpec.create([point]);
        setDrawings(prev => [...prev, newDrawing]);
        
        // Retour au curseur si stayInDrawingMode = false
        if (!stayInDrawingMode) {
          setSelectedTool('cursor');
        }
        setDrawingMode('idle');
      } else if (toolSpec.pointsNeeded === 2) {
        // Outil à 2 clics
        if (drawingMode === 'idle') {
          // Premier clic
          setDrawingMode('placing');
          setDraftPoints([point]);
        } else if (drawingMode === 'placing' && draftPoints.length === 1) {
          // Deuxième clic
          const newDrawing = toolSpec.create([draftPoints[0], point]);
          setDrawings(prev => [...prev, newDrawing]);
          
          // Reset
          setDrawingMode('idle');
          setDraftPoints([]);
          setMousePosition(null);
          
          if (!stayInDrawingMode) {
            setSelectedTool('cursor');
          }
        }
      }
      // TODO: gérer pointsNeeded === 3 et 'poly' plus tard
    };

    const handleMouseMove = (params: any) => {
      if (drawingMode === 'placing' && draftPoints.length > 0) {
        setMousePosition({ x: params.event.offsetX, y: params.event.offsetY });
      }
    };

    const handleGlobalOut = () => {
      if (drawingMode === 'placing') {
        setMousePosition(null);
      }
    };

    chart.getZr().on('click', handleChartClick);
    chart.getZr().on('mousemove', handleMouseMove);
    chart.getZr().on('globalout', handleGlobalOut);

    return () => {
      chart.getZr().off('click', handleChartClick);
      chart.getZr().off('mousemove', handleMouseMove);
      chart.getZr().off('globalout', handleGlobalOut);
    };
  }, [chart, selectedTool, drawingMode, draftPoints, navData, magnetMode, stayInDrawingMode, drawingsLocked]);

  // Gestion de la touche Échap pour annuler le dessin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawingMode === 'placing') {
        setDrawingMode('idle');
        setDraftPoints([]);
        setMousePosition(null);
        setSelectedTool('cursor');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingMode]);

  const handleAddIndicator = (indicatorId: string) => {
    const config = INDICATOR_CONFIGS.find(c => c.id === indicatorId);
    if (config) {
      setSelectedIndicatorConfig(config);
      setEditingIndicator(null);
      setShowIndicatorConfig(true);
    }
  };

  const handleSaveIndicator = (indicator: ActiveIndicator) => {
    if (editingIndicator) {
      setActiveIndicators(prev => 
        prev.map(ind => ind.instanceId === indicator.instanceId ? indicator : ind)
      );
    } else {
      setActiveIndicators(prev => [...prev, indicator]);
    }
    setShowIndicatorConfig(false);
    setEditingIndicator(null);
  };

  const handleEditIndicator = (indicator: ActiveIndicator) => {
    const config = INDICATOR_CONFIGS.find(c => c.id === indicator.id);
    if (config) {
      setSelectedIndicatorConfig(config);
      setEditingIndicator(indicator);
      setShowIndicatorConfig(true);
    }
  };

  const handleRemoveIndicator = (instanceId: string) => {
    setActiveIndicators(prev => prev.filter(ind => ind.instanceId !== instanceId));
  };

  const handleRemoveAllDrawings = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer tous les dessins ?')) {
      setDrawings([]);
    }
  };

  return (
    <div className="opcvm-chart-view">
      <div className="opcvm-chart-header">
        <div className="chart-header-left">
          <div className="fund-ticker-display">
            <span className="ticker-symbol">{fundTicker}</span>
            <span className="fund-name">{fundName}</span>
          </div>
        </div>

        <div className="chart-header-center">
          <select
            className="timeframe-select"
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </select>
        </div>

        <div className="chart-header-right">
          <button 
            className="icon-btn" 
            onClick={() => setShowIndicators(true)} 
            title="Indicateurs techniques"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
              <polyline points="7.5 19.79 7.5 14.6 3 12" />
              <polyline points="21 12 16.5 14.6 16.5 19.79" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>Indicateurs</span>
          </button>
        </div>
      </div>

      <div className={`opcvm-chart-content ${showRightPanel ? 'with-sidebar' : ''}`}>
        <DrawingToolsV2
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          magnetMode={magnetMode}
          onMagnetModeChange={setMagnetMode}
          stayInDrawingMode={stayInDrawingMode}
          onStayInDrawingModeChange={setStayInDrawingMode}
          drawingsLocked={drawingsLocked}
          onDrawingsLockedChange={setDrawingsLocked}
          drawingsVisible={drawingsVisible}
          onDrawingsVisibleChange={setDrawingsVisible}
          onRemoveAll={handleRemoveAllDrawings}
        />

        <div className="opcvm-chart-main">
          <div ref={chartRef} className="opcvm-chart" style={{ width: '100%', height: '100%' }} />
        </div>

        {showRightPanel && (
          <div className="opcvm-right-panel">
            <button className="panel-close-btn" onClick={() => setShowRightPanel(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h3>Flux YTD</h3>

            <div className="flow-gauge-section">
              <div className="gauge-item">
                <div className="gauge-header">
                  <span className="gauge-label">Taux Souscription YTD</span>
                  <span className="gauge-value positive">{subscriptionRateYTD}%</span>
                </div>
                <div className="horizontal-gauge">
                  <div 
                    className="gauge-fill positive" 
                    style={{ width: `${subscriptionRateYTD}%` }}
                  />
                </div>
              </div>

              <div className="gauge-item">
                <div className="gauge-header">
                  <span className="gauge-label">Taux Rachat YTD</span>
                  <span className="gauge-value negative">{redemptionRateYTD}%</span>
                </div>
                <div className="horizontal-gauge">
                  <div 
                    className="gauge-fill negative" 
                    style={{ width: `${redemptionRateYTD}%` }}
                  />
                </div>
              </div>
            </div>

            <h3 style={{ marginTop: '2rem' }}>Indicateurs Actifs</h3>
            <div className="active-indicators-sidebar-list">
              {activeIndicators.length === 0 ? (
                <p className="no-indicators">Aucun indicateur actif</p>
              ) : (
                activeIndicators.map((indicator) => (
                  <div key={indicator.instanceId} className="indicator-tag">
                    <span style={{ 
                      display: 'inline-block', 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: indicator.color,
                      marginRight: '8px'
                    }} />
                    {indicator.name}
                    <button
                      className="remove-indicator"
                      onClick={() => handleRemoveIndicator(indicator.instanceId)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {!showRightPanel && (
        <button className="panel-toggle-btn" onClick={() => setShowRightPanel(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      <IndicatorsModal
        isOpen={showIndicators}
        onClose={() => setShowIndicators(false)}
        onAddIndicator={handleAddIndicator}
        activeIndicators={activeIndicators.map(ind => ind.id)}
      />

      <IndicatorConfigModal
        isOpen={showIndicatorConfig}
        onClose={() => setShowIndicatorConfig(false)}
        indicatorConfig={selectedIndicatorConfig}
        existingIndicator={editingIndicator}
        onSave={handleSaveIndicator}
      />
    </div>
  );
}
