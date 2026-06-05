import type { AdvancedIndicatorsState } from "../../../config/indicators/advancedIndicatorsTypes";
import { getAdvancedIndicatorIdForObjectId } from "../../../config/object-tree/indicatorObjectVisibility";
import type { ChartState } from "../../../config/state/chartStateTypes";
import type { ObjectTreeItem } from "./objectTreeItemTypes";

type ChartIndicators = ChartState["indicators"];

export type ObjectItemVisibilityAction =
  | { type: "toggle-volume" }
  | { type: "toggle-hidden-object"; id: string };

export type ObjectItemRemoveAction =
  | { type: "blocked"; message: string }
  | { type: "remove-comparison"; symbol: string }
  | { type: "patch-indicators"; patch: Partial<ChartIndicators> }
  | { type: "set-advanced-indicator"; patch: Partial<AdvancedIndicatorsState> }
  | { type: "unsupported"; message: string };

type PeriodListKey =
  | "activeAlma"
  | "activeDema"
  | "activeHma"
  | "activeKama"
  | "activeSmma"
  | "activeTema"
  | "activeVwma"
  | "activeWma"
  | "activeZlema";

const resolvePeriodPatch = (
  id: string,
  prefix: string,
  key: PeriodListKey,
  indicators: ChartIndicators,
): Partial<ChartIndicators> | null => {
  if (!id.startsWith(prefix)) return null;
  const period = Number(id.slice(prefix.length));
  return { [key]: indicators[key].filter((p) => p !== period) } as Partial<ChartIndicators>;
};

export const resolveObjectItemVisibilityAction = (item: ObjectTreeItem): ObjectItemVisibilityAction => {
  if (item.id === "volume") return { type: "toggle-volume" };
  return { type: "toggle-hidden-object", id: item.id };
};

export const resolveObjectItemRemoveAction = ({
  item,
  indicators,
  advancedIndicators,
}: {
  item: ObjectTreeItem;
  indicators: ChartIndicators;
  advancedIndicators: AdvancedIndicatorsState;
}): ObjectItemRemoveAction => {
  if (item.id === "volume") {
    return {
      type: "blocked",
      message: "Le volume se masque avec l'icone oeil; il ne se supprime pas depuis l'arbre.",
    };
  }

  if (item.id.startsWith("compare-")) {
    return { type: "remove-comparison", symbol: item.id.replace("compare-", "") };
  }

  if (item.id.startsWith("sma-")) {
    const period = Number(item.id.slice(4));
    const next = indicators.activeSma.filter((p) => p !== period);
    return { type: "patch-indicators", patch: { activeSma: next, sma: next.length > 0 ? indicators.sma : false } };
  }

  if (item.id.startsWith("ema-")) {
    const period = Number(item.id.slice(4));
    const next = indicators.activeEma.filter((p) => p !== period);
    return { type: "patch-indicators", patch: { activeEma: next, ema: next.length > 0 ? indicators.ema : false } };
  }

  const periodPatch =
    resolvePeriodPatch(item.id, "wma-", "activeWma", indicators) ??
    resolvePeriodPatch(item.id, "dema-", "activeDema", indicators) ??
    resolvePeriodPatch(item.id, "tema-", "activeTema", indicators) ??
    resolvePeriodPatch(item.id, "hma-", "activeHma", indicators) ??
    resolvePeriodPatch(item.id, "zlema-", "activeZlema", indicators) ??
    resolvePeriodPatch(item.id, "alma-", "activeAlma", indicators) ??
    resolvePeriodPatch(item.id, "smma-", "activeSmma", indicators) ??
    resolvePeriodPatch(item.id, "kama-", "activeKama", indicators) ??
    resolvePeriodPatch(item.id, "vwma-", "activeVwma", indicators);

  if (periodPatch) return { type: "patch-indicators", patch: periodPatch };

  const advancedIndicatorId =
    getAdvancedIndicatorIdForObjectId(item.id) ??
    ((item.id in advancedIndicators ? item.id : null) as keyof AdvancedIndicatorsState | null);

  if (advancedIndicatorId) {
    return {
      type: "set-advanced-indicator",
      patch: { [advancedIndicatorId]: false } as Partial<AdvancedIndicatorsState>,
    };
  }

  return { type: "unsupported", message: "Cet objet ne peut pas etre supprime depuis cette ligne." };
};
