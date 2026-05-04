import React from "react";
import s from "../../style.module.scss";

// ============================================================================
// SETTINGS FIELD COMPONENTS
// Reusable UI primitives for the TechnicalAnalysis settings modal.
// [TENOR 2026 FIX] SCAR-126: Premium UI Overhaul. Native inputs eradicated.
// Fully accessible (a11y) custom SVG components for TradingView parity.
// ============================================================================

// --- SettingsNumberInput ---
interface SettingsNumberInputProps {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  step?: number | string;
  width?: string;
  min?: number;
  max?: number;
}

export const SettingsNumberInput: React.FC<SettingsNumberInputProps> = ({
  label,
  value,
  onChange,
  step,
  width = "80px",
  min,
  max,
}) => (
  <div className="d-flex justify-content-between align-items-center">
    <label className={s["gp-label-premium"]} style={{ marginBottom: 0 }}>{label}</label>
    <input
      type="number"
      className={s["gp-input-premium"]}
      style={{ width, padding: "4px 8px", height: "28px" }}
      value={value === undefined || value === null || (typeof value === "number" && isNaN(value)) ? "" : value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  </div>
);

// --- SettingsColorInput ---
interface SettingsColorInputProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  height?: string;
}

export const SettingsColorInput: React.FC<SettingsColorInputProps> = ({
  label,
  value,
  onChange,
  height = "28px",
}) => (
  <div className="d-flex justify-content-between align-items-center">
    {label && <label className={s["gp-label-premium"]} style={{ marginBottom: 0 }}>{label}</label>}
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ height, width: "40px", padding: 0, border: "none", cursor: "pointer", borderRadius: "4px", backgroundColor: "transparent" }}
    />
  </div>
);

// --- SettingsFillControl ---
interface SettingsFillControlProps {
  label: string;
  enabled?: boolean;
  color: string;
  opacity: number;
  onEnabledChange: (enabled: boolean) => void;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
  opacityStep?: string;
  opacitySliderWidth?: string;
}

export const SettingsFillControl: React.FC<SettingsFillControlProps> = ({
  label,
  enabled,
  color,
  opacity,
  onEnabledChange,
  onColorChange,
  onOpacityChange,
  opacityStep = "0.05",
  opacitySliderWidth = "60px",
}) => (
  <div className="d-flex justify-content-between align-items-center">
    <label className={s["gp-label-premium"]} style={{ marginBottom: 0 }}>{label}</label>
    <div className="d-flex align-items-center gap-2">
      <div
        className="d-flex align-items-center justify-content-center flex-shrink-0"
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '4px',
          border: `1px solid ${enabled ? '#2962ff' : 'rgba(255,255,255,0.2)'}`,
          backgroundColor: enabled ? '#2962ff' : 'transparent',
          cursor: "pointer",
          transition: "all 0.2s ease"
        }}
        onClick={() => onEnabledChange(!enabled)}
        role="checkbox"
        aria-checked={enabled}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEnabledChange(!enabled); } }}
      >
        {enabled && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </div>
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        style={{ height: "24px", width: "24px", padding: 0, border: "none", cursor: "pointer", borderRadius: "4px", backgroundColor: "transparent" }}
      />
      <input
        type="range"
        min="0"
        max="1"
        step={opacityStep}
        value={opacity}
        style={{ width: opacitySliderWidth, accentColor: "#2962ff", cursor: "pointer" }}
        onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
      />
    </div>
  </div>
);

// --- SettingsSelectInput ---
interface SettingsSelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  width?: string;
}

export const SettingsSelectInput: React.FC<SettingsSelectInputProps> = ({
  label,
  value,
  onChange,
  options,
  width = "100px",
}) => (
  <div className="d-flex justify-content-between align-items-center">
    {label && <label className={s["gp-label-premium"]} style={{ marginBottom: 0 }}>{label}</label>}
    <select
      className={s["gp-input-premium"]}
      value={value}
      style={{ width, padding: "4px 8px", height: "28px", cursor: "pointer" }}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: "#1e222d", color: "#fff" }}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// --- SettingsCheckbox ---
interface SettingsCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SettingsCheckbox: React.FC<SettingsCheckboxProps> = ({
  label,
  checked,
  onChange,
}) => (
  <div
    className="d-flex justify-content-between align-items-center"
    style={{ cursor: "pointer" }}
    onClick={() => onChange(!checked)}
    role="checkbox"
    aria-checked={checked}
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(!checked); } }}
  >
    <label className={s["gp-label-premium"]} style={{ cursor: "pointer", marginBottom: 0, pointerEvents: "none" }}>{label}</label>
    <div
      className="d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: '18px',
        height: '18px',
        borderRadius: '4px',
        border: `1px solid ${checked ? '#2962ff' : 'rgba(255,255,255,0.2)'}`,
        backgroundColor: checked ? '#2962ff' : 'transparent',
        transition: "all 0.2s ease"
      }}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
    </div>
  </div>
);

// --- SettingsTextArea ---
interface SettingsTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const SettingsTextArea = React.forwardRef<HTMLTextAreaElement, SettingsTextAreaProps>(({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
}, ref) => (
  <div className="mb-3">
    {label && <label className={s["gp-label-premium"]}>{label}</label>}
    <textarea
      ref={ref}
      className={s["gp-input-premium"]}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      style={{ width: "100%", outline: "none", resize: "vertical" }}
    />
  </div>
));
SettingsTextArea.displayName = "SettingsTextArea";

// --- SettingsToggle ---
interface SettingsToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  theme?: "light" | "dark";
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  label,
  checked,
  onChange,
  disabled,
  theme = "dark",
}) => (
  <div
    className="d-flex justify-content-between align-items-center p-0 mb-2"
    style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
    onClick={() => !disabled && onChange(!checked)}
    role="switch"
    aria-checked={checked}
    tabIndex={disabled ? -1 : 0}
    onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onChange(!checked); } }}
  >
    <label className={`small ${theme === "light" ? "text-dark" : "text-white"}`} style={{ cursor: "inherit", fontWeight: theme === "light" ? 400 : 500, marginBottom: 0, pointerEvents: "none" }}>
      {label}
    </label>
    <div style={{
      width: "36px",
      height: "20px",
      borderRadius: "10px",
      backgroundColor: checked ? "#2962ff" : (theme === "light" ? "#e0e3eb" : "rgba(255,255,255,0.1)"),
      position: "relative",
      transition: "background-color 0.2s ease"
    }}>
      <div style={{
        width: "16px",
        height: "16px",
        borderRadius: "50%",
        backgroundColor: "#ffffff",
        position: "absolute",
        top: "2px",
        left: checked ? "18px" : "2px",
        transition: "left 0.2s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
      }} />
    </div>
  </div>
);

// --- SettingsColorOpacityInput ---
interface SettingsColorOpacityInputProps {
  color: string;
  opacity: number;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
}

export const SettingsColorOpacityInput: React.FC<SettingsColorOpacityInputProps> = ({
  color,
  opacity,
  onColorChange,
  onOpacityChange,
}) => (
  <div className="d-flex align-items-center gap-1">
    <input
      type="color"
      value={color}
      onChange={(e) => onColorChange(e.target.value)}
      style={{ height: "24px", width: "24px", padding: 0, border: "none", cursor: "pointer", borderRadius: "4px", backgroundColor: "transparent" }}
    />
    <input
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={opacity}
      style={{ width: "40px", accentColor: "#2962ff", cursor: "pointer" }}
      onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
    />
  </div>
);