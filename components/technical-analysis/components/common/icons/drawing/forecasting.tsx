import React from "react";

/**
 * Drawing forecasting icons used by the Technical Analysis drawing toolbar.
 */
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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <path fill="currentColor" fillRule="evenodd" d="M24 3h-1v4h-6v3h-5v3H8.95a2.5 2.5 0 1 0 0 1H15v3h5v3h3v4h1V3Zm-6 7h5V8h-5v2Zm-1 1h-4v2h10v-2h-6Zm4 5h-5v-2h7v2h-2Zm0 3v-2h2v2h-2ZM6.5 15a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
    </svg>
);

export const FixedRangeVolumeProfileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none">
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M4 5.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zM5.5 3A2.5 2.5 0 0 0 3 5.5V24h1V5.5A1.5 1.5 0 0 1 5.5 4h3v6.5h-1V4H5.5z"></path>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M23 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM21.5 3A2.5 2.5 0 0 1 24 5.5V24h-1V5.5A1.5 1.5 0 0 0 21.5 4h-3v6.5h1V4h1.5z"></path>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M9 10H4v2h5v-2zM3 9v4h7V9H3z"></path>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M12 13H4v2h8v-2zM3 12v4h10v-4H3z"></path>
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M7 16H4v2h3v-2zm-4-1v4h5v-4H3z"></path>
    </svg>
);
