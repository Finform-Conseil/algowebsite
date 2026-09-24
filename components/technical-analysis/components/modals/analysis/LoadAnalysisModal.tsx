import React, { useState } from "react";
import { BaseModal } from "../../common/primitives/BaseModal";

import type { SavedAnalysis } from "../../../config/persistence/savedAnalysisTypes";
export type { SavedAnalysis };

interface LoadAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    savedAnalysesList: SavedAnalysis[];
    activeSavedAnalysisId: string | null;
    onLoad: (analysis: SavedAnalysis) => void;
    onDelete: (id: string, e?: React.MouseEvent) => Promise<void>;
    onRename: (id: string, name: string) => Promise<void>;
    onDuplicate: (id: string) => Promise<void>;
}

export const LoadAnalysisModal: React.FC<LoadAnalysisModalProps> = ({
    isOpen,
    onClose,
    savedAnalysesList,
    activeSavedAnalysisId,
    onLoad,
    onDelete,
    onRename,
    onDuplicate,
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState("");
    const [query, setQuery] = useState("");

    if (!isOpen) return null;

    const normalizedQuery = query.trim().toLowerCase();
    const filteredAnalyses = normalizedQuery
        ? savedAnalysesList.filter((analysis) => (
            analysis.name.toLowerCase().includes(normalizedQuery)
            || analysis.config.symbol.toLowerCase().includes(normalizedQuery)
            || analysis.config.timeframe.toLowerCase().includes(normalizedQuery)
        ))
        : savedAnalysesList;

    const beginRename = (analysis: SavedAnalysis, event: React.MouseEvent) => {
        event.stopPropagation();
        setEditingId(analysis.id);
        setDraftName(analysis.name);
    };

    const commitRename = async (analysis: SavedAnalysis) => {
        const nextName = draftName.trim();
        if (!nextName || nextName === analysis.name) {
            setEditingId(null);
            return;
        }
        await onRename(analysis.id, nextName);
        setEditingId(null);
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Historique des analyses"
            icon="bi-folder2-open"
            maxWidth="680px"
            hideFooter
        >
            <div className="px-1 pb-1">
                <div className="d-flex align-items-center justify-content-between gap-3 mb-2" style={{ minHeight: 34 }}>
                    <div className="position-relative flex-grow-1">
                        <i className="bi bi-search position-absolute text-secondary" aria-hidden="true" style={{ left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13 }} />
                        <input
                            type="search"
                            className="form-control form-control-sm bg-dark text-white border-secondary"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Rechercher une analyse…"
                            aria-label="Rechercher dans l’historique des analyses"
                            style={{ paddingLeft: 30, minHeight: 32 }}
                        />
                    </div>
                    <span className="badge rounded-pill text-bg-dark border border-secondary flex-shrink-0" aria-label={`${savedAnalysesList.length} analyses sauvegardées`}>
                        {savedAnalysesList.length}
                    </span>
                </div>

                {savedAnalysesList.length === 0 ? (
                    <div className="text-center py-4 text-secondary">
                        <i className="bi bi-inbox fs-2 mb-2 d-block"></i>
                        <p className="mb-0 small">Aucune analyse sauvegardée pour le moment.</p>
                    </div>
                ) : filteredAnalyses.length === 0 ? (
                    <div className="text-center py-4 text-secondary">
                        <i className="bi bi-search fs-3 mb-2 d-block"></i>
                        <p className="mb-0 small">Aucune analyse ne correspond à cette recherche.</p>
                    </div>
                ) : (
                    <div
                        className="list-group list-group-flush pe-1"
                        style={{ maxHeight: "min(52vh, 430px)", overflowY: "auto", overscrollBehavior: "contain", scrollbarGutter: "stable" }}
                    >
                        {filteredAnalyses.map((analysis) => (
                            <div
                                key={analysis.id}
                                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-2 px-3 py-2 mb-1 rounded border-0"
                                style={{
                                    backgroundColor: activeSavedAnalysisId === analysis.id
                                        ? "rgba(41, 98, 255, 0.16)"
                                        : "rgba(255,255,255,0.05)",
                                    cursor: "pointer",
                                    color: "white",
                                }}
                                onClick={() => onLoad(analysis)}
                            >
                                <div className="min-w-0 flex-grow-1">
                                    <div className="fw-semibold text-white d-flex align-items-center gap-2 mb-1">
                                        {activeSavedAnalysisId === analysis.id && (
                                            <i className="bi bi-check-circle-fill text-primary" aria-label="Analyse active" />
                                        )}
                                        {editingId === analysis.id ? (
                                            <input
                                                autoFocus
                                                id={"saved-analysis-name-" + analysis.id}
                                                name="saved-analysis-name"
                                                aria-label="Nom de l'analyse"
                                                className="form-control form-control-sm bg-dark text-white border-secondary"
                                                value={draftName}
                                                onChange={(event) => setDraftName(event.target.value)}
                                                onClick={(event) => event.stopPropagation()}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") void commitRename(analysis);
                                                    if (event.key === "Escape") setEditingId(null);
                                                }}
                                                onBlur={() => { void commitRename(analysis); }}
                                            />
                                        ) : (
                                            <span className="text-truncate">{analysis.name}</span>
                                        )}
                                    </div>
                                    <div className="d-flex flex-wrap align-items-center gap-2">
                                        <span className="badge bg-secondary">{analysis.config.symbol}</span>
                                        <small className="text-secondary">
                                            {analysis.config.timeframe} · {analysis.config.chartType}
                                            {Array.isArray(analysis.config.drawings) && (
                                                <> · {analysis.config.drawings.length} dessin{analysis.config.drawings.length > 1 ? "s" : ""}</>
                                            )}
                                            {" · "}
                                            {new Date(analysis.config.updatedAt ?? analysis.config.savedAt).toLocaleString([], {
                                                day: "2-digit",
                                                month: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                    <button
                                        className="btn btn-sm btn-outline-light d-inline-flex align-items-center justify-content-center p-0"
                                        style={{ width: 28, height: 28 }}
                                        aria-label="Renommer l’analyse"
                                        title="Renommer"
                                        onClick={(event) => beginRename(analysis, event)}
                                    >
                                        <i className="bi bi-pencil" />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-light d-inline-flex align-items-center justify-content-center p-0"
                                        style={{ width: 28, height: 28 }}
                                        aria-label="Dupliquer l’analyse"
                                        title="Dupliquer"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            void onDuplicate(analysis.id);
                                        }}
                                    >
                                        <i className="bi bi-copy" />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center p-0"
                                        style={{ width: 28, height: 28 }}
                                        aria-label="Supprimer l’analyse"
                                        title="Supprimer"
                                        onClick={(event) => { void onDelete(analysis.id, event); }}
                                    >
                                        <i className="bi bi-trash" />
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
