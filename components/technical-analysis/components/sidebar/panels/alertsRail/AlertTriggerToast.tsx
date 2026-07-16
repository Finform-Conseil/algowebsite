import { BellRing, X } from "lucide-react";
import type { BrvmAlert } from "./alertsRailTypes";

interface AlertTriggerToastProps {
  alert: BrvmAlert;
  onClose: () => void;
  onEdit: (alertId: string) => void;
}

export const AlertTriggerToast = ({ alert, onClose, onEdit }: AlertTriggerToastProps) => (
  <aside className="gp-alert-trigger-toast" role="status" aria-live="polite" aria-label={`Alert on ${alert.ticker}`}>
    <div className="gp-alert-trigger-toast__stripe" aria-hidden="true"><BellRing /></div>
    <div className="gp-alert-trigger-toast__body">
      <button type="button" className="gp-alert-trigger-toast__close" aria-label="Close alert toast" onClick={onClose}><X /></button>
      <strong>Alert on <span>{alert.ticker}</span></strong>
      <p>{alert.message}</p>
      <button type="button" className="gp-alert-trigger-toast__edit" onClick={() => onEdit(alert.id)}>Edit alert</button>
    </div>
    {alert.lastTriggeredAt && <time>{formatToastTime(alert.lastTriggeredAt)}</time>}
  </aside>
);

const formatToastTime = (value: string) => (
  new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
);
