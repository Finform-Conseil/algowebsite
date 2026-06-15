import clsx from "clsx";
import { Clock, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { ALERT_TYPES, CONDITIONS, EXPIRATIONS } from "./alertsRailConstants";
import type { AlertStatus, BrvmAlert } from "./alertsRailTypes";
import { getOptionLabel } from "./alertsRailValidation";

interface AlertCardProps {
  alert: BrvmAlert;
  onDelete: (alertId: string) => void;
  onEdit: (alertId: string) => void;
  onToggle: (alertId: string) => void;
}

export const AlertCard = ({ alert, onDelete, onEdit, onToggle }: AlertCardProps) => (
  <article className={clsx("gp-alerts-card", "is-" + alert.status)} role="listitem">
    <div className="gp-alerts-card__head">
      <span>{getOptionLabel(ALERT_TYPES, alert.type)}</span>
      <strong>{alert.ticker}</strong>
      <StatusBadge status={alert.status} />
    </div>
    <p>{alert.message}</p>
    <div className="gp-alerts-card__meta">
      <span>{getOptionLabel(CONDITIONS, alert.condition)}</span>
      {alert.indicator && <span>{alert.indicator.label}</span>}
      <span>{alert.threshold === null ? "Signal non numerique" : alert.threshold.toLocaleString("fr-FR")}</span>
      <span>{getOptionLabel(EXPIRATIONS, alert.expiration)}</span>
    </div>
    {alert.lastTriggeredAt && (
      <div className="gp-alerts-card__trigger-proof">
        <Clock aria-hidden="true" />
        <span>Triggered at {formatAlertTime(alert.lastTriggeredAt)}</span>
        {alert.lastTriggeredValue !== null && <span>Value {formatAlertNumber(alert.lastTriggeredValue)}</span>}
      </div>
    )}
    <div className="gp-alerts-card__actions">
      <button type="button" onClick={() => onToggle(alert.id)}>
        {alert.status === "active" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        {alert.status === "active" ? "Pause" : "Reprendre"}
      </button>
      <button type="button" onClick={() => onEdit(alert.id)}><Pencil aria-hidden="true" /> Editer</button>
      <button type="button" onClick={() => onDelete(alert.id)}><Trash2 aria-hidden="true" /> Supprimer</button>
    </div>
  </article>
);

const StatusBadge = ({ status }: { status: AlertStatus }) => {
  const labels: Record<AlertStatus, string> = { active: "Active", paused: "Paused", triggered: "Triggered", expired: "Expired" };
  return <em className={clsx("gp-alerts-status", "is-" + status)}>{labels[status]}</em>;
};

const formatAlertTime = (value: string) => (
  new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
);

const formatAlertNumber = (value: number) => (
  value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })
);
