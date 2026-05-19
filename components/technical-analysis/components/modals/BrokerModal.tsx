"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import clsx from "clsx";
import { addOrder } from "../../store/technicalAnalysisSlice";
import { Order } from "../../config/TechnicalAnalysisTypes";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";

export interface Broker {
  id: string;
  name: string;
  desc: string;
  rating: number | null;
  color: string;
  badge: string;
  icon: string;
}

export type BrokerConnectionState = "idle" | "connecting" | "error" | "connected";
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

  const dispatch = useDispatch();
  const { addNotification } = useGlobalNotification();

  // --- Local States for Order Form ---
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "stop" | "market">("limit");
  const [price, setPrice] = useState<string>("");
  const [qty, setQty] = useState<string>("10");
  const [takeProfit, setTakeProfit] = useState<boolean>(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<boolean>(false);
  const [stopLossPrice, setStopLossPrice] = useState<string>("");

  // Sync inputs with orderIntent whenever modal opens or intent changes
  useEffect(() => {
    if (orderIntent) {
      setSide(orderIntent.side);
      setOrderType(orderIntent.orderType);
      setPrice(String(orderIntent.triggerPrice));
    } else {
      setSide("buy");
      setOrderType("limit");
      setPrice("");
    }
    setQty("10");
    setTakeProfit(false);
    setTakeProfitPrice("");
    setStopLoss(false);
    setStopLossPrice("");
  }, [orderIntent, isBrokerModalOpen]);

  const resetModal = () => {
    setIsBrokerModalOpen(false);
    setSelectedBroker(null);
    setBrokerConnectionState("idle");
    setOrderIntent(null);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedQty = parseFloat(qty);
    const parsedPrice = orderType === "market" ? 0 : parseFloat(price);

    const generatedId = `order-${new Date().getTime()}-${Math.random().toString(36).substr(2, 9)}`;
    const newOrder: Order = {
      id: generatedId,
      symbol: orderIntent?.symbol || "BOAB",
      side: side,
      orderType: orderType,
      triggerPrice: parsedPrice,
      qty: parsedQty,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    dispatch(addOrder(newOrder));

    addNotification({
      title: "Ordre Transmis",
      message: `Votre ordre de ${side.toUpperCase()} ${orderType.toUpperCase()} de ${qty} Qty @ ${orderType === 'market' ? 'Marché' : price + ' FCFA'} a été placé avec succès.`,
      type: "success",
      iconType: "faCheckCircle",
    });

    resetModal();
  };

  const renderConnectedBrokerFlow = () => {
    const isBuy = side === "buy";
    const primaryColor = isBuy ? "#00da3c" : "#ec0000";
    const primaryHoverColor = isBuy ? "#00b331" : "#c60000";
    const totalEst = parseFloat(price) && parseFloat(qty) ? parseFloat(price) * parseFloat(qty) : 0;

    return (
      <div className="gp-broker-order-ticket-body" style={{ color: "white" }}>
        {/* Connected Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="d-flex align-items-center gap-3">
            <div className="gp-broker-logo" style={{ backgroundColor: selectedBroker?.color, margin: 0, width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className={`bi ${selectedBroker?.icon}`} style={{ fontSize: "18px" }}></i>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>{selectedBroker?.name}</div>
              <div className="d-flex align-items-center gap-2 mt-0.5" style={{ fontSize: "11px", color: "#00da3c" }}>
                <span style={{ display: "inline-block", width: "6px", height: "6px", backgroundColor: "#00da3c", borderRadius: "50%" }}></span>
                Connecté (Simulé)
              </div>
            </div>
          </div>
          <button 
            type="button"
            className="btn btn-sm btn-outline-danger" 
            onClick={() => setBrokerConnectionState("idle")}
            style={{ fontSize: "11px", padding: "4px 8px" }}
          >
            Déconnexion
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleOrderSubmit}>
          {/* Side Select (BUY / SELL) Toggles */}
          <div className="d-flex mb-3 gap-2" style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "4px" }}>
            <button
              type="button"
              className="btn w-50"
              style={{
                backgroundColor: isBuy ? "#089981" : "transparent",
                color: "#ffffff",
                fontWeight: 700,
                border: "none",
                borderRadius: "6px",
                padding: "8px",
                transition: "all 0.15s ease",
              }}
              onClick={() => setSide("buy")}
            >
              ACHAT (BUY)
            </button>
            <button
              type="button"
              className="btn w-50"
              style={{
                backgroundColor: !isBuy ? "#f23645" : "transparent",
                color: "#ffffff",
                fontWeight: 700,
                border: "none",
                borderRadius: "6px",
                padding: "8px",
                transition: "all 0.15s ease",
              }}
              onClick={() => setSide("sell")}
            >
              VENTE (SELL)
            </button>
          </div>

          <div className="row g-2 mb-3">
            {/* Symbol */}
            <div className="col-6 text-start">
              <label className="form-label" style={{ fontSize: "11px", color: "#787b86", textTransform: "uppercase" }}>Symbole</label>
              <input
                type="text"
                className="form-control"
                value={orderIntent?.symbol || "BOAB"}
                readOnly
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#d1d4dc",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              />
            </div>
            {/* Order Type */}
            <div className="col-6 text-start">
              <label className="form-label" style={{ fontSize: "11px", color: "#787b86", textTransform: "uppercase" }}>Type d&apos;Ordre</label>
              <select
                className="form-select"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as BrokerOrderType)}
                style={{
                  backgroundColor: "#1e222d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontSize: "13px",
                }}
              >
                <option value="limit">LIMIT (Limite)</option>
                <option value="stop">STOP (Seuil)</option>
                <option value="market">MARKET (Au Marché)</option>
              </select>
            </div>
          </div>

          <div className="row g-2 mb-3">
            {/* Price */}
            <div className="col-6 text-start">
              <label className="form-label" style={{ fontSize: "11px", color: "#787b86", textTransform: "uppercase" }}>Prix de déclenchement</label>
              <input
                type="number"
                step="0.01"
                required={orderType !== "market"}
                disabled={orderType === "market"}
                className="form-control"
                value={orderType === "market" ? "" : price}
                placeholder={orderType === "market" ? "Au marché" : "Prix"}
                onChange={(e) => setPrice(e.target.value)}
                style={{
                  backgroundColor: "#1e222d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontSize: "13px",
                }}
              />
            </div>
            {/* Qty */}
            <div className="col-6 text-start">
              <label className="form-label" style={{ fontSize: "11px", color: "#787b86", textTransform: "uppercase" }}>Quantité</label>
              <input
                type="number"
                required
                min="1"
                className="form-control"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{
                  backgroundColor: "#1e222d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>

          {/* Bracket Orders (SL / TP) */}
          <div className="mb-3 p-2 text-start" style={{ background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
            <div className="form-check form-switch mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="tp-switch"
                checked={takeProfit}
                onChange={(e) => setTakeProfit(e.target.checked)}
              />
              <label className="form-check-label text-white" htmlFor="tp-switch" style={{ fontSize: "12px" }}>
                Take Profit (Objectif de Gain)
              </label>
            </div>
            {takeProfit && (
              <input
                type="number"
                step="0.01"
                placeholder="Prix TP"
                required
                className="form-control mb-2"
                value={takeProfitPrice}
                onChange={(e) => setTakeProfitPrice(e.target.value)}
                style={{
                  backgroundColor: "#1e222d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontSize: "12px",
                }}
              />
            )}

            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="sl-switch"
                checked={stopLoss}
                onChange={(e) => setStopLoss(e.target.checked)}
              />
              <label className="form-check-label text-white" htmlFor="sl-switch" style={{ fontSize: "12px" }}>
                Stop Loss (Limite de Perte)
              </label>
            </div>
            {stopLoss && (
              <input
                type="number"
                step="0.01"
                placeholder="Prix SL"
                required
                className="form-control mt-2"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                style={{
                  backgroundColor: "#1e222d",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontSize: "12px",
                }}
              />
            )}
          </div>

          {/* Estimations Summary */}
          <div className="p-3 mb-3" style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", fontSize: "12px" }}>
            <div className="d-flex justify-content-between mb-1">
              <span style={{ color: "#787b86" }}>Valeur estimée</span>
              <span className="text-white font-monospace fw-bold">
                {totalEst.toLocaleString(undefined, { minimumFractionDigits: 2 })} FCFA
              </span>
            </div>
            <div className="d-flex justify-content-between">
              <span style={{ color: "#787b86" }}>Commission SGI (0.2%)</span>
              <span className="text-white font-monospace">
                {(totalEst * 0.002).toLocaleString(undefined, { minimumFractionDigits: 2 })} FCFA
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn w-100 py-2"
            style={{
              backgroundColor: primaryColor,
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "14px",
              border: "none",
              borderRadius: "8px",
              transition: "background-color 0.15s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = primaryHoverColor)}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
          >
            <i className="bi bi-check-circle-fill me-2"></i>
            Placer l&apos;Ordre de {isBuy ? "Achat" : "Vente"}
          </button>
        </form>
      </div>
    );
  };

  const orderTone = orderIntent?.side === "buy" ? "#089981" : "#f23645";
  const orderHeading = orderIntent
    ? `${orderIntent.side.toUpperCase()} ${orderIntent.symbol} @ ${orderIntent.triggerLabel} ${orderIntent.orderType}`
    : "";

  return createPortal(
    <div className="gp-broker-overlay" onClick={resetModal}>
      <div
        className={clsx("gp-broker-modal", selectedBroker && brokerConnectionState !== "connected" && "gp-broker-modal-sm")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gp-broker-header">
          <h2 className="gp-broker-title">{selectedBroker && brokerConnectionState !== "connected" ? "" : orderIntent && brokerConnectionState !== "connected" ? "Préparer un ordre" : brokerConnectionState === "connected" ? "Ticket d'Ordre" : "Tradez avec votre SGI"}</h2>
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
        ) : brokerConnectionState === "connected" ? (
          <div className="gp-broker-connect-body" style={{ minWidth: "320px" }}>
            {renderConnectedBrokerFlow()}
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
              <div style={{ textAlign: "left" }}>
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
                setTimeout(() => setBrokerConnectionState("connected"), 1000);
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
