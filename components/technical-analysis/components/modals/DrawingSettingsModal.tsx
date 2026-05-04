import React, { useState } from "react";
import s from "../../style.module.scss";
import { Drawing, BarPatternMode } from "../../config/TechnicalAnalysisTypes";
import {
  PITCHFORK_TOOLS,
  FIB_PURE_TOOLS,
  POSITION_TOOLS,
  CHANNEL_TOOLS,
  TOOLS_WITH_INPUTS_TAB,
  CYCLES_TOOLS,
} from "../../config/TechnicalAnalysisConstants";
import {
  SettingsNumberInput,
  SettingsColorInput,
  SettingsFillControl,
  SettingsSelectInput,
  SettingsCheckbox,
  SettingsTextArea,
  SettingsColorOpacityInput,
} from "../common/SettingsField";
import { BaseModal } from "../common/BaseModal";
import { ModalTabs } from "../common/ModalTabs";

type AnchoredVWAPSource = NonNullable<Drawing["anchoredVWAPProps"]>["source"];

/**
 * [TENOR 2026] DrawingSettingsModal - Autonomous Smart Component
 * Refactored to manage its own local tab state, eliminating prop-drilling.
 * Retains `dr` and `updateDrawing` as props because they belong to the
 * high-frequency Canvas state, not Redux.
 */
interface DrawingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dr: Drawing;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
}

type TabType = "style" | "inputs" | "coordinates" | "visibility" | "text";

export const DrawingSettingsModal: React.FC<DrawingSettingsModalProps> = ({
  isOpen,
  onClose,
  dr,
  updateDrawing,
}) => {
  // --- Local UI State ---
  const [activeTab, setActiveTab] = useState<TabType>("style");
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevDrId, setPrevDrId] = useState(dr?.id);

  // Intelligent Tab Reset on Open (Adjusting state during render)
  if (isOpen !== prevIsOpen || dr?.id !== prevDrId) {
    setPrevIsOpen(isOpen);
    setPrevDrId(dr?.id);
    if (isOpen && dr) {
      if ((TOOLS_WITH_INPUTS_TAB as readonly string[]).includes(dr.type)) {
        setActiveTab("inputs");
      } else {
        setActiveTab("style");
      }
    }
  }

  if (!isOpen || !dr) return null;

  // Stable extractions to avoid _ref transpiler errors
  const drPfProps = dr.pitchforkProps;
  const drFibProps = dr.fibProps;
  const drRegProps = dr.regressionProps;
  const avProps = dr.anchoredVWAPProps;

  // Extraction atomique complète pour la stabilité (DEZOOM-1000)
  const posProps = dr.positionProps;
  const posAccountSize = posProps?.accountSize ?? 10000;
  const posRiskPercent = posProps?.riskPercent ?? 1;
  const posRiskAmount = posProps?.riskAmount ?? 100;
  const posRiskDisplayMode = posProps?.riskDisplayMode ?? "percent";
  const posLotSize = posProps?.lotSize ?? 1;
  const posLeverage = posProps?.leverage ?? 1;
  const posTpPrice = posProps?.tpPrice ?? 0;
  const posTpTicks = posProps?.tpTicks ?? 0;
  const posSlPrice = posProps?.slPrice ?? 0;
  const posSlTicks = posProps?.slTicks ?? 0;
  const posQtyPrecision = posProps?.qtyPrecision ?? 2;
  const posEntryPrice = dr.points && dr.points.length > 0 ? dr.points[0].value : 0;

  // Constante de calcul pour la parité (à terme injecter dynamiquement via ticker info)
  const TICK_SIZE = 0.01;

  // [TENOR 2026 FIX] Removed drPosProps alias to prevent Turbopack SWC compiler crash on nullish coalescing
  const drTrendFibTimeProps = dr.trendBasedFibTimeProps;
  const drFibCirclesProps = dr.fibCirclesProps;
  const drFibWedgeProps = dr.fibWedgeProps;
  const drPitchfanProps = dr.pitchfanProps;
  const drGannBoxProps = dr.gannBoxProps;
  const drGannSquareProps = dr.gannSquareProps;
  const drGannSquareFixedProps = dr.gannSquareFixedProps;
  const drGannFanProps = dr.gannFanProps;
  const drFibSpiralProps = dr.fibSpiralProps;
  
  // [TENOR 2026 FIX] Atomic extraction for Bar Pattern to prevent SWC compiler crash
  const bpProps = dr.barPatternProps;
  const bpOpacity = bpProps && bpProps.opacity !== undefined ? bpProps.opacity : 1;
  const bpColor = bpProps ? bpProps.color : "#ff9800";
  const bpMode = bpProps ? bpProps.mode : "HL Bars";
  const bpMirrored = bpProps ? bpProps.mirrored : false;
  const bpFlipped = bpProps ? bpProps.flipped : false;

  // [TENOR 2026 FIX] Strictly typed object to satisfy TS Error 2322 + simulation props
  const currentBpProps = {
    color: bpColor,
    mode: bpMode,
    mirrored: bpMirrored,
    flipped: bpFlipped,
    opacity: bpOpacity,
    initialPriceDiff: bpProps?.initialPriceDiff,
    data: bpProps?.data,
    avgHL: bpProps?.avgHL ?? 50,       // [TENOR 2026] Simulation: Avg H/L in ticks
    variance: bpProps?.variance ?? 10, // [TENOR 2026] Simulation: Stochastic noise
    // [TENOR 2026 HDR] New High Fidelity Props
    bullColor: bpProps?.bullColor ?? "#26a69a",
    bearColor: bpProps?.bearColor ?? "#ef5350",
    showBorders: bpProps?.showBorders ?? true,
    bullBorderColor: bpProps?.bullBorderColor ?? "#26a69a",
    bearBorderColor: bpProps?.bearBorderColor ?? "#ef5350",
    showWicks: bpProps?.showWicks ?? true,
    wickColor: bpProps?.wickColor ?? "#737373",
  };

  const drStyle = dr.style;
  const drPts = dr.points;

  // Define Tabs dynamically based on tool type
  let tabs = [
    ...((TOOLS_WITH_INPUTS_TAB as readonly string[]).includes(dr.type) ? [{ id: "inputs", label: "Inputs" }] : []),
    { id: "style", label: "Style" },
    { id: "coordinates", label: "Coordonnées" },
    { id: "text", label: "Texte" },
    { id: "visibility", label: "Visibilité" },
  ];

  // [TENOR 2026] Gann Box High Fidelity Tabs
  if (dr.type === "gann_box") {
    tabs = [
      { id: "style", label: "Style" },
      { id: "coordinates", label: "Coordinates" },
      { id: "visibility", label: "Visibility" },
    ];
  }

  // [TENOR 2026 FIX] TradingView Parity: Bar Pattern only has Style and Visibility tabs
  if (dr.type === "bar_pattern") {
    tabs = [
      { id: "style", label: "Style" },
      { id: "visibility", label: "Visibility" },
    ];
  }

  // [TENOR 2026 HDR] Ghost Feed Tabs (Fidèle à TradingView)
  if (dr.type === "ghost_feed") {
    tabs = [
      { id: "inputs", label: "Inputs" },
      { id: "style", label: "Style" },
      { id: "coordinates", label: "Coordinates" },
      { id: "visibility", label: "Visibility" },
    ];
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={dr.type.replace("_", " ").toUpperCase()}
      icon="bi-gear-fill"
      maxWidth="550px"
      primaryLabel="Valider"
      primaryAction={onClose} // Validation is real-time, button just closes
    >
      <ModalTabs
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabType)}
        tabs={tabs as typeof tabs}
      />

      <div className="p-1">
        {/* ================= INPUTS TAB ================= */}
        {activeTab === "inputs" && (
          <div className="d-flex flex-column gap-3">
            {dr.type === "regression_trend" && drRegProps && (
              <>
                <SettingsNumberInput
                  label="Upper Deviation"
                  value={drRegProps.upperDev}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      regressionProps: { ...drRegProps, upperDev: val },
                    })
                  }
                />
                <SettingsNumberInput
                  label="Lower Deviation"
                  value={drRegProps.lowerDev}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      regressionProps: { ...drRegProps, lowerDev: val },
                    })
                  }
                />
                <SettingsSelectInput
                  label="Source"
                  value={drRegProps.source}
                  options={[
                    "open",
                    "high",
                    "low",
                    "close",
                    "hl2",
                    "hlc3",
                    "ohlc4",
                    "hlcc4",
                  ].map((s) => ({ value: s, label: s.toUpperCase() }))}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      regressionProps: {
                        ...drRegProps,
                        source: val as
                          | "open"
                          | "high"
                          | "low"
                          | "close"
                          | "hl2"
                          | "hlc3"
                          | "ohlc4"
                          | "hlcc4",
                      },
                    })
                  }
                />
              </>
            )}

            {dr.type === "anchored_vwap" && avProps && (
              <>
                <SettingsSelectInput
                  label="Source"
                  value={avProps.source}
                  options={[
                    "open",
                    "high",
                    "low",
                    "close",
                    "hl2",
                    "hlc3",
                    "ohlc4",
                    "hlcc4",
                  ].map((s) => ({ value: s, label: s.toUpperCase() }))}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      anchoredVWAPProps: {
                        ...avProps,
                        source: val as AnchoredVWAPSource,
                      },
                    })
                  }
                />
                <hr className={s["gp-separator"]} />
                <div className="text-secondary small fw-bold mb-2">Bands Multipliers</div>
                {avProps.levels.map((level: NonNullable<Drawing["anchoredVWAPProps"]>["levels"][number], idx: number) => (
                  <div key={idx} className="d-flex align-items-center gap-2 mb-1">
                    <SettingsCheckbox
                      label=""
                      checked={level.enabled}
                      onChange={(val) => {
                        const newLevels = [...avProps.levels];
                        newLevels[idx] = { ...level, enabled: val };
                        updateDrawing(dr.id, { anchoredVWAPProps: { ...avProps, levels: newLevels } });
                      }}
                    />
                    <SettingsNumberInput
                      label={`Level ${idx + 1}`}
                      value={level.multiplier}
                      step={0.1}
                      onChange={(val) => {
                        const newLevels = [...avProps.levels];
                        newLevels[idx] = { ...level, multiplier: val };
                        updateDrawing(dr.id, { anchoredVWAPProps: { ...avProps, levels: newLevels } });
                      }}
                    />
                  </div>
                ))}
              </>
            )}

            {(CHANNEL_TOOLS as readonly string[]).includes(dr.type) && dr.type !== "regression_trend" && (
              <>
                <SettingsCheckbox
                  label="Étendre à gauche"
                  checked={dr.extendLeft || false}
                  onChange={(val) => updateDrawing(dr.id, { extendLeft: val })}
                />
                <SettingsCheckbox
                  label="Étendre à droite"
                  checked={dr.extendRight || false}
                  onChange={(val) => updateDrawing(dr.id, { extendRight: val })}
                />
                {dr.type === "parallel_channel" && (
                  <SettingsCheckbox
                    label="Ligne médiane"
                    checked={dr.showMiddleLine || false}
                    onChange={(val) =>
                      updateDrawing(dr.id, { showMiddleLine: val })
                    }
                  />
                )}
              </>
            )}

            {/* [TENOR 2026 FIX] Variables atomiques pour neutraliser ReferenceError Turbopack */}
            {(POSITION_TOOLS as readonly string[]).includes(dr.type) && posProps && (
              <>
                {/* Section 1: Core Parameters */}
                <div className="d-flex gap-2">
                  <div className="flex-grow-1">
                    <SettingsNumberInput
                      label="Taille du compte"
                      value={posAccountSize}
                      onChange={(val) =>
                        updateDrawing(dr.id, {
                          positionProps: { ...posProps, accountSize: val },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 align-items-end">
                  <div style={{ width: "60%" }}>
                    <SettingsNumberInput
                      label="Risque"
                      value={posRiskDisplayMode === "percent" ? posRiskPercent : posRiskAmount}
                      step={posRiskDisplayMode === "percent" ? 0.1 : 1}
                      onChange={(val) => {
                        if (posRiskDisplayMode === "percent") {
                          updateDrawing(dr.id, { positionProps: { ...posProps, riskPercent: val } });
                        } else {
                          updateDrawing(dr.id, { positionProps: { ...posProps, riskAmount: val } });
                        }
                      }}
                    />
                  </div>
                  <div style={{ width: "40%" }}>
                    <SettingsSelectInput
                      label=""
                      value={posRiskDisplayMode}
                      options={[
                        { value: "percent", label: "%" },
                        { value: "amount", label: "Montant" },
                      ]}
                      onChange={(val) =>
                        updateDrawing(dr.id, {
                          positionProps: { ...posProps, riskDisplayMode: val as "percent" | "amount" },
                        })
                      }
                    />
                  </div>
                </div>

                <SettingsNumberInput
                  label="Taille du lot"
                  value={posLotSize}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      positionProps: { ...posProps, lotSize: val },
                    })
                  }
                />

                <SettingsNumberInput
                  label="Prix d'entrée"
                  value={posEntryPrice}
                  step={0.01}
                  onChange={(val) => {
                    const newPoints = [...drPts];
                    if (newPoints[0]) newPoints[0] = { ...newPoints[0], value: val };
                    updateDrawing(dr.id, { points: newPoints });
                  }}
                />

                <SettingsNumberInput
                  label="Effet de levier"
                  value={posLeverage}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      positionProps: { ...posProps, leverage: val },
                    })
                  }
                />

                {/* Section 2: Profit Level */}
                <div className="mt-2">
                  <div className="text-secondary small fw-bold mb-2 text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Niveau de profit</div>
                  <div className="d-flex gap-3">
                    <div className="flex-grow-1">
                      <SettingsNumberInput
                        label="Ticks"
                        value={posTpTicks || Math.round(Math.abs(posTpPrice - posEntryPrice) / TICK_SIZE)}
                        onChange={(val) => {
                          const factor = dr.type === "long_position" ? 1 : -1;
                          const newPrice = posEntryPrice + (val * TICK_SIZE * factor);
                          updateDrawing(dr.id, {
                            positionProps: { ...posProps, tpTicks: val, tpPrice: newPrice },
                          });
                        }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <SettingsNumberInput
                        label="Prix"
                        value={posTpPrice}
                        step={0.01}
                        onChange={(val) => {
                          const newTicks = Math.round(Math.abs(val - posEntryPrice) / TICK_SIZE);
                          updateDrawing(dr.id, {
                            positionProps: { ...posProps, tpPrice: val, tpTicks: newTicks },
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Stop Level */}
                <div className="mt-2">
                  <div className="text-secondary small fw-bold mb-2 text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Niveau de perte</div>
                  <div className="d-flex gap-3">
                    <div className="flex-grow-1">
                      <SettingsNumberInput
                        label="Ticks"
                        value={posSlTicks || Math.round(Math.abs(posSlPrice - posEntryPrice) / TICK_SIZE)}
                        onChange={(val) => {
                          const factor = dr.type === "long_position" ? -1 : 1;
                          const newPrice = posEntryPrice + (val * TICK_SIZE * factor);
                          updateDrawing(dr.id, {
                            positionProps: { ...posProps, slTicks: val, slPrice: newPrice },
                          });
                        }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <SettingsNumberInput
                        label="Prix"
                        value={posSlPrice}
                        step={0.01}
                        onChange={(val) => {
                          const newTicks = Math.round(Math.abs(val - posEntryPrice) / TICK_SIZE);
                          updateDrawing(dr.id, {
                            positionProps: { ...posProps, slPrice: val, slTicks: newTicks },
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <SettingsSelectInput
                  label="Précision de la quantité"
                  value={posQtyPrecision.toString()}
                  options={[
                    { value: "0", label: "0" },
                    { value: "1", label: "0.1" },
                    { value: "2", label: "0.01" },
                    { value: "3", label: "0.001" },
                    { value: "4", label: "0.0001" },
                  ]}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      positionProps: { ...posProps, qtyPrecision: parseInt(val) },
                    })
                  }
                />
              </>
            )}

            {dr.type === "ghost_feed" && bpProps && (
              <>
                <SettingsNumberInput
                  label="Avg HL in minticks"
                  value={currentBpProps.avgHL}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      barPatternProps: { ...bpProps, avgHL: val },
                    })
                  }
                />
                <SettingsNumberInput
                  label="Variance"
                  value={currentBpProps.variance}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      barPatternProps: { ...bpProps, variance: val },
                    })
                  }
                />
              </>
            )}
          </div>
        )}

        {/* ================= STYLE TAB ================= */}
        {activeTab === "style" && (
          <div className="d-flex flex-column gap-3">
            {/* FIBONACCI TOOLS */}
            {(FIB_PURE_TOOLS as readonly string[]).includes(dr.type) && drFibProps && (
              <>
                <div className="d-flex flex-wrap gap-2">
                  <SettingsCheckbox
                    label="Prolonger Gauche"
                    checked={["left", "both"].includes(
                      (drFibProps.fanProps ? drFibProps.fanProps.extendLines : drFibProps.extendLines) || "none"
                    )}
                    onChange={(val) => {
                      if (
                        dr.type === "fib_speed_resistance_fan" &&
                        drFibProps.fanProps
                      ) {
                        const cur = drFibProps.fanProps.extendLines || "none";
                        updateDrawing(dr.id, {
                          fibProps: {
                            ...drFibProps,
                            fanProps: {
                              ...drFibProps.fanProps,
                              extendLines: val
                                ? cur === "right"
                                  ? "both"
                                  : "left"
                                : cur === "both"
                                ? "right"
                                : "none",
                            },
                          },
                        });
                      } else {
                        const cur = drFibProps.extendLines || "none";
                        updateDrawing(dr.id, {
                          fibProps: {
                            ...drFibProps,
                            extendLines: val
                              ? cur === "right"
                                ? "both"
                                : "left"
                              : cur === "both"
                              ? "right"
                              : "none",
                          },
                        });
                      }
                    }}
                  />
                  <SettingsCheckbox
                    label="Prolonger Droite"
                    checked={["right", "both"].includes(
                      (drFibProps.fanProps ? drFibProps.fanProps.extendLines : drFibProps.extendLines) || "none"
                    )}
                    onChange={(val) => {
                      if (
                        dr.type === "fib_speed_resistance_fan" &&
                        drFibProps.fanProps
                      ) {
                        const cur = drFibProps.fanProps.extendLines || "none";
                        updateDrawing(dr.id, {
                          fibProps: {
                            ...drFibProps,
                            fanProps: {
                              ...drFibProps.fanProps,
                              extendLines: val
                                ? cur === "left"
                                  ? "both"
                                  : "right"
                                : cur === "both"
                                ? "left"
                                : "none",
                            },
                          },
                        });
                      } else {
                        const cur = drFibProps.extendLines || "none";
                        updateDrawing(dr.id, {
                          fibProps: {
                            ...drFibProps,
                            extendLines: val
                              ? cur === "left"
                                ? "both"
                                : "right"
                              : cur === "both"
                              ? "left"
                              : "none",
                          },
                        });
                      }
                    }}
                  />
                </div>

                <SettingsCheckbox
                  label="Inverser"
                  checked={
                    drFibProps.fanProps ? drFibProps.fanProps.reverse : drFibProps.reverse
                  }
                  onChange={(val) => {
                    if (
                      dr.type === "fib_speed_resistance_fan" &&
                      drFibProps.fanProps
                    ) {
                      updateDrawing(dr.id, {
                        fibProps: {
                          ...drFibProps,
                          fanProps: {
                            ...drFibProps.fanProps,
                            reverse: val,
                          },
                        },
                      });
                    } else {
                      updateDrawing(dr.id, {
                        fibProps: { ...drFibProps, reverse: val },
                      });
                    }
                  }}
                />
                <SettingsCheckbox
                  label="Arrière-plan"
                  checked={
                    drFibProps.fanProps ? drFibProps.fanProps.fillBackground : drFibProps.fillBackground
                  }
                  onChange={(val) => {
                    if (
                      dr.type === "fib_speed_resistance_fan" &&
                      drFibProps.fanProps
                    ) {
                      updateDrawing(dr.id, {
                        fibProps: {
                          ...drFibProps,
                          fanProps: {
                            ...drFibProps.fanProps,
                            fillBackground: val,
                          },
                        },
                      });
                    } else {
                      updateDrawing(dr.id, {
                        fibProps: { ...drFibProps, fillBackground: val },
                      });
                    }
                  }}
                />
                <SettingsCheckbox
                  label="Utiliser une seule couleur"
                  checked={
                    (drFibProps.fanProps ? drFibProps.fanProps.useOneColor : drFibProps.useOneColor) || false
                  }
                  onChange={(val) => {
                    if (
                      dr.type === "fib_speed_resistance_fan" &&
                      drFibProps.fanProps
                    ) {
                      updateDrawing(dr.id, {
                        fibProps: {
                          ...drFibProps,
                          fanProps: {
                            ...drFibProps.fanProps,
                            useOneColor: val,
                            oneColor: val ? dr.style.color : undefined,
                          },
                        },
                      });
                    } else {
                      updateDrawing(dr.id, {
                        fibProps: { ...drFibProps, useOneColor: val },
                      });
                    }
                  }}
                />

                <hr className={s["gp-separator"]} />

                {dr.type === "fib_speed_resistance_fan" && drFibProps.fanProps ? (
                  <>
                    <div className="text-secondary small fw-bold mb-2">
                      Price Ratios
                    </div>
                    {drFibProps.fanProps.priceLevels.map((level, idx) => (
                      <div
                        key={`p-${idx}`}
                        className="d-flex align-items-center gap-2 mb-1"
                      >
                        <input
                          type="checkbox"
                          checked={level.enabled}
                          onChange={(e) => {
                            const newLevels = [
                              ...drFibProps.fanProps!.priceLevels,
                            ];
                            newLevels[idx] = {
                              ...level,
                              enabled: e.target.checked,
                            };
                            updateDrawing(dr.id, {
                              fibProps: {
                                ...drFibProps,
                                fanProps: {
                                  ...drFibProps.fanProps!,
                                  priceLevels: newLevels,
                                },
                              },
                            });
                          }}
                        />
                        <input
                          type="number"
                          step="0.001"
                          className={s["gp-input-premium"]}
                          style={{ width: "60px" }}
                          value={level.value}
                          onChange={(e) => {
                            const newLevels = [
                              ...drFibProps.fanProps!.priceLevels,
                            ];
                            newLevels[idx] = {
                              ...level,
                              value: parseFloat(e.target.value) || 0,
                            };
                            updateDrawing(dr.id, {
                              fibProps: {
                                ...drFibProps,
                                fanProps: {
                                  ...drFibProps.fanProps!,
                                  priceLevels: newLevels,
                                },
                              },
                            });
                          }}
                        />
                        <div className="flex-grow-1"></div>
                        <SettingsColorOpacityInput
                          color={level.color}
                          opacity={level.lineOpacity || 1}
                          onColorChange={(val) => {
                            const newLevels = [
                              ...drFibProps.fanProps!.priceLevels,
                            ];
                            newLevels[idx] = { ...level, color: val };
                            updateDrawing(dr.id, {
                              fibProps: {
                                ...drFibProps,
                                fanProps: {
                                  ...drFibProps.fanProps!,
                                  priceLevels: newLevels,
                                  useOneColor: false,
                                },
                              },
                            });
                          }}
                          onOpacityChange={(val) => {
                            const newLevels = [
                              ...drFibProps.fanProps!.priceLevels,
                            ];
                            newLevels[idx] = { ...level, lineOpacity: val };
                            updateDrawing(dr.id, {
                              fibProps: {
                                ...drFibProps,
                                fanProps: {
                                  ...drFibProps.fanProps!,
                                  priceLevels: newLevels,
                                },
                              },
                            });
                          }}
                        />
                      </div>
                    ))}

                    <hr className={s["gp-separator"]} />
                    <div className="text-secondary small fw-bold mb-2">
                      Time Ratios
                    </div>
                    {drFibProps.fanProps.timeLevels.map((level, idx) => (
                      <div
                        key={`t-${idx}`}
                        className="d-flex align-items-center gap-2 mb-1"
                      >
                        <input
                          type="checkbox"
                          checked={level.enabled}
                          onChange={(e) => {
                            const newLevels = [
                              ...drFibProps.fanProps!.timeLevels,
                            ];
                            newLevels[idx] = {
                              ...level,
                              enabled: e.target.checked,
                            };
                            updateDrawing(dr.id, {
                              fibProps: {
                                ...drFibProps,
                                fanProps: {
                                  ...drFibProps.fanProps!,
                                  timeLevels: newLevels,
                                },
                              },
                            });
                          }}
                        />
                        <input
                          type="number"
                          step="0.001"
                          className={s["gp-input-premium"]}
                          style={{ width: "60px" }}
                          value={level.value}
                          onChange={(e) => {
                            const newLevels = [
                              ...drFibProps.fanProps!.timeLevels,
                            ];
                            newLevels[idx] = {
                              ...level,
                              value: parseFloat(e.target.value) || 0,
                            };
                            updateDrawing(dr.id, {
                              fibProps: {
                                ...drFibProps,
                                fanProps: {
                                  ...drFibProps.fanProps!,
                                  timeLevels: newLevels,
                                },
                              },
                            });
                          }}
                        />
                        <div className="flex-grow-1"></div>
                        <SettingsColorOpacityInput
                          color={level.color}
                          opacity={level.lineOpacity || 1}
                          onColorChange={(val) => {
                            const newLevels = [
                              ...drFibProps.fanProps!.timeLevels,
                            ];
                            newLevels[idx] = { ...level, color: val };
                            updateDrawing(dr.id, {
                              fibProps: {
                                ...drFibProps,
                                fanProps: {
                                  ...drFibProps.fanProps!,
                                  timeLevels: newLevels,
                                  useOneColor: false,
                                },
                              },
                            });
                          }}
                          onOpacityChange={(val) => {
                            const newLevels = [
                              ...drFibProps.fanProps!.timeLevels,
                            ];
                            newLevels[idx] = { ...level, lineOpacity: val };
                            updateDrawing(dr.id, {
                              fibProps: {
                                ...drFibProps,
                                fanProps: {
                                  ...drFibProps.fanProps!,
                                  timeLevels: newLevels,
                                },
                              },
                            });
                          }}
                        />
                      </div>
                    ))}
                  </>
                ) : (
                  drFibProps.levels.map((level, idx) => (
                    <div
                      key={idx}
                      className="d-flex align-items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={level.enabled}
                        onChange={(e) => {
                          const newLevels = [...drFibProps.levels];
                          newLevels[idx] = {
                            ...level,
                            enabled: e.target.checked,
                          };
                          updateDrawing(dr.id, {
                            fibProps: { ...drFibProps, levels: newLevels },
                          });
                        }}
                      />
                      <input
                        type="number"
                        step="0.001"
                        className={s["gp-input-premium"]}
                        style={{ width: "60px" }}
                        value={level.value}
                        onChange={(e) => {
                          const newLevels = [...drFibProps.levels];
                          newLevels[idx] = {
                            ...level,
                            value: parseFloat(e.target.value) || 0,
                          };
                          updateDrawing(dr.id, {
                            fibProps: { ...drFibProps, levels: newLevels },
                          });
                        }}
                      />
                      <div className="flex-grow-1"></div>
                      <SettingsColorOpacityInput
                        color={level.color}
                        opacity={level.lineOpacity || 1}
                        onColorChange={(val) => {
                          const newLevels = [...drFibProps.levels];
                          newLevels[idx] = { ...level, color: val };
                          updateDrawing(dr.id, {
                            fibProps: {
                              ...drFibProps,
                              levels: newLevels,
                              useOneColor: false,
                            },
                          });
                        }}
                        onOpacityChange={(val) => {
                          const newLevels = [...drFibProps.levels];
                          newLevels[idx] = { ...level, lineOpacity: val };
                          updateDrawing(dr.id, {
                            fibProps: { ...drFibProps, levels: newLevels },
                          });
                        }}
                      />
                    </div>
                  ))
                )}
              </>
            )}
            {/* [TENOR 2026] GANN BOX STYLE SECTION */}
            {dr.type === "gann_box" && drGannBoxProps && (
              <div className="d-flex flex-column gap-2 mt-2">
                <div className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Price Levels</div>
                {drGannBoxProps.priceLevels.map((level, idx) => (
                  <div key={`p-${idx}`} className="d-flex align-items-center gap-2 mb-1">
                    <SettingsCheckbox
                      label=""
                      checked={level.enabled}
                      onChange={(val) => {
                        const newLevels = [...drGannBoxProps.priceLevels];
                        newLevels[idx] = { ...level, enabled: val };
                        updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, priceLevels: newLevels } });
                      }}
                    />
                    <div style={{ width: "50px" }}>
                       <SettingsNumberInput label="" value={level.value} step={0.001} onChange={(val) => {
                         const newLevels = [...drGannBoxProps.priceLevels];
                         newLevels[idx] = { ...level, value: val };
                         updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, priceLevels: newLevels } });
                       }} />
                    </div>
                    <div className="flex-grow-1"></div>
                    <SettingsColorOpacityInput
                      color={level.color}
                      opacity={level.lineOpacity}
                      onColorChange={(val) => {
                        const newLevels = [...drGannBoxProps.priceLevels];
                        newLevels[idx] = { ...level, color: val };
                        updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, priceLevels: newLevels } });
                      }}
                      onOpacityChange={(val) => {
                        const newLevels = [...drGannBoxProps.priceLevels];
                        newLevels[idx] = { ...level, lineOpacity: val };
                        updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, priceLevels: newLevels } });
                      }}
                    />
                  </div>
                ))}

                <hr className={s["gp-separator"]} />
                <div className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Time Levels</div>
                {drGannBoxProps.timeLevels.map((level, idx) => (
                  <div key={`t-${idx}`} className="d-flex align-items-center gap-2 mb-1">
                    <SettingsCheckbox
                      label=""
                      checked={level.enabled}
                      onChange={(val) => {
                        const newLevels = [...drGannBoxProps.timeLevels];
                        newLevels[idx] = { ...level, enabled: val };
                        updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, timeLevels: newLevels } });
                      }}
                    />
                     <div style={{ width: "50px" }}>
                       <SettingsNumberInput label="" value={level.value} step={0.001} onChange={(val) => {
                         const newLevels = [...drGannBoxProps.timeLevels];
                         newLevels[idx] = { ...level, value: val };
                         updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, timeLevels: newLevels } });
                       }} />
                    </div>
                    <div className="flex-grow-1"></div>
                    <SettingsColorOpacityInput
                      color={level.color}
                      opacity={level.lineOpacity}
                      onColorChange={(val) => {
                        const newLevels = [...drGannBoxProps.timeLevels];
                        newLevels[idx] = { ...level, color: val };
                        updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, timeLevels: newLevels } });
                      }}
                      onOpacityChange={(val) => {
                        const newLevels = [...drGannBoxProps.timeLevels];
                        newLevels[idx] = { ...level, lineOpacity: val };
                        updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, timeLevels: newLevels } });
                      }}
                    />
                  </div>
                ))}

                <hr className={s["gp-separator"]} />
                <div className="d-flex flex-wrap gap-3">
                  <SettingsCheckbox
                    label="Fans (Angles)"
                    checked={drGannBoxProps.showAngles || false}
                    onChange={(val) => updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, showAngles: val } })}
                  />
                  <SettingsCheckbox
                    label="Background (Price)"
                    checked={drGannBoxProps.priceBackground?.enabled || false}
                    onChange={(val) => updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, priceBackground: { ...drGannBoxProps.priceBackground!, enabled: val } } })}
                  />
                  <SettingsCheckbox
                    label="Background (Time)"
                    checked={drGannBoxProps.timeBackground?.enabled || false}
                    onChange={(val) => updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, timeBackground: { ...drGannBoxProps.timeBackground!, enabled: val } } })}
                  />
                </div>
                
                <div className="text-secondary small fw-bold mt-2">Labels Visible</div>
                <div className="d-flex flex-wrap gap-2">
                   {['left', 'right', 'top', 'bottom'].map(side => (
                     <SettingsCheckbox
                       key={side}
                       label={side.toUpperCase()}
                       checked={(drGannBoxProps.showLabels as Record<string, boolean>)[side]}
                       onChange={(val) => updateDrawing(dr.id, { gannBoxProps: { ...drGannBoxProps, showLabels: { ...drGannBoxProps.showLabels, [side]: val } } })}
                     />
                   ))}
                </div>
              </div>
            )}
            {/* FIB SPIRAL */}
            {dr.type === "fib_spiral" && drFibSpiralProps && (
              <>
                <div className="d-flex flex-wrap gap-2">
                  <SettingsCheckbox
                    label="Inverser"
                    checked={drFibSpiralProps.reverse}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        fibSpiralProps: { ...drFibSpiralProps, reverse: val },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Sens Inverse"
                    checked={drFibSpiralProps.counterclockwise || false}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        fibSpiralProps: {
                          ...drFibSpiralProps,
                          counterclockwise: val,
                        },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Utiliser une seule couleur"
                    checked={drFibSpiralProps.useOneColor || false}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        fibSpiralProps: {
                          ...drFibSpiralProps,
                          useOneColor: val,
                          oneColor: val ? dr.style.color : undefined,
                        },
                      })
                    }
                  />
                </div>

                <hr className={s["gp-separator"]} />
                <div className="text-secondary small fw-bold mb-2">Lignes</div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <SettingsCheckbox
                    label="Ligne de tendance"
                    checked={drFibSpiralProps.trendLine.enabled}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        fibSpiralProps: {
                          ...drFibSpiralProps,
                          trendLine: {
                            ...drFibSpiralProps.trendLine,
                            enabled: val,
                          },
                        },
                      })
                    }
                  />
                  {drFibSpiralProps.trendLine.enabled && (
                    <SettingsColorOpacityInput
                      color={drFibSpiralProps.trendLine.color}
                      opacity={drFibSpiralProps.trendLine.lineOpacity || 1}
                      onColorChange={(val) =>
                        updateDrawing(dr.id, {
                          fibSpiralProps: {
                            ...drFibSpiralProps,
                            trendLine: {
                              ...drFibSpiralProps.trendLine,
                              color: val,
                            },
                          },
                        })
                      }
                      onOpacityChange={(val) =>
                        updateDrawing(dr.id, {
                          fibSpiralProps: {
                            ...drFibSpiralProps,
                            trendLine: {
                              ...drFibSpiralProps.trendLine,
                              lineOpacity: val,
                            },
                          },
                        })
                      }
                    />
                  )}
                </div>

                <hr className={s["gp-separator"]} />
                <div className="text-secondary small fw-bold mb-2">Niveaux</div>
                {drFibSpiralProps.levels.map((level, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={level.enabled}
                      onChange={(e) => {
                        const newLevels = [...drFibSpiralProps.levels];
                        newLevels[idx] = { ...level, enabled: e.target.checked };
                        updateDrawing(dr.id, {
                          fibSpiralProps: { ...drFibSpiralProps, levels: newLevels },
                        });
                      }}
                    />
                    <input
                      type="number"
                      step="0.1"
                      className={s["gp-input-premium"]}
                      style={{ width: "60px" }}
                      value={level.value}
                      onChange={(e) => {
                        const newLevels = [...drFibSpiralProps.levels];
                        newLevels[idx] = {
                          ...level,
                          value: parseFloat(e.target.value) || 0,
                        };
                        updateDrawing(dr.id, {
                          fibSpiralProps: { ...drFibSpiralProps, levels: newLevels },
                        });
                      }}
                    />
                    <div className="flex-grow-1"></div>
                    <SettingsColorOpacityInput
                      color={level.color}
                      opacity={level.lineOpacity || 1}
                      onColorChange={(val) => {
                        const newLevels = [...drFibSpiralProps.levels];
                        newLevels[idx] = { ...level, color: val };
                        updateDrawing(dr.id, {
                          fibSpiralProps: {
                            ...drFibSpiralProps,
                            levels: newLevels,
                            useOneColor: false,
                          },
                        });
                      }}
                      onOpacityChange={(val) => {
                        const newLevels = [...drFibSpiralProps.levels];
                        newLevels[idx] = { ...level, lineOpacity: val };
                        updateDrawing(dr.id, {
                          fibSpiralProps: { ...drFibSpiralProps, levels: newLevels },
                        });
                      }}
                    />
                  </div>
                ))}

                <hr className={s["gp-separator"]} />
                <SettingsFillControl
                  label="Arrière-plan"
                  enabled={drFibSpiralProps.background?.enabled || false}
                  onEnabledChange={(val) =>
                    updateDrawing(dr.id, {
                      fibSpiralProps: {
                        ...drFibSpiralProps,
                        background: {
                          ...(drFibSpiralProps.background || {
                            fillOpacity: 0.15,
                          }),
                          enabled: val,
                        },
                      },
                    })
                  }
                  color={drFibSpiralProps.oneColor || dr.style.color || "#787b86"}
                  onColorChange={(val) =>
                    updateDrawing(dr.id, {
                      fibSpiralProps: {
                        ...drFibSpiralProps,
                        useOneColor: true,
                        oneColor: val,
                      },
                    })
                  }
                  opacity={drFibSpiralProps.background?.fillOpacity || 0.15}
                  onOpacityChange={(val) =>
                    updateDrawing(dr.id, {
                      fibSpiralProps: {
                        ...drFibSpiralProps,
                        background: {
                          ...drFibSpiralProps.background!,
                          fillOpacity: val,
                        },
                      },
                    })
                  }
                />
              </>
            )}


            {/* CYCLES TOOLS */}
            {(CYCLES_TOOLS as readonly string[]).includes(dr.type) && dr.cyclesProps && (
              <>
                <SettingsCheckbox
                  label="Arrière-plan"
                  checked={dr.cyclesProps.fillBackground}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      cyclesProps: { ...dr.cyclesProps!, fillBackground: val },
                    })
                  }
                />
                <SettingsFillControl
                  label="Opacité de l'arrière-plan"
                  enabled={dr.cyclesProps.fillBackground}
                  onEnabledChange={(val) =>
                    updateDrawing(dr.id, {
                      cyclesProps: { ...dr.cyclesProps!, fillBackground: val },
                    })
                  }
                  color="#2196f3"
                  onColorChange={() => {}}
                  opacity={dr.cyclesProps.fillOpacity}
                  onOpacityChange={(val) =>
                    updateDrawing(dr.id, {
                      cyclesProps: { ...dr.cyclesProps!, fillOpacity: val },
                    })
                  }
                />
                <hr className={s["gp-separator"]} />
                <div className="text-secondary small fw-bold mb-2">
                  Couleurs Alternées
                </div>
                {dr.cyclesProps.levels.map((level, idx) => (
                  <div
                    key={idx}
                    className="d-flex align-items-center gap-2 mb-2"
                  >
                    <SettingsCheckbox
                      label={`Segment ${idx + 1}`}
                      checked={level.enabled}
                      onChange={(val) => {
                        const newLevels = [...dr.cyclesProps!.levels];
                        newLevels[idx] = { ...level, enabled: val };
                        updateDrawing(dr.id, {
                          cyclesProps: {
                            ...dr.cyclesProps!,
                            levels: newLevels,
                          },
                        });
                      }}
                    />
                    <div className="flex-grow-1"></div>
                    <SettingsColorInput
                      label=""
                      value={level.color}
                      onChange={(val) => {
                        const newLevels = [...dr.cyclesProps!.levels];
                        newLevels[idx] = { ...level, color: val };
                        updateDrawing(dr.id, {
                          cyclesProps: {
                            ...dr.cyclesProps!,
                            levels: newLevels,
                          },
                        });
                      }}
                    />
                  </div>
                ))}
              </>
            )}

            {/* FIB WEDGE */}
            {dr.type === "fib_wedge" && drFibWedgeProps && (
              <>
                <div className="text-secondary small fw-bold mb-2">Lignes</div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <SettingsCheckbox
                    label="Ligne de tendance"
                    checked={drFibWedgeProps.trendLine.enabled}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        fibWedgeProps: {
                          ...drFibWedgeProps,
                          trendLine: {
                            ...drFibWedgeProps.trendLine,
                            enabled: val,
                          },
                        },
                      })
                    }
                  />
                  {drFibWedgeProps.trendLine.enabled && (
                    <>
                      <SettingsColorOpacityInput
                        color={drFibWedgeProps.trendLine.color}
                        opacity={drFibWedgeProps.trendLine.lineOpacity || 1}
                        onColorChange={(val) =>
                          updateDrawing(dr.id, {
                            fibWedgeProps: {
                              ...drFibWedgeProps,
                              trendLine: {
                                ...drFibWedgeProps.trendLine,
                                color: val,
                              },
                            },
                          })
                        }
                        onOpacityChange={(val) =>
                          updateDrawing(dr.id, {
                            fibWedgeProps: {
                              ...drFibWedgeProps,
                              trendLine: {
                                ...drFibWedgeProps.trendLine,
                                lineOpacity: val,
                              },
                            },
                          })
                        }
                      />
                      <SettingsSelectInput
                        label=""
                        value={drFibWedgeProps.trendLine.lineStyle}
                        options={[
                          { label: "Solid", value: "solid" },
                          { label: "Dashed", value: "dashed" },
                          { label: "Dotted", value: "dotted" },
                        ]}
                        onChange={(val) =>
                          updateDrawing(dr.id, {
                            fibWedgeProps: {
                              ...drFibWedgeProps,
                              trendLine: {
                                ...drFibWedgeProps.trendLine,
                                lineStyle: val as
                                  | "solid"
                                  | "dashed"
                                  | "dotted",
                              },
                            },
                          })
                        }
                      />
                    </>
                  )}
                </div>
                <SettingsCheckbox
                  label="Afficher les étiquettes"
                  checked={drFibWedgeProps.showLabels}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      fibWedgeProps: { ...drFibWedgeProps, showLabels: val },
                    })
                  }
                />

                <hr className={s["gp-separator"]} />
                <div className="text-secondary small fw-bold mb-2">Niveaux</div>
                {drFibWedgeProps.levels.map((level, idx) => (
                  <div
                    key={idx}
                    className="d-flex align-items-center gap-2 mb-1"
                  >
                    <input
                      type="checkbox"
                      checked={level.enabled}
                      onChange={(e) => {
                        const newLevels = [...drFibWedgeProps.levels];
                        newLevels[idx] = {
                          ...level,
                          enabled: e.target.checked,
                        };
                        updateDrawing(dr.id, {
                          fibWedgeProps: {
                            ...drFibWedgeProps,
                            levels: newLevels,
                          },
                        });
                      }}
                    />
                    <input
                      type="number"
                      step="0.001"
                      className={s["gp-input-premium"]}
                      style={{ width: "60px" }}
                      value={level.value}
                      onChange={(e) => {
                        const newLevels = [...drFibWedgeProps.levels];
                        newLevels[idx] = {
                          ...level,
                          value: parseFloat(e.target.value) || 0,
                        };
                        updateDrawing(dr.id, {
                          fibWedgeProps: {
                            ...drFibWedgeProps,
                            levels: newLevels,
                          },
                        });
                      }}
                    />
                    <div className="flex-grow-1"></div>
                    <SettingsColorOpacityInput
                      color={level.color}
                      opacity={level.lineOpacity || 1}
                      onColorChange={(val) => {
                        const newLevels = [...drFibWedgeProps.levels];
                        newLevels[idx] = { ...level, color: val };
                        updateDrawing(dr.id, {
                          fibWedgeProps: {
                            ...drFibWedgeProps,
                            levels: newLevels,
                          },
                        });
                      }}
                      onOpacityChange={(val) => {
                        const newLevels = [...drFibWedgeProps.levels];
                        newLevels[idx] = { ...level, lineOpacity: val };
                        updateDrawing(dr.id, {
                          fibWedgeProps: {
                            ...drFibWedgeProps,
                            levels: newLevels,
                          },
                        });
                      }}
                    />
                  </div>
                ))}

                <hr className={s["gp-separator"]} />
                <SettingsCheckbox
                  label="Arrière-plan"
                  checked={drFibWedgeProps.background.enabled}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      fibWedgeProps: {
                        ...drFibWedgeProps,
                        background: {
                          ...drFibWedgeProps.background,
                          enabled: val,
                        },
                      },
                    })
                  }
                />
              </>
            )}

            {/* PITCHFAN */}
            {dr.type === "pitchfan" && drPitchfanProps && (
              <>
                <div className="text-secondary small fw-bold mb-2">Lignes</div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className={s["gp-label-premium"]}>Médiane (0.5)</label>
                  <SettingsColorOpacityInput
                    color={(() => {
                      const l = drPitchfanProps.levels.find(
                        (lvl) => lvl.t === 0.5
                      );
                      return l ? l.color : "#f44336";
                    })()}
                    opacity={(() => {
                      const l = drPitchfanProps.levels.find(
                        (lvl) => lvl.t === 0.5
                      );
                      return l && l.lineOpacity !== undefined ? l.lineOpacity : 1;
                    })()}
                    onColorChange={(val) => {
                      const newLevels = [...drPitchfanProps.levels];
                      const mIdx = newLevels.findIndex((l) => l.t === 0.5);
                      if (mIdx !== -1) {
                        newLevels[mIdx] = { ...newLevels[mIdx], color: val };
                        updateDrawing(dr.id, {
                          pitchfanProps: {
                            ...drPitchfanProps,
                            levels: newLevels,
                          },
                        });
                      }
                    }}
                    onOpacityChange={(val) => {
                      const newLevels = [...drPitchfanProps.levels];
                      const mIdx = newLevels.findIndex((l) => l.t === 0.5);
                      if (mIdx !== -1) {
                        newLevels[mIdx] = {
                          ...newLevels[mIdx],
                          lineOpacity: val,
                        };
                        updateDrawing(dr.id, {
                          pitchfanProps: {
                            ...drPitchfanProps,
                            levels: newLevels,
                          },
                        });
                      }
                    }}
                  />
                </div>

                {drPitchfanProps.levels
                  .filter((l) => l.t !== 0.5)
                  .map((level, idx) => (
                    <div
                      key={idx}
                      className="d-flex align-items-center gap-2 mb-1"
                    >
                      <input
                        type="checkbox"
                        checked={level.enabled}
                        onChange={(e) => {
                          const newLevels = [...drPitchfanProps.levels];
                          const realIdx = newLevels.indexOf(level);
                          newLevels[realIdx] = {
                            ...level,
                            enabled: e.target.checked,
                          };
                          updateDrawing(dr.id, {
                            pitchfanProps: {
                              ...drPitchfanProps,
                              levels: newLevels,
                            },
                          });
                        }}
                      />
                      <span
                        className="text-white small"
                        style={{ width: "40px" }}
                      >
                        {level.t.toFixed(2)}
                      </span>
                      <div className="flex-grow-1"></div>
                      <SettingsColorOpacityInput
                        color={level.color}
                        opacity={level.lineOpacity || 1}
                        onColorChange={(val) => {
                          const newLevels = [...drPitchfanProps.levels];
                          const realIdx = newLevels.indexOf(level);
                          newLevels[realIdx] = {
                            ...newLevels[realIdx],
                            color: val,
                          };
                          updateDrawing(dr.id, {
                            pitchfanProps: {
                              ...drPitchfanProps,
                              levels: newLevels,
                            },
                          });
                        }}
                        onOpacityChange={(val) => {
                          const newLevels = [...drPitchfanProps.levels];
                          const realIdx = newLevels.indexOf(level);
                          newLevels[realIdx] = {
                            ...newLevels[realIdx],
                            lineOpacity: val,
                          };
                          updateDrawing(dr.id, {
                            pitchfanProps: {
                              ...drPitchfanProps,
                              levels: newLevels,
                            },
                          });
                        }}
                      />
                    </div>
                  ))}

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <SettingsCheckbox
                    label="Ligne de tendance"
                    checked={
                      drPitchfanProps.showTrendLine !== undefined
                        ? drPitchfanProps.showTrendLine
                        : drPitchfanProps.trendLine
                        ? drPitchfanProps.trendLine.enabled
                        : true
                    }
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        pitchfanProps: {
                          ...drPitchfanProps,
                          showTrendLine: val,
                          trendLine: {
                            ...(drPitchfanProps.trendLine || {
                              color: "#f44336",
                              lineStyle: "solid",
                              lineWidth: 1,
                            }),
                            enabled: val,
                          },
                        },
                      })
                    }
                  />
                  <SettingsColorOpacityInput
                    color={
                      drPitchfanProps.trendLine &&
                      drPitchfanProps.trendLine.color
                        ? drPitchfanProps.trendLine.color
                        : "#f44336"
                    }
                    opacity={1}
                    onColorChange={(val) =>
                      updateDrawing(dr.id, {
                        pitchfanProps: {
                          ...drPitchfanProps,
                          trendLine: {
                            ...(drPitchfanProps.trendLine || {
                              enabled: true,
                              lineStyle: "solid",
                              lineWidth: 1,
                            }),
                            color: val,
                          },
                        },
                      })
                    }
                    onOpacityChange={() => {}}
                  />
                </div>

                <hr className={s["gp-separator"]} />
                <SettingsCheckbox
                  label="Arrière-plan"
                  checked={drPitchfanProps.fillBackground}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      pitchfanProps: {
                        ...drPitchfanProps,
                        fillBackground: val,
                      },
                    })
                  }
                />
              </>
            )}

            {/* GANN BOX */}
            {dr.type === "gann_box" && drGannBoxProps && (
              <>
                <div className="d-flex flex-wrap gap-2">
                  <SettingsCheckbox
                    label="Inverser"
                    checked={drGannBoxProps.reverse}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannBoxProps: { ...drGannBoxProps, reverse: val },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Angles"
                    checked={drGannBoxProps.showAngles || false}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannBoxProps: { ...drGannBoxProps, showAngles: val },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Une seule couleur"
                    checked={drGannBoxProps.useOneColor || false}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannBoxProps: {
                          ...drGannBoxProps,
                          useOneColor: val,
                          oneColor: val ? dr.style.color : undefined,
                        },
                      })
                    }
                  />
                </div>

                <div className="d-flex flex-wrap gap-2 mt-2">
                  <SettingsCheckbox
                    label="Fond Prix"
                    checked={drGannBoxProps.priceBackground?.enabled || false}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannBoxProps: {
                          ...drGannBoxProps,
                          priceBackground: {
                            ...drGannBoxProps.priceBackground!,
                            enabled: val,
                          },
                        },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Fond Temps"
                    checked={drGannBoxProps.timeBackground?.enabled || false}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannBoxProps: {
                          ...drGannBoxProps,
                          timeBackground: {
                            ...drGannBoxProps.timeBackground!,
                            enabled: val,
                          },
                        },
                      })
                    }
                  />
                </div>

                <hr className={s["gp-separator"]} />
                <div className="text-secondary small fw-bold mb-2">
                  Niveaux de Prix
                </div>
                {drGannBoxProps.priceLevels.map((level, idx) => (
                  <div
                    key={`p-${idx}`}
                    className="d-flex align-items-center gap-2 mb-1"
                  >
                    <input
                      type="checkbox"
                      checked={level.enabled}
                      onChange={(e) => {
                        const newLevels = [...drGannBoxProps.priceLevels];
                        newLevels[idx] = {
                          ...level,
                          enabled: e.target.checked,
                        };
                        updateDrawing(dr.id, {
                          gannBoxProps: {
                            ...drGannBoxProps,
                            priceLevels: newLevels,
                          },
                        });
                      }}
                    />
                    <input
                      type="number"
                      step="0.001"
                      className={s["gp-input-premium"]}
                      style={{ width: "60px" }}
                      value={level.value}
                      onChange={(e) => {
                        const newLevels = [...drGannBoxProps.priceLevels];
                        newLevels[idx] = {
                          ...level,
                          value: parseFloat(e.target.value) || 0,
                        };
                        updateDrawing(dr.id, {
                          gannBoxProps: {
                            ...drGannBoxProps,
                            priceLevels: newLevels,
                          },
                        });
                      }}
                    />
                    <div className="flex-grow-1"></div>
                    <SettingsColorOpacityInput
                      color={level.color}
                      opacity={level.lineOpacity || 1}
                      onColorChange={(val) => {
                        const newLevels = [...drGannBoxProps.priceLevels];
                        newLevels[idx] = { ...level, color: val };
                        updateDrawing(dr.id, {
                          gannBoxProps: {
                            ...drGannBoxProps,
                            priceLevels: newLevels,
                            useOneColor: false,
                          },
                        });
                      }}
                      onOpacityChange={(val) => {
                        const newLevels = [...drGannBoxProps.priceLevels];
                        newLevels[idx] = { ...level, lineOpacity: val };
                        updateDrawing(dr.id, {
                          gannBoxProps: {
                            ...drGannBoxProps,
                            priceLevels: newLevels,
                          },
                        });
                      }}
                    />
                  </div>
                ))}
              </>
            )}

            {/* GANN SQUARE FIXED */}
            {dr.type === "gann_square_fixed" && drGannSquareFixedProps && (
              <>
                <div className="d-flex flex-wrap gap-3 mb-3 align-items-center">
                  <SettingsCheckbox
                    label="Inverser"
                    checked={drGannSquareFixedProps.reverse}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannSquareFixedProps: {
                          ...drGannSquareFixedProps,
                          reverse: val,
                        },
                      })
                    }
                  />
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-secondary">
                      Ratio Prix/Barre
                    </span>
                    <input
                      type="number"
                      step="0.001"
                      className={s["gp-input-premium"]}
                      style={{ width: "80px" }}
                      value={drGannSquareFixedProps.priceBarRatio || 1}
                      onChange={(e) =>
                        updateDrawing(dr.id, {
                          gannSquareFixedProps: {
                            ...drGannSquareFixedProps,
                            priceBarRatio: parseFloat(e.target.value) || 1,
                          },
                        })
                      }
                    />
                  </div>
                  <SettingsCheckbox
                    label="Verrouiller"
                    checked={drGannSquareFixedProps.lockRatio}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannSquareFixedProps: {
                          ...drGannSquareFixedProps,
                          lockRatio: val,
                        },
                      })
                    }
                  />
                </div>

                <SettingsFillControl
                  label="Arrière-plan"
                  enabled={drGannSquareFixedProps.background.enabled}
                  color={drGannSquareFixedProps.background.color}
                  opacity={drGannSquareFixedProps.background.opacity}
                  onEnabledChange={(val) =>
                    updateDrawing(dr.id, {
                      gannSquareFixedProps: {
                        ...drGannSquareFixedProps,
                        background: {
                          ...drGannSquareFixedProps.background,
                          enabled: val,
                        },
                      },
                    })
                  }
                  onColorChange={(val) =>
                    updateDrawing(dr.id, {
                      gannSquareFixedProps: {
                        ...drGannSquareFixedProps,
                        background: {
                          ...drGannSquareFixedProps.background,
                          color: val,
                        },
                      },
                    })
                  }
                  onOpacityChange={(val) =>
                    updateDrawing(dr.id, {
                      gannSquareFixedProps: {
                        ...drGannSquareFixedProps,
                        background: {
                          ...drGannSquareFixedProps.background,
                          opacity: val,
                        },
                      },
                    })
                  }
                />

                <hr className={s["gp-separator"]} />
                <div className="text-secondary small fw-bold mb-2">
                  Niveaux de la Grille
                </div>
                <div className="row g-2">
                  {drGannSquareFixedProps.levels.map((level, idx) => (
                    <div
                      key={`fixed-lvl-${idx}`}
                      className="col-6 d-flex align-items-center gap-2 mb-1"
                    >
                      <input
                        type="checkbox"
                        checked={level.enabled}
                        onChange={(e) => {
                          const newLevels = [...drGannSquareFixedProps.levels];
                          newLevels[idx] = {
                            ...level,
                            enabled: e.target.checked,
                          };
                          updateDrawing(dr.id, {
                            gannSquareFixedProps: {
                              ...drGannSquareFixedProps,
                              levels: newLevels,
                            },
                          });
                        }}
                      />
                      <span
                        className="small text-secondary"
                        style={{ width: "25px" }}
                      >
                        {level.label}
                      </span>
                      <SettingsColorOpacityInput
                        color={level.color}
                        opacity={level.lineOpacity || 1}
                        onColorChange={(val) => {
                          const newLevels = [...drGannSquareFixedProps.levels];
                          newLevels[idx] = { ...level, color: val };
                          updateDrawing(dr.id, {
                            gannSquareFixedProps: {
                              ...drGannSquareFixedProps,
                              levels: newLevels,
                            },
                          });
                        }}
                        onOpacityChange={(val) => {
                          const newLevels = [...drGannSquareFixedProps.levels];
                          newLevels[idx] = { ...level, lineOpacity: val };
                          updateDrawing(dr.id, {
                            gannSquareFixedProps: {
                              ...drGannSquareFixedProps,
                              levels: newLevels,
                            },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* GANN SQUARE (DYNAMIC) */}
            {dr.type === "gann_square" && drGannSquareProps && (
              <>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <SettingsCheckbox
                    label="Inverser"
                    checked={drGannSquareProps.reverse}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannSquareProps: { ...drGannSquareProps, reverse: val },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Angles"
                    checked={drGannSquareProps.showAngles}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannSquareProps: {
                          ...drGannSquareProps,
                          showAngles: val,
                        },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Fans"
                    checked={drGannSquareProps.showFans}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannSquareProps: {
                          ...drGannSquareProps,
                          showFans: val,
                        },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Grid"
                    checked={drGannSquareProps.showGrid}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannSquareProps: {
                          ...drGannSquareProps,
                          showGrid: val,
                        },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Arcs"
                    checked={drGannSquareProps.showArcs}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannSquareProps: {
                          ...drGannSquareProps,
                          showArcs: val,
                        },
                      })
                    }
                  />
                </div>

                <SettingsFillControl
                  label="Arrière-plan"
                  enabled={drGannSquareProps.fillBackground}
                  color={drGannSquareProps.color || "#2196f3"}
                  opacity={drGannSquareProps.fillOpacity}
                  onEnabledChange={(val) =>
                    updateDrawing(dr.id, {
                      gannSquareProps: {
                        ...drGannSquareProps,
                        fillBackground: val,
                      },
                    })
                  }
                  onColorChange={(val) =>
                    updateDrawing(dr.id, {
                      gannSquareProps: { ...drGannSquareProps, color: val },
                    })
                  }
                  onOpacityChange={(val) =>
                    updateDrawing(dr.id, {
                      gannSquareProps: {
                        ...drGannSquareProps,
                        fillOpacity: val,
                      },
                    })
                  }
                />

                <SettingsCheckbox
                  label="Mosaïque"
                  checked={drGannSquareProps.mosaicFill}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      gannSquareProps: {
                        ...drGannSquareProps,
                        mosaicFill: val,
                      },
                    })
                  }
                />
              </>
            )}

            {/* GANN FAN */}
            {dr.type === "gann_fan" && drGannFanProps && (
              <>
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                  <SettingsCheckbox
                    label="Inverser"
                    checked={drGannFanProps.reverse}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannFanProps: { ...drGannFanProps, reverse: val },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Labels"
                    checked={drGannFanProps.showLabels}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannFanProps: { ...drGannFanProps, showLabels: val },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Arrière-plan"
                    checked={drGannFanProps.fillBackground}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        gannFanProps: {
                          ...drGannFanProps,
                          fillBackground: val,
                        },
                      })
                    }
                  />
                </div>

                <hr className={s["gp-separator"]} />
                <div className="text-secondary small fw-bold mb-2">
                  Lignes (Gann Angles)
                </div>
                <div className="d-flex flex-column gap-1">
                  {drGannFanProps.lines.map((l, idx) => {
                    const currentLine = l;
                    const fOpacity = currentLine.fillOpacity ?? 0.07;
                    const fColor = currentLine.fillColor || currentLine.color;

                    return (
                      <div
                        key={`gann-fan-line-${idx}`}
                        className="d-flex align-items-center gap-2 mb-1"
                      >
                        <input
                          type="checkbox"
                          checked={currentLine.enabled}
                          onChange={(e) => {
                            const newLines = [...drGannFanProps.lines];
                            newLines[idx] = {
                              ...currentLine,
                              enabled: e.target.checked,
                            };
                            updateDrawing(dr.id, {
                              gannFanProps: {
                                ...drGannFanProps,
                                lines: newLines,
                              },
                            });
                          }}
                        />
                        <span
                          className="small text-secondary fw-bold"
                          style={{ width: "30px" }}
                        >
                          {currentLine.ratio}
                        </span>
                        <SettingsColorOpacityInput
                          color={currentLine.color}
                          opacity={currentLine.lineOpacity || 1}
                          onColorChange={(val) => {
                            const newLines = [...drGannFanProps.lines];
                            newLines[idx] = { ...currentLine, color: val };
                            updateDrawing(dr.id, {
                              gannFanProps: {
                                ...drGannFanProps,
                                lines: newLines,
                              },
                            });
                          }}
                          onOpacityChange={(val) => {
                            const newLines = [...drGannFanProps.lines];
                            newLines[idx] = {
                              ...currentLine,
                              lineOpacity: val,
                            };
                            updateDrawing(dr.id, {
                              gannFanProps: {
                                ...drGannFanProps,
                                lines: newLines,
                              },
                            });
                          }}
                        />
                        <SettingsSelectInput
                          label=""
                          value={currentLine.lineStyle}
                          options={[
                            { label: "Solid", value: "solid" },
                            { label: "Dashed", value: "dashed" },
                            { label: "Dotted", value: "dotted" },
                          ]}
                          onChange={(val) => {
                            const newLines = [...drGannFanProps.lines];
                            newLines[idx] = {
                              ...currentLine,
                              lineStyle: val as "solid" | "dashed" | "dotted",
                            };
                            updateDrawing(dr.id, {
                              gannFanProps: {
                                ...drGannFanProps,
                                lines: newLines,
                              },
                            });
                          }}
                        />
                        {idx < drGannFanProps.lines.length - 1 && (
                          <div
                            className="d-flex align-items-center gap-1 ms-2"
                            title="Couleur de zone"
                          >
                            <i className="bi bi-paint-bucket small text-secondary"></i>
                            <SettingsColorOpacityInput
                              color={fColor}
                              opacity={fOpacity}
                              onColorChange={(val) => {
                                const newLines = [...drGannFanProps.lines];
                                newLines[idx] = {
                                  ...currentLine,
                                  fillColor: val,
                                };
                                updateDrawing(dr.id, {
                                  gannFanProps: {
                                    ...drGannFanProps,
                                    lines: newLines,
                                  },
                                });
                              }}
                              onOpacityChange={(val) => {
                                const newLines = [...drGannFanProps.lines];
                                newLines[idx] = {
                                  ...currentLine,
                                  fillOpacity: val,
                                };
                                updateDrawing(dr.id, {
                                  gannFanProps: {
                                    ...drGannFanProps,
                                    lines: newLines,
                                  },
                                });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* PITCHFORK */}
            {(PITCHFORK_TOOLS as readonly string[]).includes(dr.type) && drPfProps && (
              <>
                <SettingsCheckbox
                  label="Extend lines"
                  checked={drPfProps.extendLines}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      pitchforkProps: { ...drPfProps, extendLines: val },
                    })
                  }
                />
                <SettingsCheckbox
                  label="Background"
                  checked={drPfProps.fillBackground}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      pitchforkProps: { ...drPfProps, fillBackground: val },
                    })
                  }
                />

                <hr className={s["gp-separator"]} />
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className={s["gp-label-premium"]}>Médiane</label>
                  <SettingsColorOpacityInput
                    color={
                      drPfProps.levels.find((l) => l.value === 0)?.color ||
                      "#ffffff"
                    }
                    opacity={
                      drPfProps.levels.find((l) => l.value === 0)
                        ?.lineOpacity || 1
                    }
                    onColorChange={(val) => {
                      const newLevels = [...drPfProps.levels];
                      const mIdx = newLevels.findIndex(
                        (l) => l.value === 0
                      );
                      if (mIdx !== -1) {
                        newLevels[mIdx] = { ...newLevels[mIdx], color: val };
                        updateDrawing(dr.id, {
                          pitchforkProps: {
                            ...drPfProps,
                            levels: newLevels,
                          },
                        });
                      }
                    }}
                    onOpacityChange={(val) => {
                      const newLevels = [...drPfProps.levels];
                      const mIdx = newLevels.findIndex(
                        (l) => l.value === 0
                      );
                      if (mIdx !== -1) {
                        newLevels[mIdx] = {
                          ...newLevels[mIdx],
                          lineOpacity: val,
                        };
                        updateDrawing(dr.id, {
                          pitchforkProps: {
                            ...drPfProps,
                            levels: newLevels,
                          },
                        });
                      }
                    }}
                  />
                </div>

                {drPfProps.levels
                  .filter((l) => l.value !== 0)
                  .map((level, idx) => (
                    <div
                      key={`pf-lvl-${idx}`}
                      className="d-flex align-items-center gap-2 mb-1"
                    >
                      <input
                        type="checkbox"
                        checked={level.enabled}
                        onChange={(e) => {
                          const newLevels = [...drPfProps.levels];
                          const realIdx = newLevels.indexOf(level);
                          newLevels[realIdx] = {
                            ...level,
                            enabled: e.target.checked,
                          };
                          updateDrawing(dr.id, {
                            pitchforkProps: {
                              ...drPfProps,
                              levels: newLevels,
                            },
                          });
                        }}
                      />
                      <span
                        className="text-white small"
                        style={{ width: "40px" }}
                      >
                        {level.value}
                      </span>
                      <div className="flex-grow-1"></div>
                      <SettingsColorOpacityInput
                        color={level.color}
                        opacity={level.lineOpacity || 1}
                        onColorChange={(val) => {
                          const newLevels = [...drPfProps.levels];
                          const realIdx = newLevels.indexOf(level);
                          newLevels[realIdx] = {
                            ...newLevels[realIdx],
                            color: val,
                          };
                          updateDrawing(dr.id, {
                            pitchforkProps: {
                              ...drPfProps,
                              levels: newLevels,
                            },
                          });
                        }}
                        onOpacityChange={(val) => {
                          const newLevels = [...drPfProps.levels];
                          const realIdx = newLevels.indexOf(level);
                          newLevels[realIdx] = {
                            ...newLevels[realIdx],
                            lineOpacity: val,
                          };
                          updateDrawing(dr.id, {
                            pitchforkProps: {
                              ...drPfProps,
                              levels: newLevels,
                            },
                          });
                        }}
                      />
                    </div>
                  ))}
              </>
            )}

            {/* TREND BASED FIB TIME */}
            {dr.type === "trend_based_fib_time" && drTrendFibTimeProps && (
              <>
                <div className="text-secondary small fw-bold mb-2">Lignes</div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <SettingsCheckbox
                    label="Ligne de tendance"
                    checked={drTrendFibTimeProps.trendLine.enabled}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        trendBasedFibTimeProps: {
                          ...drTrendFibTimeProps,
                          trendLine: {
                            ...drTrendFibTimeProps.trendLine,
                            enabled: val,
                          },
                        },
                      })
                    }
                  />
                  {drTrendFibTimeProps.trendLine.enabled && (
                    <>
                      <SettingsColorOpacityInput
                        color={drTrendFibTimeProps.trendLine.color}
                        opacity={
                          drTrendFibTimeProps.trendLine.lineOpacity || 1
                        }
                        onColorChange={(val) =>
                          updateDrawing(dr.id, {
                            trendBasedFibTimeProps: {
                              ...drTrendFibTimeProps,
                              trendLine: {
                                ...drTrendFibTimeProps.trendLine,
                                color: val,
                              },
                            },
                          })
                        }
                        onOpacityChange={(val) =>
                          updateDrawing(dr.id, {
                            trendBasedFibTimeProps: {
                              ...drTrendFibTimeProps,
                              trendLine: {
                                ...drTrendFibTimeProps.trendLine,
                                lineOpacity: val,
                              },
                            },
                          })
                        }
                      />
                    </>
                  )}
                </div>

                <hr className={s["gp-separator"]} />
                <div className="text-secondary small fw-bold mb-2">Niveaux</div>
                {drTrendFibTimeProps.levels.map((level, idx) => (
                  <div
                    key={`tbf-lvl-${idx}`}
                    className="d-flex align-items-center gap-2 mb-1"
                  >
                    <input
                      type="checkbox"
                      checked={level.enabled}
                      onChange={(e) => {
                        const newLevels = [...drTrendFibTimeProps.levels];
                        newLevels[idx] = {
                          ...level,
                          enabled: e.target.checked,
                        };
                        updateDrawing(dr.id, {
                          trendBasedFibTimeProps: {
                            ...drTrendFibTimeProps,
                            levels: newLevels,
                          },
                        });
                      }}
                    />
                    <input
                      type="number"
                      step="0.001"
                      className={s["gp-input-premium"]}
                      style={{ width: "60px" }}
                      value={level.value}
                      onChange={(e) => {
                        const newLevels = [...drTrendFibTimeProps.levels];
                        newLevels[idx] = {
                          ...level,
                          value: parseFloat(e.target.value) || 0,
                        };
                        updateDrawing(dr.id, {
                          trendBasedFibTimeProps: {
                            ...drTrendFibTimeProps,
                            levels: newLevels,
                          },
                        });
                      }}
                    />
                    <div className="flex-grow-1"></div>
                    <SettingsColorOpacityInput
                      color={level.color}
                      opacity={level.lineOpacity || 1}
                      onColorChange={(val) => {
                        const newLevels = [...drTrendFibTimeProps.levels];
                        newLevels[idx] = { ...level, color: val };
                        updateDrawing(dr.id, {
                          trendBasedFibTimeProps: {
                            ...drTrendFibTimeProps,
                            levels: newLevels,
                          },
                        });
                      }}
                      onOpacityChange={(val) => {
                        const newLevels = [...drTrendFibTimeProps.levels];
                        newLevels[idx] = { ...level, lineOpacity: val };
                        updateDrawing(dr.id, {
                          trendBasedFibTimeProps: {
                            ...drTrendFibTimeProps,
                            levels: newLevels,
                          },
                        });
                      }}
                    />
                  </div>
                ))}
              </>
            )}

            {/* FIB CIRCLES */}
            {dr.type === "fib_circles" && drFibCirclesProps && (
              <>
                <SettingsCheckbox
                  label="Ligne de tendance"
                  checked={drFibCirclesProps.trendLine.enabled}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      fibCirclesProps: {
                        ...drFibCirclesProps,
                        trendLine: {
                          ...drFibCirclesProps.trendLine,
                          enabled: val,
                        },
                      },
                    })
                  }
                />
                <SettingsCheckbox
                  label="Afficher les étiquettes"
                  checked={drFibCirclesProps.showLabels}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      fibCirclesProps: {
                        ...drFibCirclesProps,
                        showLabels: val,
                      },
                    })
                  }
                />

                <hr className={s["gp-separator"]} />
                <div className="text-secondary small fw-bold mb-2">Niveaux</div>
                {drFibCirclesProps.levels.map((level, idx) => (
                  <div
                    key={`circ-lvl-${idx}`}
                    className="d-flex align-items-center gap-2 mb-1"
                  >
                    <input
                      type="checkbox"
                      checked={level.enabled}
                      onChange={(e) => {
                        const newLevels = [...drFibCirclesProps.levels];
                        newLevels[idx] = {
                          ...level,
                          enabled: e.target.checked,
                        };
                        updateDrawing(dr.id, {
                          fibCirclesProps: {
                            ...drFibCirclesProps,
                            levels: newLevels,
                          },
                        });
                      }}
                    />
                    <input
                      type="number"
                      step="0.001"
                      className={s["gp-input-premium"]}
                      style={{ width: "60px" }}
                      value={level.value}
                      onChange={(e) => {
                        const newLevels = [...drFibCirclesProps.levels];
                        newLevels[idx] = {
                          ...level,
                          value: parseFloat(e.target.value) || 0,
                        };
                        updateDrawing(dr.id, {
                          fibCirclesProps: {
                            ...drFibCirclesProps,
                            levels: newLevels,
                          },
                        });
                      }}
                    />
                    <div className="flex-grow-1"></div>
                    <SettingsColorOpacityInput
                      color={level.color}
                      opacity={level.lineOpacity || 1}
                      onColorChange={(val) => {
                        const newLevels = [...drFibCirclesProps.levels];
                        newLevels[idx] = { ...level, color: val };
                        updateDrawing(dr.id, {
                          fibCirclesProps: {
                            ...drFibCirclesProps,
                            levels: newLevels,
                          },
                        });
                      }}
                      onOpacityChange={(val) => {
                        const newLevels = [...drFibCirclesProps.levels];
                        newLevels[idx] = { ...level, lineOpacity: val };
                        updateDrawing(dr.id, {
                          fibCirclesProps: {
                            ...drFibCirclesProps,
                            levels: newLevels,
                          },
                        });
                      }}
                    />
                  </div>
                ))}
              </>
            )}

            {/* POSITION FORECAST */}
            {dr.type === "position_forecast" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className={s["gp-label-premium"]}>Ligne</label>
                  <SettingsColorOpacityInput
                    color={drStyle.color}
                    opacity={drStyle.lineOpacity || 1}
                    onColorChange={(val) =>
                      updateDrawing(dr.id, {
                        style: { ...drStyle, color: val, borderColor: val },
                      })
                    }
                    onOpacityChange={(val) =>
                      updateDrawing(dr.id, {
                        style: { ...drStyle, lineOpacity: val },
                      })
                    }
                  />
                </div>
                <SettingsNumberInput
                  label="Épaisseur"
                  value={drStyle.lineWidth || 1}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      style: { ...drStyle, lineWidth: val },
                    })
                  }
                />
                <SettingsSelectInput
                  label="Style"
                  value={drStyle.lineStyle}
                  options={[
                    { label: "Solid", value: "solid" },
                    { label: "Dashed", value: "dashed" },
                    { label: "Dotted", value: "dotted" },
                  ]}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      style: {
                        ...drStyle,
                        lineStyle: val as "solid" | "dashed" | "dotted",
                      },
                    })
                  }
                />

                <hr className={s["gp-separator"]} />
                {/* SOURCE */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  <SettingsCheckbox
                    label="Texte de la source"
                    checked={dr.forecastProps?.showSourceText !== false}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, showSourceText: val },
                      })
                    }
                  />
                  <div className="flex-grow-1" />
                  <SettingsColorInput
                    label=""
                    value={dr.forecastProps?.sourceTextColor || "#ffffff"}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, sourceTextColor: val },
                      })
                    }
                  />
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <label className={s["gp-label-premium"]}>Arrière-plan de la source</label>
                  <div className="flex-grow-1" />
                  <SettingsColorInput
                    label=""
                    value={dr.forecastProps?.sourceBackgroundColor || "#673ab7"}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, sourceBackgroundColor: val },
                      })
                    }
                  />
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <label className={s["gp-label-premium"]}>Bordure de la source</label>
                  <div className="flex-grow-1" />
                  <SettingsColorInput
                    label=""
                    value={dr.forecastProps?.sourceBorderColor || dr.forecastProps?.sourceBackgroundColor || "#673ab7"}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, sourceBorderColor: val },
                      })
                    }
                  />
                </div>

                <hr className={s["gp-separator"]} />
                {/* TARGET */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  <SettingsCheckbox
                    label="Texte de la cible"
                    checked={dr.forecastProps?.showTargetText !== false}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, showTargetText: val },
                      })
                    }
                  />
                  <div className="flex-grow-1" />
                  <SettingsColorInput
                    label=""
                    value={dr.forecastProps?.targetTextColor || "#ffffff"}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, targetTextColor: val },
                      })
                    }
                  />
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <label className={s["gp-label-premium"]}>Arrière-plan de la cible</label>
                  <div className="flex-grow-1" />
                  <SettingsColorInput
                    label=""
                    value={dr.forecastProps?.targetBackgroundColor || "#673ab7"}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, targetBackgroundColor: val },
                      })
                    }
                  />
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <label className={s["gp-label-premium"]}>Bordure de la cible</label>
                  <div className="flex-grow-1" />
                  <SettingsColorInput
                    label=""
                    value={dr.forecastProps?.targetBorderColor || dr.forecastProps?.targetBackgroundColor || "#673ab7"}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, targetBorderColor: val },
                      })
                    }
                  />
                </div>

                <hr className={s["gp-separator"]} />
                {/* SUCCESS */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  <SettingsCheckbox
                    label="Texte de succès"
                    checked={dr.forecastProps?.showSuccessText !== false}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, showSuccessText: val },
                      })
                    }
                  />
                  <div className="flex-grow-1" />
                  <SettingsColorInput
                    label=""
                    value={dr.forecastProps?.successTextColor || "#ffffff"}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, successTextColor: val },
                      })
                    }
                  />
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <label className={s["gp-label-premium"]}>Arrière-plan de succès</label>
                  <div className="flex-grow-1" />
                  <SettingsColorInput
                    label=""
                    value={dr.forecastProps?.successBackgroundColor || "#089981"}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, successBackgroundColor: val },
                      })
                    }
                  />
                </div>

                <hr className={s["gp-separator"]} />
                {/* FAILURE */}
                <div className="d-flex align-items-center gap-2 mb-2">
                  <SettingsCheckbox
                    label="Texte d'échec"
                    checked={dr.forecastProps?.showFailureText !== false}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, showFailureText: val },
                      })
                    }
                  />
                  <div className="flex-grow-1" />
                  <SettingsColorInput
                    label=""
                    value={dr.forecastProps?.failureTextColor || "#ffffff"}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, failureTextColor: val },
                      })
                    }
                  />
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <label className={s["gp-label-premium"]}>Arrière-plan d&apos;échec</label>
                  <div className="flex-grow-1" />
                  <SettingsColorInput
                    label=""
                    value={dr.forecastProps?.failureBackgroundColor || "#f23645"}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        forecastProps: { ...dr.forecastProps, failureBackgroundColor: val },
                      })
                    }
                  />
                </div>
              </>
            )}

            {/* BAR PATTERN & GHOST FEED */}
            {dr.type === "bar_pattern" && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className={s["gp-label-premium"]}>Couleur</label>
                  <SettingsColorOpacityInput
                    color={bpColor}
                    opacity={bpOpacity}
                    onColorChange={(val) =>
                      updateDrawing(dr.id, {
                        barPatternProps: { ...currentBpProps, color: val },
                      })
                    }
                    onOpacityChange={(val) =>
                      updateDrawing(dr.id, {
                        barPatternProps: { ...currentBpProps, opacity: val },
                      })
                    }
                  />
                </div>
                <SettingsSelectInput
                  label="Mode"
                  value={bpMode}
                  options={[
                    "HL Bars",
                    "OC Bars",
                    "Line - Open",
                    "Line - High",
                    "Line - Low",
                    "Line - Close",
                    "Line - HL/2",
                  ].map((m) => ({ value: m, label: m }))}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      barPatternProps: {
                        ...currentBpProps,
                        mode: val as BarPatternMode,
                      },
                    })
                  }
                />
                <div className="d-flex gap-3">
                  <SettingsCheckbox
                    label="Mirrored"
                    checked={bpMirrored}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        barPatternProps: { ...currentBpProps, mirrored: val },
                      })
                    }
                  />
                  <SettingsCheckbox
                    label="Flipped"
                    checked={bpFlipped}
                    onChange={(val) =>
                      updateDrawing(dr.id, {
                        barPatternProps: { ...currentBpProps, flipped: val },
                      })
                    }
                  />
                </div>
              </>
            )}

            {dr.type === "ghost_feed" && bpProps && (
              <div className="d-flex flex-column gap-3">
                {/* CANDLES FILL (Image 3) */}
                <div className="d-flex align-items-center gap-3">
                  <span className="small text-secondary" style={{ width: "80px" }}>Candles</span>
                  <SettingsColorInput
                    label=""
                    value={currentBpProps.bullColor}
                    onChange={(val) => updateDrawing(dr.id, { barPatternProps: { ...bpProps, bullColor: val } })}
                  />
                  <SettingsColorInput
                    label=""
                    value={currentBpProps.bearColor}
                    onChange={(val) => updateDrawing(dr.id, { barPatternProps: { ...bpProps, bearColor: val } })}
                  />
                </div>

                {/* BORDERS (Image 3) */}
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: "80px" }}>
                    <SettingsCheckbox
                      label="Borders"
                      checked={currentBpProps.showBorders}
                      onChange={(val) => updateDrawing(dr.id, { barPatternProps: { ...bpProps, showBorders: val } })}
                    />
                  </div>
                  <SettingsColorInput
                    label=""
                    value={currentBpProps.bullBorderColor}
                    onChange={(val) => updateDrawing(dr.id, { barPatternProps: { ...bpProps, bullBorderColor: val } })}
                  />
                  <SettingsColorInput
                    label=""
                    value={currentBpProps.bearBorderColor}
                    onChange={(val) => updateDrawing(dr.id, { barPatternProps: { ...bpProps, bearBorderColor: val } })}
                  />
                </div>

                {/* WICKS (Image 3) */}
                <div className="d-flex align-items-center gap-3">
                  <div style={{ width: "80px" }}>
                    <SettingsCheckbox
                      label="Wick"
                      checked={currentBpProps.showWicks}
                      onChange={(val) => updateDrawing(dr.id, { barPatternProps: { ...bpProps, showWicks: val } })}
                    />
                  </div>
                  <SettingsColorInput
                    label=""
                    value={currentBpProps.wickColor}
                    onChange={(val) => updateDrawing(dr.id, { barPatternProps: { ...bpProps, wickColor: val } })}
                  />
                </div>

                {/* TRANSPARENCY SLIDER (Image 3) */}
                <div className="mt-2">
                  <div className="small text-secondary mb-1">Transparency</div>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round((1 - bpOpacity) * 100)}
                      className="form-range"
                      style={{ flexGrow: 1, accentColor: "#6b21a8" }}
                      onChange={(e) => {
                        const trans = parseInt(e.target.value);
                        updateDrawing(dr.id, { barPatternProps: { ...bpProps, opacity: 1 - (trans / 100) } });
                      }}
                    />
                    <span className="small text-secondary" style={{ width: "35px" }}>{Math.round((1 - bpOpacity) * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            {dr.type === "anchored_vwap" && avProps && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className={s["gp-label-premium"]}>VWAP Line</label>
                  <SettingsColorOpacityInput
                    color={drStyle.color}
                    opacity={drStyle.lineOpacity || 1}
                    onColorChange={(val) => updateDrawing(dr.id, { style: { ...drStyle, color: val } })}
                    onOpacityChange={(val) => updateDrawing(dr.id, { style: { ...drStyle, lineOpacity: val } })}
                  />
                </div>
                <hr className={s["gp-separator"]} />
                <SettingsCheckbox
                  label="Calculate Std Dev"
                  checked={avProps.calculateStDev}
                  onChange={(val) => updateDrawing(dr.id, { anchoredVWAPProps: { ...avProps, calculateStDev: val } })}
                />
                <SettingsCheckbox
                  label="Fill Background"
                  checked={avProps.fillBackground}
                  onChange={(val) => updateDrawing(dr.id, { anchoredVWAPProps: { ...avProps, fillBackground: val } })}
                />
                {avProps.fillBackground && (
                  <div className="d-flex gap-2 align-items-center mb-2">
                    <span className="small text-secondary">Fill Transparency</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={avProps.transparency}
                      className="form-range"
                      onChange={(e) =>
                        updateDrawing(dr.id, {
                          anchoredVWAPProps: {
                            ...avProps,
                            transparency: parseInt(e.target.value, 10),
                          },
                        })
                      }
                    />
                    <span className="small text-secondary">{avProps.transparency}%</span>
                  </div>
                )}
                <div className="text-secondary small fw-bold mb-2 mt-2">Bands Style</div>
                {avProps.levels.map((level: NonNullable<Drawing["anchoredVWAPProps"]>["levels"][number], idx: number) => (
                  <div key={idx} className="d-flex flex-column gap-1 mb-3 border-bottom border-dark pb-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small text-secondary">Band #{idx + 1}</span>
                      <SettingsColorOpacityInput
                        color={level.color}
                        opacity={level.lineOpacity}
                        onColorChange={(val) => {
                          const newLevels = [...avProps.levels];
                          newLevels[idx] = { ...level, color: val };
                          updateDrawing(dr.id, { anchoredVWAPProps: { ...avProps, levels: newLevels } });
                        }}
                        onOpacityChange={(val) => {
                          const newLevels = [...avProps.levels];
                          newLevels[idx] = { ...level, lineOpacity: val };
                          updateDrawing(dr.id, { anchoredVWAPProps: { ...avProps, levels: newLevels } });
                        }}
                      />
                    </div>
                    {avProps.fillBackground && avProps.calculateStDev && (
                      <div className="d-flex gap-2 align-items-center">
                        <span className="small text-secondary">Fill Opacity</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={level.fillOpacity}
                          className="form-range"
                          onChange={(e) => {
                            const newLevels = [...avProps.levels];
                            newLevels[idx] = { ...level, fillOpacity: parseFloat(e.target.value) };
                            updateDrawing(dr.id, { anchoredVWAPProps: { ...avProps, levels: newLevels } });
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* GENERIC / FALLBACK STYLE */}
            {!(
              (FIB_PURE_TOOLS as readonly string[]).includes(dr.type) ||
              (PITCHFORK_TOOLS as readonly string[]).includes(dr.type) ||
              dr.type === "regression_trend" ||
              dr.type === "trend_based_fib_time" ||
              dr.type === "fib_circles" ||
              dr.type === "pitchfan" ||
              dr.type === "gann_box" ||
              dr.type === "gann_square_fixed" ||
              dr.type === "gann_square" ||
              dr.type === "gann_fan" ||
              dr.type === "position_forecast" ||
              dr.type === "bar_pattern" ||
              dr.type === "ghost_feed" ||
              dr.type === "anchored_vwap"
            ) && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className={s["gp-label-premium"]}>Couleur</label>
                  <SettingsColorOpacityInput
                    color={drStyle.borderColor || drStyle.color}
                    opacity={drStyle.lineOpacity || 1}
                    onColorChange={(val) =>
                      updateDrawing(dr.id, {
                        style: {
                          ...drStyle,
                          borderColor: val,
                          color: val,
                        },
                      })
                    }
                    onOpacityChange={(val) =>
                      updateDrawing(dr.id, {
                        style: { ...drStyle, lineOpacity: val },
                      })
                    }
                  />
                </div>
                <SettingsNumberInput
                  label="Épaisseur"
                  value={drStyle.lineWidth || 1}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      style: { ...drStyle, lineWidth: val },
                    })
                  }
                />
                <SettingsSelectInput
                  label="Style"
                  value={drStyle.lineStyle}
                  options={[
                    { label: "Solid", value: "solid" },
                    { label: "Dashed", value: "dashed" },
                    { label: "Dotted", value: "dotted" },
                  ]}
                  onChange={(val) =>
                    updateDrawing(dr.id, {
                      style: {
                        ...drStyle,
                        lineStyle: val as "solid" | "dashed" | "dotted",
                      },
                    })
                  }
                />
                {drStyle.fillEnabled !== undefined && (
                  <SettingsFillControl
                    label="Background"
                    enabled={drStyle.fillEnabled}
                    color={drStyle.fillColor || "#2962ff"}
                    opacity={drStyle.fillOpacity || 0.2}
                    onEnabledChange={(val) =>
                      updateDrawing(dr.id, {
                        style: { ...drStyle, fillEnabled: val },
                      })
                    }
                    onColorChange={(val) =>
                      updateDrawing(dr.id, {
                        style: { ...drStyle, fillColor: val },
                      })
                    }
                    onOpacityChange={(val) =>
                      updateDrawing(dr.id, {
                        style: { ...drStyle, fillOpacity: val },
                      })
                    }
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* ================= COORDINATES TAB ================= */}
        {activeTab === "coordinates" && (
          <div className="d-flex flex-column gap-3">
            {drPts.map((pt, idx) => (
              <div
                key={`coord-${idx}`}
                className="d-flex flex-column gap-1 border-bottom border-secondary pb-3"
              >
                <label className="text-secondary small fw-bold">
                  Point #{idx + 1}
                </label>
                <div className="d-flex gap-2">
                  <SettingsNumberInput
                    label="Barre"
                    width="100%"
                    value={
                      typeof pt.time === "number"
                        ? Math.round(pt.time)
                        : (isNaN(Number(pt.time)) ? "" : Math.round(Number(pt.time)))
                    }
                    onChange={(val) => {
                      const newPts = [...drPts];
                      newPts[idx] = { ...pt, time: Number(val) };
                      updateDrawing(dr.id, { points: newPts });
                    }}
                  />
                  <SettingsNumberInput
                    label="Prix"
                    width="100%"
                    value={pt.value}
                    step="0.001"
                    onChange={(val) => {
                      const newPts = [...drPts];
                      newPts[idx] = { ...pt, value: Number(val) };
                      updateDrawing(dr.id, { points: newPts });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= TEXT TAB ================= */}
        {activeTab === "text" && (
          <div className="d-flex flex-column gap-3">
            <SettingsCheckbox
              label="Afficher le texte"
              checked={dr.showText || false}
              onChange={(val) => updateDrawing(dr.id, { showText: val })}
            />
            <SettingsTextArea
              label="Contenu"
              value={dr.text || ""}
              onChange={(val) => updateDrawing(dr.id, { text: val })}
            />
            <SettingsColorInput
              label="Couleur Texte"
              value={dr.textColor || "#FFFFFF"}
              onChange={(val) => updateDrawing(dr.id, { textColor: val })}
            />
            <SettingsNumberInput
              label="Taille"
              value={dr.fontSize || 13}
              onChange={(val) => updateDrawing(dr.id, { fontSize: val })}
            />
            <div className="d-flex gap-2">
              <SettingsSelectInput
                label="Align. H"
                width="50%"
                value={dr.textAlignmentHorizontal || "center"}
                options={[
                  { label: "Gauche", value: "left" },
                  { label: "Centre", value: "center" },
                  { label: "Droite", value: "right" },
                ]}
                onChange={(val) =>
                  updateDrawing(dr.id, {
                    textAlignmentHorizontal: val as
                      | "left"
                      | "center"
                      | "right",
                  })
                }
              />
              <SettingsSelectInput
                label="Align. V"
                width="50%"
                value={dr.textAlignmentVertical || "bottom"}
                options={[
                  { label: "Haut", value: "top" },
                  { label: "Milieu", value: "middle" },
                  { label: "Bas", value: "bottom" },
                ]}
                onChange={(val) =>
                  updateDrawing(dr.id, {
                    textAlignmentVertical: val as
                      | "top"
                      | "middle"
                      | "bottom",
                  })
                }
              />
            </div>
          </div>
        )}

        {/* ================= VISIBILITY TAB ================= */}
        {activeTab === "visibility" && (
          <div className="text-secondary text-center py-5">
            <i className="bi bi-eye-slash display-4 d-block mb-3"></i>
            Options de visibilité temporelle <br />
            (Bientôt disponible)
          </div>
        )}
      </div>
    </BaseModal>
  );
};
