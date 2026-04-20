/**
 * [TENOR 2026 DRY] Alert Condition Icons
 * Extracted from TechnicalAnalysis.tsx — Phase 3 of DRY Apex Elite Consolidation
 * These are pure presentational SVG components with zero business logic.
 */

export const ConditionCrossingIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18" />
        <path d="M6 6 18 18" />
        <path d="m3 3 3 0 0 3" />
        <path d="m18 18 3 0 0-3" />
        <path d="m18 3 3 0 0 3" />
        <path d="m3 18 3 0 0-3" />
    </svg>
);

export const ConditionCrossingUpIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16" />
        <path d="M7 18l10-12" />
        <path d="M17 11V6h-5" />
    </svg>
);

export const ConditionCrossingDownIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16" />
        <path d="M7 6l10 12" />
        <path d="M17 13v5h-5" />
    </svg>
);

export const ConditionGreaterIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 12H6" />
        <path d="M13 7l5 5-5 5" />
    </svg>
);

export const ConditionLessIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 12H6" />
        <path d="M11 17l-5-5 5-5" />
    </svg>
);
