"use client";

/**
 * [TENOR 2026 FEAT] ObjectTreePanel
 *
 * Panneau latéral "Object Tree & Data Window" en parité TradingView.
 * Design : fond blanc clair (PAT-143), ombre TV, 2 onglets.
 *
 * Onglet Object Tree : liste des drawings avec contrôles visibility/lock/trash.
 * Onglet Data Window : OHLCV + Change de la bougie pointée, en temps réel.
 *
 * [TENOR 2026 FIX] SCAR-192 : Eradication des appels natifs bloquants (prompt, confirm, alert).
 * Remplacement par une UI inline fluide et non-bloquante (Premium UI).
 */

import React, { useCallback, useState, useRef, useEffect } from "react";
import type { Drawing, ObjectTreePanelTab, DataWindowCandleValues } from "../../config/TechnicalAnalysisTypes";

// ============================================================================
// CONSTANTS — Design System TV Light (PAT-143)
// ============================================================================
const TV = {
  bg: "var(--gp-bg-toolbar, #0d2136)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  shadow: "0 4px 24px rgba(0,0,0,0.4)",
  radius: "8px",
  tabActiveBg: "rgba(255, 255, 255, 0.04)",
  tabText: "#d1d4dc",
  tabMuted: "#787b86",
  tabActiveColor: "#d1d4dc",
  labelColor: "#b2b5be",
  valueColor: "#d1d4dc",
  bullColor: "#26a69a",
  bearColor: "#ef5350",
  rowHoverBg: "rgba(255, 255, 255, 0.04)",
  divider: "1px solid rgba(255, 255, 255, 0.06)",
  iconBtn: "#787b86",
  iconBtnHover: "#d1d4dc",
  trashHover: "#f23645",
} as const;

// ============================================================================
// UTILS
// ============================================================================
const TOOL_LABELS: Record<string, string> = {
  line: "Trendline",
  horizontal_line: "Horizontal Line",
  vertical_line: "Vertical Line",
  arrow: "Arrow",
  trend_angle: "Trend Angle",
  ray: "Ray",
  x_line: "Extended Line",
  horizontal_ray: "Horizontal Ray",
  polyline: "Polyline",
  path: "Path",
  curve: "Curve",
  crosshair: "Crosshair",
  arrow_marker: "Arrow Marker",
  projection: "Projection",
  date_range: "Date Range",
  price_range: "Price Range",
  date_price_range: "Date & Price Range",
  long_position: "Long Position",
  short_position: "Short Position",
  parallel_channel: "Parallel Channel",
  regression_trend: "Regression Trend",
  flat_top_bottom: "Flat Top & Bottom",
  disjoint_channel: "Disjoint Channel",
  pitchfork: "Andrews' Pitchfork",
  schiff_pitchfork: "Schiff Pitchfork",
  modified_schiff_pitchfork: "Modified Schiff Pitchfork",
  inside_pitchfork: "Inside Pitchfork",
  fib_retracement: "Fib Retracement",
  trend_based_fib_extension: "Trend-Based Fib Extension",
  fib_channel: "Fib Channel",
  fib_time_zone: "Fib Time Zone",
  fib_speed_resistance_fan: "Fib Speed/Resistance Fan",
  trend_based_fib_time: "Trend-Based Fib Time",
  fib_circles: "Fib Circles",
  fib_spiral: "Fib Spiral",
  fib_speed_resistance_arcs: "Fib Speed/Resistance Arcs",
  fib_wedge: "Fib Wedge",
  pitchfan: "Pitchfan",
  gann_box: "Gann Box",
  gann_square_fixed: "Gann Square Fixed",
  gann_square: "Gann Square",
  gann_fan: "Gann Fan",
  xabcd_pattern: "XABCD Pattern",
  cypher_pattern: "Cypher Pattern",
  abcd_pattern: "ABCD Pattern",
  triangle_pattern: "Triangle Pattern",
  three_drives_pattern: "Three Drives",
  head_and_shoulders: "Head & Shoulders",
  elliott_impulse_wave: "Elliott Impulse Wave",
  elliott_triangle_wave: "Elliott Triangle Wave",
  elliott_triple_combo_wave: "Elliott Triple Combo Wave",
  elliott_correction_wave: "Elliott Correction Wave",
  elliott_double_combo_wave: "Elliott Double Combo Wave",
  cyclic_lines: "Cyclic Lines",
  time_cycles: "Time Cycles",
  sine_line: "Sine Line",
  position_forecast: "Position Forecast",
  bar_pattern: "Bar Pattern",
  ghost_feed: "Ghost Feed",
  anchored_vwap: "Anchored VWAP",
  sector: "Sector",
  anchored_volume_profile: "Anchored Volume Profile",
};

const getDrawingLabel = (type: string, index: number): string =>
  `${TOOL_LABELS[type] ?? type} ${index + 1}`;

const fmtPrice = (v: number): string =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtVol = (v: number): string =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(1)}K` : String(v);

// ============================================================================
// PROPS
// ============================================================================
interface ObjectTreePanelProps {
  isOpen: boolean;
  activeTab: ObjectTreePanelTab;
  setActiveTab: (tab: ObjectTreePanelTab) => void;
  drawings: Drawing[];
  selectedDrawingId: string | null;
  setSelectedDrawingId: (id: string | null) => void;
  updateDrawing: (id: string, patch: Partial<Drawing>) => void;
  deleteDrawing: (id: string) => void;
  handleClone: () => void;
  handleVisualOrder: (dir: "front" | "back") => void;
  reorderDrawing: (id: string, dir: "front" | "back") => void;
  dataWindow: DataWindowCandleValues | null;
  symbolDisplay?: string;
  isMainChartVisible: boolean;
  setIsMainChartVisible: (val: boolean) => void;
}

// ============================================================================
// SUB-COMPONENT: Drawing Row
// ============================================================================
interface DrawingRowProps {
  drawing: Drawing;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onVisibilityToggle: (id: string, hidden: boolean) => void;
  onLockToggle: (id: string, locked: boolean) => void;
  onDelete: (id: string) => void;
}

const DrawingRow: React.FC<DrawingRowProps> = ({
  drawing,
  index,
  isSelected,
  onSelect,
  onVisibilityToggle,
  onLockToggle,
  onDelete,
}) => {
  const rowBg = isSelected ? "rgba(41, 98, 255, 0.12)" : "transparent";
  const labelColor = isSelected ? TV.tabActiveColor : TV.tabText;

  return (
    <div
      role="row"
      aria-selected={isSelected}
      onClick={() => onSelect(drawing.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        cursor: "pointer",
        background: rowBg,
        borderBottom: TV.divider,
        transition: "background 0.1s",
        userSelect: "none",
        borderLeft: isSelected ? "3px solid #2962ff" : "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = TV.rowHoverBg;
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Color dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "1px",
          background: drawing.style.color ?? "#2962ff",
          flexShrink: 0,
        }}
      />
      {/* Tool label */}
      <span
        style={{
          flex: 1,
          fontSize: 12,
          fontWeight: isSelected ? 600 : 400,
          color: drawing.hidden ? TV.tabMuted : labelColor,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textDecoration: drawing.hidden ? "line-through" : "none",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {getDrawingLabel(drawing.type, index)}
      </span>

      {/* Control buttons */}
      <button
        id={`obj-tree-vis-${drawing.id}`}
        type="button"
        aria-label={drawing.hidden ? "Afficher le dessin" : "Masquer le dessin"}
        title={drawing.hidden ? "Afficher" : "Masquer"}
        onClick={(e) => {
          e.stopPropagation();
          onVisibilityToggle(drawing.id, !drawing.hidden);
        }}
        style={iconBtnStyle}
      >
        <i className={`bi ${drawing.hidden ? "bi-eye-slash" : "bi-eye"}`} />
      </button>
      <button
        id={`obj-tree-lock-${drawing.id}`}
        type="button"
        aria-label={drawing.locked ? "Déverrouiller" : "Verrouiller"}
        title={drawing.locked ? "Déverrouiller" : "Verrouiller"}
        onClick={(e) => {
          e.stopPropagation();
          onLockToggle(drawing.id, !drawing.locked);
        }}
        style={iconBtnStyle}
      >
        <i className={`bi ${drawing.locked ? "bi-lock-fill" : "bi-unlock"}`} />
      </button>
      <button
        id={`obj-tree-del-${drawing.id}`}
        type="button"
        aria-label="Supprimer le dessin"
        title="Supprimer"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(drawing.id);
        }}
        style={iconBtnStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = TV.trashHover;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = TV.iconBtn;
        }}
      >
        <i className="bi bi-trash" />
      </button>
    </div>
  );
};

const iconBtnStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: "2px 4px",
  cursor: "pointer",
  color: TV.iconBtn,
  fontSize: 12,
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  transition: "color 0.1s",
};

const toolbarIconBtnStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: "4px 8px",
  cursor: "pointer",
  color: TV.iconBtn,
  fontSize: 15,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s",
  borderRadius: "4px"
};

const IconButton: React.FC<{
  icon: string,
  title: string,
  style?: React.CSSProperties,
  onClick?: () => void,
  active?: boolean
}> = ({ icon, title, style, onClick, active }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...toolbarIconBtnStyle,
        background: (isHovered || active) ? "rgba(255, 255, 255, 0.08)" : "transparent",
        color: (isHovered || active) ? TV.tabText : TV.iconBtn,
        ...style
      }}
    >
      <i className={icon}></i>
    </button>
  );
};

// ============================================================================
// SUB-COMPONENT: Data Window
// ============================================================================
const DataWindowTab: React.FC<{ data: DataWindowCandleValues | null }> = ({ data }) => {
  if (!data) {
    return (
      <div style={{ padding: "20px 14px", color: TV.labelColor, fontSize: 12, fontFamily: "Inter, system-ui, sans-serif" }}>
        Survolez le graphique pour afficher les données.
      </div>
    );
  }

  const valueColor = data.isUp ? TV.bullColor : TV.bearColor;

  const rows: { label: string; value: string; color?: string }[] = [
    { label: "Open", value: fmtPrice(data.open), color: valueColor },
    { label: "High", value: fmtPrice(data.high), color: valueColor },
    { label: "Low", value: fmtPrice(data.low), color: valueColor },
    { label: "Close", value: fmtPrice(data.close), color: valueColor },
    { label: "Change", value: `${data.change >= 0 ? "+" : ""}${fmtPrice(data.change)}`, color: valueColor },
    { label: "Volume", value: fmtVol(data.volume) },
  ];

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Date header */}
      <div style={{ padding: "8px 14px 6px", borderBottom: TV.divider }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: TV.labelColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Date
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: TV.tabText, float: "right" }}>
          {data.date}
        </span>
      </div>

      {/* Symbol header */}
      <div style={{ padding: "6px 14px 4px", display: "flex", alignItems: "center", gap: 6, borderBottom: TV.divider }}>
        <span style={{ fontSize: 11, color: TV.tabMuted }}>
          <i className="bi bi-layers" />
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: TV.tabText }}>OHLCV</span>
      </div>

      {/* OHLCV rows */}
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "5px 14px",
            borderBottom: TV.divider,
          }}
        >
          <span style={{ fontSize: 12, color: TV.labelColor }}>{row.label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: row.color ?? TV.valueColor }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const ObjectTreePanel: React.FC<ObjectTreePanelProps> = ({
  isOpen,
  activeTab,
  setActiveTab,
  drawings,
  selectedDrawingId,
  setSelectedDrawingId,
  updateDrawing,
  deleteDrawing,
  handleClone,
  handleVisualOrder,
  reorderDrawing,
  dataWindow,
  symbolDisplay = "BOAB · BRVM, 1D",
  isMainChartVisible,
  setIsMainChartVisible,
}) => {
  const [activeMenu, setActiveMenu] = useState<"zorder" | "layouts" | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  // [TENOR 2026] Inline UI States (Replacing native dialogs)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setErrorMsg(null), 3000);
  }, []);

  const handleVisibilityToggle = useCallback(
    (id: string, hidden: boolean) => updateDrawing(id, { hidden }),
    [updateDrawing]
  );

  const handleLockToggle = useCallback(
    (id: string, locked: boolean) => updateDrawing(id, { locked }),
    [updateDrawing]
  );

  const handleGroupCreateClick = useCallback(() => {
    if (!selectedDrawingId) {
      showError("Sélectionnez un dessin d'abord pour créer un groupe.");
      return;
    }
    setIsCreatingGroup(true);
    setActiveMenu(null);
  }, [selectedDrawingId, showError]);

  const confirmGroupCreate = useCallback(() => {
    if (newGroupName.trim() && selectedDrawingId) {
      updateDrawing(selectedDrawingId, { groupId: newGroupName.trim() });
    }
    setIsCreatingGroup(false);
    setNewGroupName("");
  }, [newGroupName, selectedDrawingId, updateDrawing]);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const globalHideAll = () => {
    drawings.forEach(d => updateDrawing(d.id, { hidden: true }));
    setActiveMenu(null);
  };

  const globalShowAll = () => {
    drawings.forEach(d => updateDrawing(d.id, { hidden: false }));
    setActiveMenu(null);
  };

  const globalLockAll = () => {
    drawings.forEach(d => updateDrawing(d.id, { locked: true }));
    setActiveMenu(null);
  };

  const globalUnlockAll = () => {
    drawings.forEach(d => updateDrawing(d.id, { locked: false }));
    setActiveMenu(null);
  };

  const handleDeleteAllClick = useCallback(() => {
    setIsConfirmingDelete(true);
    setActiveMenu(null);
  }, []);

  const confirmDeleteAll = useCallback(() => {
    drawings.forEach(d => deleteDrawing(d.id));
    setIsConfirmingDelete(false);
  }, [drawings, deleteDrawing]);

  if (!isOpen) return null;

  // Grouping logic
  const drawingsByGroup: Record<string, Drawing[]> = {};
  const ungroupedDrawings: Drawing[] = [];

  drawings.forEach(d => {
    if (d.groupId) {
      if (!drawingsByGroup[d.groupId]) drawingsByGroup[d.groupId] = [];
      drawingsByGroup[d.groupId].push(d);
    } else {
      ungroupedDrawings.push(d);
    }
  });

  return (
    <div
      id="gp-object-tree-panel"
      role="complementary"
      aria-label="Object tree and data window"
      onClick={() => setActiveMenu(null)}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: TV.bg,
        borderLeft: TV.border,
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Segmented Tab Control (TV Pill Style) */}
      <div style={{ padding: "12px 14px 8px 14px", flexShrink: 0 }}>
        <div
          role="tablist"
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.04)",
            borderRadius: "6px",
            padding: "4px",
            gap: "4px",
          }}
        >
          {(["object_tree", "data_window"] as ObjectTreePanelTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === "object_tree" ? "Object tree" : "Data window";
            return (
              <button
                key={tab}
                id={`gp-panel-tab-${tab}`}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  border: "none",
                  background: isActive ? "var(--gp-bg-toolbar, #0d2136)" : "transparent",
                  color: isActive ? TV.tabText : TV.tabMuted,
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: isActive ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area (scrollable) */}
      <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
        {activeTab === "object_tree" ? (
          <>
            {/* TV Object Tree Toolbar */}
            <div style={{ display: "flex", padding: "4px 14px 10px 14px", borderBottom: TV.divider, gap: "10px", alignItems: "center", flexShrink: 0, position: "relative" }}>
              <IconButton icon="bi bi-folder-plus" title="Create a group of drawings" onClick={handleGroupCreateClick} />
              <IconButton icon="bi bi-copy" title="Clone selected" onClick={handleClone} />
              <IconButton icon="bi bi-arrow-down-up" title="Visual order" onClick={() => setActiveMenu(activeMenu === "zorder" ? null : "zorder")} active={activeMenu === "zorder"} />
              <div style={{ flex: 1 }}></div>
              <IconButton icon="bi bi-diagram-3" title="Manage layouts drawings" onClick={() => setActiveMenu(activeMenu === "layouts" ? null : "layouts")} active={activeMenu === "layouts"} />

              {/* Popups Layout (Z-Order) */}
              {activeMenu === "zorder" && (
                <div style={{ position: "absolute", top: "40px", left: "60px", background: "#1e222d", border: TV.border, borderRadius: 4, zIndex: 2000, padding: 4, boxShadow: "0 8px 16px rgba(0,0,0,0.4)", minWidth: 140 }}>
                  <button onClick={() => { reorderDrawing(selectedDrawingId!, "front"); handleVisualOrder("front"); }} style={menuItemStyle}><i className="bi bi-layer-forward" /> Bring to Front</button>
                  <button onClick={() => { reorderDrawing(selectedDrawingId!, "back"); handleVisualOrder("back"); }} style={menuItemStyle}><i className="bi bi-layer-backward" /> Send to Back</button>
                </div>
              )}

              {/* Popups Layout (Global Actions) */}
              {activeMenu === "layouts" && (
                <div style={{ position: "absolute", top: "40px", right: "14px", background: "#1e222d", border: TV.border, borderRadius: 4, zIndex: 2000, padding: 4, boxShadow: "0 8px 16px rgba(0,0,0,0.4)", minWidth: 160 }}>
                  <button onClick={globalHideAll} style={menuItemStyle}><i className="bi bi-eye-slash" /> Hide all</button>
                  <button onClick={globalShowAll} style={menuItemStyle}><i className="bi bi-eye" /> Show all</button>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                  <button onClick={globalLockAll} style={menuItemStyle}><i className="bi bi-lock-fill" /> Lock all</button>
                  <button onClick={globalUnlockAll} style={menuItemStyle}><i className="bi bi-unlock" /> Unlock all</button>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                  <button onClick={handleDeleteAllClick} style={{ ...menuItemStyle, color: "#f23645" }}><i className="bi bi-trash" /> Delete all</button>
                </div>
              )}
            </div>

            {/* [TENOR 2026] INLINE UI STATES (Replaces native dialogs) */}
            {errorMsg && (
              <div style={{ padding: "6px 14px", background: "rgba(242, 54, 69, 0.1)", color: "#f23645", fontSize: "11px", borderBottom: TV.divider, display: "flex", alignItems: "center" }}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}
              </div>
            )}

            {isCreatingGroup && (
              <div style={{ padding: "8px 14px", background: "rgba(41, 98, 255, 0.1)", borderBottom: TV.divider, display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  autoFocus
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmGroupCreate();
                    if (e.key === 'Escape') setIsCreatingGroup(false);
                  }}
                  placeholder="Nom du groupe..."
                  style={{ flex: 1, background: "#1e222d", border: "1px solid #363a45", color: "#fff", fontSize: "12px", padding: "4px 8px", borderRadius: "4px", outline: "none" }}
                />
                <button onClick={confirmGroupCreate} style={{ background: "#2962ff", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}>OK</button>
                <button onClick={() => setIsCreatingGroup(false)} style={{ background: "transparent", color: TV.tabMuted, border: "none", cursor: "pointer", padding: "0 4px" }}><i className="bi bi-x-lg"></i></button>
              </div>
            )}

            {isConfirmingDelete && (
              <div style={{ padding: "10px 14px", background: "rgba(242, 54, 69, 0.1)", borderBottom: TV.divider, display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ color: "#f23645", fontSize: "12px", fontWeight: 600 }}>Supprimer TOUS les dessins ?</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={confirmDeleteAll} style={{ background: "#f23645", color: "#fff", border: "none", borderRadius: "4px", padding: "6px 8px", fontSize: "11px", cursor: "pointer", flex: 1, fontWeight: 600 }}>Confirmer</button>
                  <button onClick={() => setIsConfirmingDelete(false)} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "4px", padding: "6px 8px", fontSize: "11px", cursor: "pointer", flex: 1 }}>Annuler</button>
                </div>
              </div>
            )}

            {/* TV Symbol Row */}
            <div style={{ display: "flex", padding: "10px 14px", alignItems: "center", borderBottom: TV.divider, background: "rgba(255,255,255,0.02)", flexShrink: 0 }}>
              <span style={{ color: TV.tabText, marginRight: "10px", opacity: 0.8, display: "flex", alignItems: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="22" height="22" fill="currentColor">
                  <path d="M17 11v6h3v-6h-3zm-.5-1h4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5z"></path>
                  <path d="M18 7h1v3.5h-1zm0 10.5h1V21h-1z"></path>
                  <path d="M9 8v12h3V8H9zm-.5-1h4a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5z"></path>
                  <path d="M10 4h1v3.5h-1zm0 16.5h1V24h-1z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: TV.tabText, flex: 1, textTransform: "uppercase" }}>
                {symbolDisplay}
              </span>
              <IconButton
                icon={isMainChartVisible ? "bi bi-eye" : "bi bi-eye-slash"}
                title={isMainChartVisible ? "Masquer le graphique" : "Afficher le graphique"}
                style={{ padding: "4px", fontSize: 14 }}
                onClick={() => setIsMainChartVisible(!isMainChartVisible)}
              />
            </div>

            {/* Drawings List with Groups */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {drawings.length === 0 ? (
                <div style={{ padding: "20px 14px", color: TV.labelColor, fontSize: 13, textAlign: "center", marginTop: "20px" }}>
                  <i className="bi bi-pencil-square" style={{ fontSize: 24, display: "block", marginBottom: 8 }} />
                  Aucun dessin sur le graphique.
                </div>
              ) : (
                <div role="rowgroup" aria-label="Liste des dessins">
                  {/* Groups Sections */}
                  {Object.entries(drawingsByGroup).map(([groupId, groupDrawings]) => (
                    <div key={groupId} style={{ borderBottom: TV.divider }}>
                      <div
                        onClick={() => toggleGroupCollapse(groupId)}
                        style={{ display: "flex", alignItems: "center", padding: "6px 14px", background: "rgba(255,255,255,0.03)", cursor: "pointer" }}
                      >
                        <i className={`bi bi-chevron-${collapsedGroups[groupId] ? "right" : "down"}`} style={{ fontSize: 10, color: TV.tabMuted, marginRight: 8 }} />
                        <i className="bi bi-folder-fill" style={{ fontSize: 14, color: "#ff9f04", marginRight: 10 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: TV.tabText, flex: 1 }}>{groupId}</span>
                        <span style={{ fontSize: 10, color: TV.tabMuted }}>({groupDrawings.length})</span>
                      </div>
                      {!collapsedGroups[groupId] && [...groupDrawings].reverse().map((drawing, idx) => (
                        <div key={drawing.id} style={{ paddingLeft: 20 }}>
                          <DrawingRow
                            drawing={drawing}
                            index={idx}
                            isSelected={drawing.id === selectedDrawingId}
                            onSelect={setSelectedDrawingId}
                            onVisibilityToggle={handleVisibilityToggle}
                            onLockToggle={handleLockToggle}
                            onDelete={deleteDrawing}
                          />
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Ungrouped Section */}
                  {[...ungroupedDrawings].reverse().map((drawing, revIdx) => {
                    const originalIndex = ungroupedDrawings.length - 1 - revIdx;
                    return (
                      <DrawingRow
                        key={drawing.id}
                        drawing={drawing}
                        index={originalIndex}
                        isSelected={drawing.id === selectedDrawingId}
                        onSelect={setSelectedDrawingId}
                        onVisibilityToggle={handleVisibilityToggle}
                        onLockToggle={handleLockToggle}
                        onDelete={deleteDrawing}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <DataWindowTab data={dataWindow} />
        )}
      </div>
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  padding: "8px 12px",
  background: "transparent",
  border: "none",
  color: "#d1d4dc",
  fontSize: "12px",
  textAlign: "left",
  cursor: "pointer",
  transition: "background 0.1s",
  borderRadius: 4
};

export default ObjectTreePanel;