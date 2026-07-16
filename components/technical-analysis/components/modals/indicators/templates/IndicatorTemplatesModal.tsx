import React, { useCallback, useEffect, useState } from "react";
import { BaseModal } from "../../../common/primitives/BaseModal";

type IndicatorTemplateType = "day" | "swing" | "scalping" | "long";

interface IndicatorTemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyTemplate: (type: IndicatorTemplateType) => void;
}

export const IndicatorTemplatesModal: React.FC<IndicatorTemplatesModalProps> = ({
    isOpen,
    onClose,
    onApplyTemplate,
}) => {
    const [optimisticTemplate, setOptimisticTemplate] = useState<IndicatorTemplateType | null>(null);

    useEffect(() => {
        if (!isOpen) setOptimisticTemplate(null);
    }, [isOpen]);

    const handleApplyTemplate = useCallback((type: IndicatorTemplateType) => {
        setOptimisticTemplate(type);
        setTimeout(() => onApplyTemplate(type), 0);
    }, [onApplyTemplate]);

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
                    {templates.map((tpl) => {
                        const isApplying = optimisticTemplate === tpl.id;
                        return (
                        <div className="col-md-6" key={tpl.id}>
                            <div
                                className={`card bg-dark h-100 ${isApplying ? "border-warning" : "border-secondary"}`}
                                style={{
                                    cursor: "pointer",
                                    backgroundColor: isApplying ? "rgba(255,159,4,0.14)" : "rgba(255,255,255,0.05)",
                                    boxShadow: isApplying ? "0 0 0 2px rgba(255,159,4,0.2)" : "none",
                                    transition: "background-color 120ms ease, box-shadow 120ms ease",
                                }}
                                onClick={() => handleApplyTemplate(tpl.id)}
                            >
                                <div className="card-body">
                                    <h6 className="card-title text-white d-flex align-items-center">
                                        {tpl.icon} {tpl.title}
                                    </h6>
                                    <p className="card-text text-secondary small">
                                        {isApplying ? "Application..." : tpl.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
        </BaseModal>
    );
};
