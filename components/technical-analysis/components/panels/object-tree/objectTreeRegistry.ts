import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ObjectTreeItem } from "./objectTreeItemTypes";

export type RuntimeChartSeriesDescriptor = {
  id: string;
  label: string;
  visible: boolean;
  color: string;
};

export type ChartObjectCapabilities = {
  visibility: boolean;
  remove: boolean;
  lock: boolean;
  clone: boolean;
  reorder: boolean;
  group: boolean;
};

export type ChartObjectRegistryEntry =
  | {
      id: string;
      source: "drawing";
      drawing: Drawing;
      capabilities: ChartObjectCapabilities;
    }
  | {
      id: string;
      source: "object";
      item: ObjectTreeItem;
      capabilities: ChartObjectCapabilities;
    };

const normalizeIdentity = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const isInternalRendererSeries = (series: RuntimeChartSeriesDescriptor): boolean => {
  const id = normalizeIdentity(series.id);
  const label = normalizeIdentity(series.label);
  return (
    id === "volume-panel-background"
    || label === "volume-panel-background"
    || id.startsWith("viewport-boundary-")
    || label.startsWith("viewport-boundary-")
  );
};

const objectCapabilities = (item: ObjectTreeItem): ChartObjectCapabilities => ({
  visibility: item.capabilities?.visibility ?? true,
  remove: item.capabilities?.remove ?? item.removable,
  lock: false,
  clone: false,
  reorder: false,
  group: false,
});

const drawingCapabilities: ChartObjectCapabilities = {
  visibility: true,
  remove: true,
  lock: true,
  clone: true,
  reorder: true,
  group: true,
};

export const buildChartObjectRegistry = ({
  drawings,
  objectItems,
  runtimeSeries,
}: {
  drawings: Drawing[];
  objectItems: ObjectTreeItem[];
  runtimeSeries: RuntimeChartSeriesDescriptor[];
}): ChartObjectRegistryEntry[] => {
  const representedIds = new Set(objectItems.map((item) => normalizeIdentity(item.id)));
  const representedLabels = new Set(objectItems.map((item) => normalizeIdentity(item.label)));

  const runtimeOnlyItems: ObjectTreeItem[] = runtimeSeries
    .filter((series) => !isInternalRendererSeries(series))
    .filter((series) => {
      const id = normalizeIdentity(series.id);
      const label = normalizeIdentity(series.label);
      return !representedIds.has(id) && !representedLabels.has(label);
    })
    .map((series, index) => ({
      id: `runtime-series:${series.id || index}`,
      label: series.label,
      kind: "overlay",
      visible: series.visible,
      color: series.color,
      removable: false,
      runtimeOnly: true,
      capabilities: {
        visibility: false,
        remove: false,
      },
    }));

  const objectEntries: ChartObjectRegistryEntry[] = [...objectItems, ...runtimeOnlyItems].map((item) => ({
    id: `object:${item.id}`,
    source: "object",
    item: {
      ...item,
      capabilities: item.capabilities ?? {
        visibility: true,
        remove: item.removable,
      },
    },
    capabilities: objectCapabilities(item),
  }));

  const drawingEntries: ChartObjectRegistryEntry[] = drawings.map((drawing) => ({
    id: `drawing:${drawing.id}`,
    source: "drawing",
    drawing,
    capabilities: drawingCapabilities,
  }));

  return [...objectEntries, ...drawingEntries];
};
