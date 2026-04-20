import { useState, useRef, useCallback, useMemo, useEffect } from "react";

export interface FloatingMenuPos {
    top: number;
    left: number;
    maxHeight: number;
}

export const useFloatingMenu = (containerRef?: React.RefObject<HTMLElement | null>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
    const anchorRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (containerRef?.current) {
            // eslint-disable-next-line
            setContainerRect(containerRef.current.getBoundingClientRect());
        } else {
            // eslint-disable-next-line
            setContainerRect(null);
        }
    }, [containerRef]);

    const updateAnchor = useCallback(() => {
        if (anchorRef.current) {
            setAnchorRect(anchorRef.current.getBoundingClientRect());
        }
    }, []);

    const toggle = useCallback((e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!isOpen) {
            updateAnchor();
        }
        setIsOpen((prev) => !prev);
    }, [isOpen, updateAnchor]);

    const open = useCallback(() => {
        updateAnchor();
        setIsOpen(true);
    }, [updateAnchor]);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Helper for ToolPortal compatibility
    const pos: FloatingMenuPos = useMemo(() => {
        if (!anchorRect) return { top: 0, left: 0, maxHeight: 350 };

        const screenHeight = typeof window !== "undefined" ? window.innerHeight : 800;
        let bottomLimit = screenHeight;

        if (containerRect) {
            bottomLimit = Math.min(screenHeight, containerRect.bottom);
        }

        const spaceBelow = bottomLimit - anchorRect.top - 20;
        const dynamicHeight = Math.max(100, Math.min(350, spaceBelow));

        return {
            top: anchorRect.top,
            left: anchorRect.right + 15, // Default offset for TA sidebar
            maxHeight: dynamicHeight
        };
    }, [anchorRect, containerRect]);

    return {
        isOpen,
        anchorRect,
        anchorRef,
        pos,
        toggle,
        open,
        close,
        setIsOpen,
        updateAnchor
    };
};
