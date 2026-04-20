import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    SettingsNumberInput,
    SettingsColorInput,
    SettingsCheckbox,
    SettingsToggle,
} from "../common/SettingsField";
import { BaseModal } from "../common/BaseModal";
import { ModalTabs } from "../common/ModalTabs";
import s from "../../style.module.css";
import {
    selectIndicatorPeriods,
    selectChartAppearance,
    selectUiState,
    setIndicatorPeriods,
    setChartAppearance,
    setAnonyme,
    resetChartAppearance,
    setModalOpen,
} from "../../store/technicalAnalysisSlice";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";

/**
 * [TENOR 2026] GlobalSettingsModal - Autonomous Smart Component
 * Refactored to manage its own local tab state and connect directly to Redux,
 * eliminating prop-drilling from the God Component.
 */

interface GlobalSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({
    isOpen,
    onClose,
}) => {
    const dispatch = useDispatch();
    const { addNotification } = useGlobalNotification();

    // --- Local UI State ---
    const [activeTab, setActiveTab] = useState<"indicators" | "appearance">("indicators");

    // --- Global State ---
    const indicatorPeriods = useSelector(selectIndicatorPeriods);
    const chartAppearance = useSelector(selectChartAppearance);
    const isAnonyme = useSelector(selectUiState).isAnonyme;

    // --- Handlers ---
    const handleConfirm = () => {
        addNotification({
            title: "Paramètres mis à jour",
            message: "Configuration enregistrée",
            type: "success",
            iconType: "faCheck",
        });
        dispatch(setModalOpen({ modal: "settings", isOpen: false }));
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Configuration du Graphique"
            icon="bi-sliders"
            primaryLabel="Valider"
            primaryAction={handleConfirm}
            secondaryLabel="Par défaut"
            secondaryAction={() => dispatch(resetChartAppearance())}
            maxWidth="450px"
        >
            <ModalTabs
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as "indicators" | "appearance")}
                tabs={[
                    { id: "indicators", label: "Indicateurs" },
                    { id: "appearance", label: "Apparence" },
                ]}
            />

            <div className="p-1">
                {activeTab === "indicators" && (
                    <div className="d-flex flex-column gap-4">
                        <h6 className={s["gp-section-title"]}>Moyennes Mobiles (SMA)</h6>
                        <div className="row g-3">
                            <div className="col-4">
                                <SettingsNumberInput
                                    label="SMA 1"
                                    value={indicatorPeriods.sma1}
                                    onChange={(val: number) =>
                                        dispatch(setIndicatorPeriods({ ...indicatorPeriods, sma1: val }))
                                    }
                                />
                            </div>
                            <div className="col-4">
                                <SettingsNumberInput
                                    label="SMA 2"
                                    value={indicatorPeriods.sma2}
                                    onChange={(val: number) =>
                                        dispatch(setIndicatorPeriods({ ...indicatorPeriods, sma2: val }))
                                    }
                                />
                            </div>
                            <div className="col-4">
                                <SettingsNumberInput
                                    label="SMA 3"
                                    value={indicatorPeriods.sma3}
                                    onChange={(val: number) =>
                                        dispatch(setIndicatorPeriods({ ...indicatorPeriods, sma3: val }))
                                    }
                                />
                            </div>
                        </div>

                        <hr className={s["gp-separator"]} />

                        <h6 className={s["gp-section-title"]}>Oscillateurs</h6>
                        <SettingsNumberInput
                            label="RSI Period"
                            value={indicatorPeriods.rsiPeriod}
                            onChange={(val: number) =>
                                dispatch(setIndicatorPeriods({ ...indicatorPeriods, rsiPeriod: val }))
                            }
                            width="100px"
                        />
                    </div>
                )}

                {activeTab === "appearance" && (
                    <div className="d-flex flex-column gap-3">
                        <SettingsCheckbox
                            label="Afficher la grille"
                            checked={chartAppearance.showGrid}
                            onChange={(checked: boolean) =>
                                dispatch(setChartAppearance({ ...chartAppearance, showGrid: checked }))
                            }
                        />
                        <SettingsCheckbox
                            label="Afficher Volume"
                            checked={chartAppearance.showVolume}
                            onChange={(checked: boolean) =>
                                dispatch(setChartAppearance({ ...chartAppearance, showVolume: checked }))
                            }
                        />
                        <SettingsToggle
                            label="Mode Anonyme"
                            checked={isAnonyme}
                            onChange={(val) => dispatch(setAnonyme(val))}
                        />

                        <hr className={s["gp-separator"]} />

                        <h6 className={s["gp-section-title"]}>Couleurs des Bougies</h6>
                        <div className="row g-2">
                            <div className="col-6">
                                <SettingsColorInput
                                    label="Hausse"
                                    value={chartAppearance.upColor}
                                    onChange={(val: string) =>
                                        dispatch(setChartAppearance({ ...chartAppearance, upColor: val }))
                                    }
                                />
                            </div>
                            <div className="col-6">
                                <SettingsColorInput
                                    label="Baisse"
                                    value={chartAppearance.downColor}
                                    onChange={(val: string) =>
                                        dispatch(setChartAppearance({ ...chartAppearance, downColor: val }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </BaseModal>
    );
};

// --- EOF ---