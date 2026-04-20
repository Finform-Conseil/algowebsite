"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

interface DividendHistoryItem {
  year: string;
  value: number;
}

interface DividendHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  dividends?: DividendHistoryItem[];
}

export const DividendHistoryModal: React.FC<DividendHistoryModalProps> = ({
  isOpen,
  onClose,
  ticker,
  dividends,
}) => {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1e222d] border border-[#363a45] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-4 border-b border-[#363a45] d-flex justify-content-between align-items-center">
          <h3 className="text-white font-bold m-0">Historique des dividendes - {ticker}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="p-0 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-[#2a2e39] text-gray-400">
              <tr>
                <th className="px-4 py-2">Année</th>
                <th className="px-4 py-2">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#363a45]">
              {dividends?.length ? (
                dividends
                  .slice()
                  .reverse()
                  .map((dividend, index) => (
                    <tr key={`${dividend.year}-${index}`} className="hover:bg-[#2a2e39] transition-colors">
                      <td className="px-4 py-3 text-white">{dividend.year}</td>
                      <td className="px-4 py-3 text-[#10b981] font-bold">{dividend.value?.toFixed(0)} FCFA</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                    Aucun historique disponible
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
