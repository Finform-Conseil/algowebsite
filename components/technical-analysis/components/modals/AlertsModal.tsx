import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BaseModal } from "../common/BaseModal";
import clsx from "clsx";
import {
    addAlert,
    setModalOpen,
    selectChartConfig,
    selectUiState
} from "../../store/technicalAnalysisSlice";
import { Alert } from "../../config/TechnicalAnalysisTypes";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";

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
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

    const displaySymbol = uiState.isAnonyme ? uiState.selectedPseudo : chartConfig.symbol;

    // Reset form when modal opens (Adjusting state during render to avoid useEffect cascading renders)
    if (isOpen !== prevIsOpen) {
        setPrevIsOpen(isOpen);
        if (isOpen) {
            setValue("");
            setCondition("GREATER_THAN");
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value) return;

        const generatedId = `${new Date().getTime()}-${Math.random().toString(36).substr(2, 9)}`;
        const newAlert: Alert = {
            id: generatedId,
            symbol: chartConfig.symbol,
            condition: condition,
            value: parseFloat(value),
            active: true,
        };

        // Dispatch to Redux
        dispatch(addAlert(newAlert));
        dispatch(setModalOpen({ modal: "alerts", isOpen: false }));

        // Trigger UI Notification
        addNotification({
            title: "Alerte créée",
            message: `Alerte sur ${displaySymbol} à ${value}`,
            type: "success",
            iconType: "faBell",
        });
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Créer une Alerte"
            icon={<i className="bi bi-bell-fill me-2"></i>}
            maxWidth="600px"
            hideFooter
        >
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label text-white">Symbole</label>
                    <input
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
                    <label className="form-label text-white">Condition</label>
                    <select
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
                    <label className="form-label text-white">Valeur</label>
                    <input
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
                            defaultChecked
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
                            defaultChecked
                        />
                        <label className="form-check-label text-white" htmlFor="push-notif-comp">
                            Notification Push
                        </label>
                    </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Annuler
                    </button>
                    <button type="submit" className={clsx("btn", btnStyle)}>
                        <i className="bi bi-bell me-2"></i> Créer l&apos;alerte
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

// --- EOF ---