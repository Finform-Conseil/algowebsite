// ================================================================================
// FICHIER : src/core/presentation/components/pages/Widget/TechnicalAnalysis/components/modals/IndicatorsModal.tsx
// [TENOR 2026 FIX] SCAR-125: Restored SMA/EMA toggles. Migrated to Smart Component.
// [TENOR 2026 FIX] SCAR-126: Premium UI Overhaul. Fixed overlapping cards and removed native checkboxes.
// ================================================================================

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { BaseModal } from "../common/BaseModal";
import { AdvancedIndicatorsState } from "../../config/TechnicalAnalysisTypes";
import {
  selectAdvancedIndicators,
  selectChartConfig,
  selectIndicatorPeriods,
  toggleAdvancedIndicator,
  setChartConfig,
} from "../../store/technicalAnalysisSlice";

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // [TENOR 2026] Soft Deprecation: Props made optional to avoid breaking ModalOrchestrator.
  // This component now reads directly from Redux (Smart Component pattern).
  advancedIndicators?: AdvancedIndicatorsState;
  onToggle?: (indicator: keyof AdvancedIndicatorsState) => void;
}

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const advancedIndicators = useSelector(selectAdvancedIndicators);
  const chartConfig = useSelector(selectChartConfig);
  const indicatorPeriods = useSelector(selectIndicatorPeriods);

  const classicIndicators = [
    { id: "rsi", name: "RSI", desc: "Relative Strength Index" },
    { id: "macd", name: "MACD", desc: "Moving Average Convergence Divergence" },
    { id: "bollinger", name: "Bollinger Bands", desc: "Bandes de Bollinger" },
    { id: "stochastic", name: "Stochastic", desc: "Oscillateur Stochastique" },
    { id: "atr", name: "ATR", desc: "Average True Range" },
    { id: "cci", name: "CCI", desc: "Commodity Channel Index" },
  ];

  const newIndicators = [
    { id: "williamsR", name: "Williams %R", desc: "Momentum — Surachat/Survente (-100 à 0)" },
    { id: "roc", name: "ROC", desc: "Rate of Change — Vélocité du prix (%)" },
    { id: "obv", name: "OBV", desc: "On Balance Volume — Confirmation volume-prix" },
  ];

  // --- HANDLERS ---

  const handleToggleMA = (type: "sma" | "ema", period: number) => {
    const activeArray = type === "sma" ? chartConfig.indicators.activeSma : chartConfig.indicators.activeEma;
    const safeArray = activeArray || [];
    
    const newArray = safeArray.includes(period)
      ? safeArray.filter((p) => p !== period)
      : [...safeArray, period];

    dispatch(
      setChartConfig({
        indicators: {
          ...chartConfig.indicators,
          [type === "sma" ? "activeSma" : "activeEma"]: newArray,
          // Ensure the master switch is ON if we add an indicator
          [type]: newArray.length > 0 ? true : chartConfig.indicators[type as "sma" | "ema"],
        },
      })
    );
  };

  const handleToggleAdvanced = (ind: keyof AdvancedIndicatorsState) => {
    dispatch(toggleAdvancedIndicator(ind));
  };

  // --- RENDER HELPERS (PREMIUM UI) ---

  const renderMACard = (type: "sma" | "ema", period: number, label: string, color: string) => {
    const activeArray = type === "sma" ? chartConfig.indicators.activeSma : chartConfig.indicators.activeEma;
    const isActive = (activeArray || []).includes(period);

    return (
      // [TENOR 2026 FIX] Added p-1 to force absolute spacing between columns
      <div className="col-md-4 col-6 p-1" key={`${type}-${period}`}>
        <div
          className="d-flex align-items-center p-2 rounded h-100"
          style={{
            border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.08)'}`,
            cursor: "pointer",
            // 1A is ~10% opacity in hex, creating a subtle glow of the indicator's color
            backgroundColor: isActive ? `${color}1A` : "rgba(0,0,0,0.2)",
            transition: "all 0.2s ease"
          }}
          onClick={() => handleToggleMA(type, period)}
        >
          {/* Custom Checkbox */}
          <div 
            className="d-flex align-items-center justify-content-center me-2 flex-shrink-0" 
            style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '4px', 
              border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.2)'}`,
              backgroundColor: isActive ? color : 'transparent',
              transition: "all 0.2s ease"
            }}
          >
            {isActive && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          
          <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}></span>
            <strong className="text-truncate" style={{ color: isActive ? '#fff' : '#a0aec0', fontSize: "12px" }}>
              {label}
            </strong>
          </div>
        </div>
      </div>
    );
  };

  const renderIndicatorCard = (ind: { id: string; name: string; desc: string }) => {
    const isActive = !!advancedIndicators[ind.id as keyof AdvancedIndicatorsState];
    const activeColor = "#2962ff"; // TradingView Blue

    return (
      // [TENOR 2026 FIX] Added p-1 to force absolute spacing
      <div className="col-md-6 p-1" key={ind.id}>
        <div
          className="d-flex align-items-center p-3 rounded h-100"
          style={{
            border: `1px solid ${isActive ? activeColor : 'rgba(255,255,255,0.08)'}`,
            cursor: "pointer",
            backgroundColor: isActive ? "rgba(41, 98, 255, 0.1)" : "rgba(0,0,0,0.2)",
            transition: "all 0.2s ease"
          }}
          onClick={() => handleToggleAdvanced(ind.id as keyof AdvancedIndicatorsState)}
        >
          {/* Custom Checkbox */}
          <div 
            className="d-flex align-items-center justify-content-center me-3 flex-shrink-0" 
            style={{ 
              width: '18px', 
              height: '18px', 
              borderRadius: '4px', 
              border: `1px solid ${isActive ? activeColor : 'rgba(255,255,255,0.2)'}`,
              backgroundColor: isActive ? activeColor : 'transparent',
              transition: "all 0.2s ease"
            }}
          >
            {isActive && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>

          <div className="flex-grow-1 min-w-0 overflow-hidden">
            <strong className="d-block text-truncate" style={{ color: isActive ? '#fff' : '#a0aec0', fontSize: "13px" }}>
              {ind.name}
            </strong>
            <small className="text-secondary d-block text-truncate" style={{ fontSize: "11px", marginTop: "2px" }}>
              {ind.desc}
            </small>
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Indicateurs Techniques"
      icon={<i className="bi bi-activity me-2"></i>}
      primaryLabel="Appliquer"
      primaryAction={onClose}
      secondaryLabel="Fermer"
      maxWidth="750px"
    >
      {/* --- SECTION 1: MOYENNES MOBILES --- */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3 px-1">
          <div
            style={{
              width: "3px",
              height: "16px",
              background: "linear-gradient(180deg, #ff9800, #ff5252)",
              borderRadius: "2px",
              marginRight: "8px",
            }}
          />
          <small className="text-secondary fw-semibold" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "10px" }}>
            Moyennes Mobiles
          </small>
        </div>
        {/* [TENOR 2026 FIX] mx-0 removes negative margins that cause horizontal scroll/overlap */}
        <div className="row mx-0">
          {renderMACard("sma", indicatorPeriods.sma1, `SMA ${indicatorPeriods.sma1}`, "#45c3a1")}
          {renderMACard("sma", indicatorPeriods.sma2, `SMA ${indicatorPeriods.sma2}`, "#f06467")}
          {renderMACard("sma", indicatorPeriods.sma3, `SMA ${indicatorPeriods.sma3}`, "#FF9F04")}
          {renderMACard("sma", 50, "SMA 50", "#2E93fA")}
          {renderMACard("sma", 200, "SMA 200", "#66DA26")}
          {renderMACard("ema", 5, "EMA 5", "#9C27B0")}
          {renderMACard("ema", 10, "EMA 10", "#E91E63")}
        </div>
      </div>

      {/* --- SECTION 2: OSCILLATEURS CLASSIQUES --- */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3 px-1">
          <div
            style={{
              width: "3px",
              height: "16px",
              background: "linear-gradient(180deg, #2962ff, #00bcd4)",
              borderRadius: "2px",
              marginRight: "8px",
            }}
          />
          <small className="text-secondary fw-semibold" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "10px" }}>
            Oscillateurs Classiques
          </small>
        </div>
        <div className="row mx-0">
          {classicIndicators.map(renderIndicatorCard)}
        </div>
      </div>

      {/* --- SECTION 3: MOMENTUM & VOLUME --- */}
      <div className="mt-4">
        <div className="d-flex align-items-center mb-3 px-1">
          <div
            style={{
              width: "3px",
              height: "16px",
              background: "linear-gradient(180deg, #9c27b0, #e91e63)",
              borderRadius: "2px",
              marginRight: "8px",
            }}
          />
          <small className="text-secondary fw-semibold" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "10px" }}>
            Momentum &amp; Volume
          </small>
        </div>
        <div className="row mx-0">
          {newIndicators.map(renderIndicatorCard)}
        </div>
      </div>
    </BaseModal>
  );
};

// --- EOF ---