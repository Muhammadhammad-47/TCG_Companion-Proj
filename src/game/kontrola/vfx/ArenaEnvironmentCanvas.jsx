import React, { useEffect, useRef } from 'react';

/**
 * ArenaEnvironmentCanvas
 * Hardware-accelerated 2D canvas environmental particle system
 * Provides 5 dynamic scenarios: 'cyber' | 'volcano' | 'storm' | 'poison' | 'sudden_death'
 */
export default function ArenaEnvironmentCanvas({
  scenario = 'cyber', // 'cyber' | 'volcano' | 'storm' | 'poison' | 'sudden_death'
  isThunderFlashing = false,
  livingPlayerCount = 4
}) {
  const canvasRef = useRef(null);

  // Active scenario fallback: if only 2 players left, auto escalate to sudden_death
  const activeScenario = livingPlayerCount <= 2 ? 'sudden_death' : scenario;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool setup based on scenario
    const count = activeScenario === 'volcano' ? 45 : activeScenario === 'storm' ? 70 : 35;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: activeScenario === 'volcano' ? -(Math.random() * 1.5 + 0.8) : activeScenario === 'storm' ? Math.random() * 8 + 6 : (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.6 + 0.2,
      color:
        activeScenario === 'volcano'
          ? Math.random() > 0.4 ? '#ff5500' : '#ffcc00'
          : activeScenario === 'poison'
          ? '#39ff14'
          : activeScenario === 'sudden_death'
          ? '#ff0055'
          : '#00f0ff'
    }));

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Thunder flash background pulse
      if (isThunderFlashing || (activeScenario === 'storm' && Math.random() < 0.006)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(0, 0, width, height);
      }

      // Draw and update particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap particles
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
      });

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeScenario, isThunderFlashing]);

  return (
    <div className={`arena-scenario-layer scenario-${activeScenario}`}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}
