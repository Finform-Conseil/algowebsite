export const COMPARE_SERIES_PALETTE = ["#00C853", "#2962FF", "#E91E63", "#FF9800", "#7C4DFF"] as const;

export const normalizeCompareSymbol = (symbol: string): string => symbol.trim().toUpperCase();

export const getCompareSeriesId = (symbol: string): string => `compare-${normalizeCompareSymbol(symbol)}`;

export const getCompareSeriesColor = (index: number): string => {
  const paletteIndex = ((index % COMPARE_SERIES_PALETTE.length) + COMPARE_SERIES_PALETTE.length) % COMPARE_SERIES_PALETTE.length;
  return COMPARE_SERIES_PALETTE[paletteIndex];
};
