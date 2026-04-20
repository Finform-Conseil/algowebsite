"use client";

import React from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export interface Broker {
  id: string;
  name: string;
  desc: string;
  rating: number | null;
  color: string;
  badge: string;
  icon: string;
}

export type BrokerConnectionState = "idle" | "connecting" | "error";
export type BrokerOrderSide = "buy" | "sell";
export type BrokerOrderType = "limit" | "stop" | "market";

export interface BrokerOrderIntent {
  symbol: string;
  side: BrokerOrderSide;
  orderType: BrokerOrderType;
  triggerPrice: number;
  triggerLabel: string;
}

export const BROKER_CATALOG: Broker[] = [
  { id: "paper", name: "Paper Trading", desc: "Brokerage simulator by Algoway", rating: null, color: "#2962ff", badge: "", icon: "bi-journal-text" },
  { id: "sgibenin", name: "SGI Bénin", desc: "Trading Mobile & Retail", rating: 4.9, color: "#00da3c", badge: "PLATINUM", icon: "bi-bank" },
  { id: "africabourse", name: "Africabourse", desc: "Innovation & FCP", rating: 4.8, color: "#f23645", badge: "GOLD", icon: "bi-graph-up-arrow" },
  { id: "sgiagi", name: "SGI-AGI", desc: "Gestion Pilotée & Support", rating: 4.7, color: "#ff9800", badge: "SILVER", icon: "bi-shield-check" },
  { id: "soaga", name: "SOAGA", desc: "OPCVM & Institutionnels", rating: 4.6, color: "#9c27b0", badge: "", icon: "bi-briefcase" },
  { id: "actibourse", name: "ACTIBOURSE", desc: "Clientèle Privée", rating: 4.6, color: "#00bcd4", badge: "", icon: "bi-person-badge" },
  { id: "hudson", name: "Hudson & Cie", desc: "Outils Avancés", rating: 4.5, color: "#e91e63", badge: "", icon: "bi-tools" },
  { id: "boacapital", name: "BOA Capital", desc: "Réseau Panafricain", rating: 4.5, color: "#8bc34a", badge: "", icon: "bi-globe-africa" },
  { id: "sgcs", name: "SGCS", desc: "Sécurité Bancaire", rating: 4.4, color: "#e040fb", badge: "", icon: "bi-safe" },
];

export interface BrokerModalProps {
  isBrokerModalOpen: boolean;
  setIsBrokerModalOpen: (val: boolean) => void;
  selectedBroker: Broker | null;
  setSelectedBroker: (val: Broker | null) => void;
  brokerConnectionState: BrokerConnectionState;
  setBrokerConnectionState: (val: BrokerConnectionState) => void;
  orderIntent: BrokerOrderIntent | null;
  setOrderIntent: (val: BrokerOrderIntent | null) => void;
}

export const MemoizedBrokerModal = React.memo(function BrokerModal({
  isBrokerModalOpen,
  setIsBrokerModalOpen,
  selectedBroker,
  setSelectedBroker,
  brokerConnectionState,
  setBrokerConnectionState,
  orderIntent,
  setOrderIntent,
}: BrokerModalProps) {
  if (!isBrokerModalOpen || typeof document === "undefined") return null;

  const resetModal = () => {
    setIsBrokerModalOpen(false);
    setSelectedBroker(null);
    setBrokerConnectionState("idle");
    setOrderIntent(null);
  };

  const orderTone = orderIntent?.side === "buy" ? "#089981" : "#f23645";
  const orderHeading = orderIntent
    ? `${orderIntent.side.toUpperCase()} ${orderIntent.symbol} @ ${orderIntent.triggerLabel} ${orderIntent.orderType}`
    : "";

  return createPortal(
    <div className="gp-broker-overlay" onClick={resetModal}>
      <div
        className={clsx("gp-broker-modal", selectedBroker && "gp-broker-modal-sm")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gp-broker-header">
          <h2 className="gp-broker-title">{selectedBroker ? "" : orderIntent ? "Préparer un ordre" : "Tradez avec votre SGI"}</h2>
          <button className="gp-broker-close" onClick={resetModal}>
            <i className="bi bi-x"></i>
          </button>
        </div>
        {!selectedBroker ? (
          <div className="gp-broker-grid gp-custom-scrollbar">
            {BROKER_CATALOG.map((broker) => (
              <div key={broker.id} className="gp-broker-card" onClick={() => setSelectedBroker(broker)}>
                <div className="gp-broker-logo" style={{ backgroundColor: broker.color }}>
                  <i className={`bi ${broker.icon}`}></i>
                </div>
                <div className="gp-broker-name">{broker.name}</div>
                <div className="gp-broker-desc">{broker.desc}</div>
                {broker.rating && (
                  <div className="gp-broker-rating">
                    <i className="bi bi-star-fill"></i> {broker.rating}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="gp-broker-connect-body">
            {orderIntent && (
              <div
                style={{
                  border: `1px solid ${orderTone}33`,
                  borderRadius: "12px",
                  background: `${orderTone}14`,
                  padding: "12px 14px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                  <div style={{ color: "#d1d4dc", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Order Ticket
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: orderTone,
                      color: "#ffffff",
                      padding: "4px 8px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {orderIntent.side.toUpperCase()} {orderIntent.orderType.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: "#ffffff", fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>
                  {orderHeading}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "8px 10px" }}>
                    <div style={{ color: "#787b86", fontSize: "10px", textTransform: "uppercase", marginBottom: "4px" }}>Symbol</div>
                    <div style={{ color: "#ffffff", fontSize: "13px", fontWeight: 600 }}>{orderIntent.symbol}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "8px 10px" }}>
                    <div style={{ color: "#787b86", fontSize: "10px", textTransform: "uppercase", marginBottom: "4px" }}>Trigger Price</div>
                    <div style={{ color: "#ffffff", fontSize: "13px", fontWeight: 600 }}>{orderIntent.triggerLabel}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="gp-broker-connect-header">
              <div className="gp-broker-logo" style={{ backgroundColor: selectedBroker.color, marginBottom: 0 }}>
                <i className={`bi ${selectedBroker.icon}`}></i>
              </div>
              <div>
                <div className="gp-broker-connect-title">
                  {selectedBroker.name}
                  {selectedBroker.badge && (
                    <span className={clsx("gp-broker-badge", selectedBroker.badge.toLowerCase())}>
                      {selectedBroker.badge}
                    </span>
                  )}
                </div>
                <div className="d-flex align-items-center gap-3 mt-1">
                  {selectedBroker.rating && (
                    <div className="gp-broker-rating">
                      <i className="bi bi-star-fill"></i> {selectedBroker.rating}
                    </div>
                  )}
                  <a href="#" className="gp-broker-link">
                    Learn More <i className="bi bi-chevron-right" style={{ fontSize: "10px" }}></i>
                  </a>
                </div>
              </div>
            </div>
            <label className="gp-broker-checkbox">
              <input type="checkbox" /> Don&apos;t remember me
            </label>
            <button
              className="gp-broker-btn"
              disabled={brokerConnectionState === "connecting"}
              onClick={() => {
                setBrokerConnectionState("connecting");
                setTimeout(() => setBrokerConnectionState("error"), 1500);
              }}
            >
              {brokerConnectionState === "connecting" ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  {" "}Connecting...
                </>
              ) : (
                orderIntent ? "Connect & Review Order" : "Connect"
              )}
            </button>
            <div className="gp-broker-disclaimer">
              By clicking &quot;{orderIntent ? "Connect & Review Order" : "Connect"}&quot; I confirm that I&apos;ve read the <a href="#">warning</a> and <a href="#">terms of use</a> and accept all risks.
            </div>
            {brokerConnectionState === "error" && (
              <div className="gp-broker-error">
                <i className="bi bi-exclamation-circle-fill"></i>
                <div className="gp-broker-error-text">
                  <strong>Error!</strong> Failed to login: The login operation has been canceled
                </div>
              </div>
            )}
          </div>
        )}
        <div className="gp-broker-footer">
          {!selectedBroker ? (
            <>
              Need a broker? <a href="#">Let us know.</a>
            </>
          ) : (
            <>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedBroker(null);
                  setBrokerConnectionState("idle");
                }}
              >
                ← Back to broker list
              </a>
              <span className="mx-2 text-secondary">|</span> Cannot connect to broker? <br /> <a href="#">Let us know.</a>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
});
