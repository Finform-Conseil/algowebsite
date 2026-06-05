import React from "react";

/**
 * Drawing trend and measurement icons used by the Technical Analysis drawing toolbar.
 */
export const LineIcon = () => <i className="bi bi-slash-lg" />;

export const HorizontalLineIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <g fill="currentColor" fillRule="nonzero">
            <path d="M4 15h8.5v-1h-8.5zM16.5 15h8.5v-1h-8.5z"></path>
            <path d="M14.5 16c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
        </g>
    </svg>
);

export const VerticalLineIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <g fill="currentColor" fillRule="nonzero">
            <path d="M13.5 4v8.5h1v-8.5zM13.5 16.5v8.5h1v-8.5z"></path>
            <path d="M14 16c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z"></path>
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
