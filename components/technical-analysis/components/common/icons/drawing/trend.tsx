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

export const PathIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M4 20 L10 8 L18 14 L24 6" />
        <circle cx="4" cy="20" r="1.8" fill="currentColor" />
        <circle cx="10" cy="8" r="1.8" fill="currentColor" />
        <circle cx="18" cy="14" r="1.8" fill="currentColor" />
        <circle cx="24" cy="6" r="1.8" fill="currentColor" />
    </svg>
);

export const CircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <path fill="none" stroke="currentColor" d="M16 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
        <path fill="currentColor" fillRule="evenodd" d="M4.5 14a9.5 9.5 0 0 1 18.7-2.37 2.5 2.5 0 0 0 0 4.74A9.5 9.5 0 0 1 4.5 14Zm19.7 2.5a10.5 10.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5ZM22.5 14a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
    </svg>
);

export const EllipseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <ellipse cx="14" cy="14" rx="9" ry="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="5" cy="14" r="1.5" fill="currentColor" />
        <circle cx="23" cy="14" r="1.5" fill="currentColor" />
        <circle cx="14" cy="8.5" r="1.5" fill="currentColor" />
        <circle cx="14" cy="19.5" r="1.5" fill="currentColor" />
    </svg>
);

export const TriangleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <polygon points="5,23 23,23 5,5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="5" cy="23" r="1.5" fill="currentColor" />
        <circle cx="23" cy="23" r="1.5" fill="currentColor" />
        <circle cx="5" cy="5" r="1.5" fill="currentColor" />
    </svg>
);

export const ArcIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <path d="M4,22 A14,14 0 0,1 24,22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="4" cy="22" r="1.5" fill="currentColor" />
        <circle cx="24" cy="22" r="1.5" fill="currentColor" />
        <circle cx="14" cy="6" r="1.5" fill="currentColor" />
    </svg>
);

export const CurveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <path d="M4,22 Q14,4 24,22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="4" cy="22" r="1.5" fill="currentColor" />
        <circle cx="14" cy="4" r="1.5" fill="currentColor" />
        <circle cx="24" cy="22" r="1.5" fill="currentColor" />
    </svg>
);

export const DoubleCurveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <path d="M4,22 C4,4 24,4 24,22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="4" cy="22" r="1.5" fill="currentColor" />
        <circle cx="4" cy="6" r="1.5" fill="currentColor" />
        <circle cx="14" cy="12" r="1.5" fill="currentColor" />
        <circle cx="24" cy="6" r="1.5" fill="currentColor" />
        <circle cx="24" cy="22" r="1.5" fill="currentColor" />
    </svg>
);

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

export const TextNoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <path fill="currentColor" d="M8 6.5c0-.28.22-.5.5-.5H14v16h-2v1h5v-1h-2V6h5.5c.28 0 .5.22.5.5V9h1V6.5c0-.83-.67-1.5-1.5-1.5h-12C7.67 5 7 5.67 7 6.5V9h1V6.5Z" />
    </svg>
);

export const NoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <rect x="5" y="4.5" width="13" height="13" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 8h5M11.5 8v7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11.5 17.5v4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="11.5" cy="22.5" r="1.1" fill="currentColor" />
    </svg>
);

export const PriceNoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <rect x="5" y="3" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <text x="14" y="14" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="sans-serif">$</text>
        <path d="M14 17v2.5a2.5 2.5 0 0 0 1 0V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14" cy="22" r="2.5" fill="currentColor" stroke="white" strokeWidth="1" />
    </svg>
);

export const PinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <path d="M14 3c-3.3 0-6 2.7-6 6 0 4.5 6 11 6 11s6-6.5 6-11c0-3.3-2.7-6-6-6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="9" r="2.5" fill="currentColor" />
    </svg>
);

export const TableIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <rect x="4" y="6" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 12h20M4 17h20M12 6v16M19 6v16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

export const CalloutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <path fill="currentColor" fillRule="nonzero" d="M6 21.586l3.586-3.586h13.407c.004 0 .007-11.993.007-11.993 0-.007-17-.007-17-.007v15.586zm-1 2.414v-18.005c0-.549.451-.995.995-.995h17.01c.549 0 .995.45.995 1.007v11.986c0 .556-.45 1.007-1.007 1.007h-12.993l-5 5z" />
    </svg>
);

export const CommentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" fill="none" style={{ display: "block", flexShrink: 0 }}>
        <path fill="currentColor" fillRule="nonzero" d="M12 8C8.68629 8 6 10.6863 6 14V20H18C21.3137 20 24 17.3137 24 14C24 10.6863 21.3137 8 18 8H12ZM5 14C5 10.134 8.13401 7 12 7H18C21.866 7 25 10.134 25 14C25 17.866 21.866 21 18 21H6C5.44772 21 5 20.5523 5 20V14Z" />
    </svg>
);

export const PriceLabelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <rect x="9" y="8" width="15" height="12" rx="2" />
            <path d="M9 14 L5.5 14" />
            <circle cx="4" cy="14" r="2" fill="currentColor" stroke="none" />
        </g>
        <text x="16.5" y="17" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="bold" fontFamily="sans-serif">$</text>
    </svg>
);

export const SignpostIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <line x1="14" y1="9" x2="14" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 3.4 l1.3 2.5 l2.7 .3 l-2 1.9 l.5 2.7 l-2.5 -1.3 l-2.5 1.3 l.5 -2.7 l-2 -1.9 l2.7 -.3 z" fill="currentColor" />
    </svg>
);

export const FlagMarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <path d="M6 25V5h12l-2 5l2 5H6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M6 5h14l-3 5l3 5H6" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
);

export const ImageNoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <rect x="4" y="6" width="20" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="11" r="2" fill="currentColor" />
        <path d="M4 18l5-4l3 3l4-3l8 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
);

export const PostIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <path d="M4 8h20v14H8l-4-4V8z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 12h12M8 16h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

export const IdeaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <path d="M14 4c-3.3 0-6 2.5-6 5.5 0 2.2 1.2 4 3 5.2V18h6v-3.3c1.8-1.2 3-3 3-5.2C20 6.5 17.3 4 14 4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 21h4M13 24h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

export const HighlighterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="16" height="16" style={{ display: "block", flexShrink: 0 }}>
        <g fill="currentColor" fillRule="nonzero">
            <path d="M21.5 2.5a1 1 0 00-1.414 0l-2.5 2.5 3 3 2.5-2.5a1 1 0 000-1.414 1 1 0 00-.172-.13zM18.5 6.086l-14.793 14.793a1 1 0 00-.207.326l-1.25 3.75a1 1 0 001.292 1.292l3.75-1.25a1 1 0 00.326-.207L22.914 9.5l-3-3zM5.5 21.5l.75-2.25 1.5 1.5-2.25.75zm3.5-.914L6.414 18 16 8.414 18.586 11 9 20.586z" />
        </g>
    </svg>
);
