import type { BrvmAlert } from "./alertsRailTypes";

export const shouldSurfaceAlert = (alert: BrvmAlert): boolean => alert.channel !== "journal";

export const requestLocalAlertPermission = async (): Promise<boolean> => {
  const NotificationConstructor = getNotificationConstructor();
  if (!NotificationConstructor) return false;
  if (NotificationConstructor.permission === "granted") return true;
  if (NotificationConstructor.permission === "denied") return false;
  try {
    return await NotificationConstructor.requestPermission() === "granted";
  } catch {
    return false;
  }
};

export const showLocalAlertNotification = async (alert: BrvmAlert): Promise<boolean> => {
  if (alert.channel !== "local") return false;
  const NotificationConstructor = getNotificationConstructor();
  if (!NotificationConstructor || !await requestLocalAlertPermission()) return false;
  try {
    const notification = new NotificationConstructor(`Alert on ${alert.ticker}`, {
      body: alert.message,
      tag: `brvm-alert-${alert.id}`,
    });
    window.setTimeout(() => notification.close(), 8_000);
    return true;
  } catch {
    return false;
  }
};

const getNotificationConstructor = (): typeof Notification | null => (
  typeof window !== "undefined" && "Notification" in window ? window.Notification : null
);
