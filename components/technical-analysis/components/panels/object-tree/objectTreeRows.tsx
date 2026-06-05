import React, { useState } from "react";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import { getDrawingLabel } from "./objectTreeDrawingLabels";
import type { ObjectTreeItem } from "./objectTreeItemTypes";
import { iconBtnStyle, toolbarIconBtnStyle, TV } from "./objectTreePanelStyles";

type DrawingRowProps = {
  drawing: Drawing;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onVisibilityToggle: (id: string, hidden: boolean) => void;
  onLockToggle: (id: string, locked: boolean) => void;
  onDelete: (id: string) => void;
};

type ObjectTreeItemRowProps = {
  item: ObjectTreeItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onVisibilityToggle?: (item: ObjectTreeItem) => void;
  onMainVisibilityToggle: () => void;
  onRemove?: (item: ObjectTreeItem) => void;
};

type IconButtonProps = {
  icon: string;
  title: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  active?: boolean;
};

export const DrawingRow: React.FC<DrawingRowProps> = ({
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
      onMouseEnter={(event) => {
        if (!isSelected) event.currentTarget.style.background = TV.rowHoverBg;
      }}
      onMouseLeave={(event) => {
        if (!isSelected) event.currentTarget.style.background = "transparent";
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "1px",
          background: drawing.style.color ?? "#2962ff",
          flexShrink: 0,
        }}
      />
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
      <button
        id={`obj-tree-vis-${drawing.id}`}
        type="button"
        aria-label={drawing.hidden ? "Afficher le dessin" : "Masquer le dessin"}
        title={drawing.hidden ? "Afficher" : "Masquer"}
        onClick={(event) => {
          event.stopPropagation();
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
        onClick={(event) => {
          event.stopPropagation();
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
        onClick={(event) => {
          event.stopPropagation();
          onDelete(drawing.id);
        }}
        style={iconBtnStyle}
        onMouseEnter={(event) => {
          event.currentTarget.style.color = TV.trashHover;
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.color = TV.iconBtn;
        }}
      >
        <i className="bi bi-trash" />
      </button>
    </div>
  );
};

export const ObjectTreeItemRow: React.FC<ObjectTreeItemRowProps> = ({
  item,
  isSelected,
  onSelect,
  onVisibilityToggle,
  onMainVisibilityToggle,
  onRemove,
}) => (
  <div
    role="row"
    aria-selected={isSelected}
    onClick={() => onSelect(item.id)}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "7px 14px",
      borderBottom: TV.divider,
      background: isSelected ? "rgba(41, 98, 255, 0.12)" : "transparent",
      borderLeft: isSelected ? "3px solid #2962ff" : "3px solid transparent",
      cursor: "pointer",
      userSelect: "none",
    }}
  >
    <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
    <span style={{ flex: 1, color: item.visible ? TV.tabText : TV.tabMuted, fontSize: 12, fontWeight: item.kind === "series" ? 700 : 500 }}>
      {item.label}
    </span>
    <span style={{ color: TV.tabMuted, fontSize: 10, textTransform: "uppercase" }}>{item.kind}</span>
    <button
      type="button"
      aria-label={item.visible ? "Masquer" : "Afficher"}
      title={item.visible ? "Masquer" : "Afficher"}
      onClick={(event) => {
        event.stopPropagation();
        if (item.id === "main-series") {
          onMainVisibilityToggle();
          return;
        }
        onVisibilityToggle?.(item);
      }}
      style={{ ...iconBtnStyle, opacity: 1, cursor: "pointer" }}
    >
      <i className={`bi ${item.visible ? "bi-eye" : "bi-eye-slash"}`} />
    </button>
    <button
      type="button"
      aria-label="Supprimer"
      title={item.removable ? "Supprimer du graphique" : "Non supprimable depuis cette ligne"}
      onClick={(event) => {
        event.stopPropagation();
        if (item.removable) onRemove?.(item);
      }}
      style={{ ...iconBtnStyle, opacity: item.removable ? 1 : 0.35, cursor: item.removable ? "pointer" : "default" }}
    >
      <i className="bi bi-trash" />
    </button>
  </div>
);

export const IconButton: React.FC<IconButtonProps> = ({ icon, title, style, onClick, active }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      title={title}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...toolbarIconBtnStyle,
        background: (isHovered || active) ? "rgba(255, 255, 255, 0.08)" : "transparent",
        color: (isHovered || active) ? TV.tabText : TV.iconBtn,
        ...style,
      }}
    >
      <i className={icon}></i>
    </button>
  );
};
