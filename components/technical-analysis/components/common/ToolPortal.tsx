import React from "react";
import { createPortal } from "react-dom";

interface ToolPortalProps {
    isOpen: boolean;
    pos: { top: number; left: number; maxHeight: number };
    searchQuery: string;
    onSearchChange: (val: string) => void;
    onClose: () => void;
    placeholder?: string;
    children: React.ReactNode;
}

/**
 * Reusable ToolPortal component for Technical Analysis dropdowns.
 * Centralizes styling, positioning, search bar and scrollbar logic.
 * Located in common components for reusability across different tool categories.
 */
export const ToolPortal: React.FC<ToolPortalProps> = ({
    isOpen,
    pos,
    searchQuery,
    onSearchChange,
    onClose: _onClose,
    placeholder = "Rechercher...",
    children,
}) => {
    if (!isOpen || typeof document === "undefined") return null;

    return createPortal(
        <div
            className="gp-cursor-dropdown-portal"
            onMouseDown={(e) => e.nativeEvent.stopImmediatePropagation()}
            style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                maxHeight: `${pos.maxHeight}px`,
                zIndex: 99999,
                display: "flex",
                flexDirection: "column",
                minWidth: "240px",
                width: "max-content",
                background: "#1e222d",
                border: "1px solid #2a2e39",
                borderRadius: "4px",
                padding: "4px 0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                overflow: "hidden",
                pointerEvents: "auto",
            }}
        >
            {/* SEARCH BAR */}
            <div
                style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: "0",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                }}
            >
                <i
                    className="bi bi-search"
                    style={{
                        fontSize: "0.85rem",
                        color: "#787b86",
                        marginRight: "10px",
                    }}
                ></i>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "#d1d4dc",
                        width: "100%",
                        fontSize: "13px",
                        outline: "none",
                        fontFamily: "inherit",
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Escape") {
                            onSearchChange("");
                        }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            </div>

            {/* SCROLLABLE CONTENT */}
            <div
                className={"gp-custom-scrollbar"}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
};
