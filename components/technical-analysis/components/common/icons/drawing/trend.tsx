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

export const DateRangeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <g fill="currentColor">
            <path fillRule="nonzero" d="M20 14h-14v1h14z" />
            <path d="M20 17v-5l3 2.5z" />
            <path fillRule="nonzero" d="M24 8.5v16.5h1v-16.5zM4 4v16.5h1v-16.5z" />
            <path fillRule="nonzero" d="M4.5 24c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM24.5 8c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" />
        </g>
    </svg>
);

export const PriceRangeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <g fill="currentColor">
            <path fillRule="nonzero" d="M4 5h16.5v-1h-16.5zM25 24h-16.5v1h16.5z" />
            <path fillRule="nonzero" d="M6.5 26c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM22.5 6c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" />
            <path fillRule="nonzero" d="M14 9v14h1v-14z" />
            <path d="M14.5 6l2.5 3h-5z" />
        </g>
    </svg>
);

export const DatePriceRangeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <g fill="currentColor">
            <path fillRule="nonzero" d="M6.5 23v1h17.5v-17.5h-1v16.5z" />
            <path fillRule="nonzero" d="M21.5 5v-1h-17.5v17.5h1v-16.5z" />
            <path fillRule="nonzero" d="M4.5 25c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5zM23.5 6c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm0 1c-1.381 0-2.5-1.119-2.5-2.5s1.119-2.5 2.5-2.5 2.5 1.119 2.5 2.5-1.119 2.5-2.5 2.5z" />
            <path fillRule="nonzero" d="M13 9v13h1v-13z" />
            <path d="M13.5 6l2.5 3h-5z" />
            <path fillRule="nonzero" d="M19 14h-13v1h13z" />
            <path d="M19 17v-5l3 2.5z" />
        </g>
    </svg>
);

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

export const BrushIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <g fill="currentColor" fillRule="nonzero">
            <path d="M23.007 2.993a4.3 4.3 0 00-6.086 0l-12.5 12.5a1 1 0 00-.263.464l-1.5 6.5a1 1 0 001.214 1.214l6.5-1.5a1 1 0 00.464-.263l12.5-12.5a4.304 4.304 0 000-6.086 1 1 0 00-.329-.329zM6.308 21.692l.724-3.138 2.414 2.414-3.138.724zm4.5-1.328l-3.172-3.172 9.5-9.5 3.172 3.172-9.5 9.5z" />
        </g>
    </svg>
);

export const HighlighterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <g fill="currentColor" fillRule="nonzero">
            <path d="M21.5 2.5a1 1 0 00-1.414 0l-2.5 2.5 3 3 2.5-2.5a1 1 0 000-1.414 1 1 0 00-.172-.13zM18.5 6.086l-14.793 14.793a1 1 0 00-.207.326l-1.25 3.75a1 1 0 001.292 1.292l3.75-1.25a1 1 0 00.326-.207L22.914 9.5l-3-3zM5.5 21.5l.75-2.25 1.5 1.5-2.25.75zm3.5-.914L6.414 18 16 8.414 18.586 11 9 20.586z" />
        </g>
    </svg>
);
