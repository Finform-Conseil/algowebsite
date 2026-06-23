'use client';

import { useState, useEffect } from 'react';

export default function MacroCalendarPage() {
    return (
        <div className="macro-home-page">
            <div className="macro-header-wrapper">
                <div 
                    className="macro-header"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        transition: 'background-image 1s ease-in-out',
                    }}
                >
                    <div className="header-content">
                        <h1>Macro Analysis</h1>
                        <p></p>
                    </div>
                </div>
            </div>
            
            <div className="macro-content">
                {/* Content will be added here */}
            </div>
        </div>
    )
}