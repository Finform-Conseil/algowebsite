// components/map/NGXRegion.tsx
import React from 'react';

const NGXRegion = ({ color, ...props }: { color: string }) => {
  return (
    <svg
    xmlns="http://www.w3.org/2000/svg"
      enableBackground="new 0 0 1000 1001"
      // ViewBox calculé pour le Nigéria
      // x=300, y=260 (Point de départ au nord-ouest pour englober large)
      // width=350, height=300 (Cadre assez grand pour éviter l'effet "gros plan" excessif)
      viewBox="300 260 350 300"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))'
      }}
      {...props}
    // xmlns="http://www.w3.org/2000/svg"
    //   enableBackground="new 0 0 1000 1001"
    //   style={{
    //     width: '100%',
    //     height: 'auto',
    //     filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.15))'
    //   }}
    //   viewBox="0 0 1000 1001"
    //   {...props}
    >
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="5" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>
      <path id="NG" data-name="Nigeria" d="m 468.2,344.6 -2.2,0.3 -8.4,-15.1 -2.9,-0.6 -9.4,7.7 -9.4,-4 -6.5,-0.8 -3.5,1.9 -7.1,-0.4 -7.1,5.9 -6.2,0.3 -14.7,-7.1 -5.8,3.4 -6.1,-0.2 -4.6,-5.3 -12.2,-5.1 -13,1.6 -3.2,3 -1.6,8 -3.5,5.5 -0.8,12.4 -0.5,4.6 2.8,8.2 -2.4,5.6 1.3,3.7 -5.9,8.5 -3.7,4.3 -2.3,8.7 0.3,8.8 -0.6,22.3 10.7,0 9.2,-0.1 8.6,9.1 4.1,10 6.5,8.6 9.8,0.3 4.7,-3.1 4.6,0.8 12.7,-5 3.1,-9.8 5.7,-13.4 3.6,-0.1 7.2,-8.1 4.6,-0.2 6.9,5.7 8.3,-4.7 1.1,-5.7 2.7,-5.6 1.9,-7 6.4,-5.7 2.4,-9.7 2.6,-3.1 1.6,-7.2 3.1,-8.8 10.2,-10.7 0.5,-4.6 1.3,-2.5 -4.9,-5.5 z" fill={color} stroke="var(--border-color)" strokeWidth="2" />
    </svg>
  );
};

export default NGXRegion;