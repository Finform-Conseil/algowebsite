// src/core/presentation/components/design-system/layouts/Dashboard/CommonPageHeader/CommonPageHeader.tsx
"use client";

import React, { memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useRef } from "react";
import styles from "./CommonPageHeader.module.css";

// --- TYPES ---

export interface BreadcrumbItem {
  label: string;
  href?: string; // Si absent, c'est l'élément actif (non cliquable)
  isActive?: boolean; // Force l'état actif
}

export interface NavPillItem {
  label: string;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  href?: string; // Optionnel, si on veut un lien direct au lieu d'un onClick
}

export interface CommonPageHeaderProps {
  /** Liste des éléments du fil d'ariane */
  breadcrumbs: BreadcrumbItem[];
  /** Liste des onglets de navigation (droite) */
  navPills?: NavPillItem[];
  /** Classes CSS additionnelles pour le conteneur principal (ex: 'sticky-top', 'mb-2') */
  className?: string;
  /**
   * 🎯 Slot pour le TickerSelectorTrigger (optionnel)
   * Permet d'insérer un composant de sélection de ticker à la fin des breadcrumbs.
   * Utilisé par les pages Equity (ArticleResearch, TechnicalAnalysis, EventsCalendar).
   */
  tickerSelectorSlot?: React.ReactNode;
}

/**
 * 🧩 CommonPageHeader - Composant Universel de Header de Page Dashboard, Home, etc.
 *
 * Respecte le principe DRY et l'architecture "Shadcn-like".
 * Responsive et Accessible.
 *
 * ⚡ OPTIMISÉ : Affichage instantané (pas d'animations GSAP bloquantes)
 */
const CommonPageHeaderComponent: React.FC<CommonPageHeaderProps> = ({
  breadcrumbs,
  navPills = [],
  className,
  tickerSelectorSlot, // 🎯 Slot optionnel pour le Ticker Selector
}) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  /*
   * [PERFORMANCE] GSAP Animations Removed
   * User feedback: External animation classes caused instability and sluggishness.
   * Decision: Render immediately for maximum responsiveness in professional context.
   */

  return (
    <div
      ref={containerRef}
      className={clsx(
        styles["main-header"],
        styles["header-container"],
        className
      )}
      role="region"
      aria-label="Navigation contextuelle de la page"
      // Removed visibility: hidden to prevent flash of invisible content if JS is slow
    >
      <div className="px-1">
        <div
          className={clsx(
            "row g-0 align-items-end",
            styles["header-nav-container"]
          )}
        >
          {/* --- COLONNE GAUCHE : BREADCRUMB --- */}
          <div className="col-12 col-lg order-1">
            <nav aria-label="Fil d'Ariane">
              <ol className={clsx("breadcrumb", styles["breadcrumb-styled"])}>
                {breadcrumbs.map((item, index) => {
                  const isLast =
                    index === breadcrumbs.length - 1 && !tickerSelectorSlot;
                  const active = item.isActive ?? isLast;

                  return (
                    <li
                      key={`${item.label}-${index}`}
                      className={clsx("breadcrumb-item", { active: active })}
                      aria-current={active ? "page" : undefined}
                    >
                      {active || !item.href ? (
                        <span>{item.label}</span>
                      ) : (
                        <Link
                          href={item.href as any}
                          prefetch={true} // Prefetch auto viewport
                          onMouseEnter={() => router.prefetch(item.href as any)} // Prefetch hover
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
                {/* 🎯 TICKER SELECTOR SLOT - Affiché après les breadcrumbs si fourni */}
                {tickerSelectorSlot}
              </ol>
            </nav>
          </div>

          {/* --- COLONNE DROITE : NAV PILLS --- */}
          {navPills.length > 0 && (
            <div className="col-12 col-lg-auto order-2 d-flex justify-content-end">
              <nav aria-label="Navigation des sections de la page">
                <ul
                  className={clsx("nav nav-pills", styles["nav-pills-styled"])}
                >
                  {navPills.map((pill, index) => (
                    <li
                      key={`${pill.label}-${index}`}
                      className={clsx("nav-item")}
                    >
                      {pill.href && !pill.onClick ? (
                        <Link
                          href={pill.href as any}
                          prefetch={true} // Prefetch auto viewport
                          onMouseEnter={() => router.prefetch(pill.href as any)} // Prefetch hover
                          className={clsx("nav-link", {
                            active: pill.isActive,
                          })}
                          aria-current={pill.isActive ? "page" : undefined}
                        >
                          {pill.label}
                        </Link>
                      ) : (
                        <a
                          href={pill.href || "#"}
                          className={clsx("nav-link", {
                            active: pill.isActive,
                          })}
                          aria-current={pill.isActive ? "page" : undefined}
                          onClick={(e) => {
                            if (pill.onClick) {
                              e.preventDefault();
                              pill.onClick(e);
                            }
                          }}
                        >
                          {pill.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Optimisation de performance : le header ne se re-rend que si ses props changent
export const CommonPageHeader = memo(CommonPageHeaderComponent);
