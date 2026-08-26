import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BaseModal } from "../../common/primitives/BaseModal";
import {
  SettingsCheckbox,
  SettingsColorOpacityInput,
  SettingsNumberInput,
  SettingsSelectInput,
} from "../../common/inputs/SettingsField";
import {
  setAdvancedIndicators,
  setBollingerSettings,
  setChartConfig,
  setIndicatorPeriods,
} from "../../../store/technicalAnalysisSlice";
import { selectBollingerSettings, selectChartConfig, selectIndicatorPeriods } from "../../../store/selectors";
import type { BollingerSettings } from "../../../config/indicators/advancedIndicatorsTypes";
import { normalizeMovingAveragePeriods } from "../../../config/indicators/movingAverageSeries";
import type { IndicatorConfigurationTarget } from "../../../config/indicators/indicatorConfigurationTarget";

interface IndicatorConfigurationModalProps {
  isOpen: boolean;
  target: IndicatorConfigurationTarget | null;
  onClose: () => void;
}

const clampInteger = (value: number, min: number, max: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
};

const clampNumber = (value: number, min: number, max: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

const ConfigurationHeader = ({ target }: { target: IndicatorConfigurationTarget }) => (
  <div className="gp-indicator-config-intro">
    <span className="gp-indicator-config-intro__eyebrow">Configuration ciblée</span>
    <strong>{target.label}</strong>
    <small>
      Double-clic depuis une série active pour revenir exactement sur cet indicateur.
    </small>
  </div>
);

const UnsupportedConfiguration = ({ target }: { target: IndicatorConfigurationTarget }) => (
  <div className="gp-indicator-config-unavailable" role="status">
    <span className="gp-indicator-config-unavailable__icon" aria-hidden="true">
      <i className="bi bi-sliders2-vertical" />
    </span>
    <div>
      <strong>Paramètres natifs non exposés</strong>
      <p>
        Le moteur rend {target.label}, mais son contrat actuel ne publie pas encore de métriques
        éditables pour cette série. Aucun champ fictif n’est affiché.
      </p>
    </div>
  </div>
);

export const IndicatorConfigurationModal: React.FC<IndicatorConfigurationModalProps> = ({
  isOpen,
  target,
  onClose,
}) => {
  const dispatch = useDispatch();
  const chartConfig = useSelector(selectChartConfig);
  const indicatorPeriods = useSelector(selectIndicatorPeriods);
  const currentBollingerSettings = useSelector(selectBollingerSettings);
  const [periodDraft, setPeriodDraft] = useState(14);
  const [bollingerDraft, setBollingerDraft] = useState<BollingerSettings>(currentBollingerSettings);

  useEffect(() => {
    if (!target) return;
    const initialPeriod = target.kind === "rsi"
      ? indicatorPeriods.rsiPeriod
      : target.period ?? (target.kind === "bollinger" ? currentBollingerSettings.length : 20);
    setPeriodDraft(initialPeriod);
    setBollingerDraft(currentBollingerSettings);
  }, [currentBollingerSettings, indicatorPeriods.rsiPeriod, target]);

  const supportsNativeSettings = target?.kind === "sma"
    || target?.kind === "ema"
    || target?.kind === "rsi"
    || target?.kind === "bollinger";
  const modalTitle = target ? `Configurer ${target.label}` : "Configuration de l’indicateur";
  const primaryLabel = supportsNativeSettings ? "Enregistrer" : "Fermer";

  const bollingerSourceOptions = useMemo(() => [
    { value: "close", label: "Clôture" },
    { value: "open", label: "Ouverture" },
    { value: "hl2", label: "HL2" },
    { value: "hlc3", label: "HLC3" },
    { value: "ohlc4", label: "OHLC4" },
  ], []);

  const handleSave = () => {
    if (!target || !supportsNativeSettings) {
      onClose();
      return;
    }

    if (target.kind === "sma" || target.kind === "ema") {
      const nextPeriod = clampInteger(periodDraft, 1, 500, target.period ?? 20);
      const indicatorKey = target.kind === "sma" ? "activeSma" : "activeEma";
      const enabledKey = target.kind;
      const currentPeriods = chartConfig.indicators[indicatorKey] ?? [];
      const nextPeriods = normalizeMovingAveragePeriods([
        ...currentPeriods.filter((period) => period !== target.period),
        nextPeriod,
      ]);
      dispatch(setChartConfig({
        indicators: {
          ...chartConfig.indicators,
          [indicatorKey]: nextPeriods,
          [enabledKey]: nextPeriods.length > 0,
        },
      }));
    } else if (target.kind === "rsi") {
      dispatch(setIndicatorPeriods({
        rsiPeriod: clampInteger(periodDraft, 2, 100, indicatorPeriods.rsiPeriod),
      }));
      dispatch(setAdvancedIndicators({ rsi: true }));
    } else if (target.kind === "bollinger") {
      dispatch(setBollingerSettings({
        ...bollingerDraft,
        length: clampInteger(bollingerDraft.length, 2, 500, currentBollingerSettings.length),
        multiplier: clampNumber(bollingerDraft.multiplier, 0.1, 10, currentBollingerSettings.multiplier),
        offset: clampInteger(bollingerDraft.offset, -100, 100, currentBollingerSettings.offset),
        fillOpacity: clampNumber(bollingerDraft.fillOpacity, 0, 1, currentBollingerSettings.fillOpacity),
      }));
      dispatch(setAdvancedIndicators({ bollinger: true }));
    }

    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen && target !== null}
      onClose={onClose}
      title={modalTitle}
      icon="bi-sliders2-vertical"
      primaryLabel={primaryLabel}
      primaryAction={handleSave}
      secondaryLabel={supportsNativeSettings ? "Annuler" : undefined}
      secondaryAction={supportsNativeSettings ? onClose : undefined}
      maxWidth="480px"
      className="gp-indicator-configuration-modal"
    >
      {target && <ConfigurationHeader target={target} />}

      {target?.kind === "sma" || target?.kind === "ema" ? (
        <div className="gp-indicator-config-fields">
          <SettingsNumberInput
            label="Période"
            value={periodDraft}
            min={1}
            max={500}
            step={1}
            onChange={setPeriodDraft}
          />
          <small className="gp-indicator-config-help">
            La modification remplace la période ciblée dans le tableau des séries actives.
          </small>
        </div>
      ) : null}

      {target?.kind === "rsi" ? (
        <div className="gp-indicator-config-fields">
          <SettingsNumberInput
            label="Période RSI"
            value={periodDraft}
            min={2}
            max={100}
            step={1}
            onChange={setPeriodDraft}
          />
          <small className="gp-indicator-config-help">
            La nouvelle période est appliquée au panneau RSI actif.
          </small>
        </div>
      ) : null}

      {target?.kind === "bollinger" ? (
        <div className="gp-indicator-config-fields">
          <SettingsNumberInput
            label="Longueur"
            value={bollingerDraft.length}
            min={2}
            max={500}
            step={1}
            onChange={(value) => setBollingerDraft((current) => ({ ...current, length: value }))}
          />
          <SettingsSelectInput
            label="Source"
            value={bollingerDraft.source}
            options={bollingerSourceOptions}
            onChange={(value) => setBollingerDraft((current) => ({ ...current, source: value as BollingerSettings["source"] }))}
          />
          <SettingsNumberInput
            label="Multiplicateur"
            value={bollingerDraft.multiplier}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(value) => setBollingerDraft((current) => ({ ...current, multiplier: value }))}
          />
          <SettingsNumberInput
            label="Décalage"
            value={bollingerDraft.offset}
            min={-100}
            max={100}
            step={1}
            onChange={(value) => setBollingerDraft((current) => ({ ...current, offset: value }))}
          />
          <SettingsCheckbox label="Bande supérieure" checked={bollingerDraft.showUpper} onChange={(value) => setBollingerDraft((current) => ({ ...current, showUpper: value }))} />
          <SettingsCheckbox label="Bande médiane" checked={bollingerDraft.showMiddle} onChange={(value) => setBollingerDraft((current) => ({ ...current, showMiddle: value }))} />
          <SettingsCheckbox label="Bande inférieure" checked={bollingerDraft.showLower} onChange={(value) => setBollingerDraft((current) => ({ ...current, showLower: value }))} />
          <SettingsCheckbox label="Remplissage" checked={bollingerDraft.showFill} onChange={(value) => setBollingerDraft((current) => ({ ...current, showFill: value }))} />
          <SettingsColorOpacityInput color={bollingerDraft.upperColor} opacity={1} onColorChange={(value) => setBollingerDraft((current) => ({ ...current, upperColor: value }))} onOpacityChange={() => undefined} />
          <SettingsColorOpacityInput color={bollingerDraft.middleColor} opacity={1} onColorChange={(value) => setBollingerDraft((current) => ({ ...current, middleColor: value }))} onOpacityChange={() => undefined} />
          <SettingsColorOpacityInput color={bollingerDraft.lowerColor} opacity={1} onColorChange={(value) => setBollingerDraft((current) => ({ ...current, lowerColor: value }))} onOpacityChange={() => undefined} />
          <SettingsColorOpacityInput color={bollingerDraft.fillColor} opacity={bollingerDraft.fillOpacity} onColorChange={(value) => setBollingerDraft((current) => ({ ...current, fillColor: value }))} onOpacityChange={(value) => setBollingerDraft((current) => ({ ...current, fillOpacity: value }))} />
        </div>
      ) : null}

      {target?.kind === "advanced" && <UnsupportedConfiguration target={target} />}
    </BaseModal>
  );
};

IndicatorConfigurationModal.displayName = "IndicatorConfigurationModal";
