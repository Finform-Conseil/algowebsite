import { MAX_DRAFTS } from "./alertsRailConstants";
import type { AlertDraft, AlertsRailContext } from "./alertsRailTypes";
import { buildDefaultMessage } from "./alertsRailValidation";

export const buildDefaultDraft = (
  context: Pick<AlertsRailContext, "defaultThreshold" | "priceLabel" | "ticker">,
): AlertDraft => {
  const threshold = context.defaultThreshold || context.priceLabel;
  return {
    channel: "interface",
    condition: "price_crossing",
    expiration: "next_session",
    id: null,
    indicator: null,
    message: buildDefaultMessage(context.ticker, "price", "price_crossing", threshold),
    messageTouched: false,
    threshold,
    type: "price",
  };
};

export const upsertDraft = (
  drafts: Record<string, AlertDraft>,
  ticker: string,
  draft: AlertDraft,
) => trimDrafts({ ...drafts, [ticker]: draft });

export const setDraftOpen = (
  draftOpenByTicker: Record<string, boolean>,
  ticker: string,
  isOpen: boolean,
) => trimDraftOpenByTicker({ ...draftOpenByTicker, [ticker]: isOpen });

export const trimDraftOpenByTicker = (draftOpenByTicker: Record<string, boolean>) => (
  Object.entries(draftOpenByTicker).slice(-MAX_DRAFTS).reduce<Record<string, boolean>>((next, [ticker, isOpen]) => {
    next[ticker] = isOpen;
    return next;
  }, {})
);

export const trimDrafts = (drafts: Record<string, AlertDraft>) => (
  Object.entries(drafts).slice(-MAX_DRAFTS).reduce<Record<string, AlertDraft>>((next, [ticker, draft]) => {
    next[ticker] = draft;
    return next;
  }, {})
);
