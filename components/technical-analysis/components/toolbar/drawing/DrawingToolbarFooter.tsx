"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

import { DrawingIconPicker } from "./DrawingIconPicker";
import { ACTIVE_BLUE } from "./drawingToolbarTheme";

type MagnetMode = "off" | "weak" | "strong";
type LockScope = "drawings" | "indicators" | "all";
type HideScope = "drawings" | "indicators" | "positions-orders" | "all";

const REMOVE_LOCKED_STORAGE_KEY = "technical-analysis.always-remove-locked-drawings";

const LOCK_ICON_PATHS: Record<LockScope, { locked: string; unlocked: string }> = {
  drawings: {
    locked: "M16.64 21.027c1.446-1.806 4.36-.784 4.36 1.53a2.45 2.45 0 0 1-2.447 2.447H14.5a.5.5 0 0 1-.39-.813zm3.36 1.53c0-1.369-1.723-1.973-2.578-.905l-1.881 2.352h3.012c.799 0 1.447-.648 1.447-1.447m2.354-4.2-.793.793a.5.5 0 0 0 0 .707l.585.586a.5.5 0 0 0 .707 0l1.793-1.793.707.707-1.793 1.793a1.5 1.5 0 0 1-2.12 0l-.587-.585a1.5 1.5 0 0 1 0-2.122l.793-.793zM10.5 2A3.5 3.5 0 0 1 14 5.5V8h1.5l.256.013A2.5 2.5 0 0 1 18 10.5v6l-.013.256a2.5 2.5 0 0 1-2.231 2.231L15.5 19h-10a2.5 2.5 0 0 1-2.487-2.244L3 16.5v-6A2.5 2.5 0 0 1 5.5 8H7V5.5A3.5 3.5 0 0 1 10.5 2m-5 7A1.5 1.5 0 0 0 4 10.5v6A1.5 1.5 0 0 0 5.5 18h10a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 15.5 9zm5 2.5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1m0-8.5A2.5 2.5 0 0 0 8 5.5V8h5V5.5A2.5 2.5 0 0 0 10.5 3",
    unlocked: "M16.64 21.026c1.446-1.805 4.36-.783 4.36 1.53a2.45 2.45 0 0 1-2.447 2.447H14.5a.5.5 0 0 1-.39-.812zm3.36 1.53c0-1.368-1.723-1.972-2.578-.905l-1.881 2.352h3.012c.799 0 1.447-.648 1.447-1.447m2.354-4.2-.793.793a.5.5 0 0 0 0 .707l.585.586a.5.5 0 0 0 .707 0l1.793-1.793.707.707-1.793 1.793a1.5 1.5 0 0 1-2.12 0l-.587-.585a1.5 1.5 0 0 1 0-2.122l.793-.793zM7.794 2.464c1.73-.964 3.958-.367 4.975 1.332l.231.387-.874.486-.231-.386a2.685 2.685 0 0 0-3.587-.962 2.493 2.493 0 0 0-.932 3.48L8.095 8H15.5l.256.013A2.5 2.5 0 0 1 18 10.5v6l-.013.256a2.5 2.5 0 0 1-2.231 2.231L15.5 19h-10a2.5 2.5 0 0 1-2.487-2.244L3 16.5v-6A2.5 2.5 0 0 1 5.5 8h1.43l-.428-.714a3.456 3.456 0 0 1 1.292-4.823M5.5 9A1.5 1.5 0 0 0 4 10.5v6A1.5 1.5 0 0 0 5.5 18h10a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 15.5 9zm5 2.5a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1",
  },
  indicators: {
    locked: "M25.354 22.354 24.207 23.5l1.146 1.146-.707.707-1.146-1.146-1.146 1.146-.707-.707 1.146-1.146-1.146-1.146.707-.707 1.146 1.146 1.146-1.146zM21 16a2 2 0 0 1 2 2h-1a1 1 0 1 0-2 0v2h1v1h-1v2a2 2 0 1 1-4 0h1a1 1 0 1 0 2 0v-2h-1v-1h1v-2a2 2 0 0 1 2-2M10.5 2A3.5 3.5 0 0 1 14 5.5V8h1.5l.256.013A2.5 2.5 0 0 1 18 10.5v6l-.013.256a2.5 2.5 0 0 1-2.231 2.231L15.5 19h-10a2.5 2.5 0 0 1-2.487-2.244L3 16.5v-6A2.5 2.5 0 0 1 5.5 8H7V5.5A3.5 3.5 0 0 1 10.5 2m-5 7A1.5 1.5 0 0 0 4 10.5v6A1.5 1.5 0 0 0 5.5 18h10a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 15.5 9zm5 2.5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1m0-8.5A2.5 2.5 0 0 0 8 5.5V8h5V5.5A2.5 2.5 0 0 0 10.5 3",
    unlocked: "M25.354 22.354 24.207 23.5l1.146 1.147-.707.707-1.146-1.147-1.146 1.147-.707-.707 1.146-1.147-1.146-1.146.707-.707 1.146 1.146 1.146-1.146zM21 16a2 2 0 0 1 2 2h-1a1 1 0 1 0-2 0v2h1v1h-1v2a2 2 0 0 1-4 0h1a1 1 0 0 0 2 0v-2h-1v-1h1v-2a2 2 0 0 1 2-2M7.795 2.463c1.73-.963 3.957-.367 4.974 1.332l.231.387-.874.486-.23-.386a2.686 2.686 0 0 0-3.588-.961A2.494 2.494 0 0 0 7.376 6.8L8.095 8H15.5l.256.013A2.5 2.5 0 0 1 18 10.5v6l-.013.256a2.5 2.5 0 0 1-2.231 2.232L15.5 19h-10a2.5 2.5 0 0 1-2.487-2.244L3 16.5v-6A2.5 2.5 0 0 1 5.5 8h1.43l-.427-.714a3.456 3.456 0 0 1 1.292-4.823M5.5 9A1.5 1.5 0 0 0 4 10.5v6A1.5 1.5 0 0 0 5.5 18h10a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 15.5 9zm5 2.5a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1",
  },
  all: {
    locked: "M14 4a4 4 0 0 1 4 4v3h1.5a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 6 20.5v-7A2.5 2.5 0 0 1 8.5 11H10V8a4 4 0 0 1 4-4m-5.5 8A1.5 1.5 0 0 0 7 13.5v7A1.5 1.5 0 0 0 8.5 22h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5zm5.5 3a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1m0-10a3 3 0 0 0-3 3v3h6V8a3 3 0 0 0-3-3",
    unlocked: "M9.877 3.607a3.997 3.997 0 0 1 5.508 1.27l.026.043-.848.53-.01-.017-.005.004a2.998 2.998 0 0 0-5.474 2.226 3 3 0 0 0 .302.79l.08.133L10.964 11H19.5l.256.012A2.5 2.5 0 0 1 22 13.5v7a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 6 20.5v-7a2.5 2.5 0 0 1 2.244-2.488L8.5 11h1.27L8.612 9.15a4 4 0 0 1-.58-1.645 4 4 0 0 1 1.845-3.898M8.5 12A1.5 1.5 0 0 0 7 13.5v7A1.5 1.5 0 0 0 8.5 22h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5zm5.5 3a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1",
  },
};
const MENU_STYLE: React.CSSProperties = {
  position: "fixed",
  zIndex: 100000,
  minWidth: 240,
  padding: "4px 0",
  borderRadius: 4,
  border: "1px solid #2a2e39",
  background: "#1e222d",
  color: "#d1d4dc",
  boxShadow: "0 4px 12px rgba(0,0,0,.5)",
  overflow: "hidden",
};

const MENU_ROW_STYLE: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
  border: 0, background: "transparent", color: "inherit", padding: "8px 12px", fontSize: 12, textAlign: "left",
};

const SplitCaret = ({ active = false }: { active?: boolean }) => (
  <span className="gp-toolbar-split-trigger gp-toolbar-split-trigger--footer" aria-hidden="true">
    <i
      className="bi bi-caret-down-fill"
      style={{
        fontSize: "0.5rem",
        color: active ? ACTIVE_BLUE : "rgba(160, 174, 192, 0.9)",
        lineHeight: 1,
      }}
    />
  </span>
);

const MenuRow: React.FC<{ label: string; checked?: boolean; disabled?: boolean; onClick?: () => void }> = ({ label, checked = false, disabled = false, onClick }) => (
  <button type="button" role="menuitemcheckbox" aria-checked={checked} disabled={disabled} onClick={onClick}
    style={{ ...MENU_ROW_STYLE, opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
    <span>{label}</span><span aria-hidden="true" style={{ width: 16, textAlign: "center", color: checked ? ACTIVE_BLUE : "transparent" }}>✓</span>
  </button>
);

const ActionMenuRow: React.FC<{ label: string; onClick: () => void; disabled?: boolean }> = ({ label, onClick, disabled = false }) => (
  <button type="button" role="menuitem" aria-label={label} disabled={disabled} onClick={onClick}
    style={{ ...MENU_ROW_STYLE, minHeight: 32, padding: "2px 8px", fontSize: 14, justifyContent: "flex-start", opacity: disabled ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
    <span>{label}</span>
  </button>
);

const SwitchMenuRow: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
  <button type="button" role="menuitemcheckbox" aria-label={label} aria-checked={checked} onClick={() => onChange(!checked)}
    style={{ ...MENU_ROW_STYLE, minHeight: 32, padding: "2px 8px", fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
    <span>{label}</span>
    <span aria-hidden="true" style={{ position: "relative", width: 28, height: 16, flex: "0 0 auto", borderRadius: 999, background: checked ? ACTIVE_BLUE : "#50535c", transition: "background-color 120ms ease" }}>
      <span style={{ position: "absolute", top: 2, left: checked ? 14 : 2, width: 12, height: 12, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.35)", transition: "left 120ms ease" }} />
    </span>
  </button>
);

const AnchoredMenu: React.FC<{
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  offsetX?: number;
}> = ({ anchorRef, open, onClose, children, width, offsetX = 15 }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuHeight = menuRef.current?.getBoundingClientRect().height ?? 104;
      const resolvedWidth = width ?? 240;
      const maxTop = Math.max(8, window.innerHeight - menuHeight - 8);

      setPosition({
        top: Math.max(8, Math.min(rect.top, maxTop)),
        left: Math.min(rect.right + offsetX, window.innerWidth - resolvedWidth - 8),
      });
    };

    update();
    const raf = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [anchorRef, offsetX, onClose, open, width]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      className="gp-cursor-dropdown-portal"
      role="menu"
      onMouseDown={(event) => event.stopPropagation()}
      style={{
        ...MENU_STYLE,
        top: position.top,
        left: position.left,
        minWidth: width ?? MENU_STYLE.minWidth,
        width,
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

const MeasureTooltip: React.FC<{
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
}> = ({ anchorRef, open }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      top: Math.max(8, Math.min(rect.top + 3, window.innerHeight - 36)),
      left: Math.min(rect.right + 8, window.innerWidth - 250),
    });
  }, [anchorRef, open]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      role="tooltip"
      data-measure-tooltip="true"
      style={{
        position: "fixed",
        zIndex: 100001,
        top: position.top,
        left: position.left,
        display: "flex",
        alignItems: "center",
        minHeight: 30,
        padding: "0 9px",
        borderRadius: 4,
        background: "#2a2e39",
        color: "#f0f3fa",
        boxShadow: "0 2px 8px rgba(0,0,0,.35)",
        fontSize: 12,
        lineHeight: 1,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      <span style={{ fontWeight: 500 }}>Measure</span>
      <span style={{ width: 1, height: 18, margin: "0 8px", background: "rgba(255,255,255,.14)" }} />
      <kbd style={{ padding: "3px 6px", borderRadius: 3, background: "#4a4e57", color: "#fff", font: "inherit", fontWeight: 600 }}>Shift</kbd>
      <span style={{ marginLeft: 5 }}>+ Click on the chart</span>
    </div>,
    document.body,
  );
};

interface DrawingToolbarControlsProps {
  measureActive: boolean;
  iconPickerOpen: boolean;
  onIconPickerOpenChange: (open: boolean) => void;
  onMeasureToggle: () => void;
  onArmIconDrawing: (symbol: string) => void;
  zoomInActive: boolean;
  onZoomInToggle: () => void;
  zoomOutVisible: boolean;
  onZoomOut: () => void;
}

export type DrawingToolbarFooterMenu = "magnet" | "lock" | "hide" | "remove";

interface DrawingToolbarFooterProps {
  openMenu: DrawingToolbarFooterMenu | null;
  onOpenMenuChange: (menu: DrawingToolbarFooterMenu | null) => void;
  keepDrawing: boolean;
  onKeepDrawingChange: (enabled: boolean) => void;
  magnetMode: MagnetMode;
  onMagnetModeChange: (mode: MagnetMode) => void;
  onMagnetToggle: () => void;
  snapToIndicators: boolean;
  onSnapToIndicatorsChange: (enabled: boolean) => void;
  isLockedAll: boolean;
  indicatorsLocked: boolean;
  areDrawingsHidden: boolean;
  areIndicatorsHidden: boolean;
  positionsOrdersHidden: boolean;
  drawingCount: number;
  indicatorCount: number;
  onDrawingsLockToggle: () => void;
  onIndicatorsLockToggle: () => void;
  onGlobalLockToggle: () => void;
  onVisibilityToggle: () => void;
  onIndicatorsVisibilityToggle: () => void;
  onPositionsOrdersVisibilityToggle: () => void;
  onHideAllToggle: () => void;
  onRemoveAllDrawings: (includeLocked?: boolean) => void;
  onRemoveAllIndicators: () => void;
}

export const DrawingToolbarUtilityActions: React.FC<DrawingToolbarControlsProps> = ({ measureActive, iconPickerOpen, onIconPickerOpenChange, onMeasureToggle, onArmIconDrawing, zoomInActive, onZoomInToggle, zoomOutVisible, onZoomOut }) => {
  const iconAnchorRef = useRef<HTMLButtonElement>(null);
  const measureAnchorRef = useRef<HTMLButtonElement>(null);
  const zoomOutRef = useRef<HTMLButtonElement>(null);
  const [measureTooltipOpen, setMeasureTooltipOpen] = useState(false);

  useEffect(() => {
    if (!zoomOutVisible || !zoomOutRef.current) return;

    const button = zoomOutRef.current;
    const scroller = button.closest<HTMLElement>(".gp-toolbar-scroll-container");
    if (!scroller) return;

    const buttonRect = button.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const bottomOverflow = buttonRect.bottom - scrollerRect.bottom;
    const topOverflow = scrollerRect.top - buttonRect.top;

    if (bottomOverflow > 0) {
      scroller.scrollTop += bottomOverflow + 2;
    } else if (topOverflow > 0) {
      scroller.scrollTop -= topOverflow + 2;
    }
  }, [zoomOutVisible]);

  return (
    <>
      <button ref={iconAnchorRef} type="button" className={clsx("gp-toolbar-btn", "hover-lift", iconPickerOpen && "active")}
        title="Icons" aria-label="Icons" aria-haspopup="menu" aria-expanded={iconPickerOpen}
        onClick={() => onIconPickerOpenChange(!iconPickerOpen)} style={{ position: "relative" }}>
        <i className="bi bi-emoji-smile" aria-hidden="true" /><SplitCaret active={iconPickerOpen} />
      </button>
      <DrawingIconPicker
        anchorRef={iconAnchorRef}
        open={iconPickerOpen}
        onClose={() => onIconPickerOpenChange(false)}
        onSelect={onArmIconDrawing}
      />
      <div className="gp-toolbar-divider" />
      <button
        ref={measureAnchorRef}
        type="button"
        className={clsx("gp-toolbar-btn", "hover-lift", measureActive && "active")}
        aria-label="Measure"
        aria-pressed={measureActive}
        data-name="measure"
        data-tooltip-hotkey="Shift + Click on the chart"
        onMouseEnter={() => setMeasureTooltipOpen(true)}
        onMouseLeave={() => setMeasureTooltipOpen(false)}
        onFocus={() => setMeasureTooltipOpen(true)}
        onBlur={() => setMeasureTooltipOpen(false)}
        onClick={() => {
          setMeasureTooltipOpen(false);
          onMeasureToggle();
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
          <path fill="currentColor" d="M2 9.75a1.5 1.5 0 0 0-1.5 1.5v5.5a1.5 1.5 0 0 0 1.5 1.5h24a1.5 1.5 0 0 0 1.5-1.5v-5.5a1.5 1.5 0 0 0-1.5-1.5zm0 1h3v2.5h1v-2.5h3.25v3.9h1v-3.9h3.25v2.5h1v-2.5h3.25v3.9h1v-3.9H22v2.5h1v-2.5h3a.5.5 0 0 1 .5.5v5.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-5.5a.5.5 0 0 1 .5-.5z" transform="rotate(-45 14 14)" />
        </svg>
      </button>
      <MeasureTooltip anchorRef={measureAnchorRef} open={measureTooltipOpen} />
      <button
        type="button"
        className={clsx("gp-toolbar-btn", "hover-lift", zoomInActive && "active")}
        title="Zoom in"
        aria-label="Zoom in"
        aria-pressed={zoomInActive}
        data-name="zoom-in"
        onClick={onZoomInToggle}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M11 8v6M8 11h6" /></svg>
      </button>
      {zoomOutVisible && (
        <button
          ref={zoomOutRef}
          type="button"
          className={clsx("gp-toolbar-btn", "hover-lift")}
          title="Zoom out"
          aria-label="Zoom out"
          data-name="zoom-out"
          onClick={onZoomOut}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M8 11h6" />
          </svg>
        </button>
      )}
    </>
  );
};

export const DrawingToolbarFooter: React.FC<DrawingToolbarFooterProps> = ({
  openMenu, onOpenMenuChange,
  keepDrawing, onKeepDrawingChange, magnetMode, onMagnetModeChange, onMagnetToggle, snapToIndicators, onSnapToIndicatorsChange,
  isLockedAll, indicatorsLocked, areDrawingsHidden, areIndicatorsHidden, positionsOrdersHidden, drawingCount, indicatorCount,
  onDrawingsLockToggle, onIndicatorsLockToggle, onGlobalLockToggle, onVisibilityToggle,
  onIndicatorsVisibilityToggle, onPositionsOrdersVisibilityToggle, onHideAllToggle, onRemoveAllDrawings, onRemoveAllIndicators,
}) => {
  const magnetRef = useRef<HTMLButtonElement>(null);
  const lockRef = useRef<HTMLButtonElement>(null);
  const hideRef = useRef<HTMLButtonElement>(null);
  const removeRef = useRef<HTMLButtonElement>(null);
  const [alwaysRemoveLocked, setAlwaysRemoveLocked] = useState(false);
  const [lockScope, setLockScope] = useState<LockScope>("all");
  const [hideScope, setHideScope] = useState<HideScope>("drawings");

  useEffect(() => {
    try {
      setAlwaysRemoveLocked(window.localStorage.getItem(REMOVE_LOCKED_STORAGE_KEY) === "true");
    } catch {
      setAlwaysRemoveLocked(false);
    }
  }, []);

  const closeMenu = useCallback(() => onOpenMenuChange(null), [onOpenMenuChange]);
  const toggleMenu = useCallback((next: DrawingToolbarFooterMenu) => {
    onOpenMenuChange(openMenu === next ? null : next);
  }, [onOpenMenuChange, openMenu]);
  const magnetTitle = "Magnet mode snaps drawings placed near price bars to the closest OHLC value";
  const lockScopeActive =
    lockScope === "drawings"
      ? isLockedAll
      : lockScope === "indicators"
        ? indicatorsLocked
        : isLockedAll && indicatorsLocked;
  const lockScopeLabel =
    lockScope === "drawings"
      ? (lockScopeActive ? "Unlock drawings" : "Lock drawings")
      : lockScope === "indicators"
        ? (lockScopeActive ? "Unlock indicators" : "Lock indicators")
        : (lockScopeActive ? "Unlock drawings and indicators" : "Lock drawings and indicators");
  const toggleCurrentLockScope = () => {
    if (lockScope === "drawings") {
      onDrawingsLockToggle();
      return;
    }
    if (lockScope === "indicators") {
      onIndicatorsLockToggle();
      return;
    }
    onGlobalLockToggle();
  };
  const selectLockScope = (scope: LockScope, toggle: () => void) => {
    setLockScope(scope);
    toggle();
    closeMenu();
  };
  const hideScopeActive =
    hideScope === "drawings" ? areDrawingsHidden
      : hideScope === "indicators" ? areIndicatorsHidden
        : hideScope === "positions-orders" ? positionsOrdersHidden
          : areDrawingsHidden && areIndicatorsHidden && positionsOrdersHidden;
  const hideScopeLabel =
    hideScope === "drawings" ? (hideScopeActive ? "Show all drawings" : "Hide all drawings")
      : hideScope === "indicators" ? (hideScopeActive ? "Show all indicators" : "Hide all indicators")
        : hideScope === "positions-orders" ? (hideScopeActive ? "Show all positions and orders" : "Hide all positions and orders")
          : (hideScopeActive ? "Show all drawings, indicators, positions, and orders" : "Hide all drawings, indicators, positions, and orders");
  const toggleCurrentHideScope = () => {
    if (hideScope === "drawings") return onVisibilityToggle();
    if (hideScope === "indicators") return onIndicatorsVisibilityToggle();
    if (hideScope === "positions-orders") return onPositionsOrdersVisibilityToggle();
    onHideAllToggle();
  };
  const selectHideScope = (scope: HideScope, toggle: () => void, alreadyHidden: boolean) => {
    setHideScope(scope);
    if (!alreadyHidden) toggle();
    closeMenu();
  };
  const updateAlwaysRemoveLocked = (value: boolean) => {
    setAlwaysRemoveLocked(value);
    try {
      window.localStorage.setItem(REMOVE_LOCKED_STORAGE_KEY, String(value));
    } catch {
      // Keep the in-memory preference functional when storage is unavailable.
    }
  };
  const removeDrawings = () => { onRemoveAllDrawings(alwaysRemoveLocked); closeMenu(); };
  const removeIndicators = () => { onRemoveAllIndicators(); closeMenu(); };
  const removeDrawingsAndIndicators = () => {
    onRemoveAllDrawings(alwaysRemoveLocked);
    onRemoveAllIndicators();
    closeMenu();
  };

  return (
    <div className="gp-toolbar-footer">
      <div className="gp-toolbar-divider" />
      <button
        ref={magnetRef}
        type="button"
        className={clsx("gp-toolbar-btn", "hover-lift", magnetMode !== "off" && "active")}
        title={magnetTitle}
        aria-label={magnetTitle}
        aria-haspopup="menu"
        aria-expanded={openMenu === "magnet"}
        aria-pressed={magnetMode !== "off"}
        data-name="magnet-mode"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const menuTriggerHit =
            event.clientX >= rect.right - 12
            || event.clientY >= rect.bottom - 12;

          if (menuTriggerHit) {
            event.preventDefault();
            event.stopPropagation();
            toggleMenu("magnet");
            return;
          }

          onMagnetToggle();
        }}
        style={{ position: "relative" }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-magnet" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1a7 7 0 0 0-7 7v3h4V8a3 3 0 0 1 6 0v3h4V8a7 7 0 0 0-7-7m7 11h-4v3h4zM5 12H1v3h4zM0 8a8 8 0 1 1 16 0v8h-6V8a2 2 0 1 0-4 0v8H0z" /></svg>
        <SplitCaret active={openMenu === "magnet"} />
      </button>
      <AnchoredMenu anchorRef={magnetRef} open={openMenu === "magnet"} onClose={closeMenu}>
        <MenuRow
          label="Weak magnet"
          checked={magnetMode === "weak"}
          onClick={() => { onMagnetModeChange("weak"); closeMenu(); }}
        />
        <MenuRow
          label="Strong magnet"
          checked={magnetMode === "strong"}
          onClick={() => { onMagnetModeChange("strong"); closeMenu(); }}
        />
        <MenuRow
          label="Snap to indicators"
          checked={snapToIndicators}
          disabled={magnetMode === "off"}
          onClick={() => onSnapToIndicatorsChange(!snapToIndicators)}
        />
      </AnchoredMenu>

      <button
        type="button"
        className={clsx("gp-toolbar-btn", "hover-lift", keepDrawing && "active")}
        title="Keep drawing"
        aria-label="Keep drawing"
        aria-pressed={keepDrawing}
        data-name="drawginmode"
        onClick={() => onKeepDrawingChange(!keepDrawing)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="1 1 25 25" width="28" height="28" aria-hidden="true">
          <path
            fill="currentColor"
            d="M17.27 4.56a2.5 2.5 0 0 0-3.54 0l-.58.59-9 9-1 1-.15.14V20h4.7l.15-.15 1-1 9-9 .59-.58a2.5 2.5 0 0 0 0-3.54l-1.17-1.17Zm-2.83.7a1.5 1.5 0 0 1 2.12 0l1.17 1.18a1.5 1.5 0 0 1 0 2.12l-.23.23-3.3-3.29.24-.23Zm-.94.95 3.3 3.29-8.3 8.3-3.3-3.3 8.3-8.3Zm-9 9 3.3 3.29-.5.5H4v-3.3l.5-.5Zm16.5.29a1.5 1.5 0 0 0-3 0V18h3v-2.5Zm1 0V18h.5c.83 0 1.5.67 1.5 1.5v4c0 .83-.67 1.5-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5v-4c0-.83.67-1.5 1.5-1.5h.5v-2.5a2.5 2.5 0 0 1 5 0ZM16.5 19a.5.5 0 0 0-.5.5v4c0 .28.22.5.5.5h6a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-.5-.5h-6Zm2.5 4v-2h1v2h-1Z"
          />
        </svg>
      </button>

      <button
        ref={lockRef}
        type="button"
        className={clsx("gp-toolbar-btn", "hover-lift", (lockScopeActive || openMenu === "lock") && "active")}
        title={openMenu === "lock" ? undefined : lockScopeLabel}
        aria-label={lockScopeLabel}
        aria-pressed={lockScopeActive}
        aria-haspopup="menu"
        aria-expanded={openMenu === "lock"}
        data-name="lock-drawings-and-indicators"
        data-lock-scope={lockScope}
        style={{ position: "relative" }}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX >= rect.right - 14 || event.clientY >= rect.bottom - 14) {
            event.currentTarget.blur();
            event.currentTarget.removeAttribute("title");
            toggleMenu("lock");
            return;
          }
          toggleCurrentLockScope();
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="1 1 25 25" width="28" height="28" fill="none" aria-hidden="true">
          <path fill="currentColor" d={LOCK_ICON_PATHS[lockScope][lockScopeActive ? "locked" : "unlocked"]} />
        </svg>
        <SplitCaret active={openMenu === "lock"} />
      </button>
      <AnchoredMenu anchorRef={lockRef} open={openMenu === "lock"} onClose={closeMenu} width={144} offsetX={8}>
        <MenuRow label="Lock drawings" checked={isLockedAll} onClick={() => selectLockScope("drawings", onDrawingsLockToggle)} />
        <MenuRow label="Lock indicators" checked={indicatorsLocked} onClick={() => selectLockScope("indicators", onIndicatorsLockToggle)} />
        <MenuRow label="Lock all" checked={isLockedAll && indicatorsLocked} onClick={() => selectLockScope("all", onGlobalLockToggle)} />
      </AnchoredMenu>

      <button ref={hideRef} type="button"
        className={clsx("gp-toolbar-btn", "hover-lift", (hideScopeActive || openMenu === "hide") && "active")}
        title={openMenu === "hide" ? undefined : hideScopeLabel} aria-label={hideScopeLabel} aria-pressed={hideScopeActive}
        aria-haspopup="menu" aria-expanded={openMenu === "hide"} data-name="hide-objects" data-hide-scope={hideScope}
        style={{ position: "relative" }}
        onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX >= rect.right - 14 || event.clientY >= rect.bottom - 14) { event.currentTarget.blur(); event.currentTarget.removeAttribute("title"); toggleMenu("hide"); return; } toggleCurrentHideScope(); }}>
        <i className={clsx("bi", hideScopeActive ? "bi-eye-slash" : "bi-eye")} aria-hidden="true" /><SplitCaret active={openMenu === "hide"} />
      </button>
      <AnchoredMenu anchorRef={hideRef} open={openMenu === "hide"} onClose={closeMenu} width={176} offsetX={8}>
        <ActionMenuRow label="Hide drawings" onClick={() => selectHideScope("drawings", onVisibilityToggle, areDrawingsHidden)} />
        <ActionMenuRow label="Hide indicators" onClick={() => selectHideScope("indicators", onIndicatorsVisibilityToggle, areIndicatorsHidden)} />
        <ActionMenuRow label="Hide positions and orders" onClick={() => selectHideScope("positions-orders", onPositionsOrdersVisibilityToggle, positionsOrdersHidden)} />
        <ActionMenuRow label="Hide all" onClick={() => selectHideScope("all", onHideAllToggle, areDrawingsHidden && areIndicatorsHidden && positionsOrdersHidden)} />
      </AnchoredMenu>

      <div className="gp-toolbar-divider" />
      <button ref={removeRef} type="button" className={clsx("gp-toolbar-btn", "hover-lift", openMenu === "remove" && "active")}
        title={openMenu === "remove" ? undefined : "Remove objects"} aria-label="Remove objects" aria-haspopup="menu" aria-expanded={openMenu === "remove"}
        data-name="remove-objects" style={{ position: "relative" }}
        onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX >= rect.right - 14 || event.clientY >= rect.bottom - 14) { event.currentTarget.blur(); event.currentTarget.removeAttribute("title"); toggleMenu("remove"); return; } onRemoveAllDrawings(alwaysRemoveLocked); }}>
        <i className="bi bi-trash3" aria-hidden="true" /><SplitCaret active={openMenu === "remove"} />
      </button>
      <AnchoredMenu anchorRef={removeRef} open={openMenu === "remove"} onClose={closeMenu} width={277} offsetX={8}>
        <ActionMenuRow label={"Remove " + drawingCount + " drawings"} onClick={removeDrawings} />
        <ActionMenuRow label={"Remove " + indicatorCount + " indicators"} onClick={removeIndicators} />
        <ActionMenuRow label={"Remove " + drawingCount + " drawings & " + indicatorCount + " indicators"} onClick={removeDrawingsAndIndicators} />
        <div aria-hidden="true" style={{ height: 1, margin: "6px 0", background: "#363a45" }} />
        <SwitchMenuRow label="Always remove locked drawings" checked={alwaysRemoveLocked} onChange={updateAlwaysRemoveLocked} />
      </AnchoredMenu>
    </div>
  );
};
