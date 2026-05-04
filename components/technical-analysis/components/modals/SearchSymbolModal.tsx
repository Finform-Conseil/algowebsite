import React, { useCallback, useEffect, useRef, useState } from "react";
import s from "../../style.module.css";
import { animate } from "framer-motion";
import clsx from "clsx";
import { BaseModal } from "../common/BaseModal";

interface SearchSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (symbol: string) => void;
}

export const SearchSymbolModal: React.FC<SearchSymbolModalProps> = ({
  isOpen,
  onClose,
  onSearch,
}) => {
  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState("");

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchInput.trim() !== "") {
      onSearch(searchInput.toUpperCase());
      handleClose();
    }
  };

  const handleClose = useCallback(() => {
    if (!searchOverlayRef.current || !searchModalRef.current) {
      onClose();
      return;
    }

    animate(searchModalRef.current, { scale: 0.9, opacity: 0 }, { duration: 0.3, ease: "easeIn" });

    animate(searchOverlayRef.current, { opacity: 0 }, {
      duration: 0.3,
      onComplete: () => {
        if (searchOverlayRef.current) searchOverlayRef.current.style.visibility = "hidden";
        onClose();
      }
    });
  }, [onClose]);

  // Reset input when opening
  // eslint-disable-next-line
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line
      setSearchInput("");
    }
  }, [isOpen]);

  // GSAP Animation for Search Modal
  useEffect(() => {
    if (isOpen && searchOverlayRef.current && searchModalRef.current) {
      searchOverlayRef.current.style.opacity = "0";
      searchOverlayRef.current.style.visibility = "visible";
      searchModalRef.current.style.opacity = "0";
      searchModalRef.current.style.transform = "scale(0.9)";

      animate(searchOverlayRef.current, { opacity: 1 }, { duration: 0.4, ease: "easeOut" });

      animate(searchModalRef.current, { scale: 1, opacity: 1 }, {
        duration: 0.5,
        delay: 0.1,
        type: "spring",
        bounce: 0.4
      });

      // Autofocus input
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Recherche de symbole"
      icon="bi-search"
      overlayRef={searchOverlayRef}
      contentRef={searchModalRef}
      maxWidth="600px"
      hideFooter={true}
    >
      <div className="p-1">
        <form onSubmit={handleSearchSubmit}>
          <div className="input-group mb-4">
            <span className="input-group-text bg-dark border-secondary text-secondary">
              <i className="bi bi-search"></i>
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="form-control bg-dark border-secondary text-white"
              placeholder="Ex: BTC/USDT, AAPL, EUR/USD..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ boxShadow: "none" }}
            />
            <button
              className={clsx("btn", s["btn-california"])}
              type="submit"
            >
              Rechercher
            </button>
          </div>
        </form>

        <div className="mb-2">
          <small className="text-secondary fw-bold text-uppercase mb-2 d-block">Suggestions</small>
          <div className="d-flex flex-wrap gap-2">
            {["BTC/USDT", "ETH/USDT", "EUR/USD", "XAU/USD", "AAPL", "TSLA"].map(sym => (
              <button
                key={sym}
                className="btn btn-sm btn-outline-secondary text-white border-secondary"
                onClick={() => {
                  setSearchInput(sym);
                  onSearch(sym);
                  handleClose();
                }}
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
