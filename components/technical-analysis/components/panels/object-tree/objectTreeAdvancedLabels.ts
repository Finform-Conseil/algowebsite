import type { AdvancedIndicatorsState } from "../../../config/indicators/advancedIndicatorsTypes";
import { ADVANCED_INDICATOR_REGISTRY } from "../../../config/indicators/indicatorRegistry";
import type { ObjectTreeItem } from "./objectTreeItemTypes";

export type AdvancedIndicatorLabelMeta = {
  label: string;
  kind: ObjectTreeItem["kind"];
  color: string;
};

export const ADVANCED_INDICATOR_LABELS: Record<keyof AdvancedIndicatorsState, AdvancedIndicatorLabelMeta> =
  Object.fromEntries(
    Object.entries(ADVANCED_INDICATOR_REGISTRY).map(([id, entry]) => [
      id,
      {
        label: entry.label,
        kind: entry.kind,
        color: entry.color,
      },
    ]),
  ) as Record<keyof AdvancedIndicatorsState, AdvancedIndicatorLabelMeta>;
