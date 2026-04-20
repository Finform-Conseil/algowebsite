import React from "react";
import { BaseModal } from "../common/BaseModal";

interface MoreOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MoreOptionsModal: React.FC<MoreOptionsModalProps> = ({
    isOpen,
    onClose,
}) => {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Plus d'Options"
            icon={<i className="bi bi-plus-circle-fill" />}
        >
            <div className="row g-3">
                <div className="col-md-6">
                    <button
                        className="btn btn-outline-light w-100 p-3 d-flex flex-column align-items-center gap-2"
                        onClick={() => {
                            alert("Données Fondamentales");
                            onClose();
                        }}
                    >
                        <i className="bi bi-file-earmark-bar-graph fs-3"></i>
                        <span>Fondamentaux</span>
                    </button>
                </div>
                <div className="col-md-6">
                    <button
                        className="btn btn-outline-light w-100 p-3 d-flex flex-column align-items-center gap-2"
                        onClick={() => {
                            alert("Profil de l'entreprise");
                            onClose();
                        }}
                    >
                        <i className="bi bi-building fs-3"></i>
                        <span>Profil Société</span>
                    </button>
                </div>
                <div className="col-md-6">
                    <button
                        className="btn btn-outline-light w-100 p-3 d-flex flex-column align-items-center gap-2"
                        onClick={() => {
                            alert("Actualités du symbole");
                            onClose();
                        }}
                    >
                        <i className="bi bi-newspaper fs-3"></i>
                        <span>Actualités</span>
                    </button>
                </div>
                <div className="col-md-6">
                    <button
                        className="btn btn-outline-light w-100 p-3 d-flex flex-column align-items-center gap-2"
                        onClick={() => {
                            alert("Calendrier économique");
                            onClose();
                        }}
                    >
                        <i className="bi bi-calendar-event fs-3"></i>
                        <span>Calendrier</span>
                    </button>
                </div>
            </div>
        </BaseModal>
    );
};
