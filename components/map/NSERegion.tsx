// components/map/NSERegion.tsx
import React from 'react';

const NSERegion = ({ color, ...props }: { color: string }) => {
  return (
    <svg
    // xmlns="http://www.w3.org/2000/svg"
    //   enableBackground="new 0 0 1000 1001"
    //   style={{
    //     width: '100%',
    //     height: 'auto',
    //     filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))'
    //   }}
    //   viewBox="0 0 1000 1001"
    //   {...props}

    xmlns="http://www.w3.org/2000/svg"
      enableBackground="new 0 0 1000 1001"
      // ViewBox calculé pour le Kenya (Afrique de l'Est)
      // x=640, y=400 (On commence à gauche du Lac Victoria et au-dessus de la frontière nord)
      // width=320, height=280 (Cadre large pour ne pas étouffer la forme du pays)
      viewBox="640 400 320 280"
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
      <path id="KE" data-name="Kenya" d="m 807.2,463.1 -8.4,0 -4.9,-4.7 -11.1,5.8 -3.5,5.8 -8.2,-1.1 -2.7,-1.6 -2.9,0.4 -3.8,-0.2 -15.7,-11.7 -8.5,0 -4.2,-4.6 -0.1,-7.7 -6.4,-2.4 -8.1,9.1 -7.4,8.3 5.9,9.6 1.5,7 5.5,15.8 -4.4,10.1 -5.9,9.2 -3.5,5.6 0,0.7 2.9,5.2 -0.8,10.3 44.1,28.2 0.7,8 17.3,13.8 5,-4.6 2.5,-9.2 4,-5.5 1.9,-9.8 4.6,-1 3.1,-5.8 8.6,-5.5 -7.2,-11.4 -0.4,-50.4 10.5,-15.7 z" fill={color} stroke="var(--border-color)" strokeWidth="2" />
    </svg>
  );
};

export default NSERegion;