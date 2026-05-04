"use client";

import React from "react";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { selectUiState } from "../../store/technicalAnalysisSlice";

import s from "../../style.module.scss";
import { NewsSection } from "@/components/design-system/commons/CommonNewsSection/NewsSection";
import { BRVMSecurity } from "@/core/data/brvm-securities";
import { CommonTickerPanel } from "@/components/design-system/commons/CommonTickerPanel/CommonTickerPanel";

interface ChartHeaderProps {
  isLoading: boolean;
  security: BRVMSecurity;
  livePrice: number;
  liveChange: number;
  liveChangePercent: number;
  liveVolume?: number;
  _isDemoMode: boolean;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  isLoading,
  security,
  livePrice,
  liveChange,
  liveChangePercent,
  liveVolume,
  _isDemoMode,
}) => {
  const uiState = useSelector(selectUiState);

  // En mode Zen, le header disparaît pour laisser toute la place au graphique
  if (uiState.isZenMode) return null;

  return (
    <div
      className={clsx(
        "js-animated-element",
        s["prepare-animation"],
        "gsap-target-info-panel",
      )}
    >
      <CommonTickerPanel
        isLoading={isLoading}
        infoPanelClassName="gp-info-panel"
        brandLogo={security.logoUrl || "/svg/BOA-logo.svg"}
        tickerSymbol={security.ticker}
        currentPrice={livePrice}
        currency={security.currency || "XOF"}
        change={liveChange}
        changePercent={liveChangePercent}
        volume={liveVolume}
        isin={security.isin}
        figi={security.figi}
        status={security.status}
        newsSlotLeft={<NewsSection />}
        actionSlot={
          <div className={s["gp-action-buttons-grid-v2"]}>
            <button className={clsx("btn btn-light", s["gp-action-btn"])}>
              Analyze
            </button>
            <button
              className={clsx("btn btn-outline-light", s["gp-action-btn"])}
            >
              Convert
            </button>
            <button
              className={clsx("btn btn-outline-light", s["gp-action-btn"])}
            >
              Alert
            </button>
            <button className={clsx("btn btn-light", s["gp-action-btn"])}>
              Trade
            </button>
          </div>
        }
      />
    </div>
  );
};

// --- EOF ---
