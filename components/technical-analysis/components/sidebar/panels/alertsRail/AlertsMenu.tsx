import clsx from "clsx";
import { RefreshCw, Trash2, Volume2, VolumeX } from "lucide-react";

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
    <header className="gp-alerts-menu__header">
      <div>
        <span className="gp-alerts-menu__eyebrow">Filtres et options</span>
        <strong>Alertes</strong>
      </div>
      <span className="gp-alerts-menu__summary">{counts.active} actives</span>
    </header>

    <section className="gp-alerts-menu__group" aria-labelledby="alerts-state-label">
      <label id="alerts-state-label" className="gp-alerts-menu__field">
        <span className="gp-alerts-menu__label">État</span>
        <select
          className="gp-alerts-menu__select"
          value={viewFilter}
          onChange={(event) => onSetViewFilter(event.target.value as AlertViewFilter)}
        >
          {Object.entries(VIEW_FILTER_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label} · {counts[id as keyof typeof counts]}
            </option>
          ))}
        </select>
      </label>
    </section>

    <section className="gp-alerts-menu__group" aria-labelledby="alerts-type-label">
      <label id="alerts-type-label" className="gp-alerts-menu__field">
        <span className="gp-alerts-menu__label">Type</span>
        <select
          className="gp-alerts-menu__select"
          value={typeFilter}
          onChange={(event) => onSetTypeFilter(event.target.value as AlertTypeId | "all")}
        >
          {Object.entries(TYPE_FILTER_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </label>
    </section>

    <section className="gp-alerts-menu__group" aria-labelledby="alerts-scope-label">
      <span id="alerts-scope-label" className="gp-alerts-menu__label">Portée</span>
      <div className="gp-alerts-menu__scope">
        <div className="gp-alerts-menu__segmented">
          <button type="button" className={clsx(currentSymbolOnly && "active")} aria-pressed={currentSymbolOnly} onClick={() => onSetCurrentOnly(true)}>
            Titre courant
          </button>
          <button type="button" className={clsx(!currentSymbolOnly && "active")} aria-pressed={!currentSymbolOnly} onClick={() => onSetCurrentOnly(false)}>
            Tous les titres
          </button>
        </div>
        <div className="gp-alerts-menu__sort">
          <span>Tri</span>
          <strong>{sortLabel}</strong>
        </div>
      </div>
    </section>

    <section className="gp-alerts-menu__group gp-alerts-menu__group--options" aria-labelledby="alerts-options-label">
      <span id="alerts-options-label" className="gp-alerts-menu__label">Options</span>
      <button
        type="button"
        role="switch"
        aria-checked={soundEnabled}
        className={clsx("gp-alerts-sound-toggle", soundEnabled && "active")}
        onClick={() => onSetSoundEnabled(!soundEnabled)}
      >
        <span className="gp-alerts-sound-toggle__icon">
          {soundEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
        </span>
        <span className="gp-alerts-sound-toggle__copy">
          <strong>Notifications sonores</strong>
          <small>{soundEnabled ? "Actives" : "Muettes"}</small>
        </span>
        <span className="gp-alerts-sound-toggle__track" aria-hidden="true"><i /></span>
      </button>
    </section>

    <footer className="gp-alerts-menu__maintenance">
      <span className="gp-alerts-menu__label">Maintenance</span>
      <div>
        <button type="button" onClick={onRestartInactive}>
          <RefreshCw aria-hidden="true" />
          Relancer les inactives
        </button>
        <button type="button" className="is-danger" onClick={onDeleteInactive}>
          <Trash2 aria-hidden="true" />
          Supprimer les inactives
        </button>
      </div>
    </footer>
  </div>
);

AlertsMenu.displayName = "AlertsMenu";
