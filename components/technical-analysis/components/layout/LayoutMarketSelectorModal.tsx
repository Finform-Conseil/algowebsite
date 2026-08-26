"use client";

import React, { useMemo } from "react";
import { BaseModal } from "../common/primitives/BaseModal";
import { EXCHANGE_STATIC_INFO } from "@/core/data/ExchangesStaticData";

export interface LayoutMarketSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExchange: (exchange: string) => void;
}

/**
 * Market-first selector for an unbound multi-chart slot.
 * Empty slots intentionally own neither a symbol nor an exchange.
 */
export const LayoutMarketSelectorModal: React.FC<LayoutMarketSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectExchange,
}) => {
  const exchanges = useMemo(
    () => Object.entries(EXCHANGE_STATIC_INFO)
      .map(([ticker, info]) => ({ ticker, ...info }))
      .sort((left, right) => left.ticker.localeCompare(right.ticker)),
    [],
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Choisir une bourse"
      icon={<i className="bi bi-globe2 me-2" aria-hidden="true" />}
      maxWidth="640px"
      className="gp-layout-market-selector"
      showCloseButton
    >
      <div className="d-grid gap-2" role="list" aria-label="Bourses disponibles">
        <p className="small text-secondary mb-2">
          Sélectionnez d’abord la bourse de ce panneau. Les titres proposés à l’étape suivante seront limités à cette bourse.
        </p>
        {exchanges.map((exchange) => (
          <button
            key={exchange.ticker}
            type="button"
            className="btn btn-outline-light d-flex align-items-center gap-3 text-start px-3 py-2"
            onClick={() => onSelectExchange(exchange.ticker)}
            role="listitem"
            aria-label={`Choisir la bourse ${exchange.ticker}, ${exchange.country}`}
          >
            <img
              src={exchange.logo}
              alt=""
              width={34}
              height={34}
              style={{ objectFit: "contain", flex: "0 0 auto" }}
            />
            <span className="d-flex flex-column flex-grow-1 overflow-hidden">
              <strong>{exchange.ticker}</strong>
              <span className="small text-secondary text-truncate">{exchange.country} · {exchange.region}</span>
            </span>
            <span className="badge text-bg-dark">{exchange.currency}</span>
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        ))}
      </div>
    </BaseModal>
  );
};

LayoutMarketSelectorModal.displayName = "LayoutMarketSelectorModal";
