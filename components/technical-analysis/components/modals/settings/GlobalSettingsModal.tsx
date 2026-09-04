import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { BaseModal } from "../../common/primitives/BaseModal";
import {
  commitLayoutChartAppearance,
  setAnonyme,
  setChartAppearance,
  setChartAppearancePreview,
  setIndicatorPeriods,
} from "../../../store/technicalAnalysisSlice";
import {
  selectChartAppearance,
  selectIndicatorPeriods,
  selectUiState,
} from "../../../store/selectors";
import type {
  ChartAppearance,
  ChartBackgroundMode,
  ChartGridLineStyle,
  ChartWatermarkMode,
} from "../../../config/state/chartStateTypes";
import { completeMultiChartCell } from "../../../config/layout/multiChartCellState";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTabId =
  | "symbol"
  | "status"
  | "scales"
  | "canvas"
  | "indicators";

const settingsTabs: Array<{ id: SettingsTabId; label: string; icon: string }> = [
  { id: "symbol", label: "Symbole", icon: "bi-sliders2-vertical" },
  { id: "status", label: "Ligne d'etat", icon: "bi-list" },
  { id: "scales", label: "Echelles et lignes", icon: "bi-arrows-move" },
  { id: "canvas", label: "Canvas", icon: "bi-pencil" },
  { id: "indicators", label: "Indicateurs", icon: "bi-activity" },
];

const volumeColorOptions = [
  { value: "candle-body", label: "Corps bougie" },
  { value: "session-change", label: "Variation session" },
];

const PROJECT_SOLID_BACKGROUND = "#102a43";
const PROJECT_GRADIENT_BOTTOM = "#0b1f33";
const DEFAULT_GRID_LINE_COLOR = "#334155";
const DEFAULT_CROSSHAIR_COLOR = "#94a3b8";
const DEFAULT_WATERMARK_COLOR = "#475569";
const DEFAULT_SCALE_TEXT_COLOR = "#cbd5e1";
const DEFAULT_SCALE_LINE_COLOR = "#334155";

const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const normalizeColor = (value: string | undefined, fallback: string) => (
  value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
);

const toControlName = (label: string) => (
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "chart-setting"
);

const cycleLineStyle = (style: ChartGridLineStyle): ChartGridLineStyle => {
  if (style === "solid") return "dashed";
  if (style === "dashed") return "dotted";
  return "solid";
};

const cloneChartAppearance = (appearance: ChartAppearance): ChartAppearance => ({
  ...appearance,
  statusLine: { ...appearance.statusLine },
});

const mergeChartAppearance = (
  current: ChartAppearance,
  patch: Partial<ChartAppearance>,
): ChartAppearance => ({
  ...current,
  ...patch,
  statusLine: patch.statusLine
    ? { ...current.statusLine, ...patch.statusLine }
    : { ...current.statusLine },
});

const getLinePreviewClass = (style: ChartGridLineStyle) => `tv-settings-line-preview tv-settings-line-preview--${style}`;

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h6 className="tv-settings-section-title">{children}</h6>
);

const SettingsRow = ({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) => (
  <div className={compact ? "tv-settings-row tv-settings-row--compact" : "tv-settings-row"}>
    <span className="tv-settings-label">{label}</span>
    <div className="tv-settings-control-slot">{children}</div>
  </div>
);

const SettingsCheckbox = ({
  checked,
  label,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  const controlId = useId();
  const controlName = toControlName(label);

  return (
    <label className="tv-settings-checkbox" htmlFor={controlId}>
      <input
        id={controlId}
        name={controlName}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span aria-hidden="true" />
      {label}
    </label>
  );
};

const SettingsSelect = <Value extends string>({
  value,
  options,
  width,
  ariaLabel,
  onChange,
  disabled = false,
}: {
  value: Value;
  options: Array<{ value: Value; label: string }>;
  width?: number;
  ariaLabel: string;
  onChange: (value: Value) => void;
  disabled?: boolean;
}) => {
  const controlId = useId();

  return (
    <select
      id={controlId}
      name={toControlName(ariaLabel)}
      className="tv-settings-select"
      value={value}
      aria-label={ariaLabel}
      disabled={disabled}
      style={width ? { width } : undefined}
      onChange={(event) => onChange(event.target.value as Value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const SettingsNumber = ({
  value,
  min,
  max,
  width = 100,
  ariaLabel,
  onChange,
  disabled = false,
}: {
  value: number;
  min: number;
  max: number;
  width?: number;
  ariaLabel: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}) => {
  const controlId = useId();

  return (
    <input
      id={controlId}
      name={toControlName(ariaLabel)}
      className="tv-settings-number"
      type="number"
      min={min}
      max={max}
      value={value}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{ width }}
      onChange={(event) => onChange(clampNumber(Number(event.target.value), min, max))}
    />
  );
};

const ColorSwatch = ({
  value,
  fallback = "#ffffff",
  ariaLabel,
  onChange,
  disabled = false,
}: {
  value: string;
  fallback?: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const controlId = useId();

  return (
    <label className="tv-settings-color" htmlFor={controlId} aria-label={ariaLabel}>
      <span style={{ backgroundColor: value === "transparent" ? "#ffffff" : normalizeColor(value, fallback) }} />
      <input
        id={controlId}
        name={toControlName(ariaLabel)}
        type="color"
        value={normalizeColor(value, fallback)}
        aria-label={ariaLabel}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
};

const LineStyleButton = ({
  color,
  styleName,
  ariaLabel,
  onClick,
  disabled = false,
}: {
  color: string;
  styleName: ChartGridLineStyle;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    className="tv-settings-line-button"
    type="button"
    aria-label={ariaLabel}
    title="Changer le style de ligne"
    disabled={disabled}
    onClick={onClick}
  >
    <span className="tv-settings-transparency" aria-hidden="true" />
    <span
      className={getLinePreviewClass(styleName)}
      style={{ borderTopColor: normalizeColor(color, "#b6bcc6") }}
      aria-hidden="true"
    />
  </button>
);

export const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const { addNotification } = useGlobalNotification();
  const indicatorPeriods = useSelector(selectIndicatorPeriods);
  const chartAppearance = useSelector(selectChartAppearance);
  const uiState = useSelector(selectUiState);
  const isAnonyme = uiState.isAnonyme;
  const isMultiChartMode = uiState.multiChartLayout.isEnabled && uiState.multiChartLayout.charts.length > 1;
  const activeLayoutChartId = uiState.multiChartLayout.activeChartId;

  const [activeTab, setActiveTab] = useState<SettingsTabId>("canvas");
  const [draftAppearance, setDraftAppearance] = useState<ChartAppearance>(() => cloneChartAppearance(chartAppearance));
  const draftAppearanceRef = useRef<ChartAppearance>(cloneChartAppearance(chartAppearance));
  const transactionRef = useRef<{
    previewChartId: string | null;
    layoutChartId: string | null;
    snapshot: ChartAppearance;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const activeRawCell = uiState.multiChartLayout.charts.find((cell) => cell.chartId === activeLayoutChartId);
    const activeCell = activeRawCell ? completeMultiChartCell(activeRawCell) : null;
    const committedAppearance = isMultiChartMode && activeCell?.appearance
      ? activeCell.appearance
      : chartAppearance;
    const snapshot = cloneChartAppearance(committedAppearance);
    const previewChartId = isMultiChartMode ? activeCell?.chartId ?? activeLayoutChartId : null;
    const layoutChartId = activeCell?.symbol.trim() ? activeCell.chartId : null;

    transactionRef.current = { previewChartId, layoutChartId, snapshot };
    draftAppearanceRef.current = snapshot;
    setDraftAppearance(snapshot);
    dispatch(setChartAppearancePreview({ chartId: previewChartId, appearance: snapshot }));
  }, [activeLayoutChartId, chartAppearance, dispatch, isMultiChartMode, isOpen, uiState.multiChartLayout]);

  useEffect(() => () => {
    dispatch(setChartAppearancePreview(null));
  }, [dispatch]);

  const publishDraftAppearance = useCallback((appearance: ChartAppearance) => {
    const next = cloneChartAppearance(appearance);
    draftAppearanceRef.current = next;
    setDraftAppearance(next);
    dispatch(setChartAppearancePreview({
      chartId: transactionRef.current?.previewChartId ?? null,
      appearance: next,
    }));
  }, [dispatch]);

  const updateChartAppearance = useCallback((patch: Partial<ChartAppearance>) => {
    publishDraftAppearance(mergeChartAppearance(draftAppearanceRef.current, patch));
  }, [publishDraftAppearance]);

  const statusLine = draftAppearance.statusLine;
  const volumeColorMode = draftAppearance.volumeColorMode ?? "candle-body";
  const backgroundMode: ChartBackgroundMode = draftAppearance.backgroundMode ?? "solid";
  const verticalGridLines = draftAppearance.verticalGridLines ?? draftAppearance.showGrid;
  const horizontalGridLines = draftAppearance.horizontalGridLines ?? draftAppearance.showGrid;
  const verticalGridLineStyle = draftAppearance.verticalGridLineStyle ?? "solid";
  const horizontalGridLineStyle = draftAppearance.horizontalGridLineStyle ?? "dashed";
  const verticalGridLineColor = draftAppearance.verticalGridLineColor ?? draftAppearance.gridLineColor ?? DEFAULT_GRID_LINE_COLOR;
  const horizontalGridLineColor = draftAppearance.horizontalGridLineColor ?? draftAppearance.gridLineColor ?? DEFAULT_GRID_LINE_COLOR;
  const verticalGridLineOpacity = clampNumber(draftAppearance.verticalGridLineOpacity ?? 1, 0, 1);
  const horizontalGridLineOpacity = clampNumber(draftAppearance.horizontalGridLineOpacity ?? 1, 0, 1);
  const crosshairColor = draftAppearance.crosshairColor ?? DEFAULT_CROSSHAIR_COLOR;
  const watermarkMode = draftAppearance.watermarkMode ?? "none";
  const watermarkColor = draftAppearance.watermarkColor ?? DEFAULT_WATERMARK_COLOR;
  const scaleTextColor = draftAppearance.scaleTextColor ?? DEFAULT_SCALE_TEXT_COLOR;
  const scaleTextSize = draftAppearance.scaleTextSize ?? 12;
  const scaleLineColor = draftAppearance.scaleLineColor ?? DEFAULT_SCALE_LINE_COLOR;
  const marginTopPercent = draftAppearance.marginTopPercent ?? 10;
  const marginBottomPercent = draftAppearance.marginBottomPercent ?? 8;
  const rightOffsetBars = draftAppearance.rightOffsetBars ?? 10;

  const updateStatusLine = (patch: Partial<typeof statusLine>) => {
    updateChartAppearance({ statusLine: { ...statusLine, ...patch } });
  };

  const updateGridVisibility = (patch: Pick<Partial<ChartAppearance>, "verticalGridLines" | "horizontalGridLines">) => {
    const nextVerticalGridLines = patch.verticalGridLines ?? verticalGridLines;
    const nextHorizontalGridLines = patch.horizontalGridLines ?? horizontalGridLines;
    updateChartAppearance({
      ...patch,
      showGrid: nextVerticalGridLines || nextHorizontalGridLines,
    });
  };

  const handleBackgroundModeChange = (mode: ChartBackgroundMode) => {
    updateChartAppearance({
      backgroundMode: mode,
      backgroundGradientTopColor: draftAppearanceRef.current.backgroundGradientTopColor || PROJECT_SOLID_BACKGROUND,
      backgroundGradientBottomColor: draftAppearanceRef.current.backgroundGradientBottomColor || PROJECT_GRADIENT_BOTTOM,
    });
  };

  const handleBackgroundColorChange = (color: string) => {
    updateChartAppearance({ backgroundColor: color });
  };

  const handleCancel = () => {
    dispatch(setChartAppearancePreview(null));
    transactionRef.current = null;
    onClose();
  };

  const handleConfirm = () => {
    const committed = cloneChartAppearance(draftAppearanceRef.current);
    const transaction = transactionRef.current;
    if (transaction?.layoutChartId) {
      dispatch(commitLayoutChartAppearance({ chartId: transaction.layoutChartId, appearance: committed }));
    } else {
      dispatch(setChartAppearance(committed));
    }
    dispatch(setChartAppearancePreview(null));
    transactionRef.current = null;
    addNotification({
      title: "Parametres appliques",
      message: "Les changements sont appliques au graphique.",
      type: "success",
      iconType: "faCheck",
    });
    onClose();
  };

  const footer = (
    <div className="tv-settings-footer">
      <div className="tv-settings-footer-actions">
        <button className="tv-settings-button tv-settings-button--secondary" type="button" onClick={handleCancel}>
          Annuler
        </button>
        <button className="tv-settings-button tv-settings-button--primary" type="button" onClick={handleConfirm}>
          OK
        </button>
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Parametres"
      maxWidth="750px"
      footer={footer}
      className="tv-chart-settings-modal"
      overlayClassName="tv-chart-settings-overlay"
    >
      <div className="tv-settings-shell" data-active-tab={activeTab}>
        <nav className="tv-settings-sidebar" aria-label="Categories des parametres du graphique">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "tv-settings-nav-item is-active" : "tv-settings-nav-item"}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`bi ${tab.icon}`} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="tv-settings-panel">
          {activeTab === "canvas" && (
            <>
              <SectionTitle>Styles de base du graphique</SectionTitle>
              <SettingsRow label="Arriere-plan">
                <div className="tv-settings-inline">
                  <SettingsSelect
                    value={backgroundMode}
                    options={[
                      { value: "solid", label: "Solide" },
                      { value: "gradient", label: "Degrade" },
                    ]}
                    width={150}
                    ariaLabel="Type d'arriere-plan"
                    onChange={handleBackgroundModeChange}
                  />
                  {backgroundMode === "solid" ? (
                    <ColorSwatch
                      value={draftAppearance.backgroundColor}
                      fallback={PROJECT_SOLID_BACKGROUND}
                      ariaLabel="Couleur d'arriere-plan"
                      onChange={handleBackgroundColorChange}
                    />
                  ) : (
                    <>
                      <ColorSwatch
                        value={draftAppearance.backgroundGradientTopColor ?? PROJECT_SOLID_BACKGROUND}
                        fallback={PROJECT_SOLID_BACKGROUND}
                        ariaLabel="Couleur haute du degrade"
                        onChange={(backgroundGradientTopColor) => updateChartAppearance({ backgroundGradientTopColor })}
                      />
                      <ColorSwatch
                        value={draftAppearance.backgroundGradientBottomColor ?? PROJECT_GRADIENT_BOTTOM}
                        fallback={PROJECT_GRADIENT_BOTTOM}
                        ariaLabel="Couleur basse du degrade"
                        onChange={(backgroundGradientBottomColor) => updateChartAppearance({ backgroundGradientBottomColor })}
                      />
                    </>
                  )}
                </div>
              </SettingsRow>
              <SettingsRow label="Lignes verticales">
                <div className="tv-settings-inline">
                  <SettingsCheckbox
                    checked={verticalGridLines}
                    label="Afficher"
                    onChange={(checked) => updateGridVisibility({ verticalGridLines: checked })}
                  />
                  <ColorSwatch
                    value={verticalGridLineColor}
                    fallback={DEFAULT_GRID_LINE_COLOR}
                    ariaLabel="Couleur des lignes verticales"
                    disabled={!verticalGridLines}
                    onChange={(verticalGridLineColor) => updateChartAppearance({ verticalGridLineColor })}
                  />
                  <LineStyleButton
                    color={verticalGridLineColor}
                    styleName={verticalGridLineStyle}
                    ariaLabel="Style des lignes verticales"
                    disabled={!verticalGridLines}
                    onClick={() => updateChartAppearance({ verticalGridLineStyle: cycleLineStyle(verticalGridLineStyle) })}
                  />
                  <div className="tv-settings-inline tv-settings-inline--unit">
                    <SettingsNumber
                      value={Math.round(verticalGridLineOpacity * 100)}
                      min={0}
                      max={100}
                      width={72}
                      ariaLabel="Opacite des lignes verticales"
                      disabled={!verticalGridLines}
                      onChange={(value) => updateChartAppearance({ verticalGridLineOpacity: value / 100 })}
                    />
                    <span>%</span>
                  </div>
                </div>
              </SettingsRow>
              <SettingsRow label="Lignes horizontales">
                <div className="tv-settings-inline">
                  <SettingsCheckbox
                    checked={horizontalGridLines}
                    label="Afficher"
                    onChange={(checked) => updateGridVisibility({ horizontalGridLines: checked })}
                  />
                  <ColorSwatch
                    value={horizontalGridLineColor}
                    fallback={DEFAULT_GRID_LINE_COLOR}
                    ariaLabel="Couleur des lignes horizontales"
                    disabled={!horizontalGridLines}
                    onChange={(horizontalGridLineColor) => updateChartAppearance({ horizontalGridLineColor })}
                  />
                  <LineStyleButton
                    color={horizontalGridLineColor}
                    styleName={horizontalGridLineStyle}
                    ariaLabel="Style des lignes horizontales"
                    disabled={!horizontalGridLines}
                    onClick={() => updateChartAppearance({ horizontalGridLineStyle: cycleLineStyle(horizontalGridLineStyle) })}
                  />
                  <div className="tv-settings-inline tv-settings-inline--unit">
                    <SettingsNumber
                      value={Math.round(horizontalGridLineOpacity * 100)}
                      min={0}
                      max={100}
                      width={72}
                      ariaLabel="Opacite des lignes horizontales"
                      disabled={!horizontalGridLines}
                      onChange={(value) => updateChartAppearance({ horizontalGridLineOpacity: value / 100 })}
                    />
                    <span>%</span>
                  </div>
                </div>
              </SettingsRow>
              <SettingsRow label="Reticule">
                <div className="tv-settings-inline">
                  <ColorSwatch
                    value={crosshairColor}
                    fallback={DEFAULT_CROSSHAIR_COLOR}
                    ariaLabel="Couleur du reticule"
                    onChange={(nextCrosshairColor) => updateChartAppearance({ crosshairColor: nextCrosshairColor })}
                  />
                </div>
              </SettingsRow>
              <SettingsRow label="Filigrane">
                <div className="tv-settings-inline">
                  <SettingsSelect
                    value={watermarkMode}
                    options={[
                      { value: "replay", label: "Mode replay" },
                      { value: "symbol", label: "Symbole" },
                      { value: "none", label: "Masque" },
                    ]}
                    width={180}
                    ariaLabel="Mode de filigrane"
                    onChange={(nextWatermarkMode) => updateChartAppearance({
                      watermarkMode: nextWatermarkMode as ChartWatermarkMode,
                    })}
                  />
                  <ColorSwatch
                    value={watermarkColor}
                    fallback={DEFAULT_WATERMARK_COLOR}
                    ariaLabel="Couleur du filigrane"
                    onChange={(nextWatermarkColor) => updateChartAppearance({ watermarkColor: nextWatermarkColor })}
                  />
                </div>
              </SettingsRow>

              <SectionTitle>Echelles</SectionTitle>
              <SettingsRow label="Texte">
                <div className="tv-settings-inline">
                  <ColorSwatch
                    value={scaleTextColor}
                    fallback={DEFAULT_SCALE_TEXT_COLOR}
                    ariaLabel="Couleur du texte des echelles"
                    onChange={(nextScaleTextColor) => updateChartAppearance({ scaleTextColor: nextScaleTextColor })}
                  />
                  <SettingsSelect
                    value={String(scaleTextSize)}
                    options={[
                      { value: "10", label: "10" },
                      { value: "11", label: "11" },
                      { value: "12", label: "12" },
                      { value: "13", label: "13" },
                      { value: "14", label: "14" },
                    ]}
                    width={100}
                    ariaLabel="Taille du texte des echelles"
                    onChange={(nextScaleTextSize) => updateChartAppearance({ scaleTextSize: Number(nextScaleTextSize) })}
                  />
                </div>
              </SettingsRow>
              <SettingsRow label="Lignes">
                <ColorSwatch
                  value={scaleLineColor}
                  fallback={DEFAULT_SCALE_LINE_COLOR}
                  ariaLabel="Couleur des lignes d'echelle"
                  onChange={(nextScaleLineColor) => updateChartAppearance({ scaleLineColor: nextScaleLineColor })}
                />
              </SettingsRow>

              <SectionTitle>Marges</SectionTitle>
              <SettingsRow label="Haut">
                <div className="tv-settings-inline tv-settings-inline--unit">
                  <SettingsNumber
                    value={marginTopPercent}
                    min={0}
                    max={50}
                    ariaLabel="Marge haute"
                    onChange={(nextMarginTopPercent) => updateChartAppearance({ marginTopPercent: nextMarginTopPercent })}
                  />
                  <span>%</span>
                </div>
              </SettingsRow>
              <SettingsRow label="Bas">
                <div className="tv-settings-inline tv-settings-inline--unit">
                  <SettingsNumber
                    value={marginBottomPercent}
                    min={0}
                    max={50}
                    ariaLabel="Marge basse"
                    onChange={(nextMarginBottomPercent) => updateChartAppearance({ marginBottomPercent: nextMarginBottomPercent })}
                  />
                  <span>%</span>
                </div>
              </SettingsRow>
              <SettingsRow label="Droite">
                <div className="tv-settings-inline tv-settings-inline--unit">
                  <SettingsNumber
                    value={rightOffsetBars}
                    min={0}
                    max={100}
                    ariaLabel="Marge droite"
                    onChange={(nextRightOffsetBars) => updateChartAppearance({ rightOffsetBars: nextRightOffsetBars })}
                  />
                  <span>barres</span>
                </div>
              </SettingsRow>
            </>
          )}

          {activeTab === "symbol" && (
            <>
              <SectionTitle>Symbole</SectionTitle>
              <SettingsRow label="Nom du titre">
                <SettingsCheckbox
                  checked={statusLine.showName}
                  label="Afficher"
                  onChange={(showName) => updateStatusLine({ showName })}
                />
              </SettingsRow>
              <SettingsRow label="Symbole">
                <SettingsCheckbox
                  checked={statusLine.showSymbol}
                  label="Afficher"
                  onChange={(showSymbol) => updateStatusLine({ showSymbol })}
                />
              </SettingsRow>
              <SettingsRow label="Logo">
                <SettingsCheckbox
                  checked={statusLine.showLogo}
                  label="Afficher"
                  onChange={(showLogo) => updateStatusLine({ showLogo })}
                />
              </SettingsRow>
              <SettingsRow label="Mode anonyme">
                <SettingsCheckbox
                  checked={isAnonyme}
                  label="Activer"
                  onChange={(checked) => dispatch(setAnonyme(checked))}
                />
              </SettingsRow>
            </>
          )}

          {activeTab === "status" && (
            <>
              <SectionTitle>Ligne d'etat</SectionTitle>
              <SettingsRow label="Dernier prix">
                <SettingsCheckbox
                  checked={statusLine.showLast}
                  label="Afficher"
                  onChange={(showLast) => updateStatusLine({ showLast })}
                />
              </SettingsRow>
              <SettingsRow label="Variation">
                <SettingsCheckbox
                  checked={statusLine.showChange}
                  label="Afficher"
                  onChange={(showChange) => updateStatusLine({ showChange })}
                />
              </SettingsRow>
              <SettingsRow label="Variation %">
                <SettingsCheckbox
                  checked={statusLine.showChangePercent}
                  label="Afficher"
                  onChange={(showChangePercent) => updateStatusLine({ showChangePercent })}
                />
              </SettingsRow>
              <SettingsRow label="Nom du titre">
                <SettingsCheckbox
                  checked={statusLine.showName}
                  label="Afficher"
                  onChange={(showName) => updateStatusLine({ showName })}
                />
              </SettingsRow>
              <SettingsRow label="Symbole">
                <SettingsCheckbox
                  checked={statusLine.showSymbol}
                  label="Afficher"
                  onChange={(showSymbol) => updateStatusLine({ showSymbol })}
                />
              </SettingsRow>
              <SettingsRow label="Logo">
                <SettingsCheckbox
                  checked={statusLine.showLogo}
                  label="Afficher"
                  onChange={(showLogo) => updateStatusLine({ showLogo })}
                />
              </SettingsRow>
              <SettingsRow label="Volume">
                <SettingsCheckbox
                  checked={statusLine.showVolume}
                  label="Afficher"
                  onChange={(showVolume) => updateStatusLine({ showVolume })}
                />
              </SettingsRow>
            </>
          )}

          {activeTab === "scales" && (
            <>
              <SectionTitle>Echelles et lignes</SectionTitle>
              <SettingsRow label="Grille">
                <SettingsCheckbox
                  checked={draftAppearance.showGrid}
                  label="Afficher"
                  onChange={(showGrid) => updateChartAppearance({
                    showGrid,
                    verticalGridLines: showGrid,
                    horizontalGridLines: showGrid,
                  })}
                />
              </SettingsRow>
              <SettingsRow label="Texte">
                <div className="tv-settings-inline">
                  <ColorSwatch
                    value={scaleTextColor}
                    fallback={DEFAULT_SCALE_TEXT_COLOR}
                    ariaLabel="Couleur du texte"
                    onChange={(nextScaleTextColor) => updateChartAppearance({ scaleTextColor: nextScaleTextColor })}
                  />
                  <SettingsSelect
                    value={String(scaleTextSize)}
                    options={[
                      { value: "10", label: "10" },
                      { value: "11", label: "11" },
                      { value: "12", label: "12" },
                      { value: "13", label: "13" },
                      { value: "14", label: "14" },
                    ]}
                    width={100}
                    ariaLabel="Taille du texte"
                    onChange={(nextScaleTextSize) => updateChartAppearance({ scaleTextSize: Number(nextScaleTextSize) })}
                  />
                </div>
              </SettingsRow>
              <SettingsRow label="Volume">
                <SettingsCheckbox
                  checked={draftAppearance.showVolume}
                  label="Afficher"
                  onChange={(showVolume) => updateChartAppearance({ showVolume })}
                />
              </SettingsRow>
              <SettingsRow label="Couleur volume">
                <SettingsSelect
                  value={volumeColorMode}
                  options={volumeColorOptions}
                  width={180}
                  ariaLabel="Mode couleur du volume"
                  onChange={(value) => updateChartAppearance({
                    volumeColorMode: value === "session-change" ? "session-change" : "candle-body",
                  })}
                />
              </SettingsRow>
            </>
          )}

          {activeTab === "indicators" && (
            <>
              <SectionTitle>Moyennes mobiles</SectionTitle>
              <SettingsRow label="SMA 1">
                <SettingsNumber
                  value={indicatorPeriods.sma1}
                  min={1}
                  max={300}
                  ariaLabel="Periode SMA 1"
                  onChange={(sma1) => dispatch(setIndicatorPeriods({ ...indicatorPeriods, sma1 }))}
                />
              </SettingsRow>
              <SettingsRow label="SMA 2">
                <SettingsNumber
                  value={indicatorPeriods.sma2}
                  min={1}
                  max={300}
                  ariaLabel="Periode SMA 2"
                  onChange={(sma2) => dispatch(setIndicatorPeriods({ ...indicatorPeriods, sma2 }))}
                />
              </SettingsRow>
              <SettingsRow label="SMA 3">
                <SettingsNumber
                  value={indicatorPeriods.sma3}
                  min={1}
                  max={300}
                  ariaLabel="Periode SMA 3"
                  onChange={(sma3) => dispatch(setIndicatorPeriods({ ...indicatorPeriods, sma3 }))}
                />
              </SettingsRow>
              <SectionTitle>Oscillateurs</SectionTitle>
              <SettingsRow label="RSI">
                <SettingsNumber
                  value={indicatorPeriods.rsiPeriod}
                  min={2}
                  max={100}
                  ariaLabel="Periode RSI"
                  onChange={(rsiPeriod) => dispatch(setIndicatorPeriods({ ...indicatorPeriods, rsiPeriod }))}
                />
              </SettingsRow>
            </>
          )}
        </div>
      </div>
    </BaseModal>
  );
};
