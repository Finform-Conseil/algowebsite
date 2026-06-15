import type { AdvancedIndicatorsState } from "../../../config/indicators/advancedIndicatorsTypes";
import { getAdvancedIndicatorChildGroupsFromRegistry } from "../../../config/indicators/indicatorRegistry";
import type { ObjectTreeItem } from "./objectTreeItemTypes";

type AdvancedIndicatorKey = keyof AdvancedIndicatorsState;

export type AdvancedChildItemSpec = {
  id: string;
  label: string;
  kind: ObjectTreeItem["kind"];
  color: string;
};

export type AdvancedChildItemGroup = {
  indicator: AdvancedIndicatorKey;
  items: readonly AdvancedChildItemSpec[];
};

export const ADVANCED_CHILD_ITEM_GROUPS: readonly AdvancedChildItemGroup[] =
  getAdvancedIndicatorChildGroupsFromRegistry() as readonly AdvancedChildItemGroup[];

export const buildAdvancedChildObjectTreeItems = ({
  advancedIndicators,
  hiddenObjectIds,
}: {
  advancedIndicators: AdvancedIndicatorsState;
  hiddenObjectIds: Record<string, boolean>;
}): ObjectTreeItem[] =>
  ADVANCED_CHILD_ITEM_GROUPS.flatMap((group) => {
    if (!advancedIndicators[group.indicator]) return [];

    return group.items.map((item) => ({
      ...item,
      visible: !hiddenObjectIds[group.indicator] && !hiddenObjectIds[item.id],
      removable: true,
    }));
  });
