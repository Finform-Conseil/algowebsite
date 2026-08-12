import React, { useState } from "react";
import {
  useDispatch,
  useSelector } from "react-redux";
import {
    SettingsNumberInput,
  SettingsColorInput,
  SettingsCheckbox,
  SettingsToggle,
  SettingsSelectInput,
  } from "../../common/inputs/SettingsField";
import { BaseModal } from "../../common/primitives/BaseModal";
import { ModalTabs } from "../../common/primitives/ModalTabs";
import {
  setIndicatorPeriods,
  setChartAppearance,
  setAnonyme,
  resetChartAppearance,
  setModalOpen,
} from "../../../store/technicalAnalysisSlice";
import {
  selectIndicatorPeriods,
  selectChartAppearance,
  selectUiState,
} from "../../../store/selectors";
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
    const [activeTab, setActiveTab] = useState<"indicators" | "canvas" | "scales" | "status">("indicators");

    // --- Global State ---
    const indicatorPeriods = useSelector(selectIndicatorPeriods);
    const chartAppearance = useSelector(selectChartAppearance);
    const isAnonyme = useSelector(selectUiState).isAnonyme;
    const volumeColorMode = chartAppearance.volumeColorMode ?? "candle-body";

    // --- Handlers ---
    const handleConfirm = () => {
        addNotification({
            title: "Paramètres appliqués",
            message: "Les changements sont appliqués en direct.",
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
            primaryLabel="Fermer"
            primaryAction={handleConfirm}
            secondaryLabel="Par défaut"
            secondaryAction={() => dispatch(resetChartAppearance())}
            maxWidth="450px"
        >
            <ModalTabs
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as "indicators" | "canvas" | "scales" | "status")}
                tabs={[
                    { id: "indicators", label: "Indicateurs" },
                    { id: "canvas", label: "Canvas" },
                    { id: "scales", label: "Échelles et lignes" },
                    { id: "status", label: "Ligne d’état" },
                ]}
            />

            <div className="p-1">
                {activeTab === "indicators" && (
                    <div className="d-flex flex-column gap-4">
                        <h6 className={"gp-section-title"}>Moyennes Mobiles (SMA)</h6>
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

                        <hr className={"gp-separator"} />

                        <h6 className={"gp-section-title"}>Oscillateurs</h6>
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

                {activeTab === "canvas" && (
                    <div className="d-flex flex-column gap-3">
                        <h6 className={"gp-section-title"}>Styles du graphique</h6>
                        <SettingsColorInput
                            label="Arrière-plan"
                            value={chartAppearance.backgroundColor}
                            onChange={(val: string) =>
                                dispatch(setChartAppearance({ ...chartAppearance, backgroundColor: val }))
                            }
                        />
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
                        <SettingsToggle
                            label="Mode Anonyme"
                            checked={isAnonyme}
                            onChange={(val) => dispatch(setAnonyme(val))}
                        />
                    </div>
                )}

                {activeTab === "status" && (
                    <div className={"d-flex flex-column gap-3"}>
                        <h6 className={"gp-section-title"}>Ligne d’état</h6>
                        <SettingsCheckbox label="Dernier prix" checked={chartAppearance.statusLine.showLast} onChange={(checked) => dispatch(setChartAppearance({ statusLine: { ...chartAppearance.statusLine, showLast: checked } }))} />
                        <SettingsCheckbox label="Variation" checked={chartAppearance.statusLine.showChange} onChange={(checked) => dispatch(setChartAppearance({ statusLine: { ...chartAppearance.statusLine, showChange: checked } }))} />
                        <SettingsCheckbox label="Variation %" checked={chartAppearance.statusLine.showChangePercent} onChange={(checked) => dispatch(setChartAppearance({ statusLine: { ...chartAppearance.statusLine, showChangePercent: checked } }))} />
                        <SettingsCheckbox label="Nom du titre" checked={chartAppearance.statusLine.showName} onChange={(checked) => dispatch(setChartAppearance({ statusLine: { ...chartAppearance.statusLine, showName: checked } }))} />
                        <SettingsCheckbox label="Symbole" checked={chartAppearance.statusLine.showSymbol} onChange={(checked) => dispatch(setChartAppearance({ statusLine: { ...chartAppearance.statusLine, showSymbol: checked } }))} />
                        <SettingsCheckbox label="Logo" checked={chartAppearance.statusLine.showLogo} onChange={(checked) => dispatch(setChartAppearance({ statusLine: { ...chartAppearance.statusLine, showLogo: checked } }))} />
                        <SettingsCheckbox label="Volume" checked={chartAppearance.statusLine.showVolume} onChange={(checked) => dispatch(setChartAppearance({ statusLine: { ...chartAppearance.statusLine, showVolume: checked } }))} />
                    </div>
                )}

                {activeTab === "scales" && (
                    <div className="d-flex flex-column gap-3">
                        <h6 className={"gp-section-title"}>Échelles et lignes</h6>
                        <SettingsCheckbox
                            label="Lignes de grille"
                            checked={chartAppearance.showGrid}
                            onChange={(checked: boolean) =>
                                dispatch(setChartAppearance({ ...chartAppearance, showGrid: checked }))
                            }
                        />
                        <SettingsCheckbox
                            label="Volume"
                            checked={chartAppearance.showVolume}
                            onChange={(checked: boolean) =>
                                dispatch(setChartAppearance({ ...chartAppearance, showVolume: checked }))
                            }
                        />
                        <SettingsSelectInput
                            label="Couleur volume"
                            value={volumeColorMode}
                            width="178px"
                            options={[
                                { value: "candle-body", label: "Corps bougie" },
                                { value: "session-change", label: "Variation session" },
                            ]}
                            onChange={(value: string) =>
                                dispatch(setChartAppearance({
                                    ...chartAppearance,
                                    volumeColorMode: value === "session-change" ? "session-change" : "candle-body",
                                }))
                            }
                        />
                    </div>
                )}
            </div>
        </BaseModal>
    );
};

// --- EOF ---
