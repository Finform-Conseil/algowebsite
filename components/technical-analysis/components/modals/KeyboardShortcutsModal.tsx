"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { BaseModal } from "../common/primitives/BaseModal";
import {
  TECHNICAL_ANALYSIS_SHORTCUT_CATEGORIES,
  TECHNICAL_ANALYSIS_SHORTCUTS,
  type TechnicalAnalysisShortcutCategoryId,
} from "../../config/technicalAnalysisShortcuts";

export type KeyboardShortcutsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const KeyCaps = ({ alternatives }: { alternatives: readonly string[][] }) => (
  <span className="gp-keyboard-shortcuts__keys" aria-label={alternatives.map((keys) => keys.join(" + ")).join(" or ")}>
    {alternatives.map((keys, alternativeIndex) => (
      <React.Fragment key={keys.join("-")}>
        {alternativeIndex > 0 && <span className="gp-keyboard-shortcuts__or">or</span>}
        <span className="gp-keyboard-shortcuts__combo">
          {keys.map((key, keyIndex) => (
            <React.Fragment key={key}>
              {keyIndex > 0 && <span className="gp-keyboard-shortcuts__plus">+</span>}
              <kbd>{key}</kbd>
            </React.Fragment>
          ))}
        </span>
      </React.Fragment>
    ))}
  </span>
);

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const locale = useLocale() === "fr" ? "fr" : "en";
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<TechnicalAnalysisShortcutCategoryId>>(
    () => new Set(["chart"]),
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setExpanded(new Set(["chart"]));
    }
  }, [isOpen]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredByCategory = useMemo(() => {
    const map = new Map<TechnicalAnalysisShortcutCategoryId, typeof TECHNICAL_ANALYSIS_SHORTCUTS[number][]>();
    TECHNICAL_ANALYSIS_SHORTCUT_CATEGORIES.forEach((category) => {
      const items = TECHNICAL_ANALYSIS_SHORTCUTS.filter((shortcut) => {
        if (shortcut.category !== category.id) return false;
        if (!normalizedQuery) return true;
        const searchable = [shortcut.label.en, shortcut.label.fr, ...shortcut.keys.flat()].join(" ").toLowerCase();
        return searchable.includes(normalizedQuery);
      });
      map.set(category.id, items);
    });
    return map;
  }, [normalizedQuery]);

  if (!isOpen) return null;

  const toggleCategory = (id: TechnicalAnalysisShortcutCategoryId) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasSearchResults = Array.from(filteredByCategory.values()).some((items) => items.length > 0);

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      title={locale === "fr" ? "Raccourcis clavier" : "Keyboard shortcuts"}
      icon="bi-keyboard"
      maxWidth="920px"
      className="gp-keyboard-shortcuts-modal"
      overlayClassName="gp-keyboard-shortcuts-overlay"
      hideFooter
    >
      <div className="gp-keyboard-shortcuts">
        <p className="gp-keyboard-shortcuts__intro">
          {locale === "fr"
            ? "Accélérez votre analyse avec les raccourcis réellement actifs dans FINFORM. Chaque combinaison affichée ci-dessous est reliée à une action du graphique."
            : "Speed up your analysis with the shortcuts that are actually active in FINFORM. Every combination shown below is wired to a chart action."}
        </p>
        <label className="gp-keyboard-shortcuts__search">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === "fr" ? "Rechercher un raccourci" : "Find shortcut"}
            aria-label={locale === "fr" ? "Rechercher un raccourci" : "Find shortcut"}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label={locale === "fr" ? "Effacer la recherche" : "Clear search"}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          )}
        </label>
        <div className="gp-keyboard-shortcuts__categories">
          {TECHNICAL_ANALYSIS_SHORTCUT_CATEGORIES.map((category) => {
            const items = filteredByCategory.get(category.id) ?? [];
            if (normalizedQuery && items.length === 0) return null;
            const isExpanded = normalizedQuery ? true : expanded.has(category.id);
            return (
              <section className="gp-keyboard-shortcuts__category" key={category.id}>
                <button
                  type="button"
                  className="gp-keyboard-shortcuts__category-trigger"
                  aria-expanded={isExpanded}
                  onClick={() => toggleCategory(category.id)}
                >
                  <span className="gp-keyboard-shortcuts__category-icon"><i className={`bi ${category.icon}`} aria-hidden="true" /></span>
                  <span>{category.label[locale]}</span>
                  <span className="gp-keyboard-shortcuts__count">{items.length}</span>
                  <i className={`bi bi-chevron-${isExpanded ? "up" : "down"}`} aria-hidden="true" />
                </button>
                {isExpanded && (
                  <div className="gp-keyboard-shortcuts__rows">
                    {items.map((shortcut) => (
                      <div className="gp-keyboard-shortcuts__row" key={shortcut.id} data-shortcut-id={shortcut.id}>
                        <span className="gp-keyboard-shortcuts__label">{shortcut.label[locale]}</span>
                        <KeyCaps alternatives={shortcut.keys} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
          {!hasSearchResults && (
            <div className="gp-keyboard-shortcuts__empty">
              <i className="bi bi-search" aria-hidden="true" />
              <span>{locale === "fr" ? "Aucun raccourci trouvé." : "No shortcut found."}</span>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};
