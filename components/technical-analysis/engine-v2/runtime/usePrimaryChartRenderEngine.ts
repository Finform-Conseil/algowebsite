"use client";

import { useCallback, useEffect, useState } from "react";

export const PRIMARY_CHART_RENDER_ENGINE_STORAGE_KEY = "ta:primary-chart-render-engine:v1";

export const PRIMARY_CHART_RENDER_ENGINES = ["echarts", "vela"] as const;
export type PrimaryChartRenderEngine = (typeof PRIMARY_CHART_RENDER_ENGINES)[number];

export const normalizePrimaryChartRenderEngine = (
  value: string | null | undefined,
): PrimaryChartRenderEngine => value === "vela" ? "vela" : "echarts";

export const usePrimaryChartRenderEngine = () => {
  const [engine, setEngineState] = useState<PrimaryChartRenderEngine>("echarts");

  useEffect(() => {
    try {
      setEngineState(normalizePrimaryChartRenderEngine(
        window.localStorage.getItem(PRIMARY_CHART_RENDER_ENGINE_STORAGE_KEY),
      ));
    } catch {
      setEngineState("echarts");
    }
  }, []);

  const setEngine = useCallback((next: PrimaryChartRenderEngine) => {
    setEngineState(next);
    try {
      window.localStorage.setItem(PRIMARY_CHART_RENDER_ENGINE_STORAGE_KEY, next);
    } catch {
      // Persistence is opportunistic. Runtime switching must remain functional
      // when storage is disabled or unavailable.
    }
  }, []);

  return { engine, setEngine } as const;
};
