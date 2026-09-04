import type { AdvancedIndicatorsState, IndicatorPeriods } from "../../../config/indicators/advancedIndicatorsTypes";
import type { ChartAppearance, ChartState } from "../../../config/state/chartStateTypes";
import { getCompareInstrumentLabel, getCompareSeriesId, resolveCompareSeriesSettings, type CompareSeriesSettingsMap } from "../../../config/compare-series/compareSeries";
import {
  buildEmaSeriesDefinitions,
  buildSmaSeriesDefinitions,
  mergeMovingAveragePeriods,
} from "../../../config/indicators/movingAverageSeries";
import { buildAdvancedMovingAverageSeriesDefinitions } from "../../../config/indicators/advancedMovingAverageSeries";
import { ADVANCED_INDICATOR_LABELS } from "./objectTreeAdvancedLabels";
import { buildAdvancedChildObjectTreeItems } from "./objectTreeAdvancedChildItems";
import { getToolLabel } from "./objectTreeDrawingLabels";
import type { ObjectTreeItem } from "./objectTreeItemTypes";
import type { PineChartOverlayPayload } from "../../../components/sidebar/panels/pineEditor/pineTypes";
import { resolveVolumeStudyLifecycle } from "../../../store/policies/volumeStudyLifecycle";

type MovingAverageSignalSources = {
  sma: number[];
  ema: number[];
};

type BuildObjectTreeItemsInput = {
  chartConfig: ChartState;
  indicatorPeriods: IndicatorPeriods;
  chartAppearance: ChartAppearance;
  advancedIndicators: AdvancedIndicatorsState;
  isMainChartVisible: boolean;
  activeTool: string | null;
  hiddenObjectIds: Record<string, boolean>;
  comparisonSymbols: string[];
  comparisonSettings: CompareSeriesSettingsMap;
  movingAverageTrendSignals: MovingAverageSignalSources;
  priceVsSmaSourcePeriods: number[];
  priceVsEmaSourcePeriods: number[];
  pineChartOverlay: PineChartOverlayPayload | null;
};

const VOLUME_COLOR = "#6256d9";

const buildBaseSeriesItems = ({
  chartConfig,
  isMainChartVisible,
  hiddenObjectIds,
  comparisonSymbols,
  comparisonSettings,
}: Pick<BuildObjectTreeItemsInput, "chartConfig" | "isMainChartVisible" | "hiddenObjectIds" | "comparisonSymbols" | "comparisonSettings">): ObjectTreeItem[] => [
  {
    id: "main-series",
    label: chartConfig.symbol || "Main series",
    kind: "series",
    visible: isMainChartVisible && !hiddenObjectIds["main-series"],
    color: "#26a69a",
    removable: false,
  },
  ...comparisonSymbols.map((comparisonKey, index) => {
    const id = getCompareSeriesId(comparisonKey);

    return {
      id,
      label: getCompareInstrumentLabel(comparisonKey),
      kind: "series",
      visible: !hiddenObjectIds[id],
      color: resolveCompareSeriesSettings(comparisonKey, index, comparisonSettings).color,
      removable: true,
      comparisonKey,
    } satisfies ObjectTreeItem;
  }),
];

const buildActiveToolItem = (activeTool: string | null, hiddenObjectIds: Record<string, boolean>): ObjectTreeItem[] => {
  if (!activeTool) return [];

  const id = "active-tool-" + activeTool;
  return [{
    id,
    label: "Outil actif: " + getToolLabel(activeTool),
    kind: "tool",
    visible: !hiddenObjectIds[id],
    color: "#facc15",
    removable: false,
  }];
};

const buildVolumeItem = ({
  chartConfig,
  chartAppearance,
}: Pick<BuildObjectTreeItemsInput, "chartConfig" | "chartAppearance">): ObjectTreeItem[] => {
  const lifecycle = resolveVolumeStudyLifecycle({
    indicators: chartConfig.indicators,
    appearance: chartAppearance,
  });
  if (!lifecycle.attached) return [];

  return [{
    id: "volume",
    label: "Volume",
    kind: "volume",
    visible: lifecycle.studyVisible,
    color: VOLUME_COLOR,
    removable: true,
  }];
};

const buildMovingAverageItems = ({
  chartConfig,
  indicatorPeriods,
  hiddenObjectIds,
  movingAverageTrendSignals,
  priceVsSmaSourcePeriods,
  priceVsEmaSourcePeriods,
}: Pick<
  BuildObjectTreeItemsInput,
  "chartConfig" | "indicatorPeriods" | "hiddenObjectIds" | "movingAverageTrendSignals" | "priceVsSmaSourcePeriods" | "priceVsEmaSourcePeriods"
>): ObjectTreeItem[] => {
  const activeSmaWithSignalSources = mergeMovingAveragePeriods(
    chartConfig.indicators.activeSma,
    movingAverageTrendSignals.sma,
    priceVsSmaSourcePeriods,
  );
  const activeEmaWithSignalSources = mergeMovingAveragePeriods(
    chartConfig.indicators.activeEma,
    movingAverageTrendSignals.ema,
    priceVsEmaSourcePeriods,
  );
  const signalSourceSmaPeriods = new Set(mergeMovingAveragePeriods(movingAverageTrendSignals.sma, priceVsSmaSourcePeriods));
  const signalSourceEmaPeriods = new Set(mergeMovingAveragePeriods(movingAverageTrendSignals.ema, priceVsEmaSourcePeriods));

  return [
    ...buildSmaSeriesDefinitions(indicatorPeriods, activeSmaWithSignalSources).map((series) => ({
      id: series.id,
      label: series.label,
      kind: "overlay" as const,
      visible: (chartConfig.indicators.sma || signalSourceSmaPeriods.has(series.period)) && !hiddenObjectIds[series.id],
      color: series.color,
      removable: true,
    })),
    ...buildEmaSeriesDefinitions(activeEmaWithSignalSources).map((series) => ({
      id: series.id,
      label: series.label,
      kind: "overlay" as const,
      visible: (chartConfig.indicators.ema || signalSourceEmaPeriods.has(series.period)) && !hiddenObjectIds[series.id],
      color: series.color,
      removable: true,
    })),
    ...buildAdvancedMovingAverageSeriesDefinitions(chartConfig.indicators).map((series) => ({
      id: series.seriesId,
      label: series.label,
      kind: "overlay" as const,
      visible: !hiddenObjectIds[series.seriesId],
      color: series.color,
      removable: true,
    })),
  ];
};

const buildAdvancedIndicatorItems = ({
  advancedIndicators,
  hiddenObjectIds,
}: Pick<BuildObjectTreeItemsInput, "advancedIndicators" | "hiddenObjectIds">): ObjectTreeItem[] => {
  const topLevelItems = (Object.entries(ADVANCED_INDICATOR_LABELS) as [keyof AdvancedIndicatorsState, typeof ADVANCED_INDICATOR_LABELS[keyof AdvancedIndicatorsState]][])
    .filter(([key]) => advancedIndicators[key])
    .map(([key, meta]) => ({
      id: key,
      label: meta.label,
      kind: meta.kind,
      visible: !hiddenObjectIds[key],
      color: meta.color,
      removable: true,
    }));

  return [
    ...topLevelItems,
    ...buildAdvancedChildObjectTreeItems({ advancedIndicators, hiddenObjectIds }),
  ];
};

const buildPineOverlayItem = ({
  pineChartOverlay,
  hiddenObjectIds,
}: Pick<BuildObjectTreeItemsInput, "pineChartOverlay" | "hiddenObjectIds">): ObjectTreeItem[] => {
  if (!pineChartOverlay) return [];
  const id = "pine-overlay";
  const seriesCount = pineChartOverlay.series.length;
  const signalsCount = pineChartOverlay.signals.length;
  const label = `${pineChartOverlay.title} (${seriesCount} series${signalsCount > 0 ? `, ${signalsCount} signals` : ""})`;
  return [{
    id,
    label,
    kind: "pine-overlay" as const,
    visible: !hiddenObjectIds[id],
    color: "#8b5cf6",
    removable: true,
  }];
};

export const buildObjectTreeItems = (input: BuildObjectTreeItemsInput): ObjectTreeItem[] => [
  ...buildBaseSeriesItems(input),
  ...buildActiveToolItem(input.activeTool, input.hiddenObjectIds),
  ...buildVolumeItem(input),
  ...buildMovingAverageItems(input),
  ...buildAdvancedIndicatorItems(input),
  ...buildPineOverlayItem(input),
];
