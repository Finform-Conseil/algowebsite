"use client";

import React from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface CurrencyOption {
  code: string;
  name: string;
  flag: string;
}

const AFRICAN_CURRENCIES: CurrencyOption[] = [
  { code: "XOF", name: "Franc CFA BCEAO", flag: "🇨🇮" },
  { code: "XAF", name: "Franc CFA CEMAC", flag: "🇨🇲" },
  { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬" },
  { code: "KES", name: "Kenyan Shilling", flag: "🇰🇪" },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦" },
  { code: "MAD", name: "Moroccan Dirham", flag: "🇲🇦" },
  { code: "EGP", name: "Egyptian Pound", flag: "🇪🇬" },
  { code: "GHS", name: "Ghanaian Cedi", flag: "🇬🇭" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
];

export interface CurrencySelectorProps {
  selectedCurrency: string;
  setSelectedCurrency: (val: string) => void;
  isCurrencyOpen: boolean;
  setIsCurrencyOpen: (val: boolean) => void;
  currencyQuery: string;
  setCurrencyQuery: (val: string) => void;
  currencyBtnRef: React.RefObject<HTMLDivElement | null>;
  currencyPos: { top: number; left: number };
  setCurrencyPos: (pos: { top: number; left: number }) => void;
}

export const MemoizedCurrencySelector = React.memo(function CurrencySelector({
  selectedCurrency,
  setSelectedCurrency,
  isCurrencyOpen,
  setIsCurrencyOpen,
  currencyQuery,
  setCurrencyQuery,
  currencyBtnRef,
  currencyPos,
  setCurrencyPos,
}: CurrencySelectorProps) {
  const filteredCurrencies = AFRICAN_CURRENCIES.filter(
    (currency) =>
      currency.code.toLowerCase().includes(currencyQuery.toLowerCase()) ||
      currency.name.toLowerCase().includes(currencyQuery.toLowerCase()),
  );

  return (
    <>
      <div
        ref={currencyBtnRef}
        className="gp-currency-btn"
        onClick={(e) => {
          e.stopPropagation();
          if (!isCurrencyOpen && currencyBtnRef.current) {
            const rect = currencyBtnRef.current.getBoundingClientRect();
            setCurrencyPos({ top: rect.bottom + 4, left: rect.right - 240 });
          }
          setIsCurrencyOpen(!isCurrencyOpen);
        }}
      >
        <span>{selectedCurrency}</span>
        <i className="bi bi-chevron-down" style={{ fontSize: "10px", marginTop: "2px" }}></i>
      </div>
      {isCurrencyOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="gp-currency-dropdown-portal"
            style={{ top: currencyPos.top, left: currencyPos.left }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="gp-currency-header">Currencies</div>
            <div className="gp-currency-search">
              <i className="bi bi-search" style={{ color: "#787b86", fontSize: "12px" }}></i>
              <input
                autoFocus
                type="text"
                placeholder="Search"
                value={currencyQuery}
                onChange={(e) => setCurrencyQuery(e.target.value)}
              />
            </div>
            <div className="gp-currency-list gp-custom-scrollbar">
              {filteredCurrencies.map((currency) => (
                <div
                  key={currency.code}
                  className={clsx("gp-currency-item", selectedCurrency === currency.code && "active")}
                  onClick={() => {
                    setSelectedCurrency(currency.code);
                    setIsCurrencyOpen(false);
                    setCurrencyQuery("");
                  }}
                >
                  <span className="gp-currency-flag">{currency.flag}</span>
                  <div className="gp-currency-info">
                    <span className="gp-currency-code">{currency.code}</span>
                    <span className="gp-currency-name">{currency.name}</span>
                  </div>
                </div>
              ))}
              {filteredCurrencies.length === 0 && (
                <div style={{ padding: "16px", textAlign: "center", color: "#787b86", fontSize: "12px" }}>
                  No currencies found
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
});
