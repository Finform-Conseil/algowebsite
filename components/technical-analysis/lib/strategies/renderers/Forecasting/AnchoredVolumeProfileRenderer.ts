import type { DrawingPoint } from "../../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../../Indicators/TechnicalIndicators";
import type { DrawingHelpers } from "../../../../config/drawing/drawingInteractionTypes";
import type { EChartsInstance } from "../../../types/echarts";

interface VolumeBin {
  price: number;
  upVolume: number;
  downVolume: number;
  totalVolume: number;
}

interface VolumeProfileData {
  bins: VolumeBin[];
  maxVolume: number;
  pocIdx: number;
  pocPrice: number;
  vahIdx: number;
  valIdx: number;
  vahPrice: number;
  valPrice: number;
  rangeHigh: number;
  rangeLow: number;
}

const profileCache = new Map<string, VolumeProfileData>();
const latestProfileMap = new Map<string, VolumeProfileData>();
const cacheDrawingIds = new Set<string>();

const addToCache = (drawingId: string, cacheKey: string, profile: VolumeProfileData): void => {
  if (!cacheDrawingIds.has(drawingId)) {
    cacheDrawingIds.add(drawingId);
  }
  profileCache.set(cacheKey, profile);
  latestProfileMap.set(drawingId, profile);
};

const clearDrawingFromCache = (drawingId: string): void => {
  cacheDrawingIds.delete(drawingId);
  latestProfileMap.delete(drawingId);
  for (const [key] of profileCache) {
    if (key.startsWith(drawingId + "_")) {
      profileCache.delete(key);
    }
  }
};

export const clearAnchoredVolumeProfileCache = (): void => {
  profileCache.clear();
  latestProfileMap.clear();
  cacheDrawingIds.clear();
};

export const removeAnchoredVolumeProfileFromCache = (drawingId: string): void => {
  clearDrawingFromCache(drawingId);
};

const ensureChartOption = (chart: EChartsInstance): void => {
  const opt = chart.getOption();
  if (!opt || !opt.series) {
    chart.setOption({ series: [] }, true);
  }
};

const getPriceAxisInfo = (chart: EChartsInstance): { yAxisIdx: number; gridIdx: number } => {
  ensureChartOption(chart);
  const option = chart.getOption();
  const seriesList = (option?.series as { type: string; gridIndex?: number }[]) || [];
  const candlestick = seriesList.find(s => s.type === "candlestick");
  const gridIdx = candlestick?.gridIndex ?? 0;
  const yAxisIdx = (option?.yAxis as { gridIndex?: number }[])?.findIndex(
    (axis: { gridIndex?: number }) => axis.gridIndex === gridIdx
  );
  return { yAxisIdx: yAxisIdx !== -1 ? yAxisIdx : 0, gridIdx };
};

const getGridRect = (chart: EChartsInstance, _gridIdx: number) => {
  try {
    const dom = chart.getDom() as HTMLElement | null;
    return getSafeGridRect(chart, dom);
  } catch (e) {
    console.warn("AVP getGridRect delegation failed.", e);
    return null;
  }
};

const getSafeGridRect = (chart: EChartsInstance, dom: HTMLElement | null): { x: number; y: number; width: number; height: number } | null => {
  if (!dom) return null;
  try {
    const option = chart.getOption() as Record<string, unknown>;
    const gridArr = option?.grid as Record<string, unknown>[] | undefined;
    const grid = gridArr?.[0];
    if (grid) {
      const containerWidth = dom.clientWidth || dom.getBoundingClientRect().width || 1200;
      const containerHeight = dom.clientHeight || dom.getBoundingClientRect().height || 700;
      const left = typeof grid.left === "number" ? grid.left : 74;
      const top = typeof grid.top === "number" ? grid.top : 20;
      const width = typeof grid.width === "number" ? grid.width : containerWidth - left - 20;
      const height = typeof grid.height === "number" ? grid.height : containerHeight - top - 40;
      return { x: left, y: top, width, height };
    }
  } catch (e) {
    console.error("safeGridRect error:", e);
  }
  return null;
};

const resolveBarIndex = (chartData: ChartDataPoint[], anchorTime: string | number): number => {
  const directIdx = chartData.findIndex(bar => bar.time === anchorTime);
  if (directIdx !== -1) return directIdx;

  const anchorTs = typeof anchorTime === "number" ? anchorTime : new Date(String(anchorTime)).getTime();
  if (!anchorTs) return -1;

  let bestIdx = -1;
  let bestDist = Infinity;

  for (let i = 0; i < chartData.length; i++) {
    const barTime = chartData[i].time;
    const ts = typeof barTime === "string" ? new Date(barTime).getTime() : Number(barTime);
    const dist = Math.abs(ts - anchorTs);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
};

const calculateAnchoredVolumeProfileData = (
  chartData: ChartDataPoint[],
  startIndex: number,
  numRows: number = 24,
  valueAreaPercent: number = 70
): VolumeProfileData | null => {
  const endIndex = chartData.length - 1;
  const rangeData = chartData.slice(Math.max(0, startIndex), Math.min(chartData.length, endIndex + 1));
  if (rangeData.length === 0) return null;

  let minPrice = Infinity, maxPrice = -Infinity, totalVolume = 0;
  rangeData.forEach(bar => {
    if (bar.low < minPrice) minPrice = bar.low;
    if (bar.high > maxPrice) maxPrice = bar.high;
    totalVolume += (bar.volume || 0);
  });

  if (minPrice === Infinity || maxPrice === -Infinity || totalVolume === 0) return null;

  const rowSize = (maxPrice - minPrice) / numRows;
  if (rowSize === 0) return null;

  const bins: VolumeBin[] = Array.from({ length: numRows }, (_, i) => ({
    price: minPrice + i * rowSize + rowSize / 2,
    upVolume: 0,
    downVolume: 0,
    totalVolume: 0,
  }));

  rangeData.forEach(bar => {
    const isUp = (bar.close ?? 0) >= (bar.open ?? 0);
    const vol = bar.volume || 0;
    const lowIdx = Math.floor(((bar.low ?? 0) - minPrice) / rowSize);
    const highIdx = Math.floor(((bar.high ?? 0) - minPrice) / rowSize);

    if (lowIdx === highIdx) {
      const idx = Math.max(0, Math.min(numRows - 1, lowIdx));
      if (isUp) {
        bins[idx].upVolume += vol;
      } else {
        bins[idx].downVolume += vol;
      }
      bins[idx].totalVolume += vol;
    } else {
      const firstIdx = Math.max(0, Math.min(numRows - 1, lowIdx));
      const lastIdx = Math.max(0, Math.min(numRows - 1, highIdx));
      const totalBins = Math.max(1, lastIdx - firstIdx + 1);
      const volPerBin = vol / totalBins;
      for (let idx = firstIdx; idx <= lastIdx; idx++) {
        if (isUp) {
          bins[idx].upVolume += volPerBin;
        } else {
          bins[idx].downVolume += volPerBin;
        }
        bins[idx].totalVolume += volPerBin;
      }
    }
  });

  let maxVolume = 0;
  let pocIdx = 0;
  bins.forEach((bin, i) => {
    if (bin.totalVolume > maxVolume) {
      maxVolume = bin.totalVolume;
      pocIdx = i;
    }
  });

  if (maxVolume === 0) return null;

  const totalVP = bins.reduce((sum, b) => sum + b.totalVolume, 0);
  const vaTarget = totalVP * (valueAreaPercent / 100);

  let vaSum = maxVolume;
  let vahIdx = pocIdx;
  let valIdx = pocIdx;

  while (vaSum < vaTarget && (vahIdx < numRows - 1 || valIdx > 0)) {
    const above = vahIdx < numRows - 1 ? bins[vahIdx + 1].totalVolume : -1;
    const below = valIdx > 0 ? bins[valIdx - 1].totalVolume : -1;

    if (above >= below && vahIdx < numRows - 1) {
      vahIdx += 1;
      vaSum += above;
    } else if (valIdx > 0) {
      valIdx -= 1;
      vaSum += below;
    } else {
      break;
    }
  }

  return {
    bins,
    maxVolume,
    pocIdx,
    pocPrice: bins[pocIdx].price,
    vahIdx,
    valIdx,
    vahPrice: bins[vahIdx].price,
    valPrice: bins[valIdx].price,
    rangeHigh: maxPrice,
    rangeLow: minPrice,
  };
};

const resolveHistogramBackground = (chart: EChartsInstance): string => {
  const dom = chart.getDom() as HTMLElement | null;
  const color = dom ? getComputedStyle(dom).backgroundColor : "";
  if (color && color !== "rgba(0, 0, 0, 0)" && color !== "transparent") {
    return color;
  }
  return "rgb(15, 42, 66)";
};

const formatVolume = (vol: number): string => {
  if (vol >= 1000000) return (vol / 1000000).toFixed(1) + "M";
  if (vol >= 1000) return (vol / 1000).toFixed(0) + "K";
  return vol.toFixed(0);
};

const distanceBetweenPoints = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
};

export const renderAnchoredVolumeProfile = (
  pts: { x: number; y: number }[],
  dataPoints: DrawingPoint[],
  drawing: Drawing,
  chart: EChartsInstance,
  isSelected: boolean,
  h: DrawingHelpers,
  chartData: ChartDataPoint[]
): void => {
  if (!chart || !chartData || chartData.length === 0 || pts.length < 1 || !dataPoints[0]) {
    return;
  }

  const { ctx } = h;
  const { yAxisIdx, gridIdx } = getPriceAxisInfo(chart);
  const gridRect = getGridRect(chart, gridIdx);

  const props = drawing.anchoredVolumeProfileProps || {
    layout: "Number of Rows",
    rowSize: 24,
    volume: "Up/Down",
    valueAreaVolume: 70,
    upColor: "rgba(146, 226, 236, 0.5)",
    downColor: "rgba(245, 159, 188, 0.5)",
    vaUpColor: "rgba(135, 215, 225, 0.7)",
    vaDownColor: "rgba(239, 153, 182, 0.7)",
    pocColor: "#000000",
    width: 34,
    placement: "Right",
    showLabels: false,
    showPOC: true,
    showValueArea: true
  };

  const anchorIdx = resolveBarIndex(chartData, dataPoints[0].time);
  if (anchorIdx === -1) {
    return;
  }

  const toY = (price: number): number => {
    const py = chart.convertToPixel({ yAxisIndex: yAxisIdx }, price);
    return typeof py === "number" ? Math.round(py) : 0;
  };

  const numRows = props.layout === "Number of Rows" ? props.rowSize : 24;

  const cacheKey = `${drawing.id}_${anchorIdx}_${numRows}_${props.valueAreaVolume}`;

  let profile: VolumeProfileData | null | undefined = profileCache.get(cacheKey);

  if (!profile || drawing.isCreating) {
    profile = calculateAnchoredVolumeProfileData(chartData, anchorIdx, numRows, props.valueAreaVolume);
    if (profile) addToCache(drawing.id, cacheKey, profile);
  }

  if (!profile) return;

  const gridRight = gridRect ? gridRect.x + gridRect.width : ctx.canvas.width - 50;
  const gridLeft = gridRect ? gridRect.x : 0;
  const anchorGuideX = Math.max(gridLeft, Math.min(gridRight, pts[0].x));
  const profileWidth = Math.max(1, (gridRect?.width || ctx.canvas.width) * (props.width / 100));
  const profileLeft = props.placement === "Right" ? gridRight - profileWidth : anchorGuideX;
  const profileRight = props.placement === "Right" ? gridRight : anchorGuideX + profileWidth;

  const pT0 = toY(profile.bins[0].price);
  const pT1 = toY(profile.bins[Math.min(1, profile.bins.length - 1)].price);
  const rowH = Math.abs(pT0 - pT1);

  const binH = Math.min(120, Math.max(1, rowH - 0.5));

  ctx.save();

  if (gridRect) {
    ctx.beginPath();
    ctx.rect(gridRect.x, gridRect.y, gridRect.width, gridRect.height);
    ctx.clip();
  }

  const rangeYHigh = toY(profile.rangeHigh);
  const rangeYLow = toY(profile.rangeLow);
  const rangeTop = Math.min(rangeYHigh, rangeYLow);
  const rangeHeight = Math.abs(rangeYHigh - rangeYLow);
  const selectionLeft = Math.min(anchorGuideX, gridRight);
  const selectionWidth = Math.abs(gridRight - anchorGuideX);

  ctx.fillStyle = "rgba(120, 220, 225, 0.08)";
  ctx.fillRect(selectionLeft, rangeTop, selectionWidth, rangeHeight);

  ctx.fillStyle = resolveHistogramBackground(chart);
  ctx.fillRect(profileLeft, rangeTop, Math.max(1, profileRight - profileLeft), rangeHeight);

  ctx.fillStyle = "rgba(120, 220, 225, 0.12)";
  ctx.fillRect(profileLeft, rangeTop, Math.max(1, profileRight - profileLeft), rangeHeight);

  profile.bins.forEach((bin, i) => {
    const binY = toY(bin.price);

    const upW = (bin.upVolume / profile!.maxVolume) * profileWidth;
    const downW = (bin.downVolume / profile!.maxVolume) * profileWidth;
    const totalW = upW + downW;
    const rowX = props.placement === "Right" ? profileRight - totalW : profileLeft;

    const isInVA = i <= profile!.vahIdx && i >= profile!.valIdx;

    ctx.fillStyle = isInVA ? props.vaDownColor : props.downColor;
    ctx.fillRect(rowX, binY - binH / 2, downW, binH);

    ctx.fillStyle = isInVA ? props.vaUpColor : props.upColor;
    ctx.fillRect(rowX + downW, binY - binH / 2, upW, binH);

    if (props.showLabels && profileWidth > 70 && rowH > 12) {
      ctx.font = "bold 9px Inter, Roboto, sans-serif";
      ctx.fillStyle = "rgba(17, 24, 39, 0.65)";
      ctx.textAlign = props.placement === "Right" ? "right" : "left";
      const labelX = props.placement === "Right" ? rowX - 8 : rowX + totalW + 8;
      ctx.fillText(formatVolume(bin.totalVolume), labelX, binY + 3);
    }
  });

  const renderLimit = (price: number, label: string) => {
    const y = toY(price);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(120, 123, 134, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(profileLeft, y);
    ctx.lineTo(gridRight, y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "9px Inter, Arial";
    ctx.textAlign = "left";
    ctx.fillText(label, gridRight + 5, y + 3);
  };

  if (props.showValueArea && isSelected) {
    renderLimit(profile.vahPrice, "VAH");
    renderLimit(profile.valPrice, "VAL");
  }

  if (props.showPOC !== false) {
    const pocY = toY(profile.pocPrice);
    ctx.setLineDash([]);
    ctx.strokeStyle = props.pocColor || "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(profileLeft, pocY);
    ctx.lineTo(gridRight, pocY);
    ctx.stroke();
  }

  ctx.restore();

  ctx.save();
  if (gridRect) {
    ctx.beginPath();
    ctx.rect(gridRect.x, gridRect.y, gridRect.width, gridRect.height);
    ctx.clip();
  }
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = "rgba(120, 123, 134, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, 0);
  ctx.lineTo(pts[0].x, ctx.canvas.height);
  ctx.stroke();
  ctx.restore();

  if (isSelected || drawing.isCreating) {
    ctx.shadowBlur = 4;
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#2196f3";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
};

export const hitTestAnchoredVolumeProfile = (
  mx: number,
  my: number,
  pts: { x: number; y: number }[],
  drawing: Drawing,
  chart: EChartsInstance,
  _threshold: number
): { isHit: boolean; hitType: "point" | "shape" | null; pointIndex?: number } => {
  if (pts.length < 1) return { isHit: false, hitType: null };

  const handleRadius = 18;
  for (let i = 0; i < pts.length; i++) {
    if (distanceBetweenPoints(mx, my, pts[i].x, pts[i].y) < handleRadius) {
      return { isHit: true, hitType: "point", pointIndex: i };
    }
  }

  const activeProfile = latestProfileMap.get(drawing.id);
  if (activeProfile) {
    const { yAxisIdx } = getPriceAxisInfo(chart);
    const mapToY = (price: number): number => {
      const py = chart.convertToPixel({ yAxisIndex: yAxisIdx }, price);
      return typeof py === "number" ? Math.round(py) : 0;
    };

    const yH = mapToY(activeProfile.rangeHigh);
    const yL = mapToY(activeProfile.rangeLow);

    const t = Math.min(yH, yL);
    const b = Math.max(yH, yL);

    const option = chart.getOption();
    const seriesList = (option?.series as { type: string; gridIndex?: number }[]) || [];
    const candlestick = seriesList.find(s => s.type === "candlestick");
    const gridIdx = candlestick?.gridIndex ?? 0;
    const gridRect = getGridRect(chart, gridIdx);
    const gridRight = gridRect ? gridRect.x + gridRect.width : 1350;

    if (mx >= pts[0].x - 5 && mx <= gridRight + 5 && my >= t - 5 && my <= b + 5) {
      return { isHit: true, hitType: "shape" };
    }
  }

  return { isHit: false, hitType: null };
};
