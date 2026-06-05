"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { BaseModal } from "../../common/primitives/BaseModal";
import {
  createDefaultCompareSeriesSettings,
  normalizeCompareSeriesSettings,
  normalizeCompareSymbol,
  type CompareSeriesLineStyle,
  type CompareSeriesOverrideMinTick,
  type CompareSeriesPriceSource,
  type CompareSeriesSettings,
  type CompareSeriesVisibilityKey,
  type CompareSeriesVisibilityRange,
} from "../../../config/compare-series/compareSeries";
import { setComparisonSeriesSettings } from "../../../store/technicalAnalysisSlice";
import {
  clampInteger,
  COMPARE_SETTINGS_TABS,
  LINE_STYLE_OPTIONS,
  normalizeRangePatch,
  OVERRIDE_TICK_OPTIONS,
  PRICE_SOURCE_OPTIONS,
  type CompareSettingsTab,
  VISIBILITY_ROWS,
} from "./compareSeriesSettings.helpers";

export type CompareSeriesSettingsModalProps = {
  isOpen: boolean;
  symbol: string | null;
  primarySymbol: string;
  fallbackColor: string;
  settings?: CompareSeriesSettings;
  onClose: () => void;
};

export const CompareSeriesSettingsModal: React.FC<CompareSeriesSettingsModalProps> = ({
  isOpen,
  symbol,
  primarySymbol,
  fallbackColor,
  settings,
  onClose,
}) => {
  const dispatch = useDispatch();
  const normalizedSymbol = useMemo(() => normalizeCompareSymbol(symbol ?? ""), [symbol]);
  const defaultSettings = useMemo(
    () => createDefaultCompareSeriesSettings(fallbackColor),
    [fallbackColor]
  );
  const resolvedSettings = useMemo(
    () => normalizeCompareSeriesSettings(settings, fallbackColor),
    [fallbackColor, settings]
  );

  const [activeTab, setActiveTab] = useState<CompareSettingsTab>("inputs");
  const [draft, setDraft] = useState<CompareSeriesSettings>(resolvedSettings);

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab("inputs");
    setDraft(resolvedSettings);
  }, [isOpen, resolvedSettings]);

  const patchDraft = (patch: Partial<CompareSeriesSettings>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const patchVisibilityRange = (
    key: CompareSeriesVisibilityKey,
    patch: Partial<CompareSeriesVisibilityRange>,
  ) => {
    setDraft((current) => ({
      ...current,
      visibility: {
        ...current.visibility,
        [key]: normalizeRangePatch(current.visibility[key], patch),
      },
    }));
  };

  const handleDefaults = () => {
    setDraft(defaultSettings);
  };

  const handleConfirm = () => {
    if (!normalizedSymbol) return;
    dispatch(setComparisonSeriesSettings({
      symbol: normalizedSymbol,
      settings: normalizeCompareSeriesSettings(draft, fallbackColor),
    }));
    onClose();
  };

  const footer = (
    <div className="tv-compare-settings__footer">
      <button type="button" className="tv-compare-settings__defaults" onClick={handleDefaults}>
        Defaults
        <i className="bi bi-chevron-down" aria-hidden="true" />
      </button>
      <div className="tv-compare-settings__actions">
        <button type="button" className="tv-compare-settings__cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="tv-compare-settings__ok" onClick={handleConfirm}>
          Ok
        </button>
      </div>
    </div>
  );

  if (!isOpen || !normalizedSymbol) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${normalizedSymbol} · ${primarySymbol || "BRVM"}`}
      maxWidth="438px"
      className="tv-compare-settings"
      footer={footer}
    >
      <div className="tv-compare-settings__tabs" role="tablist" aria-label="Compare series settings">
        {COMPARE_SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "is-active" : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "inputs" && (
        <div className="tv-compare-settings__panel">
          <label className="tv-compare-settings__row">
            <span>Symbol</span>
            <span className="tv-compare-settings__symbol-pill">
              BRVM:{normalizedSymbol}
              <i className="bi bi-pencil" aria-hidden="true" />
            </span>
          </label>
        </div>
      )}

      {activeTab === "style" && (
        <div className="tv-compare-settings__panel tv-compare-settings__panel--style">
          <label className="tv-compare-settings__row">
            <span>Style</span>
            <select value={draft.style} onChange={() => patchDraft({ style: "line" })}>
              <option value="line">Line</option>
            </select>
          </label>

          <label className="tv-compare-settings__row">
            <span>Price source</span>
            <select
              value={draft.priceSource}
              onChange={(event) => patchDraft({ priceSource: event.target.value as CompareSeriesPriceSource })}
            >
              {PRICE_SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div className="tv-compare-settings__row">
            <span>Line</span>
            <div className="tv-compare-settings__line-control">
              <input
                type="color"
                value={draft.color}
                aria-label="Line color"
                onChange={(event) => patchDraft({ color: event.target.value })}
              />
              <span
                className={`tv-compare-settings__line-preview is-${draft.lineStyle}`}
                style={{ borderTopColor: draft.color, borderTopWidth: draft.lineWidth }}
                aria-hidden="true"
              />
            </div>
          </div>

          <label className="tv-compare-settings__row">
            <span>Line style</span>
            <select
              value={draft.lineStyle}
              onChange={(event) => patchDraft({ lineStyle: event.target.value as CompareSeriesLineStyle })}
            >
              {LINE_STYLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="tv-compare-settings__row">
            <span>Line width</span>
            <input
              type="number"
              min={1}
              max={6}
              value={draft.lineWidth}
              onChange={(event) => patchDraft({ lineWidth: clampInteger(Number(event.target.value), 1, 6) })}
            />
          </label>

          <label className="tv-compare-settings__check-row">
            <input
              type="checkbox"
              checked={draft.showPriceLine}
              onChange={(event) => patchDraft({ showPriceLine: event.target.checked })}
            />
            <span>Price line</span>
          </label>

          <label className="tv-compare-settings__row">
            <span>Override min tick</span>
            <select
              value={draft.overrideMinTick}
              onChange={(event) => patchDraft({ overrideMinTick: event.target.value as CompareSeriesOverrideMinTick })}
            >
              {OVERRIDE_TICK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {activeTab === "visibility" && (
        <div className="tv-compare-settings__panel tv-compare-settings__panel--visibility">
          {VISIBILITY_ROWS.map(({ key, label }) => {
            const range = draft.visibility[key];

            return (
              <div key={key} className="tv-compare-settings__visibility-row">
                <label className="tv-compare-settings__check-row">
                  <input
                    type="checkbox"
                    checked={range.enabled}
                    onChange={(event) => patchVisibilityRange(key, { enabled: event.target.checked })}
                  />
                  <span>{label}</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={range.min}
                  disabled={!range.enabled}
                  onChange={(event) => patchVisibilityRange(key, { min: Number(event.target.value) })}
                />
                <div className="tv-compare-settings__range">
                  <input
                    type="range"
                    min={1}
                    max={999}
                    value={range.min}
                    disabled={!range.enabled}
                    onChange={(event) => patchVisibilityRange(key, { min: Number(event.target.value) })}
                  />
                  <input
                    type="range"
                    min={1}
                    max={999}
                    value={range.max}
                    disabled={!range.enabled}
                    onChange={(event) => patchVisibilityRange(key, { max: Number(event.target.value) })}
                  />
                </div>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={range.max}
                  disabled={!range.enabled}
                  onChange={(event) => patchVisibilityRange(key, { max: Number(event.target.value) })}
                />
              </div>
            );
          })}
        </div>
      )}
    </BaseModal>
  );
};

export default CompareSeriesSettingsModal;
