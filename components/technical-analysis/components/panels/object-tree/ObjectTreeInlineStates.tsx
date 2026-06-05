import React from "react";
import { TV } from "./objectTreePanelStyles";

type ObjectTreeInlineStatesProps = {
  errorMessage: string | null;
  isCreatingGroup: boolean;
  groupName: string;
  isConfirmingDelete: boolean;
  onGroupNameChange: (value: string) => void;
  onGroupCreateConfirm: () => void;
  onGroupCreateCancel: () => void;
  onDeleteAllConfirm: () => void;
  onDeleteAllCancel: () => void;
};

const errorStateStyle: React.CSSProperties = {
  padding: "6px 14px",
  background: "rgba(242, 54, 69, 0.1)",
  color: "#f23645",
  fontSize: "11px",
  borderBottom: TV.divider,
  display: "flex",
  alignItems: "center",
};

const groupCreateStateStyle: React.CSSProperties = {
  padding: "8px 14px",
  background: "rgba(41, 98, 255, 0.1)",
  borderBottom: TV.divider,
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const groupNameInputStyle: React.CSSProperties = {
  flex: 1,
  background: "#1e222d",
  border: "1px solid #363a45",
  color: "#fff",
  fontSize: "12px",
  padding: "4px 8px",
  borderRadius: "4px",
  outline: "none",
};

const primaryConfirmButtonStyle: React.CSSProperties = {
  background: "#2962ff",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "4px 8px",
  fontSize: "12px",
  cursor: "pointer",
};

const iconCancelButtonStyle: React.CSSProperties = {
  background: "transparent",
  color: TV.tabMuted,
  border: "none",
  cursor: "pointer",
  padding: "0 4px",
};

const deleteConfirmStateStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "rgba(242, 54, 69, 0.1)",
  borderBottom: TV.divider,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const deleteConfirmButtonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
};

const deleteConfirmButtonStyle: React.CSSProperties = {
  background: "#f23645",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "6px 8px",
  fontSize: "11px",
  cursor: "pointer",
  flex: 1,
  fontWeight: 600,
};

const deleteCancelButtonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.1)",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "6px 8px",
  fontSize: "11px",
  cursor: "pointer",
  flex: 1,
};

export const ObjectTreeInlineStates: React.FC<ObjectTreeInlineStatesProps> = ({
  errorMessage,
  isCreatingGroup,
  groupName,
  isConfirmingDelete,
  onGroupNameChange,
  onGroupCreateConfirm,
  onGroupCreateCancel,
  onDeleteAllConfirm,
  onDeleteAllCancel,
}) => {
  const handleGroupNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") onGroupCreateConfirm();
    if (event.key === "Escape") onGroupCreateCancel();
  };

  return (
    <>
      {errorMessage && (
        <div role="alert" aria-live="polite" style={errorStateStyle}>
          <i className="bi bi-exclamation-triangle-fill me-2" />
          {errorMessage}
        </div>
      )}

      {isCreatingGroup && (
        <div style={groupCreateStateStyle}>
          <input
            autoFocus
            value={groupName}
            onChange={(event) => onGroupNameChange(event.target.value)}
            onKeyDown={handleGroupNameKeyDown}
            placeholder="Nom du groupe..."
            style={groupNameInputStyle}
          />
          <button type="button" onClick={onGroupCreateConfirm} style={primaryConfirmButtonStyle}>
            OK
          </button>
          <button type="button" onClick={onGroupCreateCancel} style={iconCancelButtonStyle}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      {isConfirmingDelete && (
        <div style={deleteConfirmStateStyle}>
          <span style={{ color: "#f23645", fontSize: "12px", fontWeight: 600 }}>Supprimer TOUS les dessins ?</span>
          <div style={deleteConfirmButtonRowStyle}>
            <button type="button" onClick={onDeleteAllConfirm} style={deleteConfirmButtonStyle}>
              Confirmer
            </button>
            <button type="button" onClick={onDeleteAllCancel} style={deleteCancelButtonStyle}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  );
};
