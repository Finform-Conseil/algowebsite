export const LAST_PRICE_AXIS_UP_COLOR = "#047857";
export const LAST_PRICE_AXIS_DOWN_COLOR = "#c91d2e";
// TradingView clean-room runtime evidence: the vertical price scale is a dedicated
// 78px surface, separate from the plot canvas. Keep the local pane contract at the
// same width so labels and last-price badges live in a compact, stable gutter.
export const LAST_PRICE_AXIS_BADGE_WIDTH_PX = 78;
export const LAST_PRICE_AXIS_GUTTER_PX = 78;

const PRICE_AXIS_TARGET_MAJOR_TICK_SPACING_PX = 44;
const PRICE_AXIS_MIN_SPLITS = 5;
const PRICE_AXIS_MAX_SPLITS = 14;

/**
 * Resolves the major price-grid density from the price pane itself, never from
 * the full chart container. This is critical when volume/oscillator panes are
 * visible: using total chart height overestimates available vertical room and
 * produces an unreadably dense price scale.
 */
export const resolvePriceAxisSplitNumber = (
  containerHeightPx: number | null | undefined,
  pricePaneHeightPercent: number,
): number => {
  const safeContainerHeight = Number.isFinite(containerHeightPx)
    ? Math.max(0, Number(containerHeightPx))
    : 420;
  const safePanePercent = Number.isFinite(pricePaneHeightPercent)
    ? Math.min(100, Math.max(10, pricePaneHeightPercent))
    : 70;
  const pricePaneHeightPx = safeContainerHeight * (safePanePercent / 100);
  return Math.max(
    PRICE_AXIS_MIN_SPLITS,
    Math.min(PRICE_AXIS_MAX_SPLITS, Math.round(pricePaneHeightPx / PRICE_AXIS_TARGET_MAJOR_TICK_SPACING_PX)),
  );
};

/**
 * The last-price badge and its horizontal price line represent one visual identity.
 * Their direction is therefore derived from the latest candle body (close vs open),
 * never from the previous session close used by OHLC change metrics.
 */
export const resolveLastPriceAxisColor = (
  close: number,
  open: number,
): string => close >= open ? LAST_PRICE_AXIS_UP_COLOR : LAST_PRICE_AXIS_DOWN_COLOR;
