import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTechnicalAnalysisPortalTarget } from "@/components/technical-analysis/components/common/portal/useTechnicalAnalysisPortalTarget";

interface ToolPortalProps {
    isOpen: boolean;
    pos: { top: number; left: number; maxHeight: number };
    searchQuery: string;
    onSearchChange: (val: string) => void;
    onClose: () => void;
    placeholder?: string;
    searchInputId?: string;
    searchInputName?: string;
    searchInputLabel?: string;
    children: React.ReactNode;
}

const visuallyHiddenLabelStyle: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
};

const searchInputLabelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    width: "100%",
};

const searchBoxStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: "#d1d4dc",
    width: "100%",
    minHeight: "18px",
    fontSize: "13px",
    outline: "none",
    fontFamily: "inherit",
};

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
    onClose,
    placeholder = "Rechercher...",
    searchInputId = "technical-analysis-tool-search",
    searchInputName = "technicalAnalysisToolSearch",
    searchInputLabel,
    children,
}) => {
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const searchInputLabelText = searchInputLabel ?? placeholder;

    useEffect(() => {
        if (!isOpen || typeof window === "undefined") return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            onSearchChange("");
            onClose();
        };

        window.addEventListener("keydown", handleEscape);
        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose, onSearchChange]);

    useEffect(() => {
        if (!isOpen || typeof window === "undefined") return;

        const frameId = window.requestAnimationFrame(() => {
            searchInputRef.current?.focus();
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [isOpen]);

    const portalTarget = useTechnicalAnalysisPortalTarget();

    if (!isOpen || typeof document === "undefined") return null;
    if (!portalTarget) return null;

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
                <label style={searchInputLabelStyle}>
                    <span style={visuallyHiddenLabelStyle}>{searchInputLabelText}</span>
                    <input
                        ref={searchInputRef}
                        id={searchInputId}
                        name={searchInputName}
                        type="search"
                        aria-label={searchInputLabelText}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={placeholder}
                        value={searchQuery}
                        style={searchBoxStyle}
                        onChange={(e) => onSearchChange(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") {
                                e.preventDefault();
                            }
                            if (e.key === "Escape") {
                                onSearchChange("");
                                onClose();
                            }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                </label>
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
        portalTarget,
    );
};
