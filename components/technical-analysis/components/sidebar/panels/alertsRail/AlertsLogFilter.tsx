import clsx from "clsx";

import type { AlertLogFilter } from "./alertsRailTypes";

interface AlertsLogFilterProps {
  counts: Record<AlertLogFilter, number>;
  filter: AlertLogFilter;
  onChange: (value: AlertLogFilter) => void;
}

const FILTER_ORDER: AlertLogFilter[] = ["triggered", "all"];
const FILTER_LABELS: Record<AlertLogFilter, string> = {
  all: "Tout le journal",
  triggered: "Declenchements",
};

export const AlertsLogFilter = ({ counts, filter, onChange }: AlertsLogFilterProps) => (
  <div className="gp-alerts-log-filter" role="tablist" aria-label="Filtrer le journal des alertes">
    {FILTER_ORDER.map((id) => (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={filter === id}
        className={clsx(filter === id && "active")}
        onClick={() => onChange(id)}
      >
        {FILTER_LABELS[id]} <span>{counts[id].toLocaleString("fr-FR")}</span>
      </button>
    ))}
  </div>
);

AlertsLogFilter.displayName = "AlertsLogFilter";
