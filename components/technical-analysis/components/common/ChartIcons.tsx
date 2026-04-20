import React from "react";

/**
 * [TENOR 2026] Centralized SVG Icons for the Charting Module.
 * Standardizes sizes and ensures consistency across all UI components.
 */

interface IconProps {
    className?: string;
    size?: number;
    color?: string;
    style?: React.CSSProperties;
}

// --- Alert Condition Icons ---

export const ConditionCrossingIcon = ({ size = 18, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 6 6 18" /><path d="M6 6 18 18" /><path d="m3 3 3 0 0 3" /><path d="m18 18 3 0 0-3" /><path d="m18 3 3 0 0 3" /><path d="m3 18 3 0 0-3" />
    </svg>
);

export const ConditionCrossingUpIcon = ({ size = 18, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 12h16" /><path d="M7 18l10-12" /><path d="M17 11V6h-5" />
    </svg>
);

export const ConditionCrossingDownIcon = ({ size = 18, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 12h16" /><path d="M7 6l10 12" /><path d="M17 13v5h-5" />
    </svg>
);

export const ConditionGreaterIcon = ({ size = 18, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 12H6" /><path d="M13 7l5 5-5 5" />
    </svg>
);

export const ConditionLessIcon = ({ size = 18, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 12H6" /><path d="M11 17l-5-5 5-5" />
    </svg>
);

// --- Drawing Tool Icons ---

export const RegressionTrendIcon = ({ size = 16, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} {...props}>
        <path d="M2 11L14 5" stroke="currentColor" strokeWidth="1.5" /><circle cx="2" cy="11" r="1.5" fill="white" stroke="currentColor" /><circle cx="14" cy="5" r="1.5" fill="white" stroke="currentColor" /><path d="M2 8L14 2M2 14L14 8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
);

export const FlatTopBottomIcon = ({ size = 16, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color} {...props}>
        <path d="M14 5L2 12H14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" /><circle cx="2" cy="12" r="1.5" fill="white" stroke="currentColor" /><circle cx="14" cy="5" r="1.5" fill="white" stroke="currentColor" /><circle cx="14" cy="12" r="1.5" fill="white" stroke="currentColor" />
    </svg>
);

export const FibRetracementIcon = ({ size = 18, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" {...props}>
        <path d="M2 4H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" /><path d="M2 7H16" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" /><path d="M2 10H16" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" /><path d="M2 13H16" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" /><path d="M2 16H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" /><path d="M14 2L4 18" stroke={color} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
);

export const FibExtensionIcon = ({ size = 28, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 28 28" {...props}>
        <g fill={color} fillRule="nonzero"><path d="M4 25h22v-1h-22z" id="Line"></path><path d="M4 21h22v-1h-22z"></path><path d="M6.5 17h19.5v-1h-19.5z"></path><path d="M5 14.5v-3h-1v3zM6.617 9.275l10.158-3.628-.336-.942-10.158 3.628z"></path><path d="M18.5 6c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM4.5 11c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM4.5 18c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path></g>
    </svg>
);

export const FibChannelIcon = ({ size = 28, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 28 28" {...props}>
        <g fill={color} fillRule="nonzero"><path d="M7.463 12.026l13.537-7.167-.468-.884-13.537 7.167z"></path><path d="M22.708 16.824l-17.884 9.468.468.884 17.884-9.468z"></path><path d="M22.708 9.824l-15.839 8.386.468.884 15.839-8.386z"></path><path d="M5.5 14c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 21c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM22.5 5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path></g>
    </svg>
);

export const FibTimeZoneIcon = ({ size = 28, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 28 28" {...props}>
        <path fill={color} fillRule="evenodd" d="M19 4v21h1V4h-1Zm5 0v21h1V4h-1ZM6 12.95V25H5V12.95a2.5 2.5 0 0 1 0-4.9V4h1v4.05a2.5 2.5 0 0 1 1.67 3.7L8.7 12.8 8 13.5l-1-1c-.3.22-.63.38-1 .45ZM5.5 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM13 19.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm1 5.5v-3.05A2.5 2.5 0 0 1 12.5 18l-1-1 .7-.7 1.05 1.03c.23-.13.48-.23.75-.28V4h1v13.05a2.5 2.5 0 0 1 0 4.9V25h-1ZM8.97 14.47l1.56 1.56.7-.71-1.55-1.55-.7.7Z"></path>
    </svg>
);

export const PitchforkIcon = ({ size = 28, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 28 28" {...props}>
        <g fill={color} fillRule="nonzero"><path d="M7.275 21.432l12.579-12.579-.707-.707-12.579 12.579z"></path><path d="M6.69 13.397l7.913 7.913.707-.707-7.913-7.913zM7.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path><path d="M18.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path><path d="M5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM16.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path></g>
    </svg>
);

export const SchiffPitchforkIcon = ({ size = 28, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 28 28" {...props}>
        <g fill={color} fillRule="nonzero"><path d="M10.275 20.432l11.579-11.579-.707-.707-11.579 11.579z"></path><path d="M8.336 13.043l8.621 8.621.707-.707-8.621-8.621zM9.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path><path d="M20.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path><path d="M6.5 23h10v-1h-10z"></path><path d="M4.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM7.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path></g>
    </svg>
);

export const InsidePitchforkIcon = ({ size = 28, color = "currentColor", ...props }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 28 28" {...props}>
        <g fill={color} fillRule="nonzero"><path d="M10.275 22.432l11.579-11.579-.707-.707-11.579 11.579z"></path><path d="M9.854 20.854l14-14-.707-.707-14 14z"></path><path d="M8.336 13.043l8.621 8.621.707-.707-8.621-8.621zM9.149 10.558l7.058-7.058-.707-.707-7.058 7.058z" id="Line"></path><path d="M20.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path><path d="M7.5 24h6v-1h-6z"></path><path d="M5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM7.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path></g>
    </svg>
);
