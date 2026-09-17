import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import clsx from "clsx";
import { useTechnicalAnalysisPortalTarget } from "@/components/technical-analysis/components/common/portal/useTechnicalAnalysisPortalTarget";
import { computeFloatingMenuPosition, type FloatingMenuPosition } from "./floatingMenuPosition";

interface FloatingMenuProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRect: DOMRect | null;
    anchorRef?: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
    width?: string | number;
    className?: string;
    zIndex?: number;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
    isOpen,
    onClose,
    anchorRect,
    anchorRef,
    children,
    width,
    className,
    zIndex = 2000,
}) => {
    const [mounted, setMounted] = useState(false);
    const [position, setPosition] = useState<FloatingMenuPosition | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const menu = menuRef.current;
            const anchor = anchorRef?.current;
            if (menu && !menu.contains(target) && !anchor?.contains(target)) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEscape);
        window.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener("keydown", handleEscape);
            window.removeEventListener("mousedown", handleClickOutside);
        };
    }, [anchorRef, isOpen, onClose]);

    useLayoutEffect(() => {
        if (!isOpen || !mounted) {
            setPosition(null);
            return;
        }

        const updatePosition = () => {
            const menu = menuRef.current;
            const liveAnchorRect = anchorRef?.current?.getBoundingClientRect() ?? anchorRect;
            if (!menu || !liveAnchorRect) return;

            const menuRect = menu.getBoundingClientRect();
            setPosition(computeFloatingMenuPosition({
                anchorRect: liveAnchorRect,
                menuWidth: menuRect.width,
                menuHeight: menuRect.height,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
            }));
        };

        updatePosition();
        const frame = window.requestAnimationFrame(updatePosition);
        const resizeObserver = typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(updatePosition)
            : null;
        if (menuRef.current) resizeObserver?.observe(menuRef.current);
        if (anchorRef?.current) resizeObserver?.observe(anchorRef.current);

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            window.cancelAnimationFrame(frame);
            resizeObserver?.disconnect();
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [anchorRect, anchorRef, isOpen, mounted]);

    const portalTarget = useTechnicalAnalysisPortalTarget();

    if (!isOpen || !anchorRect || !mounted) return null;
    if (!portalTarget) return null;

    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className={clsx("gp-floating-menu-portal", className)}
            data-placement={position?.placement}
            style={{
                position: "fixed",
                top: position?.top ?? anchorRect.bottom + 5,
                left: position?.left ?? anchorRect.left,
                width: width || anchorRect.width,
                maxWidth: "calc(100vw - 16px)",
                maxHeight: position?.maxHeight,
                visibility: position ? "visible" : "hidden",
                zIndex: zIndex,
            }}
        >
            {children}
        </div>,
        portalTarget,
    );
};
