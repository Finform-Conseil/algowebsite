export type AlertNotificationChannels = {
  email: boolean;
  push: boolean;
};

export const parsePositiveAlertValue = (value: string) => {
  if (value.trim() === "") return null;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

export const createAlertId = () => (
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `alert-${crypto.randomUUID()}`
    : `alert-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
);
