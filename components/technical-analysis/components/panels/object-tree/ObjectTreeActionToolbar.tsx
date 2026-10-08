import React from "react";
import type { ObjectTreeItem } from "./objectTreeItemTypes";
import { IconButton } from "./objectTreeRows";
import { menuItemStyle, TV } from "./objectTreePanelStyles";

export type ObjectTreePanelMenu = "zorder" | "layouts";
export type VisualOrderDirection = "front" | "back" | "forward" | "backward";

type ObjectTreeActionToolbarProps = {
  activeMenu: ObjectTreePanelMenu | null;
  selectedObject: ObjectTreeItem | null;
  canUseDrawingActions: boolean;
  onGroupCreate: () => void;
  onCloneSelected: () => void;
  onToggleZOrderMenu: () => void;
  onToggleGlobalMenu: () => void;
  onVisualOrder: (direction: VisualOrderDirection) => void;
  onSelectedObjectVisibilityToggle: () => void;
  onSelectedObjectRemove: () => void;
  onHideAllDrawings: () => void;
  onShowAllDrawings: () => void;
  onLockAllDrawings: () => void;
  onUnlockAllDrawings: () => void;
  onDeleteAllDrawings: () => void;
};

type MenuButtonProps = {
  icon: string;
  children: React.ReactNode;
  onClick: () => void;
  style?: React.CSSProperties;
};

const zOrderMenuStyle: React.CSSProperties = {
  position: "absolute",
  top: "40px",
  left: "60px",
  background: "var(--gp-bg-popover)",
  border: TV.border,
  borderRadius: "var(--gp-radius-sm)",
  zIndex: 2000,
  padding: "var(--gp-space-2xs)",
  boxShadow: "var(--shadow-elevated)",
  minWidth: 170,
};

const globalActionMenuStyle: React.CSSProperties = {
  position: "absolute",
  top: "40px",
  right: "14px",
  background: "var(--gp-bg-popover)",
  border: TV.border,
  borderRadius: "var(--gp-radius-sm)",
  zIndex: 2000,
  padding: "var(--gp-space-2xs)",
  boxShadow: "var(--shadow-elevated)",
  minWidth: 160,
};

const menuDividerStyle: React.CSSProperties = {
  height: 1,
  background: "var(--gp-border-color-light)",
  margin: "var(--gp-space-2xs) 0",
};

const MenuButton: React.FC<MenuButtonProps> = ({ icon, children, onClick, style }) => (
  <button type="button" onClick={onClick} style={{ ...menuItemStyle, ...style }}>
    <i className={icon} />
    {children}
  </button>
);

export const ObjectTreeActionToolbar: React.FC<ObjectTreeActionToolbarProps> = ({
  activeMenu,
  selectedObject,
  canUseDrawingActions,
  onGroupCreate,
  onCloneSelected,
  onToggleZOrderMenu,
  onToggleGlobalMenu,
  onVisualOrder,
  onSelectedObjectVisibilityToggle,
  onSelectedObjectRemove,
  onHideAllDrawings,
  onShowAllDrawings,
  onLockAllDrawings,
  onUnlockAllDrawings,
  onDeleteAllDrawings,
}) => (
  <div
    style={{
      display: "flex",
      padding: "4px 14px 10px 14px",
      borderBottom: TV.divider,
      gap: "10px",
      alignItems: "center",
      flexShrink: 0,
      position: "relative",
    }}
  >
    <IconButton icon="bi bi-folder-plus" title="Create a group of drawings" onClick={onGroupCreate} disabled={!canUseDrawingActions} />
    <IconButton icon="bi bi-copy" title="Clone, Copy" onClick={onCloneSelected} disabled={!canUseDrawingActions} />
    <IconButton icon="bi bi-arrow-down-up" title="Move to" onClick={onToggleZOrderMenu} active={activeMenu === "zorder"} disabled={!canUseDrawingActions} />
    <div style={{ flex: 1 }} />
    <IconButton icon="bi bi-diagram-3" title="Manage layout drawings" onClick={onToggleGlobalMenu} active={activeMenu === "layouts"} />

    {activeMenu === "zorder" && (
      <div style={zOrderMenuStyle}>
        <MenuButton icon="bi bi-layer-forward" onClick={() => onVisualOrder("forward")}>Bring Forward</MenuButton>
        <MenuButton icon="bi bi-layer-backward" onClick={() => onVisualOrder("backward")}>Send Backward</MenuButton>
        <div style={menuDividerStyle} />
        <MenuButton icon="bi bi-front" onClick={() => onVisualOrder("front")}>Bring to Front</MenuButton>
        <MenuButton icon="bi bi-back" onClick={() => onVisualOrder("back")}>Send to Back</MenuButton>
      </div>
    )}

    {activeMenu === "layouts" && (
      <div style={globalActionMenuStyle}>
        {selectedObject && (
          <>
            {(selectedObject.capabilities?.visibility ?? true) && (
              <MenuButton icon={`bi ${selectedObject.visible ? "bi-eye-slash" : "bi-eye"}`} onClick={onSelectedObjectVisibilityToggle}>
                {selectedObject.visible ? "Hide selected object" : "Show selected object"}
              </MenuButton>
            )}
            {(selectedObject.capabilities?.remove ?? selectedObject.removable) && (
              <MenuButton
                icon="bi bi-trash"
                onClick={onSelectedObjectRemove}
                style={{ color: "#f23645" }}
              >
                Remove selected object
              </MenuButton>
            )}
            {((selectedObject.capabilities?.visibility ?? true) || (selectedObject.capabilities?.remove ?? selectedObject.removable)) && (
              <div style={menuDividerStyle} />
            )}
          </>
        )}
        <MenuButton icon="bi bi-eye-slash" onClick={onHideAllDrawings}>Hide all drawings</MenuButton>
        <MenuButton icon="bi bi-eye" onClick={onShowAllDrawings}>Show all drawings</MenuButton>
        <div style={menuDividerStyle} />
        <MenuButton icon="bi bi-lock-fill" onClick={onLockAllDrawings}>Lock all drawings</MenuButton>
        <MenuButton icon="bi bi-unlock" onClick={onUnlockAllDrawings}>Unlock all drawings</MenuButton>
        <div style={menuDividerStyle} />
        <MenuButton icon="bi bi-trash" onClick={onDeleteAllDrawings} style={{ color: "#f23645" }}>Delete all drawings</MenuButton>
      </div>
    )}
  </div>
);
