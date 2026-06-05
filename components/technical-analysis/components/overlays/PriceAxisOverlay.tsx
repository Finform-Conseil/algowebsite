'use client';

import React from "react";
import { HorizontalLineIcon } from "../common/icons/drawing/trend";

export type PriceAxisActionId =
  | "alert"
  | "sell-limit"
  | "buy-stop"
  | "order"
  | "horizontal-line";

export interface PriceAxisActionMenuState {
  isOpen: boolean;
  priceValue: number;
  priceLabel: string;
  top: number;
  left: number;
  width: number;
}

interface PriceAxisOverlayProps {
  displaySymbolName: string;
  lastPriceDisplayLabel: string;
  lastPriceTimeLabel: string;
  lastPriceAccessibleLabel: string;
  isLastPricePositive: boolean;
  cursorPriceBadgeRef: React.RefObject<HTMLDivElement>;
  cursorPriceTextRef: React.RefObject<HTMLSpanElement>;
  cursorPriceActionRef: React.RefObject<HTMLButtonElement>;
  lastPriceBadgeRef: React.RefObject<HTMLDivElement>;
  lastPriceLineRef: React.RefObject<HTMLDivElement>;
  priceAxisActionMenu: PriceAxisActionMenuState;
  handleAxisPriceActionButtonClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handlePriceAxisAction: (actionId: PriceAxisActionId) => void;
}

const PRICE_AXIS_ACTIONS = [
  { id: "alert", icon: "bi-alarm", shortcut: "Alt + A" },
  { id: "sell-limit", icon: "bi-chevron-down", shortcut: "Alt + Shift + S" },
  { id: "buy-stop", icon: "bi-chevron-up", shortcut: "" },
  { id: "order", icon: "bi-graph-up-arrow", shortcut: "Shift + T" },
  { id: "horizontal-line", icon: null, shortcut: "Alt + H" },
] as const satisfies ReadonlyArray<{
  id: PriceAxisActionId;
  icon: string | null;
  shortcut: string;
}>;

const getActionLabel = (actionId: PriceAxisActionId, symbol: string, priceLabel: string): string => {
  switch (actionId) {
    case "alert":
      return `Add alert on ${symbol} at ${priceLabel}`;
    case "sell-limit":
      return `Sell 1 ${symbol} @ ${priceLabel} limit`;
    case "buy-stop":
      return `Buy 1 ${symbol} @ ${priceLabel} stop`;
    case "order":
      return `Add order on ${symbol} at ${priceLabel}...`;
    case "horizontal-line":
      return `Draw horizontal line at ${priceLabel}`;
  }
};

export const PriceAxisOverlay = ({
  displaySymbolName,
  lastPriceDisplayLabel,
  lastPriceTimeLabel,
  lastPriceAccessibleLabel,
  isLastPricePositive,
  cursorPriceBadgeRef,
  cursorPriceTextRef,
  cursorPriceActionRef,
  lastPriceBadgeRef,
  lastPriceLineRef,
  priceAxisActionMenu,
  handleAxisPriceActionButtonClick,
  handlePriceAxisAction,
}: PriceAxisOverlayProps) => {
  const compactPriceLabel = lastPriceDisplayLabel === "Rate unavailable"
    ? "FX N/A"
    : lastPriceDisplayLabel.replace(/\.00$/, "");
  const compactTimeLabel = lastPriceTimeLabel;

  return (
  <div className="gp-price-axis-overlay" style={{ position: "absolute", inset: 0, zIndex: 55, pointerEvents: "none" }}>
    <div ref={lastPriceLineRef} className="gp-price-axis-last-line" style={{ display: "none" }} />
    <div ref={lastPriceBadgeRef} className="gp-price-axis-last-badge" aria-label={lastPriceAccessibleLabel} style={{ position: "absolute", right: "0px", top: 0, transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "center", gap: "1px", width: "80px", maxWidth: "80px", minHeight: "42px", padding: "4px 5px", borderRadius: "3px", background: isLastPricePositive ? "#047857" : "#c91d2e", color: "#ffffff", boxShadow: "0 5px 12px rgba(0, 0, 0, 0.24)", border: "1px solid rgba(255,255,255,0.14)", lineHeight: 1.05, opacity: 0, visibility: "hidden", overflow: "hidden" }}>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "9.5px", fontWeight: 800, letterSpacing: 0 }}>{displaySymbolName}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "15px", fontWeight: 850 }}>{compactPriceLabel}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "9px", fontWeight: 700, opacity: 0.98 }}>{compactTimeLabel}</span>
    </div>
    <div ref={cursorPriceBadgeRef} className="gp-price-axis-cursor-badge" style={{ position: "absolute", right: "8px", top: 0, transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "72px", padding: "4px 8px", borderRadius: "4px", background: "#11151c", color: "#ffffff", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 24px rgba(0, 0, 0, 0.3)", fontSize: "12px", fontWeight: 700, opacity: 0, visibility: "hidden" }}>
      <span ref={cursorPriceTextRef}>0.00</span>
    </div>
    <button ref={cursorPriceActionRef} type="button" className="gp-price-axis-cursor-action" aria-label={`Open price actions for ${displaySymbolName}`} title={`Open price actions for ${displaySymbolName}`} onClick={handleAxisPriceActionButtonClick} style={{ position: "absolute", right: "88px", top: 0, transform: "translateY(-50%)", width: "20px", height: "20px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.16)", background: "linear-gradient(180deg, #141922 0%, #0e131a 100%)", color: "#ffffff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(0, 0, 0, 0.34)", pointerEvents: "auto", opacity: 0, visibility: "hidden", padding: 0 }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", fontSize: "14px", fontWeight: 500, lineHeight: 1, transform: "translateY(-1px)" }}>+</span>
    </button>
    {priceAxisActionMenu.isOpen && (
      <div className="gp-price-axis-menu-portal" style={{ top: `${priceAxisActionMenu.top}px`, left: `${priceAxisActionMenu.left}px`, width: `${priceAxisActionMenu.width}px`, pointerEvents: "auto" }}>
        {PRICE_AXIS_ACTIONS.map((item) => (
          <button key={item.id} type="button" className="gp-price-axis-menu-item" onClick={(event) => { event.stopPropagation(); handlePriceAxisAction(item.id); }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
              {item.id === "horizontal-line" ? (
                <span className="gp-price-axis-menu-icon" style={{ color: "#3b82f6" }}>
                  <HorizontalLineIcon />
                </span>
              ) : (
                <i className={`bi ${item.icon} gp-price-axis-menu-icon`}></i>
              )}
              <span className="gp-price-axis-menu-label">{getActionLabel(item.id, displaySymbolName, priceAxisActionMenu.priceLabel)}</span>
            </span>
            <span className="gp-price-axis-menu-shortcut">{item.shortcut}</span>
          </button>
        ))}
      </div>
    )}
  </div>
  );
};
