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
    <div className="gp-settings-field-row">
      <label htmlFor={inputId} className="gp-label-premium">{label}</label>
      <input
        id={inputId}
        type="number"
        className="gp-input-premium gp-settings-control gp-settings-number-control"
        style={{ width }}
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
    <div className="gp-settings-field-row">
      {label && <label htmlFor={inputId} className="gp-label-premium">{label}</label>}
      <input
        id={inputId}
        type="color"
        value={value}
        aria-label={label || "Couleur"}
        onChange={(e) => onChange(e.target.value)}
        className="gp-settings-color-control"
        style={{ height }}
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
    <div className="gp-settings-field-row">
      <span className="gp-label-premium">{label}</span>
      <div className="gp-settings-inline-controls">
        <div
          id={enabledId}
          className={`gp-settings-check-control ${enabled ? "is-checked" : ""}`}
          onClick={() => onEnabledChange(!enabled)}
          role="checkbox"
          aria-label={`${label} actif`}
          aria-checked={enabled}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEnabledChange(!enabled); } }}
        >
          {enabled && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          className="gp-settings-color-control gp-settings-color-control--compact"
        />
        <input
          id={opacityId}
          type="range"
          min="0"
          max="1"
          step={opacityStep}
          value={opacity}
          aria-label={`${label} opacité`}
          className="gp-settings-range"
          style={{ width: opacitySliderWidth }}
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
    <div className="gp-settings-field-row">
      {label && <label htmlFor={selectId} className="gp-label-premium">{label}</label>}
      <select
        id={selectId}
        className="gp-input-premium gp-settings-control gp-settings-select-control"
        value={value}
        aria-label={label || "Option"}
        style={{ width }}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
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
      className="gp-settings-field-row gp-settings-checkbox-row"
      onClick={() => onChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      aria-labelledby={labelId}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(!checked); } }}
    >
      <span id={labelId} className="gp-label-premium">{label}</span>
      <div
        className={`gp-settings-check-control ${checked ? "is-checked" : ""}`}
        aria-hidden="true"
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
        className="gp-input-premium gp-settings-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        aria-label={label || placeholder || "Texte"}
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
      className={`gp-settings-toggle-row ${disabled ? "is-disabled" : ""}`}
      onClick={() => !disabled && onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-labelledby={labelId}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onChange(!checked); } }}
    >
      <span id={labelId} className="gp-settings-toggle-label">
        {label}
      </span>
      <div className={`gp-settings-toggle ${checked ? "is-checked" : ""} ${theme === "light" ? "is-light" : ""}`} aria-hidden="true">
        <div className="gp-settings-toggle-knob" />
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
  <div className="gp-settings-inline-controls gp-settings-inline-controls--compact">
    <input
      type="color"
      value={color}
      aria-label="Couleur"
      onChange={(e) => onColorChange(e.target.value)}
      className="gp-settings-color-control gp-settings-color-control--compact"
    />
    <input
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={opacity}
      aria-label="Opacité"
      className="gp-settings-range gp-settings-range--compact"
      onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
    />
  </div>
);
