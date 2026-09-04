"use client";

import React from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { ChartType } from "../../../lib/chart-types/domain/types";
import {
  CHART_TYPE_MENU_SECTIONS,
  CHART_TYPE_REGISTRY,
  type ChartTypeRegistryEntry,
} from "../../../lib/chart-types/registry/chartTypeRegistry";
import { renderChartTypeIcon } from "./chartTypeIcons";

interface ChartTypeMenuContentProps {
  activeChartType: ChartType;
  onSelect: (chartType: ChartType) => void;
}

const GROUP_TRANSLATION_KEYS = {
  price: "groups.price",
  line: "groups.line",
  volume: "groups.volume",
  synthetic: "groups.synthetic",
} as const;

export const ChartTypeMetaBadges: React.FC<{ entry: ChartTypeRegistryEntry }> = ({ entry }) => {
  const t = useTranslations("technicalAnalysis.chartTypes");

  return (
    <>
      {entry.synthetic && (
        <span className="gp-chart-type-menu-badge" title={t("syntheticTooltip")}>
          {t("syntheticBadge")}
        </span>
      )}
      {entry.approximateWithoutTicks && (
        <span className="gp-chart-type-menu-badge" title={t("approximateTooltip")}>
          {t("approximateBadge")}
        </span>
      )}
    </>
  );
};

/**
 * Single source of truth for chart-type menu rows in both the canonical toolbar
 * and every multi-chart cell. Registry order, glyphs, metadata badges and locale
 * copy can therefore never drift between the two surfaces.
 */
export const ChartTypeMenuContent: React.FC<ChartTypeMenuContentProps> = ({ activeChartType, onSelect }) => {
  const t = useTranslations("technicalAnalysis.chartTypes");

  return (
    <>
      {CHART_TYPE_MENU_SECTIONS.map((section) => (
        <div
          key={section.id}
          className="gp-chart-type-menu-group"
          role="group"
          aria-label={t(GROUP_TRANSLATION_KEYS[section.id])}
        >
          {section.items.map((chartTypeId) => {
            const entry = CHART_TYPE_REGISTRY[chartTypeId];
            return (
              <button
                key={entry.id}
                type="button"
                role="menuitemradio"
                aria-checked={activeChartType === entry.id}
                className={clsx("gp-chart-type-menu-item", activeChartType === entry.id && "active")}
                onClick={() => onSelect(entry.id)}
              >
                <span className="gp-chart-type-menu-icon">{renderChartTypeIcon(entry.id)}</span>
                <span className="gp-chart-type-menu-label">{entry.label}</span>
                <ChartTypeMetaBadges entry={entry} />
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
};
