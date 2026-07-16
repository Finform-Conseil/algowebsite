import React from "react";
import type { BRVMBond } from "../data/sidebarFetchers";

interface BondsPanelProps {
  auditTrail?: React.ReactNode;
  bonds: BRVMBond[];
  isLoading: boolean;
  onMoreBonds: () => void;
  unavailableState: React.ReactNode;
}

const ACTION_BUTTON_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  color: "#f1f5f9",
  border: "1px solid #363a45",
  borderRadius: "50px",
  padding: "4px 32px",
  fontSize: "11px",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
};

const BondsSkeleton = () => (
  <div className="d-flex flex-column gap-2 px-1">
    {[1, 2, 3].map((item) => (
      <div key={item} className="d-flex justify-content-between align-items-center">
        <div className="is-loading-skeleton" style={{ width: "55%", height: "0.8rem" }} />
        <div className="is-loading-skeleton" style={{ width: "20%", height: "0.8rem" }} />
      </div>
    ))}
  </div>
);

export const BondsPanel = React.memo(({
  auditTrail,
  bonds,
  isLoading,
  onMoreBonds,
  unavailableState,
}: BondsPanelProps) => (
  <div className="gp-sidebar-section" style={{ borderTop: "1px solid rgba(42, 46, 57, 0.5)", marginTop: "8px", paddingTop: "12px", borderBottom: "none" }}>
    <div className="gp-sidebar-header" style={{ marginBottom: "10px" }}>
      <span className="gp-sidebar-title" style={{ fontSize: "14px", fontWeight: 700, color: "#d1d4dc" }}>Highest YTM bonds</span>
    </div>
    {isLoading ? (
      <BondsSkeleton />
    ) : bonds.length > 0 ? (
      <>
        <div className="d-flex flex-column" style={{ gap: "0" }}>
          {bonds.map((bond, index) => (
            <div key={`${bond.name}-${bond.maturityDate}-${bond.ytm}`} className="row g-0" style={{ padding: "7px 4px", borderBottom: index < bonds.length - 1 ? "1px solid rgba(42,46,57,0.4)" : "none" }}>
              <span className="col stat-label" style={{ color: "#94a3b8", fontSize: "11px" }}>
                {bond.maturityDate}
              </span>
              <span className="col-auto stat-value" style={{ fontWeight: 700, color: "#22ab94", fontSize: "12px" }}>
                {bond.ytm.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
        {auditTrail}
        <div className="d-flex justify-content-center mt-0">
          <button className="hover-lift" style={ACTION_BUTTON_STYLE} onClick={onMoreBonds}>
            More bonds
          </button>
        </div>
      </>
    ) : (
      unavailableState
    )}
  </div>
));

BondsPanel.displayName = "BondsPanel";
