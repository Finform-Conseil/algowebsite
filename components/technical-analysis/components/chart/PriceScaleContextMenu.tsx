"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { PriceScaleMode, PriceScalePosition } from "../../config/state/chartStateTypes";
import type { EChartsInstance } from "../../lib/types/echarts";

export type PriceScaleContextMenuActionId =
  | "reset-price-scale"
  | "auto-scale"
  | "lock-price-bar-ratio"
  | "scale-price-chart-only"
  | "invert-scale"
  | "mode-regular"
  | "mode-percent"
  | "mode-indexed-to-100"
  | "mode-logarithmic"
  | "move-scale"
  | "labels"
  | "lines"
  | "plus-button"
  | "more-settings";

export interface PriceScaleContextMenuModel {
  anchorX: number;
  anchorY: number;
  chartId: string | null;
}

interface PriceScaleContextMenuProps {
  state: PriceScaleContextMenuModel | null;
  mode: PriceScaleMode;
  position: PriceScalePosition;
  inverted: boolean;
  labelsVisible: boolean;
  linesVisible: boolean;
  plusButtonVisible: boolean;
  onAction: (actionId: PriceScaleContextMenuActionId) => void;
  onClose: () => void;
}

type MenuAction = {
  id: PriceScaleContextMenuActionId;
  label: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

const EDGE_MARGIN_PX = 8;
const FALLBACK_PRICE_SCALE_GUTTER_PX = 84;
const TIME_AXIS_EXCLUSION_PX = 30;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, Math.max(min, max)));

const parseAxisGutter = (value: unknown, chartWidth: number): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(percent) ? chartWidth * percent / 100 : null;
  }
  const numeric = Number.parseFloat(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
};

/**
 * Clean-room hit test for the dedicated TradingView-style price-scale surface.
 * The ECharts grid owns the plot rectangle; its left/right reservation is the
 * canonical gutter. A bounded fallback is used only while options are warming.
 */
export const isPriceScaleContextPoint = (
  chart: EChartsInstance | null,
  clientX: number,
  clientY: number,
  position: PriceScalePosition,
): boolean => {
  if (!chart) return false;
  try {
    if (chart.isDisposed()) return false;
    const rect = chart.getDom().getBoundingClientRect();
    if (
      clientX < rect.left
      || clientX > rect.right
      || clientY < rect.top
      || clientY > rect.bottom - TIME_AXIS_EXCLUSION_PX
    ) return false;

    const option = chart.getOption() as { grid?: unknown };
    const grid = Array.isArray(option.grid) ? option.grid[0] : option.grid;
    const gridRecord = grid && typeof grid === "object" ? grid as Record<string, unknown> : null;
    const rawGutter = parseAxisGutter(gridRecord?.[position], rect.width);
    const gutter = clamp(rawGutter ?? FALLBACK_PRICE_SCALE_GUTTER_PX, 40, 180);

    return position === "left"
      ? clientX <= rect.left + gutter
      : clientX >= rect.right - gutter;
  } catch {
    return false;
  }
};

/** Re-enable ECharts' data-driven Y bounds without altering scale mode/side. */
export const resetPriceScaleAutoBounds = (chart: EChartsInstance | null): void => {
  if (!chart) return;
  try {
    if (chart.isDisposed()) return;
    chart.setOption({ yAxis: [{ id: "price-yaxis", min: null, max: null }] } as never, {
      lazyUpdate: false,
      silent: true,
    } as never);
  } catch {
    // Fail closed: the next canonical render will still rebuild automatic bounds.
  }
};

const Separator = () => <div className="gp-price-scale-context-menu__separator" role="separator" />;

export const PriceScaleContextMenu: React.FC<PriceScaleContextMenuProps> = ({
  state,
  mode,
  position,
  inverted,
  labelsVisible,
  linesVisible,
  plusButtonVisible,
  onAction,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState({ left: 0, top: 0, ready: false });

  const groups = useMemo<MenuAction[][]>(() => [
    [
      { id: "reset-price-scale", label: "Réinitialiser l’échelle de prix", shortcut: "Alt + R" },
    ],
    [
      { id: "auto-scale", label: "Auto (ajuste les données à l’écran)", checked: true },
      {
        id: "lock-price-bar-ratio",
        label: "Verrouiller le ratio prix/barre",
        disabled: true,
        disabledReason: "Le moteur local ne possède pas encore de ratio prix/barre manuel persistant",
      },
      {
        id: "scale-price-chart-only",
        label: "Mettre à l’échelle le graphique de prix uniquement",
        disabled: true,
        disabledReason: "Les panneaux secondaires sont déjà isolés sur leurs propres axes",
      },
      { id: "invert-scale", label: "Inverser l’échelle", shortcut: "Alt + I", checked: inverted },
    ],
    [
      { id: "mode-regular", label: "Standard", checked: mode === "regular" },
      { id: "mode-percent", label: "Pourcentage", shortcut: "Alt + P", checked: mode === "percent" },
      { id: "mode-indexed-to-100", label: "Indexé sur 100", checked: mode === "indexed-to-100" },
      { id: "mode-logarithmic", label: "Logarithmique", shortcut: "Alt + L", checked: mode === "logarithmic" },
    ],
    [
      { id: "move-scale", label: position === "right" ? "Déplacer l’échelle à gauche" : "Déplacer l’échelle à droite" },
    ],
    [
      { id: "labels", label: "Étiquettes", checked: labelsVisible },
      { id: "lines", label: "Lignes", checked: linesVisible },
      { id: "plus-button", label: "Bouton plus", checked: plusButtonVisible },
    ],
    [
      { id: "more-settings", label: "Plus de paramètres…" },
    ],
  ], [inverted, labelsVisible, linesVisible, mode, plusButtonVisible, position]);

  useLayoutEffect(() => {
    if (!state || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const left = clamp(state.anchorX - rect.width, EDGE_MARGIN_PX, window.innerWidth - rect.width - EDGE_MARGIN_PX);
    const top = clamp(state.anchorY, EDGE_MARGIN_PX, window.innerHeight - rect.height - EDGE_MARGIN_PX);
    setPlacement({ left, top, ready: true });
    const frame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']:not(:disabled)")?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const closeOutside = (event: PointerEvent) => {
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
    window.addEventListener("pointerdown", closeOutside, true);
    window.addEventListener("keydown", closeOnEscape, true);
    window.addEventListener("resize", closeOnViewportMutation);
    window.addEventListener("scroll", closeOnViewportMutation, true);
    return () => {
      window.removeEventListener("pointerdown", closeOutside, true);
      window.removeEventListener("keydown", closeOnEscape, true);
      window.removeEventListener("resize", closeOnViewportMutation);
      window.removeEventListener("scroll", closeOnViewportMutation, true);
    };
  }, [onClose, state]);

  if (!state || typeof document === "undefined") return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const enabled = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']:not(:disabled)") ?? []);
    if (enabled.length === 0) return;
    event.preventDefault();
    const current = enabled.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Home") enabled[0]?.focus();
    else if (event.key === "End") enabled[enabled.length - 1]?.focus();
    else {
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const next = current < 0 ? 0 : (current + delta + enabled.length) % enabled.length;
      enabled[next]?.focus();
    }
  };

  return createPortal(
    <div
      ref={menuRef}
      className="gp-price-scale-context-menu"
      data-price-scale-context-menu="true"
      role="menu"
      aria-label="Actions de l’échelle de prix"
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
      style={{
        left: `${placement.left}px`,
        top: `${placement.top}px`,
        opacity: placement.ready ? 1 : 0,
        visibility: placement.ready ? "visible" : "hidden",
      }}
    >
      {groups.map((group, groupIndex) => (
        <React.Fragment key={`price-scale-group-${groupIndex}`}>
          {groupIndex > 0 ? <Separator /> : null}
          {group.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              data-action-id={item.id}
              className="gp-price-scale-context-menu__item"
              disabled={item.disabled}
              title={item.disabled ? item.disabledReason : undefined}
              onClick={() => onAction(item.id)}
            >
              <span className="gp-price-scale-context-menu__check" aria-hidden="true">{item.checked ? "✓" : ""}</span>
              <span className="gp-price-scale-context-menu__label">{item.label}</span>
              {item.shortcut ? <kbd className="gp-price-scale-context-menu__shortcut">{item.shortcut}</kbd> : null}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>,
    document.body,
  );
};
