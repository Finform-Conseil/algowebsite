"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { EChartsInstance } from "../../lib/types/echarts";

export type ChartContextMenuActionId =
  | "reset-view"
  | "copy-price"
  | "paste"
  | "alert"
  | "sell-limit"
  | "buy-stop"
  | "buy-limit"
  | "sell-stop"
  | "order"
  | "lock-time-cursor"
  | "table-view"
  | "object-tree"
  | "chart-template"
  | "remove-indicators"
  | "settings";

export interface ChartContextMenuModel {
  anchorX: number;
  anchorY: number;
  chartId: string | null;
  symbol: string;
  priceValue: number | null;
  priceLabel: string | null;
  /** Last finite close for the exact target chart; drives TradingView-compatible limit/stop polarity. */
  referencePriceValue: number | null;
  /** Snapshot of the exact target chart, so inactive multi-chart cells never show a stale count. */
  indicatorCount: number;
}

interface ChartContextMenuProps {
  state: ChartContextMenuModel | null;
  canTrade: boolean;
  onAction: (actionId: ChartContextMenuActionId) => void;
  onClose: () => void;
}

type MenuAction = {
  id: ChartContextMenuActionId;
  label: string;
  icon: string;
  shortcut?: string;
  disabled?: boolean;
  disabledReason?: string;
  danger?: boolean;
  submenu?: boolean;
};

const EDGE_MARGIN_PX = 8;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, Math.max(min, max)));

export type ChartContextOrderRelation = "above-or-equal" | "below" | "unavailable";

/**
 * TradingView changes the two quick-order rows according to the clicked level:
 * above/equal market => Sell Limit + Buy Stop; below market => Buy Limit + Sell Stop.
 * Missing/non-finite data fails closed so we never present a semantically false order.
 */
export const resolveChartContextOrderRelation = (
  priceValue: number | null,
  referencePriceValue: number | null,
): ChartContextOrderRelation => {
  if (
    typeof priceValue !== "number"
    || !Number.isFinite(priceValue)
    || typeof referencePriceValue !== "number"
    || !Number.isFinite(referencePriceValue)
  ) {
    return "unavailable";
  }
  return priceValue >= referencePriceValue ? "above-or-equal" : "below";
};

/** Resolve the exact primary-price-pane value under a browser client point. */
export const resolveChartContextPriceAtClientPoint = (
  chart: EChartsInstance | null,
  clientX: number,
  clientY: number,
): number | null => {
  if (!chart) return null;
  try {
    if (chart.isDisposed()) return null;
    const rect = chart.getDom().getBoundingClientRect();
    const point: [number, number] = [clientX - rect.left, clientY - rect.top];
    if (!chart.containPixel({ gridIndex: 0 }, point)) return null;
    // ECharts' Cartesian conversion is owned by the price grid. Using only the
    // yAxis finder returns null with our linked category/value axes; the grid
    // finder resolves the exact [category, price] tuple under the pointer.
    const converted = chart.convertFromPixel({ gridIndex: 0 }, point as never) as unknown;
    const rawValue = Array.isArray(converted)
      ? converted[1] ?? converted[0]
      : converted;
    const value = Number(rawValue);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

const Separator = () => <div className="gp-chart-context-menu__separator" role="separator" />;

export const ChartContextMenu: React.FC<ChartContextMenuProps> = ({
  state,
  canTrade,
  onAction,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, ready: false });

  const actions = useMemo<MenuAction[]>(() => {
    if (!state) return [];
    const priceLabel = state.priceLabel;
    const hasPrice = state.priceValue !== null && priceLabel !== null;
    const symbol = state.symbol || "Titre";
    const indicatorCount = state.indicatorCount;
    const orderRelation = resolveChartContextOrderRelation(state.priceValue, state.referencePriceValue);
    const hasReferencePrice = orderRelation !== "unavailable";
    const quickOrderDisabled = !hasPrice || !hasReferencePrice || !canTrade;
    const quickOrderDisabledReason = !hasPrice
      ? "Disponible dans le panneau de prix principal"
      : !hasReferencePrice
        ? "Dernier cours indisponible : le type limit/stop ne peut pas être déterminé sûrement"
        : !canTrade
          ? "Le ticket d’ordre n’est pas disponible dans le contexte actuel"
          : undefined;

    const contextualOrders: [MenuAction, MenuAction] = orderRelation === "below"
      ? [
          {
            id: "buy-limit",
            label: hasPrice ? `Acheter 1 ${symbol} @ ${priceLabel} limit` : `Acheter 1 ${symbol} limit`,
            icon: "bi-chevron-up",
            shortcut: "Alt + Shift + B",
            disabled: quickOrderDisabled,
            disabledReason: quickOrderDisabledReason,
          },
          {
            id: "sell-stop",
            label: hasPrice ? `Vendre 1 ${symbol} @ ${priceLabel} stop` : `Vendre 1 ${symbol} stop`,
            icon: "bi-chevron-down",
            disabled: quickOrderDisabled,
            disabledReason: quickOrderDisabledReason,
          },
        ]
      : [
          {
            id: "sell-limit",
            label: hasPrice ? `Vendre 1 ${symbol} @ ${priceLabel} limit` : `Vendre 1 ${symbol} limit`,
            icon: "bi-chevron-down",
            shortcut: "Alt + Shift + S",
            disabled: quickOrderDisabled,
            disabledReason: quickOrderDisabledReason,
          },
          {
            id: "buy-stop",
            label: hasPrice ? `Acheter 1 ${symbol} @ ${priceLabel} stop` : `Acheter 1 ${symbol} stop`,
            icon: "bi-chevron-up",
            disabled: quickOrderDisabled,
            disabledReason: quickOrderDisabledReason,
          },
        ];

    return [
      { id: "reset-view", label: "Réinitialiser la vue du graphique", icon: "bi-arrow-counterclockwise", shortcut: "Alt + R" },
      { id: "copy-price", label: hasPrice ? `Copier le prix ${priceLabel}` : "Copier le prix", icon: "bi-copy", disabled: !hasPrice, disabledReason: "Disponible dans le panneau de prix principal" },
      { id: "paste", label: "Coller", icon: "bi-clipboard", shortcut: "Ctrl + V", disabled: true, disabledReason: "Le presse-papiers d’objets graphiques n’est pas encore disponible" },
      { id: "alert", label: hasPrice ? `Ajouter une alerte sur ${symbol} à ${priceLabel}…` : `Ajouter une alerte sur ${symbol}…`, icon: "bi-alarm", shortcut: "Alt + A", disabled: !hasPrice },
      ...contextualOrders,
      { id: "order", label: hasPrice ? `Ajouter un ordre sur ${symbol} à ${priceLabel}…` : `Ajouter un ordre sur ${symbol}…`, icon: "bi-graph-up-arrow", shortcut: "Shift + T", disabled: !hasPrice || !canTrade },
      { id: "lock-time-cursor", label: "Verrouiller la ligne verticale du curseur par temps", icon: "bi-pin-angle", disabled: true, disabledReason: "Le verrou temporel du curseur sera activé avec le moteur de curseur dédié" },
      {
        id: "table-view",
        label: "Vue tableau",
        icon: "bi-table",
        disabled: true,
        disabledReason: "La vue tableau complète TradingView n’existe pas encore localement ; Data Window reste une fonction distincte",
      },
      { id: "object-tree", label: "Arborescence des objets", icon: "bi-diagram-3" },
      { id: "chart-template", label: "Modèle de graphique", icon: "bi-layout-text-window-reverse", submenu: true },
      {
        id: "remove-indicators",
        label: indicatorCount > 0
          ? `Retirer ${indicatorCount} indicateur${indicatorCount > 1 ? "s" : ""}`
          : "Retirer les indicateurs",
        icon: "bi-x-circle",
        disabled: indicatorCount === 0,
        danger: true,
      },
      { id: "settings", label: "Paramètres…", icon: "bi-gear" },
    ];
  }, [canTrade, state]);

  useLayoutEffect(() => {
    if (!state || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const left = clamp(state.anchorX, EDGE_MARGIN_PX, window.innerWidth - rect.width - EDGE_MARGIN_PX);
    const top = clamp(state.anchorY, EDGE_MARGIN_PX, window.innerHeight - rect.height - EDGE_MARGIN_PX);
    setPosition({ left, top, ready: true });

    const focusFrame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']:not(:disabled)")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const closeIfOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      onClose();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    const closeOnViewportMutation = () => onClose();

    window.addEventListener("pointerdown", closeIfOutside, true);
    window.addEventListener("keydown", closeOnEscape, true);
    window.addEventListener("resize", closeOnViewportMutation);
    window.addEventListener("scroll", closeOnViewportMutation, true);
    return () => {
      window.removeEventListener("pointerdown", closeIfOutside, true);
      window.removeEventListener("keydown", closeOnEscape, true);
      window.removeEventListener("resize", closeOnViewportMutation);
      window.removeEventListener("scroll", closeOnViewportMutation, true);
    };
  }, [onClose, state]);

  if (!state || typeof document === "undefined") return null;

  const groups = [actions.slice(0, 3), actions.slice(3, 7), actions.slice(7, 8), actions.slice(8, 11), actions.slice(11, 12), actions.slice(12)];

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const enabled = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']:not(:disabled)") ?? []);
    if (enabled.length === 0) return;
    event.preventDefault();
    const currentIndex = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Home") enabled[0]?.focus();
    else if (event.key === "End") enabled[enabled.length - 1]?.focus();
    else {
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = currentIndex < 0
        ? 0
        : (currentIndex + delta + enabled.length) % enabled.length;
      enabled[nextIndex]?.focus();
    }
  };

  return createPortal(
    <div
      ref={menuRef}
      className="gp-chart-context-menu"
      data-chart-context-menu="true"
      role="menu"
      aria-label="Actions du graphique"
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleMenuKeyDown}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        opacity: position.ready ? 1 : 0,
        visibility: position.ready ? "visible" : "hidden",
      }}
    >
      {groups.map((group, groupIndex) => (
        <React.Fragment key={`context-group-${groupIndex}`}>
          {groupIndex > 0 ? <Separator /> : null}
          {group.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              data-action-id={item.id}
              className={`gp-chart-context-menu__item${item.danger ? " is-danger" : ""}`}
              disabled={item.disabled}
              title={item.disabled ? item.disabledReason : undefined}
              onClick={() => onAction(item.id)}
            >
              <i className={`bi ${item.icon} gp-chart-context-menu__icon`} aria-hidden="true" />
              <span className="gp-chart-context-menu__label">{item.label}</span>
              {item.shortcut ? <kbd className="gp-chart-context-menu__shortcut">{item.shortcut}</kbd> : null}
              {item.submenu ? <i className="bi bi-chevron-right gp-chart-context-menu__submenu" aria-hidden="true" /> : null}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>,
    document.body,
  );
};
