import React from "react";

/**
 * Drawing Fibonacci and Gann icons used by the Technical Analysis drawing toolbar.
 */
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
