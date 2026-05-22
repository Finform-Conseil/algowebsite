import type { RawBar } from "./types";

export const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const roundToPrecision = (value: number, precision: number): number => {
  const factor = 10 ** Math.max(0, precision);
  return Math.round(value * factor) / factor;
};

export const roundToTick = (value: number, tickSize: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(tickSize) || tickSize <= 0) return value;
  return Math.round(value / tickSize) * tickSize;
};

export const floorToTick = (value: number, tickSize: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(tickSize) || tickSize <= 0) return value;
  return Math.floor(value / tickSize) * tickSize;
};

export const ceilToTick = (value: number, tickSize: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(tickSize) || tickSize <= 0) return value;
  return Math.ceil(value / tickSize) * tickSize;
};

export const percentile = (values: number[], pct: number): number => {
  const clean = values.filter(Number.isFinite).sort((left, right) => left - right);
  if (clean.length === 0) return 0;

  const rank = clampNumber((pct / 100) * (clean.length - 1), 0, clean.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return clean[lower];

  const weight = rank - lower;
  return clean[lower] * (1 - weight) + clean[upper] * weight;
};

export const sumNumbers = (values: number[]): number =>
  values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);

export const calculateTrueRange = (bar: RawBar, previousClose?: number): number => {
  if (typeof previousClose !== "number" || !Number.isFinite(previousClose)) return bar.high - bar.low;
  return Math.max(
    bar.high - bar.low,
    Math.abs(bar.high - previousClose),
    Math.abs(bar.low - previousClose),
  );
};

export const calculateAtrWilder = (bars: RawBar[], period: number): Array<number | null> => {
  const result: Array<number | null> = new Array(bars.length).fill(null);
  if (period <= 0 || bars.length < period) return result;

  const trueRanges = bars.map((bar, index) => calculateTrueRange(bar, bars[index - 1]?.close));
  let sum = 0;

  for (let index = 0; index < period; index++) {
    sum += trueRanges[index];
  }

  let atr = sum / period;
  result[period - 1] = atr;

  for (let index = period; index < trueRanges.length; index++) {
    atr = (atr * (period - 1) + trueRanges[index]) / period;
    result[index] = atr;
  }

  return result;
};

export const getLastFinite = (values: Array<number | null | undefined>): number | null => {
  for (let index = values.length - 1; index >= 0; index--) {
    const value = values[index];
    if (Number.isFinite(value)) return value as number;
  }
  return null;
};

export const buildPriceRows = (
  low: number,
  high: number,
  rowSize: number,
): Array<{ priceLow: number; priceHigh: number }> => {
  if (!Number.isFinite(low) || !Number.isFinite(high) || !Number.isFinite(rowSize) || rowSize <= 0) return [];

  const start = Math.floor(low / rowSize) * rowSize;
  const end = Math.ceil(high / rowSize) * rowSize;
  const rows: Array<{ priceLow: number; priceHigh: number }> = [];

  for (let priceLow = start; priceLow < end; priceLow += rowSize) {
    rows.push({ priceLow, priceHigh: priceLow + rowSize });
  }

  return rows.length > 0 ? rows : [{ priceLow: low, priceHigh: high }];
};
