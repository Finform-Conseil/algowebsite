"use client";

import React, { useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { BRVMDividendPoint } from "../data/sidebarFundamentals";

interface DividendHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  dividends?: BRVMDividendPoint[];
}

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(",");

export const DividendHistoryModal: React.FC<DividendHistoryModalProps> = ({
  isOpen,
  onClose,
  ticker,
  dividends,
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const sortedDividends = useMemo(
    () => (dividends || []).slice().sort((a, b) => Number(b.year) - Number(a.year)),
    [dividends],
  );

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => focusFirstDialogElement(dialogRef.current), 0);

    return () => {
      document.body.style.overflow = originalOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        trapDialogFocus(event, dialogRef.current);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1e222d] border border-[#363a45] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-4 border-b border-[#363a45] d-flex justify-content-between align-items-center">
          <h3 id={titleId} className="text-white font-bold m-0">
            Historique des dividendes - {ticker}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Fermer l historique des dividendes"
          >
            <i className="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <div className="p-0 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-[#2a2e39] text-gray-400">
              <tr>
                <th className="px-4 py-2" scope="col">Annee</th>
                <th className="px-4 py-2" scope="col">Montant</th>
                <th className="px-4 py-2" scope="col">Ex-date</th>
                <th className="px-4 py-2" scope="col">Paiement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#363a45]">
              {sortedDividends.length > 0 ? (
                sortedDividends.map((dividend, index) => (
                  <tr key={`${dividend.year}-${dividend.value}-${index}`} className="hover:bg-[#2a2e39] transition-colors">
                    <td className="px-4 py-3 text-white">{dividend.year}</td>
                    <td className="px-4 py-3 text-[#10b981] font-bold">{formatDividendAmount(dividend.value)}</td>
                    <td className="px-4 py-3">{dividend.exDate || "N/D"}</td>
                    <td className="px-4 py-3">{dividend.payDate || "N/D"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Aucun historique verifie disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};

function formatDividendAmount(value: number): string {
  if (!Number.isFinite(value)) return "N/D";
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA`;
}

function focusFirstDialogElement(dialog: HTMLDivElement | null): void {
  if (!dialog) return;
  const focusable = getFocusableElements(dialog);
  (focusable[0] || dialog).focus();
}

function trapDialogFocus(event: KeyboardEvent, dialog: HTMLDivElement | null): void {
  if (!dialog) return;
  const focusable = getFocusableElements(dialog);
  if (focusable.length === 0) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function getFocusableElements(dialog: HTMLDivElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && element.tabIndex !== -1,
  );
}
