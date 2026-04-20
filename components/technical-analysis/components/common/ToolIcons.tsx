import React from "react";

// --- SIMPLE ICONS (Bootstrap Icon Wrappers) ---
export const LineIcon = () => <i className="bi bi-slash-lg" />;
export const HorizontalLineIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <g fill="currentColor" fillRule="nonzero">
            <path d="M4 15h8.5v-1h-8.5zM16.5 15h8.5v-1h-8.5z"></path>
            <path d="M14.5 16c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);
export const RayIcon = () => <i className="bi bi-arrow-right" />;
export const TrendAngleIcon = () => <i className="bi bi-caret-up" />;
export const ArrowIcon = () => <i className="bi bi-arrow-up-right" />;
export const ExtendedLineIcon = () => <i className="bi bi-arrows-expand" />;
export const HorizontalRayIcon = () => <i className="bi bi-arrow-right-short" />;
export const PolylineIcon = () => <i className="bi bi-share" />;
export const PathIcon = () => <i className="bi bi-bezier2" />;
export const CurveIcon = () => <i className="bi bi-bezier" />;
export const CrosshairIcon = () => <i className="bi bi-plus-lg" />;
export const ArrowMarkerIcon = () => <i className="bi bi-arrow-up" />;
export const ProjectionIcon = () => <i className="bi bi-graph-up-arrow" />;
export const DateRangeIcon = () => <i className="bi bi-calendar-range" />;
export const PriceRangeIcon = () => <i className="bi bi-arrows-vertical" />;
export const DatePriceRangeIcon = () => <i className="bi bi-bounding-box" />;
export const LongPositionIcon = () => <i className="bi bi-graph-up" style={{ color: "#00da3c" }} />;
export const ShortPositionIcon = () => <i className="bi bi-graph-down" style={{ color: "#ec0000" }} />;
export const ParallelChannelIcon = () => <i className="bi bi-distribute-vertical" />;
export const DisjointChannelIcon = () => <i className="bi bi-bezier2" />;

// --- CATEGORY ICONS (HDR 2026 PREMIUM) ---

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


// --- COMPLEX SVG ICONS ---

export const RegressionTrendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 11L14 5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="2" cy="11" r="1.5" fill="white" stroke="currentColor" />
        <circle cx="14" cy="5" r="1.5" fill="white" stroke="currentColor" />
        <path d="M2 8L14 2M2 14L14 8" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
);

export const FlatTopBottomIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M14 5L2 12H14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
        <circle cx="2" cy="12" r="1.5" fill="white" stroke="currentColor" />
        <circle cx="14" cy="5" r="1.5" fill="white" stroke="currentColor" />
        <circle cx="14" cy="12" r="1.5" fill="white" stroke="currentColor" />
    </svg>
);

export const FibRetracementIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 7H16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M2 10H16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M2 13H16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M2 16H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 2L4 18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
);

export const FibExtensionIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 14H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 11H16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M2 8H16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        
        <path d="M3 11L7 4L11 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
        
        <circle cx="3" cy="11" r="1.5" fill="currentColor" />
        <circle cx="7" cy="4" r="1.5" fill="currentColor" />
        <circle cx="11" cy="11" r="1.5" fill="currentColor" />
    </svg>
);

export const FibChannelIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 14L15 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 11L12 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M8 17L18 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        
        <circle cx="5" cy="14" r="1.5" fill="currentColor" />
        <circle cx="15" cy="4" r="1.5" fill="currentColor" />
        <circle cx="8" cy="17" r="1.5" fill="currentColor" />
    </svg>
);

export const FibTimeZoneIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 2V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 2V16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M11 2V16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M16 2V16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <path d="M4 9H16" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        
        <circle cx="4" cy="9" r="1.5" fill="currentColor" />
        <circle cx="16" cy="9" r="1.5" fill="currentColor" />
    </svg>
);

export const FibSpeedFanIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.25 15.25L15.25 3.25M3.25 15.25L15.25 8.25M3.25 15.25L11.25 3.25M3.25 15.25L15.25 11.25M3.25 15.25L7.25 3.25M3.25 15.25H15.25M3.25 15.25V3.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="3.25" cy="15.25" r="1.25" fill="currentColor" />
        <circle cx="15.25" cy="3.25" r="1.25" fill="currentColor" />
    </svg>
);

export const FibTimeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M20 2v22h1v-22z"></path>
            <path d="M24 2v22h1v-22z"></path>
            <path d="M4.673 11.471l3.69 10.333.942-.336-3.69-10.333z"></path>
            <path d="M17 21.535v-19.535h-1v19.535z"></path>
            <path d="M11.5 24h3v-1h-3z"></path>
            <path d="M4.5 11c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5-2.5zM9.5 25c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM16.5 25c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const FibCirclesIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1" />
        <path d="M9 9L17 9" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
);

export const FibSpiralIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M4.395 10.18c3.432-4.412 10.065-4.998 13.675-.973l.745-.668c-4.044-4.509-11.409-3.858-15.209 1.027l.789.614z" />
            <path d="M19.991 12.494c.877 2.718.231 5.487-1.897 7.543-2.646 2.556-6.752 2.83-9.188.477-1.992-1.924-2.027-5.38-.059-7.281 1.582-1.528 3.78-1.587 5.305-.115 1.024.99 1.386 2.424.876 3.491l.902.431c.709-1.482.232-3.37-1.084-4.641-1.921-1.855-4.734-1.78-6.695.115-2.378 2.297-2.337 6.405.059 8.719 2.846 2.749 7.563 2.435 10.577-.477 2.407-2.325 3.147-5.493 2.154-8.569l-.952.307z" />
            <path d="M21.01 9.697l3.197-3.197-.707-.707-3.197 3.197z" />
            <path d="M14.989 15.719l3.674-3.674-.707-.707-3.674 3.674z" />
            <path d="M13.5 18c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM19.5 12c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" />
        </g>
    </svg>
);

export const FibSpeedArcsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M8 9.5c0 3.038 2.462 5.5 5.5 5.5s5.5-2.462 5.5-5.5v-.5h-1v.5c0 2.485-2.015 4.5-4.5 4.5s-4.5-2.015-4.5-4.5v-.5h-1v.5z"></path>
            <path d="M0 9.5c0 7.456 6.044 13.5 13.5 13.5s13.5-6.044 13.5-13.5v-.5h-1v.5c0 6.904-5.596 12.5-12.5 12.5s-12.5-5.596-12.5-12.5v-.5h-1v.5z"></path>
            <path d="M4 9.5c0 4.259 2.828 7.964 6.86 9.128l.48.139.277-.961-.48-.139c-3.607-1.041-6.137-4.356-6.137-8.167v-.5h-1v.5z"></path>
            <path d="M16.141 18.628c4.032-1.165 6.859-4.869 6.859-9.128v-.5h-1v.5c0 3.811-2.53 7.125-6.136 8.167l-.48.139.278.961.48-.139z"></path>
            <path d="M13.5 20c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM13.5 11c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const FibWedgeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M21.5 23h-14v1h14zM5 7.5v14h1v-14z"></path>
            <path d="M12 23c0-3.314-2.686-6-6-6h-.5v1h.5c2.761 0 5 2.239 5 5v.5h1v-.5z"></path>
            <path d="M20 23c0-7.732-6.268-14-14-14h-.5v1h.5c7.18 0 13 5.82 13 13v.5h1v-.5z"></path>
            <path d="M16 23c0-5.523-4.477-10-10-10h-.5v1h.5c4.971 0 9 4.029 9 9v.5h1v-.5z"></path>
            <path d="M5.5 7c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM23.5 25c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 25c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const PitchfanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M20.349 20.654l4.489-.711-.156-.988-4.489.711z"></path>
            <path d="M7.254 22.728l9.627-1.525-.156-.988-9.627 1.525z"></path>
            <path d="M7.284 22.118l15.669-8.331-.469-.883-15.669 8.331z"></path>
            <path d="M6.732 21.248l8.364-15.731-.883-.469-8.364 15.731z"></path>
            <path d="M17.465 18.758l-8.188-8.188-.707.707 8.188 8.188z"></path>
            <path d="M6.273 20.818l1.499-9.467-.988-.156-1.499 9.467z"></path>
            <path d="M8.329 7.834l.715-4.516-.988-.156-.715 4.516z"></path>
            <path d="M7.354 21.354l17-17-.707-.707-17 17z"></path>
            <path d="M5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM7.5 11c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 22c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const GannBoxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M3.5 11h21v-1h-21z"></path>
            <path d="M3.5 18h21v-1h-21z"></path>
            <path d="M10 3.5v21h1v-21z"></path>
            <path d="M17 3.5v21h1v-21z"></path>
            <path d="M22.5 4v-1h-19.5v19.5h1v-18.5z"></path>
            <path d="M24 24h-18.507v1h19.507v-19.5h-1z"></path>
            <path d="M3.5 26c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM24.5 5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const GannSquareFixedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M4 4v20h20V4H4zm1 1h18v18H5V5z" />
            <path d="M5 5L23 9M5 5L23 14M5 5L23 19M5 5L23 23M5 5L19 23M5 5L14 23M5 5L9 23" stroke="currentColor" strokeWidth="1" opacity="0.5" fill="none" />
        </g>
    </svg>
);

export const GannSquareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M22.5 4v-1h-19.5v19.5h1v-18.5z"></path>
            <path d="M5.493 24v1h19.507v-19.5h-1v18.5z"></path>
            <path d="M5.275 23.432l18.213-18.213-.707-.707-18.213 18.213z"></path>
            <path d="M5.568 24.383l19.079-5.906-.296-.955-19.079 5.906z" id="Line-Copy-18"></path>
            <path d="M4.587 22.68l5.891-19.032-.955-.296-5.891 19.032z"></path>
            <path d="M3.5 11h21v-1h-21z"></path>
            <path d="M3.5 18h21v-1h-21z"></path>
            <path d="M10 3.5v21h1v-21z"></path>
            <path d="M17 3.5v21h1v-21z"></path>
            <path d="M23.975 23.475l1.025 1.025c0-11.874-9.626-21.5-21.5-21.5l1.025 1.025c10.506.517 18.932 8.944 19.45 19.45z"></path>
            <path d="M3.5 26c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM24.5 5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const GannFanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M7.354 21.354l7.097-7.097-.707-.707-7.097 7.097z"></path>
            <path d="M17.249 11.458l7.105-7.105-.707-.707-7.105 7.105z"></path>
            <path d="M7.542 22.683l17.296-2.739-.156-.988-17.296 2.739z" id="Line"></path>
            <path d="M7.538 22.062l15.708-7.661-.438-.899-15.708 7.661z"></path>
            <path d="M6.802 20.97l7.695-15.777-.899-.438-7.695 15.777z"></path>
            <path d="M6.285 20.741l2.76-17.423-.988-.156-2.76 17.423z"></path>
            <path d="M5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM15.5 14c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const PitchforkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M7.275 21.432l12.579-12.579-.707-.707-12.579 12.579z"></path>
            <path d="M6.69 13.397l7.913 7.913.707-.707-7.913-7.913zM7.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M18.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM16.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const SchiffPitchforkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M10.275 20.432l11.579-11.579-.707-.707-11.579 11.579z"></path>
            <path d="M8.336 13.043l8.621 8.621.707-.707-8.621-8.621zM9.149 10.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M20.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M6.5 23h10v-1h-10z"></path>
            <path d="M4.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM7.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const ModifiedSchiffPitchforkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" >
        <g fill="currentColor" fillRule="nonzero">
            <path d="M7.854 22.854l14-14-.707-.707-14 14z"></path>
            <path d="M8.336 13.043l8.621 8.621.707-.707-8.621-8.621zM9.149 10.558l7.058-7.058-.707-.707-7.058 7.058z" id="Line"></path>
            <path d="M20.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M5.5 23h11v-1h-11z"></path>
            <path d="M7.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM3.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const InsidePitchforkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" >
        <g fill="currentColor" fillRule="nonzero">
            <path d="M10.275 22.432l11.579-11.579-.707-.707-11.579 11.579z"></path>
            <path d="M9.854 20.854l14-14-.707-.707-14 14z"></path>
            <path d="M8.336 13.043l8.621 8.621.707-.707-8.621-8.621zM9.149 10.558l7.058-7.058-.707-.707-7.058 7.058z" id="Line" ></path>
            <path d="M20.149 21.558l7.058-7.058-.707-.707-7.058 7.058z"></path>
            <path d="M7.5 24h6v-1h-6z"></path>
            <path d="M5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM7.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);
export const XABCDPatternIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M20.449 8.505l2.103 9.112.974-.225-2.103-9.112zM13.943 14.011l7.631 4.856.537-.844-7.631-4.856zM14.379 11.716l4.812-3.609-.6-.8-4.812 3.609zM10.96 13.828l-4.721 6.744.819.573 4.721-6.744zM6.331 20.67l2.31-13.088-.985-.174-2.31 13.088zM9.041 7.454l1.995 3.492.868-.496-1.995-3.492z" />
            <path d="M8.5 7c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM12.5 14c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM20.5 8c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM23.5 21c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" />
        </g>
    </svg>
);

export const CypherPatternIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor">
            <path d="M15.246 21.895l1.121.355c-.172.625-.458 1.089-.857 1.393-.4.303-.907.455-1.521.455-.76 0-1.385-.26-1.875-.779-.49-.52-.734-1.23-.734-2.131 0-.953.246-1.693.738-2.221.492-.527 1.139-.791 1.941-.791.701 0 1.27.207 1.707.621.26.245.456.596.586 1.055l-1.145.273c-.068-.297-.209-.531-.424-.703-.215-.172-.476-.258-.783-.258-.424 0-.769.152-1.033.457-.264.305-.396.798-.396 1.48 0 .724.13 1.24.391 1.547.26.307.599.461 1.016.461.307 0 .572-.098.793-.293.221-.195.38-.503.477-.922z"></path>
            <path fillRule="nonzero" d="M20.449 8.505l2.103 9.112.974-.225-2.103-9.112zM13.943 14.011l7.631 4.856.537-.844-7.631-4.856zM14.379 11.716l4.812-3.609-.6-.8-4.812 3.609zM10.96 13.828l-4.721 6.744.819.573 4.721-6.744zM6.331 20.67l2.31-13.088-.985-.174-2.31 13.088zM9.041 7.454l1.995 3.492.868-.496-1.995-3.492z"></path>
            <path fillRule="nonzero" d="M8.5 7c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM12.5 14c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM20.5 8c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM23.5 21c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);
export const HeadAndShouldersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M4.436 21.667l2.083-9.027-.974-.225-2.083 9.027zM10.046 16.474l-2.231-4.463-.894.447 2.231 4.463zM13.461 6.318l-2.88 10.079.962.275 2.88-10.079zM18.434 16.451l-2.921-10.224-.962.275 2.921 10.224zM21.147 12.089l-2.203 4.405.894.447 2.203-4.405zM25.524 21.383l-2.09-9.055-.974.225 2.09 9.055z" />
            <path d="M1 19h7.5v-1h-7.5z" />
            <path d="M12.5 19h4v-1h-4z" />
            <path d="M20.5 19h6.5v-1h-6.5z" />
            <path d="M6.5 12c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM3.5 25c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM10.5 20c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 20c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM22.5 12c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM25.5 25c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5-2.5zM14.5 6c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" />
        </g>
    </svg>
);

// [HDR 2026 - SNIPER V5.0 - 2026-03-18] ABCD Pattern Icon
// Exact SVG as specified by the user: 4 handles (A,B,C,D) with zigzag segments and diagonal measurement lines
export const ABCDPatternIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M21.487 5.248l-12.019 1.502.124.992 12.019-1.502zM6.619 9.355l-2.217 11.083.981.196 2.217-11.083zM6.534 22.75l12.071-1.509-.124-.992-12.071 1.509zM21.387 18.612l2.21-11.048-.981-.196-2.21 11.048zM8.507 9.214l10.255 10.255.707-.707-10.255-10.255z">
            </path>
            <path d="M7.5 9c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM4.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM23.5 7c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM20.5 22c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z">
            </path>
        </g>
    </svg>
);

export const TrianglePatternIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M9.457 18.844l-5.371 2.4.408.913 5.371-2.4z"></path>
            <path d="M13.13 17.203l.408.913 13.688-6.116-6.736-3.01-.408.913 4.692 2.097z"></path>
            <path d="M11.077 5.88l5.34 2.386.408-.913-5.34-2.386z"></path>
            <path d="M7.401 4.237l.408-.913-5.809-2.595v19.771h1v-18.229z"></path>
            <path d="M3.708 20.772l5.51-14.169-.932-.362-5.51 14.169zM9.265 6.39l1.46 10.218.99-.141-1.46-10.218zM13.059 17.145l4.743-6.775-.819-.573-4.743 6.775z"></path>
            <path d="M9.5 6c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM11.5 20c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM18.5 10c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM2.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

// [HDR 2026 - SNIPER V5.0 - 2026-03-18] Three Drives Pattern Icon
// Exact SVG as cloned from TradingView: 7 nodes, zigzag shape.
export const ThreeDrivesPatternIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M.303 17.674l1.104.473.394-.919-1.104-.473z"></path>
            <path d="M5.133 19.744l3.335 1.429.394-.919-3.335-1.429z"></path>
            <path d="M12.134 22.744l3.352 1.436.394-.919-3.352-1.436z"></path>
            <path d="M19.203 25.774l1.6.686.394-.919-1.6-.686z"></path>
            <path d="M.3 4.673l1.13.484.394-.919-1.13-.484-.394.919zm.394-.919l1.13.484-.394.919-1.13-.484.394-.919z"></path>
            <path d="M5.141 6.747l3.325 1.425.394-.919-3.325-1.425z"></path>
            <path d="M12.133 9.744l3.353 1.437.394-.919-3.353-1.437z"></path>
            <path d="M19.221 12.782l5.838 2.502.394-.919-5.838-2.502z"></path>
            <path d="M3 7.473v8.969h1v-8.969zM8.93 9.871l-4.616 6.594.819.573 4.616-6.594zM11 19.5v-9h-1v9zM15.898 12.916l-4.616 6.594.819.573 4.616-6.594zM18 22.5v-9h-1v9zM24.313 5.212l-6.57 17.247.934.356 6.57-17.247z"></path>
            <path d="M3.5 7c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM3.5 20c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM10.5 23c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM17.5 13c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM25.5 5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM17.5 26c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM10.5 10c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const ElliottImpulseIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 22L8 14L12 18L18 6L24 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="22" r="1.5" fill="currentColor" />
        <circle cx="8" cy="14" r="1.5" fill="currentColor" />
        <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        <circle cx="18" cy="6" r="1.5" fill="currentColor" />
        <circle cx="24" cy="14" r="1.5" fill="currentColor" />
        <text x="3" y="21" fill="currentColor" fontSize="6px" fontWeight="bold">0</text>
        <text x="7" y="13" fill="currentColor" fontSize="6px" fontWeight="bold">1</text>
        <text x="11" y="20" fill="currentColor" fontSize="6px" fontWeight="bold">2</text>
        <text x="17" y="5" fill="currentColor" fontSize="6px" fontWeight="bold">3</text>
        <text x="23" y="13" fill="currentColor" fontSize="6px" fontWeight="bold">4</text>
        <text x="25" y="15" fill="currentColor" fontSize="6px" fontWeight="bold">5</text>
    </svg>
);

export const ElliottCorrectionIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 10L12 18L20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5" cy="10" r="1.5" fill="currentColor" />
        <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        <circle cx="20" cy="8" r="1.5" fill="currentColor" />
        <text x="4" y="9" fill="currentColor" fontSize="6px" fontWeight="bold">A</text>
        <text x="11" y="20" fill="currentColor" fontSize="6px" fontWeight="bold">B</text>
        <text x="19" y="7" fill="currentColor" fontSize="6px" fontWeight="bold">C</text>
    </svg>
);

export const ElliottTriangleIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 8L20 12L8 16L24 18L12 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="8" r="1.5" fill="currentColor" />
        <circle cx="20" cy="12" r="1.5" fill="currentColor" />
        <circle cx="8" cy="16" r="1.5" fill="currentColor" />
        <circle cx="24" cy="18" r="1.5" fill="currentColor" />
        <circle cx="12" cy="22" r="1.5" fill="currentColor" />
        <text x="3" y="7" fill="currentColor" fontSize="6px" fontWeight="bold">A</text>
        <text x="19" y="11" fill="currentColor" fontSize="6px" fontWeight="bold">B</text>
        <text x="7" y="15" fill="currentColor" fontSize="6px" fontWeight="bold">C</text>
        <text x="23" y="17" fill="currentColor" fontSize="6px" fontWeight="bold">D</text>
        <text x="11" y="21" fill="currentColor" fontSize="6px" fontWeight="bold">E</text>
    </svg>
);

export const ElliottDoubleComboIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 14L10 8L16 20L22 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="14" r="1.5" fill="currentColor" />
        <circle cx="10" cy="8" r="1.5" fill="currentColor" />
        <circle cx="16" cy="20" r="1.5" fill="currentColor" />
        <circle cx="22" cy="14" r="1.5" fill="currentColor" />
        <text x="3" y="13" fill="currentColor" fontSize="6px" fontWeight="bold">W</text>
        <text x="9" y="7" fill="currentColor" fontSize="6px" fontWeight="bold">X</text>
        <text x="15" y="22" fill="currentColor" fontSize="6px" fontWeight="bold">Y</text>
    </svg>
);

export const ElliottTripleComboIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 14L8 8L13 20L18 12L23 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="3" cy="14" r="1.5" fill="currentColor" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        <circle cx="13" cy="20" r="1.5" fill="currentColor" />
        <circle cx="18" cy="12" r="1.5" fill="currentColor" />
        <circle cx="23" cy="22" r="1.5" fill="currentColor" />
        <text x="2" y="13" fill="currentColor" fontSize="5px" fontWeight="bold">W</text>
        <text x="7" y="7" fill="currentColor" fontSize="5px" fontWeight="bold">X</text>
        <text x="12" y="22" fill="currentColor" fontSize="5px" fontWeight="bold">Y</text>
        <text x="17" y="11" fill="currentColor" fontSize="5px" fontWeight="bold">X</text>
        <text x="22" y="24" fill="currentColor" fontSize="5px" fontWeight="bold">Z</text>
    </svg>
);

export const CyclicLinesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M23 4v21h1v-21z"></path>
            <path d="M17 4v21h1v-21z"></path>
            <path d="M5 16.5v8.5h1v-8.5z"></path>
            <path d="M5 4v8.5h1v-8.5z"></path>
            <path d="M5.5 16c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"> </path>
            <path d="M11 16.5v8.5h1v-8.5z"></path>
            <path d="M11 4v8.5h1v-8.5z"></path>
            <path d="M11.5 16c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"> </path>
        </g>
    </svg>
);

export const TimeCyclesIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 18H26" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <path d="M4 18C4 18 4 10 9 10C14 10 14 18 14 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 18C14 18 14 10 19 10C24 10 24 18 24 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="4" cy="18" r="1.5" fill="white" stroke="currentColor" />
        <circle cx="14" cy="18" r="1.5" fill="white" stroke="currentColor" />
    </svg>
);

export const SineLineIcon = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 14C4 14 6 6 9 6C12 6 14 14 14 14C14 14 16 22 19 22C22 22 24 14 24 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="14" r="1.5" fill="white" stroke="currentColor" />
        <circle cx="14" cy="14" r="1.5" fill="white" stroke="currentColor" />
    </svg>
);

// --- FORECASTING ICONS (HDR 2026) ---

export const ForecastingLongIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none">
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M4.5 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM2 6.5A2.5 2.5 0 0 1 6.95 6H24v1H6.95A2.5 2.5 0 0 1 2 6.5zM4.5 15a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM2 16.5a2.5 2.5 0 0 1 4.95-.5h13.1a2.5 2.5 0 1 1 0 1H6.95A2.5 2.5 0 0 1 2 16.5zM22.5 15a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-18 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM2 22.5a2.5 2.5 0 0 1 4.95-.5H24v1H6.95A2.5 2.5 0 0 1 2 22.5z">
        </path>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M22.4 8.94l-1.39.63-.41-.91 1.39-.63.41.91zm-4 1.8l-1.39.63-.41-.91 1.39-.63.41.91zm-4 1.8l-1.4.63-.4-.91 1.39-.63.41.91zm-4 1.8l-1.4.63-.4-.91 1.39-.63.41.91z">
        </path>
    </svg>
);

export const ForecastingShortIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none">
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M4.5 24a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM2 22.5a2.5 2.5 0 0 0 4.95.5H24v-1H6.95a2.5 2.5 0 0 0-4.95.5zM4.5 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM2 12.5a2.5 2.5 0 0 0 4.95.5h13.1a2.5 2.5 0 1 0 0-1H6.95a2.5 2.5 0 0 0-4.95.5zM22.5 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-18-6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM2 6.5a2.5 2.5 0 0 0 4.95.5H24V6H6.95A2.5 2.5 0 0 0 2 6.5z"> </path>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M22.4 20.06l-1.39-.63-.41.91 1.39.63.41-.91zm-4-1.8l-1.39-.63-.41.91 1.39.63.41-.91zm-4-1.8l-1.4-.63-.4.91 1.39.63.41-.91zm-4-1.8L9 14.03l-.4.91 1.39.63.41-.91z"> </path>
    </svg>
);

export const ForecastingForecastIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor">
            <path d="M19 11h5l-2.5 3z" />
            <circle cx="21.5" cy="16.5" r="1.5" />
            <path fillRule="nonzero" d="M22 11v-6h-1v6z" />
            <path d="M14 18h1v3h-1z" id="Path" />
            <path d="M14 5h1v6h-1z" />
            <path d="M7 19h1v3h-1z" />
            <path d="M7 6h1v7h-1z" />
            <path
                fillRule="nonzero"
                d="M7 13v6h1v-6h-1zm-1-1h3v8h-3v-8zM14 18h1v-7h-1v7zm-1-8h3v9h-3v-9z"
            />
        </g>
    </svg>
);


export const ForecastingBarPatternIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M6 6v6.5h1v-6.5zM7 22v-2.5h-1v2.5zM11 11v2.5h1v-2.5zM12 24v-7.5h-1v7.5zM16 5v5.5h1v-5.5zM17 21v-2.5h-1v2.5zM21 7v4.5h1v-4.5zM22 19v-2.5h-1v2.5z"></path>
            <path d="M6 13v6h1v-6h-1zm-1-1h3v8h-3v-8z"></path>
            <path d="M11 16h1v-2h-1v2zm-1-3h3v4h-3v-4z"></path>
            <path d="M16 18h1v-7h-1v7zm-1-8h3v9h-3v-9z"></path>
            <path d="M21 16h1v-4h-1v4zm-1-5h3v6h-3v-6z"></path>
        </g>
    </svg>
);

export const ForecastingGhostFeedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor">
            <path fillRule="nonzero" d="M4.529 18.21l3.157-1.292-.379-.926-3.157 1.292z"></path>
            <path fillRule="nonzero" d="M9.734 16.081l2.97-1.215-.379-.926-2.97 1.215z"></path>
            <path fillRule="nonzero" d="M14.725 14.039l2.957-1.21-.379-.926-2.957 1.21z"></path>
            <path fillRule="nonzero" d="M19.708 12.001l3.114-1.274-.379-.926-3.114 1.274z"></path>
            <path d="M8 18h1v3h-1z"></path>
            <path d="M8 9h1v5h-1z"></path>
            <path fillRule="nonzero" d="M8 18h1v-4h-1v4zm-1-5h3v6h-3v-6z"></path>
            <path d="M18 16h1v3h-1z"></path>
            <path d="M18 3h1v6h-1z"></path>
            <path fillRule="nonzero" d="M18 16h1v-7h-1v7zm-1-8h3v9h-3v-9z"></path>
            <path d="M13 6h1v5h-1z"></path>
            <path d="M13 15h1v5h-1z"></path>
            <path fillRule="nonzero" d="M13 15h1v-4h-1v4zm-1-5h3v6h-3v-6z"></path>
            <path fillRule="nonzero" d="M2.5 20c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM24.5 11c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const ForecastingSectorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <g fill="currentColor" fillRule="nonzero">
            <path d="M23.886 21.431c-.953-8.558-7.742-15.354-16.299-16.315l-.112.994c8.093.909 14.516 7.338 15.417 15.432l.994-.111z" />
            <path d="M5 7.5v14h1v-14zM21.5 23h-14v1h14z" />
            <path d="M5.5 7c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM23.5 25c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM5.5 25c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" />
        </g>
    </svg>
);

export const AnchoredVWAPIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none">
        <path fill="currentColor" d="M17 17h1v6h-1v-6zM17 2h1v5h-1V2z"></path>
        <path fill="currentColor" d="M16 17h3V8h-3v9zM15 7h5v11h-5V7zM10 5h1v5h-1V5zM10 22h1v3h-1v-3z"></path>
        <path fill="currentColor" d="M9 21h3V10H9v11zM8 9h5v13H8V9z"></path>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M25.27 9.42L14.1 16.53l-6.98-1.5L5.3 16.4l-.6-.8 2.18-1.64 7.02 1.5 10.83-6.88.54.84z"> </path>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M4 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 1a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"> </path>
    </svg>
);

export const AnchoredVolumeProfileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none">
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M5 21.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM3.5 24a2.5 2.5 0 0 0 .5-4.95V3H3v16.05A2.5 2.5 0 0 0 3.5 24zM25 5.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0zM23.5 3a2.5 2.5 0 0 1 .5 4.95V24h-1V7.95A2.5 2.5 0 0 1 23.5 3z"> </path>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M9 7H4v2h5V7zM3 6v4h7V6H3z"></path>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M12 10H4v2h8v-2zM3 9v4h10V9H3z"></path>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M7 13H4v2h3v-2zm-4-1v4h5v-4H3z"></path>
    </svg>
);
