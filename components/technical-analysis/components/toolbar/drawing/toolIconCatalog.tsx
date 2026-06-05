import React from "react";

import { getDrawingToolIcon } from "../../../config/drawing/drawingToolIconRegistry";
import type { AllToolType } from "../../../config/drawing/drawingToolTypes";
import { TrendCategoryIcon } from "../../common/icons/drawing/categories";
import { HorizontalLineIcon } from "../../common/icons/drawing/trend";
import { ACTIVE_BLUE } from "./drawingToolbarTheme";

export const cloneIconWithActiveState = (
  icon: React.ReactNode,
  isActive: boolean,
): React.ReactNode => {
  if (!React.isValidElement(icon)) return icon;
  const activeColor = isActive ? ACTIVE_BLUE : "inherit";

  if (icon.type === "i") {
    return React.cloneElement(
      icon as React.ReactElement<{ style?: React.CSSProperties; className?: string; }>,
      { style: { ...(icon.props as { style?: React.CSSProperties }).style, color: activeColor } },
    );
  }
  if (icon.type === "svg") {
    return React.cloneElement(
      icon as React.ReactElement<{ style?: React.CSSProperties }>,
      { style: { ...(icon.props as { style?: React.CSSProperties }).style, color: activeColor } },
    );
  }
  return React.cloneElement(
    icon as React.ReactElement<{ style?: React.CSSProperties }>,
    { style: { ...(icon.props as { style?: React.CSSProperties }).style, color: activeColor } },
  );
};

const TOOL_ICON_MAP: Record<
  string,
  {
    type: "bootstrap" | "svg" | "custom";
    icon: string | React.ReactNode;
    rotate?: string;
    color?: string;
  }
> = {
  // === LINES & MEASURES (15 tools) ===
  line: { type: "bootstrap", icon: "bi-slash-lg" },
  horizontal_line: {
    type: "custom",
    icon: <HorizontalLineIcon />,
  },
  vertical_line: {
    type: "bootstrap",
    icon: "bi-dash-lg",
    rotate: "90deg",
  },
  arrow: {
    type: "bootstrap",
    icon: "bi-arrow-up-right",
  },
  trend_angle: {
    type: "bootstrap",
    icon: "bi-caret-up",
  },
  ray: { type: "bootstrap", icon: "bi-arrow-right" },
  x_line: {
    type: "bootstrap",
    icon: "bi-arrows-expand",
  },
  horizontal_ray: {
    type: "bootstrap",
    icon: "bi-arrow-right-short",
  },
  polyline: { type: "bootstrap", icon: "bi-share" },
  path: { type: "bootstrap", icon: "bi-bezier2" },
  curve: { type: "bootstrap", icon: "bi-bezier" },
  crosshair: { type: "bootstrap", icon: "bi-plus-lg" },
  pitchfork: {
    type: "custom",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 28 28"
        width="16"
        height="16"
      >
        <g fill="currentColor" fillRule="nonzero">
          <path d="M7.275 21.432l12.579-12.579-.707-.707-12.579 12.579z"></path>
          <path d="M6.69 13.397l7.913 7.913.707-.707-7.913-7.913zM7.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
          <path d="M18.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
          <path d="M5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM16.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
      </svg>
    ),
  },
  arrow_marker: {
    type: "bootstrap",
    icon: "bi-arrow-up",
  },
  projection: {
    type: "bootstrap",
    icon: "bi-graph-up-arrow",
  },
  date_range: {
    type: "bootstrap",
    icon: "bi-calendar-range",
  },
  price_range: {
    type: "bootstrap",
    icon: "bi-arrows-vertical",
  },
  date_price_range: {
    type: "bootstrap",
    icon: "bi-bounding-box",
  },

  // === CHANNELS (4 tools) ===
  parallel_channel: {
    type: "bootstrap",
    icon: "bi-distribute-vertical",
  },
  regression_trend: { type: "svg", icon: "regression" },
  disjoint_channel: {
    type: "bootstrap",
    icon: "bi-bezier2",
  },
  flat_top_bottom: { type: "svg", icon: "flat_top_bottom" },

  // === PITCHFORKS (4 tools) ===
  schiff_pitchfork: {
    type: "custom",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 28 28"
        width="16"
        height="16"
      >
        <g fill="currentColor" fillRule="nonzero">
          <path d="M10.275 20.432l11.579-11.579-.707-.707-11.579 11.579z"></path>
          <path d="M8.336 13.043l8.621 8.621.707-.707-8.621-8.621zM9.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
          <path d="M20.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
          <path d="M6.5 23h10v-1h-10z"></path>
          <path d="M4.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM7.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
      </svg>
    ),
  },
  modified_schiff_pitchfork: {
    type: "custom",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 28 28"
        width="16"
        height="16"
      >
        <g fill="currentColor" fillRule="nonzero">
          <path d="M7.854 22.854l14-14-.707-.707-14 14z"></path>
          <path d="M8.336 13.043l8.621 8.621.707-.707-8.621-8.621zM9.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
          <path d="M20.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
          <path d="M5.5 23h11v-1h-11z"></path>
          <path d="M7.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM3.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
      </svg>
    ),
  },
  fib_channel: {
    type: "custom",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 28 28"
        width="16"
        height="16"
      >
        <g fill="currentColor" fillRule="nonzero">
          <path d="M7.463 12.026l13.537-7.167-.468-.884-13.537 7.167z"></path>
          <path d="M22.708 16.824l-17.884 9.468.468.884 17.884-9.468z"></path>
          <path d="M22.708 9.824l-15.839 8.386.468.884 15.839-8.386z"></path>
          <path d="M5.5 14c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 21c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM22.5 5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
      </svg>
    ),
  },
  inside_pitchfork: {
    type: "custom",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 28 28"
        width="16"
        height="16"
      >
        <g fill="currentColor" fillRule="nonzero">
          <path d="M10.275 22.432l11.579-11.579-.707-.707-11.579 11.579z"></path>
          <path d="M9.854 20.854l14-14-.707-.707-14 14z"></path>
          <path d="M8.336 13.043l8.621 8.621.707-.707-8.621-8.621zM9.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
          <path d="M20.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
          <path d="M7.5 24h6v-1h-6z"></path>
          <path d="M5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM7.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
      </svg>
    ),
  },
};

export const renderTrendToolIcon = (toolId: AllToolType | null, isActive: boolean) => {
  if (!toolId) {
    return <TrendCategoryIcon />;
  }
  const iconConfig = TOOL_ICON_MAP[toolId];
  if (!iconConfig) {
    const registeredIcon = getDrawingToolIcon(toolId);
    if (registeredIcon) {
      return cloneIconWithActiveState(registeredIcon, isActive);
    }
    return (
      <i
        className="bi bi-pencil-fill"
        style={{
          fontSize: "1.2rem",
          color: isActive ? ACTIVE_BLUE : "inherit",
        }}
      ></i>
    );
  }

  const activeColor = iconConfig.color || (isActive ? ACTIVE_BLUE : "inherit");

  if (iconConfig.type === "bootstrap") {
    return (
      <i
        className={`bi ${iconConfig.icon}`}
        style={{
          fontSize: "1.2rem",
          transform: iconConfig.rotate ? `rotate(${iconConfig.rotate})` : undefined,
          color: activeColor,
        }}
      ></i>
    );
  }
  if (iconConfig.type === "svg") {
    if (iconConfig.icon === "regression") {
      return (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" style={{ color: activeColor }}>
          <path d="M2 11L14 5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="2" cy="11" r="1.5" fill="white" stroke="currentColor" />
          <circle cx="14" cy="5" r="1.5" fill="white" stroke="currentColor" />
          <path d="M2 8L14 2M2 14L14 8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
      );
    }
    if (iconConfig.icon === "flat_top_bottom") {
      return (
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" style={{ color: activeColor }}>
          <path d="M14 5L2 12H14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          <circle cx="2" cy="12" r="1.5" fill="white" stroke="currentColor" />
          <circle cx="14" cy="5" r="1.5" fill="white" stroke="currentColor" />
          <circle cx="14" cy="12" r="1.5" fill="white" stroke="currentColor" />
        </svg>
      );
    }
  }
  if (iconConfig.type === "custom") {
    return cloneIconWithActiveState(iconConfig.icon, isActive);
  }
  return <i className="bi bi-pencil-fill" style={{ fontSize: "1.2rem", color: activeColor }}></i>;
};

export const renderCategoryToolIcon = (
  toolId: AllToolType | null,
  isActive: boolean,
  fallbackIcon: React.ReactNode,
) => {
  if (!toolId) return fallbackIcon;

  const registeredIcon = getDrawingToolIcon(toolId);
  if (!registeredIcon) return fallbackIcon;

  return cloneIconWithActiveState(registeredIcon, isActive);
};
