// components/map/CSERegion.tsx
import React from 'react';

const CSERegion = ({ color, ...props }: { color: string }) => {
  return (
    <svg
    xmlns="http://www.w3.org/2000/svg"
      enableBackground="new 0 0 1000 1001"
      // ViewBox calculé pour le Maroc (Nord-Ouest Afrique)
      // x=40, y=0 (On part du coin haut gauche avec une marge pour l'océan)
      // width=380, height=320 (Cadre suffisamment large pour ne pas trop zoomer)
      viewBox="40 0 380 320"
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
      <path id="MA" data-name="Morocco" d="m 271.2,30.7 -5,-0.1 -11.9,-3.1 -11,0.9 -6.8,-5.9 -8.5,-0.1 -3.8,8.6 -8,14.5 -8.7,5.7 -11.8,6.4 -7.7,9.3 -1.8,7.3 -4.8,11.8 2.5,17.2 -10.1,11.5 -6,3.7 -9.6,9.4 -11,1.6 -6.1,5.3 -0.2,0.2 -7.9,14.1 -8.1,5.1 -4.5,8.5 -0.5,7.4 -3.4,8.1 -4,2.2 -6.9,8.8 -4.4,9.8 0.7,4.6 -4.1,7.3 -4.7,3.7 -0.8,6.4 0.2,0.1 27,-1.1 1.6,-5 5,-6.2 4.4,-19.1 16.9,-15 6,-17.4 3.7,-1.1 4.2,-10.8 10,-1.4 4.2,1.8 5.4,0 3.9,-3.2 7.3,-0.4 -0.1,-7.5 0,0 1.8,0 0.2,-16.3 19.2,-10.2 11.8,-2.1 9.6,-3.7 4.6,-7 13.8,-5.4 0.6,-10.2 6.7,-1.2 5.4,-5.1 15.2,-2.3 2.2,-5.4 -3.1,-2.9 -3.9,-14.7 -0.7,-8.4 -4.2,-9 z" fill={color} stroke="var(--border-color)" strokeWidth="2" />
    </svg>
  );
};

export default CSERegion;