import type { PayloadAction } from "@reduxjs/toolkit";

import type { Alert, Order, TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import {
  normalizeAlertPayload,
  normalizeOrderPayload,
  normalizePositiveFiniteNumber,
  normalizeRecordId,
} from "../policies/alertOrderPolicy";

export const alertOrderReducers = {
  addAlert: (state: TechnicalAnalysisState, action: PayloadAction<Alert>) => {
    const alert = normalizeAlertPayload(action.payload);
    if (!alert || state.alerts.some((entry) => entry.id === alert.id)) return;
    state.alerts.push(alert);
  },
  removeAlert: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const id = normalizeRecordId(action.payload);
    if (!id) return;
    state.alerts = state.alerts.filter((alert) => alert.id !== id);
  },
  updateAlert: (state: TechnicalAnalysisState, action: PayloadAction<Alert>) => {
    const alert = normalizeAlertPayload(action.payload);
    if (!alert) return;
    const index = state.alerts.findIndex((entry) => entry.id === alert.id);
    if (index !== -1) {
      state.alerts[index] = alert;
    }
  },
  deactivateAlert: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const id = normalizeRecordId(action.payload);
    if (!id) return;
    const alert = state.alerts.find((entry) => entry.id === id);
    if (alert) {
      alert.active = false;
    }
  },
  setPrefilledAlert: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ price: number; condition: "GREATER_THAN" | "LESS_THAN" } | null>,
  ) => {
    if (action.payload === null) {
      state.ui.prefilledAlertPrice = undefined;
      state.ui.prefilledAlertCondition = undefined;
    } else {
      const price = normalizePositiveFiniteNumber(action.payload.price);
      const condition = action.payload.condition;
      if (price === null || (condition !== "GREATER_THAN" && condition !== "LESS_THAN")) return;
      state.ui.prefilledAlertPrice = price;
      state.ui.prefilledAlertCondition = action.payload.condition;
    }
  },
  addOrder: (state: TechnicalAnalysisState, action: PayloadAction<Order>) => {
    const order = normalizeOrderPayload(action.payload);
    if (!order || state.orders.some((entry) => entry.id === order.id)) return;
    state.orders.push(order);
  },
  cancelOrder: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const id = normalizeRecordId(action.payload);
    if (!id) return;
    const order = state.orders.find((entry) => entry.id === id);
    if (order) {
      order.status = "cancelled";
    }
  },
  updateOrder: (state: TechnicalAnalysisState, action: PayloadAction<Order>) => {
    const order = normalizeOrderPayload(action.payload);
    if (!order) return;
    const index = state.orders.findIndex((entry) => entry.id === order.id);
    if (index !== -1) {
      state.orders[index] = order;
    }
  },
};
