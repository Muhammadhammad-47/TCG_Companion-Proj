import React, { useRef, useEffect, useState } from 'react';

export const DynamicScaleWrapper = ({ children, defaultWidth = 1080, defaultHeight = 1920 }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [virtualDimensions, setVirtualDimensions] = useState({ w: defaultWidth, h: defaultHeight });

  useEffect(() => {
    let lastValidScale = 1;
    let lastValidDims = { w: defaultWidth, h: defaultHeight };

    const updateScale = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();

      // Guard: if the browser is minimized or hidden, dimensions collapse to 0.
      // Keep the last valid scale so the screen doesn't go black.
      if (width === 0 || height === 0) return;

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

      lastValidScale = minScale;
      lastValidDims = { w: newVirtualWidth, h: newVirtualHeight };

      setVirtualDimensions(lastValidDims);
      setScale(lastValidScale);
    };

    updateScale();

    // visibilitychange fires when the tab/window is restored — resize may not always fire
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Small delay lets the browser finish restoring dimensions
        setTimeout(updateScale, 100);
      }
    };

    window.addEventListener('resize', updateScale);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('resize', updateScale);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
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
