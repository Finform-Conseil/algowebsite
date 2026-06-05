import type { AdvancedIndicatorsState } from "../../../config/indicators/advancedIndicatorsTypes";
import type { ObjectTreeItem } from "./objectTreeItemTypes";

type AdvancedIndicatorKey = keyof AdvancedIndicatorsState;

type AdvancedChildItemSpec = {
  id: string;
  label: string;
  kind: ObjectTreeItem["kind"];
  color: string;
};

type AdvancedChildItemGroup = {
  indicator: AdvancedIndicatorKey;
  items: readonly AdvancedChildItemSpec[];
};

const ADVANCED_CHILD_ITEM_GROUPS: readonly AdvancedChildItemGroup[] = [
  { indicator: "tsi", items: [{ id: "tsi-line", label: "TSI", kind: "indicator", color: "#8B5CF6" }, { id: "tsi-signal", label: "TSI Signal", kind: "indicator", color: "#F59E0B" }] },
  { indicator: "rvi", items: [{ id: "rvi-line", label: "RVI", kind: "indicator", color: "#22d3ee" }, { id: "rvi-signal", label: "RVI Signal", kind: "indicator", color: "#facc15" }] },
  { indicator: "fisherTransform", items: [{ id: "fisher-line", label: "Fisher", kind: "indicator", color: "#e879f9" }, { id: "fisher-signal", label: "Fisher Signal", kind: "indicator", color: "#f59e0b" }] },
  { indicator: "elderBullBear", items: [{ id: "elder-bull", label: "Elder Bull", kind: "indicator", color: "#22c55e" }, { id: "elder-bear", label: "Elder Bear", kind: "indicator", color: "#ef4444" }] },
  { indicator: "ppo", items: [{ id: "ppo-line", label: "PPO Line", kind: "indicator", color: "#38bdf8" }, { id: "ppo-signal", label: "PPO Signal", kind: "indicator", color: "#f59e0b" }, { id: "ppo-histogram", label: "PPO Histogram", kind: "indicator", color: "#22c55e" }] },
  { indicator: "adx", items: [{ id: "adx-line", label: "ADX", kind: "indicator", color: "#c084fc" }, { id: "adx-plus-di", label: "+DI", kind: "indicator", color: "#22c55e" }, { id: "adx-minus-di", label: "-DI", kind: "indicator", color: "#ef4444" }] },
  { indicator: "aroon", items: [{ id: "aroon-up", label: "Aroon Up", kind: "indicator", color: "#22c55e" }, { id: "aroon-down", label: "Aroon Down", kind: "indicator", color: "#ef4444" }] },
  { indicator: "supertrend", items: [{ id: "supertrend-line", label: "Supertrend", kind: "overlay", color: "#22c55e" }, { id: "supertrend-signal", label: "Supertrend Signal", kind: "indicator", color: "#facc15" }] },
  { indicator: "vortex", items: [{ id: "vortex-plus", label: "Vortex +", kind: "indicator", color: "#22c55e" }, { id: "vortex-minus", label: "Vortex -", kind: "indicator", color: "#ef4444" }] },
  { indicator: "kst", items: [{ id: "kst-line", label: "KST", kind: "indicator", color: "#38bdf8" }, { id: "kst-signal", label: "KST Signal", kind: "indicator", color: "#f59e0b" }] },
  { indicator: "linearRegression", items: [{ id: "linear-reg-value", label: "LinReg Value", kind: "overlay", color: "#818cf8" }, { id: "linear-reg-slope", label: "LinReg Slope", kind: "indicator", color: "#a78bfa" }] },
  { indicator: "donchian", items: [{ id: "donchian-upper", label: "Donchian Upper", kind: "overlay", color: "#06b6d4" }, { id: "donchian-middle", label: "Donchian Middle", kind: "overlay", color: "#67e8f9" }, { id: "donchian-lower", label: "Donchian Lower", kind: "overlay", color: "#06b6d4" }] },
  { indicator: "keltner", items: [{ id: "keltner-upper", label: "Keltner Upper", kind: "overlay", color: "#f59e0b" }, { id: "keltner-middle", label: "Keltner Middle", kind: "overlay", color: "#fbbf24" }, { id: "keltner-lower", label: "Keltner Lower", kind: "overlay", color: "#f59e0b" }] },
  { indicator: "klinger", items: [{ id: "klinger-osc", label: "Klinger Osc", kind: "indicator", color: "#0ea5e9" }, { id: "klinger-signal", label: "Klinger Signal", kind: "indicator", color: "#f59e0b" }] },
  { indicator: "elderForceIndex", items: [{ id: "elder-force-raw", label: "Elder Force Raw", kind: "indicator", color: "#fb7185" }, { id: "force-index-13", label: "Force Index 13", kind: "indicator", color: "#f43f5e" }] },
  { indicator: "volumeProfile", items: [{ id: "volume-profile-rows", label: "Volume Profile Rows", kind: "overlay", color: "#0ea5e9" }, { id: "vp-poc", label: "POC", kind: "overlay", color: "#f59e0b" }, { id: "vp-vah", label: "VAH", kind: "overlay", color: "#22d3ee" }, { id: "vp-val", label: "VAL", kind: "overlay", color: "#22d3ee" }] },
  { indicator: "pivotPointsStandard", items: [{ id: "pivot-standard-p", label: "Pivot", kind: "overlay", color: "#cbd5e1" }, { id: "pivot-standard-r1", label: "R1", kind: "overlay", color: "#fb7185" }, { id: "pivot-standard-r2", label: "R2", kind: "overlay", color: "#f43f5e" }, { id: "pivot-standard-r3", label: "R3", kind: "overlay", color: "#e11d48" }, { id: "pivot-standard-s1", label: "S1", kind: "overlay", color: "#34d399" }, { id: "pivot-standard-s2", label: "S2", kind: "overlay", color: "#10b981" }, { id: "pivot-standard-s3", label: "S3", kind: "overlay", color: "#059669" }] },
  { indicator: "pivotPointsFibonacci", items: [{ id: "pivot-fib-p", label: "Pivot", kind: "overlay", color: "#c4b5fd" }, { id: "pivot-fib-r1", label: "Fib R1", kind: "overlay", color: "#fbbf24" }, { id: "pivot-fib-r2", label: "Fib R2", kind: "overlay", color: "#f59e0b" }, { id: "pivot-fib-r3", label: "Fib R3", kind: "overlay", color: "#d97706" }, { id: "pivot-fib-s1", label: "Fib S1", kind: "overlay", color: "#67e8f9" }, { id: "pivot-fib-s2", label: "Fib S2", kind: "overlay", color: "#22d3ee" }, { id: "pivot-fib-s3", label: "Fib S3", kind: "overlay", color: "#0891b2" }] },
  { indicator: "movingAverageCrosses", items: [{ id: "golden-cross-marker", label: "Golden Cross", kind: "overlay", color: "#22c55e" }, { id: "death-cross-marker", label: "Death Cross", kind: "overlay", color: "#ef4444" }] },
  { indicator: "vwap", items: [{ id: "vwap-line", label: "VWAP", kind: "overlay", color: "#14b8a6" }, { id: "price-above-vwap-state", label: "Prix > VWAP", kind: "overlay", color: "#22c55e" }] },
  { indicator: "fiftyTwoWeekHigh", items: [{ id: "52w-high-level", label: "52W High", kind: "overlay", color: "#f97316" }, { id: "new-52w-high-marker", label: "New 52W High", kind: "overlay", color: "#fb923c" }] },
  { indicator: "fiftyTwoWeekLow", items: [{ id: "52w-low-level", label: "52W Low", kind: "overlay", color: "#38bdf8" }, { id: "new-52w-low-marker", label: "New 52W Low", kind: "overlay", color: "#0ea5e9" }] },
  { indicator: "ath", items: [{ id: "ath-level", label: "ATH", kind: "overlay", color: "#facc15" }, { id: "new-ath-marker", label: "New ATH", kind: "overlay", color: "#fde047" }] },
  { indicator: "atl", items: [{ id: "atl-level", label: "ATL", kind: "overlay", color: "#a78bfa" }, { id: "new-atl-marker", label: "New ATL", kind: "overlay", color: "#c084fc" }] },
  { indicator: "breakoutResistance", items: [{ id: "breakout-resistance-marker", label: "Breakout résistance", kind: "overlay", color: "#22c55e" }] },
  { indicator: "breakdownSupport", items: [{ id: "breakdown-support-marker", label: "Breakdown support", kind: "overlay", color: "#f43f5e" }] },
  { indicator: "gapUp", items: [{ id: "gap-up-marker", label: "Gap Up", kind: "overlay", color: "#22d3ee" }] },
  { indicator: "gapDown", items: [{ id: "gap-down-marker", label: "Gap Down", kind: "overlay", color: "#fb7185" }] },
  { indicator: "trueGapUp", items: [{ id: "true-gap-up-marker", label: "True Gap Up", kind: "overlay", color: "#67e8f9" }] },
  { indicator: "trueGapDown", items: [{ id: "true-gap-down-marker", label: "True Gap Down", kind: "overlay", color: "#fda4af" }] },
  { indicator: "gapPct", items: [{ id: "gap-pct-label", label: "Gap % labels", kind: "overlay", color: "#e0f2fe" }] },
  { indicator: "consecutiveUpDays", items: [{ id: "up-streak-badge", label: "Jours hausse", kind: "overlay", color: "#16a34a" }] },
  { indicator: "consecutiveDownDays", items: [{ id: "down-streak-badge", label: "Jours baisse", kind: "overlay", color: "#dc2626" }] },
  { indicator: "insideBar", items: [{ id: "inside-bar-outline", label: "Inside Bar", kind: "overlay", color: "#a78bfa" }] },
  { indicator: "outsideBar", items: [{ id: "outside-bar-outline", label: "Outside Bar", kind: "overlay", color: "#f59e0b" }] },
  { indicator: "doji", items: [{ id: "doji-marker", label: "Doji", kind: "overlay", color: "#94a3b8" }] },
  { indicator: "longLeggedDoji", items: [{ id: "long-legged-doji-marker", label: "Long-legged Doji", kind: "overlay", color: "#fbbf24" }] },
  { indicator: "rickshawMan", items: [{ id: "rickshaw-man-marker", label: "Rickshaw Man", kind: "overlay", color: "#c084fc" }] },
  { indicator: "dragonflyDoji", items: [{ id: "dragonfly-doji-marker", label: "Dragonfly Doji", kind: "overlay", color: "#22c55e" }] },
  { indicator: "gravestoneDoji", items: [{ id: "gravestone-doji-marker", label: "Gravestone Doji", kind: "overlay", color: "#f43f5e" }] },
  { indicator: "tristar", items: [{ id: "tristar-zone", label: "Tristar", kind: "overlay", color: "#38bdf8" }] },
  { indicator: "hammer", items: [{ id: "hammer-marker", label: "Hammer", kind: "overlay", color: "#22c55e" }] },
  { indicator: "hangingMan", items: [{ id: "hanging-man-marker", label: "Hanging Man", kind: "overlay", color: "#f97316" }] },
  { indicator: "takuri", items: [{ id: "takuri-marker", label: "Takuri", kind: "overlay", color: "#14b8a6" }] },
  { indicator: "invertedHammer", items: [{ id: "inverted-hammer-marker", label: "Inverted Hammer", kind: "overlay", color: "#38bdf8" }] },
  { indicator: "shootingStar", items: [{ id: "shooting-star-marker", label: "Shooting Star", kind: "overlay", color: "#f43f5e" }] },
  { indicator: "marubozuBull", items: [{ id: "marubozu-bull-outline", label: "Marubozu Bull", kind: "overlay", color: "#16a34a" }] },
  { indicator: "marubozuBear", items: [{ id: "marubozu-bear-outline", label: "Marubozu Bear", kind: "overlay", color: "#dc2626" }] },
  { indicator: "spinningTop", items: [{ id: "spinning-top-marker", label: "Spinning Top", kind: "overlay", color: "#a3a3a3" }] },
  { indicator: "parabolicSar", items: [{ id: "parabolic-sar", label: "SAR", kind: "overlay", color: "#facc15" }, { id: "parabolic-sar-signal", label: "SAR Signal", kind: "indicator", color: "#22c55e" }] },
];

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
