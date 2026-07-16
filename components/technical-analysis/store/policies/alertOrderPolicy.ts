import type { Alert, Order } from "../../config/state/technicalAnalysisStateTypes";
import { normalizeChartSymbol } from "./chartConfigPolicy";

const isAlertCondition = (value: unknown): value is Alert["condition"] =>
  value === "GREATER_THAN" || value === "LESS_THAN";

const isOrderSide = (value: unknown): value is Order["side"] =>
  value === "buy" || value === "sell";

const isOrderType = (value: unknown): value is Order["orderType"] =>
  value === "limit" || value === "stop" || value === "market";

const isOrderStatus = (value: unknown): value is Order["status"] =>
  value === "active" || value === "filled" || value === "cancelled";

export const normalizeRecordId = (value: unknown): string => (
  typeof value === "string" ? value.trim() : ""
);

export const normalizePositiveFiniteNumber = (value: unknown): number | null => (
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null
);

const normalizeOptionalPositiveFiniteNumber = (value: unknown): number | undefined | null => {
  if (value === undefined) return undefined;
  const normalized = normalizePositiveFiniteNumber(value);
  return normalized === null ? null : normalized;
};

const normalizeAlertChannels = (channels: Alert["notificationChannels"]) => {
  if (channels === undefined) return undefined;
  if (typeof channels.email !== "boolean" || typeof channels.push !== "boolean") return null;
  if (channels.sound !== undefined && typeof channels.sound !== "boolean") return null;
  if (channels.webhook !== undefined && typeof channels.webhook !== "boolean") return null;
  return channels;
};

export const normalizeAlertPayload = (alert: Alert): Alert | null => {
  const id = normalizeRecordId(alert.id);
  const symbol = normalizeChartSymbol(alert.symbol);
  const value = normalizePositiveFiniteNumber(alert.value);
  const channels = normalizeAlertChannels(alert.notificationChannels);

  if (!id || !symbol || value === null || channels === null) return null;
  if (!isAlertCondition(alert.condition) || typeof alert.active !== "boolean") return null;

  return {
    ...alert,
    id,
    symbol,
    condition: alert.condition,
    value,
    active: alert.active,
    ...(channels !== undefined ? { notificationChannels: channels } : {}),
  };
};

export const normalizeOrderPayload = (order: Order): Order | null => {
  const id = normalizeRecordId(order.id);
  const symbol = normalizeChartSymbol(order.symbol);
  const triggerPrice = normalizePositiveFiniteNumber(order.triggerPrice);
  const qty = normalizePositiveFiniteNumber(order.qty);
  const takeProfitPrice = normalizeOptionalPositiveFiniteNumber(order.takeProfitPrice);
  const stopLossPrice = normalizeOptionalPositiveFiniteNumber(order.stopLossPrice);
  const createdAt = typeof order.createdAt === "string" ? order.createdAt.trim() : "";

  if (!id || !symbol || triggerPrice === null || qty === null || !createdAt) return null;
  if (!isOrderSide(order.side) || !isOrderType(order.orderType) || !isOrderStatus(order.status)) return null;
  if (takeProfitPrice === null || stopLossPrice === null) return null;

  return {
    ...order,
    id,
    symbol,
    side: order.side,
    orderType: order.orderType,
    triggerPrice,
    qty,
    status: order.status,
    createdAt,
    ...(takeProfitPrice !== undefined ? { takeProfitPrice } : {}),
    ...(stopLossPrice !== undefined ? { stopLossPrice } : {}),
  };
};
