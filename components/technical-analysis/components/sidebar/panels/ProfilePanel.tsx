import React from "react";
import clsx from "clsx";
import type { SidebarClipboardStatus } from "../actions/sidebarClipboard";

interface ProfilePanelProps {
  auditTrail?: React.ReactNode;
  clipboardStatus: Record<"figi" | "isin", SidebarClipboardStatus>;
  description: string | null | undefined;
  employees: string | null | undefined;
  figi: string | null | undefined;
  getClipboardLabel: (status: SidebarClipboardStatus) => string;
  isDescriptionExpanded: boolean;
  isLoading: boolean;
  isin: string | null | undefined;
  onCopyIdentifier: (key: "figi" | "isin", value: string | null | undefined) => void;
  onToggleDescription: () => void;
  website: string | null | undefined;
}

const ProfileSkeleton = () => (
  <div className="d-flex flex-column gap-3 p-1">
    <div className="d-flex flex-column gap-2">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="d-flex justify-content-between align-items-center">
          <div className="is-loading-skeleton" style={{ width: "25%", height: "0.8rem" }} />
          <div className="is-loading-skeleton" style={{ width: "40%", height: "0.8rem" }} />
        </div>
      ))}
    </div>
    <div style={{ position: "relative", marginTop: "8px" }}>
      <div className="is-loading-skeleton" style={{ width: "100%", height: "0.8rem", marginBottom: "6px" }} />
      <div className="is-loading-skeleton" style={{ width: "90%", height: "0.8rem", marginBottom: "6px" }} />
      <div className="is-loading-skeleton" style={{ width: "95%", height: "0.8rem", marginBottom: "6px" }} />
      <div className="is-loading-skeleton" style={{ width: "70%", height: "0.8rem" }} />
    </div>
  </div>
);

const IdentifierRow = ({ disabled, label, onCopy, status, value, getClipboardLabel }: {
  disabled: boolean;
  getClipboardLabel: (status: SidebarClipboardStatus) => string;
  label: "FIGI" | "ISIN";
  onCopy: () => void;
  status: SidebarClipboardStatus;
  value: string | null | undefined;
}) => (
  <div className="gp-profile-row">
    <span className="gp-profile-label">{label}</span>
    <div className="gp-profile-value-group">
      <span className="gp-profile-value">{value || "N/A"}</span>
      <button
        type="button"
        aria-label={`Copier ${label}`}
        title={status === "idle" ? `Copier ${label}` : getClipboardLabel(status)}
        disabled={disabled}
        onClick={onCopy}
        className={clsx("gp-profile-copy-action", status === "copied" && "is-success", status === "error" && "is-error")}
      >
        <i className="bi bi-copy" aria-hidden="true" />
      </button>
      {status !== "idle" && (
        <span aria-live="polite" className={clsx("gp-profile-copy-status", status === "copied" ? "is-success" : "is-error")}>
          {getClipboardLabel(status)}
        </span>
      )}
    </div>
  </div>
);

export const ProfilePanel = React.memo(({
  auditTrail,
  clipboardStatus,
  description,
  employees,
  figi,
  getClipboardLabel,
  isDescriptionExpanded,
  isLoading,
  isin,
  onCopyIdentifier,
  onToggleDescription,
  website,
}: ProfilePanelProps) => (
  <div className="gp-sidebar-section gp-profile-section">
    <div className="gp-sidebar-header gp-profile-header">
      <span className="gp-sidebar-title gp-profile-title">Profile</span>
    </div>
    {isLoading ? (
      <ProfileSkeleton />
    ) : (
      <>
        <div className="d-flex flex-column gap-2 mb-3">
          <div className="gp-profile-row">
            <span className="gp-profile-label">Website</span>
            {website ? (
              <a href={website} target="_blank" rel="noopener noreferrer" className="gp-profile-link">
                {website.replace(/^https?:\/\/|www\./g, "").split("/")[0]}
                <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
              </a>
            ) : (
              <span className="gp-profile-value">N/A</span>
            )}
          </div>
          <div className="gp-profile-row">
            <span className="gp-profile-label">Employees (FY)</span>
            <span className="gp-profile-value">{employees || "N/A"}</span>
          </div>
          <IdentifierRow disabled={!isin} getClipboardLabel={getClipboardLabel} label="ISIN" onCopy={() => onCopyIdentifier("isin", isin)} status={clipboardStatus.isin} value={isin} />
          <IdentifierRow disabled={!figi} getClipboardLabel={getClipboardLabel} label="FIGI" onCopy={() => onCopyIdentifier("figi", figi)} status={clipboardStatus.figi} value={figi} />
        </div>
        <div style={{ position: "relative" }}>
          <p className={clsx("gp-profile-description", !isDescriptionExpanded && "is-clamped")}>
            {description || "Description de l'entreprise non disponible."}
          </p>
          <div className="d-flex justify-content-center mt-2">
            <button type="button" aria-label={isDescriptionExpanded ? "Réduire la description du profil" : "Développer la description du profil"} title={isDescriptionExpanded ? "Réduire la description" : "Développer la description"} onClick={onToggleDescription} className="gp-profile-toggle">
              <i className={clsx("bi", isDescriptionExpanded ? "bi-chevron-up" : "bi-chevron-down")} aria-hidden="true" />
            </button>
          </div>
        </div>
        {auditTrail}
      </>
    )}
  </div>
));

ProfilePanel.displayName = "ProfilePanel";
