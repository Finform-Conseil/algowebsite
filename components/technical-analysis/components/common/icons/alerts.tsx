import React from "react";

interface IconProps {
    className?: string;
    size?: number;
    color?: string;
    style?: React.CSSProperties;
}

/**
 * Alert condition icons used by Technical Analysis alert UI.
 */
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
