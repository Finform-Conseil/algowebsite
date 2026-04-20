import React from "react";
import { BaseModal } from "../common/BaseModal";

interface IndicatorTemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyTemplate: (type: "day" | "swing" | "scalping" | "long") => void;
}

export const IndicatorTemplatesModal: React.FC<IndicatorTemplatesModalProps> = ({
    isOpen,
    onClose,
    onApplyTemplate,
}) => {
    if (!isOpen) return null;

    const templates = [
        {
            id: "day",
            title: "Day Trading",
            icon: <i className="bi bi-lightning-charge-fill text-warning me-2"></i>,
            description: "SMA5, SMA10, RSI, MACD",
        },
        {
            id: "swing",
            title: "Swing Trading",
            icon: <i className="bi bi-graph-up text-success me-2"></i>,
            description: "SMA20, SMA50, Bollinger Bands, Stochastic",
        },
        {
            id: "scalping",
            title: "Scalping",
            icon: <i className="bi bi-speedometer text-danger me-2"></i>,
            description: "EMA5, EMA10, ATR, Volume",
        },
        {
            id: "long",
            title: "Investissement Long Terme",
            icon: <i className="bi bi-piggy-bank text-info me-2"></i>,
            description: "SMA50, SMA200, Volume",
        },
    ] as const;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Modèles d'Indicateurs"
            icon="bi-window-stack"
            maxWidth="700px"
            secondaryLabel="Fermer"
        >
            <div className="p-1">
                <p className="text-secondary mb-4">
                    Chargez des configurations prédéfinies d&apos;indicateurs pour
                    différents styles de trading.
                </p>
                <div className="row g-3">
                    {templates.map((tpl) => (
                        <div className="col-md-6" key={tpl.id}>
                            <div
                                className="card bg-dark border-secondary h-100"
                                style={{ cursor: "pointer", backgroundColor: "rgba(255,255,255,0.05)" }}
                                onClick={() => onApplyTemplate(tpl.id)}
                            >
                                <div className="card-body">
                                    <h6 className="card-title text-white d-flex align-items-center">
                                        {tpl.icon} {tpl.title}
                                    </h6>
                                    <p className="card-text text-secondary small">
                                        {tpl.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </BaseModal>
    );
};
