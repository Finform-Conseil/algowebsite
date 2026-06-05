import React, { useEffect, useMemo, useState } from "react";
import { BaseModal } from "../../common/primitives/BaseModal";
import { ModalTabs } from "../../common/primitives/ModalTabs";
import { SettingsToggle, SettingsTextArea } from "../../common/inputs/SettingsField";
import clsx from "clsx";
import { SecurityBadge } from "../../market/SecurityBadge";
import { FloatingMenu } from "../../common/primitives/FloatingMenu";
import { ConditionCrossingIcon } from "../../common/icons/alerts";

interface AlertDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeAlertTab: "settings" | "message" | "notifications";
    setActiveAlertTab: (tab: "settings" | "message" | "notifications") => void;
    selectedTicker: { ticker: string; logoUrl?: string } | null;
    timeframe: string;
    selectedDrawing: Record<string, unknown>;
    alertMessageTextareaRef: React.RefObject<HTMLTextAreaElement>;
    placeholderButtonRef: React.RefObject<HTMLButtonElement>;
    isPlaceholderDropdownOpen: boolean;
    setIsPlaceholderDropdownOpen: (open: boolean) => void;
    placeholderMenuPos: { top: number; left: number } | null;
    handleInsertPlaceholder: (placeholder: string) => void;
    isConditionDropdownOpen: boolean;
    setIsConditionDropdownOpen: (open: boolean) => void;
    selectedCondition: string;
    setSelectedCondition: (cond: string) => void;
    conditionButtonRef: React.RefObject<HTMLButtonElement>;
    conditionMenuPos: { top: number; left: number } | null;
    onAddAlert: (draft?: AlertDetailsDraft) => void;
}

type AlertNotificationKey = "email" | "push" | "sound" | "webhook";

export interface AlertDetailsDraft {
    message: string;
    notifications: Record<AlertNotificationKey, boolean>;
}

const DEFAULT_ALERT_NOTIFICATIONS: Record<AlertNotificationKey, boolean> = {
    email: true,
    push: true,
    sound: true,
    webhook: false,
};

const createAnchorRectFromPosition = (position: { top: number; left: number } | null) => {
    if (!position || typeof DOMRect === "undefined") return null;
    return new DOMRect(position.left, position.top, 0, 0);
};

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
    placeholderMenuPos,
    handleInsertPlaceholder,
    isConditionDropdownOpen,
    setIsConditionDropdownOpen,
    selectedCondition,
    setSelectedCondition,
    conditionButtonRef,
    conditionMenuPos,
    onAddAlert,
}) => {
    const ticker = selectedTicker?.ticker || "Symbol";

    const [conditionAnchorRect, setConditionAnchorRect] = useState<DOMRect | null>(null);
    const [placeholderAnchorRect, setPlaceholderAnchorRect] = useState<DOMRect | null>(null);
    const [message, setMessage] = useState("");
    const [notifications, setNotifications] = useState(() => ({ ...DEFAULT_ALERT_NOTIFICATIONS }));

    const resolvedConditionAnchorRect = useMemo(
        () => conditionAnchorRect ?? createAnchorRectFromPosition(conditionMenuPos),
        [conditionAnchorRect, conditionMenuPos],
    );
    const resolvedPlaceholderAnchorRect = useMemo(
        () => placeholderAnchorRect ?? createAnchorRectFromPosition(placeholderMenuPos),
        [placeholderAnchorRect, placeholderMenuPos],
    );

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

    useEffect(() => {
        if (!isOpen) return;

        setMessage("");
        setNotifications({ ...DEFAULT_ALERT_NOTIFICATIONS });
    }, [isOpen]);

    const handleCreateAlert = () => {
        onAddAlert({
            message: message.trim(),
            notifications,
        });
    };

    const handlePlaceholderClick = (placeholder: string) => {
        const token = `{{${placeholder}}}`;
        const textarea = alertMessageTextareaRef.current;

        setMessage((currentMessage) => {
            const selectionStart = textarea?.selectionStart ?? currentMessage.length;
            const selectionEnd = textarea?.selectionEnd ?? selectionStart;
            return currentMessage.slice(0, selectionStart) + token + currentMessage.slice(selectionEnd);
        });

        handleInsertPlaceholder(placeholder);
        setIsPlaceholderDropdownOpen(false);

        if (typeof window !== "undefined") {
            window.requestAnimationFrame(() => alertMessageTextareaRef.current?.focus());
        }
    };

    const handleNotificationChange = (key: AlertNotificationKey, checked: boolean) => {
        setNotifications((current) => ({ ...current, [key]: checked }));
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Créer une alerte sur ${ticker}, ${timeframe.toUpperCase()}`}
            icon={<i className="bi bi-bell-fill" />}
            primaryLabel="Créer"
            primaryVariant="warning"
            primaryAction={handleCreateAlert}
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
                                    type="button"
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
                                    anchorRect={resolvedConditionAnchorRect}
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
                                            className={clsx("gp-condition-item", selectedCondition === cond && "active")}
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
                                    type="button"
                                    onClick={() => setIsPlaceholderDropdownOpen(!isPlaceholderDropdownOpen)}
                                >
                                    + Ajouter une variable
                                </button>

                                <FloatingMenu
                                    isOpen={isPlaceholderDropdownOpen}
                                    onClose={() => setIsPlaceholderDropdownOpen(false)}
                                    anchorRect={resolvedPlaceholderAnchorRect}
                                    width={160}
                                >
                                    {["ticker", "price", "time", "timeframe", "exchange"].map((p) => (
                                        <div
                                            key={p}
                                            className={"gp-placeholder-item"}
                                            onClick={() => handlePlaceholderClick(p)}
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
                            value={message}
                            onChange={setMessage}
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
                                checked={notifications[n.key as AlertNotificationKey]}
                                onChange={(checked) => handleNotificationChange(n.key as AlertNotificationKey, checked)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </BaseModal>
    );
};
