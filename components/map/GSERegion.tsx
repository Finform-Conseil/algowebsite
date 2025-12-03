// components/map/GSERegion.tsx
import React from 'react';

const GSERegion = ({ color, ...props }: { color: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      enableBackground="new 0 0 1000 1001"
      // ViewBox calculé pour le Ghana
      // x=180, y=300 (Point de départ pour centrer le pays avec une marge autour)
      // width=250, height=250 (Taille du cadre : suffisamment grand pour ne pas avoir un zoom trop agressif)
      viewBox="180 300 250 250"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))'
      }}
      {...props}
    >
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="5" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>
      <path id="GH" data-name="Ghana" d="m 296.4,364.9 -5.6,-1.1 -3.9,2.2 -5.4,-1 -21.1,0.6 -0.3,7.9 1.6,10.4 3.2,19.7 -5.1,11.6 -3.2,15.6 5.2,11.9 -0.5,5.5 10.9,3.9 11,-4 6.7,-4.7 19.2,-8.1 -2.8,-4.9 -3.2,-8.8 -1,-6.8 2.7,-12.5 -3,-5 -1.2,-10.9 0,-10.1 -5.1,-7.1 0.9,-4.3 z" fill={color} stroke="var(--border-color)" strokeWidth="2" />
    </svg>
  );
};

export default GSERegion;