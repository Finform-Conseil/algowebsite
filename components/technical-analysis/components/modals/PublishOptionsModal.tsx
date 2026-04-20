import React from "react";
import { BaseModal } from "../common/BaseModal";
import clsx from "clsx";

interface PublishOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isAnonyme: boolean;
    setIsAnonyme: (val: boolean) => void;
    selectedPseudo: string;
    isPseudoDropdownOpen: boolean;
    setIsPseudoDropdownOpen: (val: boolean) => void;
    setSelectedPseudo: (val: string) => void;
    ANONYMOUS_PSEUDOS: string[];
}

export const PublishOptionsModal: React.FC<PublishOptionsModalProps> = ({
    isOpen,
    onClose,
    isAnonyme,
    setIsAnonyme,
    selectedPseudo,
    isPseudoDropdownOpen,
    setIsPseudoDropdownOpen,
    setSelectedPseudo,
    ANONYMOUS_PSEUDOS,
}) => {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Options de Publication"
            icon={<i className="bi bi-gear-fill" />}
            footer={
                <div className="d-flex justify-content-end w-100">
                    <button className="btn btn-primary px-4" onClick={onClose}>
                        Valider
                    </button>
                </div>
            }
        >
            <div className="mb-4">
                <div className="form-check form-switch mb-3">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        id="anonyme-switch"
                        checked={isAnonyme}
                        onChange={(e) => setIsAnonyme(e.target.checked)}
                    />
                    <label className="form-check-label text-white" htmlFor="anonyme-switch">
                        Publier de manière anonyme
                    </label>
                </div>

                {isAnonyme && (
                    <div className="mt-3">
                        <label className="form-label text-secondary small text-uppercase fw-bold">
                            Choisir un pseudonyme
                        </label>
                        <div className="dropdown w-100">
                            <button
                                className="btn btn-outline-secondary w-100 d-flex justify-content-between align-items-center"
                                onClick={() => setIsPseudoDropdownOpen(!isPseudoDropdownOpen)}
                                style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                            >
                                <span>{selectedPseudo}</span>
                                <i className={clsx("bi", isPseudoDropdownOpen ? "bi-chevron-up" : "bi-chevron-down")}></i>
                            </button>
                            {isPseudoDropdownOpen && (
                                <div
                                    className="position-absolute w-100 mt-1 rounded shadow-lg"
                                    style={{
                                        backgroundColor: "var(--gp-bg-secondary, #1a3a52)",
                                        border: "1px solid var(--gp-border-color, #2d455c)",
                                        zIndex: 1000,
                                    }}
                                >
                                    {ANONYMOUS_PSEUDOS.map((pseudo) => (
                                        <div
                                            key={pseudo}
                                            className="p-2 pseudo-option"
                                            style={{ cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                                            onClick={() => {
                                                setSelectedPseudo(pseudo);
                                                setIsPseudoDropdownOpen(false);
                                            }}
                                        >
                                            {selectedPseudo === pseudo && <i className="bi bi-check2 me-2 text-warning"></i>}
                                            {pseudo}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </BaseModal>
    );
};
