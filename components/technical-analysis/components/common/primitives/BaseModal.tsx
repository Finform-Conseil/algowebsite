import React, { ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: ReactNode;
  className?: string;
  overlayClassName?: string;
  showCloseButton?: boolean;
  // [TENOR 2026 SRE FIX] SCAR-TS2322: Removed redundant '| null' from RefObject generic.
  // React.RefObject<T> is already defined as { readonly current: T | null }.
  // Passing 'HTMLDivElement | null' created a double nullability that broke LegacyRef compatibility.
  overlayRef?: React.RefObject<HTMLDivElement>;
  contentRef?: React.RefObject<HTMLDivElement>;
  hideFooter?: boolean;
  draggable?: boolean;
  // New Standardized Footer Props
  primaryAction?: () => void;
  primaryLabel?: string;
  primaryVariant?: "warning" | "primary" | "california";
  secondaryAction?: () => void;
  secondaryLabel?: string;
  formId?: string;
}

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

const DRAG_BOUNDARY_PADDING = 8;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex=\"-1\"])",
].join(",");

let lockedModalCount = 0;
let previousBodyOverflow: string | null = null;

const clampDragOffset = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));

const getFocusableElements = (node: HTMLElement) =>
  Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => (
    element.tabIndex >= 0 && !element.hasAttribute("aria-hidden")
  ));

/**
 * [TENOR 2026] Centralized BaseModal
 * Standardized wrapper for all modals in the Technical Analysis module.
 * Centralizes overlay, header, and basic structure to ensure DRY compliance.
 * PAT-018: BaseModal Standard.
 * [TENOR 2026 SRE FIX] SCAR-SCROLL-LOCK: Implemented global counter for modal stacking.
 * [TENOR 2026 SRE FIX] SCAR-A11Y: Added ARIA attributes for screen readers.
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = "500px",
  footer,
  className,
  overlayClassName,
  showCloseButton = true,
  overlayRef,
  contentRef,
  primaryAction,
  primaryLabel = "Appliquer",
  primaryVariant = "california",
  secondaryAction,
  secondaryLabel = "Fermer",
  formId,
  hideFooter,
  draggable = false,
}) => {
  const titleId = useId();
  const internalOverlayRef = useRef<HTMLDivElement | null>(null);
  const internalContentRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const setOverlayNode = useCallback((node: HTMLDivElement | null) => {
    internalOverlayRef.current = node;

    if (overlayRef) {
      (overlayRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [overlayRef]);

  const setContentNode = useCallback((node: HTMLDivElement | null) => {
    internalContentRef.current = node;

    if (contentRef) {
      (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [contentRef]);

  const getBoundedDragOffset = useCallback((nextX: number, nextY: number) => {
    const overlayNode = internalOverlayRef.current;
    const contentNode = internalContentRef.current;

    if (!overlayNode || !contentNode || typeof window === "undefined") {
      return { x: nextX, y: nextY };
    }

    const overlayRect = overlayNode.getBoundingClientRect();
    const contentRect = contentNode.getBoundingClientRect();
    const maxX = Math.max(0, (overlayRect.width - contentRect.width) / 2 - DRAG_BOUNDARY_PADDING);
    const maxY = Math.max(0, (overlayRect.height - contentRect.height) / 2 - DRAG_BOUNDARY_PADDING);

    return {
      x: clampDragOffset(nextX, maxX),
      y: clampDragOffset(nextY, maxY),
    };
  }, []);

  const handleDragStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable || event.button !== 0) return;

    const target = event.target;
    if (target instanceof HTMLElement && target.closest("button, a, input, textarea, select")) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: dragOffset.x,
      originY: dragOffset.y,
    };
    setIsDragging(true);
  }, [dragOffset.x, dragOffset.y, draggable]);

  const handleDragMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    event.preventDefault();
    setDragOffset(getBoundedDragOffset(
      dragState.originX + event.clientX - dragState.startX,
      dragState.originY + event.clientY - dragState.startY
    ));
  }, [getBoundedDragOffset]);

  const handleDragEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setIsDragging(false);
  }, []);

  const modalContentStyle = {
    maxWidth,
    ...(draggable
      ? {
          "--gp-modal-drag-x": `${dragOffset.x}px`,
          "--gp-modal-drag-y": `${dragOffset.y}px`,
        }
      : {}),
  } as React.CSSProperties;

  useEffect(() => {
    if (isOpen) {
      setDragOffset({ x: 0, y: 0 });
      dragStateRef.current = null;
      setIsDragging(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    lockedModalCount += 1;
    document.body.dataset.modalCount = lockedModalCount.toString();

    if (lockedModalCount === 1) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    return () => {
      lockedModalCount = Math.max(0, lockedModalCount - 1);
      document.body.dataset.modalCount = lockedModalCount.toString();

      if (lockedModalCount === 0) {
        document.body.style.overflow = previousBodyOverflow ?? "";
        previousBodyOverflow = null;
      }
    };
  }, [isOpen]);

  const focusInitialDialogTarget = useCallback(() => {
    const contentNode = internalContentRef.current;
    if (!contentNode) return;

    const focusables = getFocusableElements(contentNode);
    const firstFocusable = focusables[0] ?? contentNode;
    firstFocusable.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const frameId = window.requestAnimationFrame(focusInitialDialogTarget);
    return () => window.cancelAnimationFrame(frameId);
  }, [focusInitialDialogTarget, isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [isOpen, onClose]);

  const handleDialogKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const contentNode = internalContentRef.current;
    if (!contentNode) return;

    const focusables = getFocusableElements(contentNode);
    if (focusables.length === 0) {
      event.preventDefault();
      contentNode.focus({ preventScroll: true });
      return;
    }

    const firstFocusable = focusables[0];
    const lastFocusable = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus({ preventScroll: true });
    }
  }, [onClose]);

  if (!isOpen) return null;

  // Standardized Button Renders
  const renderPrimaryButton = () => {
    const btnClass =
      primaryVariant === "warning"
        ? "btn-warning"
        : primaryVariant === "primary"
        ? "btn-primary"
        : "btn-california";

    return (
      <button
        type={formId ? "submit" : "button"}
        form={formId}
        className={clsx("btn btn-sm px-4", btnClass)}
        onClick={primaryAction || (!formId ? onClose : undefined)}
      >
        {primaryLabel}
      </button>
    );
  };

  const renderSecondaryButton = () => (
    <button
      type="button"
      className="btn btn-secondary btn-sm px-3"
      onClick={secondaryAction || onClose}
    >
      {secondaryLabel}
    </button>
  );

  return (
    <div
      ref={setOverlayNode}
      className={clsx("gp-modal-overlay", overlayClassName)}
      onClick={onClose}
    >
      <div
        ref={setContentNode}
        className={clsx("gp-modal-content", draggable && "gp-modal-draggable", isDragging && "is-dragging", className)}
        style={modalContentStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        {/* Standardized Header */}
        <div
          className={"gp-modal-header"}
          onPointerDown={draggable ? handleDragStart : undefined}
          onPointerMove={draggable ? handleDragMove : undefined}
          onPointerUp={draggable ? handleDragEnd : undefined}
          onPointerCancel={draggable ? handleDragEnd : undefined}
        >
          <h5 id={titleId} className={"gp-modal-title"}>
            {icon && (
              <span className="me-2 d-inline-flex align-items-center justify-content-center" aria-hidden="true">
                {typeof icon === "string" ? <i className={clsx("bi", icon)}></i> : icon}
              </span>
            )}
            {title}
          </h5>
          {showCloseButton && (
            <button
              onClick={onClose}
              className={"gp-modal-close-btn"}
              aria-label="Fermer la modale"
            >
              <i className="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          )}
        </div>

        {/* Standardized Body */}
        <div
          className={"gp-modal-body"}
          style={{ minHeight: "300px", maxHeight: "70vh", overflowY: "auto" }}
        >
          {children}
        </div>

        {/* Standardized Footer */}
        {!hideFooter && (
          <div
            className="gp-modal-footer d-flex justify-content-end gap-2 border-top"
            style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
          >
            {footer ? (
              footer
            ) : (
              <>
                {renderSecondaryButton()}
                {renderPrimaryButton()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
// --- EOF ---
