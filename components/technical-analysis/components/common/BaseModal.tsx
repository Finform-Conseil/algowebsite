import React, { ReactNode } from "react";
import clsx from "clsx";
import s from "../../style.module.css";

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
    overlayRef?: React.RefObject<HTMLDivElement | null>;
    contentRef?: React.RefObject<HTMLDivElement | null>;
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
    if (!isOpen) return null;

    // Standardized Button Renders
    const renderPrimaryButton = () => {
        const btnClass = primaryVariant === "warning" ? "btn-warning" :
            primaryVariant === "primary" ? "btn-primary" :
                s["btn-california"];

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
        <div ref={overlayRef} className={s["gp-modal-overlay"]} onClick={onClose}>
            <div
                ref={contentRef}
                className={clsx(s["gp-modal-content"], className)}
                style={{ maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Standardized Header */}
                <div className={s["gp-modal-header"]}>
                    <h5 className={s["gp-modal-title"]}>
                        {icon && (
                            <span className="me-2 d-inline-flex align-items-center justify-content-center">
                                {typeof icon === "string" ? <i className={clsx("bi", icon)}></i> : icon}
                            </span>
                        )}
                        {title}
                    </h5>
                    {showCloseButton && (
                        <button onClick={onClose} className={s["gp-modal-close-btn"]}>
                            <i className="bi bi-x-lg"></i>
                        </button>
                    )}
                </div>

                {/* Standardized Body */}
                <div className={s["gp-modal-body"]} style={{ minHeight: "300px", maxHeight: "70vh", overflowY: "auto" }}>
                    {children}
                </div>

                {/* Standardized Footer */}
                {!hideFooter && (
                    <div className="d-flex justify-content-end gap-2 p-3 border-top" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                        {footer ? footer : (
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
