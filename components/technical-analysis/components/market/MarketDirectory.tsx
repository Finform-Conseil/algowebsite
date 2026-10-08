"use client";

import React from "react";
import styles from "./MarketSelectorModal.module.scss";

export interface MarketDirectoryMarket {
  ticker: string;
  name: string;
  currency: string;
  logo?: string;
}

interface MarketDirectoryContentProps {
  children: React.ReactNode;
  className?: string;
}

export const MarketDirectoryContent: React.FC<MarketDirectoryContentProps> = ({
  children,
  className,
}) => (
  <div className={[styles.content, className].filter(Boolean).join(" ")} data-market-directory="content">
    {children}
  </div>
);

interface MarketDirectoryIntroProps {
  description: React.ReactNode;
  titleId?: string;
  descriptionId?: string;
  className?: string;
}

export const MarketDirectoryIntro: React.FC<MarketDirectoryIntroProps> = ({
  description,
  titleId,
  descriptionId,
  className,
}) => (
  <div className={[styles.headerCopy, className].filter(Boolean).join(" ")} data-market-directory="intro">
    <span className={styles.eyebrow}>Market directory</span>
    <h2 id={titleId}>Bourse / Exchange</h2>
    <p id={descriptionId}>{description}</p>
  </div>
);

interface MarketDirectoryGridProps {
  markets: readonly MarketDirectoryMarket[];
  activeMarketTicker?: string;
  onSelectMarket: (market: MarketDirectoryMarket) => void;
  ariaLabel: string;
  activeCheckLabel?: string;
}

export const MarketDirectoryGrid: React.FC<MarketDirectoryGridProps> = ({
  markets,
  activeMarketTicker,
  onSelectMarket,
  ariaLabel,
  activeCheckLabel = "Marché actif",
}) => (
  <div className={styles.marketGrid} role="list" aria-label={ariaLabel} data-market-directory="grid">
    {markets.map((market, index) => {
      const isActive = market.ticker === activeMarketTicker;
      return (
        <button
          type="button"
          className={`${styles.marketCard} ${isActive ? styles.marketCardActive : ""}`}
          key={market.ticker}
          aria-pressed={isActive}
          style={{ "--market-delay": `${index * 55}ms` } as React.CSSProperties}
          onClick={() => onSelectMarket(market)}
        >
          <span className={styles.marketLogoFrame}>
            {market.logo ? (
              <img
                className={styles.marketLogo}
                src={market.logo}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className={styles.marketLogoPlaceholder} aria-label="Logo indisponible">
                {market.ticker.slice(0, 2)}
              </span>
            )}
          </span>
          <span className={styles.marketInfo}>
            <strong className={styles.marketTicker}>{market.ticker}</strong>
            <span className={styles.marketName}>{market.name}</span>
          </span>
          <span className={styles.marketMeta}>
            <span className={styles.currencyPill}>{market.currency}</span>
            {isActive ? (
              <span className={styles.activeCheck} aria-label={activeCheckLabel}>✓</span>
            ) : null}
          </span>
        </button>
      );
    })}
  </div>
);
