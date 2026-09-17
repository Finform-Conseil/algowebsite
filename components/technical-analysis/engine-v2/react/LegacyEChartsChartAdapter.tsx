"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../lib/types/echarts";
import { useEChartsRenderer } from "../../hooks/useEChartsRenderer";
import {
  selectAdvancedIndicators,
  selectBollingerSettings,
  selectChartAppearance,
  selectChartConfig,
  selectIndicatorPeriods,
  selectUiState,
} from "../../store/selectors";

interface LegacyEChartsChartAdapterProps {
  bars: ChartDataPoint[];
  symbol: string;
  marketLabel: string;
  onReady?: (readyMs: number) => void;
}

export const LegacyEChartsChartAdapter = ({
  bars,
  symbol,
  marketLabel,
  onReady,
}: LegacyEChartsChartAdapterProps) => {
  const stockChartRef = useRef<HTMLDivElement>(null);
  const layersStackRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<EChartsInstance | null>(null);
  const lastZoomRangeRef = useRef({ start: 0, end: 100 });
  const mountedAtRef = useRef(performance.now());
  const reportedReadyRef = useRef(false);
  const onReadyRef = useRef(onReady);

  const chartConfig = useSelector(selectChartConfig);
  const advancedIndicators = useSelector(selectAdvancedIndicators);
  const indicatorPeriods = useSelector(selectIndicatorPeriods);
  const bollingerSettings = useSelector(selectBollingerSettings);
  const chartAppearance = useSelector(selectChartAppearance);
  const uiState = useSelector(selectUiState);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const handleReady = useCallback(() => {
    if (reportedReadyRef.current) return;
    reportedReadyRef.current = true;
    onReadyRef.current?.(performance.now() - mountedAtRef.current);
  }, []);

  useEChartsRenderer({
    stockChartRef,
    layersStackRef,
    chartInstanceRef,
    chartData: bars,
    chartConfig: { ...chartConfig, symbol },
    advancedIndicators,
    indicatorPeriods,
    bollingerSettings,
    chartAppearance,
    uiState,
    displaySymbol: symbol,
    marketLabel,
    hideChartTitle: true,
    lastZoomRangeRef,
    lastPriceAxisValue: bars[bars.length - 1]?.close,
    isMainChartVisible: true,
    isChartLoading: false,
    comparisonSeries: [],
    hiddenObjectIds: {},
    pineOverlay: null,
    onChartVisualReady: handleReady,
  });

  return (
    <div
      ref={layersStackRef}
      data-engine-adapter="legacy-echarts"
      style={{ position: "relative", width: "100%", height: "100%", minHeight: 0, overflow: "hidden" }}
    >
      <div ref={stockChartRef} style={{ width: "100%", height: "100%", minHeight: 0 }} />
    </div>
  );
};
