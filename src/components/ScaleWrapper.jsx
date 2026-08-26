import React, { useRef, useEffect, useState } from 'react';

export const ScaleWrapper = ({ children, targetWidth = 1920, targetHeight = 1080 }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Calculate how much we need to scale down/up to fit the design resolution into the current physical pixel space
      const scaleX = width / targetWidth;
      const scaleY = height / targetHeight;
      
      // Use the smaller scale to ensure it fits completely without overflowing
      setScale(Math.min(scaleX, scaleY));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [targetWidth, targetHeight]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {children}
      </div>
    </div>
  );
};
