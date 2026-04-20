import React from "react";
import { BaseModal } from "../common/BaseModal";

import { SavedAnalysis } from "../../config/TechnicalAnalysisTypes";
export type { SavedAnalysis };

interface LoadAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    savedAnalysesList: SavedAnalysis[];
    onLoad: (analysis: SavedAnalysis) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export const LoadAnalysisModal: React.FC<LoadAnalysisModalProps> = ({
    isOpen,
    onClose,
    savedAnalysesList,
    onLoad,
    onDelete,
}) => {
    if (!isOpen) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Analyses Sauvegardées"
            icon="bi-folder2-open"
            maxWidth="500px"
        >
            <div className="p-1">
                {savedAnalysesList.length === 0 ? (
                    <div className="text-center py-5 text-secondary">
                        <i className="bi bi-inbox display-4 mb-3 d-block"></i>
                        <p>Aucune analyse sauvegardée pour le moment.</p>
                    </div>
                ) : (
                    <div className="list-group list-group-flush">
                        {savedAnalysesList.map((analysis) => (
                            <div
                                key={analysis.id}
                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 mb-2 rounded border-0"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    cursor: "pointer",
                                    color: "white",
                                }}
                                onClick={() => onLoad(analysis)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "rgba(255,255,255,0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "rgba(255,255,255,0.05)";
                                }}
                            >
                                <div>
                                    <div className="fw-bold text-white d-flex align-items-center gap-2">
                                        <span className="badge bg-secondary">
                                            {analysis.config.symbol}
                                        </span>
                                        <span>
                                            {new Date(
                                                analysis.config.savedAt,
                                            ).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <small className="text-secondary">
                                        {analysis.config.timeframe} •{" "}
                                        {analysis.config.chartType} •{" "}
                                        {new Date(analysis.config.savedAt).toLocaleTimeString(
                                            [],
                                            { hour: "2-digit", minute: "2-digit" },
                                        )}
                                    </small>
                                </div>
                                <div>
                                    <button
                                        className="btn btn-sm btn-outline-danger ms-2"
                                        title="Supprimer"
                                        onClick={(e) => onDelete(analysis.id, e)}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </BaseModal>
    );
};
