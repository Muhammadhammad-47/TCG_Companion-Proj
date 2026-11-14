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

    let width = 800;
    let height = 600;

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = canvas.width = Math.round(rect.width) || window.innerWidth || 800;
      height = canvas.height = Math.round(rect.height) || window.innerHeight || 600;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Particle pool setup based on scenario
    const count = activeScenario === 'volcano' ? 55 : activeScenario === 'storm' ? 75 : activeScenario === 'poison' ? 45 : activeScenario === 'ice' ? 60 : 35;
    const particles = Array.from({ length: count }, () => {
      const isPoison = activeScenario === 'poison';
      const isVolcano = activeScenario === 'volcano';
      const isStorm = activeScenario === 'storm';
      const isIce = activeScenario === 'ice';

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: isPoison ? (Math.random() * 18 + 8) : isVolcano ? (Math.random() * 4 + 1.5) : isIce ? (Math.random() * 4 + 1.8) : (Math.random() * 3 + 1),
        speedX: isPoison ? (Math.random() - 0.5) * 0.4 : isIce ? (Math.random() - 0.5) * 0.8 : (Math.random() - 0.5) * 1.0,
        speedY: isVolcano ? -(Math.random() * 2.2 + 0.9) : isStorm ? (Math.random() * 9 + 7) : isPoison ? -(Math.random() * 0.8 + 0.3) : isIce ? (Math.random() * 1.8 + 0.7) : (Math.random() - 0.5) * 0.6,
        alpha: isPoison ? (Math.random() * 0.25 + 0.15) : isIce ? (Math.random() * 0.7 + 0.3) : (Math.random() * 0.7 + 0.3),
        swayOffset: Math.random() * Math.PI * 2,
        color:
          isVolcano
            ? (Math.random() > 0.4 ? '#ff4d00' : Math.random() > 0.5 ? '#ffaa00' : '#ff0033')
            : isPoison
            ? (Math.random() > 0.3 ? '#39ff14' : '#00e676')
            : isIce
            ? (Math.random() > 0.4 ? '#a5f3fc' : Math.random() > 0.3 ? '#ffffff' : '#38bdf8')
            : activeScenario === 'sudden_death'
            ? '#ff0055'
            : '#00f0ff'
      };
    });

    let lightningBolt = null;
    let lightningTimer = 0;

    const generateLightning = () => {
      const startX = Math.random() * width;
      let currX = startX;
      let currY = 0;
      const segments = [];
      while (currY < height) {
        const nextX = currX + (Math.random() - 0.5) * 60;
        const nextY = currY + Math.random() * 40 + 20;
        segments.push({ x1: currX, y1: currY, x2: nextX, y2: nextY });
        currX = nextX;
        currY = nextY;
      }
      return segments;
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Trigger lightning in storm scenario
      lightningTimer++;
      if ((isThunderFlashing || (activeScenario === 'storm' && Math.random() < 0.008)) && !lightningBolt) {
        lightningBolt = { segments: generateLightning(), life: 6 };
      }

      // Draw lightning bolt
      if (lightningBolt) {
        // Flash sky
        ctx.fillStyle = `rgba(255, 255, 255, ${lightningBolt.life > 3 ? '0.35' : '0.15'})`;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        lightningBolt.segments.forEach(seg => {
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
        });
        ctx.stroke();

        ctx.strokeStyle = '#ffe600';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 10;
        ctx.stroke();

        lightningBolt.life--;
        if (lightningBolt.life <= 0) lightningBolt = null;
      }

      // Draw and update particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = activeScenario === 'poison' ? 14 : 8;
        ctx.fill();

        if (activeScenario === 'poison') {
          p.x += p.speedX + Math.sin(p.y * 0.02 + p.swayOffset) * 0.4;
        } else {
          p.x += p.speedX;
        }
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

