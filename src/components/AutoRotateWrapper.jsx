import React, { useRef, useEffect, useState } from 'react';

export const AutoRotateWrapper = ({ children, forcePortrait = false, forceLandscape = false }) => {
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [activeWidth, setActiveWidth] = useState('100%');
  const [activeHeight, setActiveHeight] = useState('100%');

  useEffect(() => {
    const updateRotation = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      const isScreenPortrait = height > width;
      let shouldRotate = false;
      let angle = 0;

      if (width <= 900 || height <= 900) {
        if (forceLandscape && isScreenPortrait) {
          shouldRotate = true;
          angle = 90;
        }
        if (forcePortrait && !isScreenPortrait) {
          shouldRotate = true;
          angle = -90;
        }
      }

      setRotation(angle);

      if (shouldRotate) {
        // When rotated 90 degrees, the physical width becomes the virtual height, etc.
        setActiveWidth(`${height}px`);
        setActiveHeight(`${width}px`);
      } else {
        setActiveWidth('100%');
        setActiveHeight('100%');
      }
    };

    updateRotation();
    window.addEventListener('resize', updateRotation);
    return () => window.removeEventListener('resize', updateRotation);
  }, [forcePortrait, forceLandscape]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'absolute', inset: 0 }}>
      <div style={{
        width: activeWidth,
        height: activeHeight,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        flexShrink: 0
      }}>
        {children}
      </div>
    </div>
  );
};
