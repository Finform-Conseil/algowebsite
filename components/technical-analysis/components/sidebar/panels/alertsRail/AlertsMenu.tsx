import clsx from "clsx";
import { Settings, Volume2, VolumeX } from "lucide-react";

import { TYPE_FILTER_LABELS, VIEW_FILTER_LABELS } from "./alertsRailConstants";
import { getAlertCounts } from "./alertsRailSelectors";
import type { AlertTypeId, AlertViewFilter } from "./alertsRailTypes";

interface AlertsMenuProps {
  counts: ReturnType<typeof getAlertCounts>;
  currentSymbolOnly: boolean;
  onDeleteInactive: () => void;
  onRestartInactive: () => void;
  onSetCurrentOnly: (value: boolean) => void;
  onSetSoundEnabled: (value: boolean) => void;
  onSetTypeFilter: (value: AlertTypeId | "all") => void;
  onSetViewFilter: (value: AlertViewFilter) => void;
  sortLabel: string;
  soundEnabled: boolean;
  typeFilter: AlertTypeId | "all";
  viewFilter: AlertViewFilter;
}

export const AlertsMenu = ({
  counts,
  currentSymbolOnly,
  onDeleteInactive,
  onRestartInactive,
  onSetCurrentOnly,
  onSetSoundEnabled,
  onSetTypeFilter,
  onSetViewFilter,
  sortLabel,
  soundEnabled,
  typeFilter,
  viewFilter,
}: AlertsMenuProps) => (
  <div className="gp-alerts-menu" role="menu" aria-label="Options alertes BRVM">
    <div className="gp-alerts-menu-row">
      <strong><Settings aria-hidden="true" /> Afficher</strong>
      {Object.entries(VIEW_FILTER_LABELS).map(([id, label]) => (
        <button key={id} type="button" className={clsx(viewFilter === id && "active")} onClick={() => onSetViewFilter(id as AlertViewFilter)}>
          {label} {counts[id as keyof typeof counts]}
        </button>
      ))}
    </div>
    <div className="gp-alerts-menu-row">
      <strong>Types</strong>
      {Object.entries(TYPE_FILTER_LABELS).map(([id, label]) => (
        <button key={id} type="button" className={clsx(typeFilter === id && "active")} onClick={() => onSetTypeFilter(id as AlertTypeId | "all")}>
          {label}
        </button>
      ))}
    </div>
    <div className="gp-alerts-menu-row">
      <strong>Portee</strong>
      <button type="button" className={clsx(currentSymbolOnly && "active")} onClick={() => onSetCurrentOnly(true)}>Titre courant</button>
      <button type="button" className={clsx(!currentSymbolOnly && "active")} onClick={() => onSetCurrentOnly(false)}>Tous titres</button>
      <span>Tri {sortLabel}</span>
    </div>
    <div className="gp-alerts-menu-row">
      <strong>Son</strong>
      <button type="button" className={clsx(soundEnabled && "active")} onClick={() => onSetSoundEnabled(true)}><Volume2 aria-hidden="true" /> Actif</button>
      <button type="button" className={clsx(!soundEnabled && "active")} onClick={() => onSetSoundEnabled(false)}><VolumeX aria-hidden="true" /> Muet</button>
    </div>
    <div className="gp-alerts-menu-row">
      <strong>Maintenance</strong>
      <button type="button" onClick={onRestartInactive}>Relancer inactives</button>
      <button type="button" onClick={onDeleteInactive}>Supprimer inactives</button>
    </div>
  </div>
);

AlertsMenu.displayName = "AlertsMenu";
