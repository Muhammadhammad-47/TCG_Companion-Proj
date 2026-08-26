import React, { useRef, useEffect, useState } from 'react';

export const DynamicScaleWrapper = ({ children, defaultWidth = 1080, defaultHeight = 1920 }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [virtualDimensions, setVirtualDimensions] = useState({ w: defaultWidth, h: defaultHeight });

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      const isLandscape = width > height;
      const targetWidth = isLandscape ? defaultHeight : defaultWidth;
      const targetHeight = isLandscape ? defaultWidth : defaultHeight;
      
      const scaleX = width / targetWidth;
      const scaleY = height / targetHeight;
      
      // Use the smallest scale to ensure the core 1080x1920 area ALWAYS fits on screen.
      const minScale = Math.min(scaleX, scaleY);
      
      // Expand the virtual canvas on whichever axis has letterboxing so it fills the screen perfectly.
      const newVirtualWidth = width / minScale;
      const newVirtualHeight = height / minScale;
      
      setVirtualDimensions({ w: newVirtualWidth, h: newVirtualHeight });
      setScale(minScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [defaultWidth, defaultHeight]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{
        width: `${virtualDimensions.w}px`,
        height: `${virtualDimensions.h}px`,
        transform: `scale(${scale})`,
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
