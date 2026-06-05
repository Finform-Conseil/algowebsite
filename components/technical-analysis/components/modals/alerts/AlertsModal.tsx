import React, { useEffect, useMemo, useState } from "react";
import {
  useDispatch,
  useSelector } from "react-redux";
import { BaseModal } from "../../common/primitives/BaseModal";
import clsx from "clsx";
import {
    addAlert,
  setModalOpen,
  setPrefilledAlert,
} from "../../../store/technicalAnalysisSlice";
import {
  selectChartConfig,
  selectUiState,
} from "../../../store/selectors";
import type { Alert } from "../../../config/state/technicalAnalysisStateTypes";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import { createAlertId, parsePositiveAlertValue } from "./alertValidation";

/**
 * [TENOR 2026] AlertsModal - Autonomous Smart Component
 * Refactored to manage its own local state and dispatch actions directly,
 * eliminating prop-drilling and preventing re-renders in the God Component.
 */

interface AlertsModalProps {
    isOpen: boolean;
    onClose: () => void;
    btnStyle?: string;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
    isOpen,
    onClose,
    btnStyle,
}) => {
    const dispatch = useDispatch();
    const chartConfig = useSelector(selectChartConfig);
    const uiState = useSelector(selectUiState);
    const { addNotification } = useGlobalNotification();

    // --- Local State ---
    const [condition, setCondition] = useState<"GREATER_THAN" | "LESS_THAN">("GREATER_THAN");
    const [value, setValue] = useState("");
    const [emailNotification, setEmailNotification] = useState(true);
    const [pushNotification, setPushNotification] = useState(true);

    const displaySymbol = uiState.isAnonyme ? uiState.selectedPseudo : chartConfig.symbol;
    const parsedAlertValue = useMemo(() => parsePositiveAlertValue(value), [value]);

    useEffect(() => {
        if (!isOpen) return;

        setValue(uiState.prefilledAlertPrice !== undefined ? String(uiState.prefilledAlertPrice) : "");
        setCondition(uiState.prefilledAlertCondition ?? "GREATER_THAN");
        setEmailNotification(true);
        setPushNotification(true);
    }, [isOpen, uiState.prefilledAlertCondition, uiState.prefilledAlertPrice]);

    const handleClose = () => {
        dispatch(setPrefilledAlert(null));
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (parsedAlertValue === null) {
            addNotification({
                title: "Alerte invalide",
                message: "Saisissez une valeur de prix strictement positive.",
                type: "error",
                iconType: "faExclamationTriangle",
            });
            return;
        }

        const generatedId = createAlertId();
        const newAlert: Alert = {
            id: generatedId,
            symbol: chartConfig.symbol,
            condition: condition,
            value: parsedAlertValue,
            active: true,
            notificationChannels: {
                email: emailNotification,
                push: pushNotification,
            },
        };

        dispatch(addAlert(newAlert));
        dispatch(setPrefilledAlert(null));
        dispatch(setModalOpen({ modal: "alerts", isOpen: false }));

        addNotification({
            title: "Alerte créée",
            message: `Alerte sur ${displaySymbol} à ${parsedAlertValue.toLocaleString()}`,
            type: "success",
            iconType: "faBell",
        });
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Créer une Alerte"
            icon={<i className="bi bi-bell-fill me-2"></i>}
            maxWidth="600px"
            footer={
                <div className="d-flex justify-content-end gap-2 w-100">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleClose}>
                        Annuler
                    </button>
                    <button type="submit" form="alerts-form" className={clsx("btn btn-sm", btnStyle)} disabled={parsedAlertValue === null}>
                        <i className="bi bi-bell me-2"></i> Créer l&apos;alerte
                    </button>
                </div>
            }
        >
            <form id="alerts-form" onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label text-white" htmlFor="alert-symbol-input">Symbole</label>
                    <input
                        id="alert-symbol-input"
                        name="alertSymbol"
                        type="text"
                        className="form-control"
                        value={chartConfig.symbol}
                        readOnly
                        style={{
                            backgroundColor: "var(--gp-bg-secondary, #1a3a52)",
                            border: "1px solid var(--gp-border-color, #2d455c)",
                            color: "white",
                        }}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label text-white" htmlFor="alert-condition-select">Condition</label>
                    <select
                        id="alert-condition-select"
                        name="alertCondition"
                        className="form-select"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value as "GREATER_THAN" | "LESS_THAN")}
                        style={{
                            backgroundColor: "var(--gp-bg-secondary, #1a3a52)",
                            border: "1px solid var(--gp-border-color, #2d455c)",
                            color: "white",
                        }}
                    >
                        <option value="GREATER_THAN">Prix supérieur à</option>
                        <option value="LESS_THAN">Prix inférieur à</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label text-white" htmlFor="alert-value-input">Valeur</label>
                    <input
                        id="alert-value-input"
                        name="alertValue"
                        type="number"
                        className="form-control"
                        placeholder="Ex: 60.00"
                        step="0.01"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required
                        style={{
                            backgroundColor: "var(--gp-bg-secondary, #1a3a52)",
                            border: "1px solid var(--gp-border-color, #2d455c)",
                            color: "white",
                        }}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label text-white">Notification</label>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="email-notif-comp"
                            checked={emailNotification}
                            onChange={(e) => setEmailNotification(e.target.checked)}
                        />
                        <label className="form-check-label text-white" htmlFor="email-notif-comp">
                            Email
                        </label>
                    </div>
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="push-notif-comp"
                            checked={pushNotification}
                            onChange={(e) => setPushNotification(e.target.checked)}
                        />
                        <label className="form-check-label text-white" htmlFor="push-notif-comp">
                            Notification Push
                        </label>
                    </div>
                </div>
            </form>
        </BaseModal>
    );
};

// --- EOF ---