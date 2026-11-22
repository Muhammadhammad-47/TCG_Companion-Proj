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
  showFire = false,
  showLightning = false,
  showPoison = false,
  showShield = false,
  showIce = false,
  showVoid = false,
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

  // Dedicated Elemental Matchers
  const isFireMode = showFire || config.isFire || theme === 'fire' || fighterStance === 'fire';
  const isLightningMode = showLightning || config.isLightning || theme === 'lightning' || fighterStance === 'lightning';
  const isPoisonMode = showPoison || config.isPoison || theme === 'poison' || fighterStance === 'poison';
  const isShieldMode = showShield || config.isShield || theme === 'shield';
  const isIceMode = showIce || config.isIce || theme === 'ice';
  const isVoidMode = showVoid || config.isVoid || theme === 'void' || fighterStance === 'shadow';

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
    isFireMode ? 'fx-has-flames' : '',
    isLightningMode ? 'fx-has-lightning' : '',
    isPoisonMode ? 'fx-has-poison' : '',
    isShieldMode ? 'fx-has-shield' : '',
    isIceMode ? 'fx-has-ice' : '',
    isVoidMode ? 'fx-has-void' : '',
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
      {/* Floor Summoning Sigil Stamp (Disabled: Removed circular busy VFX per design feedback) */}
      {showSigil && (
        null
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
      {(hasEmbers || isFireMode) && (
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

      {/* Layer 4: Dedicated Elemental Overlays */}
      {/* 4A. Fire Flame Licking Tongues & Heat Aura */}
      {isFireMode && (
        <FireFlamesOverlay />
      )}

      {/* 4B. High-Voltage Crackling Lightning Arcs */}
      {isLightningMode && (
        <LightningArcsOverlay />
      )}

      {/* 4C. Billowing Noxious Poison Smoke & Spores */}
      {isPoisonMode && (
        <PoisonSmokeOverlay />
      )}

      {/* 4D. Honeycomb Aegis Hexagonal Shield Barrier */}
      {isShieldMode && (
        <ShieldHexOverlay />
      )}

      {/* 4E. Sub-Zero Ice Frost Crystals & Crystalline Mist */}
      {isIceMode && (
        <IceFrostOverlay />
      )}

      {/* 4F. Abyssal Void & Shadow Tendrils */}
      {isVoidMode && (
        <VoidShadowOverlay />
      )}

      {/* Layer 5: Card Content & Art */}
      {children}

      {/* Layer 6: Holographic Foil Sheen Sweep */}
      <div className="fx-foil-sweep" />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Dedicated Elemental Overlay Subcomponents
// ----------------------------------------------------------------------------

function FireFlamesOverlay() {
  return (
    <div className="fx-fire-flames-overlay" aria-hidden="true">
      <div className="fx-fire-heat-aura" />
      <svg className="fx-fire-flames-svg" viewBox="0 0 100 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fireFlameGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ff0033" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#ff4d00" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#ffaa00" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffd000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fireFlameGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ff4d00" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#ffd700" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Outer licking flame tongue paths */}
        <path
          className="fx-flame-path-1"
          d="M 5,118 Q 14,92 20,100 Q 28,70 38,90 Q 50,56 62,86 Q 74,68 82,96 Q 90,82 95,118 Z"
        />
        {/* Inner intense flame tongue paths */}
        <path
          className="fx-flame-path-2"
          d="M 12,118 Q 22,98 28,105 Q 38,78 48,94 Q 58,70 68,96 Q 78,84 88,118 Z"
        />
      </svg>
    </div>
  );
}

function LightningArcsOverlay() {
  return (
    <div className="fx-lightning-arcs-overlay" aria-hidden="true">
      <svg className="fx-lightning-svg" viewBox="0 0 100 120" preserveAspectRatio="none">
        {/* Bolt 1: Top-left to middle-right */}
        <polyline
          className="fx-lightning-bolt-1"
          points="2,10 18,18 12,32 30,38 22,54 42,60 35,78 52,85"
        />
        {/* Bolt 2: Top-right to bottom-right */}
        <polyline
          className="fx-lightning-bolt-2"
          points="98,8 82,22 88,36 70,44 78,60 62,72 70,88 56,100"
        />
        {/* Bolt 3: Bottom edge crackle */}
        <polyline
          className="fx-lightning-bolt-1"
          points="10,115 28,110 38,118 55,108 72,116 90,112"
        />
      </svg>
      <span className="fx-lightning-spark" />
      <span className="fx-lightning-spark" />
      <span className="fx-lightning-spark" />
      <span className="fx-lightning-spark" />
    </div>
  );
}

function PoisonSmokeOverlay() {
  return (
    <div className="fx-poison-smoke-overlay" aria-hidden="true">
      <div className="fx-smoke-puff fx-smoke-puff-1" />
      <div className="fx-smoke-puff fx-smoke-puff-2" />
      <div className="fx-smoke-puff fx-smoke-puff-3" />
      <div className="fx-toxic-spore" />
      <div className="fx-toxic-spore" />
      <div className="fx-toxic-spore" />
      <div className="fx-toxic-spore" />
    </div>
  );
}

function ShieldHexOverlay() {
  return (
    <div className="fx-shield-overlay" aria-hidden="true">
      <div className="fx-deflection-line" />
      <svg className="fx-shield-svg" viewBox="0 0 100 120" preserveAspectRatio="none">
        {/* Honeycomb Aegis Hexagon Shapes */}
        <polygon className="fx-hex-polygon" points="50,15 65,24 65,42 50,51 35,42 35,24" />
        <polygon className="fx-hex-polygon" points="20,35 35,44 35,62 20,71 5,62 5,44" />
        <polygon className="fx-hex-polygon" points="80,35 95,44 95,62 80,71 65,62 65,44" />
        <polygon className="fx-hex-polygon" points="50,55 65,64 65,82 50,91 35,82 35,64" />
        <polygon className="fx-hex-polygon" points="20,75 35,84 35,102 20,111 5,102 5,84" />
        <polygon className="fx-hex-polygon" points="80,75 95,84 95,102 80,111 65,102 65,84" />
        {/* Aegis Corner Reinforcement Brackets */}
        <path className="fx-hex-bracket" d="M 6,18 L 6,6 L 18,6" />
        <path className="fx-hex-bracket" d="M 94,18 L 94,6 L 82,6" />
        <path className="fx-hex-bracket" d="M 6,102 L 6,114 L 18,114" />
        <path className="fx-hex-bracket" d="M 94,102 L 94,114 L 82,114" />
      </svg>
    </div>
  );
}

function IceFrostOverlay() {
  return (
    <div className="fx-ice-frost-overlay" aria-hidden="true">
      <div className="fx-frost-mist-puff fx-frost-mist-1" />
      <div className="fx-frost-mist-puff fx-frost-mist-2" />
      <svg className="fx-ice-svg" viewBox="0 0 100 120" preserveAspectRatio="none">
        {/* Top-Left Permafrost Crystal Cluster */}
        <polygon className="fx-ice-shard-1" points="0,0 20,4 12,18 4,24 0,16" />
        <polygon className="fx-ice-shard-2" points="4,4 16,12 8,26 2,18" />
        {/* Top-Right Permafrost Crystal Cluster */}
        <polygon className="fx-ice-shard-1" points="100,0 80,4 88,18 96,24 100,16" />
        <polygon className="fx-ice-shard-2" points="96,4 84,12 92,26 98,18" />
        {/* Bottom-Left Permafrost Crystal Cluster */}
        <polygon className="fx-ice-shard-1" points="0,120 18,116 10,102 3,96 0,104" />
        <polygon className="fx-ice-shard-2" points="3,116 14,108 7,94 1,102" />
        {/* Bottom-Right Permafrost Crystal Cluster */}
        <polygon className="fx-ice-shard-1" points="100,120 82,116 90,102 97,96 100,104" />
        <polygon className="fx-ice-shard-2" points="97,116 86,108 93,94 99,102" />
      </svg>
      <span className="fx-ice-sparkle" />
      <span className="fx-ice-sparkle" />
      <span className="fx-ice-sparkle" />
    </div>
  );
}

function VoidShadowOverlay() {
  return (
    <div className="fx-void-shadow-overlay" aria-hidden="true">
      <svg className="fx-void-svg" viewBox="0 0 100 120" preserveAspectRatio="none">
        {/* Tendril 1: Left perimeter wave */}
        <path
          className="fx-void-tendril-1"
          d="M 2,10 Q 14,28 6,48 Q 16,68 4,88 Q 14,105 2,118"
        />
        {/* Tendril 2: Right perimeter wave */}
        <path
          className="fx-void-tendril-2"
          d="M 98,8 Q 86,26 94,46 Q 84,66 96,86 Q 86,104 98,116"
        />
      </svg>
      <span className="fx-soul-wisp" />
      <span className="fx-soul-wisp" />
      <span className="fx-soul-wisp" />
    </div>
  );
}
