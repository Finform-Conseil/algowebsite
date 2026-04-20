import React, { useEffect, useState } from "react";
import { BaseModal } from "../common/BaseModal";
import { ModalTabs } from "../common/ModalTabs";
import { SettingsToggle, SettingsTextArea } from "../common/SettingsField";
import clsx from "clsx";
import s from "../../style.module.css";
import { SecurityBadge } from "../common/SecurityBadge";
import { FloatingMenu } from "../common/FloatingMenu";
import { ConditionCrossingIcon } from "../common/ChartIcons";

interface AlertDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeAlertTab: "settings" | "message" | "notifications";
    setActiveAlertTab: (tab: "settings" | "message" | "notifications") => void;
    selectedTicker: { ticker: string; logoUrl?: string } | null;
    timeframe: string;
    selectedDrawing: Record<string, unknown>;
    alertMessageTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
    placeholderButtonRef: React.RefObject<HTMLButtonElement | null>;
    isPlaceholderDropdownOpen: boolean;
    setIsPlaceholderDropdownOpen: (open: boolean) => void;
    placeholderMenuPos: { top: number; left: number } | null;
    handleInsertPlaceholder: (placeholder: string) => void;
    isConditionDropdownOpen: boolean;
    setIsConditionDropdownOpen: (open: boolean) => void;
    selectedCondition: string;
    setSelectedCondition: (cond: string) => void;
    conditionButtonRef: React.RefObject<HTMLButtonElement | null>;
    conditionMenuPos: { top: number; left: number } | null;
    onAddAlert: () => void;
}

export const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({
    isOpen,
    onClose,
    activeAlertTab,
    setActiveAlertTab,
    selectedTicker,
    timeframe,
    selectedDrawing,
    alertMessageTextareaRef,
    placeholderButtonRef,
    isPlaceholderDropdownOpen,
    setIsPlaceholderDropdownOpen,
    placeholderMenuPos: _placeholderMenuPos,
    handleInsertPlaceholder,
    isConditionDropdownOpen,
    setIsConditionDropdownOpen,
    selectedCondition,
    setSelectedCondition,
    conditionButtonRef,
    conditionMenuPos: _conditionMenuPos,
    onAddAlert,
}) => {
    const ticker = selectedTicker?.ticker || "Symbol";

    const [conditionAnchorRect, setConditionAnchorRect] = useState<DOMRect | null>(null);
    const [placeholderAnchorRect, setPlaceholderAnchorRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (isConditionDropdownOpen && conditionButtonRef.current) {
            // eslint-disable-next-line
            setConditionAnchorRect(conditionButtonRef.current.getBoundingClientRect());
        }
    }, [isConditionDropdownOpen, conditionButtonRef]);

    useEffect(() => {
        if (isPlaceholderDropdownOpen && placeholderButtonRef.current) {
            // eslint-disable-next-line
            setPlaceholderAnchorRect(placeholderButtonRef.current.getBoundingClientRect());
        }
    }, [isPlaceholderDropdownOpen, placeholderButtonRef]);

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Créer une alerte sur ${ticker}, ${timeframe.toUpperCase()}`}
            icon={<i className="bi bi-bell-fill" />}
            primaryLabel="Créer"
            primaryVariant="warning"
            primaryAction={onAddAlert}
            secondaryLabel="Annuler"
        >
            <ModalTabs
                activeTab={activeAlertTab}
                onTabChange={(id) => setActiveAlertTab(id as "settings" | "message" | "notifications")}
                tabs={[
                    { id: "settings", label: "Paramètres" },
                    { id: "message", label: "Message" },
                    { id: "notifications", label: "Notifications", badge: 2 },
                ]}
            />

            <div className="p-1">
                {activeAlertTab === "settings" && (
                    <div className="d-flex flex-column gap-4">
                        <div className="d-flex flex-column gap-2">
                            <label className="text-secondary small fw-bold">Symbole</label>
                            <SecurityBadge
                                ticker={ticker}
                                className="p-2 rounded"
                                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                            />
                        </div>

                        <div className="d-flex flex-column gap-2">
                            <label className="text-secondary small fw-bold">Condition</label>
                            <div className="position-relative">
                                <button
                                    ref={conditionButtonRef}
                                    className="btn btn-dark w-100 d-flex justify-content-between align-items-center border-secondary"
                                    onClick={() => setIsConditionDropdownOpen(!isConditionDropdownOpen)}
                                >
                                    <span className="d-flex align-items-center gap-2">
                                        <ConditionCrossingIcon />
                                        {selectedCondition}
                                    </span>
                                    <i className={clsx("bi", isConditionDropdownOpen ? "bi-chevron-up" : "bi-chevron-down")}></i>
                                </button>

                                <FloatingMenu
                                    isOpen={isConditionDropdownOpen}
                                    onClose={() => setIsConditionDropdownOpen(false)}
                                    anchorRect={conditionAnchorRect}
                                >
                                    {[
                                        "Croisement",
                                        "Croisement à la hausse",
                                        "Croisement à la baisse",
                                        "Supérieur à",
                                        "Inférieur à",
                                        "Pénétrant",
                                        "Quittant",
                                    ].map((cond) => (
                                        <div
                                            key={cond}
                                            className={clsx(s["gp-condition-item"], selectedCondition === cond && s["active"])}
                                            onClick={() => {
                                                setSelectedCondition(cond);
                                                setIsConditionDropdownOpen(false);
                                            }}
                                        >
                                            {cond}
                                        </div>
                                    ))}
                                </FloatingMenu>
                            </div>
                        </div>

                        {selectedDrawing && (
                            <div className="d-flex flex-column gap-2">
                                <label className="text-secondary small fw-bold">Target</label>
                                <div className="p-2 border border-secondary rounded bg-dark text-white-50 small">
                                    Alerte basée sur : {(selectedDrawing.type as string)} #{(selectedDrawing.id as string).slice(0, 4)}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeAlertTab === "message" && (
                    <div className="d-flex flex-column gap-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <label className="text-secondary small fw-bold">Alert Message</label>
                            <div className="position-relative">
                                <button
                                    ref={placeholderButtonRef}
                                    className="btn btn-xs btn-outline-warning"
                                    onClick={() => setIsPlaceholderDropdownOpen(!isPlaceholderDropdownOpen)}
                                >
                                    + Ajouter une variable
                                </button>

                                <FloatingMenu
                                    isOpen={isPlaceholderDropdownOpen}
                                    onClose={() => setIsPlaceholderDropdownOpen(false)}
                                    anchorRect={placeholderAnchorRect}
                                    width={160}
                                >
                                    {["ticker", "price", "time", "timeframe", "exchange"].map((p) => (
                                        <div
                                            key={p}
                                            className={s["gp-placeholder-item"]}
                                            onClick={() => handleInsertPlaceholder(p)}
                                        >
                                            {`{{${p}}}`}
                                        </div>
                                    ))}
                                </FloatingMenu>
                            </div>
                        </div>
                        <SettingsTextArea
                            ref={alertMessageTextareaRef}
                            label=""
                            value=""
                            onChange={() => { }}
                            placeholder="Entrez le message de l'alerte..."
                            rows={5}
                        />
                    </div>
                )}

                {activeAlertTab === "notifications" && (
                    <div className="d-flex flex-column gap-2">
                        {[
                            { label: "Email Notification", key: "email" },
                            { label: "Push Notification", key: "push" },
                            { label: "Play Sound", key: "sound" },
                            { label: "Send Webhook", key: "webhook" },
                        ].map((n) => (
                            <SettingsToggle
                                key={n.key}
                                label={n.label}
                                checked={true}
                                onChange={() => { }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </BaseModal>
    );
};
