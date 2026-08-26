export type ChartCommitMode = "structural" | "history-prepend-stable";

type ChartStructureOption = {
  series?: unknown;
  xAxis?: unknown;
  yAxis?: unknown;
  grid?: unknown;
  dataZoom?: unknown;
};

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value == null ? [] : [value];

const normalizeIdentityValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(normalizeIdentityValue).join(",");
  if (value == null) return "";
  return String(value);
};

const componentIdentity = (entry: unknown, index: number): string => {
  if (!entry || typeof entry !== "object") return `${index}:${normalizeIdentityValue(entry)}`;
  const item = entry as Record<string, unknown>;
  return [
    normalizeIdentityValue(item.id ?? index),
    normalizeIdentityValue(item.type),
    normalizeIdentityValue(item.xAxisIndex),
    normalizeIdentityValue(item.yAxisIndex),
    normalizeIdentityValue(item.gridIndex),
  ].join(":");
};

const componentSignature = (value: unknown): string =>
  asArray(value).map(componentIdentity).join("|");

/**
 * Structural fingerprint only: data payloads, labels and styling are deliberately
 * excluded. A history prepend may therefore keep the existing ECharts component
 * models when the chart topology is unchanged, while indicator/pane/layout changes
 * still fall back to the full structural replacement path.
 */
export const resolveChartStructureSignature = (option: unknown): string => {
  const structure = option && typeof option === "object"
    ? option as ChartStructureOption
    : {};

  return [
    `series=${componentSignature(structure.series)}`,
    `xAxis=${componentSignature(structure.xAxis)}`,
    `yAxis=${componentSignature(structure.yAxis)}`,
    `grid=${componentSignature(structure.grid)}`,
    `dataZoom=${componentSignature(structure.dataZoom)}`,
  ].join(";");
};

export const resolveChartCommitMode = ({
  isHistoryPrepend,
  previousSignature,
  currentSignature,
}: {
  isHistoryPrepend: boolean;
  previousSignature: string | null;
  currentSignature: string;
}): ChartCommitMode =>
  isHistoryPrepend && previousSignature !== null && previousSignature === currentSignature
    ? "history-prepend-stable"
    : "structural";
