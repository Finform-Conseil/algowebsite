import React, { useId } from "react";

const parseSettingsNumberValue = (value: string, emptyValue: number) => {
  if (value.trim() === "") {
    return emptyValue;
  }

  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : emptyValue;
};

interface SettingsNumberInputProps {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  step?: number | string;
  width?: string;
  min?: number;
  max?: number;
  emptyValue?: number;
}

export const SettingsNumberInput: React.FC<SettingsNumberInputProps> = ({
  label,
  value,
  onChange,
  step,
  width = "80px",
  min,
  max,
  emptyValue = 0,
}) => {
  const inputId = useId();

  return (
    <div className="d-flex justify-content-between align-items-center">
      <label htmlFor={inputId} className="gp-label-premium" style={{ marginBottom: 0 }}>{label}</label>
      <input
        id={inputId}
        type="number"
        className="gp-input-premium"
        style={{ width, padding: "4px 8px", height: "28px" }}
        value={value === undefined || value === null || (typeof value === "number" && isNaN(value)) ? "" : value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(parseSettingsNumberValue(e.target.value, emptyValue))}
      />
    </div>
  );
};

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
}) => {
  const inputId = useId();

  return (
    <div className="d-flex justify-content-between align-items-center">
      {label && <label htmlFor={inputId} className="gp-label-premium" style={{ marginBottom: 0 }}>{label}</label>}
      <input
        id={inputId}
        type="color"
        value={value}
        aria-label={label || "Couleur"}
        onChange={(e) => onChange(e.target.value)}
        style={{ height, width: "40px", padding: 0, border: "none", cursor: "pointer", borderRadius: "4px", backgroundColor: "transparent" }}
      />
    </div>
  );
};

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
}) => {
  const enabledId = useId();
  const colorId = useId();
  const opacityId = useId();

  return (
    <div className="d-flex justify-content-between align-items-center">
      <span className="gp-label-premium" style={{ marginBottom: 0 }}>{label}</span>
      <div className="d-flex align-items-center gap-2">
        <div
          id={enabledId}
          className="d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "4px",
            border: `1px solid ${enabled ? "#2962ff" : "rgba(255,255,255,0.2)"}`,
            backgroundColor: enabled ? "#2962ff" : "transparent",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onClick={() => onEnabledChange(!enabled)}
          role="checkbox"
          aria-label={`${label} actif`}
          aria-checked={enabled}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEnabledChange(!enabled); } }}
        >
          {enabled && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </div>
        <input
          id={colorId}
          type="color"
          value={color}
          aria-label={`${label} couleur`}
          onChange={(e) => onColorChange(e.target.value)}
          style={{ height: "24px", width: "24px", padding: 0, border: "none", cursor: "pointer", borderRadius: "4px", backgroundColor: "transparent" }}
        />
        <input
          id={opacityId}
          type="range"
          min="0"
          max="1"
          step={opacityStep}
          value={opacity}
          aria-label={`${label} opacité`}
          style={{ width: opacitySliderWidth, accentColor: "#2962ff", cursor: "pointer" }}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
};

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
}) => {
  const selectId = useId();

  return (
    <div className="d-flex justify-content-between align-items-center">
      {label && <label htmlFor={selectId} className="gp-label-premium" style={{ marginBottom: 0 }}>{label}</label>}
      <select
        id={selectId}
        className="gp-input-premium"
        value={value}
        aria-label={label || "Option"}
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
};

interface SettingsCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SettingsCheckbox: React.FC<SettingsCheckboxProps> = ({
  label,
  checked,
  onChange,
}) => {
  const labelId = useId();

  return (
    <div
      className="d-flex justify-content-between align-items-center"
      style={{ cursor: "pointer" }}
      onClick={() => onChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      aria-labelledby={labelId}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(!checked); } }}
    >
      <span id={labelId} className="gp-label-premium" style={{ cursor: "pointer", marginBottom: 0, pointerEvents: "none" }}>{label}</span>
      <div
        className="d-flex align-items-center justify-content-center flex-shrink-0"
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "4px",
          border: `1px solid ${checked ? "#2962ff" : "rgba(255,255,255,0.2)"}`,
          backgroundColor: checked ? "#2962ff" : "transparent",
          transition: "all 0.2s ease",
        }}
        aria-hidden="true"
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </div>
    </div>
  );
};

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
}, ref) => {
  const textareaId = useId();

  return (
    <div className="mb-3">
      {label && <label htmlFor={textareaId} className="gp-label-premium">{label}</label>}
      <textarea
        id={textareaId}
        ref={ref}
        className="gp-input-premium"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        aria-label={label || placeholder || "Texte"}
        style={{ width: "100%", outline: "none", resize: "vertical" }}
      />
    </div>
  );
});
SettingsTextArea.displayName = "SettingsTextArea";

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
}) => {
  const labelId = useId();

  return (
    <div
      className="d-flex justify-content-between align-items-center p-0 mb-2"
      style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
      onClick={() => !disabled && onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-labelledby={labelId}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onChange(!checked); } }}
    >
      <span id={labelId} className={`small ${theme === "light" ? "text-dark" : "text-white"}`} style={{ cursor: "inherit", fontWeight: theme === "light" ? 400 : 500, marginBottom: 0, pointerEvents: "none" }}>
        {label}
      </span>
      <div style={{
        width: "36px",
        height: "20px",
        borderRadius: "10px",
        backgroundColor: checked ? "#2962ff" : (theme === "light" ? "#e0e3eb" : "rgba(255,255,255,0.1)"),
        position: "relative",
        transition: "background-color 0.2s ease",
      }} aria-hidden="true">
        <div style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          position: "absolute",
          top: "2px",
          left: checked ? "18px" : "2px",
          transition: "left 0.2s ease",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }} />
      </div>
    </div>
  );
};

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
      aria-label="Couleur"
      onChange={(e) => onColorChange(e.target.value)}
      style={{ height: "24px", width: "24px", padding: 0, border: "none", cursor: "pointer", borderRadius: "4px", backgroundColor: "transparent" }}
    />
    <input
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={opacity}
      aria-label="Opacité"
      style={{ width: "40px", accentColor: "#2962ff", cursor: "pointer" }}
      onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
    />
  </div>
);
