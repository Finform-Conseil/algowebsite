"use client";

import React from "react";

import type { ChartRenderEngineProps } from "./chartRenderContracts";
import { useCursorRenderer } from "../../hooks/useCursorRenderer";
import { useEChartsRenderer } from "../../hooks/useEChartsRenderer";
import { useOverlayRenderer } from "../../hooks/useOverlayRenderer";

export const ChartRenderEngine: React.FC<ChartRenderEngineProps> = ({ chart, overlay, cursor }) => {
  useEChartsRenderer(chart);
  useOverlayRenderer(overlay);
  useCursorRenderer(cursor);

  return null;
};

export type { ChartRenderEngineProps } from "./chartRenderContracts";
export { CHART_RENDER_HOOK_ORDER } from "./chartRenderContracts";
