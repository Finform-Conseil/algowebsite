import React from "react";
import { BaseModal } from "../common/BaseModal";

interface MoreOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const OPTIONS = [
    { icon: "bi-file-earmark-bar-graph", label: "Fondamentaux", action: "Données Fondamentales" },
    { icon: "bi-building", label: "Profil Société", action: "Profil de l'entreprise" },
    { icon: "bi-newspaper", label: "Actualités", action: "Actualités du symbole" },
    { icon: "bi-calendar-event", label: "Calendrier", action: "Calendrier économique" },
];

export const MoreOptionsModal: React.FC<MoreOptionsModalProps> = ({
    isOpen,
    onClose,
}) => {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Plus d'Options"
            icon={<i className="bi bi-grid-3x2-gap-fill" />}
            primaryLabel="Appliquer"
            secondaryLabel="Fermer"
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                    padding: "0.5rem 0",
                }}
            >
                {OPTIONS.map(({ icon, label, action }) => (
                    <button
                        key={label}
                        className={"gp-option-tile"}
                        onClick={() => {
                            alert(action);
                            onClose();
                        }}
                    >
                        <i className={`bi ${icon}`} style={{ fontSize: "1.6rem", marginBottom: "0.4rem" }} />
                        <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>{label}</span>
                    </button>
                ))}
            </div>
        </BaseModal>
    );
};
