'use client';

import { useState, useEffect } from 'react';

const backgroundImages = [
  '/images/screener-header-3.jpg',
  '/images/exchanges-header-2.jpg',
  '/images/exchanges-header-1.jpg',
];

export default function MacroHomePage() {
    const [currentBgIndex, setCurrentBgIndex] = useState(0);

    // Background image carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="macro-home-page">
            <div className="macro-header-wrapper">
                <div 
                    className="macro-header"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentBgIndex]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        transition: 'background-image 1s ease-in-out',
                    }}
                >
                    <div className="header-content">
                        <h1>African Macroeconomic Indicators</h1>
                        <p>Track key economic metrics and trends across African markets</p>
                    </div>
                </div>
            </div>
            
            <div className="macro-content">
                {/* Content will be added here */}
            </div>
        </div>
    )
}