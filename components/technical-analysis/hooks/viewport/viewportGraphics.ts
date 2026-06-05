import type { ECharts } from "echarts/core";
import {
  MAIN_GRID_LEFT,
  TV_X_AXIS_HEIGHT,
  TV_Y_AXIS_WIDTH,
  clamp,
} from "./viewportMath";

export interface PriceLevelViewportMarker {
  id: string;
  label: string;
  value: number;
  color: string;
}

const PRICE_LEVEL_OFFSCREEN_PREFIX = "price-level-offscreen-";
const PRICE_LEVEL_OFFSCREEN_WIDTH = 108;
const PRICE_LEVEL_OFFSCREEN_HEIGHT = 20;
const PRICE_LEVEL_OFFSCREEN_GAP = 4;

export const getSafeGridRect = (_chart: ECharts | null, container: HTMLElement | null) => {
  const defaultFallback = { x: MAIN_GRID_LEFT, y: 30, width: 800, height: 600 };
  if (!container) return defaultFallback;

  const rect = container.getBoundingClientRect();
  const safeTop = Math.max(30, rect.height * 0.08);
  const safeBottom = rect.height - TV_X_AXIS_HEIGHT;
  const safeLeft = MAIN_GRID_LEFT;
  const safeRight = rect.width - TV_Y_AXIS_WIDTH;

  return {
    x: safeLeft,
    y: safeTop,
    width: Math.max(10, safeRight - safeLeft),
    height: Math.max(10, safeBottom - safeTop),
  };
};

const formatViewportPriceLevel = (value: number): string => {
  const decimals = Math.abs(value) < 10 ? 4 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const toRgbaColor = (color: string, alpha: number): string => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (!match) return color;

  const red = parseInt(match[1], 16);
  const green = parseInt(match[2], 16);
  const blue = parseInt(match[3], 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const buildOffscreenPriceLevelGraphics = ({
  chart,
  container,
  markers,
  yAxisMin,
  yAxisMax,
  previousGraphicIds,
}: {
  chart: ECharts;
  container: HTMLElement | null;
  markers: PriceLevelViewportMarker[];
  yAxisMin: number;
  yAxisMax: number;
  previousGraphicIds: Set<string>;
}): Record<string, unknown>[] => {
  const gridRect = getSafeGridRect(chart, container);
  const nextGraphicIds = new Set<string>();
  const topMarkers = markers
    .filter((marker) => Number.isFinite(marker.value) && marker.value > yAxisMax)
    .sort((left, right) => right.value - left.value);
  const bottomMarkers = markers
    .filter((marker) => Number.isFinite(marker.value) && marker.value < yAxisMin)
    .sort((left, right) => left.value - right.value);

  const buildMarkerGroup = (
    marker: PriceLevelViewportMarker,
    index: number,
    side: "top" | "bottom",
  ): Record<string, unknown> => {
    const id = `${PRICE_LEVEL_OFFSCREEN_PREFIX}${marker.id}`;
    nextGraphicIds.add(id);

    const x = Math.max(gridRect.x + 8, gridRect.x + gridRect.width - PRICE_LEVEL_OFFSCREEN_WIDTH - 6);
    const rawY = side === "top"
      ? gridRect.y + 6 + (index * (PRICE_LEVEL_OFFSCREEN_HEIGHT + PRICE_LEVEL_OFFSCREEN_GAP))
      : gridRect.y + gridRect.height - PRICE_LEVEL_OFFSCREEN_HEIGHT - 6 - (index * (PRICE_LEVEL_OFFSCREEN_HEIGHT + PRICE_LEVEL_OFFSCREEN_GAP));
    const arrow = side === "top" ? "↑" : "↓";
    const text = `${marker.label} ${arrow} ${formatViewportPriceLevel(marker.value)}`;

    return {
      id,
      type: "group",
      x,
      y: clamp(rawY, gridRect.y + 4, gridRect.y + gridRect.height - PRICE_LEVEL_OFFSCREEN_HEIGHT - 4),
      z: 96,
      silent: true,
      children: [
        {
          type: "rect",
          shape: {
            x: 0,
            y: 0,
            width: PRICE_LEVEL_OFFSCREEN_WIDTH,
            height: PRICE_LEVEL_OFFSCREEN_HEIGHT,
            r: 3,
          },
          style: {
            fill: toRgbaColor(marker.color, 0.92),
            stroke: toRgbaColor(marker.color, 1),
            lineWidth: 1,
            shadowBlur: 8,
            shadowColor: "rgba(0, 0, 0, 0.26)",
          },
        },
        {
          type: "text",
          style: {
            x: 5,
            y: 10,
            text,
            fill: "#ffffff",
            font: "700 9px Inter, system-ui, sans-serif",
            textVerticalAlign: "middle",
            width: PRICE_LEVEL_OFFSCREEN_WIDTH - 10,
            overflow: "truncate",
          },
        },
      ],
    };
  };

  const graphics = [
    ...topMarkers.map((marker, index) => buildMarkerGroup(marker, index, "top")),
    ...bottomMarkers.map((marker, index) => buildMarkerGroup(marker, index, "bottom")),
  ];

  previousGraphicIds.forEach((id) => {
    if (!nextGraphicIds.has(id)) {
      graphics.push({ id, $action: "remove" });
    }
  });
  previousGraphicIds.clear();
  nextGraphicIds.forEach((id) => previousGraphicIds.add(id));

  return graphics;
};
