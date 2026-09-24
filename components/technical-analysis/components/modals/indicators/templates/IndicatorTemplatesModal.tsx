import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BaseModal } from "../../../common/primitives/BaseModal";
import { INDICATOR_TEMPLATE_IDS, INDICATOR_TEMPLATE_SPECS, type IndicatorTemplateId } from "../../../../store/templates/indicatorTemplates";
import styles from "./IndicatorTemplatesModal.module.scss";

type IndicatorTemplateType = IndicatorTemplateId;

const TEMPLATE_ICONS: Record<IndicatorTemplateType, string> = {
    day: "bi-activity",
    swing: "bi-graph-up-arrow",
    scalping: "bi-lightning-charge-fill",
    long: "bi-globe2",
};

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
    const [selectedTemplate, setSelectedTemplate] = useState<IndicatorTemplateType>("day");
    const [isApplying, setIsApplying] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSelectedTemplate("day");
            setIsApplying(false);
        }
    }, [isOpen]);

    const templates = useMemo(() => INDICATOR_TEMPLATE_IDS.map((id) => ({ id, ...INDICATOR_TEMPLATE_SPECS[id] })), []);

    const handleApplyTemplate = useCallback(() => {
        if (isApplying) return;
        setIsApplying(true);
        window.setTimeout(() => onApplyTemplate(selectedTemplate), 0);
    }, [isApplying, onApplyTemplate, selectedTemplate]);

    if (!isOpen) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Playbooks de Trading"
            icon={<i className="bi bi-stars" aria-hidden="true" />}
            maxWidth="920px"
            className={styles.modal}
            overlayClassName={styles.overlay}
            primaryAction={handleApplyTemplate}
            primaryLabel={isApplying ? "Application…" : "Appliquer le playbook"}
            primaryVariant="warning"
            secondaryAction={onClose}
            secondaryLabel="Fermer"
        >
            <div className={styles.shell}>
                <div className={styles.intro}>
                    <div>
                        <span className={styles.eyebrow}>PRO TRADING WORKSPACE</span>
                        <h3>Choisissez un environnement de travail, pas une simple liste d&apos;indicateurs.</h3>
                        <p>Chaque playbook active uniquement des modules réellement calculés par le moteur AfriMarket, avec une confluence adaptée à son horizon.</p>
                    </div>
                    <div className={styles.coverage}><span className={styles.coverageDot} aria-hidden="true" />Modules natifs vérifiés</div>
                </div>

                <div className={styles.grid} role="radiogroup" aria-label="Playbooks de trading">
                    {templates.map((tpl) => {
                        const isSelected = selectedTemplate === tpl.id;
                        return (
                            <button key={tpl.id} type="button" role="radio" aria-checked={isSelected} className={`${styles.card} ${isSelected ? styles.selected : ""}`} onClick={() => setSelectedTemplate(tpl.id)}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.identity}>
                                        <span className={styles.iconWrap}><i className={`bi ${TEMPLATE_ICONS[tpl.id]}`} aria-hidden="true" /></span>
                                        <div>
                                            <div className={styles.titleRow}><strong>{tpl.title}</strong><span className={styles.badge}>{tpl.badge}</span></div>
                                            <span className={styles.horizon}>{tpl.horizon}</span>
                                        </div>
                                    </div>
                                    <span className={styles.radioMark} aria-hidden="true">{isSelected ? <i className="bi bi-check-lg" /> : null}</span>
                                </div>
                                <p className={styles.objective}>{tpl.objective}</p>
                                <div className={styles.modules}>
                                    {tpl.modules.map((module) => (
                                        <div className={styles.module} key={module.label}>
                                            <span className={styles.moduleLabel}>{module.label}</span>
                                            <div className={styles.chips}>{module.items.map((item) => <span className={styles.chip} key={item}>{item}</span>)}</div>
                                        </div>
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className={styles.disclaimer}>
                    <i className="bi bi-shield-check" aria-hidden="true" />
                    <span>Les concepts nécessitant une détection dédiée non encore native au moteur de templates (ex. Order Blocks, FVG, BOS/CHoCH automatiques) ne sont pas simulés ni affichés artificiellement.</span>
                </div>
            </div>
        </BaseModal>
    );
};
