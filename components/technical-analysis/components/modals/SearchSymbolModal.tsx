import React, { useCallback, useEffect, useRef, useState } from "react";
import s from "../../style.module.scss";
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
      <div className="p-2">
        <form onSubmit={handleSearchSubmit}>
          <div className={s["gp-search-hints"]}>
            <div className={s["gp-search-input-wrapper"]}>
              <i className="bi bi-search" aria-hidden="true"></i>
              <input
                ref={searchInputRef}
                type="text"
                className={clsx(s["gp-search-input"], s["white-placeholder"])}
                placeholder="Ex: SAPH, BOAB, SONATEL, AAPL"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            <div className="d-flex justify-content-end">
              <button
                className={clsx("btn", s["btn-california"])}
                type="submit"
                disabled={searchInput.trim().length === 0}
              >
                Ajouter au graphique
              </button>
            </div>
          </div>
        </form>

        <div className="mt-4">
          <div className={s["gp-search-hints"]}>
            <span className={s["gp-search-hints-title"]}>Suggestions rapides</span>
            <div className={s["gp-search-tags"]}>
            {["BTC/USDT", "ETH/USDT", "EUR/USD", "XAU/USD", "AAPL", "TSLA"].map(sym => (
              <button
                key={sym}
                type="button"
                className={s["gp-search-tag"]}
                onClick={() => {
                  setSearchInput(sym);
                  onSearch(sym);
                  handleClose();
                }}
              >
                {sym}
              </button>
            ))}
            </div>
            <p style={{ margin: 0, color: "var(--gp-text-secondary)", fontSize: "0.85rem" }}>
              Ajoute un symbole en comparaison sur le graphique, sans remplacer le symbole principal.
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
