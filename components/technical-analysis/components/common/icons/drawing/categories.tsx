import React from "react";

/**
 * Drawing category icons used by the Technical Analysis drawing toolbar.
 */
export const TrendCategoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 18.5L20.5 3.5L24.5 7.5L9.5 22.5L5.5 18.5Z" fill="currentColor" fillOpacity="0.15" />
        <path d="M5.5 18.5L20.5 3.5L24.5 7.5L9.5 22.5L5.5 18.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 18.5L3.5 24.5L9.5 22.5L5.5 18.5Z" fill="#ff9800" stroke="#ff9800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const FibCategoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 7H24M4 12H24M4 17H24M4 22H24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="12" r="2" fill="currentColor" />
        <circle cx="18" cy="17" r="2" fill="currentColor" />
    </svg>
);

export const PatternsCategoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 19L10 9L15 17L22 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="19" r="2" fill="currentColor" />
        <circle cx="10" cy="9" r="2" fill="currentColor" />
        <circle cx="15" cy="17" r="2" fill="currentColor" />
        <circle cx="22" cy="7" r="2" fill="currentColor" />
    </svg>
);

export const ForecastingCategoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 19C5 19 8 8 13 13C18 18 20 9 24 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5" cy="19" r="2.5" fill="currentColor" />
    </svg>
);

export const AnnotationCategoryIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false" {...props}>
        <path
            d="M4.25 3H23.75 M4.25 3V5.75 M23.75 3V5.75 M14 3V25 M10.25 25H17.75"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="square"
            strokeLinejoin="miter"
        />
    </svg>
);

export const BrushCategoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.007 2.993a4.3 4.3 0 0 0-6.086 0l-12.5 12.5a1 1 0 0 0-.263.464l-1.5 6.5a1 1 0 0 0 1.214 1.214l6.5-1.5a1 1 0 0 0 .464-.263l12.5-12.5a4.304 4.304 0 0 0 0-6.086 1 1 0 0 0-.329-.329zM6.308 21.692l.724-3.138 2.414 2.414-3.138.724zm4.5-1.328-3.172-3.172 9.5-9.5 3.172 3.172-9.5 9.5z" fill="currentColor" />
    </svg>
);
