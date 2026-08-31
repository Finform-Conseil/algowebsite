"use client";

import React from "react";

import type { ChartRenderEngineProps } from "./chartRenderContracts";
import { useCursorRenderer } from "../../hooks/useCursorRenderer";
import { useOverlayRenderer } from "../../hooks/useOverlayRenderer";

type ChartInteractionEngineProps = Pick<ChartRenderEngineProps, "overlay" | "cursor">;

/**
 * Interaction-only companion for a chart whose price renderer is owned elsewhere.
 * Multi-chart peers keep their persistent ECharts instance while the active peer
 * receives the canonical drawing/cursor layers without mounting a second price chart.
 */
export const ChartInteractionEngine: React.FC<ChartInteractionEngineProps> = ({ overlay, cursor }) => {
  useOverlayRenderer(overlay);
  useCursorRenderer(cursor);
  return null;
};
