import React, { useState, useRef, useCallback } from 'react';
import { getCardVFXConfig } from './cardVFXRegistry';

/**
 * CardVFXWrapper
 * Wraps any card image or container with authentic Unity Asset 355942 CSS/SVG effects,
 * 3D gyroscope/mouse parallax tilt, summoning floor runes, and combat clash beam struggles.
 */
export default function CardVFXWrapper({
  cardName = '',
  themeOverride = null,
  isSelected = false,
  isOvercharged = false,
  isDissolving = false,
  isFlashing = false,
  hasFlare = false,
  hasEdgeFlow = false,
  showSunlight = false,
  showShock = false,
  showEmbers = false,
  showStars = false,
  showSigil = false,
  isClashing = false,
  enable3DTilt = false,
  fighterStance = null, // 'fire' | 'lightning' | 'poison' | 'shadow' | 'earth' | 'nature' | 'divine'
  isSurging = false,
  isHit = false,
  className = '',
  style = {},
  onClick,
  children
}) {
  const config = getCardVFXConfig(cardName);
  const theme = themeOverride || config.theme || 'blue';

  const [tiltStyle, setTiltStyle] = useState({});
  const cardRef = useRef(null);

  const hasRim = config.rim !== false;
  const hasSunlight = showSunlight || config.sunlight;
  const hasShock = showShock || config.shock;
  const hasEmbers = showEmbers || config.embers;
  const hasStars = showStars || config.stars;

  // 3D Mouse Parallax Tilt Handler
  const handleMouseMove = useCallback((e) => {
    if (!enable3DTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12; // max ±12deg
    const rotateY = ((x - centerX) / centerX) * 12;

    setTiltStyle({
      transform: `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.04, 1.04, 1.04)`
    });
  }, [enable3DTilt]);

  const handleMouseLeave = useCallback(() => {
    if (!enable3DTilt) return;
    setTiltStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    });
  }, [enable3DTilt]);

  // Resolve fighter stance class if provided
  let stanceClass = '';
  if (fighterStance === 'fire') stanceClass = 'fighter-stance-fire';
  else if (fighterStance === 'lightning') stanceClass = 'fighter-stance-lightning';
  else if (fighterStance === 'poison') stanceClass = 'fighter-stance-poison';
  else if (fighterStance === 'shadow') stanceClass = 'fighter-stance-shadow';

  const containerClasses = [
    'card-fx-container',
    `fx-theme-${theme}`,
    hasRim ? 'fx-rim-line' : '',
    hasSunlight ? 'fx-sunlight' : '',
    hasShock ? 'fx-shock' : '',
    hasEdgeFlow ? 'fx-edge-flow' : '',
    isFlashing ? 'fx-flash-burst' : '',
    isOvercharged ? 'fx-overcharge' : '',
    isSelected ? 'selected active' : '',
    isDissolving ? 'fx-dissolve-active' : '',
    isClashing ? 'clash-beam-struggle' : '',
    enable3DTilt ? 'card-3d-tilt' : '',
    stanceClass,
    isSurging ? 'fighter-attack-surge' : '',
    isHit ? 'fighter-hit-recoil' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cardRef}
      className={containerClasses}
      style={{ ...style, ...tiltStyle }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floor Summoning Sigil Stamp */}
      {showSigil && (
        <span className="summoning-sigil-stamp" />
      )}

      {/* Layer 1: Corner Star Flares (All 4 Corners) */}
      {hasStars && (
        <>
          <span className="fx-star-flare fx-star-top-left" />
          <span className="fx-star-flare fx-star-top-right" />
          <span className="fx-star-flare fx-star-bottom-left" />
          <span className="fx-star-flare fx-star-bottom-right" />
        </>
      )}

      {/* Layer 2: Floating Ember Particles */}
      {hasEmbers && (
        <div className="fx-embers-container">
          <span className="fx-ember" />
          <span className="fx-ember" />
          <span className="fx-ember" />
          <span className="fx-ember" />
        </div>
      )}

      {/* Layer 3: Central Lens Flare for Rare/Super Moves */}
      {(hasFlare || (config.stars && config.sunlight)) && (
        <span className="fx-flare-glow" />
      )}

      {/* Layer 4: Card Content & Art */}
      {children}

      {/* Layer 5: Holographic Foil Sheen Sweep */}
      <div className="fx-foil-sweep" />
    </div>
  );
}
