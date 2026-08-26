"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/core/infra/store/hooks";
import { useGetAllBoursesQuery } from "@/core/infra/store/api";
import { setModalOpen } from "@/components/technical-analysis/store/technicalAnalysisSlice";
import { selectActiveMarket, selectModals, selectUiState } from "@/components/technical-analysis/store/selectors";
import { useTickerSelector } from "@/components/design-system/commons/TickerSelectorModal";
import { EXCHANGE_STATIC_INFO } from "@/core/data/ExchangesStaticData";
import styles from "./MarketSelectorModal.module.scss";

const MARKET_REVALIDATION_WINDOW_MS = 30_000;

const getCurrencySymbol = (currency: unknown): string => {
  if (!currency || typeof currency !== "object") return "N/D";
  const record = currency as { symbol?: unknown; code?: unknown };
  const value = record.symbol ?? record.code;
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : "N/D";
};

export const MarketSelectorModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isMounted, setIsMounted] = useState(false);
  const activeMarket = useSelector(selectActiveMarket);
  const uiState = useSelector(selectUiState);
  const isOpen = useSelector(selectModals).marketSelector;
  const isMultiChartMode = uiState.multiChartLayout.isEnabled
    && uiState.multiChartLayout.charts.length > 1;
  const activeLayoutCell = uiState.multiChartLayout.charts.find(
    (chart) => chart.chartId === uiState.multiChartLayout.activeChartId,
  );
  const {
    openMarketModal: openTickerSelector,
    openLayoutMarketModal: openLayoutTickerSelector,
    pendingMarket,
    pendingLayoutChartId,
    cancelLayoutMarketDirectory,
  } = useTickerSelector();
  const pendingLayoutCell = pendingLayoutChartId
    ? uiState.multiChartLayout.charts.find((chart) => chart.chartId === pendingLayoutChartId)
    : undefined;
  const effectiveMarketTicker = pendingMarket?.ticker?.trim().toUpperCase()
    || pendingLayoutCell?.exchange?.trim().toUpperCase()
    || (!pendingLayoutChartId && isMultiChartMode ? activeLayoutCell?.exchange?.trim().toUpperCase() : "")
    || activeMarket.ticker;
  const query = useGetAllBoursesQuery({ page: 1, page_size: 100 }, {
    skip: !isOpen,
    refetchOnMountOrArgChange: MARKET_REVALIDATION_WINDOW_MS / 1000,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dispatch(setModalOpen({ modal: "marketSelector", isOpen: false }));
      cancelLayoutMarketDirectory();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelLayoutMarketDirectory, dispatch, isOpen]);
  const markets = useMemo(() => {
    const rows = Array.isArray(query.data?.data) ? query.data.data : [];
    return rows
      .filter((market) => typeof market?.ticker === "string" && market.ticker.trim())
      .map((market) => {
        const ticker = market.ticker.trim().toUpperCase();
        return {
          ticker,
          name: market.name?.trim() || ticker,
          currency: getCurrencySymbol(market.currency),
          logo: EXCHANGE_STATIC_INFO[ticker]?.logo,
        };
      })
      .sort((left, right) => left.ticker.localeCompare(right.ticker));
  }, [query.data]);

  const closeModal = useCallback(() => {
    dispatch(setModalOpen({ modal: "marketSelector", isOpen: false }));
    cancelLayoutMarketDirectory();
  }, [cancelLayoutMarketDirectory, dispatch]);

  const selectMarket = useCallback((market: (typeof markets)[number]) => {
    const selectedMarket = {
      ticker: market.ticker,
      name: market.name,
      currency: market.currency,
    };
    dispatch(setModalOpen({ modal: "marketSelector", isOpen: false }));
    if (pendingLayoutChartId) {
      openLayoutTickerSelector(pendingLayoutChartId, selectedMarket);
      return;
    }
    openTickerSelector(selectedMarket);
  }, [dispatch, openLayoutTickerSelector, openTickerSelector, pendingLayoutChartId]);

  if (!isMounted || typeof document === "undefined") return null;

  const hasCachedMarkets = markets.length > 0;
  const showLoading = query.isLoading && !hasCachedMarkets;
  const showError = Boolean(query.error) && !hasCachedMarkets;

  return createPortal(
    <div className={isOpen ? styles.overlay : styles.overlay + " " + styles.overlayHidden} aria-hidden={!isOpen} role="presentation" onMouseDown={closeModal}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="market-selector-title"
        aria-describedby="market-selector-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <span className={styles.eyebrow}>Market directory</span>
            <h2 id="market-selector-title">Bourse / Exchange</h2>
            <p id="market-selector-description">
              {isMultiChartMode
                ? "Choisissez la bourse du graphique actif. Les autres panneaux restent inchangés."
                : "Choisissez le marché qui alimente votre espace d’analyse."}
            </p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.activeBadge}>
              <span className={styles.activeDot} aria-hidden="true" />
              {effectiveMarketTicker}
            </span>
            <button type="button" className={styles.closeButton} aria-label="Fermer la sélection de bourse" onClick={closeModal}>
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </header>

        {query.isFetching && hasCachedMarkets ? (
          <div className={styles.syncStatus} role="status" aria-live="polite">
            <span className={styles.syncPulse} aria-hidden="true" />
            Mise à jour des marchés…
          </div>
        ) : null}

        <div className={styles.content}>
          {showLoading ? (
            <div className={styles.statePanel} role="status" aria-live="polite">
              <div className={styles.stateIcon} aria-hidden="true">↗</div>
              <strong>Chargement des marchés</strong>
              <span>Préparation des marchés disponibles…</span>
              <div className={styles.skeletonGrid} aria-hidden="true">
                {Array.from({ length: 6 }, (_, index) => (
                  <div className={styles.skeletonCard} key={index}>
                    <span className={styles.skeletonLogo} />
                    <span className={styles.skeletonCopy}>
                      <span className={styles.skeletonLine} />
                      <span className={styles.skeletonLineShort} />
                    </span>
                    <span className={styles.skeletonPill} />
                  </div>
                ))}
              </div>
            </div>
          ) : showError ? (
            <div className={styles.statePanel} role="alert">
              <div className={styles.stateIcon} aria-hidden="true">!</div>
              <strong>Marchés indisponibles</strong>
              <span>Impossible de charger les marchés depuis l’API.</span>
            </div>
          ) : markets.length === 0 ? (
            <div className={styles.statePanel} role="status">
              <div className={styles.stateIcon} aria-hidden="true">⌁</div>
              <strong>Aucun marché fourni</strong>
              <span>L’API n’a renvoyé aucun marché disponible.</span>
            </div>
          ) : (
            <div className={styles.marketGrid} role="list" aria-label="Marchés disponibles">
              {markets.map((market, index) => {
                const isActive = market.ticker === effectiveMarketTicker;
                return (
                  <button
                    type="button"
                    className={`${styles.marketCard} ${isActive ? styles.marketCardActive : ""}`}
                    key={market.ticker}
                    aria-pressed={isActive}
                    style={{ "--market-delay": String(index * 55) + "ms" } as React.CSSProperties}
                    onClick={() => selectMarket(market)}
                  >
                    <span className={styles.marketLogoFrame}>
                      {market.logo ? (
                        <img className={styles.marketLogo} src={market.logo} alt="" loading="lazy" decoding="async" />
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
                      {isActive ? <span className={styles.activeCheck} aria-label="Marché actif">✓</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <span className={styles.apiIndicator} aria-hidden="true">⌁</span>
          <span>Marchés, noms et devises : données exclusivement issues de l’API.</span>
        </footer>
      </section>
    </div>,
    document.body,
  );
};
