import React, { useState, useRef, useCallback } from "react";

interface ProColorPickerProps {
  color: string;
  opacity?: number;
  onChange: (color: string, alpha: number) => void;
}

/**
 * ProColorPicker - Custom professional-grade color picker.
 * Supports HSVA, RGBA, HEX and real-time interactive picking.
 */
export const ProColorPicker: React.FC<ProColorPickerProps> = ({
  color,
  opacity,
  onChange,
}) => {
  // Tracking props to update internal state if external props change
  const [prevProps, setPrevProps] = useState({ color, opacity });
  const [hsva, setHsva] = useState(() => {
    const rgba = parseToRgba(color);
    return rgbaToHsva(rgba.r, rgba.g, rgba.b, opacity ?? rgba.a);
  });

  // Adjusting state in response to props (React 18 Pattern)
  if (prevProps.color !== color || prevProps.opacity !== opacity) {
    setPrevProps({ color, opacity });
    const rgba = parseToRgba(color);
    const nextHsva = rgbaToHsva(rgba.r, rgba.g, rgba.b, opacity ?? rgba.a);

    // Prevent update loop if color is mathematically equivalent
    const isSame =
      Math.abs(hsva.h - nextHsva.h) < 0.1 &&
      Math.abs(hsva.s - nextHsva.s) < 0.1 &&
      Math.abs(hsva.v - nextHsva.v) < 0.1 &&
      Math.abs(hsva.a - nextHsva.a) < 0.01;

    if (!isSame) {
      setHsva(nextHsva);
    }
  }

  const updateColor = useCallback(
    (newHsva: typeof hsva) => {
      setHsva(newHsva);
      const rgba = hsvaToRgba(newHsva.h, newHsva.s, newHsva.v, newHsva.a);
      const solidHex = rgbaToHex(rgba.r, rgba.g, rgba.b, 1); // Get solid color for the database
      onChange(solidHex, newHsva.a);
    },
    [onChange],
  );

  // --- Handlers ---
  const handleSatValChange = (s: number, v: number) => {
    updateColor({ ...hsva, s, v });
  };

  const handleHueChange = (h: number) => {
    updateColor({ ...hsva, h });
  };

  const handleAlphaChange = (a: number) => {
    updateColor({ ...hsva, a });
  };

  // --- Render Sections ---
  return (
    <div
      style={{
        padding: "4px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "220px",
      }}
    >
      {/* Saturation/Value Square */}
      <SatValSquare
        h={hsva.h}
        s={hsva.s}
        v={hsva.v}
        onChange={handleSatValChange}
      />

      {/* Sliders Area */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <HueSlider h={hsva.h} onChange={handleHueChange} />
        <div
          style={{
            fontSize: "9px",
            color: "#64748b",
            marginTop: "2px",
            marginBottom: "-2px",
          }}
        >
          Opacité
        </div>
        <AlphaSlider
          h={hsva.h}
          s={hsva.s}
          v={hsva.v}
          a={hsva.a}
          onChange={handleAlphaChange}
        />
      </div>

      {/* Inputs Area */}
      <ColorInputs hsva={hsva} onChange={updateColor} />

      {/* Presets Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: "4px",
          marginTop: "4px",
        }}
      >
        {[
          "#2962FF",
          "#00E676",
          "#FF5252",
          "#FFD600",
          "#AB47BC",
          "#FF9100",
          "#00B0FF",
          "#ffffff",
          "#78909c",
          "#37474f",
          "#000000",
          "#ffc107",
          "#9c27b0",
          "#e91e63",
          "#00bcd4",
          "#4caf50",
        ].map((c) => (
          <div
            key={c}
            onClick={() => {
              const rgba = parseToRgba(c);
              // Preserve current alpha when picking a preset!
              const nextHsva = rgbaToHsva(rgba.r, rgba.g, rgba.b, hsva.a);
              updateColor(nextHsva);
            }}
            style={{
              width: "100%",
              aspectRatio: "1",
              backgroundColor: c,
              borderRadius: "2px",
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const SatValSquare: React.FC<{
  h: number;
  s: number;
  v: number;
  onChange: (s: number, v: number) => void;
}> = ({ h, s, v, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    let nextS = (clientX - rect.left) / rect.width;
    let nextV = 1 - (clientY - rect.top) / rect.height;

    nextS = Math.max(0, Math.min(1, nextS));
    nextV = Math.max(0, Math.min(1, nextV));

    onChange(nextS, nextV);
  };

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    handleMove(e.nativeEvent);
    const up = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", up);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      style={{
        width: "100%",
        height: "110px",
        borderRadius: "4px",
        position: "relative",
        cursor: "crosshair",
        backgroundColor: `hsl(${h}, 100%, 50%)`,
        backgroundImage:
          "linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${s * 100}%`,
          top: `${(1 - v) * 100}%`,
          width: "10px",
          height: "10px",
          border: "2px solid white",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 2px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
};

const HueSlider: React.FC<{ h: number; onChange: (h: number) => void }> = ({
  h,
  onChange,
}) => {
  return (
    <input
      type="range"
      min="0"
      max="360"
      value={h}
      onChange={(e) => onChange(parseInt(e.target.value))}
      style={{
        width: "100%",
        height: "8px",
        borderRadius: "4px",
        appearance: "none",
        background:
          "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
        cursor: "pointer",
      }}
    />
  );
};

const AlphaSlider: React.FC<{
  h: number;
  s: number;
  v: number;
  a: number;
  onChange: (a: number) => void;
}> = ({ h, s, v, a, onChange }) => {
  const rgbaBase = hsvaToRgba(h, s, v, 1);
  const colorStr = `rgba(${rgbaBase.r}, ${rgbaBase.g}, ${rgbaBase.b}, 1)`;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "8px",
        borderRadius: "4px",
        overflow: "hidden",
        background:
          'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAAC1JREFUGFdjZEAC////Z4RhBoaPHz8yMDIyMscyMDCABUA8mIGRAaoEWAAmAAB+PAsLyE2XIAAAAABJRU5ErkJggg==") repeat',
      }}
    >
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={a}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%",
          height: "100%",
          appearance: "none",
          background: `linear-gradient(to right, transparent, ${colorStr})`,
          cursor: "pointer",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
};

const ColorInputs: React.FC<{
  hsva: { h: number; s: number; v: number; a: number };
  onChange: (hsva: { h: number; s: number; v: number; a: number }) => void;
}> = ({ hsva, onChange }) => {
  const rgba = hsvaToRgba(hsva.h, hsva.s, hsva.v, hsva.a);
  const hex = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.match(/^#[0-9A-Fa-f]{3,8}$/)) {
      const nextRgba = parseToRgba(val);
      onChange(rgbaToHsva(nextRgba.r, nextRgba.g, nextRgba.b, nextRgba.a));
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
        gap: "4px",
        alignItems: "center",
      }}
    >
      <input
        value={hex}
        onChange={handleHexChange}
        style={{
          background: "#1c2030",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "3px",
          color: "#ffffff",
          fontSize: "10px",
          padding: "2px 4px",
          width: "100%",
        }}
      />
      <span style={{ fontSize: "9px", color: "#64748b", textAlign: "center" }}>
        {rgba.r}
      </span>
      <span style={{ fontSize: "9px", color: "#64748b", textAlign: "center" }}>
        {rgba.g}
      </span>
      <span style={{ fontSize: "9px", color: "#64748b", textAlign: "center" }}>
        {rgba.b}
      </span>
      <span style={{ fontSize: "9px", color: "#64748b", textAlign: "center" }}>
        {Math.round(rgba.a * 100)}%
      </span>
    </div>
  );
};

// ============================================================================
// UTILS
// ============================================================================

function hsvaToRgba(h: number, s: number, v: number, a: number) {
  let r: number = 0,
    g: number = 0,
    b: number = 0;
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a,
  };
}

function rgbaToHsva(r: number, g: number, b: number, a: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h: number = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s, v, a };
}

function rgbaToHex(r: number, g: number, b: number, a: number) {
  const f = (n: number) => n.toString(16).padStart(2, "0");
  const aHex =
    a === 1
      ? ""
      : Math.round(a * 255)
          .toString(16)
          .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}${aHex}`.toUpperCase();
}

function parseToRgba(str: string) {
  // Simple hex parser
  if (str.startsWith("#")) {
    let r = 0,
      g = 0,
      b = 0,
      a = 1;
    if (str.length === 4) {
      r = parseInt(str[1] + str[1], 16);
      g = parseInt(str[2] + str[2], 16);
      b = parseInt(str[3] + str[3], 16);
    } else if (str.length === 7 || str.length === 9) {
      r = parseInt(str.substring(1, 3), 16);
      g = parseInt(str.substring(3, 5), 16);
      b = parseInt(str.substring(5, 7), 16);
      if (str.length === 9) a = parseInt(str.substring(7, 9), 16) / 255;
    }
    return { r, g, b, a };
  }
  // Fallback
  return { r: 41, g: 98, b: 255, a: 1 };
}
