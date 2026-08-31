import type { EChartsInstance } from "../../lib/types/echarts";
import { TV_X_AXIS_HEIGHT, TV_Y_AXIS_WIDTH, clamp } from "../viewport/viewportMath";
import { getSafeGridRect } from "../viewport/viewportGraphics";

const TV_AXIS_BADGE_RIGHT_INSET = 8;
const TV_AXIS_ACTION_GAP = 3;
const TV_CURSOR_BADGE_MIN_WIDTH = 72;

export interface CursorPriceAxisBadgeElements {
  badge: HTMLDivElement | null;
  text: HTMLSpanElement | null;
  action: HTMLButtonElement | null;
}

export interface LastPriceAxisBadgeElements {
  badge: HTMLDivElement | null;
  line: HTMLDivElement | null;
}

export const formatCursorPriceAxisValue = (value: number): string => {
  const decimals = Math.abs(value) < 10 ? 4 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const hideCursorPriceAxisBadge = ({ badge, action }: CursorPriceAxisBadgeElements): void => {
  if (badge) {
    badge.style.opacity = "0";
    badge.style.visibility = "hidden";
  }
  if (action) {
    action.style.opacity = "0";
    action.style.visibility = "hidden";
  }
};

/**
 * Keep the crosshair price label in the price-axis surface while deriving the
 * price from the actual ECharts host. The overlay container can include a
 * multi-chart header, so chart-space and overlay-space must never be confused.
 */
export const updateCursorPriceAxisBadge = ({
  chart,
  overlayContainer,
  elements,
  clientX,
  clientY,
  cursorMode,
  isChartLoading,
}: {
  chart: EChartsInstance | null;
  overlayContainer: HTMLElement | null;
  elements: CursorPriceAxisBadgeElements;
  clientX: number;
  clientY: number;
  cursorMode: string;
  isChartLoading: boolean;
}): void => {
  const { badge, text, action } = elements;
  if (
    isChartLoading
    || cursorMode === "arrow"
    || !chart
    || chart.isDisposed()
    || !overlayContainer
    || !badge
    || !text
    || !action
  ) {
    hideCursorPriceAxisBadge(elements);
    return;
  }

  try {
    const chartDom = chart.getDom();
    if (!chartDom?.isConnected) {
      hideCursorPriceAxisBadge(elements);
      return;
    }

    const chartRect = chartDom.getBoundingClientRect();
    const overlayRect = overlayContainer.getBoundingClientRect();
    if (chartRect.width <= 0 || chartRect.height <= 0 || overlayRect.height <= 0) {
      hideCursorPriceAxisBadge(elements);
      return;
    }

    const chartX = clientX - chartRect.left;
    const chartY = clientY - chartRect.top;
    const overlayY = clientY - overlayRect.top;
    const gridRect = getSafeGridRect(chart, chartDom);
    const gridRight = Math.min(chartRect.width - TV_Y_AXIS_WIDTH, gridRect.x + gridRect.width);
    const gridTop = Math.max(0, gridRect.y);
    const gridBottom = Math.min(chartRect.height - TV_X_AXIS_HEIGHT, gridRect.y + gridRect.height);

    if (chartX < gridRect.x || chartX > gridRight || chartY < gridTop || chartY > gridBottom) {
      hideCursorPriceAxisBadge(elements);
      return;
    }

    const pointInData = chart.convertFromPixel(
      { xAxisIndex: 0, yAxisIndex: 0 },
      [chartX, chartY],
    );
    if (!Array.isArray(pointInData) || !Number.isFinite(Number(pointInData[1]))) {
      hideCursorPriceAxisBadge(elements);
      return;
    }

    const priceValue = Number(pointInData[1]);
    const formattedPrice = formatCursorPriceAxisValue(priceValue);
    const chartTopInOverlay = chartRect.top - overlayRect.top;
    const clampedOverlayY = clamp(
      overlayY,
      chartTopInOverlay + gridTop + 11,
      chartTopInOverlay + gridBottom - 11,
    );

    text.textContent = formattedPrice;
    badge.style.top = `${Math.round(clampedOverlayY)}px`;
    badge.style.opacity = "1";
    badge.style.visibility = "visible";

    const badgeWidth = Math.max(
      TV_CURSOR_BADGE_MIN_WIDTH,
      Math.ceil(badge.getBoundingClientRect().width),
    );
    action.style.top = `${Math.round(clampedOverlayY)}px`;
    action.style.right = `${TV_AXIS_BADGE_RIGHT_INSET + badgeWidth + TV_AXIS_ACTION_GAP}px`;
    action.style.opacity = "1";
    action.style.visibility = "visible";
    action.dataset.price = priceValue.toString();
    action.dataset.priceLabel = formattedPrice;
  } catch {
    hideCursorPriceAxisBadge(elements);
  }
};

export const hideLastPriceAxisBadge = ({ badge, line }: LastPriceAxisBadgeElements): void => {
  if (badge) {
    badge.style.opacity = "0";
    badge.style.visibility = "hidden";
  }
  if (line) {
    line.style.opacity = "0";
    line.style.visibility = "hidden";
  }
};

/**
 * Positions the live/last-price quote card against the active chart's price scale.
 * Chart coordinates come from the ECharts host; DOM placement stays in the shared
 * price-axis overlay so single-chart and active multi-chart peers use one contract.
 */
export const updateLastPriceAxisBadge = ({
  chart,
  overlayContainer,
  elements,
  priceValue,
  isChartLoading,
}: {
  chart: EChartsInstance | null;
  overlayContainer: HTMLElement | null;
  elements: LastPriceAxisBadgeElements;
  priceValue: number | undefined;
  isChartLoading: boolean;
}): void => {
  const { badge, line } = elements;
  if (
    isChartLoading
    || !chart
    || chart.isDisposed()
    || !overlayContainer
    || !badge
    || !line
    || !Number.isFinite(priceValue)
  ) {
    hideLastPriceAxisBadge(elements);
    return;
  }

  try {
    const chartDom = chart.getDom();
    if (!chartDom?.isConnected) {
      hideLastPriceAxisBadge(elements);
      return;
    }

    const chartRect = chartDom.getBoundingClientRect();
    const overlayRect = overlayContainer.getBoundingClientRect();
    if (chartRect.width <= 0 || chartRect.height <= 0 || overlayRect.height <= 0) {
      hideLastPriceAxisBadge(elements);
      return;
    }

    const pixelValue = chart.convertToPixel({ yAxisIndex: 0 }, priceValue as number);
    const chartY = Array.isArray(pixelValue) ? Number(pixelValue[1]) : Number(pixelValue);
    if (!Number.isFinite(chartY)) {
      hideLastPriceAxisBadge(elements);
      return;
    }

    const gridRect = getSafeGridRect(chart, chartDom);
    const gridTop = Math.max(0, gridRect.y);
    const gridBottom = Math.min(chartRect.height - TV_X_AXIS_HEIGHT, gridRect.y + gridRect.height);
    const chartTopInOverlay = chartRect.top - overlayRect.top;
    const clampedOverlayY = clamp(
      chartTopInOverlay + chartY,
      chartTopInOverlay + gridTop + 11,
      chartTopInOverlay + gridBottom - 11,
    );

    badge.style.top = `${Math.round(clampedOverlayY)}px`;
    badge.style.opacity = "1";
    badge.style.visibility = "visible";

    // TradingView-style quote card owns the last-price identity; the native
    // ECharts mark line remains the chart's line renderer and is not duplicated here.
    line.style.opacity = "0";
    line.style.visibility = "hidden";
  } catch {
    hideLastPriceAxisBadge(elements);
  }
};
