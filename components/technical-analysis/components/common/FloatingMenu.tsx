import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import clsx from "clsx";

interface FloatingMenuProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRect: DOMRect | null;
    children: React.ReactNode;
    width?: string | number;
    className?: string;
    zIndex?: number;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
    isOpen,
    onClose,
    anchorRect,
    children,
    width,
    className,
    zIndex = 2000,
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
        if (isOpen) {
            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === "Escape") onClose();
            };
            const handleClickOutside = (e: MouseEvent) => {
                // If the click is not inside the menu
                const menu = document.getElementById("gp-floating-menu");
                if (menu && !menu.contains(e.target as Node)) {
                    onClose();
                }
            };

            window.addEventListener("keydown", handleEscape);
            window.addEventListener("mousedown", handleClickOutside);
            return () => {
                window.removeEventListener("keydown", handleEscape);
                window.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isOpen, onClose]);

    if (!isOpen || !anchorRect || !mounted) return null;

    return ReactDOM.createPortal(
        <div
            id="gp-floating-menu"
            className={clsx("gp-floating-menu-portal", className)}
            style={{
                position: "fixed",
                top: anchorRect.bottom + 5,
                left: anchorRect.left,
                width: width || anchorRect.width,
                zIndex: zIndex,
            }}
        >
            {children}
        </div>,
        document.body
    );
};
