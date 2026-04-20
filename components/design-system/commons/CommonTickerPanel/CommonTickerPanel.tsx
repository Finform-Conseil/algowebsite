"use client";

import React, { forwardRef } from "react";
import clsx from "clsx";
import s from "./style.module.css";

// --------------------------------------------------------------------------
// TYPES & INTERFACES
// --------------------------------------------------------------------------

export interface CommonTickerPanelProps {
  /** Logo source URL (e.g., /svg/BOA-logo.svg) */
  brandLogo: string;
  /** Ticker name (e.g., BOAB) */
  tickerSymbol: string;
  /** Current price value (formatted string, e.g., "51,51") */
  currentPrice: string | number;
  /** Currency code (default: XOF) */
  currency?: string;
  /** Price change value (e.g., -0.54) */
  change: string | number;
  /** Price change percentage (e.g., -0.96) */
  changePercent: string | number;
  /** ISIN code */
  isin?: string;
  /** FIGI code */
  figi?: string;
  /** Cotation status (e.g. delisted) */
  status?: "active" | "delisted";
  /** Trading Volume */
  volume?: string | number;

  /** Left news scroller slot */
  newsSlotLeft?: React.ReactNode;
  /** Right news scroller slot */
  newsSlotRight?: React.ReactNode;

  /** Action buttons grid or custom content */
  actionSlot?: React.ReactNode;

  /** Additional CSS class for the root container */
  className?: string;
  /** Additional CSS class for the info panel container */
  infoPanelClassName?: string;
  /** Reference for the main info panel (often used for GSAP animations) */
  mainPanelRef?: React.RefObject<HTMLDivElement | null>;
  /** Loading state for anti-flicker */
  isLoading?: boolean;
}

// --------------------------------------------------------------------------
// COMPONENT
// --------------------------------------------------------------------------

/**
 * CommonTickerPanel - A reusable v6 Ticker Compound component.
 * Used across Events Calendar, Technical Analysis, and Equity Research.
 */
export const CommonTickerPanel = forwardRef<HTMLDivElement, CommonTickerPanelProps>((props, ref) => {
  const {
    brandLogo,
    tickerSymbol,
    currentPrice,
    currency = "XOF",
    change,
    changePercent,
    isin = "BRVM30",
    figi = "BJ000534785",
    newsSlotLeft,
    newsSlotRight,
    actionSlot,
    className,
    infoPanelClassName,
    mainPanelRef,
    isLoading = false,
    status = "active",
    volume,
  } = props;

  const isPositive = typeof change === "number" ? change >= 0 : !change.toString().startsWith("-");

  const formattedPrice = typeof currentPrice === "number"
    ? currentPrice.toFixed(2).replace(".", ",")
    : currentPrice;

  const formattedChange = typeof change === "number"
    ? (change > 0 ? "+" : "") + change.toFixed(2).replace(".", ",")
    : change;

  const formattedChangePercent = typeof changePercent === "number"
    ? (changePercent > 0 ? "+" : "") + changePercent.toFixed(2).replace(".", ",") + "%"
    : changePercent;

  const formattedVolume = typeof volume === "number"
    ? volume.toLocaleString("fr-FR")
    : volume;

  return (
    <div
      ref={ref}
      className={clsx(s["ctp-root"], className)}
    >
      <div
        ref={mainPanelRef}
        className={clsx(s["ctp-info-panel"], infoPanelClassName)}
      >
        {/* Ticker Compound */}
        <div className={s["ctp-ticker-compound"]}>
          <div className={s["ctp-ticker-grid"]}>
            <div
              className={clsx(s["ctp-brand-logo-container"], isLoading && s["is-loading-skeleton"])}
              style={isLoading ? { backgroundColor: 'rgba(255, 255, 255, 0.03)', boxShadow: 'none', border: 'none' } : undefined}
            >
              {!isLoading && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brandLogo} alt="" className={s["ctp-brand-logo-bg"]} aria-hidden="true" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={brandLogo} alt={`Logo of ${tickerSymbol}`} className={s["ctp-brand-logo"]} />
                </>
              )}
            </div>

            <div className={s["ctp-ticker-text-column"]}>
              {isLoading ? (
                <div className={s["ctp-skeleton-group"]}>
                  <div className={s["ctp-ticker-main-row"]}>
                    <div className={clsx(s["ctp-ticker-symbol"], s["is-loading-skeleton"])} style={{ width: '120px', height: '2.5rem' }}></div>
                    <div className={s["ctp-ticker-price-line"]}>
                      <div className={clsx(s["ctp-price-value"], s["is-loading-skeleton"])} style={{ width: '160px', height: '2.5rem' }}></div>
                      <div className={clsx(s["ctp-performance-text"], s["is-loading-skeleton"])} style={{ width: '100px', height: '1.4rem', marginLeft: '0.5rem', alignSelf: 'center' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={s["ctp-ticker-main-row"]}>
                  <div className={s["ctp-ticker-symbol"]} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {tickerSymbol}
                    {status === "delisted" && (
                      <span
                        className="badge bg-danger d-flex align-items-center"
                        style={{ fontSize: "0.65rem", padding: "0.4em 0.6em", letterSpacing: "0.5px", cursor: "help" }}
                        title="La BRVM a officiellement supprimé cet indice le 31 Décembre 2025. L'historique affiché correspond aux dernières données de cotation avant son retrait."
                      >
                        <i className="bi bi-exclamation-triangle-fill me-1"></i> RETIRÉ DE LA COTE
                      </span>
                    )}
                  </div>

                  <div className={s["ctp-ticker-price-line"]}>
                    <div className={clsx(s["ctp-price-value"], isPositive ? s["is-positive"] : s["is-negative"])}>
                      {formattedPrice}
                    </div>

                    <div className={s["ctp-currency-stack"]}>
                      <sup className={s["ctp-sup-text"]}>D</sup>
                      <span className={s["ctp-currency-text"]}>{currency}</span>
                    </div>

                    <div className={clsx(s["ctp-performance-text"], isPositive ? s["is-positive"] : s["is-negative"])}>
                      {formattedChange}
                      <i className={clsx("bi bi-circle-fill mx-1", s["ctp-dot-separator"])}></i>
                      {formattedChangePercent}
                    </div>
                  </div>
                </div>
              )}

              <div className={s["ctp-details-line"]}>
                {isLoading ? (
                  <div className={s["ctp-details-skeleton-row"]}>
                    <span className={s["is-loading-skeleton"]} style={{ width: '150px', height: '0.8rem' }} />
                    <span className={s["is-loading-skeleton"]} style={{ width: '150px', height: '0.8rem', marginLeft: '1.5rem' }} />
                  </div>
                ) : (
                  <>
                    <span className={s["ctp-label-text"]}>ISIN</span>
                    <span className={s["ctp-data-text"]}>{isin}</span>
                    <span className={clsx(s["ctp-label-text"], s["figi-label"])}>FIGI</span>
                    <span className={s["ctp-data-text"]}>{figi}</span>
                    {volume !== undefined && (
                      <>
                        <span className={s["ctp-label-text"]} style={{ marginLeft: "1.5rem" }}>VOLUME</span>
                        <span className={s["ctp-data-text"]} style={{ color: "#fff" }}>{formattedVolume}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* News Section (Optional) */}
        {(newsSlotLeft || newsSlotRight) && (
          <div className={s["ctp-news-container"]}>
            {newsSlotLeft && (
              <div className={clsx(s["ctp-news-column"], "news-column-left")}>
                {newsSlotLeft}
              </div>
            )}
            {newsSlotRight && (
              <div className={clsx(s["ctp-news-column"], "news-column-right")}>
                {newsSlotRight}
              </div>
            )}
          </div>
        )}

        {/* Action Slot */}
        {actionSlot && (
          <div className="ms-auto">
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
});

CommonTickerPanel.displayName = "CommonTickerPanel";

export default CommonTickerPanel;
