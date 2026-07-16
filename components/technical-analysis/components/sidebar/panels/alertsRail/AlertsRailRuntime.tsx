"use client";

import { AlertTriggerToast } from "./AlertTriggerToast";
import type { AlertsRailContext, AlertsRailContextByTicker } from "./alertsRailTypes";
import { useAlertsRailRuntime } from "./useAlertsRailRuntime";

interface AlertsRailRuntimeProps {
  context: AlertsRailContext;
  contextsByTicker?: AlertsRailContextByTicker;
  onEditAlert: (alertId: string) => void;
}

export const AlertsRailRuntime = ({ context, contextsByTicker, onEditAlert }: AlertsRailRuntimeProps) => {
  const { clearTriggerNotice, triggerNotice } = useAlertsRailRuntime(context, contextsByTicker);

  if (!triggerNotice) return null;

  return (
    <AlertTriggerToast
      alert={triggerNotice}
      onClose={clearTriggerNotice}
      onEdit={(alertId) => {
        clearTriggerNotice();
        onEditAlert(alertId);
      }}
    />
  );
};
