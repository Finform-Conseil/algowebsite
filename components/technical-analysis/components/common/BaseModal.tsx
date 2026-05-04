import React, { ReactNode, useEffect, useId } from "react";
import clsx from "clsx";
import s from "../../style.module.scss";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: ReactNode;
  className?: string;
  showCloseButton?: boolean;
  // [TENOR 2026 SRE FIX] SCAR-TS2322: Removed redundant '| null' from RefObject generic.
  // React.RefObject<T> is already defined as { readonly current: T | null }.
  // Passing 'HTMLDivElement | null' created a double nullability that broke LegacyRef compatibility.
  overlayRef?: React.RefObject<HTMLDivElement>;
  contentRef?: React.RefObject<HTMLDivElement>;
  hideFooter?: boolean;
  // New Standardized Footer Props
  primaryAction?: () => void;
  primaryLabel?: string;
  primaryVariant?: "warning" | "primary" | "california";
  secondaryAction?: () => void;
  secondaryLabel?: string;
  formId?: string;
}

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
}) => {
  const titleId = useId();

  // ============================================================================
  // [TENOR 2026 SRE] GLOBAL SCROLL LOCK (MODAL STACKING SUPPORT)
  // ============================================================================
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    // Increment global modal counter
    const currentCount = parseInt(document.body.dataset.modalCount || "0", 10);
    document.body.dataset.modalCount = (currentCount + 1).toString();

    // Lock scroll
    document.body.style.overflow = "hidden";

    return () => {
      // Decrement global modal counter
      const newCount = Math.max(0, parseInt(document.body.dataset.modalCount || "1", 10) - 1);
      document.body.dataset.modalCount = newCount.toString();

      // Unlock scroll only if no other modals are open
      if (newCount === 0) {
        document.body.style.overflow = ""; // Restore to CSS stylesheet value
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Standardized Button Renders
  const renderPrimaryButton = () => {
    const btnClass =
      primaryVariant === "warning"
        ? "btn-warning"
        : primaryVariant === "primary"
        ? "btn-primary"
        : s["btn-california"];

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
      ref={overlayRef}
      className={s["gp-modal-overlay"]}
      onClick={onClose}
      // [TENOR 2026] A11y: Overlay should not be focusable, it's just a backdrop
      aria-hidden="true"
    >
      <div
        ref={contentRef}
        className={clsx(s["gp-modal-content"], className)}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        // [TENOR 2026 SRE] A11y: Screen Reader Trap
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Standardized Header */}
        <div className={s["gp-modal-header"]}>
          <h5 id={titleId} className={s["gp-modal-title"]}>
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
              className={s["gp-modal-close-btn"]}
              aria-label="Fermer la modale"
            >
              <i className="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          )}
        </div>

        {/* Standardized Body */}
        <div
          className={s["gp-modal-body"]}
          style={{ minHeight: "300px", maxHeight: "70vh", overflowY: "auto" }}
        >
          {children}
        </div>

        {/* Standardized Footer */}
        {!hideFooter && (
          <div
            className="d-flex justify-content-end gap-2 p-3 border-top"
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