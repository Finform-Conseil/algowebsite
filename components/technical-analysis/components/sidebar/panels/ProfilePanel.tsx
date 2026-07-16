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
  <div className="d-flex justify-content-between align-items-center">
    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{label}</span>
    <div className="d-flex align-items-center gap-2">
      <span style={{ fontSize: "12px", color: "#f1f5f9", fontWeight: 700 }}>{value || "N/A"}</span>
      <button
        type="button"
        aria-label={`Copier ${label}`}
        title={status === "idle" ? `Copier ${label}` : getClipboardLabel(status)}
        disabled={disabled}
        onClick={onCopy}
        style={{ background: "transparent", border: 0, padding: 0, color: status === "copied" ? "#22ab94" : status === "error" ? "#f23645" : "#64748b", cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <i className="bi bi-copy" style={{ fontSize: "10px" }} aria-hidden="true" />
      </button>
      {status !== "idle" && (
        <span aria-live="polite" style={{ fontSize: "10px", color: status === "copied" ? "#22ab94" : "#f23645", fontWeight: 700 }}>
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
  <div className="gp-sidebar-section" style={{ borderTop: "1px solid rgba(42, 46, 57, 0.5)", marginTop: "12px", paddingTop: "16px", borderBottom: "none" }}>
    <div className="gp-sidebar-header" style={{ marginBottom: "12px" }}>
      <span className="gp-sidebar-title" style={{ fontSize: "14px", fontWeight: 700, color: "#d1d4dc" }}>Profile</span>
    </div>
    {isLoading ? (
      <ProfileSkeleton />
    ) : (
      <>
        <div className="d-flex flex-column gap-2 mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Website</span>
            {website ? (
              <a href={website} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-1" style={{ fontSize: "12px", color: "#f1f5f9", fontWeight: 600, textDecoration: "none" }}>
                {website.replace(/^https?:\/\/|www\./g, "").split("/")[0]}
                <i className="bi bi-box-arrow-up-right" style={{ fontSize: "10px" }} aria-hidden="true" />
              </a>
            ) : (
              <span style={{ fontSize: "12px", color: "#f1f5f9", fontWeight: 700 }}>N/A</span>
            )}
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Employees (FY)</span>
            <span style={{ fontSize: "12px", color: "#f1f5f9", fontWeight: 700 }}>{employees || "N/A"}</span>
          </div>
          <IdentifierRow disabled={!isin} getClipboardLabel={getClipboardLabel} label="ISIN" onCopy={() => onCopyIdentifier("isin", isin)} status={clipboardStatus.isin} value={isin} />
          <IdentifierRow disabled={!figi} getClipboardLabel={getClipboardLabel} label="FIGI" onCopy={() => onCopyIdentifier("figi", figi)} status={clipboardStatus.figi} value={figi} />
        </div>
        <div style={{ position: "relative" }}>
          <p style={{ fontSize: "12px", lineHeight: "1.5", color: "#94a3b8", margin: 0, display: "-webkit-box", WebkitLineClamp: isDescriptionExpanded ? "none" : "4", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {description || "Description de l'entreprise non disponible."}
          </p>
          <div className="d-flex justify-content-center mt-2">
            <button type="button" aria-label={isDescriptionExpanded ? "Réduire la description du profil" : "Développer la description du profil"} title={isDescriptionExpanded ? "Réduire la description" : "Développer la description"} onClick={onToggleDescription} style={{ background: "rgba(255,255,255,0.05)", border: "none", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#f1f5f9" }}>
              <i className={clsx("bi", isDescriptionExpanded ? "bi-chevron-up" : "bi-chevron-down")} style={{ fontSize: "12px" }} />
            </button>
          </div>
        </div>
        {auditTrail}
      </>
    )}
  </div>
));

ProfilePanel.displayName = "ProfilePanel";
