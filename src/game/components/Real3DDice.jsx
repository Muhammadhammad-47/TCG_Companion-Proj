import React, { useEffect, useState } from 'react';

// Standard 3D Rotation angles for each dice face (1 through 6)
const FACE_ROTATIONS = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 }
};

// Render authentic dice pips (1 to 6)
function DiceFace({ value, theme }) {
  const pips = [];
  for (let i = 0; i < value; i++) {
    pips.push(i);
  }

  const isRed = theme === 'red';

  return (
    <div
      className={`dice-cube-face face-${value} ${isRed ? 'face-red' : 'face-gold'}`}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '10px',
        background: isRed
          ? 'linear-gradient(135deg, #ff1a4a 0%, #b3002d 50%, #66001a 100%)'
          : 'linear-gradient(135deg, #ffe066 0%, #d4a017 50%, #8c6200 100%)',
        border: isRed ? '1.5px solid #ff668a' : '1.5px solid #fff2a3',
        boxShadow: isRed
          ? 'inset 0 0 8px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.5)'
          : 'inset 0 0 8px rgba(255,255,255,0.6), inset 0 -3px 6px rgba(0,0,0,0.4)',
        display: 'grid',
        padding: '6px',
        boxSizing: 'border-box'
      }}
    >
      <div className={`pip-layout pips-${value}`}>
        {pips.map(idx => (
          <span
            key={idx}
            className="dice-pip"
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: isRed ? '#ffffff' : '#1a1000',
              boxShadow: isRed
                ? '0 1px 2px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.8)'
                : '0 1px 2px rgba(255,255,255,0.4), inset 0 1px 1px rgba(0,0,0,0.8)',
              display: 'inline-block'
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Real3DDice({ value = 1, isRolling = false, theme = 'red', size = 56 }) {
  const half = size / 2;
  const [spinOffset, setSpinOffset] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (isRolling) {
      // Random tumbling spin turns
      const extraX = (Math.floor(Math.random() * 4) + 3) * 360;
      const extraY = (Math.floor(Math.random() * 4) + 3) * 360;
      const extraZ = Math.floor(Math.random() * 180) - 90;
      setSpinOffset({ x: extraX, y: extraY, z: extraZ });
    }
  }, [isRolling]);

  const targetRotation = FACE_ROTATIONS[value] || FACE_ROTATIONS[1];
  const finalX = targetRotation.x + (isRolling ? spinOffset.x : 0);
  const finalY = targetRotation.y + (isRolling ? spinOffset.y : 0);
  const finalZ = isRolling ? spinOffset.z : 0;

  return (
    <div
      className="real-3d-dice-scene"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        perspective: '600px',
        display: 'inline-block',
        margin: '6px'
      }}
    >
      <div
        className={`dice-cube-object ${isRolling ? 'dice-tumble-active' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${finalX}deg) rotateY(${finalY}deg) rotateZ(${finalZ}deg)`,
          transition: isRolling
            ? 'transform 0.9s cubic-bezier(0.25, 1, 0.5, 1)'
            : 'transform 0.4s ease-out'
        }}
      >
        {/* Face 1: Front */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', transform: `rotateY(0deg) translateZ(${half}px)` }}>
          <DiceFace value={1} theme={theme} />
        </div>
        {/* Face 6: Back */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', transform: `rotateY(180deg) translateZ(${half}px)` }}>
          <DiceFace value={6} theme={theme} />
        </div>
        {/* Face 2: Right */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', transform: `rotateY(90deg) translateZ(${half}px)` }}>
          <DiceFace value={2} theme={theme} />
        </div>
        {/* Face 5: Left */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', transform: `rotateY(-90deg) translateZ(${half}px)` }}>
          <DiceFace value={5} theme={theme} />
        </div>
        {/* Face 3: Top */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', transform: `rotateX(90deg) translateZ(${half}px)` }}>
          <DiceFace value={3} theme={theme} />
        </div>
        {/* Face 4: Bottom */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', transform: `rotateX(-90deg) translateZ(${half}px)` }}>
          <DiceFace value={4} theme={theme} />
        </div>
      </div>
    </div>
  );
}
